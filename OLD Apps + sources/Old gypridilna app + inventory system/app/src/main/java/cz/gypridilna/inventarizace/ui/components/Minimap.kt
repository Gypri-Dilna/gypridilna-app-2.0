package cz.gypridilna.inventarizace.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import cz.gypridilna.inventarizace.data.entities.InventoryItem

// Simplified data class for hotspots
data class Hotspot( 
    val xPercent: Float,
    val yPercent: Float,
    val activationRule: (InventoryItem) -> Boolean
)

@Composable
fun Minimap(item: InventoryItem, modifier: Modifier = Modifier) {
    val activeColor = MaterialTheme.colorScheme.primary
    val outlineColor = MaterialTheme.colorScheme.onSurface

    // Define all hotspots based on your sketch and the new layout
    // Positions are now scaled to the new, accurate room dimensions.
    val hotspots = listOf(
        Hotspot(0.08f, 0.6f) { it.rack == "5" },
        Hotspot(0.25f, 0.2f) { it.rack == "6" && it.position in listOf("1", "2") },
        Hotspot(0.40f, 0.2f) { it.rack == "6" && it.position in listOf("3", "4", "5") },
        Hotspot(0.55f, 0.2f) { it.rack == "6" && it.position in listOf("6", "7") },
        Hotspot(0.80f, 0.15f) { it.rack == "1" },
        Hotspot(0.90f, 0.15f) { it.rack == "2" },
        Hotspot(0.85f, 0.15f) { it.rack == "4" }, // Rack 4 is between 1 and 2
        Hotspot(0.90f, 0.8f) { it.rack == "3" },
    )

    // Animation for the pulsing effect
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )
    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseRadius"
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1450f / 280f) // Set aspect ratio from your dimensions
    ) { 
        val canvasWidth = size.width
        val canvasHeight = size.height

        // Define scaling factors based on your provided dimensions
        val totalWidthCm = 1450f
        val leftHeightCm = 260f
        val rightHeightCm = 280f

        // Create the accurate path for the workshop outline
        val path = Path().apply {
            moveTo(0f, 0f) // Top-left
            lineTo(canvasWidth, 0f) // Top-right
            lineTo(canvasWidth, canvasHeight) // Bottom-right
            lineTo(950f / totalWidthCm * canvasWidth, canvasHeight) // Start of cutout, right side
            lineTo(950f / totalWidthCm * canvasWidth, 85f / rightHeightCm * canvasHeight) // Move up to top of cutout
            lineTo(900f / totalWidthCm * canvasWidth, 85f / rightHeightCm * canvasHeight) // Move left to inner corner
            lineTo(900f / totalWidthCm * canvasWidth, leftHeightCm / rightHeightCm * canvasHeight) // Move down to bottom of left wall
            lineTo(0f, leftHeightCm / rightHeightCm * canvasHeight) // Bottom-left
            close() // Close path back to top-left
        }

        // Draw the workshop outline
        drawPath(path, color = outlineColor, style = Stroke(width = 2.dp.toPx()))

        // Find and draw only the active hotspot
        val activeHotspot = hotspots.find { it.activationRule(item) }
        if (activeHotspot != null) {
            val centerX = activeHotspot.xPercent * canvasWidth
            val centerY = activeHotspot.yPercent * canvasHeight
            val radius = canvasWidth * 0.04f // Smaller radius

            // Draw the pulsing outer circle
            drawCircle(
                color = activeColor.copy(alpha = pulseAlpha),
                radius = radius * pulseRadius,
                center = Offset(centerX, centerY)
            )
            
            // Draw the solid inner circle
            drawCircle(
                color = activeColor,
                radius = radius,
                center = Offset(centerX, centerY)
            )
        }
    }
}
