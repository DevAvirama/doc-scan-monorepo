import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocScan AI | Monorepo Document Scanner',
  description: 'Extracción inteligente y procesamiento de comprobantes comerciales con Gemini Vision y OpenCV',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
