import 'dart:async';

import 'package:flutter/material.dart';

/// ============================================================
/// MOCK PRODUCT MODEL
/// ============================================================

class MockProduct {
  final String id;
  final String name;
  final String category;
  final String size;
  final String price;
  final String description;
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;

  const MockProduct({
    required this.id,
    required this.name,
    required this.category,
    required this.size,
    required this.price,
    required this.description,
    required this.icon,
    required this.iconColor,
    required this.backgroundColor,
  });
}

/// ============================================================
/// FLOATING AI BUTTON
/// ============================================================

class AIFloatingButton extends StatefulWidget {
  const AIFloatingButton({super.key});

  @override
  State<AIFloatingButton> createState() => _AIFloatingButtonState();
}

class _AIFloatingButtonState extends State<AIFloatingButton> {
  Timer? _greetingTimer;

  bool _showGreeting = false;

  @override
  void initState() {
    super.initState();

    // Reveal the greeting after the first frame, then alternate its visibility
    // every 10 seconds so it can appear again after being dismissed.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      setState(() {
        _showGreeting = true;
      });

      _greetingTimer = Timer.periodic(const Duration(seconds: 10), (_) {
        if (!mounted) return;

        setState(() {
          _showGreeting = !_showGreeting;
        });
      });
    });
  }

  @override
  void dispose() {
    _greetingTimer?.cancel();
    super.dispose();
  }

  void _closeGreeting() {
    if (!mounted) return;

    // Stop the hide timer because the user closed it manually.
    _greetingTimer?.cancel();

    setState(() {
      _showGreeting = false;
    });
  }

  void _openAIChat() {
    // Hide the greeting when the user opens the chatbot.
    _closeGreeting();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return AIChatBox(
          onSeeMoreProducts: (category) {
            Navigator.pop(sheetContext);

            Future.delayed(const Duration(milliseconds: 250), () {
              if (!mounted) return;

              Navigator.pushNamed(
                context,
                '/products',
                arguments: {'category': category},
              );
            });
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 18,
      bottom: 92,
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Greeting popup.
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              switchInCurve: Curves.easeOut,
              switchOutCurve: Curves.easeIn,
              transitionBuilder: (Widget child, Animation<double> animation) {
                return FadeTransition(
                  opacity: animation,
                  child: ScaleTransition(
                    scale: animation,
                    alignment: Alignment.bottomRight,
                    child: child,
                  ),
                );
              },
              child: _showGreeting
                  ? _buildGreetingMessage()
                  : const SizedBox.shrink(),
            ),

            if (_showGreeting) const SizedBox(height: 12),

            // Floating robot button.
            GestureDetector(
              key: const ValueKey<String>('ai_robot_button'),
              onTap: _openAIChat,
              child: Container(
                width: 72,
                height: 72,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF15966D), width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.18),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/images/2agize_robot.png',
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(
                        Icons.smart_toy_rounded,
                        color: Color(0xFF15966D),
                        size: 38,
                      );
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGreetingMessage() {
    return Material(
      key: const ValueKey<String>('ai_greeting_popup'),
      color: Colors.transparent,
      child: InkWell(
        onTap: _openAIChat,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          width: 250,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE0EAE4)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.12),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: const Color(0xFFE5F6EE),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Image.asset(
                  'assets/images/2agize_robot.png',
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return const Icon(
                      Icons.smart_toy_rounded,
                      color: Color(0xFF15966D),
                      size: 24,
                    );
                  },
                ),
              ),

              const SizedBox(width: 10),

              const Expanded(
                child: Text(
                  'Hi! I am your 2Agize AI Assistant. '
                  'How can I help you today?',
                  style: TextStyle(
                    color: Color(0xFF244438),
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

              const SizedBox(width: 5),

              GestureDetector(
                onTap: _closeGreeting,
                child: const Icon(
                  Icons.close_rounded,
                  color: Color(0xFF789187),
                  size: 18,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// ============================================================
/// AI CHAT BOX
/// ============================================================

class AIChatBox extends StatefulWidget {
  final ValueChanged<String?>? onSeeMoreProducts;

  const AIChatBox({super.key, this.onSeeMoreProducts});

  @override
  State<AIChatBox> createState() => _AIChatBoxState();
}

class _AIChatBoxState extends State<AIChatBox> {
  final TextEditingController _messageController = TextEditingController();

  final ScrollController _scrollController = ScrollController();

  bool _isTyping = false;

  String? _selectedCategory;

  final Map<String, int> _productQuantities = {};

  final Set<String> _cartProductIds = {};

  final List<Map<String, dynamic>> _messages = [
    {
      'type': 'text',
      'isUser': false,
      'message':
          'Hi! 👋 I am your 2Agize AI Assistant.\n\n'
          'I can help you find products, browse categories, check offers, and view your orders.',
    },
  ];

  /// ============================================================
  /// MOCK PRODUCTS
  /// ============================================================

  final List<MockProduct> _mockProducts = const [
    MockProduct(
      id: 'water_500ml',
      name: 'A-One Drinking Water',
      category: 'Water',
      size: '500ml × 24 bottles',
      price: 'TSh 12,000',
      description:
          'Pure and refreshing A-One drinking water. Perfect for shops, offices, events, and daily use.',
      icon: Icons.water_drop_rounded,
      iconColor: Color(0xFF258ED1),
      backgroundColor: Color(0xFFE7F6FF),
    ),
    MockProduct(
      id: 'water_1500ml',
      name: 'A-One Drinking Water',
      category: 'Water',
      size: '1.5L × 12 bottles',
      price: 'TSh 18,000',
      description:
          'A-One 1.5 litre drinking water pack for home, office, travel, and family use.',
      icon: Icons.water_rounded,
      iconColor: Color(0xFF287FD1),
      backgroundColor: Color(0xFFEAF2FF),
    ),
    MockProduct(
      id: 'water_5l',
      name: 'A-One Family Water',
      category: 'Water',
      size: '5L × 4 bottles',
      price: 'TSh 16,000',
      description:
          'A-One family-size drinking water pack suitable for homes and offices.',
      icon: Icons.local_drink_rounded,
      iconColor: Color(0xFF176EB7),
      backgroundColor: Color(0xFFE5F3FF),
    ),
    MockProduct(
      id: 'fresh_juice',
      name: 'Fresh Fruit Juice',
      category: 'Juice',
      size: '500ml × 12 bottles',
      price: 'TSh 15,000',
      description:
          'Refreshing fruit juice with a delicious taste. Suitable for shops, restaurants, and events.',
      icon: Icons.local_drink_rounded,
      iconColor: Color(0xFFE69A27),
      backgroundColor: Color(0xFFFFF3DC),
    ),
    MockProduct(
      id: 'premium_soda',
      name: 'Premium Soda',
      category: 'Soda',
      size: '300ml × 24 bottles',
      price: 'TSh 20,000',
      description:
          'Refreshing premium soda pack for parties, restaurants, shops, and daily consumption.',
      icon: Icons.local_bar_rounded,
      iconColor: Color(0xFFE45C5C),
      backgroundColor: Color(0xFFFFE9E9),
    ),
    MockProduct(
      id: 'orange_juice',
      name: 'Orange Juice',
      category: 'Juice',
      size: '1L × 6 bottles',
      price: 'TSh 22,000',
      description:
          'Delicious orange juice pack for homes, offices, and restaurants.',
      icon: Icons.local_drink_rounded,
      iconColor: Color(0xFFF08A19),
      backgroundColor: Color(0xFFFFF0D7),
    ),
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();

    super.dispose();
  }

  /// ============================================================
  /// SEND MESSAGE
  /// ============================================================

  void _sendMessage([String? quickMessage]) {
    final text = (quickMessage ?? _messageController.text).trim();

    if (text.isEmpty || _isTyping) {
      return;
    }

    _messageController.clear();

    setState(() {
      _messages.add({'type': 'text', 'isUser': true, 'message': text});

      _isTyping = true;
    });

    _scrollToBottom();

    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;

      final response = _generateMockResponse(text);

      setState(() {
        _isTyping = false;
        _messages.add(response);
      });

      _scrollToBottom();
    });
  }

  /// ============================================================
  /// MOCK AI RESPONSE
  /// ============================================================

  Map<String, dynamic> _generateMockResponse(String userMessage) {
    final message = userMessage.toLowerCase();

    if (_containsAny(message, [
      'category',
      'categories',
      'category list',
      'browse category',
      'browse categories',
    ])) {
      return {
        'type': 'categoryGrid',
        'isUser': false,
        'message': 'Choose a category to explore products:',
      };
    }

    if (_containsAny(message, [
      'product',
      'products',
      'water',
      'juice',
      'soda',
      'drink',
      'beverage',
      'available',
      'show me',
    ])) {
      String? detectedCategory;

      if (message.contains('water')) {
        detectedCategory = 'Water';
      } else if (message.contains('juice')) {
        detectedCategory = 'Juice';
      } else if (message.contains('soda')) {
        detectedCategory = 'Soda';
      }

      _selectedCategory = detectedCategory;

      return {
        'type': 'productGrid',
        'isUser': false,
        'message': detectedCategory == null
            ? 'Here are some available products. You can select a category or view all products from the main product page.'
            : 'Here are the available $detectedCategory products:',
      };
    }

    if (_containsAny(message, [
      'offer',
      'offers',
      'discount',
      'promotion',
      'promo',
      'scheme',
    ])) {
      return {
        'type': 'text',
        'isUser': false,
        'message':
            '🏷️ Mock Offers\n\n'
            '• Buy 50 cartons of water and get special pricing.\n'
            '• Buy 100 cartons and unlock a bigger discount.\n'
            '• Combo offers are available for Water + Juice + Soda.\n\n'
            'Actual offer rules will be connected with the backend later.',
      };
    }

    if (_containsAny(message, [
      'order',
      'orders',
      'purchase',
      'delivery',
      'shipment',
    ])) {
      return {
        'type': 'text',
        'isUser': false,
        'message':
            '📦 My Orders\n\n'
            'This is a mock order response.\n\n'
            'Once the backend is connected, I will show your real orders, delivery status, order amount, and expected delivery date.',
      };
    }

    if (_containsAny(message, ['cart', 'basket'])) {
      return {
        'type': 'text',
        'isUser': false,
        'message':
            '🛒 Your Mock Cart\n\n'
            'You currently have ${_cartProductIds.length} different product(s) in your cart.',
      };
    }

    if (_containsAny(message, [
      'hello',
      'hi',
      'hey',
      'good morning',
      'good afternoon',
      'good evening',
    ])) {
      return {
        'type': 'text',
        'isUser': false,
        'message':
            'Hello! 👋\n\n'
            'You can ask me to find products, browse categories, show offers, or check your orders.',
      };
    }

    return {
      'type': 'text',
      'isUser': false,
      'message':
          'I am currently using mock data.\n\n'
          'You can try:\n'
          '• Find products\n'
          '• Browse categories\n'
          '• View offers\n'
          '• My orders\n'
          '• Show my cart',
    };
  }

  bool _containsAny(String text, List<String> keywords) {
    for (final keyword in keywords) {
      if (text.contains(keyword)) {
        return true;
      }
    }

    return false;
  }

  /// ============================================================
  /// SCROLL TO BOTTOM
  /// ============================================================

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) {
        return;
      }

      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  /// ============================================================
  /// ADD PRODUCT TO CART
  /// ============================================================

  void _addProductToCart(MockProduct product) {
    setState(() {
      _cartProductIds.add(product.id);

      _productQuantities[product.id] =
          (_productQuantities[product.id] ?? 0) + 1;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} added to cart'),
        backgroundColor: const Color(0xFF15966D),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  /// ============================================================
  /// INCREASE QUANTITY
  /// ============================================================

  void _increaseQuantity(MockProduct product) {
    setState(() {
      _productQuantities[product.id] =
          (_productQuantities[product.id] ?? 0) + 1;
    });
  }

  /// ============================================================
  /// DECREASE QUANTITY
  /// ============================================================

  void _decreaseQuantity(MockProduct product) {
    final currentQuantity = _productQuantities[product.id] ?? 0;

    if (currentQuantity <= 1) {
      setState(() {
        _productQuantities.remove(product.id);
        _cartProductIds.remove(product.id);
      });

      return;
    }

    setState(() {
      _productQuantities[product.id] = currentQuantity - 1;
    });
  }

  /// ============================================================
  /// SHOW PRODUCT DETAILS
  /// ============================================================

  void _showProductDetails(MockProduct product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (bottomSheetContext) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCE8E1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),

              const SizedBox(height: 22),

              Center(
                child: _buildProductVisual(
                  product,
                  width: 180,
                  height: 180,
                  iconSize: 82,
                ),
              ),

              const SizedBox(height: 20),

              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFE5F6EE),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  product.category,
                  style: const TextStyle(
                    color: Color(0xFF15966D),
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),

              const SizedBox(height: 12),

              Text(
                product.name,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1B382C),
                ),
              ),

              const SizedBox(height: 7),

              Text(
                product.size,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF7A9186),
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 12),

              Text(
                product.price,
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF15966D),
                ),
              ),

              const SizedBox(height: 14),

              Text(
                product.description,
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: Color(0xFF536E61),
                ),
              ),

              const SizedBox(height: 22),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(bottomSheetContext);

                    _addProductToCart(product);
                  },
                  icon: const Icon(Icons.shopping_cart_outlined),
                  label: const Text(
                    'Add to Cart',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF15966D),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// ============================================================
  /// MAIN CHAT UI
  /// ============================================================

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return AnimatedPadding(
      duration: const Duration(milliseconds: 200),
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.82,
        decoration: const BoxDecoration(
          color: Color(0xFFF7FAF8),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            _buildChatHeader(),

            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
                itemCount: _messages.length + (_isTyping ? 1 : 0),
                itemBuilder: (context, index) {
                  if (_isTyping && index == _messages.length) {
                    return _buildTypingIndicator();
                  }

                  final message = _messages[index];

                  final messageType = message['type'] as String? ?? 'text';

                  final isUser = message['isUser'] as bool? ?? false;

                  final messageText = message['message'] as String? ?? '';

                  if (messageType == 'productGrid') {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildMessageBubble(messageText, isUser),

                        const SizedBox(height: 12),

                        _buildProductGrid(),

                        const SizedBox(height: 16),
                      ],
                    );
                  }

                  if (messageType == 'categoryGrid') {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildMessageBubble(messageText, isUser),

                        const SizedBox(height: 12),

                        _buildCategoryGrid(),

                        const SizedBox(height: 16),
                      ],
                    );
                  }

                  return _buildMessageBubble(messageText, isUser);
                },
              ),
            ),

            _buildQuickActions(),

            _buildMessageInput(),
          ],
        ),
      ),
    );
  }

  /// ============================================================
  /// CHAT HEADER
  /// ============================================================

  Widget _buildChatHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 12, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(bottom: BorderSide(color: Color(0xFFE3ECE6))),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFE5F6EE),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Image.asset(
              'assets/images/2agize_robot_full.png',
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(
                  Icons.smart_toy_rounded,
                  color: Color(0xFF15966D),
                  size: 30,
                );
              },
            ),
          ),

          const SizedBox(width: 12),

          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '2Agize AI Assistant',
                  style: TextStyle(
                    color: Color(0xFF1B382C),
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),

                SizedBox(height: 4),

                Row(
                  children: [
                    Icon(Icons.circle, color: Color(0xFF27B879), size: 9),

                    SizedBox(width: 5),

                    Text(
                      'Online • Mock Assistant',
                      style: TextStyle(
                        color: Color(0xFF7A9186),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          if (_cartProductIds.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: const Color(0xFFE5F6EE),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.shopping_cart_outlined,
                    color: Color(0xFF15966D),
                    size: 17,
                  ),

                  const SizedBox(width: 5),

                  Text(
                    '${_cartProductIds.length}',
                    style: const TextStyle(
                      color: Color(0xFF15966D),
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(width: 8),

          GestureDetector(
            onTap: () {
              Navigator.pop(context);
            },
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F6F3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.close_rounded,
                color: Color(0xFF567267),
                size: 21,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// ============================================================
  /// MESSAGE BUBBLE
  /// ============================================================

  Widget _buildMessageBubble(String message, bool isUser) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isUser ? const Color(0xFF15966D) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 18 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 18),
          ),
          border: isUser ? null : Border.all(color: const Color(0xFFE1EAE5)),
        ),
        child: Text(
          message,
          style: TextStyle(
            color: isUser ? Colors.white : const Color(0xFF29463A),
            fontSize: 13,
            height: 1.45,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  /// ============================================================
  /// TYPING INDICATOR
  /// ============================================================

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE1EAE5)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 7,
              height: 7,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0xFF15966D),
                  shape: BoxShape.circle,
                ),
              ),
            ),

            SizedBox(width: 5),

            SizedBox(
              width: 7,
              height: 7,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0xFF15966D),
                  shape: BoxShape.circle,
                ),
              ),
            ),

            SizedBox(width: 5),

            SizedBox(
              width: 7,
              height: 7,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0xFF15966D),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// ============================================================
  /// QUICK ACTIONS
  /// ============================================================

  Widget _buildQuickActions() {
    final actions = [
      {'label': '🛒 Find products', 'message': 'Show me available products'},
      {'label': '📂 Categories', 'message': 'Show product categories'},
      {'label': '🏷️ View offers', 'message': 'Show me available offers'},
      {'label': '📦 My orders', 'message': 'Show my orders'},
    ];

    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: actions.length,
        separatorBuilder: (context, index) {
          return const SizedBox(width: 8);
        },
        itemBuilder: (context, index) {
          final action = actions[index];

          return OutlinedButton(
            onPressed: () {
              _sendMessage(action['message'] as String);
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF15966D),
              backgroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFFD4E7DC)),
              padding: const EdgeInsets.symmetric(horizontal: 13),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Text(
              action['label'] as String,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          );
        },
      ),
    );
  }

  /// ============================================================
  /// MESSAGE INPUT
  /// ============================================================

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE1EAE5))),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) {
                _sendMessage();
              },
              decoration: InputDecoration(
                hintText: 'Ask me anything...',
                hintStyle: const TextStyle(
                  color: Color(0xFF9AAFA5),
                  fontSize: 13,
                ),
                filled: true,
                fillColor: const Color(0xFFF4F8F5),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(17),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(17),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(17),
                  borderSide: const BorderSide(color: Color(0xFF15966D)),
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          GestureDetector(
            onTap: () {
              _sendMessage();
            },
            child: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: _isTyping
                    ? const Color(0xFF9AAFA5)
                    : const Color(0xFF15966D),
                borderRadius: BorderRadius.circular(17),
              ),
              child: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// ============================================================
  /// PRODUCT GRID
  /// ============================================================

  Widget _buildProductGrid() {
    final filteredProducts = _selectedCategory == null
        ? _mockProducts
        : _mockProducts
              .where(
                (product) =>
                    product.category.toLowerCase() ==
                    _selectedCategory!.toLowerCase(),
              )
              .toList();

    final displayedProducts = filteredProducts.take(4).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_selectedCategory != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5F6EE),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _selectedCategory!,
                    style: const TextStyle(
                      color: Color(0xFF15966D),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),

                const Spacer(),

                GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedCategory = null;
                    });
                  },
                  child: const Text(
                    'Clear filter',
                    style: TextStyle(
                      color: Color(0xFF15966D),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),

        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: displayedProducts.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.73,
          ),
          itemBuilder: (context, index) {
            final product = displayedProducts[index];

            return _buildProductCard(product);
          },
        ),

        const SizedBox(height: 14),

        _buildSeeMoreProductsButton(),
      ],
    );
  }

  /// ============================================================
  /// SEE MORE PRODUCTS BUTTON
  /// ============================================================

  Widget _buildSeeMoreProductsButton() {
    return GestureDetector(
      onTap: () {
        widget.onSeeMoreProducts?.call(_selectedCategory);
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFE5F6EE),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFBDE4D0)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'See More Products',
              style: TextStyle(
                color: Color(0xFF15966D),
                fontSize: 13,
                fontWeight: FontWeight.w900,
              ),
            ),

            SizedBox(width: 8),

            Icon(
              Icons.arrow_forward_rounded,
              color: Color(0xFF15966D),
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  /// ============================================================
  /// CATEGORY GRID
  /// ============================================================

  Widget _buildCategoryGrid() {
    final categories = [
      {
        'name': 'Water',
        'subtitle': 'Drinking water products',
        'icon': Icons.water_drop_rounded,
        'iconColor': const Color(0xFF258ED1),
        'backgroundColor': const Color(0xFFE7F6FF),
      },
      {
        'name': 'Juice',
        'subtitle': 'Fresh juice products',
        'icon': Icons.local_drink_rounded,
        'iconColor': const Color(0xFFE69A27),
        'backgroundColor': const Color(0xFFFFF3DC),
      },
      {
        'name': 'Soda',
        'subtitle': 'Soft drink products',
        'icon': Icons.local_bar_rounded,
        'iconColor': const Color(0xFFE45C5C),
        'backgroundColor': const Color(0xFFFFE9E9),
      },
    ];

    return Column(
      children: [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: categories.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.35,
          ),
          itemBuilder: (context, index) {
            final category = categories[index];

            return _buildCategoryCard(
              name: category['name'] as String,
              subtitle: category['subtitle'] as String,
              icon: category['icon'] as IconData,
              iconColor: category['iconColor'] as Color,
              backgroundColor: category['backgroundColor'] as Color,
            );
          },
        ),

        const SizedBox(height: 12),

        GestureDetector(
          onTap: () {
            widget.onSeeMoreProducts?.call(null);
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFE5F6EE),
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Center(
              child: Text(
                'View All Products',
                style: TextStyle(
                  color: Color(0xFF15966D),
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// ============================================================
  /// CATEGORY CARD
  /// ============================================================

  Widget _buildCategoryCard({
    required String name,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color backgroundColor,
  }) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategory = name;

          _messages.add({
            'type': 'productGrid',
            'isUser': false,
            'message': 'Here are the available $name products:',
          });
        });

        _scrollToBottom();
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE1EAE5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.035),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: backgroundColor,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(icon, color: iconColor, size: 25),
            ),

            const Spacer(),

            Text(
              name,
              style: const TextStyle(
                color: Color(0xFF1B382C),
                fontSize: 14,
                fontWeight: FontWeight.w900,
              ),
            ),

            const SizedBox(height: 3),

            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF81968B),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// ============================================================
  /// MODERN PRODUCT CARD
  /// ============================================================

  Widget _buildProductCard(MockProduct product) {
    final quantity = _productQuantities[product.id] ?? 0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () {
          _showProductDetails(product);
        },
        child: Container(
          padding: const EdgeInsets.all(11),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE1EAE5)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.035),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  _buildProductVisual(
                    product,
                    width: double.infinity,
                    height: 108,
                    iconSize: 54,
                  ),

                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: Text(
                        product.category,
                        style: const TextStyle(
                          color: Color(0xFF15966D),
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              Text(
                product.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF1B382C),
                  fontSize: 12,
                  height: 1.25,
                  fontWeight: FontWeight.w900,
                ),
              ),

              const SizedBox(height: 5),

              Text(
                product.size,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF81968B),
                  fontSize: 10,
                  height: 1.25,
                  fontWeight: FontWeight.w600,
                ),
              ),

              const Spacer(),

              const SizedBox(height: 8),

              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      product.price,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF15966D),
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),

                  const SizedBox(width: 6),

                  if (quantity == 0)
                    GestureDetector(
                      onTap: () {
                        _addProductToCart(product);
                      },
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: const Color(0xFF15966D),
                          borderRadius: BorderRadius.circular(11),
                        ),
                        child: const Icon(
                          Icons.add_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    )
                  else
                    Container(
                      height: 32,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE5F6EE),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _quantityButton(
                            icon: Icons.remove_rounded,
                            onTap: () {
                              _decreaseQuantity(product);
                            },
                          ),

                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 5),
                            child: Text(
                              '$quantity',
                              style: const TextStyle(
                                color: Color(0xFF15966D),
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),

                          _quantityButton(
                            icon: Icons.add_rounded,
                            onTap: () {
                              _increaseQuantity(product);
                            },
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// ============================================================
  /// PRODUCT VISUAL
  /// ============================================================

  Widget _buildProductVisual(
    MockProduct product, {
    required double width,
    required double height,
    required double iconSize,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: product.backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Icon(product.icon, color: product.iconColor, size: iconSize),
      ),
    );
  }

  /// ============================================================
  /// QUANTITY BUTTON
  /// ============================================================

  Widget _quantityButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 25,
        height: 25,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: const Color(0xFF15966D), size: 15),
      ),
    );
  }
}
