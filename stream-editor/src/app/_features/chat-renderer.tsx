"use client";

import { useChat } from "@/hooks/use-chat";
import { ChatRendererTextArea } from "./chat-renderer-textarea";
import ChatRendererConversation from "./chat-renderer-conversation";
import { ChatRendererEmptyConversation } from "./chat-renderer-empty-conversation";

export const ChatRenderer = () => {
  const { messages, sendMessage, isSending, setMessages } = useChat();

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <ChatRendererEmptyConversation messages={messages} sendMessage={sendMessage} />
        <ChatRendererConversation messages={messages} setMessages={setMessages} />
      </div>

      <div className="p-6">
        <ChatRendererTextArea onSend={sendMessage} isSending={isSending} />
      </div>
    </div>
  );
};
