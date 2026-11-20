import { ProfileId } from '../data/content';

/** Préférences locales : premier lancement terminé, profil choisi (primaire, collège…). */

const ONBOARDED_KEY = 'mbt_onboarded_v1';
const PROFILE_KEY = 'mbt_profile_v1';

const safeGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // navigation privée : on continue sans mémoriser
  }
};

export const isOnboarded = () => safeGet(ONBOARDED_KEY) === '1';
export const setOnboarded = () => safeSet(ONBOARDED_KEY, '1');

export function getSavedProfile(): ProfileId | null {
  const v = safeGet(PROFILE_KEY);
  return v === 'primaire' || v === 'college' || v === 'adulte' || v === 'parent' ? v : null;
}
export const saveProfile = (id: ProfileId) => safeSet(PROFILE_KEY, id);
