import { db } from "@/db";
import { User } from "@/db/schema";
import { createSession, publicUser } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function POST(request: Request) {
  // 1. Rate Limiting to prevent brute-force attacks
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? "unknown-ip";
  
  // Limit to 10 requests per 15 minutes per IP
  if (!rateLimit(ip, 10, 15 * 60 * 1000)) {
    return Response.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { idToken, name } = (body ?? {}) as { idToken?: string; name?: string };

  if (!idToken) {
    return Response.json({ error: "Firebase ID token is required." }, { status: 400 });
  }

  try {
    // 2. Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name: firebaseName, picture } = decodedToken;

    if (!email) {
      return Response.json({ error: "Email is required from the authentication provider." }, { status: 400 });
    }

    await db();

    // 3. Find or Create the MongoDB User
    let user = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }] 
    });

    if (!user) {
      // Create new user (Sign up)
      const cleanName = (name || firebaseName || email.split("@")[0]).trim();
      
      user = await User.create({
        name: cleanName,
        email: email.toLowerCase(),
        firebaseUid: uid,
        role: "student",
      });
    } else if (!user.firebaseUid) {
      // Link existing account to Firebase
      user.firebaseUid = uid;
      await user.save();
    }

    // 4. Create secure session cookie
    await createSession(idToken);

    return Response.json({ user: publicUser(user) }, { status: 200 });

  } catch (error: any) {
    console.error("Firebase authentication error:", error);
    return Response.json(
      { error: error.message || "Authentication failed." },
      { status: 401 }
    );
  }
}
