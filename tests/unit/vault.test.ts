import { afterEach, describe, expect, it, vi } from 'vitest';
import { carnetBiometrics, hasCarnetBiometrics } from '../../src/lib/carnetBiometrics';
import {
  changePin,
  createVault,
  decryptJson,
  destroyVault,
  disableVaultBiometrics,
  enableVaultBiometrics,
  encryptJson,
  listRecords,
  putRecord,
  unlockVault,
  unlockVaultWithBiometrics,
  validatePin,
  vaultBiometricStatus,
  vaultExists,
} from '../../src/lib/vault';

const PIN = 'ma phrase secrète';

vi.mock('../../src/lib/carnetBiometrics', () => ({
  hasCarnetBiometrics: vi.fn(() => false),
  carnetBiometrics: {
    availability: vi.fn(async () => ({ available: true })),
    store: vi.fn(),
    read: vi.fn(),
    clear: vi.fn(),
  },
}));

afterEach(async () => {
  vi.mocked(carnetBiometrics.clear).mockResolvedValue(undefined);
  await destroyVault();
  vi.mocked(hasCarnetBiometrics).mockReturnValue(false);
  vi.clearAllMocks();
});

describe('coffre chiffré', () => {
  it('refuse les codes trop faibles', () => {
    expect(validatePin('12345')).toMatch(/6 caractères/);
    expect(validatePin('111111')).not.toBeNull();
    expect(validatePin('123456')).not.toBeNull();
    expect(validatePin('soleil-violet')).toBeNull();
  });

  it('crée un coffre puis l’ouvre avec le bon code uniquement', async () => {
    expect(await vaultExists()).toBe(false);
    const session = await createVault(PIN);
    expect(await vaultExists()).toBe(true);

    const blob = await encryptJson(session, { secret: 'il m’a insulté devant la classe' });
    await putRecord('records', { id: 'r1', payload: blob });

    expect((await unlockVault('mauvais code')).session).toBeUndefined();
    const ok = await unlockVault(PIN);
    expect(ok.session).toBeDefined();
    const [rec] = await listRecords('records');
    expect(await decryptJson(ok.session!, rec.payload)).toEqual({ secret: 'il m’a insulté devant la classe' });
  });

  it('ne stocke jamais le texte en clair', async () => {
    const session = await createVault(PIN);
    await putRecord('records', { id: 'r1', payload: await encryptJson(session, { t: 'MOT-TRES-SENSIBLE' }) });
    const [rec] = await listRecords('records');
    const raw = new TextDecoder().decode(new Uint8Array(rec.payload.data));
    expect(raw).not.toContain('MOT-TRES-SENSIBLE');
    expect(rec.payload.iv).toHaveLength(12);
  });

  it('impose un délai après 5 échecs', async () => {
    await createVault(PIN);
    for (let i = 0; i < 4; i++) expect((await unlockVault('faux-code')).retryInMs).toBeUndefined();
    const fifth = await unlockVault('faux-code');
    expect(fifth.retryInMs).toBeGreaterThanOrEqual(29_000);
    // Même le bon code est refusé pendant le délai
    expect((await unlockVault(PIN)).session).toBeUndefined();
  });

  it('change le code sans perdre les données', async () => {
    const session = await createVault(PIN);
    await putRecord('records', { id: 'r1', payload: await encryptJson(session, { n: 42 }) });
    expect(await changePin('faux-code', 'nouveau code sûr')).toBe(false);
    expect(await changePin(PIN, 'nouveau code sûr')).toBe(true);
    expect((await unlockVault(PIN)).session).toBeUndefined();
    const res = await unlockVault('nouveau code sûr');
    const [rec] = await listRecords('records');
    expect(await decryptJson(res.session!, rec.payload)).toEqual({ n: 42 });
  });

  it('efface définitivement le coffre', async () => {
    await createVault(PIN);
    await destroyVault();
    expect(await vaultExists()).toBe(false);
  });

  it('sur le web, conserve uniquement le déverrouillage par code', async () => {
    await createVault(PIN);
    expect(await vaultBiometricStatus()).toEqual({ available: false, enabled: false });
    await expect(enableVaultBiometrics(PIN)).rejects.toThrow('indisponible');
    await expect(unlockVaultWithBiometrics()).rejects.toThrow('inactive');
    expect(carnetBiometrics.store).not.toHaveBeenCalled();
  });

  it('active la biométrie seulement après le bon code et le succès du coffre natif', async () => {
    vi.mocked(hasCarnetBiometrics).mockReturnValue(true);
    const original = await createVault(PIN);
    const note = await encryptJson(original, { secret: 42 });
    await expect(enableVaultBiometrics('faux-code')).rejects.toThrow('incorrect');
    expect(carnetBiometrics.store).not.toHaveBeenCalled();
    vi.mocked(carnetBiometrics.store).mockRejectedValueOnce(new Error('Annulé'));
    await expect(enableVaultBiometrics(PIN)).rejects.toThrow('Annulé');
    expect((await vaultBiometricStatus()).enabled).toBe(false);

    await enableVaultBiometrics(PIN);
    const enrollment = vi.mocked(carnetBiometrics.store).mock.lastCall![0];
    expect(enrollment.key).not.toBe(PIN);
    vi.mocked(carnetBiometrics.read).mockRejectedValueOnce(new Error('Annulé'));
    await expect(unlockVaultWithBiometrics()).rejects.toThrow('Annulé');
    vi.mocked(carnetBiometrics.read).mockResolvedValueOnce({ key: enrollment.key });
    expect(await decryptJson(await unlockVaultWithBiometrics(), note)).toEqual({ secret: 42 });
    expect(carnetBiometrics.read).toHaveBeenCalledWith({ vaultId: enrollment.vaultId });

    await disableVaultBiometrics();
    await expect(unlockVaultWithBiometrics()).rejects.toThrow('inactive');
    expect(carnetBiometrics.clear).toHaveBeenCalledOnce();
    expect((await unlockVault(PIN)).session).toBeDefined();
  });

  it('demande la suppression de la clé native avant d’effacer le carnet', async () => {
    vi.mocked(hasCarnetBiometrics).mockReturnValue(true);
    await createVault(PIN);
    vi.mocked(carnetBiometrics.clear).mockRejectedValueOnce(new Error('Coffre indisponible'));
    await expect(destroyVault()).rejects.toThrow('Coffre indisponible');
    expect(await vaultExists()).toBe(true);
    await destroyVault();
    expect(await vaultExists()).toBe(false);
  });
});
