class RfidChip {
  final int id;
  final String chipId;
  final String name;
  final bool isAllowed;
  final bool isOneTime;
  final DateTime? validUntil;
  final int? userId;
  final DateTime createdAt;

  RfidChip({
    required this.id,
    required this.chipId,
    required this.name,
    required this.isAllowed,
    required this.isOneTime,
    this.validUntil,
    this.userId,
    required this.createdAt,
  });

  factory RfidChip.fromJson(Map<String, dynamic> json) {
    return RfidChip(
      id: json['id'] as int,
      chipId: json['chip_id'] as String,
      name: json['name'] as String,
      isAllowed: json['is_allowed'] as bool,
      isOneTime: json['is_one_time'] as bool,
      validUntil: json['valid_until'] != null ? DateTime.parse(json['valid_until'] as String) : null,
      userId: json['user_id'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
