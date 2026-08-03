package cz.gypridilna.inventarizace.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = CircuitMint, // The main accent color for interactive elements
    background = GraphiteCore, // The darkest color for the main screen background
    surface = GraphiteCoreSurface, // A slightly lighter grey for elevated surfaces like Cards and Nav Bar
    onPrimary = GraphiteCore, // Text color on top of primary elements (e.g., buttons)
    onBackground = CloudPaper, // Color for text on the main background
    onSurface = CloudPaper // Color for text on elevated surfaces
)

@Composable
fun GypriDilnaTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}
