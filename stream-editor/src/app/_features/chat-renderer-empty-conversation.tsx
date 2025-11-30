import { ChatMessage } from "@/types";

interface Props {
  messages: ChatMessage[];
  sendMessage: ({ message, context }: { message: string; context: string }) => Promise<void>;
}

export const ChatRendererEmptyConversation = ({ messages, sendMessage }: Props) => {
  const onSendMessage = (prompt: string) => {
    sendMessage({
      message: prompt.trim(),
      context: "",
    });
  };

  if (messages.length) {
    return null;
  }

  return (
    <div className="h-full flex flex-col justify-center items-center gap-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold leading-3">
          Vesper<span className="text-neutral-500">AI</span>
        </h2>
        <p className="text-sm">Try out some of these prompts.</p>
      </div>

      <div className="flex-wrap flex justify-center gap-2">
        {defaultPropmts.map((prompt, idx) => (
          <div key={idx} onClick={() => onSendMessage(prompt)} className="text-nowrap rounded-full border border-neutral-800 text-sm px-4 py-2 bg-neutral-900 hover:bg-neutral-800 cursor-pointer duration-150 ease-in-out">
            {prompt}
          </div>
        ))}
      </div>
    </div>
  );
};

const defaultPropmts = ["Generate a short math quiz", "Generate something", "Generate another thing"];
