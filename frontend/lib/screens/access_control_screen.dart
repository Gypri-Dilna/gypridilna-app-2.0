import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/rfid_chip.dart';
import '../services/api_service.dart';
import '../widgets/door_status_card.dart';

class AccessControlScreen extends StatefulWidget {
  const AccessControlScreen({super.key});

  @override
  State<AccessControlScreen> createState() => _AccessControlScreenState();
}

class _AccessControlScreenState extends State<AccessControlScreen> {
  List<RfidChip> chips = [];
  bool isServiceMode = false;
  bool isUnlocking = false;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => isLoading = true);
    try {
      final fetchedChips = await ApiService.getChips();
      final serviceMode = await ApiService.getServiceModeStatus();
      setState(() {
        chips = fetchedChips;
        isServiceMode = serviceMode;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> _handleRemoteUnlock() async {
    setState(() => isUnlocking = true);
    try {
      await ApiService.requestDoorUnlock();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Remote unlock request sent!'), backgroundColor: AppColors.statusGranted),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.statusDenied),
      );
    } finally {
      setState(() => isUnlocking = false);
    }
  }

  Future<void> _handleToggleServiceMode(bool value) async {
    try {
      await ApiService.setServiceMode(value);
      setState(() => isServiceMode = value);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.statusDenied),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'RFID ACCESS CONTROL SYSTEM',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(letterSpacing: 1.2),
          ),
          const SizedBox(height: 4),
          const Text(
            'Rebuilt native Flutter Access Control dashboard for ESP32 RFID readers',
            style: TextStyle(color: AppColors.cloudPaperMuted),
          ),
          const SizedBox(height: 24),

          // Door Status Card
          DoorStatusCard(
            isServiceMode: isServiceMode,
            isUnlocking: isUnlocking,
            onUnlockPressed: _handleRemoteUnlock,
            onServiceModeToggled: _handleToggleServiceMode,
          ),
          const SizedBox(height: 32),

          // RFID Chips Management Table Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'REGISTERED RFID CHIPS & BADGES',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(letterSpacing: 1.1),
              ),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add),
                label: const Text('REGISTER NEW CHIP'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          isLoading
              ? const Center(child: CircularProgressIndicator())
              : Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: chips.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.graphiteCoreBorder),
                    itemBuilder: (context, index) {
                      final chip = chips[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: chip.isAllowed ? AppColors.statusGranted.withOpacity(0.2) : AppColors.statusDenied.withOpacity(0.2),
                          child: Icon(
                            Icons.nfc,
                            color: chip.isAllowed ? AppColors.statusGranted : AppColors.statusDenied,
                          ),
                        ),
                        title: Text(chip.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Chip ID: ${chip.chipId}' + (chip.isOneTime ? ' • One-Time Pass' : '')),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: chip.isAllowed ? AppColors.statusGranted.withOpacity(0.15) : AppColors.statusDenied.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: chip.isAllowed ? AppColors.statusGranted : AppColors.statusDenied,
                                ),
                              ),
                              child: Text(
                                chip.isAllowed ? 'ALLOWED' : 'BLOCKED',
                                style: TextStyle(
                                  color: chip.isAllowed ? AppColors.statusGranted : AppColors.statusDenied,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit, color: AppColors.cloudPaperMuted),
                              onPressed: () {},
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}
