import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/map_zone.dart';
import '../services/api_service.dart';

class WorkshopMinimapWidget extends StatefulWidget {
  final List<MapZone> zones;
  final int? selectedRack;
  final ValueChanged<int>? onRackSelected;
  final VoidCallback? onZonesUpdated;

  const WorkshopMinimapWidget({
    super.key,
    required this.zones,
    this.selectedRack,
    this.onRackSelected,
    this.onZonesUpdated,
  });

  @override
  State<WorkshopMinimapWidget> createState() => _WorkshopMinimapWidgetState();
}

class _WorkshopMinimapWidgetState extends State<WorkshopMinimapWidget> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  bool isEditMode = false;
  MapZone? draggingZone;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _showAddZoneDialog() {
    final codeController = TextEditingController();
    final rackController = TextEditingController();
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.graphiteCoreSurface,
          title: const Text('ADD NEW MAP RACK / ZONE', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: codeController,
                decoration: const InputDecoration(labelText: 'Zone Code *', hintText: 'e.g. RACK-3'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: rackController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Rack Number (X) *', hintText: 'e.g. 3'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Display Name *', hintText: 'e.g. Rack 3 - Power Supplies'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CANCEL', style: TextStyle(color: AppColors.cloudPaperMuted)),
            ),
            ElevatedButton(
              onPressed: () async {
                final rNum = int.tryParse(rackController.text) ?? 0;
                if (codeController.text.isNotEmpty && nameController.text.isNotEmpty && rNum > 0) {
                  try {
                    await ApiService.createMapZone(
                      zoneCode: codeController.text.trim(),
                      rackNumber: rNum,
                      displayName: nameController.text.trim(),
                      gridX: 100,
                      gridY: 100,
                      width: 120,
                      height: 80,
                      colorHex: '#3AA69A',
                    );
                    Navigator.pop(context);
                    widget.onZonesUpdated?.call();
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.statusDenied),
                    );
                  }
                }
              },
              child: const Text('ADD TO MAP'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.graphiteCoreSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.graphiteCoreBorder),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Column(
          children: [
            // Minimap Header Bar with Configurable Grid Editor Toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: AppColors.graphiteCore,
              child: Row(
                children: [
                  const Icon(Icons.map, color: AppColors.circuitMint, size: 20),
                  const SizedBox(width: 8),
                  const Text(
                    'WORKSHOP 2D MINIMAP',
                    style: TextStyle(
                      color: AppColors.cloudPaper,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: isEditMode ? 'Done Editing Map' : 'Edit Map Grid Layout',
                    icon: Icon(
                      isEditMode ? Icons.check_circle : Icons.edit_location_alt,
                      color: isEditMode ? AppColors.statusGranted : AppColors.circuitMint,
                      size: 22,
                    ),
                    onPressed: () {
                      setState(() => isEditMode = !isEditMode);
                    },
                  ),
                  if (isEditMode) ...[
                    const SizedBox(width: 4),
                    ElevatedButton.icon(
                      onPressed: _showAddZoneDialog,
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('ADD RACK', style: TextStyle(fontSize: 11)),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(60, 32),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Interactive Zoomable & Drag-Editable Canvas
            Expanded(
              child: InteractiveViewer(
                boundaryMargin: const EdgeInsets.all(100),
                minScale: 0.5,
                maxScale: 3.0,
                panEnabled: !isEditMode, // Allow pan when not dragging racks
                child: Container(
                  width: 600,
                  height: 400,
                  color: AppColors.graphiteCore,
                  child: Stack(
                    children: [
                      // Grid Line Background
                      CustomPaint(
                        size: const Size(600, 400),
                        painter: GridPainter(),
                      ),

                      // Map Racks & Zones
                      ...widget.zones.map((zone) {
                        final isSelected = widget.selectedRack == zone.rackNumber;

                        Widget childWidget = AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.circuitMint.withOpacity(0.35)
                                : zone.color.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected ? AppColors.circuitMintLight : (isEditMode ? AppColors.statusWarning : zone.color),
                              width: isSelected ? 3 : (isEditMode ? 2 : 1.5),
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: AppColors.circuitMint.withOpacity(0.5),
                                      blurRadius: 12,
                                      spreadRadius: 2,
                                    )
                                  ]
                                : [],
                          ),
                          child: Stack(
                            children: [
                              Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      zone.zoneCode,
                                      style: TextStyle(
                                        color: isSelected ? AppColors.cloudPaper : zone.color,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      zone.displayName,
                                      textAlign: TextAlign.center,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: AppColors.cloudPaperMuted,
                                        fontSize: 9,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Animated Pulsing Location Pin
                              if (isSelected)
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: AnimatedBuilder(
                                    animation: _pulseController,
                                    builder: (context, child) {
                                      return Transform.scale(
                                        scale: 1.0 + (_pulseController.value * 0.3),
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: const BoxDecoration(
                                            color: AppColors.circuitMint,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.location_on,
                                            color: AppColors.graphiteCore,
                                            size: 16,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                            ],
                          ),
                        );

                        if (isEditMode) {
                          return Positioned(
                            left: zone.gridX,
                            top: zone.gridY,
                            width: zone.width,
                            height: zone.height,
                            child: GestureDetector(
                              onPanUpdate: (details) async {
                                final newX = (zone.gridX + details.delta.dx).clamp(0.0, 500.0);
                                final newY = (zone.gridY + details.delta.dy).clamp(0.0, 320.0);
                                await ApiService.updateMapZone(zone.id, {
                                  'grid_x': newX.toInt(),
                                  'grid_y': newY.toInt(),
                                });
                                widget.onZonesUpdated?.call();
                              },
                              child: childWidget,
                            ),
                          );
                        }

                        return Positioned(
                          left: zone.gridX,
                          top: zone.gridY,
                          width: zone.width,
                          height: zone.height,
                          child: GestureDetector(
                            onTap: () {
                              if (widget.onRackSelected != null) {
                                widget.onRackSelected!(zone.rackNumber);
                              }
                            },
                            child: childWidget,
                          ),
                        );
                      }).toList(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.graphiteCoreBorder.withOpacity(0.25)
      ..strokeWidth = 1.0;

    const step = 40.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
