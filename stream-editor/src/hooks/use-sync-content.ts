export function useSyncContent() {
  const syncMarkdownContent = async (content: string) => {
    await fetch("/api/sync/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  };

  return { syncMarkdownContent };
}
