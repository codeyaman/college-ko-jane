import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { Doc, Chunk, User, Conversation, Message } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import AdminApp from "@/components/admin/admin-app";

export const metadata: Metadata = { title: "Knowledge Studio" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/chat");

  await db();

  const docs = await Doc.find().sort({ createdAt: -1 });

  const docsCount = await Doc.countDocuments();
  const chunksCount = await Chunk.countDocuments();
  const usersCount = await User.countDocuments();
  const categoriesCount = (await Doc.distinct("category")).length;
  
  const conversationsCount = await Conversation.countDocuments();
  const messagesCount = await Message.countDocuments();
  const thumbsUpCount = await Message.countDocuments({ feedback: 1 });
  const thumbsDownCount = await Message.countDocuments({ feedback: -1 });

  return (
    <AdminApp
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
      stats={{
        docs: docsCount,
        chunks: chunksCount,
        categories: categoriesCount,
        users: usersCount,
        conversations: conversationsCount,
        messages: messagesCount,
        thumbsUp: thumbsUpCount,
        thumbsDown: thumbsDownCount,
      }}
      initialDocs={docs.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        category: d.category,
        filename: d.filename,
        chunkCount: d.chunkCount,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        size: d.contentText.length,
      }))}
    />
  );
}
