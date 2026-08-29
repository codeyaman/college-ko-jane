import { getSessionUser, publicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  return Response.json({ user: user ? publicUser(user) : null });
}
