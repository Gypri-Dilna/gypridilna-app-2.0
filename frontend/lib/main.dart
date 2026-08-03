import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'widgets/adaptive_navigation_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GypriDilnaApp());
}

class GypriDilnaApp extends StatefulWidget {
  const GypriDilnaApp({super.key});

  @override
  State<GypriDilnaApp> createState() => _GypriDilnaAppState();
}

class _GypriDilnaAppState extends State<GypriDilnaApp> {
  bool isLoggedIn = false;
  bool isCheckingAuth = true;

  @override
  void initState() {
    super.initState();
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedToken = prefs.getString('jwt_token');
      if (savedToken != null && savedToken.isNotEmpty) {
        ApiService.authToken = savedToken;
        setState(() {
          isLoggedIn = true;
          isCheckingAuth = false;
        });
        return;
      }
    } catch (e) {
      // Fallback
    }
    setState(() => isCheckingAuth = false);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gypri Dílna 2.0',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: isCheckingAuth
          ? const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            )
          : (isLoggedIn
              ? const AdaptiveNavigationShell()
              : LoginScreen(
                  onLoginSuccess: () {
                    setState(() => isLoggedIn = true);
                  },
                )),
    );
  }
}
