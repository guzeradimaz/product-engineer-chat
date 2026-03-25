import { ChatWindow } from "@/components/chat/ChatWindow";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return (
    <ErrorBoundary>
      <div className="h-full">
        <ChatWindow chatId={chatId} />
      </div>
    </ErrorBoundary>
  );
}
