import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_theme.dart';

class BrandHeader extends StatelessWidget {
  final bool isServerOnline;

  const BrandHeader({super.key, this.isServerOnline = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.graphiteCoreSurface,
        border: Border(bottom: BorderSide(color: AppColors.graphiteCoreBorder, width: 1)),
      ),
      child: Row(
        children: [
          // Logo SVG
          SvgPicture.asset(
            'assets/logos/logo bile (1).svg',
            height: 32,
            placeholderBuilder: (context) => const Text(
              'GYPRI DÍLNA',
              style: TextStyle(
                color: AppColors.circuitMint,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'GYPRI DÍLNA 2.0',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.cloudPaper,
                  letterSpacing: 1.1,
                ),
          ),
          const Spacer(),
          // Server Status Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isServerOnline ? AppColors.statusGranted.withOpacity(0.15) : AppColors.statusDenied.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isServerOnline ? AppColors.statusGranted : AppColors.statusDenied,
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isServerOnline ? AppColors.statusGranted : AppColors.statusDenied,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  isServerOnline ? 'SERVER ONLINE' : 'DISCONNECTED',
                  style: TextStyle(
                    color: isServerOnline ? AppColors.statusGranted : AppColors.statusDenied,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
