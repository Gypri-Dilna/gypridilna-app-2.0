class User {
  final int id;
  final String username;
  final String fullName;
  final String role;
  final List<String> permissions;
  final bool isActive;

  User({
    required this.id,
    required this.username,
    required this.fullName,
    required this.role,
    required this.permissions,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      username: json['username'] as String,
      fullName: json['full_name'] as String,
      role: json['role'] as String,
      permissions: List<String>.from(json['permissions'] ?? []),
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  bool hasPermission(String permission) {
    if (role == 'ADMIN') return true;
    return permissions.contains(permission);
  }
}
