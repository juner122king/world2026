package com.juner.world2026.data

data class Meta(
    val title: String,
    val updatedAt: String,
    val sources: List<String>,
)

data class HeroBadge(
    val text: String,
    val highlighted: Boolean,
)

data class HeroTitle(
    val main: List<String>,
    val year: String,
)

data class Hero(
    val eyebrow: String,
    val title: HeroTitle,
    val badges: List<HeroBadge>,
    val countdownLabel: String,
    val countdownSubtext: List<String>,
    val openingDate: String,
)

data class GroupTeam(
    val flagCode: String,
    val name: String,
    val debut: Boolean,
    val champion: Boolean,
)

data class Group(
    val letter: String,
    val label: String,
    val teams: List<GroupTeam>,
)

data class ScheduleMatch(
    val time: String,
    val home: GroupTeam,
    val away: GroupTeam,
    val group: String,
    val venue: List<String>,
)

data class ScheduleDay(
    val day: String,
    val month: String,
    val weekday: String,
    val badge: String?,
    val matches: List<ScheduleMatch>,
)

data class Schedule(
    val note: String,
    val days: List<ScheduleDay>,
)

data class KnockoutStage(
    val name: String,
    val date: String,
    val stat: String,
    val label: String,
    val description: List<String>,
)

data class KnockoutFinalCard(
    val eyebrow: String,
    val title: List<String>,
    val detail: List<String>,
)

data class KnockoutFinalCenter(
    val trophy: String,
    val title: List<String>,
    val date: String,
)

data class Knockout(
    val stages: List<KnockoutStage>,
    val venue: KnockoutFinalCard,
    val center: KnockoutFinalCenter,
    val format: KnockoutFinalCard,
)

data class OverviewStat(
    val value: String,
    val label: String,
)

data class HostSummary(
    val flagCode: String,
    val name: String,
    val detail: List<String>,
)

data class Favorite(
    val rank: String,
    val flagCode: String,
    val name: String,
    val group: String,
    val odds: String,
)

data class PredictionTeamRef(
    val flagCode: String,
    val name: String,
)

data class PredictionFavorite(
    val rank: String,
    val team: PredictionTeamRef,
    val probability: Int,
    val insight: String,
)

data class OverallPredictionSummary(
    val generatedAt: String,
    val basisUpdatedAt: String,
    val status: String,
    val disclaimer: String,
    val favorites: List<PredictionFavorite>,
)

data class Predictions(
    val overall: OverallPredictionSummary?,
)

data class Overview(
    val stats: List<OverviewStat>,
    val hosts: List<HostSummary>,
    val favoritesTitle: String,
    val favorites: List<Favorite>,
)

data class WorldCupContent(
    val meta: Meta,
    val ticker: List<String>,
    val hero: Hero,
    val groups: List<Group>,
    val schedule: Schedule,
    val knockout: Knockout,
    val overview: Overview,
    val predictions: Predictions?,
)

data class MatchPredictionProbabilities(
    val home: Int,
    val draw: Int,
    val away: Int,
)

data class MatchPrediction(
    val matchKey: String,
    val summary: String,
    val confidence: String,
    val probabilities: MatchPredictionProbabilities,
    val reasoning: List<String>,
    val basisUpdatedAt: String,
    val modelVersion: String,
    val generatedAt: String,
    val status: String,
)
