package cz.gypridilna.inventarizace

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import cz.gypridilna.inventarizace.navigation.AppNavigation
import cz.gypridilna.inventarizace.ui.theme.GypriDilnaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        installSplashScreen()
        enableEdgeToEdge()
        setContent {
            GypriDilnaTheme {
                AppNavigation()
            }
        }
    }
}
