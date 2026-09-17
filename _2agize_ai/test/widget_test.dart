import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:_2agize_ai/screens/home_screen.dart';
import 'package:_2agize_ai/widgets/ai_floating_button.dart';

void main() {
  testWidgets('AI greeting popup cycles every 10 seconds', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: HomeScreen()));
    await tester.pump();

    expect(
      find.byKey(const ValueKey<String>('ai_greeting_popup')),
      findsOneWidget,
    );

    await tester.pump(const Duration(seconds: 10));
    await tester.pumpAndSettle();

    expect(
      find.byKey(const ValueKey<String>('ai_greeting_popup')),
      findsNothing,
    );

    await tester.pump(const Duration(seconds: 10));
    await tester.pumpAndSettle();

    expect(
      find.byKey(const ValueKey<String>('ai_greeting_popup')),
      findsOneWidget,
    );
  });

  testWidgets('AI button opens the chat popup', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: HomeScreen()));

    await tester.tap(find.byKey(const ValueKey<String>('ai_robot_button')));
    await tester.pumpAndSettle();

    expect(find.byType(AIChatBox), findsOneWidget);
  });
}
