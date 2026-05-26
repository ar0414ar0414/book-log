import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import ProgressBar from "@/components/ProgressBar";
import ThemeProvider from "@/components/ThemeProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Folio – 読書記録",
  description: "読んだ本の記録・引用保存・AI読書サポートアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Folio",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('folio-theme');var t=s?JSON.parse(s):null;if(t&&t.state&&t.state.theme==='dark')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
      </head>
      <body className={`${noto.className} min-h-full bg-slate-50 dark:bg-slate-900 dark:text-slate-100`}>
        <ThemeProvider>
          <ProgressBar />
          {children}
          <ServiceWorkerRegistrar />
        </ThemeProvider>
      </body>
    </html>
  );
}
