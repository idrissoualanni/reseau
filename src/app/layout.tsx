import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Agentation } from "agentation";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Réseau — profils et projets",
    template: "%s · Réseau",
  },
  description:
    "Le réseau social où le profil se construit sur des preuves, pas sur des déclarations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === "development" ? (
          <Agentation endpoint="http://localhost:4747" />
        ) : null}
      </body>
    </html>
  );
}
