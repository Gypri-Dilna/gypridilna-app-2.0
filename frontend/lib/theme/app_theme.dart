import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color circuitMint = Color(0xFF3AA69A);
  static const Color circuitMintLight = Color(0xFF4DC6B8);
  static const Color graphiteCore = Color(0xFF2F353E);
  static const Color graphiteCoreSurface = Color(0xFF3A4049);
  static const Color graphiteCoreBorder = Color(0xFF4F5661);
  static const Color cloudPaper = Color(0xFFFAFDFF);
  static const Color cloudPaperMuted = Color(0xA0A8B6);
  
  // Status Colors
  static const Color statusGranted = Color(0xFF2ECC71);
  static const Color statusDenied = Color(0xFFE74C3C);
  static const Color statusWarning = Color(0xFFF39C12);
  static const Color statusInfo = Color(0xFF3498DB);
}

class AppTheme {
  static ThemeData get darkTheme {
    final baseTextTheme = GoogleFonts.montserratTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.graphiteCore,
      primaryColor: AppColors.circuitMint,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.circuitMint,
        secondary: AppColors.circuitMintLight,
        surface: AppColors.graphiteCoreSurface,
        background: AppColors.graphiteCore,
        onPrimary: AppColors.graphiteCore,
        onSurface: AppColors.cloudPaper,
        onBackground: AppColors.cloudPaper,
        error: AppColors.statusDenied,
      ),
      cardTheme: CardThemeData(
        color: AppColors.graphiteCoreSurface,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.graphiteCoreBorder, width: 1),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.graphiteCoreSurface,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: AppColors.cloudPaper),
        titleTextStyle: TextStyle(
          color: AppColors.cloudPaper,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.circuitMint,
          foregroundColor: AppColors.graphiteCore,
          minimumSize: const Size(88, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.montserrat(
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.circuitMint,
          side: const BorderSide(color: AppColors.circuitMint, width: 1.5),
          minimumSize: const Size(88, 48),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.montserrat(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.graphiteCoreSurface,
        hintStyle: const TextStyle(color: AppColors.cloudPaperMuted),
        labelStyle: const TextStyle(color: AppColors.cloudPaper),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.graphiteCoreBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.graphiteCoreBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.circuitMint, width: 2),
        ),
      ),
      textTheme: GoogleFonts.montserratTextTheme(
        const TextTheme(
          displayLarge: TextStyle(color: AppColors.cloudPaper, fontWeight: FontWeight.bold),
          titleLarge: TextStyle(color: AppColors.cloudPaper, fontWeight: FontWeight.w700),
          titleMedium: TextStyle(color: AppColors.cloudPaper, fontWeight: FontWeight.w600),
          bodyLarge: TextStyle(color: AppColors.cloudPaper, fontWeight: FontWeight.w500),
          bodyMedium: TextStyle(color: AppColors.cloudPaper, fontWeight: FontWeight.w400),
          bodySmall: TextStyle(color: AppColors.cloudPaperMuted, fontWeight: FontWeight.w400),
        ),
      ),
    );
  }
}
