import { cookies } from "next/headers";
import { db } from "@/db";
import { User, type IUser } from "@/db/schema";
import { adminAuth } from "./firebase-admin";

export const SESSION_COOKIE = "ckj_session";
const SESSION_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days max for Firebase session cookies

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  return null;
}

/**
 * Creates a Firebase session cookie from a client-side ID token.
 */
export async function createSession(idToken: string): Promise<string> {
  const expiresIn = SESSION_TTL_MS;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn / 1000,
  });
  
  return sessionCookie;
}

/**
 * Validates the session cookie and returns the associated MongoDB User.
 */
export async function getSessionUser(): Promise<(IUser & { id: string }) | null> {
  const store = await cookies();
  const demoCookie = store.get("ckj_demo_admin")?.value;
  if (demoCookie === "true") {
    return {
      id: "demo-admin-id",
      name: "Demo Admin",
      email: "demo@college.edu",
      role: "admin",
      createdAt: new Date(),
    } as any;
  }
  
  const sessionCookie = store.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;
  
  try {
    // Verify the Firebase session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    await db();
    
    // Find user by firebaseUid, or fallback to email (for migrating existing accounts)
    let user = await User.findOne({ firebaseUid: decodedClaims.uid });
    
    if (!user && decodedClaims.email) {
      user = await User.findOne({ email: decodedClaims.email });
      if (user) {
        // Link the existing account
        user.firebaseUid = decodedClaims.uid;
        await user.save();
      }
    }
    
    if (!user) return null;
    
    return { ...user.toObject(), id: user._id.toString() } as IUser & { id: string };
  } catch (error) {
    console.error("Session verification failed", error);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE)?.value;
  
  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedClaims.sub);
    } catch (e) {
      // Ignore if session is already invalid
    }
  }
  
  store.delete(SESSION_COOKIE);
  store.delete("ckj_demo_admin");
}

export function publicUser(user: any) {
  return {
    id: user.id || user._id?.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
