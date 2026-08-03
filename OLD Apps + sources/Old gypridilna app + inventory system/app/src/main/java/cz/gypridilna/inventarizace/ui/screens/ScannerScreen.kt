package cz.gypridilna.inventarizace.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import cz.gypridilna.inventarizace.navigation.Screen
import cz.gypridilna.inventarizace.ui.InventoryViewModel
import cz.gypridilna.inventarizace.ui.components.CameraView

@Composable
fun ScannerScreen(viewModel: InventoryViewModel = viewModel(), navController: NavController) {
    val context = LocalContext.current
    var hasCamPermission by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted ->
            hasCamPermission = granted
        }
    )
    LaunchedEffect(key1 = true) {
        launcher.launch(Manifest.permission.CAMERA)
    }

    val items by viewModel.inventoryItems.collectAsState()

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        if (hasCamPermission) {
            CameraView(
                modifier = Modifier.fillMaxSize(),
                onBarcodeScanned = { barcode ->
                    val item = items.find { it.id?.endsWith(barcode) == true }
                    item?.id?.let { navController.navigate(Screen.Profile.createRoute(it)) }
                }
            )
        } else {
            Text("Camera permission required")
        }
    }
}
