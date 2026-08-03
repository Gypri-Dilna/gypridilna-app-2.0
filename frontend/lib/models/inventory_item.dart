class InventoryItem {
  final String id;
  final String itemCode; // e.g. 61-0001
  final String name;
  final int rack;
  final int pozice;
  final int box;
  final int number;
  final String? category;
  final String? note;
  final String? barcode;
  final String? photoUrl;
  final DateTime createdAt;

  InventoryItem({
    required this.id,
    required this.itemCode,
    required this.name,
    required this.rack,
    required this.pozice,
    required this.box,
    required this.number,
    this.category,
    this.note,
    this.barcode,
    this.photoUrl,
    required this.createdAt,
  });

  factory InventoryItem.fromJson(Map<String, dynamic> json) {
    return InventoryItem(
      id: json['id'] as String,
      itemCode: json['item_code'] as String,
      name: json['name'] as String,
      rack: json['rack'] as int,
      pozice: json['pozice'] as int,
      box: json['box'] as int? ?? 0,
      number: json['number'] as int,
      category: json['category'] as String?,
      note: json['note'] as String?,
      barcode: json['barcode'] as String?,
      photoUrl: json['photo_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  String get locationBadge => 'Rack $rack / Pos $pozice' + (box > 0 ? ' / Box $box' : '');
}
