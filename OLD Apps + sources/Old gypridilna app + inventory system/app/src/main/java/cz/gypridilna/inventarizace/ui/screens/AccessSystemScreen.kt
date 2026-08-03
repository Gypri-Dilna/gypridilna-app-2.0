package cz.gypridilna.inventarizace.ui.screens

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Build
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

private const val ACCESS_SYSTEM_URL = "http://sshdilna.playit.plus:1226/"

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AccessSystemScreen() {
    AndroidView(factory = {
        WebView(it).apply {
            // Match app theme background to avoid white flashes
            setBackgroundColor(Color.parseColor("#2F353E"))
            
            webViewClient = WebViewClient()
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            
            // 1. For Android 13+, allow algorithmic darkening
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                settings.isAlgorithmicDarkeningAllowed = true
            }
            
            // 2. Enable Force Dark
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                WebSettingsCompat.setForceDark(settings, WebSettingsCompat.FORCE_DARK_ON)
            }
            
            // 3. Prefer the website's own dark theme if it exists
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
                WebSettingsCompat.setForceDarkStrategy(
                    settings, 
                    WebSettingsCompat.DARK_STRATEGY_PREFER_WEB_THEME_OVER_USER_AGENT_DARKENING
                )
            }
            
            loadUrl(ACCESS_SYSTEM_URL)
        }
    })
}
