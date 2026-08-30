import { getSessionUser } from "@/lib/auth";
import { deleteDocument } from "@/lib/kb";

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/documents/[id] — admin only. Chunks cascade; IDF refreshes. */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return Response.json(
      { error: "Only admins can manage the knowledge base." },
      { status: 403 },
    );
  }
  if (user.email === "demo@college.edu") {
    return Response.json(
      { error: "Action not allowed in Demo Mode." },
      { status: 403 },
    );
  }
  const { id } = await params;
  const deleted = await deleteDocument(id);
  if (!deleted) {
    return Response.json({ error: "Document not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
