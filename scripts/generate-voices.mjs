#!/usr/bin/env node
/**
 * Génère les voix des témoignages avec ElevenLabs → public/audio/temoignage-<id>-fr.mp3
 *
 * Usage :
 *   ELEVENLABS_API_KEY=xxxx npm run voices            # génère les fichiers manquants
 *   ELEVENLABS_API_KEY=xxxx npm run voices -- --force # régénère tout
 *
 * Variables facultatives : ELEVENLABS_MODEL (défaut : eleven_multilingual_v2)
 * La clé API se crée sur https://elevenlabs.io/app/settings/api-keys — ne jamais la committer.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const API_KEY = process.env.ELEVENLABS_API_KEY;
const FORCE = process.argv.includes('--force');

// Une voix française par témoin (bibliothèque ElevenLabs). Les numéros sont écrits
// comme ils se prononcent (« trente dix-huit ») pour une lecture naturelle.
const TESTIMONIES = [
  {
    id: 'lina',
    voice: '2oMnSKxLeHBxE0KdeHJD', // Natasha Asher — jeune, douce, émue
    text: 'Au début, je pensais que ce n’était que des blagues dans la cour. Puis les moqueries ont continué tous les jours, jusque sur mon téléphone le soir. J’avais peur d’en parler parce que je ne voulais pas inquiéter mes parents. Je gardais tout pour moi et j’avais mal au ventre chaque matin avant d’aller en cours. Le jour où j’ai montré les messages à la CPE et appelé le trente dix-huit, tout a commencé à changer. Je me suis sentie écoutée pour la première fois. Si tu vis ça aujourd’hui : tu n’y es pour rien. Parle à un adulte de confiance, même si ça fait peur au début.',
  },
  {
    id: 'soojin',
    voice: 'r77acJhQ7tAysM3mQTBA', // Paula M — jeune, chaleureuse
    text: 'Quand une rumeur a commencé à circuler dans un groupe étudiant, j’ai voulu tout effacer et disparaître des réseaux. Une amie m’a rappelé une règle essentielle : faire des captures d’écran avant de bloquer et signaler. Ce sont ces preuves qui ont permis d’agir vite. Grâce à la cellule d’écoute de l’université et au trente dix-huit, les contenus ont été supprimés en quelques heures.',
  },
  {
    id: 'camille',
    voice: 'CjIhvq3lIJsoH2c65cKR', // Jules — jeune, posé (pas de voix d'enfant disponible)
    text: 'À la récréation, je restais toujours près du banc tout seul. Un camarade de CM2 est venu s’asseoir à côté de moi et a prévenu la maîtresse. Parfois, il suffit d’une seule personne qui ne rigole pas avec les autres pour que la peur diminue.',
  },
  {
    id: 'parent-alex',
    voice: 'axUVfgrTmmMuyerJowoV', // Claire — adulte, sincère
    text: 'Mon fils ne disait rien, mais il dormait mal et refusait soudainement de prendre le bus scolaire. En prenant un moment calme, sans jugement, sans lui confisquer son téléphone par punition, il a enfin pu mettre des mots sur ce qu’il subissait. Nous avons ensuite demandé un rendez-vous écrit avec la direction de l’établissement pour mettre en place un suivi immédiat.',
  },
  {
    id: 'nadia',
    voice: 'mNu8EQcIlFZdOJs7yfhe', // Julia — jeune, douce
    text: 'Parler avec un psychologue m’a permis de comprendre que ma valeur ne dépendait pas des insultes reçues au lycée. Aujourd’hui, je suis ambassadrice contre le harcèlement dans mon établissement pour aider les plus jeunes.',
  },
  {
    id: 'theo',
    voice: 'SxgWu73BS4E8TRj12RH0', // Maxime — jeune homme, naturel
    text: 'Pendant mon stage, les remarques humiliantes devant l’équipe étaient présentées comme de l’humour. Tenir un journal daté des faits et solliciter mon tuteur d’école m’a donné la force de réagir sereinement et légalement.',
  },
  {
    id: 'ines',
    voice: 'mNu8EQcIlFZdOJs7yfhe', // Julia
    text: 'Dans le groupe de la classe, une blague sur une amie revenait tous les soirs. Elle avait fini par quitter la conversation. Je lui ai écrit en privé : “J’ai vu les messages. Si tu veux, on peut en parler demain.” On s’est retrouvées avant le premier cours. Elle m’a dit qu’elle avait peur d’en parler seule. On est allées voir notre prof principale ensemble.',
  },
  {
    id: 'samir',
    voice: 'CjIhvq3lIJsoH2c65cKR', // Jules
    text: 'Quand je lisais à voix haute, des élèves répétaient mes mots en imitant mon accent. Au bout d’un moment, je ne levais plus la main. Un jour après le cours, j’ai attendu que la salle se vide. J’ai présenté à mon prof deux exemples que j’avais notés sur une feuille. Il m’a écouté et on a décidé de se revoir quelques jours après pour faire le point. Ça m’a aidé de savoir quand je pourrais lui reparler.',
  },
];

if (!API_KEY) {
  console.error('❌ Variable ELEVENLABS_API_KEY manquante.\n   ELEVENLABS_API_KEY=xxxx npm run voices');
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
let failed = 0;

for (const t of TESTIMONIES) {
  const file = join(OUT_DIR, `temoignage-${t.id}-fr.mp3`);
  if (!FORCE) {
    try {
      await access(file);
      console.log(`⏭  ${t.id} : déjà présent`);
      continue;
    } catch {
      // à générer
    }
  }
  process.stdout.write(`🎙  ${t.id} (${t.text.length} caractères)… `);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${t.voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: t.text,
      model_id: MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.25 },
    }),
  });
  if (!res.ok) {
    failed++;
    console.log(`échec (HTTP ${res.status}) ${(await res.text()).slice(0, 200)}`);
    continue;
  }
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log('ok');
}

console.log(failed ? `\n${failed} échec(s).` : `\n✅ Fichiers dans public/audio/. Relancez « npm run build ».`);
process.exit(failed ? 1 : 0);
