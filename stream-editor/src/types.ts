export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: {
    type?: "patch" | "text";
    patch?: string;
    explanation?: string;
    applied?: boolean;
  };
};
