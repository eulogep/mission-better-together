import React, { useMemo, useState } from 'react';
import { BellRing, ChevronLeft, Contact, Phone, Plus, Search, Trash2, UserPlus, X } from 'lucide-react';
import { ContactGroup, ContactItem, HELP_CONTACTS } from '../data/content';
import { canPickContacts, newContactId, pickPhoneContacts, useUserContacts } from '../lib/contacts';
import { toast } from '../lib/toast';

interface ContactsScreenProps {
  onBack: () => void;
  onCallContact: (contact: ContactItem) => void;
  onAlert: () => void;
}

// Chiffres, espaces, points, tirets, et un « + » initial facultatif (2 à 20 caractères)
const PHONE_PATTERN = /^\+?[0-9][0-9 .\-]{1,19}$/;

const USER_GROUPS: { key: ContactGroup; label: string; hint: string }[] = [
  { key: 'Confiance', label: 'Proche de confiance', hint: 'Reçoit vos alertes' },
  { key: 'Établissement', label: 'Établissement', hint: 'CPE, prof, infirmerie…' },
  { key: 'Autre', label: 'Autre', hint: '' },
];

const SECTION_TITLES: Record<ContactGroup, string> = {
  Confiance: 'Mes personnes de confiance',
  Établissement: 'Établissement',
  Autre: 'Autres',
  Aide: 'Numéros d’aide (gratuits)',
};

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ onBack, onCallContact, onAlert }) => {
  const [userContacts, setUserContacts] = useUserContacts();
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState<ContactGroup>('Confiance');

  const trustedCount = userContacts.filter((c) => c.trusted).length;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (c: ContactItem) =>
      !q || `${c.firstName} ${c.lastName} ${c.phone} ${c.note || ''}`.toLowerCase().includes(q);
    const order: ContactGroup[] = ['Confiance', 'Établissement', 'Autre', 'Aide'];
    const all = [...userContacts, ...HELP_CONTACTS];
    return order
      .map((g) => ({
        group: g,
        items: all
          .filter((c) => c.group === g && match(c))
          .sort((a, b) => (g === 'Aide' ? 0 : a.firstName.localeCompare(b.firstName, 'fr'))),
      }))
      .filter((s) => s.items.length > 0 || (s.group === 'Confiance' && !q));
  }, [userContacts, query]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setGroup('Confiance');
  };

  const phoneIsValid = PHONE_PATTERN.test(phone.trim());

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phoneIsValid) return;
    const next: ContactItem = {
      id: newContactId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      group,
      trusted: group === 'Confiance',
    };
    setUserContacts([next, ...userContacts]);
    toast(
      next.trusted ? `${next.firstName} fait partie de tes personnes de confiance.` : `${next.firstName} ajouté·e.`,
      { tone: next.trusted ? 'warm' : 'success' }
    );
    resetForm();
    setShowAddModal(false);
  };

  const handleImport = async () => {
    setImportError(null);
    try {
      const picked = await pickPhoneContacts();
      const existing = new Set(userContacts.map((c) => c.phone.replace(/\D/g, '')));
      const added: ContactItem[] = picked
        .filter((p) => !existing.has(p.phone.replace(/\D/g, '')))
        .map((p) => ({
          id: newContactId(),
          firstName: p.name,
          lastName: '',
          phone: p.phone,
          group: 'Confiance',
          trusted: true,
        }));
      if (added.length) {
        setUserContacts([...added, ...userContacts]);
        toast(`${added.length} contact${added.length > 1 ? 's' : ''} importé${added.length > 1 ? 's' : ''}.`, {
          tone: 'success',
        });
      }
    } catch {
      setImportError('Import impossible. Ajoutez le contact à la main.');
    }
  };

  const handleDeleteContact = (contact: ContactItem) => {
    if (!window.confirm(`Supprimer « ${contact.firstName} » de vos contacts ?`)) return;
    setUserContacts(userContacts.filter((c) => c.id !== contact.id));
  };

  return (
    <div className="relative w-full h-full bg-white flex flex-col font-ios animate-screen-in overflow-hidden">
      {/* En-tête iOS */}
      <div className="bg-[#f9f9fb] border-b border-black/10 px-4 pt-3 pb-3 shrink-0">
        <div className="flex items-center justify-between h-9">
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full text-black hover:bg-black/5 active:scale-90 transition cursor-pointer"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-semibold text-black">Contacts</h1>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            aria-label="Ajouter un contact"
            className="w-9 h-9 -mr-2 flex items-center justify-center text-[#007AFF] hover:opacity-70 active:scale-90 transition cursor-pointer"
          >
            <Plus className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 bg-[#767680]/12 rounded-[10px] px-2.5 h-[36px]">
          <Search className="w-4 h-4 text-[#3c3c43]/60 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher"
            aria-label="Rechercher un contact"
            className="flex-1 min-w-0 bg-transparent text-[16px] text-black placeholder:text-[#3c3c43]/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="text-[#3c3c43]/60 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto no-scrollbar pb-10">
        {/* Alerte rapide des proches */}
        {trustedCount > 0 && !query && (
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={onAlert}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] bg-[#FF3B30] text-white text-[16px] font-semibold active:scale-[0.98] hover:bg-[#e5352b] transition cursor-pointer shadow-[0_8px_20px_rgba(255,59,48,0.3)]"
            >
              <BellRing className="w-5 h-5" />
              Alerter mes proches
            </button>
          </div>
        )}

        {sections.map(({ group: g, items }) => (
          <div key={g}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs px-4 pt-4 pb-1.5 border-b border-[#3c3c43]/20 text-[13px] font-semibold uppercase tracking-wide text-[#3c3c43]/60">
              {SECTION_TITLES[g]}
            </div>

            {g === 'Confiance' && items.length === 0 && (
              <div className="mx-4 my-3 rounded-2xl bg-[#f2f2f7] px-4 py-4 text-center">
                <p className="text-[14px] leading-snug text-[#3c3c43]">
                  Ajoutez au moins une personne de confiance (parent, ami·e, prof) pour pouvoir l’alerter en un
                  geste, avec votre position.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#007AFF] text-white text-[14px] font-medium cursor-pointer active:scale-95 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Ajouter
                  </button>
                  {canPickContacts() && (
                    <button
                      type="button"
                      onClick={handleImport}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#007AFF]/30 text-[#007AFF] text-[14px] font-medium cursor-pointer active:scale-95 transition"
                    >
                      <Contact className="w-4 h-4" />
                      Importer du téléphone
                    </button>
                  )}
                </div>
                {importError && <p className="mt-2 text-[12px] text-[#FF3B30]">{importError}</p>}
              </div>
            )}

            {items.map((contact) => (
              <div key={contact.id} className="flex items-center border-b border-[#3c3c43]/15 hover:bg-[#007AFF]/5 transition">
                <button
                  type="button"
                  onClick={() => onCallContact(contact)}
                  aria-label={`Appeler ${contact.firstName} ${contact.lastName}`.trim()}
                  className="flex-1 min-w-0 pl-4 pr-3 py-3 flex items-center justify-between gap-3 text-left active:bg-[#007AFF]/10 transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-[17px] text-black leading-tight truncate">
                      <span className="font-normal">{contact.firstName}</span>
                      {contact.lastName && (
                        <>
                          {' '}
                          <span className="font-semibold">{contact.lastName}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[12px] text-[#8e8e93] mt-0.5 truncate">
                      {contact.phone}
                      {contact.note ? ` · ${contact.note}` : ''}
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </span>
                </button>
                {contact.id.startsWith('custom_') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(contact)}
                    aria-label={`Supprimer ${contact.firstName}`}
                    title="Supprimer ce contact"
                    className="w-8 h-8 mr-2 rounded-full flex items-center justify-center text-[#8e8e93] hover:bg-red-50 hover:text-[#FF3B30] active:scale-90 transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}

        {query && sections.length === 0 && (
          <div className="px-6 py-16 text-center text-[#8e8e93] text-[15px]">
            Aucun contact trouvé pour « {query.trim()} ».
          </div>
        )}

        <p className="px-6 pt-5 text-center text-[11.5px] leading-snug text-[#8e8e93]">
          Vos contacts restent uniquement sur cet appareil.
        </p>
      </div>

      {/* Ajout d'un contact */}
      {showAddModal && (
        <div
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-end"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <form
            onSubmit={handleAddContact}
            className="w-full bg-white rounded-t-[24px] p-5 shadow-2xl flex flex-col gap-3.5 animate-screen-in"
            aria-label="Nouveau contact"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                className="text-[16px] text-[#007AFF] cursor-pointer"
              >
                Annuler
              </button>
              <h2 className="text-[16px] font-semibold text-black">Nouveau contact</h2>
              <button
                type="submit"
                disabled={!firstName.trim() || !phoneIsValid}
                className="text-[16px] font-semibold text-[#007AFF] disabled:opacity-40 cursor-pointer"
              >
                OK
              </button>
            </div>

            <input
              type="text"
              required
              autoComplete="given-name"
              placeholder="Prénom ou intitulé (ex : Maman, CPE)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f2f7] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
            <input
              type="text"
              autoComplete="family-name"
              placeholder="Nom (optionnel)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f2f7] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
            <input
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="Numéro de téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={phone.trim() !== '' && !phoneIsValid}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f2f7] text-[16px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
            {phone.trim() !== '' && !phoneIsValid && (
              <p className="-mt-2 px-1 text-[12px] text-[#FF3B30]">
                Saisissez un numéro valide (chiffres, espaces, « + » au début).
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              {USER_GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGroup(g.key)}
                  aria-pressed={group === g.key}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-[14px] cursor-pointer transition ${
                    group === g.key ? 'bg-[#007AFF] text-white' : 'bg-[#f2f2f7] text-[#3c3c43]'
                  }`}
                >
                  <span className="font-medium">{g.label}</span>
                  {g.hint && <span className={`text-[12px] ${group === g.key ? 'text-white/80' : 'text-[#8e8e93]'}`}>{g.hint}</span>}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
