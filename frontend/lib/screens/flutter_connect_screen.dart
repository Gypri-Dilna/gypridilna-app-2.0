import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class FlutterConnectScreen extends StatelessWidget {
  const FlutterConnectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'FLUTTERCONNECT WEBVIEW MODULE',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(letterSpacing: 1.2),
          ),
          const SizedBox(height: 4),
          const Text(
            'Embedded WebView container for secondary web content and legacy forms',
            style: TextStyle(color: AppColors.cloudPaperMuted),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.graphiteCoreSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.graphiteCoreBorder),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.web, size: 64, color: AppColors.circuitMint),
                    SizedBox(height: 16),
                    Text(
                      'FlutterConnect Frame Active',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.cloudPaper),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Ready to embed secondary web links or Google Form backups',
                      style: TextStyle(color: AppColors.cloudPaperMuted),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
