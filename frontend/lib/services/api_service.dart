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

  // Minimap Zones
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
