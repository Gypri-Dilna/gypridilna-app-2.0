import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DoorStatusCard extends StatelessWidget {
  final bool isServiceMode;
  final bool isUnlocking;
  final VoidCallback onUnlockPressed;
  final ValueChanged<bool> onServiceModeToggled;

  const DoorStatusCard({
    super.key,
    required this.isServiceMode,
    required this.isUnlocking,
    required this.onUnlockPressed,
    required this.onServiceModeToggled,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isServiceMode ? Icons.lock_open : Icons.lock,
                  color: isServiceMode ? AppColors.statusWarning : AppColors.circuitMint,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAlignment.start,
                  children: [
                    Text(
                      'DOOR CONTROL SYSTEM',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isServiceMode ? 'SERVICE MODE (PERMANENT UNLOCK)' : 'LOCKED (RFID GUARD ACTIVE)',
                      style: TextStyle(
                        color: isServiceMode ? AppColors.statusWarning : AppColors.statusGranted,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: isUnlocking ? null : onUnlockPressed,
                    icon: isUnlocking
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.graphiteCore),
                          )
                        : const Icon(Icons.key, size: 22),
                    label: Text(isUnlocking ? 'UNLOCKING...' : 'REMOTE UNLOCK DOOR'),
                  ),
                ),
                const SizedBox(width: 16),
                Row(
                  children: [
                    Text(
                      'SERVICE MODE',
                      style: TextStyle(
                        color: isServiceMode ? AppColors.statusWarning : AppColors.cloudPaperMuted,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Switch(
                      value: isServiceMode,
                      onChanged: onServiceModeToggled,
                      activeColor: AppColors.statusWarning,
                      activeTrackColor: AppColors.statusWarning.withOpacity(0.3),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
