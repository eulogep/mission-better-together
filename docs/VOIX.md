# Narrations des récits

Les huit récits disposent d’un MP3 français et de repères calculés à partir de la durée de chaque partie. Le lecteur web met les pistes en cache lors de l’installation du service worker. Les builds Android et iOS embarquent les mêmes fichiers. L’anglais utilise la synthèse vocale disponible sur l’appareil ou le mode sous-titres.

Les fichiers distribués utilisent des voix de synthèse. Pour une future version portée par des comédiens, prévoir l’autorisation de diffusion des voix, un jeu posé et les mêmes transcriptions. Remplacer simultanément les fichiers et les repères de sous-titres.

## Régénération locale

```bash
python3.12 -m venv /tmp/mbt-piper
/tmp/mbt-piper/bin/pip install piper-tts==1.8.0
mkdir -p /tmp/mbt-voix
/tmp/mbt-piper/bin/python -m piper.download_voices --data-dir /tmp/mbt-voix fr_FR-siwis-medium fr_FR-upmc-medium
PIPER_PYTHON=/tmp/mbt-piper/bin/python PIPER_MODELS=/tmp/mbt-voix npm run voices
```

FFmpeg doit être disponible. Le script lit les transcriptions françaises de `src/data/content.ts`, produit les pistes dans `public/audio` et écrit les temps de début en secondes dans `src/data/testimonyAudio.generated.json`. Les [crédits et conditions de diffusion](../public/audio/ATTRIBUTIONS.md) accompagnent les pistes.
