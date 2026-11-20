import Capacitor
import Foundation
import LocalAuthentication
import Security

@objc(CarnetBiometricsPlugin)
public final class CarnetBiometricsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CarnetBiometricsPlugin"
    public let jsName = "CarnetBiometrics"
    public let pluginMethods = [
        CAPPluginMethod(name: "availability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "store", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise)
    ]

    private let work = DispatchQueue(label: "fr.missionbettertogether.mbt.carnet")
    private var enrollment: LAContext?
    private var item: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "fr.missionbettertogether.mbt.carnet.v1",
            kSecAttrSynchronizable as String: false
        ]
    }

    @objc func availability(_ call: CAPPluginCall) {
        call.resolve(["available": LAContext().canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)])
    }

    @objc func store(_ call: CAPPluginCall) {
        guard let id = call.getString("vaultId"), !id.isEmpty, id.count <= 64,
              let encoded = call.getString("key"), let key = Data(base64Encoded: encoded), key.count == 32 else {
            call.reject("Clé biométrique invalide.")
            return
        }
        work.async {
            guard self.enrollment == nil else {
                call.reject("Authentification déjà en cours.")
                return
            }
            let context = LAContext()
            context.localizedFallbackTitle = ""
            self.enrollment = context
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Activer la biométrie du carnet") { success, _ in
                self.work.async {
                    guard self.enrollment === context else {
                        call.reject("Authentification interrompue.")
                        return
                    }
                    self.enrollment = nil
                    guard success, let access = SecAccessControlCreateWithFlags(
                        nil, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly, .biometryCurrentSet, nil
                    ) else {
                        call.reject("Authentification interrompue ou indisponible.")
                        return
                    }
                    let deleted = SecItemDelete(self.item as CFDictionary)
                    guard deleted == errSecSuccess || deleted == errSecItemNotFound else {
                        call.reject("Impossible de protéger la clé du carnet.")
                        return
                    }
                    var attributes = self.item
                    attributes[kSecAttrAccount as String] = id
                    attributes[kSecAttrAccessControl as String] = access
                    attributes[kSecValueData as String] = key
                    if SecItemAdd(attributes as CFDictionary, nil) == errSecSuccess {
                        call.resolve()
                    } else {
                        call.reject("Impossible de protéger la clé du carnet.")
                    }
                }
            }
        }
    }

    @objc func read(_ call: CAPPluginCall) {
        guard let id = call.getString("vaultId"), !id.isEmpty, id.count <= 64 else {
            call.reject("Biométrie inactive.")
            return
        }
        work.async {
            let context = LAContext()
            context.localizedReason = "Ouvrir le carnet"
            context.localizedFallbackTitle = ""
            var query = self.item
            query[kSecAttrAccount as String] = id
            query[kSecUseAuthenticationContext as String] = context
            query[kSecReturnData as String] = true
            query[kSecMatchLimit as String] = kSecMatchLimitOne
            var result: CFTypeRef?
            let status = SecItemCopyMatching(query as CFDictionary, &result)
            if status == errSecSuccess, let key = result as? Data, key.count == 32 {
                call.resolve(["key": key.base64EncodedString()])
            } else {
                call.reject("Biométrie indisponible ou interrompue. Utilise le code du carnet.")
            }
            context.invalidate()
        }
    }

    @objc func clear(_ call: CAPPluginCall) {
        work.async {
            self.enrollment?.invalidate()
            self.enrollment = nil
            let status = SecItemDelete(self.item as CFDictionary)
            if status == errSecSuccess || status == errSecItemNotFound {
                call.resolve()
            } else {
                call.reject("Impossible de supprimer la clé biométrique.")
            }
        }
    }
}
