import type { AffectScene } from '../../lib/affect';

export type GardenWeather = AffectScene | 'neutre';

interface Sky {
  label: string;
  description: string;
  image: 'ramure' | 'floraison' | 'pluie' | 'orage';
  day: string;
  evening: string;
  hills: readonly [string, string];
}

export const GARDEN_SKIES: Record<GardenWeather, Sky> = {
  neutre: {
    label: 'Ton arbre',
    description: 'Un arbre aux feuilles vertes se dresse dans le jardin.',
    image: 'ramure',
    day: 'radial-gradient(ellipse at 53% 22%, #fff9d9 0%, transparent 54%), linear-gradient(174deg, #edf5e3, #d8eacf 67%, #c4dcb8)',
    evening: 'linear-gradient(165deg, #24293f, #3e5b62 73%, #416452)',
    hills: ['#afcda1', '#9ebf96'],
  },
  soleil: {
    label: 'Ensoleillé',
    description: 'De petites fleurs jaunes s’ouvrent dans les branches au soleil.',
    image: 'floraison',
    day: 'radial-gradient(circle at 76% 23%, #fff9d0 5%, #fff3c7 16%, transparent 49%), linear-gradient(165deg, #f5edb8, #dfecc4 62%, #bad69d)',
    evening: 'radial-gradient(ellipse at 60% 70%, #66745e, transparent 60%), linear-gradient(165deg, #292f46, #405a61 74%, #48644c)',
    hills: ['#b0cb8e', '#a3c183'],
  },
  nuage: {
    label: 'Sous les nuages',
    description: 'L’arbre déploie ses branches sous un ciel voilé.',
    image: 'ramure',
    day: 'linear-gradient(168deg, #dce6eb, #ecf0e7 60%, #bfd1bb)',
    evening: 'linear-gradient(165deg, #323b52, #4c626c 73%, #466158)',
    hills: ['#a9c2a3', '#94b096'],
  },
  pluie: {
    label: 'Sous la pluie',
    description: 'Des gouttes reposent sur les feuilles de l’arbre, dans une lumière fraîche.',
    image: 'pluie',
    day: 'linear-gradient(166deg, #bdcedd, #d9e5e9 65%, #a6c5bd)',
    evening: 'linear-gradient(165deg, #27394d, #42616e 72%, #3e5f5c)',
    hills: ['#91b5a7', '#82a99b'],
  },
  orage: {
    label: 'Dans le vent',
    description: 'Les branches penchent dans le vent et les racines restent en place.',
    image: 'orage',
    day: 'radial-gradient(ellipse at 75% 67%, #d7dee2, transparent 56%), linear-gradient(163deg, #b5bed0, #bccbd4 65%, #98b4ad)',
    evening: 'linear-gradient(160deg, #252d45, #485568 62%, #3d5858)',
    hills: ['#8fa99c', '#829d94'],
  },
  melange: {
    label: 'Entre pluie et éclaircies',
    description: 'La pluie et la lumière du soleil se partagent le ciel autour de l’arbre en fleurs.',
    image: 'floraison',
    day: 'radial-gradient(ellipse at 85% 21%, #fff3c3 0%, #fff3c3a8 22%, transparent 62%), linear-gradient(132deg, #bacbdd, #d6e4dd 60%, #c9dcaa)',
    evening: 'radial-gradient(ellipse at 82% 32%, #6c6e56, transparent 54%), linear-gradient(165deg, #28354e, #4a6767 74%, #456653)',
    hills: ['#a9c399', '#92b297'],
  },
};
