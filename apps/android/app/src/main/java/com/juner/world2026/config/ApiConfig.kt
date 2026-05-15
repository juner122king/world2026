package com.juner.world2026.config

import com.juner.world2026.BuildConfig

object ApiConfig {
    val baseUrl: String = BuildConfig.API_BASE_URL.trimEnd('/')
    val contentUrl: String = "$baseUrl/api/content/worldcup2026"
    val statusUrl: String = "$baseUrl/api/status/worldcup2026"
    val matchPredictionUrl: String = "$baseUrl/api/predictions/match"
}
