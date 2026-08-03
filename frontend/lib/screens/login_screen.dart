import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({super.key, required this.onLoginSuccess});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final usernameController = TextEditingController(text: 'admin');
  final passwordController = TextEditingController(text: 'password');
  bool isLoading = false;
  String? errorMessage;

  Future<void> _handleLogin() async {
    final username = usernameController.text.trim();
    final password = passwordController.text;

    if (username.isEmpty || password.isEmpty) {
      setState(() => errorMessage = 'Please enter username and password');
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final res = await ApiService.login(username, password);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jwt_token', res['access_token']);
      await prefs.setString('username', res['username']);
      await prefs.setString('role', res['role']);

      if (mounted) {
        widget.onLoginSuccess();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoading = false;
          final errStr = e.toString();
          if (errStr.contains('SocketException') || errStr.contains('Connection refused') || errStr.contains('Failed to fetch')) {
            errorMessage = 'Cannot connect to backend server at http://localhost:8000. Ensure uvicorn is running.';
          } else {
            errorMessage = 'Invalid username or password.';
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.graphiteCore,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 420),
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppColors.graphiteCoreSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.graphiteCoreBorder, width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: AppColors.circuitMint.withOpacity(0.15),
                  blurRadius: 24,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Logo SVG Banner
                SvgPicture.asset(
                  'assets/logos/logo bile (1).svg',
                  height: 48,
                  placeholderBuilder: (_) => const Text(
                    'GYPRI DÍLNA',
                    style: TextStyle(
                      color: AppColors.circuitMint,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'GYPRI DÍLNA 2.0',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.cloudPaper,
                        letterSpacing: 1.2,
                        fontSize: 22,
                      ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Unified Access & Inventory System Sign In',
                  style: TextStyle(color: AppColors.cloudPaperMuted, fontSize: 13),
                ),
                const SizedBox(height: 32),

                if (errorMessage != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.statusDenied.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.statusDenied),
                    ),
                    child: Text(
                      errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.statusDenied, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                TextField(
                  controller: usernameController,
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    prefixIcon: Icon(Icons.person_outline, color: AppColors.circuitMint),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline, color: AppColors.circuitMint),
                  ),
                  onSubmitted: (_) => _handleLogin(),
                ),
                const SizedBox(height: 28),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : _handleLogin,
                    child: isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.graphiteCore),
                          )
                        : const Text('SIGN IN TO WORKSHOP'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
