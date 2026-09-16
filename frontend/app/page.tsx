"use client";

import { ChatPanel } from "../components/ChatPanel";

export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:3001";

  return (
    <main style={{ padding: 16 }}>
      <ChatPanel apiUrl={apiUrl} />
    </main>
  );
}
