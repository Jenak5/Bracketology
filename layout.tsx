import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'March Madness Arena',
  description: 'AI-powered bracket simulation using Claude',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f7f7f7]">{children}</body>
    </html>
  );
}
