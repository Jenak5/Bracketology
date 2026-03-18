import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'March Madness Bracket Simulator',
  description: 'Simulate March Madness brackets with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
