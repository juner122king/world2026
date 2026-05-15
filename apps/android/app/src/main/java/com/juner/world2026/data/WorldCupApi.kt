package com.juner.world2026.data

import com.juner.world2026.config.ApiConfig
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.Locale

class WorldCupApi {
    fun fetchContent(): WorldCupContent {
        val rawJson = request(
            method = "GET",
            url = ApiConfig.contentUrl,
            connectTimeoutMs = 3_000,
            readTimeoutMs = 5_000,
        )
        return ContentJsonParser.parseWorldCupContent(rawJson)
    }

    fun fetchMatchPrediction(day: ScheduleDay, match: ScheduleMatch): MatchPrediction {
        val matchKey = createMatchPredictionKey(day, match)
        val requestBody = JSONObject()
            .put("matchKey", matchKey)
            .put(
                "day",
                JSONObject()
                    .put("day", day.day)
                    .put("month", day.month)
                    .put("weekday", day.weekday),
            )
            .put(
                "match",
                JSONObject()
                    .put("time", match.time)
                    .put("group", match.group)
                    .put("venue", JSONArray(match.venue))
                    .put("home", match.home.toPredictionTeamJson())
                    .put("away", match.away.toPredictionTeamJson()),
            )

        val rawJson = request("POST", ApiConfig.matchPredictionUrl, requestBody.toString())
        return ContentJsonParser.parseMatchPrediction(rawJson)
    }

    fun createMatchPredictionKey(day: ScheduleDay, match: ScheduleMatch): String =
        listOf(day.month, day.day, match.time, match.home.name, match.away.name)
            .joinToString("__") { it.trim().lowercase(Locale.ROOT) }

    private fun request(
        method: String,
        url: String,
        body: String? = null,
        connectTimeoutMs: Int = 12_000,
        readTimeoutMs: Int = 20_000,
    ): String {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = connectTimeoutMs
        connection.readTimeout = readTimeoutMs
        connection.setRequestProperty("Accept", "application/json")

        if (body != null) {
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            OutputStreamWriter(connection.outputStream, StandardCharsets.UTF_8).use { writer ->
                writer.write(body)
            }
        }

        val statusCode = connection.responseCode
        val stream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
        val responseBody = stream?.use {
            BufferedReader(InputStreamReader(it, StandardCharsets.UTF_8)).readText()
        }.orEmpty()

        connection.disconnect()

        if (statusCode !in 200..299) {
            throw IllegalStateException("HTTP $statusCode: ${responseBody.ifBlank { "request failed" }}")
        }

        return responseBody
    }

    private fun GroupTeam.toPredictionTeamJson() = JSONObject()
        .put("flagCode", flagCode)
        .put("name", name)
}
