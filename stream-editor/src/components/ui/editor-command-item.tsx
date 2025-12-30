import { rangeAtom } from "@/store/editor";
import { Editor, Range, useCurrentEditor } from "@tiptap/react";
import { CommandEmpty, CommandItem } from "cmdk";
import { useAtomValue } from "jotai";
import { ComponentPropsWithoutRef, forwardRef } from "react";

interface EditorCommandItemProps {
  readonly onCommand: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export const EditorCommandItem = forwardRef<HTMLDivElement, EditorCommandItemProps & ComponentPropsWithoutRef<typeof CommandItem>>(({ children, onCommand, ...rest }, ref) => {
  const { editor } = useCurrentEditor();
  const range = useAtomValue(rangeAtom);

  if (!editor || !range) return null;

  return (
    <CommandItem ref={ref} {...rest} onSelect={() => onCommand({ editor, range })}>
      {children}
    </CommandItem>
  );
});

EditorCommandItem.displayName = "EditorCommandItem";

export const EditorCommandEmpty = CommandEmpty;

export default EditorCommandItem;
