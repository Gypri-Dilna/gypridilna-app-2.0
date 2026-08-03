import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/inventory_item.dart';
import '../models/map_zone.dart';
import '../services/api_service.dart';
import '../widgets/workshop_minimap_widget.dart';

class ItemDetailScreen extends StatefulWidget {
  final InventoryItem item;

  const ItemDetailScreen({super.key, required this.item});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  List<MapZone> mapZones = [];

  @override
  void initState() {
    super.initState();
    ApiService.getMapZones().then((zones) {
      if (mounted) setState(() => mapZones = zones);
    });
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;

    return Scaffold(
      appBar: AppBar(
        title: Text('ITEM DETAIL: ${item.itemCode}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: AppColors.circuitMint),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Item Banner Header
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.circuitMint.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.build_circle, color: AppColors.circuitMint, size: 40),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.name,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 22),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.circuitMint,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'ID: ${item.itemCode}', // XY-ZAAA e.g. 61-0001
                                  style: const TextStyle(
                                    color: AppColors.graphiteCore,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                item.locationBadge,
                                style: const TextStyle(color: AppColors.cloudPaperMuted, fontSize: 13),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Item Details & Photo Grid
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left: Photo Snapshot & Metadata
                Expanded(
                  flex: 5,
                  child: Column(
                    children: [
                      // Item Photo Snapshot Container
                      Card(
                        child: Container(
                          height: 240,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: AppColors.graphiteCore,
                          ),
                          child: item.photoUrl != null
                              ? Image.network(
                                  '${ApiService.baseUrl}${item.photoUrl}',
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => _buildNoPhotoPlaceholder(),
                                )
                              : _buildNoPhotoPlaceholder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Metadata Info Card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildInfoRow('Category', item.category ?? 'Uncategorized'),
                              const Divider(color: AppColors.graphiteCoreBorder),
                              _buildInfoRow('Rack Number (X)', '${item.rack}'),
                              const Divider(color: AppColors.graphiteCoreBorder),
                              _buildInfoRow('Position / Shelf (Y)', '${item.pozice}'),
                              const Divider(color: AppColors.graphiteCoreBorder),
                              _buildInfoRow('Box Number (Z)', '${item.box}'),
                              const Divider(color: AppColors.graphiteCoreBorder),
                              _buildInfoRow('Item Index (AAA)', '${item.number}'),
                              if (item.note != null) ...[
                                const Divider(color: AppColors.graphiteCoreBorder),
                                _buildInfoRow('Notes', item.note!),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 24),

                // Right: 2D Minimap showing Rack Location
                Expanded(
                  flex: 4,
                  child: SizedBox(
                    height: 460,
                    child: WorkshopMinimapWidget(
                      zones: mapZones,
                      selectedRack: item.rack,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoPhotoPlaceholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.photo_camera_outlined, size: 48, color: AppColors.cloudPaperMuted),
        SizedBox(height: 8),
        Text('No snapshot photo attached', style: TextStyle(color: AppColors.cloudPaperMuted)),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.cloudPaperMuted, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        ],
      ),
    );
  }
}
