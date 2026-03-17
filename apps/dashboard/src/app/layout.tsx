import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pacific Atlas Flight Deck',
  description: 'Autonomous business operating system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
