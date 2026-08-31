import { db } from "@/db";
import { Conversation, Message } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { answerQuestion, type RagResult, type RagHistoryTurn } from "@/lib/rag";

export const maxDuration = 60;

const MAX_MESSAGE = 2000;

function makeTitle(question: string): string {
  const cleaned = question.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ").slice(0, 8).join(" ");
  const title = words.length < cleaned.length ? `${words}…` : words;
  return (title.charAt(0).toUpperCase() + title.slice(1)).slice(0, 120);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in to chat." }, { status: 401 });
  }

  let body: { message?: string; conversationId?: string; category?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return Response.json({ error: "Message cannot be empty." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return Response.json(
      { error: `Message is too long (max ${MAX_MESSAGE} characters).` },
      { status: 400 },
    );
  }

  await db();

  // Resolve or create the conversation.
  let conversationId = body.conversationId ?? null;
  let isNew = false;
  if (conversationId) {
    const owned = await Conversation.findOne({
      _id: conversationId,
      userId: user.id
    }).select("_id");
    
    if (!owned) {
      return Response.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }
  } else {
    const created = await Conversation.create({ 
      userId: user.id, 
      title: makeTitle(message) 
    });
    conversationId = created._id.toString();
    isNew = true;
  }

  // History for conversational context (prior turns only).
  const historyRows = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(6)
    .select("role content");
    
  const history = historyRows.reverse().map(m => ({
    role: m.role as RagHistoryTurn["role"],
    content: m.content
  }));

  // Persist the user message.
  const userMessage = await Message.create({ 
    conversationId, 
    role: "user", 
    content: message 
  });

  // Run the RAG pipeline — never leak a raw 500 to the student.
  let result: RagResult;
  try {
    result = await answerQuestion(message, history, { category: body.category, language: body.language });
  } catch (err) {
    console.error("RAG pipeline failure:", err);
    result = {
      answer:
        "Something went wrong while searching the knowledge base. Please try again in a moment — if it keeps happening, contact the admin.",
      sources: [],
      topScore: 0,
      unknown: true,
    };
  }

  // Persist the assistant answer with citations.
  const assistantMessage = await Message.create({
    conversationId,
    role: "assistant",
    content: result.answer,
    sources: result.sources,
    confidence: result.topScore,
  });

  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { updatedAt: new Date() } }
  );

  // Stream NDJSON: meta → deltas → done.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      try {
        send({
          type: "meta",
          conversationId,
          isNew,
          userMessage: {
            id: userMessage._id.toString(),
            role: userMessage.role,
            content: userMessage.content,
            createdAt: userMessage.createdAt,
          },
          assistantMessageId: assistantMessage._id.toString(),
        });
        const pieces = result.answer.match(/\S+\s*/g) ?? [result.answer];
        let acc = "";
        for (const piece of pieces) {
          acc += piece;
          if (acc.length >= 28) {
            send({ type: "delta", text: acc });
            acc = "";
          }
        }
        if (acc) send({ type: "delta", text: acc });
        send({
          type: "done",
          sources: result.sources,
          confidence: result.topScore,
          unknown: result.unknown,
          messageId: assistantMessage._id.toString(),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
