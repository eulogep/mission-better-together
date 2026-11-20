package fr.missionbettertogether.mbt;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CarnetBiometricsPlugin.class);
        super.onCreate(savedInstanceState);
        // Discrétion : le contenu (carnet, contacts) n'apparaît pas dans l'aperçu des applis récentes
        // et ne peut pas être capturé par une autre appli. Retirer cette ligne si l'on souhaite autoriser
        // les captures d'écran de MBT.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    }
}
