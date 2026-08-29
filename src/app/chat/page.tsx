import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { Conversation, Doc, Chunk } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import ChatApp from "@/components/chat/chat-app";

export const metadata: Metadata = { title: "Ask the assistant" };
export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await db();

  const convos = await Conversation.find({ userId: user.id })
    .sort({ updatedAt: -1 })
    .limit(100)
    .select("_id title updatedAt");

  const docsCount = await Doc.countDocuments({ status: "ready" });
  const chunksCount = await Chunk.countDocuments();

  return (
    <ChatApp
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
      initialConversations={convos.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
        messageCount: 0,
      }))}
      kb={{ docs: docsCount, chunks: chunksCount }}
    />
  );
}
