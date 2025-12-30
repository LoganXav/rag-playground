import { editorStore } from "@/store/editor";
import { EditorProvider, EditorProviderProps, JSONContent } from "@tiptap/react";
import { Provider } from "jotai";
import { FC, forwardRef, ReactNode, useRef } from "react";
import tunnel from "tunnel-rat";
import { EditorCommandTunnelContext } from "./editor-command";

export interface EditorRootProps {
  children: ReactNode;
}

export const EditorRoot: FC<EditorRootProps> = ({ children }) => {
  const tunnelInstance = useRef(tunnel()).current;

  return (
    <Provider store={editorStore}>
      <EditorCommandTunnelContext.Provider value={tunnelInstance}>{children}</EditorCommandTunnelContext.Provider>
    </Provider>
  );
};
export type EditorContentProps = Omit<EditorProviderProps, "content"> & {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly initialContent?: JSONContent;
};

export const EditorContent = forwardRef<HTMLDivElement, EditorContentProps>(({ children, initialContent, className, ...rest }, ref) => (
  <div className={className} ref={ref}>
    <EditorProvider {...rest} content={initialContent}>
      {children}
    </EditorProvider>
  </div>
));

EditorContent.displayName = "EditorContent";
