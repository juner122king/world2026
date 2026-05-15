plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val defaultApiBaseUrl = providers
    .gradleProperty("WORLD2026_API_BASE_URL")
    .getOrElse("https://world2026.vercel.app")

android {
    namespace = "com.juner.world2026"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.juner.world2026"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField("String", "API_BASE_URL", "\"$defaultApiBaseUrl\"")
    }

    buildFeatures {
        buildConfig = true
    }
}
