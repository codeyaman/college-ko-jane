"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

import { auth } from "@/lib/firebase-client";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

const PERKS = [
  "Answers strictly from official college documents",
  "Sources and match scores cited on every reply",
  "Honest \u201cnot in the knowledge base\u201d responses",
  "Full conversation history, synced per account",
];

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isLogin = mode === "login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function onForgotPassword() {
    if (!email) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError(err.message || "Failed to send reset email.");
      }
    }
    setBusy(false);
  }

  async function establishSession(idToken: string, displayName?: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, name: displayName }),
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to establish secure session.");
    }
  }

  async function onGoogleLogin() {
    if (busy) return;
    setError(null);
    setBusy(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      await establishSession(idToken, result.user.displayName || undefined);
      
      router.replace("/chat");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Google sign in failed.");
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    
    try {
      let idToken: string;
      
      if (isLogin) {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        idToken = await userCredential.user.getIdToken();
        await establishSession(idToken);
      } else {
        // Sign up with Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update Firebase profile with name
        await updateProfile(userCredential.user, { displayName: name });
        
        idToken = await userCredential.user.getIdToken();
        await establishSession(idToken, name);
      }

      router.replace("/chat");
      router.refresh();
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
      setBusy(false);
    }
  }

  async function onDemoAdmin() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setError("Demo login failed.");
        setBusy(false);
      }
    } catch {
      setError("Demo login failed.");
      setBusy(false);
    }
  }

  return (
    <main className="grain relative flex h-[100dvh] overflow-hidden bg-ink-950 text-cream-50">
      {/* ambient */}
      <div
        aria-hidden
        className="absolute top-[-20%] left-[-10%] h-[480px] w-[480px] rounded-full bg-saffron-600/12 blur-[140px]"
      />
      <div
        aria-hidden
        className="absolute right-[-10%] bottom-[-25%] h-[480px] w-[480px] rounded-full bg-saffron-700/10 blur-[150px]"
      />

      {/* brand panel */}
      <aside className="relative hidden w-[44%] flex-col justify-between border-r border-ink-800 bg-ink-900/50 p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600 shadow-lg shadow-saffron-600/30">
            <GraduationCap className="h-5 w-5 text-ink-950" strokeWidth={2.4} />
          </span>
          <span className="font-display text-xl tracking-tight">
            College <span className="text-saffron-400 italic">ko</span> Jano
          </span>
        </Link>

        <div>
          <p className="font-hindi text-lg text-saffron-300/80">
            कॉलेज को जानो
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight xl:text-5xl">
            Every answer.
            <br />
            <span className="text-gradient italic">Sourced.</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink-300">
                <CircleCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-saffron-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="border-l-2 border-saffron-500/50 pl-5 text-sm leading-relaxed text-ink-400">
          &ldquo;I only answer from officially uploaded documents — so I
          won&rsquo;t guess.&rdquo;
          <footer className="mt-2 flex items-center gap-1.5 text-xs text-saffron-300">
            <Sparkles className="h-3 w-3" /> the assistant, on its own honesty
          </footer>
        </blockquote>
      </aside>

      {/* form panel */}
      <section className="relative flex flex-1 items-center justify-center overflow-y-auto px-5 py-12">
        <ThemeToggle className="absolute top-5 right-5" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-xs text-ink-400 transition hover:text-cream-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>

          <div className="mb-8 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600">
              <GraduationCap className="h-5.5 w-5.5 text-ink-950" strokeWidth={2.4} />
            </span>
          </div>

          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {isLogin ? (
              <>
                Welcome <span className="text-gradient italic">back</span>
              </>
            ) : (
              <>
                Create your <span className="text-gradient italic">account</span>
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            {isLogin
              ? "Sign in to keep asking the assistant."
              : "One minute to a campus that answers back."}
          </p>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-700 bg-ink-900/60 py-3 text-sm font-medium text-cream-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-4 text-xs text-ink-500">
              <div className="h-px flex-1 bg-ink-800" />
              <span>OR</span>
              <div className="h-px flex-1 bg-ink-800" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-medium tracking-wide text-ink-300"
                >
                  Full name
                </label>
                <div className="ring-field flex items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-900 px-3.5">
                  <User className="h-4 w-4 shrink-0 text-ink-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={60}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Patel"
                    className="w-full bg-transparent py-3 text-sm text-cream-50 outline-none placeholder:text-ink-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium tracking-wide text-ink-300"
              >
                Email address
              </label>
              <div className="ring-field flex items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-900 px-3.5">
                <Mail className="h-4 w-4 shrink-0 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="w-full bg-transparent py-3 text-sm text-cream-50 outline-none placeholder:text-ink-500"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium tracking-wide text-ink-300"
                >
                  Password{" "}
                  {!isLogin && (
                    <span className="text-ink-500">(min. 8 characters)</span>
                  )}
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-medium text-saffron-400 transition hover:text-saffron-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="ring-field flex items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-900 px-3.5">
                <Lock className="h-4 w-4 shrink-0 text-ink-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={isLogin ? 1 : 8}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 text-sm text-cream-50 outline-none placeholder:text-ink-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="text-ink-400 transition hover:text-cream-100"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-400"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_16px_44px_-14px_rgba(255,122,26,0.6)] transition hover:shadow-[0_20px_54px_-12px_rgba(255,122,26,0.75)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <span className="flex items-center gap-1.5">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-950" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-950" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-950" />
                </span>
              ) : (
                <>
                  {isLogin ? "Sign in with Email" : "Create account with Email"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-ink-400">
            {isLogin ? (
              <>
                New here?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-saffron-400 transition hover:text-saffron-300"
                >
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-saffron-400 transition hover:text-saffron-300"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
          
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onDemoAdmin}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-saffron-500/20 bg-saffron-500/10 px-4 py-2 text-xs font-medium text-saffron-400 transition hover:bg-saffron-500/20 hover:text-saffron-300 disabled:opacity-50"
            >
              Try Demo Admin
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
