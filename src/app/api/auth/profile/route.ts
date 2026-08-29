import { db } from "@/db";
import { User } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name } = (body ?? {}) as { name?: string };
  const cleanName = (name ?? "").trim();

  if (cleanName.length < 2 || cleanName.length > 60) {
    return Response.json(
      { error: "Name must be between 2 and 60 characters." },
      { status: 400 },
    );
  }

  await db();
  
  await User.findByIdAndUpdate(user.id, { name: cleanName });

  return Response.json({ ok: true, name: cleanName });
}
