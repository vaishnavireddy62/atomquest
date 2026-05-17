import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AtomQuest - Goal Setting Portal',
  description: 'Goal Setting & Tracking Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}