"use client";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { ChatRenderer } from "./_features/chat-renderer";
import { CanvasRenderer } from "./_features/canvas-renderer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { EditorContentProvider } from "@/providers/editor-content-provider";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const { isMobile } = useIsMobile();

  return (
    <EditorContentProvider>
      <div className="relative font-sans h-screen grid grid-cols-1 lg:grid-cols-3">
        <div className="hidden lg:flex border-r border-neutral-800 bg-neutral-950 h-full overflow-scroll">
          <ChatRenderer />
        </div>

        <div className="lg:col-span-2 bg-neutral-900 p-8 h-full overflow-scroll">
          <CanvasRenderer />
        </div>

        {isMobile && (
          <>
            <div className="fixed bottom-4 right-4 z-50">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-neutral-800 border-neutral-700 lg:hidden" variant={"outline"}>
                    Chat with AI
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md p-0 h-9/12 lg:hidden">
                  <VisuallyHidden>
                    <DialogTitle>Chat</DialogTitle>
                  </VisuallyHidden>
                  <div className="bg-neutral-950 h-full flex flex-col">
                    <div className="flex-1 overflow-scroll">
                      <ChatRenderer />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </div>
    </EditorContentProvider>
  );
}
