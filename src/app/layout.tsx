import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import PWARegister from '@/components/PWARegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'La Viña Band Admin',
  description: 'Plataforma de comunicación y administración para La Viña Band',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <PWARegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}