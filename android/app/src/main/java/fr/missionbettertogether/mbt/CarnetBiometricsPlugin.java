package fr.missionbettertogether.mbt;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.annotation.RequiresApi;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "CarnetBiometrics")
public class CarnetBiometricsPlugin extends Plugin {
    private static final String ALIAS = "mbt.carnet.biometric.v1";
    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String TRANSFORM = "AES/GCM/NoPadding";
    private CancellationSignal pending;

    private SharedPreferences envelope() {
        return getContext().getSharedPreferences(ALIAS, Context.MODE_PRIVATE);
    }

    private KeyStore keyStore() throws Exception {
        KeyStore store = KeyStore.getInstance(KEYSTORE);
        store.load(null);
        return store;
    }

    private boolean available() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return false;
        BiometricManager manager = getContext().getSystemService(BiometricManager.class);
        return manager != null && manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            == BiometricManager.BIOMETRIC_SUCCESS;
    }

    @PluginMethod
    public void availability(PluginCall call) {
        call.resolve(new JSObject().put("available", available()));
    }

    @PluginMethod
    public void store(PluginCall call) {
        getActivity().runOnUiThread(() -> start(call, true));
    }

    @PluginMethod
    public void read(PluginCall call) {
        getActivity().runOnUiThread(() -> start(call, false));
    }

    @PluginMethod
    public void clear(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (pending != null) pending.cancel();
            pending = null;
            try {
                keyStore().deleteEntry(ALIAS);
                if (!envelope().edit().clear().commit()) throw new IllegalStateException();
                call.resolve();
            } catch (Exception error) {
                call.reject("Impossible de supprimer la clé biométrique.");
            }
        });
    }

    private void start(PluginCall call, boolean enrolling) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || !available()) {
            call.reject("Biométrie indisponible.");
            return;
        }
        if (pending != null) {
            call.reject("Authentification déjà en cours.");
            return;
        }
        String vaultId = call.getString("vaultId");
        String encoded = call.getString("key", "");
        if (vaultId == null || vaultId.isEmpty() || vaultId.length() > 64 || (enrolling && encoded.length() != 44)) {
            call.reject("Clé biométrique invalide.");
            return;
        }
        if (!enrolling && !vaultId.equals(envelope().getString("vaultId", ""))) {
            call.reject("Biométrie inactive.");
            return;
        }
        try {
            KeyStore store = keyStore();
            SecretKey key = (SecretKey) store.getKey(ALIAS, null);
            Cipher cipher = Cipher.getInstance(TRANSFORM);
            if (enrolling) {
                try {
                    cipher.init(Cipher.ENCRYPT_MODE, key == null ? generateKey() : key);
                } catch (KeyPermanentlyInvalidatedException invalidated) {
                    store.deleteEntry(ALIAS);
                    cipher.init(Cipher.ENCRYPT_MODE, generateKey());
                }
            } else {
                byte[] iv = Base64.decode(envelope().getString("iv", ""), Base64.NO_WRAP);
                cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
            }
            authenticate(call, cipher, vaultId, enrolling, encoded);
        } catch (Exception error) {
            call.reject("Clé biométrique indisponible. Utilise le code du carnet.");
        }
    }

    @RequiresApi(Build.VERSION_CODES.R)
    private SecretKey generateKey() throws Exception {
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
        generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setUserAuthenticationRequired(true)
            .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
            .setInvalidatedByBiometricEnrollment(true)
            .build());
        return generator.generateKey();
    }

    @RequiresApi(Build.VERSION_CODES.R)
    private void authenticate(PluginCall call, Cipher cipher, String vaultId, boolean enrolling, String encoded) {
        CancellationSignal signal = new CancellationSignal();
        pending = signal;
        Context context = getActivity();
        try {
            new BiometricPrompt.Builder(context)
                .setTitle(enrolling ? "Activer la biométrie du carnet" : "Ouvrir le carnet")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .setNegativeButton("Annuler", context.getMainExecutor(), (dialog, which) -> signal.cancel())
                .build().authenticate(new BiometricPrompt.CryptoObject(cipher), signal, context.getMainExecutor(),
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int code, CharSequence message) {
                            if (pending == signal) pending = null;
                            call.reject("Authentification interrompue ou indisponible.");
                        }

                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                            if (pending != signal) {
                                call.reject("Authentification interrompue.");
                                return;
                            }
                            pending = null;
                            Cipher authorized = result.getCryptoObject() == null ? null : result.getCryptoObject().getCipher();
                            if (authorized == null) {
                                call.reject("Authentification indisponible.");
                                return;
                            }
                            finish(call, authorized, vaultId, enrolling, encoded);
                        }
                    });
        } catch (RuntimeException error) {
            pending = null;
            call.reject("Authentification indisponible.");
        }
    }

    private void finish(PluginCall call, Cipher cipher, String vaultId, boolean enrolling, String encoded) {
        byte[] key = null;
        try {
            cipher.updateAAD(vaultId.getBytes(StandardCharsets.UTF_8));
            if (enrolling) {
                key = Base64.decode(encoded, Base64.NO_WRAP);
                if (key.length != 32) throw new IllegalArgumentException();
                byte[] ciphertext = cipher.doFinal(key);
                if (!envelope().edit()
                    .putString("vaultId", vaultId)
                    .putString("iv", Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                    .putString("data", Base64.encodeToString(ciphertext, Base64.NO_WRAP))
                    .commit()) throw new IllegalStateException();
                call.resolve();
            } else {
                key = cipher.doFinal(Base64.decode(envelope().getString("data", ""), Base64.NO_WRAP));
                call.resolve(new JSObject().put("key", Base64.encodeToString(key, Base64.NO_WRAP)));
            }
        } catch (Exception error) {
            call.reject("Clé biométrique indisponible. Utilise le code du carnet.");
        } finally {
            if (key != null) Arrays.fill(key, (byte) 0);
        }
    }
}
