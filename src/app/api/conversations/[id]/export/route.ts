import { db } from "@/db";
import { Conversation, Message } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  const { id } = await params;
  
  await db();
  
  const conversation = await Conversation.findOne({ _id: id, userId: user.id });
  if (!conversation) {
    return Response.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }
  
  const messages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 });
    
  let markdown = `# ${conversation.title}\n\n*Exported from College Ko Jano on ${new Date().toLocaleString()}*\n\n---\n\n`;
  
  for (const m of messages) {
    if (m.role === "user") {
      markdown += `**You:**\n${m.content}\n\n`;
    } else {
      markdown += `**College Ko Jano:**\n${m.content}\n`;
      if (m.sources && m.sources.length > 0) {
        markdown += `\n*Sources:*\n`;
        m.sources.forEach((s: any) => {
          markdown += `- ${s.title} (${Math.round(s.score * 100)}% match)\n`;
        });
      }
      markdown += `\n---\n\n`;
    }
  }
  
  const filename = `Chat_Export_${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
