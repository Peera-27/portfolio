import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/site";
import { SmoothScroll } from "@/components/site/smooth-scroll";

/**
 * The same trio the reference site uses: a condensed all-caps display face, a
 * neutral sans for prose, and a mono for every label, path and readout. Loaded
 * through next/font so the files are self-hosted and there is no render-blocking
 * request to a font CDN.
 */
const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--ff-display",
  display: "swap",
  fallback: ["Haettenschweiler", "Arial Narrow", "sans-serif"],
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--ff-body",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--ff-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});


export const metadata: Metadata = {
  title: {
    default: `${profile.nameEn} — ${profile.role}`,
    template: `%s · ${profile.nameEn}`,
  },
  description: `${profile.role} · ${profile.headline}`,
  applicationName: `${profile.nameEn} Portfolio`,
  authors: [{ name: profile.nameEn, url: profile.github }],
  keywords: [
    "Full-stack Developer",
    "Computer Science",
    "Next.js",
    "React",
    "TypeScript",
    "Go",
    "Portfolio",
  ],
  openGraph: {
    title: `${profile.nameEn} — ${profile.role}`,
    description: `${profile.role} · ${profile.headline}`,
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a09",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="flex min-h-full flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
