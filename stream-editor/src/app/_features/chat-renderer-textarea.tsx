"use client";

import { useAtomValue } from "jotai";
import React, { useState } from "react";
import { editorAtom } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, SendHorizontalIcon, Loader2Icon } from "lucide-react";

interface Props {
  onSend: ({ message, context }: { message: string; context: string }) => Promise<void>;
  isSending?: boolean;
}

export const ChatRendererTextArea = ({ onSend, isSending }: Props) => {
  const editor = useAtomValue(editorAtom);
  const [message, setMessage] = useState("");

  if (!editor) return <div>Loading editor context...</div>;

  const handleSend = async () => {
    if (!message.trim()) return;

    await onSend({
      message: message.trim(),
      context: "",
    });
    setMessage("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="border border-neutral-800 w-full bg-neutral-900 p-4 rounded-xl space-y-4">
        <Textarea placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={onKeyDown} disabled={isSending} className="text-sm resize-none min-h-[60px]" />

        <div className="w-full flex justify-between items-center">
          <Button className="rounded-full text-xs" size={"sm"} variant="outline" disabled={true}>
            <PlusIcon size={16} /> Reference Book
          </Button>

          <Button className="rounded-full w-10 h-10" onClick={handleSend} disabled={isSending}>
            {isSending ? <Loader2Icon size={16} className="animate-spin" /> : <SendHorizontalIcon size={16} />}
          </Button>
        </div>
      </div>

      <small className="flex justify-center items-center mx-auto mt-2 text-neutral-400">
        Powered by Vesper AI. Built by <span className="pl-1 underline cursor-pointer">Logan</span>
      </small>
    </>
  );
};
