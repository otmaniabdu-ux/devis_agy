import "@/lib/polyfills";
import type { Metadata } from "next";
import { Playfair_Display, Inter, Amiri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "OmraVIP Quotes — El Mouhssinoune Tours",
  description: "Création et gestion de devis VIP Omra/Hadj pour El Mouhssinoune Tours",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if (!window.crypto) { window.crypto = {}; }
                if (typeof window.crypto.randomUUID !== 'function') {
                  window.crypto.randomUUID = function() {
                    if (typeof window.crypto.getRandomValues === 'function') {
                      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function(c) {
                        var n = Number(c);
                        return (n ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
                      });
                    }
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                      var r = Math.random() * 16 | 0;
                      var v = c === 'x' ? r : (r & 0x3 | 0x8);
                      return v.toString(16);
                    });
                  };
                }
              }
            `,
          }}
        />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${amiri.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
