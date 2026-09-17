
import 'dart:async';

import 'home_screen.dart';
import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  Timer? _timer;

  late final AnimationController _animationController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    // Robot animation
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(
      begin: 0.96,
      end: 1.04,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );

    // Wait 10 seconds before opening Home Screen
    _timer = Timer(
      const Duration(seconds: 10),
      _openHomeScreen,
    );
  }

  void _openHomeScreen() {
    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => const HomeScreen(),
      ),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF5FFFB),
              Color(0xFFE1F8EF),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Spacer(),

              // Brand
              const Text(
                '2Agize',
                style: TextStyle(
                  fontSize: 42,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF123D35),
                  letterSpacing: -1.5,
                ),
              ),

              const SizedBox(height: 8),

              const Text(
                'Good Products. Brighter Tomorrows.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF47766B),
                  fontWeight: FontWeight.w500,
                ),
              ),

              const SizedBox(height: 40),

              // Animated AI Robot
              // Animated AI Robot
ScaleTransition(
  scale: _scaleAnimation,
  child: Container(
    width: 280,
    height: 280,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: Colors.white.withValues(alpha: 0.65),
      boxShadow: [
        BoxShadow(
          color: const Color(0xFF36B88A)
              .withValues(alpha: 0.15),
          blurRadius: 40,
          spreadRadius: 10,
        ),
      ],
    ),
    child: Image.asset(
      'assets/images/2agize_robot.png',
      width: 250,
      height: 250,
      fit: BoxFit.contain,
    ),
  ),
),

              const SizedBox(height: 35),

              const Text(
                'Hi there! 👋',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF123D35),
                ),
              ),

              const SizedBox(height: 12),

              const Text(
                'Loading your shopping experience...',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF5C8177),
                ),
              ),

              const SizedBox(height: 22),

              // Loading indicator
              SizedBox(
                width: 210,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: const LinearProgressIndicator(
                    minHeight: 7,
                    backgroundColor: Color(0xFFC8EBDD),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Color(0xFF15966D),
                    ),
                  ),
                ),
              ),

              const Spacer(),

              const Padding(
                padding: EdgeInsets.only(bottom: 25),
                child: Text(
                  'Shop Smarter. Live Better. 🌿',
                  style: TextStyle(
                    fontSize: 13,
                    color: Color(0xFF47766B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Temporary screen to verify navigation works.
// We will replace this with the actual Home Screen next.
class HomePlaceholderScreen extends StatelessWidget {
  const HomePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text(
          '2Agize Home Screen\nComing Next 🚀',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}