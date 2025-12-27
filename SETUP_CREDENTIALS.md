# Setup Android Credentials per EAS Build

## Problema
Il workflow GitHub Actions fallisce perché non ci sono credenziali Android configurate.

## Soluzione - Genera le credenziali UNA VOLTA localmente

Esegui questo comando una sola volta:

```bash
cd ~/the-architect
eas build --platform android --profile preview
```

EAS ti chiederà:
1. "Would you like to automatically create a keystore?" → Rispondi: **Yes**
2. Aspetta che generi il keystore e lo salvi sui server Expo

Dopo questo, **TUTTI i futuri build automatici su GitHub funzioneranno!**

## Alternativa - Build manuale senza credenziali

Puoi anche usare il comando:

```bash
eas build:configure
```

Poi:
```bash
eas credentials
```

E seleziona "Android" → "Set up new credentials"

---

Una volta fatto, il workflow GitHub Actions funzionerà automaticamente ad ogni push!
