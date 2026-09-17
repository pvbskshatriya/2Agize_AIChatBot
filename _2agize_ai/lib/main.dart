import 'package:flutter/material.dart';

import 'screens/splash_screen.dart';
import 'screens/products_page.dart';

void main() {
  runApp(const TwoAgizeApp());
}

class TwoAgizeApp extends StatelessWidget {
  const TwoAgizeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,

      title: '2Agize AI',

      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF15966D)),
      ),

      home: const SplashScreen(),

      routes: {
        '/products': (context) {
          return const ProductsPage();
        },
      },
    );
  }
}
