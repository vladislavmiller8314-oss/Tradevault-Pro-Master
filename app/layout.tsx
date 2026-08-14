import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TradeVault Pro",
  description: "Trading Operating System für Futures-Trader",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TradeVault Pro",
  },
  icons: {
    icon: "/pwa-icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1117",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Next.js cached standardmäßig fetch()-Aufrufe (auch die von Supabase
// intern verwendeten) aggressiv. Für eine App, die ständig frische
// Datenbank-Werte direkt nach dem Schreiben anzeigen muss (Einstellungen,
// Dashboard-Zahlen usw.), ist das kontraproduktiv — ohne diese Zeile kann
// es passieren, dass man nach dem Speichern kurzzeitig veraltete Werte
// zurückbekommt. Gilt für alle Routen, da hier im Root-Layout gesetzt.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${mono.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
