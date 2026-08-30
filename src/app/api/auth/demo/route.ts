import { cookies } from "next/headers";

export async function POST() {
  const store = await cookies();
  
  // Set the demo admin cookie
  store.set("ckj_demo_admin", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
  
  return Response.json({ ok: true });
}
