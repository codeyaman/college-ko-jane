import { db } from "@/db";
import { Conversation, Message } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** List the current user's conversations with message counts. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }

  await db();

  const convos = await Conversation.aggregate([
    { $match: { userId: user.id } },
    { $sort: { updatedAt: -1 } },
    { $limit: 100 },
    {
      $lookup: {
        from: "messages",
        localField: "_id",
        foreignField: "conversationId",
        as: "messages"
      }
    },
    {
      $project: {
        id: "$_id",
        title: 1,
        createdAt: 1,
        updatedAt: 1,
        messageCount: { $size: "$messages" }
      }
    }
  ]);

  return Response.json({ 
    conversations: convos.map(c => ({
      id: c.id.toString(),
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messageCount
    })) 
  });
}

/** Create a conversation (usually implicit via /api/chat, but supported). */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  let title = "New conversation";
  try {
    const body = (await request.json()) as { title?: string };
    if (body?.title?.trim()) title = body.title.trim().slice(0, 120);
  } catch {
    /* empty body is fine */
  }

  await db();

  const row = await Conversation.create({ userId: user.id, title });
  
  return Response.json({ 
    conversation: { ...row.toObject(), id: row._id.toString() } 
  }, { status: 201 });
}
