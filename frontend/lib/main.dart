import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'widgets/adaptive_navigation_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GypriDilnaApp());
}

class GypriDilnaApp extends StatelessWidget {
  const GypriDilnaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gypri Dílna 2.0',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const AdaptiveNavigationShell(),
    );
  }
}
