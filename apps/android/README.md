# World2026 Android

Native Kotlin Android project for the World Cup 2026 app.

## Open In Android Studio

Open this directory:

```text
apps/android
```

The app module is `:app`, with package name `com.juner.world2026`.

## API Configuration

The default API base URL is:

```text
https://world2026.vercel.app
```

For debug or preview builds, override it with a Gradle property:

```bash
./gradlew assembleDebug -PWORLD2026_API_BASE_URL=https://your-preview.vercel.app
```

Current API endpoints are centralized in `ApiConfig.kt`.
