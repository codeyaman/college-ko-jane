import { db } from "@/db";
import { Conversation, Message } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

async function ownedConversation(id: string, userId: string) {
  try {
    const convo = await Conversation.findOne({ _id: id, userId });
    return convo ? { ...convo.toObject(), id: convo._id.toString() } : null;
  } catch (err) {
    return null; // invalid object id etc.
  }
}

/** Fetch all messages of a conversation (ownership enforced). */
export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  const { id } = await params;
  
  await db();
  
  const conversation = await ownedConversation(id, user.id);
  if (!conversation) {
    return Response.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }
  
  const messages = await Message.find({ conversationId: conversation.id })
    .sort({ createdAt: 1 });
    
  return Response.json({ 
    conversation, 
    messages: messages.map(m => ({ ...m.toObject(), id: m._id.toString() })) 
  });
}

/** Delete a conversation and its messages (cascade). */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  const { id } = await params;
  
  await db();
  
  const conversation = await ownedConversation(id, user.id);
  if (!conversation) {
    return Response.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }
  
  await Conversation.findByIdAndDelete(conversation.id);
  await Message.deleteMany({ conversationId: conversation.id });
  
  return Response.json({ ok: true });
}
