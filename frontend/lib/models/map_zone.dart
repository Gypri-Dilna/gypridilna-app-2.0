import 'package:flutter/material.dart';

class MapZone {
  final int id;
  final String zoneCode;
  final int rackNumber;
  final String displayName;
  final double gridX;
  final double gridY;
  final double width;
  final double height;
  final Color color;
  final String zoneType;

  MapZone({
    required this.id,
    required this.zoneCode,
    required this.rackNumber,
    required this.displayName,
    required this.gridX,
    required this.gridY,
    required this.width,
    required this.height,
    required this.color,
    required this.zoneType,
  });

  factory MapZone.fromJson(Map<String, dynamic> json) {
    final colorHex = (json['color_hex'] as String? ?? '#3AA69A').replaceAll('#', '');
    return MapZone(
      id: json['id'] as int,
      zoneCode: json['zone_code'] as String,
      rackNumber: json['rack_number'] as int,
      displayName: json['display_name'] as String,
      gridX: (json['grid_x'] as num).toDouble(),
      gridY: (json['grid_y'] as num).toDouble(),
      width: (json['width'] as num).toDouble(),
      height: (json['height'] as num).toDouble(),
      color: Color(int.parse('FF$colorHex', radix: 16)),
      zoneType: json['zone_type'] as String? ?? 'RACK',
    );
  }
}
