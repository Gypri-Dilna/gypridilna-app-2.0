import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/rfid_chip.dart';
import '../models/inventory_item.dart';
import '../models/map_zone.dart';

class ApiService {
  static String baseUrl = 'http://localhost:8000';
  static String? authToken;

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  // Auth & Login
  static Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      authToken = data['access_token'];
      return data;
    }
    throw Exception('Login failed: ${response.body}');
  }

  // Door Control
  static Future<bool> requestDoorUnlock() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/manual-override'),
      headers: _headers,
    );
    return response.statusCode == 200;
  }

  static Future<bool> setServiceMode(bool enabled) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/service-mode?enabled=$enabled'),
      headers: _headers,
    );
    return response.statusCode == 200;
  }

  static Future<bool> getServiceModeStatus() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/service-mode-status'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['enabled'] == true;
    }
    return false;
  }

  // Inventory
  static Future<List<InventoryItem>> getInventory({String? search, int? rack}) async {
    var url = '$baseUrl/api/inventory';
    final queryParams = <String>[];
    if (search != null && search.isNotEmpty) queryParams.add('search=${Uri.encodeComponent(search)}');
    if (rack != null) queryParams.add('rack=$rack');
    if (queryParams.isNotEmpty) url += '?${queryParams.join('&')}';

    final response = await http.get(Uri.parse(url), headers: _headers);
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => InventoryItem.fromJson(e)).toList();
    }
    throw Exception('Failed to fetch inventory');
  }

  static Future<InventoryItem> getInventoryItem(String idOrCode) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/inventory/${Uri.encodeComponent(idOrCode)}'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return InventoryItem.fromJson(jsonDecode(response.body));
    }
    throw Exception('Item not found');
  }

  static Future<InventoryItem> createInventoryItem({
    required String name,
    required int rack,
    required int pozice,
    int box = 0,
    String? category,
    String? note,
    String? photoUrl,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/inventory'),
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'rack': rack,
        'pozice': pozice,
        'box': box,
        'category': category,
        'note': note,
        'photo_url': photoUrl,
      }),
    );
    if (response.statusCode == 201) {
      return InventoryItem.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create item');
  }

  static Future<bool> queueLabelPrint(String itemCode, String itemName) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/print/label?item_code=${Uri.encodeComponent(itemCode)}&item_name=${Uri.encodeComponent(itemName)}'),
      headers: _headers,
    );
    return response.statusCode == 200;
  }

  // Users & RBAC
  static Future<List<User>> getUsers() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/users'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => User.fromJson(e)).toList();
    }
    return [];
  }

  static Future<User> createUser({
    required String username,
    required String password,
    required String fullName,
    required String role,
    required List<String> permissions,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/users'),
      headers: _headers,
      body: jsonEncode({
        'username': username,
        'password': password,
        'full_name': fullName,
        'role': role,
        'permissions': permissions,
      }),
    );
    if (response.statusCode == 201) {
      return User.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create user: ${response.body}');
  }

  // Minimap Zones & Grid Editor
  static Future<List<MapZone>> getMapZones() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/map/zones'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => MapZone.fromJson(e)).toList();
    }
    return [];
  }

  static Future<MapZone> createMapZone({
    required String zoneCode,
    required int rackNumber,
    required String displayName,
    required double gridX,
    required double gridY,
    required double width,
    required double height,
    required String colorHex,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/map/zones'),
      headers: _headers,
      body: jsonEncode({
        'zone_code': zoneCode,
        'rack_number': rackNumber,
        'display_name': displayName,
        'grid_x': gridX.toInt(),
        'grid_y': gridY.toInt(),
        'width': width.toInt(),
        'height': height.toInt(),
        'color_hex': colorHex,
      }),
    );
    if (response.statusCode == 201) {
      return MapZone.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create map zone');
  }

  static Future<MapZone> updateMapZone(int id, Map<String, dynamic> updates) async {
    final response = await http.put(
      Uri.parse('$baseUrl/api/map/zones/$id'),
      headers: _headers,
      body: jsonEncode(updates),
    );
    if (response.statusCode == 200) {
      return MapZone.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to update map zone');
  }

  // RFID Chips
  static Future<List<RfidChip>> getChips() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/chips'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => RfidChip.fromJson(e)).toList();
    }
    return [];
  }

  static Future<RfidChip> createChip({
    required String chipId,
    required String name,
    bool isAllowed = true,
    bool isOneTime = false,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/chips'),
      headers: _headers,
      body: jsonEncode({
        'chip_id': chipId,
        'name': name,
        'is_allowed': isAllowed,
        'is_one_time': isOneTime,
      }),
    );
    if (response.statusCode == 201) {
      return RfidChip.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to register chip');
  }

  static Future<String?> getLastUnknownChip() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/last-unknown-chip'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['chip_id'] as String?;
    }
    return null;
  }

  // Audit Logs
  static Future<List<Map<String, dynamic>>> getLogs({int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/logs?limit=$limit'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.cast<Map<String, dynamic>>();
    }
    return [];
  }
}
