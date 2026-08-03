import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class UserManagementScreen extends StatelessWidget {
  const UserManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'USER MANAGEMENT & RBAC PERMISSIONS',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(letterSpacing: 1.2),
          ),
          const SizedBox(height: 4),
          const Text(
            'Admin role hierarchy and granular permission control',
            style: TextStyle(color: AppColors.cloudPaperMuted),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: AppColors.circuitMint,
                  child: Icon(Icons.admin_panel_settings, color: AppColors.graphiteCore),
                ),
                title: const Text('Admin User (Workshop Administrator)', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Role: ADMIN • Permissions: Full Access (Door Unlock, Service Mode, Map Grid, Inventory, Users)'),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.circuitMint.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.circuitMint),
                  ),
                  child: const Text(
                    'ACTIVE',
                    style: TextStyle(color: AppColors.circuitMintLight, fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
