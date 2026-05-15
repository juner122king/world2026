package com.juner.world2026

import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import com.juner.world2026.config.ApiConfig

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "World Cup 2026"
            textSize = 28f
            gravity = Gravity.CENTER
        }

        val subtitle = TextView(this).apply {
            text = "API: ${ApiConfig.baseUrl}"
            textSize = 14f
            gravity = Gravity.CENTER
        }

        root.addView(title)
        root.addView(subtitle)
        setContentView(root)
    }
}
