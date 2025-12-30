import { Command } from "cmdk";
import { useAtom, useSetAtom } from "jotai";
import type tunnel from "tunnel-rat";
import { editorStore, queryAtom, rangeAtom } from "@/store/editor";
import { ComponentPropsWithoutRef, createContext, FC, forwardRef, useEffect } from "react";
import type { Range } from "@tiptap/core";

export const EditorCommandTunnelContext = createContext({} as ReturnType<typeof tunnel>);

interface EditorCommandOutProps {
  readonly query: string;
  readonly range: Range;
}

export const EditorCommandOut: FC<EditorCommandOutProps> = ({ query, range }) => {
  const setQuery = useSetAtom(queryAtom, { store: editorStore });
  const setRange = useSetAtom(rangeAtom, { store: editorStore });

  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  useEffect(() => {
    setRange(range);
  }, [range, setRange]);

  useEffect(() => {
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        const commandRef = document.querySelector("#slash-command");

        if (commandRef)
          commandRef.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: e.key,
              cancelable: true,
              bubbles: true,
            })
          );

        return false;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return <EditorCommandTunnelContext.Consumer>{(tunnelInstance) => <tunnelInstance.Out />}</EditorCommandTunnelContext.Consumer>;
};

export const EditorCommand = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof Command>>(({ children, className, ...rest }, ref) => {
  const [query, setQuery] = useAtom(queryAtom);

  return (
    <EditorCommandTunnelContext.Consumer>
      {(tunnelInstance) => (
        <tunnelInstance.In>
          <Command
            ref={ref}
            className={className}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
            id="slash-command"
            {...rest}
          >
            <Command.Input value={query} onValueChange={setQuery} style={{ display: "none" }} />
            {children}
          </Command>
        </tunnelInstance.In>
      )}
    </EditorCommandTunnelContext.Consumer>
  );
});

export const EditorCommandList = Command.List;

EditorCommand.displayName = "EditorCommand";
