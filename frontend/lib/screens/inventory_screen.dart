import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/inventory_item.dart';
import '../models/map_zone.dart';
import '../services/api_service.dart';
import '../widgets/workshop_minimap_widget.dart';
import 'item_detail_screen.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  List<InventoryItem> items = [];
  List<MapZone> mapZones = [];
  bool isLoading = true;
  String searchQuery = '';
  int? selectedRackFilter;
  InventoryItem? selectedItem;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => isLoading = true);
    try {
      final fetchedItems = await ApiService.getInventory(
        search: searchQuery,
        rack: selectedRackFilter,
      );
      final fetchedZones = await ApiService.getMapZones();
      setState(() {
        items = fetchedItems;
        mapZones = fetchedZones;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width > 900;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAlignment.start,
        children: [
          // Header & Search Bar
          Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: (val) {
                    searchQuery = val;
                    _fetchData();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search items by Name, Rack, or Code (XY-ZAAA, e.g. 61-0001)...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.circuitMint),
                    suffixIcon: searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              searchQuery = '';
                              _fetchData();
                            },
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              if (selectedRackFilter != null)
                Chip(
                  label: Text('Rack $selectedRackFilter Filter'),
                  onDeleted: () {
                    setState(() => selectedRackFilter = null);
                    _fetchData();
                  },
                  backgroundColor: AppColors.circuitMint.withOpacity(0.2),
                  deleteIconColor: AppColors.circuitMint,
                ),
            ],
          ),
          const SizedBox(height: 20),

          // Content Area (Split Screen on Desktop)
          Expanded(
            child: isDesktop
                ? Row(
                    crossAxisAlignment: CrossAlignment.start,
                    children: [
                      // Item Catalog List
                      Expanded(
                        flex: 5,
                        child: _buildItemGrid(),
                      ),
                      const SizedBox(width: 24),
                      // Interactive 2D Minimap
                      Expanded(
                        flex: 4,
                        child: WorkshopMinimapWidget(
                          zones: mapZones,
                          selectedRack: selectedItem?.rack ?? selectedRackFilter,
                          onRackSelected: (rackNum) {
                            setState(() {
                              selectedRackFilter = (selectedRackFilter == rackNum) ? null : rackNum;
                            });
                            _fetchData();
                          },
                        ),
                      ),
                    ],
                  )
                : _buildItemGrid(),
          ),
        ],
      ),
    );
  }

  Widget _buildItemGrid() {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.inventory_2_outlined, size: 64, color: AppColors.cloudPaperMuted),
            const SizedBox(height: 16),
            const Text(
              'No items found matching criteria',
              style: TextStyle(color: AppColors.cloudPaperMuted, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final isSelected = selectedItem?.id == item.id;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          color: isSelected ? AppColors.circuitMint.withOpacity(0.15) : AppColors.graphiteCoreSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(
              color: isSelected ? AppColors.circuitMint : AppColors.graphiteCoreBorder,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: ListTile,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            onTap: () {
              setState(() => selectedItem = item);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ItemDetailScreen(item: item)),
              );
            },
            leading: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.circuitMint.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.circuitMint),
              ),
              child: Text(
                item.itemCode, // XY-ZAAA e.g. 61-0001
                style: const TextStyle(
                  color: AppColors.circuitMintLight,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
            title: Text(
              item.name,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '${item.locationBadge}${item.category != null ? " • ${item.category}" : ""}',
                style: const TextStyle(color: AppColors.cloudPaperMuted, fontSize: 12),
              ),
            ),
            trailing: const Icon(Icons.chevron_right, color: AppColors.cloudPaperMuted),
          );
      },
    );
  }
}
