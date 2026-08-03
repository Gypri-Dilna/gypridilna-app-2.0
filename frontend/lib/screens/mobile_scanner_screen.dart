import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import 'item_detail_screen.dart';

class MobileScannerScreen extends StatefulWidget {
  const MobileScannerScreen({super.key});

  @override
  State<MobileScannerScreen> createState() => _MobileScannerScreenState();
}

class _MobileScannerScreenState extends State<MobileScannerScreen> {
  final MobileScannerController controller = MobileScannerController();
  bool isProcessing = false;

  void _onDetect(BarcodeCapture capture) async {
    if (isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? rawValue = barcodes.first.rawValue;
    if (rawValue == null || rawValue.isEmpty) return;

    setState(() => isProcessing = true);

    try {
      // Extract item ID or code (handling GD:INV:<UUID> or XY-ZAAA format)
      String cleanCode = rawValue.trim();
      if (cleanCode.startsWith('GD:INV:')) {
        cleanCode = cleanCode.replaceFirst('GD:INV:', '');
      }

      final item = await ApiService.getInventoryItem(cleanCode);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Item Found: ${item.name} (${item.itemCode})'),
          backgroundColor: AppColors.statusGranted,
        ),
      );

      // Instant auto-navigation to item detail page!
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => ItemDetailScreen(item: item)),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Scanned: $rawValue - Item not found in database'),
            backgroundColor: AppColors.statusDenied,
          ),
        );
      }
    } finally {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => isProcessing = false);
      });
    }
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MOBILE QR SCANNER'),
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: controller,
              builder: (context, state, child) {
                switch (state.torchState) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: AppColors.cloudPaperMuted);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: AppColors.circuitMint);
                }
              },
            ),
            onPressed: () => controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _onDetect,
          ),
          // Scanner Overlay Target Frame
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(
                  color: isProcessing ? AppColors.statusGranted : AppColors.circuitMint,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: (isProcessing ? AppColors.statusGranted : AppColors.circuitMint).withOpacity(0.3),
                    blurRadius: 16,
                    spreadRadius: 4,
                  ),
                ],
              ),
            ),
          ),
          // Helper Instructions Box
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.graphiteCoreSurface.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.graphiteCoreBorder),
              ),
              child: Column(
                children: [
                  const Text(
                    'POINT CAMERA AT ITEM QR CODE',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.cloudPaper),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isProcessing ? 'Processing scan...' : 'Align printed 18mm Brother QR label inside frame',
                    style: const TextStyle(fontSize: 12, color: AppColors.cloudPaperMuted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
