import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/door_status_card.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int)? onNavigate;

  const DashboardScreen({super.key, this.onNavigate});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool isServiceMode = false;
  bool isUnlocking = false;
  List<Map<String, dynamic>> logs = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => isLoading = true);
    try {
      final serviceMode = await ApiService.getServiceModeStatus();
      final fetchedLogs = await ApiService.getLogs(limit: 10);
      setState(() {
        isServiceMode = serviceMode;
        logs = fetchedLogs;
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
        const SnackBar(
          content: Text('Door unlock request sent to ESP32!'),
          backgroundColor: AppColors.statusGranted,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to unlock door: $e'),
          backgroundColor: AppColors.statusDenied,
        ),
      );
    } finally {
      setState(() => isUnlocking = false);
      _loadDashboardData();
    }
  }

  Future<void> _handleToggleServiceMode(bool value) async {
    try {
      await ApiService.setServiceMode(value);
      setState(() => isServiceMode = value);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(value ? 'Service Mode enabled (Door Unlocked)' : 'Service Mode disabled'),
          backgroundColor: value ? AppColors.statusWarning : AppColors.statusGranted,
        ),
      );
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
          // Welcome Title
          Text(
            'WORKSHOP DASHBOARD OVERVIEW',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  letterSpacing: 1.2,
                  color: AppColors.cloudPaper,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Gypri Dílna Access & Inventory Unified Control',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 24),

          // Door Control Card
          DoorStatusCard(
            isServiceMode: isServiceMode,
            isUnlocking: isUnlocking,
            onUnlockPressed: _handleRemoteUnlock,
            onServiceModeToggled: _handleToggleServiceMode,
          ),
          const SizedBox(height: 24),

          // Quick Action Cards Grid
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width > 900 ? 3 : 1,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            shrinkWrap: true,
            childAspectRatio: 2.8,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _buildQuickCard(
                icon: Icons.inventory_2,
                title: 'INVENTORY CATALOG',
                subtitle: 'Search items & XY-ZAAA locations',
                color: AppColors.circuitMint,
                onTap: () => widget.onNavigate?.call(2),
              ),
              _buildQuickCard(
                icon: Icons.print,
                title: 'ITEM ONBOARDING',
                subtitle: 'Print 18mm Brother label & verify photo',
                color: AppColors.circuitMintLight,
                onTap: () => widget.onNavigate?.call(4),
              ),
              _buildQuickCard(
                icon: Icons.qr_code_scanner,
                title: 'MOBILE SCANNER',
                subtitle: 'Scan QR to open item detail page',
                color: AppColors.statusInfo,
                onTap: () => widget.onNavigate?.call(5),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Recent Activity Log Feed Table
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'RECENT ACCESS & AUDIT LOGS',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(letterSpacing: 1.1),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, color: AppColors.circuitMint),
                onPressed: _loadDashboardData,
              ),
            ],
          ),
          const SizedBox(height: 12),

          isLoading
              ? const Center(child: CircularProgressIndicator())
              : Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: logs.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.graphiteCoreBorder),
                    itemBuilder: (context, index) {
                      final item = logs[index];
                      final isGranted = (item['result'] as String).contains('GRANTED') || (item['result'] as String).contains('SUCCESS');
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isGranted ? AppColors.statusGranted.withOpacity(0.2) : AppColors.statusDenied.withOpacity(0.2),
                          child: Icon(
                            isGranted ? Icons.check_circle : Icons.cancel,
                            color: isGranted ? AppColors.statusGranted : AppColors.statusDenied,
                            size: 20,
                          ),
                        ),
                        title: Text(
                          item['event_type'] ?? 'EVENT',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        subtitle: Text(
                          '${item['actor_name'] ?? 'System'} • ${item['result']}',
                          style: const TextStyle(color: AppColors.cloudPaperMuted, fontSize: 12),
                        ),
                        trailing: Text(
                          item['timestamp'] != null ? item['timestamp'].toString().substring(11, 16) : '',
                          style: const TextStyle(color: AppColors.cloudPaperMuted, fontSize: 12),
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildQuickCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.cloudPaper),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 11, color: AppColors.cloudPaperMuted),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.cloudPaperMuted),
            ],
          ),
        ),
      ),
    );
  }
}
