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

private const val CONNECT_URL = "https://connect.prusa3d.com/"
// A standard Chrome user agent to bypass the 'disallowed_useragent' error
private const val CHROME_USER_AGENT = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun ConnectScreen() {
    AndroidView(factory = {
        WebView(it).apply {
            setBackgroundColor(Color.parseColor("#2F353E"))
            
            webViewClient = WebViewClient()
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                // Spoof the User Agent to bypass Google's WebView block
                userAgentString = CHROME_USER_AGENT
            }
            
            // Dark mode support
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
            
            loadUrl(CONNECT_URL)
        }
    })
}
