import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Agentation } from "agentation";
import {
  Fraunces,
  Space_Grotesk,
  Tiro_Devanagari_Hindi,
} from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/custom-cursor";
import GlobalLoader from "@/components/global-loader";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

const hindi = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-hindi-var",
});

export const metadata: Metadata = {
  title: {
    default: "College Ko Jano — Know your college, instantly",
    template: "%s · College Ko Jano",
  },
  description:
    "A RAG-powered college information assistant. Ask about admissions, fees, hostels, placements and more — every answer is retrieved from official documents and cited with sources.",
};

/**
 * No-flash theme boot: runs before first paint inside <head>. Defaults to
 * the dark brand theme; applies the user's saved light preference instantly.
 */
const themeBoot = `(function(){try{var t=localStorage.getItem('ckj-theme');var e=document.documentElement;if(t==='light'){e.classList.remove('dark');e.classList.add('light')}else{e.classList.add('dark')}}catch(_){document.documentElement.classList.add('dark')}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`dark ${fraunces.variable} ${grotesk.variable} ${hindi.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="bg-ink-950 font-sans text-cream-50 antialiased">
        <CustomCursor />
        <GlobalLoader>
          {children}
        </GlobalLoader>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
