import 'package:flutter/material.dart';

import '../widgets/ai_floating_button.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAF8),

      body: SafeArea(
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Main home screen content.
            CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                // Green gradient header.
                SliverToBoxAdapter(child: _buildHeader()),

                // Search bar.
                SliverToBoxAdapter(child: _buildSearchBar()),

                // Hero banner.
                SliverToBoxAdapter(child: _buildHeroBanner()),

                // Categories.
                SliverToBoxAdapter(child: _buildCategories()),

                // Product title.
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 12, 20, 12),
                    child: Text(
                      'Popular Products',
                      style: TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF153D32),
                      ),
                    ),
                  ),
                ),

                // Sample products.
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid(
                    delegate: SliverChildBuilderDelegate((context, index) {
                      return _buildProductCard(context, index);
                    }, childCount: 4),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.67,
                        ),
                  ),
                ),

                // Extra space for the floating AI assistant.
                const SliverToBoxAdapter(child: SizedBox(height: 160)),
              ],
            ),

            // Floating AI assistant.
            //
            // AIFloatingButton returns a Positioned widget,
            // therefore it must be directly inside this Stack.
            const AIFloatingButton(),
          ],
        ),
      ),

      // Bottom navigation.
      bottomNavigationBar: _buildBottomNavigation(),
    );
  }

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0B7656), Color(0xFF16A77A), Color(0xFF65D9A8)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                '2Agize',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1,
                ),
              ),

              const Spacer(),

              _headerIcon(Icons.notifications_none_rounded),

              const SizedBox(width: 8),

              _headerIcon(Icons.shopping_bag_outlined),
            ],
          ),

          const SizedBox(height: 18),

          Row(
            children: [
              const Icon(
                Icons.location_on_outlined,
                color: Colors.white,
                size: 18,
              ),

              const SizedBox(width: 5),

              const Text(
                'Dar es Salaam',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),

              const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Colors.white,
                size: 18,
              ),
            ],
          ),

          const SizedBox(height: 10),

          const Text(
            'Good Products.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),

          const Text(
            'Brighter Tomorrows.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _headerIcon(IconData icon) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: Colors.white, size: 22),
    );
  }

  // ----------------------------------------------------------
  // SEARCH BAR
  // ----------------------------------------------------------

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE1EAE5)),
        ),
        child: const Row(
          children: [
            SizedBox(width: 16),

            Icon(Icons.search_rounded, color: Color(0xFF6C8A7E)),

            SizedBox(width: 12),

            Text(
              'Search for products...',
              style: TextStyle(color: Color(0xFF8AA096), fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  // ----------------------------------------------------------
  // HERO BANNER
  // ----------------------------------------------------------

  Widget _buildHeroBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 14, 20, 20),
      height: 170,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF075E45), Color(0xFF19AD7E)],
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Pure Refreshment',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w800,
                  ),
                ),

                const Text(
                  'For a Better Tomorrow',
                  style: TextStyle(color: Colors.white, fontSize: 15),
                ),

                const SizedBox(height: 16),

                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text(
                    'Shop Now  →',
                    style: TextStyle(
                      color: Color(0xFF075E45),
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

  Widget _buildCategories() {
    final categories = [
      {'name': 'Water', 'icon': Icons.water_drop_rounded},
      {'name': 'Juice', 'icon': Icons.local_drink_rounded},
      {'name': 'Soda', 'icon': Icons.local_bar_rounded},
      {'name': 'Snacks', 'icon': Icons.fastfood_rounded},
      {'name': 'All', 'icon': Icons.grid_view_rounded},
    ];

    return SizedBox(
      height: 110,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];

          return GestureDetector(
            onTap: () {
              // Add category navigation here later.
            },
            child: Container(
              width: 70,
              margin: const EdgeInsets.only(right: 14),
              child: Column(
                children: [
                  Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE5F6EE),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      category['icon'] as IconData,
                      color: const Color(0xFF15966D),
                      size: 28,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Text(
                    category['name'] as String,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF38574B),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ----------------------------------------------------------
  // PRODUCT CARD
  // ----------------------------------------------------------

  Widget _buildProductCard(BuildContext context, int index) {
    final products = [
      {
        'name': 'A-One Drinking Water',
        'size': '500ml × 24',
        'price': 'TSh 12,000',
        'icon': Icons.water_drop_rounded,
      },
      {
        'name': 'A-One Drinking Water',
        'size': '1.5L × 12',
        'price': 'TSh 18,000',
        'icon': Icons.water_rounded,
      },
      {
        'name': 'Fresh Juice',
        'size': '500ml × 12',
        'price': 'TSh 15,000',
        'icon': Icons.local_drink_rounded,
      },
      {
        'name': 'Premium Soda',
        'size': '300ml × 24',
        'price': 'TSh 20,000',
        'icon': Icons.local_bar_rounded,
      },
    ];

    final product = products[index];

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE4EDE7)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFF0F8F3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                product['icon'] as IconData,
                size: 68,
                color: const Color(0xFF15966D),
              ),
            ),
          ),

          const SizedBox(height: 10),

          Text(
            product['name'] as String,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: Color(0xFF1B382C),
            ),
          ),

          const SizedBox(height: 4),

          Text(
            product['size'] as String,
            style: const TextStyle(fontSize: 11, color: Color(0xFF7A9186)),
          ),

          const SizedBox(height: 6),

          Text(
            product['price'] as String,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: Color(0xFF15966D),
            ),
          ),

          const SizedBox(height: 10),

          SizedBox(
            width: double.infinity,
            height: 38,
            child: ElevatedButton(
              onPressed: () {
                // Cart functionality will be added later.
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${product['name']} added to cart'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF15966D),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Add to Cart',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------
  // BOTTOM NAVIGATION
  // ----------------------------------------------------------

  Widget _buildBottomNavigation() {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: 0,
      selectedItemColor: const Color(0xFF15966D),
      unselectedItemColor: const Color(0xFF9AAFA5),
      backgroundColor: Colors.white,
      elevation: 10,

      selectedLabelStyle: const TextStyle(
        fontWeight: FontWeight.w700,
        fontSize: 11,
      ),

      unselectedLabelStyle: const TextStyle(fontSize: 11),

      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),

        BottomNavigationBarItem(
          icon: Icon(Icons.grid_view_rounded),
          label: 'Categories',
        ),

        BottomNavigationBarItem(
          icon: Icon(Icons.local_offer_outlined),
          label: 'Offers',
        ),

        BottomNavigationBarItem(
          icon: Icon(Icons.shopping_bag_outlined),
          label: 'Orders',
        ),

        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline_rounded),
          label: 'Account',
        ),
      ],
    );
  }
}
