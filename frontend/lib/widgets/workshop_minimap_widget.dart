import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/map_zone.dart';

class WorkshopMinimapWidget extends StatefulWidget {
  final List<MapZone> zones;
  final int? selectedRack;
  final ValueChanged<int>? onRackSelected;

  const WorkshopMinimapWidget({
    super.key,
    required this.zones,
    this.selectedRack,
    this.onRackSelected,
  });

  @override
  State<WorkshopMinimapWidget> createState() => _WorkshopMinimapWidgetState();
}

class _WorkshopMinimapWidgetState extends State<WorkshopMinimapWidget> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

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
            // Minimap Header Bar
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
                  if (widget.selectedRack != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.circuitMint.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.circuitMint),
                      ),
                      child: Text(
                        'RACK ${widget.selectedRack} SELECTED',
                        style: const TextStyle(
                          color: AppColors.circuitMintLight,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Zoomable Interactive Canvas
            Expanded(
              child: InteractiveViewer(
                boundaryMargin: const EdgeInsets.all(100),
                minScale: 0.5,
                maxScale: 3.0,
                child: Container(
                  width: 600,
                  height: 400,
                  color: AppColors.graphiteCore,
                  child: Stack(
                    children: [
                      // Grid Line Background Paint
                      CustomPaint(
                        size: const Size(600, 400),
                        painter: GridPainter(),
                      ),
                      // Render Map Zones (Racks)
                      ...widget.zones.map((zone) {
                        final isSelected = widget.selectedRack == zone.rackNumber;
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
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.circuitMint.withOpacity(0.35)
                                    : zone.color.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSelected ? AppColors.circuitMintLight : zone.color,
                                  width: isSelected ? 3 : 1.5,
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
                                  // Animated Pulsing Pin Marker if selected
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
                            ),
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
      color = AppColors.graphiteCoreBorder.withOpacity(0.25)
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
