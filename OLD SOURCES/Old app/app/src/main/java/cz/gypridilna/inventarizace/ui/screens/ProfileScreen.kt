package cz.gypridilna.inventarizace.ui.screens

import android.content.Context
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import cz.gypridilna.inventarizace.data.entities.InventoryItem
import cz.gypridilna.inventarizace.ui.InventoryViewModel
import cz.gypridilna.inventarizace.ui.components.Minimap

@Composable
fun ProfileScreen(itemId: String?, viewModel: InventoryViewModel = viewModel()) {
    val items by viewModel.inventoryItems.collectAsState()
    val item = items.find { it.id == itemId }

    if (item != null) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Section A: Basic Info
            Text(
                text = item.name ?: "N/A",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(text = "ID: ${item.id ?: "N/A"}", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
            Text(text = "Barcode: ${item.barcode ?: "N/A"}", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
            Text(
                text = "Rack: ${item.rack ?: "-"} | Pozice: ${item.position ?: "-"} | Box: ${item.box ?: "-"}",
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Section B: Minimap
            Minimap(item = item)

            Spacer(modifier = Modifier.height(16.dp))

            // Section C: Placement Picture
            val context = LocalContext.current
            val imageResId = getLocalImageResId(context, item)

            Image(
                painter = painterResource(id = imageResId),
                contentDescription = "Obrázek umístění",
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop
            )
        }
    } else {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }
}

private fun getLocalImageResId(context: Context, item: InventoryItem): Int {
    val rack = item.rack
    val position = item.position
    if (rack == null) return android.R.drawable.ic_menu_report_image

    val imageName = when (rack) {
        "1", "2", "3" -> "loc_$rack"
        else -> {
            if (position == null) return android.R.drawable.ic_menu_report_image
            "loc_${rack}${position}"
        }
    }

    val resourceId = context.resources.getIdentifier(imageName, "drawable", context.packageName)

    // Return the found resource ID, or the fallback image if not found
    return if (resourceId == 0) {
        android.R.drawable.ic_menu_report_image
    } else {
        resourceId
    }
}
