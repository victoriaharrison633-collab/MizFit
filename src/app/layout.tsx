import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MizFit',
  description: 'Weekly meal planning built around the food you already have.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
