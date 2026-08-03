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
    final isDesktop = MediaQuery.of(context).size.width > 900;

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
      // Extended Desktop & Web Sidebar Navigation Menu (220px wide)
      return Scaffold(
        body: Column(
          children: [
            const BrandHeader(),
            Expanded(
              child: Row(
                children: [
                  SizedBox(
                    width: 220,
                    child: NavigationRail(
                      extended: true,
                      selectedIndex: _selectedIndex,
                      onDestinationSelected: _onItemTapped,
                      backgroundColor: AppColors.graphiteCoreSurface,
                      indicatorColor: AppColors.circuitMint.withOpacity(0.2),
                      selectedIconTheme: const IconThemeData(color: AppColors.circuitMintLight),
                      unselectedIconTheme: const IconThemeData(color: AppColors.cloudPaperMuted),
                      selectedLabelTextStyle: const TextStyle(
                        color: AppColors.circuitMintLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                      unselectedLabelTextStyle: const TextStyle(
                        color: AppColors.cloudPaperMuted,
                        fontSize: 14,
                      ),
                      minExtendedWidth: 220,
                      destinations: const [
                        NavigationRailDestination(
                          icon: Icon(Icons.dashboard_outlined),
                          selectedIcon: Icon(Icons.dashboard),
                          label: Text('Dashboard'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.lock_clock_outlined),
                          selectedIcon: Icon(Icons.lock),
                          label: Text('Access Control'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.inventory_2_outlined),
                          selectedIcon: Icon(Icons.inventory_2),
                          label: Text('Inventory Catalog'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.admin_panel_settings_outlined),
                          selectedIcon: Icon(Icons.admin_panel_settings),
                          label: Text('User Management'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.print_outlined),
                          selectedIcon: Icon(Icons.print),
                          label: Text('Print Label'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.qr_code_scanner),
                          selectedIcon: Icon(Icons.qr_code_scanner),
                          label: Text('Mobile Scanner'),
                        ),
                        NavigationRailDestination(
                          icon: Icon(Icons.web_outlined),
                          selectedIcon: Icon(Icons.web),
                          label: Text('WebConnect'),
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
      // Mobile Layout: Bottom Navigation Bar + Center Floating Scanner Button
      return Scaffold(
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
}
