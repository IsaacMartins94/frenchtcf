import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  title: 'FrenchTCF — Aprenda Francês',
  description: 'Aprenda francês estilo Duolingo com exercícios para o TCF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${nunito.className} min-h-full`}>{children}</body>
    </html>
  );
}
