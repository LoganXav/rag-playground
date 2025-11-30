import { Plugin, PluginKey } from "prosemirror-state";
import { v4 as uuidv4 } from "uuid";

/**
 * ProseMirror / TipTap plugin that assigns a stable `id` attribute
 * to each block node that doesn't already have one.
 *
 * Runs in appendTransaction so it won't interfere with typing; it only
 * sets missing ids after transactions.
 */
export const nodeIdPluginKey = new PluginKey("nodeIdPlugin");

export function nodeIdPlugin() {
  return new Plugin({
    key: nodeIdPluginKey,
    appendTransaction: (transactions, oldState, newState) => {
      let tr = newState.tr;
      let modified = false;

      newState.doc.descendants((node, pos) => {
        // Only target block nodes (paragraph, heading, blockquote, codeBlock, math_block, etc.)
        if (node.isBlock && (!node.attrs || !node.attrs.id)) {
          const newAttrs = { ...(node.attrs || {}), id: uuidv4() };
          tr = tr.setNodeMarkup(pos, undefined, newAttrs);
          modified = true;
        }
      });

      return modified ? tr : null;
    },
  });
}
