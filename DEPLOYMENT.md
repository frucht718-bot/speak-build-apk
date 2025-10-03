# Deployment & APK Build Anleitung

## 🚀 Web Deployment
Die App ist automatisch über Lovable deployed unter:
https://3198181e-976d-4dad-989f-284fb4a95d0a.lovableproject.com

## 📱 Android APK Build

### Voraussetzungen
1. GitHub-Repo verbunden (über Lovable → GitHub → Connect)
2. Android Studio installiert (für lokale Builds)
3. Oder: Expo EAS Account (für Cloud-Builds)

### Option 1: Lokaler Build mit Capacitor
```bash
# 1. Projekt klonen
git clone [YOUR_GITHUB_REPO_URL]
cd speak-build-apk

# 2. Dependencies installieren
npm install

# 3. Android Platform hinzufügen
npx cap add android

# 4. Build erstellen
npm run build

# 5. Capacitor sync
npx cap sync

# 6. Android Studio öffnen
npx cap open android

# 7. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
```

### Option 2: Cloud Build mit Expo EAS
```bash
# 1. EAS CLI installieren
npm install -g eas-cli

# 2. EAS Login
eas login

# 3. EAS Build konfigurieren
eas build:configure

# 4. Android APK bauen
eas build --platform android --profile preview
```

### Option 3: GitHub Actions (Empfohlen für Automation)
Erstelle `.github/workflows/build-apk.yml`:
```yaml
name: Build Android APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - run: npm install
      - run: npm run build
      - run: npx cap add android
      - run: npx cap sync
      - run: cd android && ./gradlew assembleRelease
      - uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## 🔧 Edge Functions Deployment
Edge Functions werden automatisch deployed bei jedem Push zu Lovable.

Manuelles Deployment via Supabase CLI:
```bash
supabase functions deploy voice-to-text
supabase functions deploy generate-app-code
supabase functions deploy generate-app-icon
supabase functions deploy chat-with-ai
supabase functions deploy build-apk
```

## 🔐 Secrets
Folgende Secrets müssen in Supabase konfiguriert sein:
- `GROQ_API_KEY` - Für Groq Whisper STT und Chat
- `OPENAI_API_KEY` - Fallback für STT und Chat
- `LOVABLE_API_KEY` - Für Code/Icon-Generierung (automatisch gesetzt)

## 📦 Build-Status
- ✅ Web-App: Deployed
- ✅ Edge Functions: Deployed
- ⚙️ Android APK: Manuelle Konfiguration erforderlich (siehe oben)

## 💡 Tipps
- Für schnelle Iterationen: Nutze die Web-Vorschau
- Für echte APK-Tests: Nutze Capacitor + Android Studio
- Für Production-Releases: Nutze EAS Build oder GitHub Actions
- APK-Signing: Vergiss nicht, einen Keystore zu erstellen und zu signieren!
