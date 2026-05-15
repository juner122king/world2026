package com.juner.world2026.data

import org.json.JSONArray
import org.json.JSONObject

object ContentJsonParser {
    fun parseWorldCupContent(rawJson: String): WorldCupContent {
        val root = JSONObject(rawJson)
        val knockout = root.getJSONObject("knockout")
        val final = knockout.getJSONObject("final")

        return WorldCupContent(
            meta = parseMeta(root.getJSONObject("meta")),
            ticker = root.getJSONArray("ticker").stringList(),
            hero = parseHero(root.getJSONObject("hero")),
            groups = root.getJSONArray("groups").mapObjects(::parseGroup),
            schedule = parseSchedule(root.getJSONObject("schedule")),
            knockout = Knockout(
                stages = knockout.getJSONArray("stages").mapObjects(::parseKnockoutStage),
                venue = parseKnockoutFinalCard(final.getJSONObject("venue")),
                center = parseKnockoutFinalCenter(final.getJSONObject("center")),
                format = parseKnockoutFinalCard(final.getJSONObject("format")),
            ),
            overview = parseOverview(root.getJSONObject("overview")),
            predictions = root.optJSONObject("predictions")?.let(::parsePredictions),
        )
    }

    fun parseMatchPrediction(rawJson: String): MatchPrediction {
        val root = JSONObject(rawJson)
        val probabilities = root.getJSONObject("probabilities")

        return MatchPrediction(
            matchKey = root.getString("matchKey"),
            summary = root.getString("summary"),
            confidence = root.getString("confidence"),
            probabilities = MatchPredictionProbabilities(
                home = probabilities.getInt("home"),
                draw = probabilities.getInt("draw"),
                away = probabilities.getInt("away"),
            ),
            reasoning = root.getJSONArray("reasoning").stringList(),
            generatedAt = root.getString("generatedAt"),
            status = root.getString("status"),
        )
    }

    private fun parseMeta(json: JSONObject) = Meta(
        title = json.getString("title"),
        updatedAt = json.getString("updatedAt"),
        sources = json.getJSONArray("sources").stringList(),
    )

    private fun parseHero(json: JSONObject): Hero {
        val title = json.getJSONObject("title")
        return Hero(
            eyebrow = json.getString("eyebrow"),
            title = HeroTitle(
                main = title.getJSONArray("main").stringList(),
                year = title.getString("year"),
            ),
            badges = json.getJSONArray("badges").mapObjects {
                HeroBadge(
                    text = it.getString("text"),
                    highlighted = it.optBoolean("highlighted", false),
                )
            },
            countdownLabel = json.getString("countdownLabel"),
            countdownSubtext = json.getJSONArray("countdownSubtext").stringList(),
            openingDate = json.getString("openingDate"),
        )
    }

    private fun parseGroup(json: JSONObject) = Group(
        letter = json.getString("letter"),
        label = json.getString("label"),
        teams = json.getJSONArray("teams").mapObjects(::parseGroupTeam),
    )

    private fun parseGroupTeam(json: JSONObject) = GroupTeam(
        flagCode = json.getString("flagCode"),
        name = json.getString("name"),
        debut = json.optBoolean("debut", false),
        champion = json.optBoolean("champion", false),
    )

    private fun parseSchedule(json: JSONObject) = Schedule(
        note = json.getString("note"),
        days = json.getJSONArray("days").mapObjects { day ->
            ScheduleDay(
                day = day.getString("day"),
                month = day.getString("month"),
                weekday = day.getString("weekday"),
                badge = day.optString("badge").ifBlank { null },
                matches = day.getJSONArray("matches").mapObjects(::parseScheduleMatch),
            )
        },
    )

    private fun parseScheduleMatch(json: JSONObject) = ScheduleMatch(
        time = json.getString("time"),
        home = parseGroupTeam(json.getJSONObject("home")),
        away = parseGroupTeam(json.getJSONObject("away")),
        group = json.getString("group"),
        venue = json.getJSONArray("venue").stringList(),
    )

    private fun parseKnockoutStage(json: JSONObject) = KnockoutStage(
        name = json.getString("name"),
        date = json.getString("date"),
        stat = json.getString("stat"),
        label = json.getString("label"),
        description = json.getJSONArray("description").stringList(),
    )

    private fun parseKnockoutFinalCard(json: JSONObject) = KnockoutFinalCard(
        eyebrow = json.getString("eyebrow"),
        title = json.getJSONArray("title").stringList(),
        detail = json.getJSONArray("detail").stringList(),
    )

    private fun parseKnockoutFinalCenter(json: JSONObject) = KnockoutFinalCenter(
        trophy = json.getString("trophy"),
        title = json.getJSONArray("title").stringList(),
        date = json.getString("date"),
    )

    private fun parseOverview(json: JSONObject) = Overview(
        stats = json.getJSONArray("stats").mapObjects {
            OverviewStat(
                value = it.getString("value"),
                label = it.getString("label"),
            )
        },
        hosts = json.getJSONArray("hosts").mapObjects {
            HostSummary(
                flagCode = it.getString("flagCode"),
                name = it.getString("name"),
                detail = it.getJSONArray("detail").stringList(),
            )
        },
        favoritesTitle = json.getString("favoritesTitle"),
        favorites = json.getJSONArray("favorites").mapObjects {
            Favorite(
                rank = it.getString("rank"),
                flagCode = it.getString("flagCode"),
                name = it.getString("name"),
                group = it.getString("group"),
                odds = it.getString("odds"),
            )
        },
    )

    private fun parsePredictions(json: JSONObject) = Predictions(
        overall = json.optJSONObject("overall")?.let(::parseOverallPrediction),
    )

    private fun parseOverallPrediction(json: JSONObject) = OverallPredictionSummary(
        generatedAt = json.getString("generatedAt"),
        basisUpdatedAt = json.getString("basisUpdatedAt"),
        status = json.getString("status"),
        disclaimer = json.getString("disclaimer"),
        favorites = json.getJSONArray("favorites").mapObjects {
            val team = it.getJSONObject("team")
            PredictionFavorite(
                rank = it.getString("rank"),
                team = PredictionTeamRef(
                    flagCode = team.getString("flagCode"),
                    name = team.getString("name"),
                ),
                probability = it.getInt("probability"),
                insight = it.getString("insight"),
            )
        },
    )

    private fun JSONArray.stringList(): List<String> = List(length()) { index -> getString(index) }

    private fun <T> JSONArray.mapObjects(transform: (JSONObject) -> T): List<T> =
        List(length()) { index -> transform(getJSONObject(index)) }
}
