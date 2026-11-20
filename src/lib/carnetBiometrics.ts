import { Capacitor, registerPlugin } from '@capacitor/core';

interface CarnetBiometricsPlugin {
  availability(): Promise<{ available: boolean }>;
  store(options: { vaultId: string; key: string }): Promise<void>;
  read(options: { vaultId: string }): Promise<{ key: string }>;
  clear(): Promise<void>;
}

export const carnetBiometrics = registerPlugin<CarnetBiometricsPlugin>('CarnetBiometrics');
export const hasCarnetBiometrics = () =>
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('CarnetBiometrics');
