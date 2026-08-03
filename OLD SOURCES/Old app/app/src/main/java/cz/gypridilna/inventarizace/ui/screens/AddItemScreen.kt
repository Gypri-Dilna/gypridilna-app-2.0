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
import cz.gypridilna.inventarizace.BuildConfig

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AddItemScreen() {
    val url = BuildConfig.GOOGLE_FORM_URL
    AndroidView(factory = {
        WebView(it).apply {
            // Match app theme background
            setBackgroundColor(Color.parseColor("#2F353E"))
            
            webViewClient = WebViewClient()
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            
            // Force Dark Mode for WebView
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                settings.isAlgorithmicDarkeningAllowed = true
            }
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                WebSettingsCompat.setForceDark(settings, WebSettingsCompat.FORCE_DARK_ON)
            }
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
                WebSettingsCompat.setForceDarkStrategy(
                    settings, 
                    WebSettingsCompat.DARK_STRATEGY_USER_AGENT_DARKENING_ONLY
                )
            }
            
            loadUrl(url)
        }
    })
}
