import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/brand_header.dart';
import '../screens/dashboard_screen.dart';
import '../screens/access_control_screen.dart';
import '../screens/inventory_screen.dart';
import '../screens/onboarding_print_screen.dart';
import '../screens/mobile_scanner_screen.dart';
import '../screens/user_management_screen.dart';
import '../screens/flutter_connect_screen.dart';

class AdaptiveNavigationShell extends StatefulWidget {
  const AdaptiveNavigationShell({super.key});

  @override
  State<AdaptiveNavigationShell> createState() => _AdaptiveNavigationShellState();
}

class _AdaptiveNavigationShellState extends State<AdaptiveNavigationShell> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    // 600px width threshold so desktop/laptop browser windows always get full sidebar drawer
    final isDesktop = MediaQuery.of(context).size.width > 600;

    final List<Widget> pages = [
      DashboardScreen(onNavigate: _onItemTapped),
      const AccessControlScreen(),
      const InventoryScreen(),
      const UserManagementScreen(),
      const OnboardingPrintScreen(),
      const MobileScannerScreen(),
      const FlutterConnectScreen(),
    ];

    if (isDesktop) {
      // 100% Guaranteed Extended Sidebar Navigation Drawer (240px wide)
      return Scaffold(
        body: Column(
          children: [
            const BrandHeader(),
            Expanded(
              child: Row(
                children: [
                  Container(
                    width: 240,
                    color: AppColors.graphiteCoreSurface,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: Text(
                            'NAVIGATION MENU',
                            style: TextStyle(
                              color: AppColors.cloudPaperMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.1,
                            ),
                          ),
                        ),
                        Expanded(
                          child: ListView(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            children: [
                              _buildSidebarTile(0, Icons.dashboard, 'Dashboard'),
                              _buildSidebarTile(1, Icons.lock, 'Access Control'),
                              _buildSidebarTile(2, Icons.inventory_2, 'Inventory Catalog'),
                              _buildSidebarTile(3, Icons.admin_panel_settings, 'User Management'),
                              _buildSidebarTile(4, Icons.print, 'Print Label'),
                              _buildSidebarTile(5, Icons.qr_code_scanner, 'Mobile Scanner'),
                              _buildSidebarTile(6, Icons.web, 'WebConnect'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const VerticalDivider(thickness: 1, width: 1, color: AppColors.graphiteCoreBorder),
                  Expanded(child: pages[_selectedIndex]),
                ],
              ),
            ),
          ],
        ),
      );
    } else {
      // Mobile Layout with Full Slide-Out Drawer for all 7 items
      return Scaffold(
        appBar: AppBar(
          title: const Text('GYPRI DÍLNA 2.0', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          backgroundColor: AppColors.graphiteCoreSurface,
        ),
        drawer: Drawer(
          backgroundColor: AppColors.graphiteCoreSurface,
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              const DrawerHeader(
                decoration: BoxDecoration(color: AppColors.graphiteCore),
                child: Center(
                  child: Text(
                    'GYPRI DÍLNA 2.0\nWORKSHOP MENU',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.circuitMint, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
              ),
              _buildDrawerTile(0, Icons.dashboard, 'Dashboard'),
              _buildDrawerTile(1, Icons.lock, 'Access Control'),
              _buildDrawerTile(2, Icons.inventory_2, 'Inventory Catalog'),
              _buildDrawerTile(3, Icons.admin_panel_settings, 'User Management'),
              _buildDrawerTile(4, Icons.print, 'Print Label'),
              _buildDrawerTile(5, Icons.qr_code_scanner, 'Mobile Scanner'),
              _buildDrawerTile(6, Icons.web, 'WebConnect'),
            ],
          ),
        ),
        body: SafeArea(
          child: Column(
            children: [
              const BrandHeader(),
              Expanded(child: pages[_selectedIndex]),
            ],
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _onItemTapped(5), // Open Mobile Scanner
          backgroundColor: AppColors.circuitMint,
          child: const Icon(Icons.qr_code_scanner, color: AppColors.graphiteCore, size: 28),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _selectedIndex > 4 ? 0 : _selectedIndex,
          onTap: _onItemTapped,
          backgroundColor: AppColors.graphiteCoreSurface,
          selectedItemColor: AppColors.circuitMint,
          unselectedItemColor: AppColors.cloudPaperMuted,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.lock), label: 'Access'),
            BottomNavigationBarItem(icon: Icon(Icons.inventory_2), label: 'Inventory'),
            BottomNavigationBarItem(icon: Icon(Icons.admin_panel_settings), label: 'Users'),
            BottomNavigationBarItem(icon: Icon(Icons.print), label: 'Onboard'),
          ],
        ),
      );
    }
  }

  Widget _buildSidebarTile(int index, IconData icon, String title) {
    final isSelected = _selectedIndex == index;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.circuitMint.withOpacity(0.18) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isSelected ? AppColors.circuitMint : Colors.transparent,
          width: 1.5,
        ),
      ),
      child: ListTile(
        dense: true,
        leading: Icon(
          icon,
          color: isSelected ? AppColors.circuitMintLight : AppColors.cloudPaperMuted,
          size: 22,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? AppColors.cloudPaper : AppColors.cloudPaperMuted,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 13,
          ),
        ),
        onTap: () => _onItemTapped(index),
      ),
    );
  }

  Widget _buildDrawerTile(int index, IconData icon, String title) {
    final isSelected = _selectedIndex == index;
    return ListTile(
      leading: Icon(icon, color: isSelected ? AppColors.circuitMint : AppColors.cloudPaperMuted),
      title: Text(
        title,
        style: TextStyle(color: isSelected ? AppColors.circuitMint : AppColors.cloudPaper, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
      ),
      onTap: () {
        Navigator.pop(context); // Close Drawer
        _onItemTapped(index);
      },
    );
  }
}
