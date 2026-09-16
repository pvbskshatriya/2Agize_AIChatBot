"use client";

import { ChatPanel } from "../../components/ChatPanel";

export default function WidgetPage() {
  const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:3001";

  return (
    <main style={{ height: "100vh", background: "transparent" }}>
      <ChatPanel apiUrl={apiUrl} compact />
    </main>
  );
}
