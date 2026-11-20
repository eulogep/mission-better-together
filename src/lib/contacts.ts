import { useCallback, useState } from 'react';
import { ContactGroup, ContactItem } from '../data/content';

/**
 * Contacts ajoutés par l'utilisateur, stockés uniquement sur l'appareil (localStorage).
 * Les numéros d'aide nationaux (HELP_CONTACTS) ne sont jamais stockés : ils viennent du code.
 */

const STORAGE_KEY = 'mbt_contacts_v2';
const LEGACY_KEY = 'mbt_emergency_contacts_v1';

function migrateLegacy(): ContactItem[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const legacy = JSON.parse(raw) as { id: string; firstName: string; lastName: string; phone: string; group: string }[];
    localStorage.removeItem(LEGACY_KEY);
    // Seuls les contacts réellement saisis par l'utilisateur sont repris (pas les exemples)
    return legacy
      .filter((c) => c.id?.startsWith('custom_'))
      .map((c) => {
        const trusted = c.group === 'Famille' || c.group === 'Amis';
        const group: ContactGroup = trusted ? 'Confiance' : c.group === 'Établissement' ? 'Établissement' : 'Autre';
        return { id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone, group, trusted };
      });
  } catch {
    return [];
  }
}

export function loadUserContacts(): ContactItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ContactItem[];
    }
  } catch {
    // stockage indisponible
  }
  const migrated = migrateLegacy();
  if (migrated.length) saveUserContacts(migrated);
  return migrated;
}

export function saveUserContacts(contacts: ContactItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {
    // stockage indisponible (navigation privée…)
  }
}

export function useUserContacts() {
  const [contacts, setContacts] = useState<ContactItem[]>(loadUserContacts);
  const update = useCallback((next: ContactItem[]) => {
    setContacts(next);
    saveUserContacts(next);
  }, []);
  return [contacts, update] as const;
}

export const newContactId = () => `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------------------------------------------ */
/* Import depuis le carnet du téléphone (Contact Picker API — Android) */
/* ------------------------------------------------------------------ */

interface PickedContact {
  name?: string[];
  tel?: string[];
}
interface ContactsManagerLike {
  select: (props: string[], opts?: { multiple?: boolean }) => Promise<PickedContact[]>;
}

export const canPickContacts = () =>
  typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

export async function pickPhoneContacts(): Promise<{ name: string; phone: string }[]> {
  const manager = (navigator as unknown as { contacts: ContactsManagerLike }).contacts;
  const picked = await manager.select(['name', 'tel'], { multiple: true });
  return picked
    .filter((c) => c.tel?.[0])
    .map((c) => ({ name: c.name?.[0]?.trim() || c.tel![0], phone: c.tel![0] }));
}
