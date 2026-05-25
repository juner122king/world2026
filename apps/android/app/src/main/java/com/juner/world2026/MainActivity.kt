package com.juner.world2026

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.TextUtils
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.HorizontalScrollView
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.content.Intent
import com.juner.world2026.config.ApiConfig
import com.juner.world2026.data.ContentJsonParser
import com.juner.world2026.data.Favorite
import com.juner.world2026.data.Group
import com.juner.world2026.data.GroupTeam
import com.juner.world2026.data.HostSummary
import com.juner.world2026.data.Knockout
import com.juner.world2026.data.KnockoutFinalCard
import com.juner.world2026.data.MatchPrediction
import com.juner.world2026.data.OverallPredictionSummary
import com.juner.world2026.data.PredictionFavorite
import com.juner.world2026.data.Schedule
import com.juner.world2026.data.ScheduleDay
import com.juner.world2026.data.ScheduleMatch
import com.juner.world2026.data.WorldCupApi
import com.juner.world2026.data.WorldCupContent
import java.time.Duration
import java.time.Instant
import java.util.Locale

class MainActivity : Activity() {
    private enum class Section(val title: String) {
        Groups("小组赛"),
        Schedule("赛程"),
        Knockout("淘汰赛"),
        Overview("概览"),
    }

    private val api = WorldCupApi()
    private val handler = Handler(Looper.getMainLooper())
    private val predictions = mutableMapOf<String, MatchPrediction>()
    private val predictionLoadingKeys = mutableSetOf<String>()
    private var content: WorldCupContent? = null
    private var activeSection = Section.Groups
    private var activeScheduleDayIndex = 0
    private var countdownContainer: LinearLayout? = null
    private var countdownCompactText: TextView? = null
    private var contentScrollView: ScrollView? = null
    private val sectionViews = mutableMapOf<Section, View>()
    private var footerTitleText: TextView? = null
    private var footerUpdatedAtText: TextView? = null
    private var footerSourcesText: TextView? = null
    private var navButtons: Map<Section, Button> = emptyMap()
    private var githubButton: View? = null
    private var destroyed = false

    private val paper = Color.rgb(245, 243, 239)
    private val ink = Color.rgb(10, 10, 10)
    private val muted = Color.rgb(122, 117, 112)
    private val lime = Color.rgb(200, 255, 0)
    private val rule = Color.rgb(216, 212, 205)
    private val red = Color.rgb(232, 0, 13)

    private val countdownRunnable = object : Runnable {
        override fun run() {
            content?.hero?.openingDate?.let(::updateCountdown)
            handler.postDelayed(this, 1_000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showLoading()
        loadContent()
    }

    override fun onDestroy() {
        destroyed = true
        handler.removeCallbacks(countdownRunnable)
        super.onDestroy()
    }

    private fun loadContent() {
        showLoading()
        Thread {
            runCatching { loadBundledContent() }
                .onSuccess { loadedContent ->
                    runOnUiThread {
                        if (destroyed) return@runOnUiThread
                        showInitialContent(loadedContent)
                    }
                    refreshContentInBackground()
                }
                .onFailure { error ->
                    loadRemoteContentAfterBundledFailure(error)
                }
        }.start()
    }

    private fun showInitialContent(loadedContent: WorldCupContent) {
        content = loadedContent
        activeSection = Section.Groups
        activeScheduleDayIndex = 0
        predictions.clear()
        predictionLoadingKeys.clear()
        showContent(loadedContent, scrollToActiveSection = false)
    }

    private fun refreshContentInBackground() {
        runCatching { api.fetchContent() }
            .onSuccess { remoteContent ->
                runOnUiThread {
                    if (destroyed) return@runOnUiThread
                    val currentSection = activeSection
                    content = remoteContent
                    activeSection = currentSection
                    showContent(remoteContent, scrollToActiveSection = true)
                }
            }
    }

    private fun loadRemoteContentAfterBundledFailure(bundledError: Throwable) {
        runCatching { api.fetchContent() }
            .onSuccess { remoteContent ->
                runOnUiThread {
                    if (destroyed) return@runOnUiThread
                    showInitialContent(remoteContent)
                }
            }
            .onFailure { remoteError ->
                runOnUiThread {
                    if (destroyed) return@runOnUiThread
                    showError(remoteError.message ?: bundledError.message ?: "内容加载失败，请稍后重试。")
                }
            }
    }

    private fun loadBundledContent(): WorldCupContent =
        assets.open("data/worldcup2026.json").bufferedReader(Charsets.UTF_8).use { reader ->
            ContentJsonParser.parseWorldCupContent(reader.readText())
        }

    private fun showLoading() {
        handler.removeCallbacks(countdownRunnable)
        setContentView(statusLayout("正在加载 2026 世界杯数据...", showProgress = true))
    }

    private fun showError(message: String) {
        handler.removeCallbacks(countdownRunnable)
        val root = statusLayout("页面内容暂时无法加载。", showProgress = false)
        root.addView(text(message, size = 14f, color = muted, gravity = Gravity.CENTER).withMargins(top = 10))
        root.addView(primaryButton("重试").apply {
            setOnClickListener { loadContent() }
        }.withMargins(top = 22))
        root.addView(text("API: ${ApiConfig.contentUrl}", size = 11f, color = muted, gravity = Gravity.CENTER).withMargins(top = 18))
        setContentView(root)
    }

    private fun showContent(nextContent: WorldCupContent, scrollToActiveSection: Boolean = false) {
        handler.removeCallbacks(countdownRunnable)
        sectionViews.clear()

        val root = FrameLayout(this).apply {
            setBackgroundColor(paper)
        }

        val chrome = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = FrameLayout.LayoutParams(match, match)
        }

        val scrollView = ScrollView(this).apply {
            isFillViewport = true
            overScrollMode = View.OVER_SCROLL_IF_CONTENT_SCROLLS
            setOnScrollChangeListener { _, _, scrollY, _, _ ->
                updateActiveSectionFromScroll(scrollY)
            }
        }
        contentScrollView = scrollView

        val page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }

        page.addView(hero(nextContent))

        addSection(page, Section.Groups, groupsSection(nextContent.groups))
        addSection(page, Section.Schedule, scheduleSection(nextContent.schedule))
        addSection(page, Section.Knockout, knockoutSection(nextContent.knockout))
        addSection(page, Section.Overview, overviewSection(nextContent.overview, nextContent.predictions?.overall))
        page.addView(footer(nextContent))

        scrollView.addView(page)
        chrome.addView(ticker(nextContent.ticker))
        chrome.addView(scrollView, LinearLayout.LayoutParams(match, 0, 1f))
        chrome.addView(sectionNav())
        root.addView(chrome)

        val githubAction = githubButton()
        root.addView(githubAction)
        githubButton = githubAction

        setContentView(root)
        updateNavSelection()

        updateCountdown(nextContent.hero.openingDate)
        handler.postDelayed(countdownRunnable, 1_000)

        if (scrollToActiveSection) {
            scrollView.post { scrollToSection(activeSection, smooth = false) }
        } else {
            scrollView.post { updateActiveSectionFromScroll(scrollView.scrollY) }
        }
    }

