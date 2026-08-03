import 'dart:async';
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
        const SnackBar(content: Text('Remote unlock request sent to ESP32!'), backgroundColor: AppColors.statusGranted),
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

  void _showAddChipDialog() {
    final chipIdController = TextEditingController();
    final nameController = TextEditingController();
    bool isOneTime = false;
    Timer? pollTimer;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            // Start polling for Learn Mode chip scan
            pollTimer ??= Timer.periodic(const Duration(seconds: 2), (_) async {
              final unknownId = await ApiService.getLastUnknownChip();
              if (unknownId != null && unknownId.isNotEmpty) {
                setDialogState(() {
                  chipIdController.text = unknownId;
                });
              }
            });

            return AlertDialog(
              backgroundColor: AppColors.graphiteCoreSurface,
              title: Row(
                children: const [
                  Icon(Icons.nfc, color: AppColors.circuitMint),
                  SizedBox(width: 8),
                  Text('REGISTER NEW RFID CHIP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.circuitMint.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.circuitMint),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.sensors, color: AppColors.circuitMint, size: 20),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Learn Mode Active: Scan an unregistered chip at the workshop door to auto-fill ID.',
                            style: TextStyle(fontSize: 11, color: AppColors.circuitMintLight),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: chipIdController,
                    decoration: const InputDecoration(labelText: 'Chip ID *', hintText: 'e.g. 1A2B3C4D'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Holder Name / Description *'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Checkbox(
                        value: isOneTime,
                        onChanged: (v) => setDialogState(() => isOneTime = v ?? false),
                        activeColor: AppColors.circuitMint,
                      ),
                      const Text('One-Time Visitor Pass'),
                    ],
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    pollTimer?.cancel();
                    Navigator.pop(context);
                  },
                  child: const Text('CANCEL', style: TextStyle(color: AppColors.cloudPaperMuted)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (chipIdController.text.trim().isNotEmpty && nameController.text.trim().isNotEmpty) {
                      pollTimer?.cancel();
                      try {
                        await ApiService.createChip(
                          chipId: chipIdController.text.trim(),
                          name: nameController.text.trim(),
                          isOneTime: isOneTime,
                        );
                        Navigator.pop(context);
                        _fetchData();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Chip registered successfully!'), backgroundColor: AppColors.statusGranted),
                        );
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.statusDenied),
                        );
                      }
                    }
                  },
                  child: const Text('REGISTER CHIP'),
                ),
              ],
            );
          },
        );
      },
    ).then((_) => pollTimer?.cancel());
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
                onPressed: _showAddChipDialog,
                icon: const Icon(Icons.add_circle_outline),
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
