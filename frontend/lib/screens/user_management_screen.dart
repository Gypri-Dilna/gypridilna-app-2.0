import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  List<User> users = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    setState(() => isLoading = true);
    try {
      final fetchedUsers = await ApiService.getUsers();
      setState(() {
        users = fetchedUsers;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  void _showAddUserDialog() {
    final usernameController = TextEditingController();
    final passwordController = TextEditingController();
    final fullNameController = TextEditingController();
    String role = 'MEMBER';
    final selectedPermissions = <String>{'manage_inventory'};

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.graphiteCoreSurface,
              title: Row(
                children: const [
                  Icon(Icons.person_add, color: AppColors.circuitMint),
                  SizedBox(width: 8),
                  Text('CREATE NEW WORKSHOP USER', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: usernameController,
                      decoration: const InputDecoration(labelText: 'Username *'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Password *'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: fullNameController,
                      decoration: const InputDecoration(labelText: 'Full Name *'),
                    ),
                    const SizedBox(height: 16),
                    const Text('ASSIGN ROLE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    DropdownButton<String>(
                      value: role,
                      dropdownColor: AppColors.graphiteCoreSurface,
                      isExpanded: true,
                      items: ['ADMIN', 'MANAGER', 'MEMBER', 'GUEST'].map((r) {
                        return DropdownMenuItem(value: r, child: Text(r));
                      }).toList(),
                      onChanged: (val) => setDialogState(() => role = val!),
                    ),
                    const SizedBox(height: 16),
                    const Text('GRANULAR PERMISSIONS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    _buildPermissionCheckbox('unlock_door_remotely', 'Remote Door Unlock', selectedPermissions, setDialogState),
                    _buildPermissionCheckbox('toggle_service_mode', 'Toggle Service Mode', selectedPermissions, setDialogState),
                    _buildPermissionCheckbox('manage_inventory', 'Manage Inventory Items', selectedPermissions, setDialogState),
                    _buildPermissionCheckbox('manage_map_grid', 'Edit Workshop 2D Minimap Grid', selectedPermissions, setDialogState),
                    _buildPermissionCheckbox('manage_users', 'Admin User Management', selectedPermissions, setDialogState),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('CANCEL', style: TextStyle(color: AppColors.cloudPaperMuted)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (usernameController.text.trim().isNotEmpty &&
                        passwordController.text.isNotEmpty &&
                        fullNameController.text.trim().isNotEmpty) {
                      try {
                        await ApiService.createUser(
                          username: usernameController.text.trim(),
                          password: passwordController.text,
                          fullName: fullNameController.text.trim(),
                          role: role,
                          permissions: selectedPermissions.toList(),
                        );
                        Navigator.pop(context);
                        _fetchUsers();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('User created successfully!'), backgroundColor: AppColors.statusGranted),
                        );
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.statusDenied),
                        );
                      }
                    }
                  },
                  child: const Text('CREATE USER'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildPermissionCheckbox(String key, String label, Set<String> selected, StateSetter setDialogState) {
    final isChecked = selected.contains(key);
    return CheckboxListTile(
      dense: true,
      title: Text(label, style: const TextStyle(fontSize: 12)),
      value: isChecked,
      activeColor: AppColors.circuitMint,
      contentPadding: EdgeInsets.zero,
      onChanged: (val) {
        setDialogState(() {
          if (val == true) {
            selected.add(key);
          } else {
            selected.remove(key);
          }
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
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
                ],
              ),
              ElevatedButton.icon(
                onPressed: _showAddUserDialog,
                icon: const Icon(Icons.person_add),
                label: const Text('ADD USER'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          isLoading
              ? const Center(child: CircularProgressIndicator())
              : Card(
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: users.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.graphiteCoreBorder),
                    itemBuilder: (context, index) {
                      final user = users[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: user.role == 'ADMIN' ? AppColors.circuitMint : AppColors.graphiteCoreSurface,
                          child: Icon(
                            user.role == 'ADMIN' ? Icons.admin_panel_settings : Icons.person,
                            color: user.role == 'ADMIN' ? AppColors.graphiteCore : AppColors.cloudPaper,
                          ),
                        ),
                        title: Text(user.fullName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Username: ${user.username} • Role: ${user.role}'),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: user.isActive ? AppColors.statusGranted.withOpacity(0.15) : AppColors.statusDenied.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: user.isActive ? AppColors.statusGranted : AppColors.statusDenied,
                            ),
                          ),
                          child: Text(
                            user.isActive ? 'ACTIVE' : 'DEACTIVATED',
                            style: TextStyle(
                              color: user.isActive ? AppColors.statusGranted : AppColors.statusDenied,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
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