    private fun addSection(page: LinearLayout, section: Section, view: View) {
        sectionViews[section] = view
        page.addView(view, LinearLayout.LayoutParams(match, wrap))
    }

    private fun ticker(items: List<String>): View {
        val textValue = buildString {
            repeat(3) {
                append(items.joinToString("   *   "))
                append("   *   ")
            }
        }

        return TextView(this).apply {
            text = textValue
            textSize = 11f
            typeface = Typeface.MONOSPACE
            setTextColor(lime)
            setBackgroundColor(ink)
            setSingleLine(true)
            ellipsize = TextUtils.TruncateAt.MARQUEE
            marqueeRepeatLimit = -1
            isSelected = true
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(18), 0, dp(18), 0)
        }.withHeight(dp(38))
    }

    private fun hero(content: WorldCupContent): View {
        val hero = content.hero
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(18), dp(18), dp(20))
            background = bordered(fill = paper, stroke = ink, strokeWidth = 0)
        }

        root.addView(text(hero.eyebrow, size = 10f, color = muted, typeface = Typeface.MONOSPACE).withMargins(bottom = 10))
        root.addView(text(hero.title.main.joinToString(" "), size = 42f, color = ink, typeface = black(), lineSpacing = 0.92f))
        root.addView(text(hero.title.year, size = 38f, color = ink, typeface = black()).withMargins(bottom = 12))

        val badges = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.START
        }
        hero.badges.forEach { badge ->
            badges.addView(
                pill(
                    badge.text,
                    fill = if (badge.highlighted) lime else paper,
                    stroke = if (badge.highlighted) lime else ink,
                    textColor = ink,
                ).withMargins(right = 8, bottom = 8),
            )
        }
        root.addView(wrapHorizontal(badges))

        content.predictions?.overall?.favorites?.take(3)?.takeIf { it.isNotEmpty() }?.let { favorites ->
            root.addView(heroFavorites(favorites).withMargins(top = 14))
        }

        root.addView(countdownPanel(hero.countdownLabel, hero.countdownSubtext).withMargins(top = 14))
        return root
    }

    private fun heroFavorites(favorites: List<PredictionFavorite>): View {
        val root = card(padding = 18, fill = Color.WHITE).apply {
            orientation = LinearLayout.VERTICAL
        }
        root.addView(text("AI FORECAST", size = 10f, color = muted, typeface = Typeface.MONOSPACE))
        root.addView(text("夺冠热门", size = 24f, color = ink, typeface = black()).withMargins(top = 4, bottom = 10))

        favorites.forEach { favorite ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
            }
            row.addView(text(favorite.rank, size = 16f, color = ink, typeface = black()), LinearLayout.LayoutParams(dp(38), wrap))
            row.addView(flagBadge(favorite.team.flagCode).withMargins(right = 10))
            row.addView(text(favorite.team.name, size = 16f, color = ink, typeface = bold()), LinearLayout.LayoutParams(0, wrap, 1f))
            row.addView(text("${favorite.probability}%", size = 18f, color = ink, typeface = black()))
            root.addView(row.withMargins(top = 6))
            root.addView(text(favorite.insight, size = 12f, color = muted).withMargins(left = 48, top = 1, bottom = 4))
        }
        return root
    }

    private fun countdownPanel(label: String, subtext: List<String>): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(match, wrap)
            setPadding(dp(12), dp(12), dp(12), dp(12))
            background = bordered(fill = ink, stroke = ink)
        }

        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        header.addView(text(label, size = 10f, color = Color.LTGRAY, typeface = Typeface.MONOSPACE), LinearLayout.LayoutParams(0, wrap, 1f))

        countdownCompactText = text("", size = 12f, color = lime, typeface = Typeface.MONOSPACE, gravity = Gravity.END)
        header.addView(countdownCompactText)
        root.addView(header.withMargins(bottom = 10))

        countdownContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        root.addView(countdownContainer)

        root.addView(text(subtext.joinToString(" · "), size = 11f, color = Color.LTGRAY, maxLines = 2).withMargins(top = 10))
        return root
    }

    private fun sectionNav(): View {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(dp(6), dp(8), dp(6), dp(8))
            setBackgroundColor(paper)
            elevation = dp(6).toFloat()
        }
        val buttons = mutableMapOf<Section, Button>()
        Section.entries.forEach { section ->
            val button = Button(this).apply {
                text = section.title
                textSize = 12f
                typeface = bold()
                isAllCaps = false
                setPadding(0, 0, 0, 0)
                minHeight = 0
                minimumHeight = 0
                setOnClickListener {
                    activeSection = section
                    updateNavSelection()
                    scrollToSection(section)
                }
            }
            buttons[section] = button
            row.addView(button, LinearLayout.LayoutParams(0, dp(50), 1f).apply {
                setMargins(dp(3), 0, dp(3), 0)
            })
        }
        navButtons = buttons
        return row
    }

    private fun githubButton(): View =
        ImageButton(this).apply {
            background = bordered(fill = ink, stroke = ink, radius = 3)
            setImageResource(R.drawable.ic_github)
            imageTintList = null
            scaleType = ImageView.ScaleType.CENTER
            setPadding(dp(10), dp(10), dp(10), dp(10))
            contentDescription = "Open GitHub project"
            elevation = dp(8).toFloat()
            setOnClickListener {
                startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/juner122king/world2026")),
                )
            }

            layoutParams = FrameLayout.LayoutParams(dp(46), dp(46), Gravity.TOP or Gravity.END).apply {
                topMargin = dp(48)
                rightMargin = dp(16)
            }

            setOnTouchListener { view, event ->
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        view.scaleX = 0.96f
                        view.scaleY = 0.96f
                    }
                    MotionEvent.ACTION_UP,
                    MotionEvent.ACTION_CANCEL,
                    -> {
                        view.scaleX = 1f
                        view.scaleY = 1f
                    }
                }
                false
            }

            setOnApplyWindowInsetsListener { view, insets ->
                (view.layoutParams as? FrameLayout.LayoutParams)?.let { params ->
                    params.topMargin = insets.systemWindowInsetTop + dp(12)
                    params.rightMargin = insets.systemWindowInsetRight + dp(12)
                    view.layoutParams = params
                }
                insets
            }
        }

    private fun updateNavSelection() {
        navButtons.forEach { (section, button) ->
            val selected = section == activeSection
            button.setTextColor(if (selected) ink else muted)
            button.background = bordered(fill = if (selected) lime else paper, stroke = ink, radius = 2)
        }
    }

    private fun scrollToSection(section: Section, smooth: Boolean = true) {
        val scrollView = contentScrollView ?: return
        val sectionView = sectionViews[section] ?: return
        val targetY = (sectionView.top - dp(8)).coerceAtLeast(0)
        if (smooth) {
            scrollView.smoothScrollTo(0, targetY)
        } else {
            scrollView.scrollTo(0, targetY)
        }
    }

    private fun updateActiveSectionFromScroll(scrollY: Int) {
        if (sectionViews.isEmpty()) return

        val threshold = scrollY + dp(72)
        val nextSection = Section.entries
            .filter { section -> (sectionViews[section]?.top ?: Int.MAX_VALUE) <= threshold }
            .lastOrNull()
            ?: Section.Groups

        if (nextSection != activeSection) {
            activeSection = nextSection
            updateNavSelection()
        }
    }

    private fun groupsSection(groups: List<Group>): View {
        val root = sectionRoot("01", "小组赛分组", "${groups.size} GROUPS · ${groups.size * 4} TEAMS")

        groups.forEach { group ->
            val card = card(padding = 16).apply {
                orientation = LinearLayout.VERTICAL
            }
            val head = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
            }
            head.addView(text(group.letter, size = 38f, color = ink, typeface = black()), LinearLayout.LayoutParams(dp(54), wrap))
            head.addView(text(group.label, size = 18f, color = ink, typeface = bold()), LinearLayout.LayoutParams(0, wrap, 1f))
            card.addView(head.withMargins(bottom = 10))

            group.teams.forEach { team ->
                card.addView(teamRow(team).withMargins(top = 8))
            }
            root.addView(card.withMargins(top = 12))
        }
        return root
    }

    private fun scheduleSection(schedule: Schedule): View {
        val root = sectionRoot("02", "小组赛赛程", "GROUP STAGE · JUN 11-27")

        if (schedule.days.isEmpty()) {
            root.addView(text("赛程暂未公布。", size = 14f, color = muted).withMargins(top = 12))
            return root
        }

        if (activeScheduleDayIndex !in schedule.days.indices) {
            activeScheduleDayIndex = 0
        }

        root.addView(scheduleDaySelector(schedule).withMargins(top = 8, bottom = 12))

        val day = schedule.days[activeScheduleDayIndex]
        val dayHead = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        dayHead.addView(text(day.day, size = 36f, color = ink, typeface = black()).withMargins(right = 12))
        dayHead.addView(text("${day.month} · ${day.weekday}", size = 16f, color = ink, typeface = bold()), LinearLayout.LayoutParams(0, wrap, 1f))
        day.badge?.let { dayHead.addView(pill(it, fill = lime, stroke = lime, textColor = ink)) }
        root.addView(dayHead.withMargins(top = 8, bottom = 6))

        day.matches.forEach { match ->
            root.addView(matchCard(day, match).withMargins(top = 10))
        }
        root.addView(text(schedule.note, size = 12f, color = muted).withMargins(top = 20, bottom = 12))
        return root
    }

    private fun scheduleDaySelector(schedule: Schedule): View {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        schedule.days.forEachIndexed { index, day ->
            val selected = index == activeScheduleDayIndex
            val label = buildString {
                append(day.day)
                append("\n")
                append(day.month)
                append(" · ")
                append(day.weekday)
                day.badge?.let {
                    append("\n")
                    append(it)
                }
            }
            val chip = text(
                value = label,
                size = 11f,
                color = ink,
                typeface = if (selected) bold() else Typeface.MONOSPACE,
                gravity = Gravity.CENTER,
                lineSpacing = 1.05f,
            ).apply {
                setPadding(dp(14), dp(8), dp(14), dp(8))
                background = bordered(fill = if (selected) lime else paper, stroke = ink, radius = 2)
                minWidth = dp(88)
                setOnClickListener {
                    activeScheduleDayIndex = index
                    rebuildScheduleSection()
                }
            }
            row.addView(chip.withMargins(right = 8))
        }

        return HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            addView(row)
        }
    }

    private fun rebuildScheduleSection() {
        val currentContent = content ?: return
        val oldScheduleView = sectionViews[Section.Schedule] ?: return
        val parent = oldScheduleView.parent as? LinearLayout ?: return
        val index = parent.indexOfChild(oldScheduleView)
        val newScheduleView = scheduleSection(currentContent.schedule)

        parent.removeViewAt(index)
        parent.addView(newScheduleView, index, LinearLayout.LayoutParams(match, wrap))
        sectionViews[Section.Schedule] = newScheduleView
        contentScrollView?.post {
            scrollToSection(Section.Schedule, smooth = false)
            activeSection = Section.Schedule
            updateNavSelection()
        }
    }

    private fun matchCard(day: ScheduleDay, match: ScheduleMatch): View {
        val matchKey = api.createMatchPredictionKey(day, match)
        val card = card(padding = 14, fill = Color.WHITE).apply {
            orientation = LinearLayout.VERTICAL
        }

        val meta = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        meta.addView(pill(match.time, fill = lime, stroke = lime, textColor = ink).withMargins(right = 8))
        meta.addView(text(match.group, size = 13f, color = ink, typeface = bold()), LinearLayout.LayoutParams(0, wrap, 1f))
        card.addView(meta)

        card.addView(text(match.venue.joinToString("\n"), size = 12f, color = muted, lineSpacing = 1.2f).withMargins(top = 8, bottom = 12))

        card.addView(matchTeamRow(match.home, "主队"))
        card.addView(text("VS", size = 12f, color = muted, typeface = bold(), gravity = Gravity.CENTER).withMargins(top = 6, bottom = 6))
        card.addView(matchTeamRow(match.away, "客队"))

        val predictionPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        card.addView(predictionPanel.withMargins(top = 12))
        renderPredictionPanel(predictionPanel, day, match, matchKey)
        return card
    }

    private fun matchTeamRow(team: GroupTeam, sideLabel: String): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(8), 0, dp(8))
            background = bordered(fill = paper, stroke = rule, strokeWidth = 1, radius = 2)
            addView(flagBadge(team.flagCode).withMargins(left = 10, right = 10))
            addView(
                text(team.name, size = 19f, color = ink, typeface = bold(), maxLines = 2),
                LinearLayout.LayoutParams(0, wrap, 1f),
            )
            addView(text(sideLabel, size = 11f, color = muted, typeface = Typeface.MONOSPACE).withMargins(left = 8, right = 10))
        }

    private fun renderPredictionPanel(panel: LinearLayout, day: ScheduleDay, match: ScheduleMatch, matchKey: String) {
        panel.removeAllViews()
        val existingPrediction = predictions[matchKey]
        val isLoading = predictionLoadingKeys.contains(matchKey)

        val buttonText = when {
            existingPrediction != null -> "预测已生成"
            isLoading -> "生成中..."
            else -> "生成本场预测"
        }

        panel.addView(primaryButton(buttonText).apply {
            isEnabled = existingPrediction == null && !isLoading
            alpha = if (isEnabled) 1f else 0.72f
            setOnClickListener {
                requestPrediction(panel, day, match, matchKey)
            }
        })

        existingPrediction?.let { prediction ->
            panel.addView(predictionResult(prediction, match).withMargins(top = 12))
        }
    }

    private fun requestPrediction(panel: LinearLayout, day: ScheduleDay, match: ScheduleMatch, matchKey: String) {
        predictionLoadingKeys.add(matchKey)
        renderPredictionPanel(panel, day, match, matchKey)

        Thread {
            runCatching { api.fetchMatchPrediction(day, match) }
                .onSuccess { prediction ->
                    runOnUiThread {
                        if (destroyed) return@runOnUiThread
                        predictionLoadingKeys.remove(matchKey)
                        predictions[matchKey] = prediction
                        renderPredictionPanel(panel, day, match, matchKey)
                    }
                }
                .onFailure { error ->
                    runOnUiThread {
                        if (destroyed) return@runOnUiThread
                        predictionLoadingKeys.remove(matchKey)
                        renderPredictionPanel(panel, day, match, matchKey)
                        panel.addView(text(error.message ?: "预测暂时不可用。", size = 12f, color = red).withMargins(top = 8))
                    }
                }
        }.start()
    }

    private fun predictionResult(prediction: MatchPrediction, match: ScheduleMatch): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), dp(12), dp(12), dp(12))
            background = bordered(fill = paper, stroke = rule)
        }
        root.addView(text("AI 结论 · ${prediction.summary}", size = 14f, color = ink, typeface = bold()))
        root.addView(text("置信度 · ${prediction.confidence} · ${prediction.status}", size = 11f, color = muted).withMargins(top = 4, bottom = 10))
        root.addView(text("模型 · ${prediction.modelVersion} · 基线 · ${prediction.basisUpdatedAt}", size = 10f, color = muted, typeface = Typeface.MONOSPACE).withMargins(bottom = 10))
        root.addView(probabilityRow(match.home.name, match.home.flagCode, prediction.probabilities.home).withMargins(top = 4))
        root.addView(probabilityRow("平局", value = prediction.probabilities.draw).withMargins(top = 6))
        root.addView(probabilityRow(match.away.name, match.away.flagCode, prediction.probabilities.away).withMargins(top = 6, bottom = 6))
        prediction.reasoning.forEach { reason ->
            root.addView(text("- $reason", size = 12f, color = muted).withMargins(top = 6))
        }
        return root
    }

    private fun probabilityRow(label: String, flagCode: String? = null, value: Int): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            flagCode?.let { addView(flagBadge(it).withMargins(right = 8)) }
            addView(text(label, size = 12f, color = ink, typeface = bold(), maxLines = 1), LinearLayout.LayoutParams(0, wrap, 1f))
            addView(text("$value%", size = 13f, color = ink, typeface = Typeface.MONOSPACE, gravity = Gravity.END), LinearLayout.LayoutParams(dp(52), wrap))
        }

    private fun knockoutSection(knockout: Knockout): View {
        val root = sectionRoot("03", "淘汰赛路径", "ROUND OF 32 · FINAL")

        knockout.stages.forEach { stage ->
            val card = card(padding = 16, fill = Color.WHITE).apply {
                orientation = LinearLayout.VERTICAL
            }
            card.addView(text(stage.name, size = 22f, color = ink, typeface = black()))
            card.addView(text("${stage.date} · ${stage.stat}", size = 12f, color = muted, typeface = Typeface.MONOSPACE).withMargins(top = 4))
            card.addView(text(stage.label, size = 15f, color = ink, typeface = bold()).withMargins(top = 10))
            stage.description.forEach { card.addView(text(it, size = 13f, color = muted).withMargins(top = 6)) }
            root.addView(card.withMargins(top = 12))
        }

        root.addView(finalCard("决赛场馆", knockout.venue).withMargins(top = 16))
        root.addView(card(padding = 18, fill = ink).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            addView(text(knockout.center.trophy, size = 36f, color = lime, gravity = Gravity.CENTER))
            addView(text(knockout.center.title.joinToString("\n"), size = 26f, color = lime, typeface = black(), gravity = Gravity.CENTER).withMargins(top = 8))
            addView(text(knockout.center.date, size = 13f, color = Color.LTGRAY, gravity = Gravity.CENTER).withMargins(top = 8))
        }.withMargins(top = 12))
        root.addView(finalCard("赛制", knockout.format).withMargins(top = 12))
        return root
    }

    private fun finalCard(fallbackTitle: String, finalCard: KnockoutFinalCard): View {
        val root = card(padding = 16, fill = Color.WHITE).apply {
            orientation = LinearLayout.VERTICAL
        }
        root.addView(text(finalCard.eyebrow.ifBlank { fallbackTitle }, size = 10f, color = muted, typeface = Typeface.MONOSPACE))
        root.addView(text(finalCard.title.joinToString("\n"), size = 24f, color = ink, typeface = black()).withMargins(top = 8))
        finalCard.detail.forEach { root.addView(text(it, size = 13f, color = muted).withMargins(top = 6)) }
        return root
    }

    private fun overviewSection(overview: com.juner.world2026.data.Overview, overall: OverallPredictionSummary?): View {
        val root = sectionRoot("04", "赛事概览", "FIFA WC 2026")

        val statsGrid = GridLayout(this).apply {
            columnCount = 2
            layoutParams = LinearLayout.LayoutParams(match, wrap)
        }
        overview.stats.forEach { stat ->
            val cell = card(padding = 14, fill = Color.WHITE).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                addView(text(stat.value, size = 30f, color = ink, typeface = black(), gravity = Gravity.CENTER))
                addView(text(stat.label, size = 12f, color = muted, gravity = Gravity.CENTER).withMargins(top = 4))
            }
            statsGrid.addView(cell, GridLayout.LayoutParams().apply {
                width = 0
                height = wrap
                columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f)
                setMargins(dp(4), dp(4), dp(4), dp(4))
            })
        }
        root.addView(statsGrid.withMargins(top = 12))

        overview.hosts.forEach { host -> root.addView(hostCard(host).withMargins(top = 10)) }
        overall?.let { root.addView(overallPredictionSection(it).withMargins(top = 16)) }
        root.addView(favoritesSection(overview.favoritesTitle, overview.favorites).withMargins(top = 16))
        return root
    }

    private fun hostCard(host: HostSummary): View {
        val root = card(padding = 16, fill = Color.WHITE).apply {
            orientation = LinearLayout.VERTICAL
        }
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(flagBadge(host.flagCode).withMargins(right = 10))
            addView(text(host.name, size = 18f, color = ink, typeface = bold()))
        }
        root.addView(row)
        host.detail.forEach { root.addView(text(it, size = 13f, color = muted).withMargins(top = 6)) }
        return root
    }

    private fun overallPredictionSection(overall: OverallPredictionSummary): View {
        val root = card(padding = 16, fill = Color.WHITE).apply {
            orientation = LinearLayout.VERTICAL
        }
        root.addView(text("AI 夺冠机率总览", size = 24f, color = ink, typeface = black()))
        root.addView(text("生成时间 · ${overall.generatedAt}\n内容基线 · ${overall.basisUpdatedAt}\n状态 · ${overall.status}", size = 11f, color = muted).withMargins(top = 8))
        root.addView(text(overall.disclaimer, size = 12f, color = muted).withMargins(top = 10, bottom = 6))
        overall.favorites.forEach { favorite ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(text(favorite.rank, size = 16f, color = ink, typeface = black()), LinearLayout.LayoutParams(dp(44), wrap))
                addView(flagBadge(favorite.team.flagCode).withMargins(right = 8))
                addView(text(favorite.team.name, size = 15f, color = ink, typeface = bold()), LinearLayout.LayoutParams(0, wrap, 1f))
                addView(text("${favorite.probability}%", size = 16f, color = ink, typeface = black()))
            }
            root.addView(row.withMargins(top = 10))
            root.addView(text(favorite.insight, size = 12f, color = muted).withMargins(left = 52, top = 2))
        }
        return root
    }

    private fun favoritesSection(title: String, favorites: List<Favorite>): View {
        val root = card(padding = 16, fill = Color.WHITE).apply {
            orientation = LinearLayout.VERTICAL
        }
        root.addView(text(title, size = 22f, color = ink, typeface = black()).withMargins(bottom = 6))
        favorites.forEach { favorite ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(text(favorite.rank, size = 15f, color = ink, typeface = black()), LinearLayout.LayoutParams(dp(40), wrap))
                addView(flagBadge(favorite.flagCode).withMargins(right = 8))
                addView(text(favorite.name, size = 14f, color = ink, typeface = bold()), LinearLayout.LayoutParams(0, wrap, 1f))
                addView(text(favorite.odds, size = 13f, color = muted, typeface = Typeface.MONOSPACE))
            }
            root.addView(row.withMargins(top = 10))
            root.addView(text(favorite.group, size = 11f, color = muted).withMargins(left = 48, top = 2))
        }
        return root
    }

    private fun footer(content: WorldCupContent): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(18), dp(22), dp(28))
            setBackgroundColor(ink)

            footerTitleText = text(content.meta.title, size = 18f, color = lime, typeface = black())
            footerUpdatedAtText = text("", size = 12f, color = Color.LTGRAY).withMargins(top = 8)
            footerSourcesText = text("", size = 12f, color = Color.LTGRAY).withMargins(top = 4)

            addView(footerTitleText)
            addView(footerUpdatedAtText)
            addView(footerSourcesText)
            updateFooter(content)
        }

    private fun updateFooter(content: WorldCupContent) {
        footerTitleText?.text = content.meta.title
        footerUpdatedAtText?.text = "更新时间 · ${content.meta.updatedAt}"
        footerSourcesText?.text = "来源 · ${content.meta.sources.joinToString(" / ")}"
    }

    private fun updateCountdown(openingDate: String) {
        val container = countdownContainer ?: return
        val compact = countdownCompactText ?: return
        val now = Instant.now()
        val opening = runCatching { Instant.parse(openingDate) }.getOrNull()
        container.removeAllViews()

        if (opening == null) {
            container.addView(countdownStatusCard("等待刷新", "TIME TBC"))
            compact.text = "TIME TBC"
            return
        }

        val duration = Duration.between(now, opening)
        if (duration.isNegative || duration.isZero) {
            container.addView(countdownStatusCard("已开赛", "LIVE NOW"))
            compact.text = "LIVE NOW"
            return
        }

        val totalSeconds = duration.seconds
        val days = totalSeconds / 86_400
        val hours = totalSeconds % 86_400 / 3_600
        val minutes = totalSeconds % 3_600 / 60
        val seconds = totalSeconds % 60
        val availableWidth = resources.displayMetrics.widthPixels - dp(60)
        val useFourColumns = availableWidth >= dp(360)
        val columns = if (useFourColumns) 4 else 2
        val valueSize = if (useFourColumns) 27f else 32f
        val grid = GridLayout(this).apply {
            columnCount = columns
            layoutParams = LinearLayout.LayoutParams(match, wrap)
        }
        listOf(
            "天" to days.toString(),
            "时" to hours.toString().padStart(2, '0'),
            "分" to minutes.toString().padStart(2, '0'),
            "秒" to seconds.toString().padStart(2, '0'),
        ).forEach { (label, value) ->
            val cell = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                minimumHeight = dp(if (useFourColumns) 76 else 86)
                setPadding(dp(8), dp(10), dp(8), dp(8))
                background = bordered(fill = Color.rgb(24, 24, 24), stroke = lime)
                addView(text(value, size = valueSize, color = lime, typeface = black(), gravity = Gravity.CENTER, maxLines = 1))
                addView(text(label, size = 11f, color = Color.LTGRAY, typeface = bold(), gravity = Gravity.CENTER).withMargins(top = 3))
            }
            grid.addView(cell, GridLayout.LayoutParams().apply {
                width = 0
                height = wrap
                columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f)
                setMargins(dp(3), dp(3), dp(3), dp(3))
            })
        }
        container.addView(grid)
        compact.text = String.format(Locale.ROOT, "%d天 %02d:%02d:%02d", days, hours, minutes, seconds)
    }

    private fun countdownStatusCard(title: String, subtitle: String): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            minimumHeight = dp(92)
            setPadding(dp(12), dp(14), dp(12), dp(14))
            background = bordered(fill = Color.rgb(24, 24, 24), stroke = lime)
            addView(text(title, size = 32f, color = lime, typeface = black(), gravity = Gravity.CENTER, maxLines = 1))
            addView(text(subtitle, size = 11f, color = Color.LTGRAY, typeface = Typeface.MONOSPACE, gravity = Gravity.CENTER).withMargins(top = 6))
        }

    private fun sectionRoot(index: String, title: String, count: String): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(20), dp(18), dp(24))
            addView(text(index, size = 11f, color = muted, typeface = Typeface.MONOSPACE))
            addView(text(title, size = 30f, color = ink, typeface = black()).withMargins(top = 4))
            addView(text(count, size = 11f, color = muted, typeface = Typeface.MONOSPACE).withMargins(top = 4, bottom = 10))
        }

    private fun statusLayout(message: String, showProgress: Boolean): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(28), dp(28), dp(28))
            setBackgroundColor(paper)
            if (showProgress) {
                addView(ProgressBar(this@MainActivity).withMargins(bottom = 18))
            }
            addView(text(message, size = 24f, color = ink, typeface = black(), gravity = Gravity.CENTER))
        }

    private fun teamRow(team: GroupTeam): View {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        row.addView(flagBadge(team.flagCode).withMargins(right = 10))
        row.addView(text(team.name + if (team.champion) "  冠军" else "", size = 16f, color = ink, typeface = bold()), LinearLayout.LayoutParams(0, wrap, 1f))
        if (team.debut) row.addView(pill("首秀", fill = lime, stroke = lime, textColor = ink))
        return row
    }

    private fun teamInline(team: GroupTeam): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            addView(flagBadge(team.flagCode).withMargins(right = 6))
            addView(text(team.name, size = 13f, color = ink, typeface = bold(), maxLines = 2))
        }

    private fun flagBadge(code: String): TextView =
        text(flagIcon(code), size = 18f, color = ink, typeface = Typeface.DEFAULT, gravity = Gravity.CENTER, maxLines = 1).apply {
            minWidth = dp(28)
            setPadding(dp(2), dp(1), dp(2), dp(1))
        }

    private fun flagIcon(code: String): String {
        val normalized = code.lowercase(Locale.ROOT)
        return when (normalized) {
            "gb-eng" -> "\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F"
            "gb-sct" -> "\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F"
            "gb-wls" -> "\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73\uDB40\uDC7F"
            else -> {
                val countryCode = normalized
                    .substringBefore('-')
                    .takeIf { it.length == 2 && it.all(Char::isLetter) }
                    ?: return code.uppercase(Locale.ROOT)

                countryCode
                    .uppercase(Locale.ROOT)
                    .map { char -> Character.toChars(0x1F1E6 + (char.code - 'A'.code)).concatToString() }
                    .joinToString("")
            }
        }
    }

    private fun pill(label: String, fill: Int, stroke: Int, textColor: Int): TextView =
        text(label, size = 11f, color = textColor, typeface = Typeface.MONOSPACE, gravity = Gravity.CENTER).apply {
            setPadding(dp(10), dp(6), dp(10), dp(6))
            background = bordered(fill = fill, stroke = stroke, radius = 2)
        }

    private fun primaryButton(label: String): Button =
        Button(this).apply {
            layoutParams = LinearLayout.LayoutParams(match, dp(48))
            text = label
            textSize = 13f
            typeface = bold()
            isAllCaps = false
            setTextColor(ink)
            setPadding(dp(14), 0, dp(14), 0)
            minHeight = 0
            minimumHeight = 0
            background = bordered(fill = lime, stroke = ink, radius = 2)
        }

    private fun card(padding: Int, fill: Int = paper): LinearLayout =
        LinearLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(match, wrap)
            setPadding(dp(padding), dp(padding), dp(padding), dp(padding))
            background = bordered(fill = fill, stroke = ink, radius = 3)
        }

    private fun wrapHorizontal(child: View): HorizontalScrollView =
        HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            addView(child)
        }

    private fun text(
        value: String,
        size: Float,
        color: Int,
        typeface: Typeface = Typeface.DEFAULT,
        gravity: Int = Gravity.START,
        lineSpacing: Float = 1.12f,
        maxLines: Int = Int.MAX_VALUE,
    ): TextView =
        TextView(this).apply {
            text = value
            textSize = size
            setTextColor(color)
            this.typeface = typeface
            this.gravity = gravity
            includeFontPadding = true
            setLineSpacing(0f, lineSpacing)
            this.maxLines = maxLines
            if (maxLines == 1) {
                ellipsize = TextUtils.TruncateAt.END
            }
        }

    private fun bordered(fill: Int, stroke: Int, strokeWidth: Int = 2, radius: Int = 0): GradientDrawable =
        GradientDrawable().apply {
            setColor(fill)
            setStroke(dp(strokeWidth), stroke)
            cornerRadius = dp(radius).toFloat()
        }

    private fun black(): Typeface = Typeface.create("sans-serif-black", Typeface.NORMAL)

    private fun bold(): Typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)

    private fun View.withHeight(height: Int): View =
        apply { layoutParams = LinearLayout.LayoutParams(match, height) }

    private fun <T : View> T.withMargins(
        left: Int = 0,
        top: Int = 0,
        right: Int = 0,
        bottom: Int = 0,
    ): T =
        apply {
            val params = layoutParams as? ViewGroup.MarginLayoutParams ?: LinearLayout.LayoutParams(wrap, wrap)
            params.setMargins(dp(left), dp(top), dp(right), dp(bottom))
            layoutParams = params
        }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private companion object {
        const val match = ViewGroup.LayoutParams.MATCH_PARENT
        const val wrap = ViewGroup.LayoutParams.WRAP_CONTENT
    }
}
