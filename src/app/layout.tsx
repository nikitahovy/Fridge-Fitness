import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Fridge Fitness",
  description: "Save food. Eat smart.",
};

/* Inline theme init script — runs synchronously during HTML parsing,
   before React hydrates, so the user never sees a flash of the wrong
   theme. Adds the `dark` class to <html> if the saved preference is dark. */
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('ff_theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-screen flex overflow-hidden font-[family-name:var(--font-inter)]">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
