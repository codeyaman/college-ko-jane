import { db } from "@/db";
import { Message, Conversation } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  const { id } = await params;
  
  let body: { feedback: 1 | -1 | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (![1, -1, null].includes(body.feedback)) {
    return Response.json({ error: "Invalid feedback value." }, { status: 400 });
  }

  await db();

  const message = await Message.findById(id);
  if (!message) {
    return Response.json({ error: "Message not found." }, { status: 404 });
  }

  // Ensure the user owns the conversation this message belongs to
  const convo = await Conversation.findOne({
    _id: message.conversationId,
    userId: user.id
  }).select("_id");

  if (!convo) {
    return Response.json({ error: "Unauthorized." }, { status: 403 });
  }

  if (body.feedback === null) {
    await Message.updateOne({ _id: message._id }, { $unset: { feedback: "" } });
  } else {
    message.feedback = body.feedback;
    await message.save();
  }

  return Response.json({ ok: true, feedback: body.feedback });
}
