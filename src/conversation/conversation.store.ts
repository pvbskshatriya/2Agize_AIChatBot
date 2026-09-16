import type { Conversation } from "../ai/types.js";

export interface ConversationStore {
  get(id: string): Conversation | undefined;
  upsert(conversation: Conversation): Conversation;
}

const MAX_CONVERSATIONS = 200;
const MAX_MESSAGES = 40;

class InMemoryConversationStore implements ConversationStore {
  private readonly conversations = new Map<string, Conversation>();

  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  upsert(conversation: Conversation): Conversation {
    const trimmed: Conversation = {
      ...conversation,
      messages: conversation.messages.slice(-MAX_MESSAGES),
      updatedAt: Date.now(),
    };

    this.conversations.set(trimmed.id, trimmed);

    if (this.conversations.size > MAX_CONVERSATIONS) {
      const oldest = this.conversations.keys().next().value;
      if (oldest) {
        this.conversations.delete(oldest);
      }
    }

    return trimmed;
  }
}

export const conversationStore: ConversationStore =
  new InMemoryConversationStore();
