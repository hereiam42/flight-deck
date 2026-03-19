import './globals.css'
import { resolveBoard } from '@/lib/board'
import Link from 'next/link'

export async function generateMetadata() {
  const board = await resolveBoard()
  const seo = board.seo_config as Record<string, string> | null
  return {
    title: seo?.title ?? `${board.name} — Seasonal Jobs`,
    description: seo?.description ?? `Find seasonal jobs in ${board.region}, ${board.country}. Working holiday, hospitality, and ski resort positions.`,
    openGraph: {
      title: seo?.title ?? `${board.name} — Seasonal Jobs`,
      description: seo?.description ?? `Seasonal jobs in ${board.region}`,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const board = await resolveBoard()

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold text-gray-900">
              {board.name}
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/jobs" className="text-gray-600 hover:text-gray-900">Jobs</Link>
              <Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/apply" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Apply Now
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        {/* Footer */}
        <footer className="mt-20 border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <p className="font-semibold text-gray-900">{board.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Seasonal jobs in {board.region}, {board.country}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <Link href="/jobs" className="block text-gray-600 hover:text-gray-900">Browse Jobs</Link>
                <Link href="/apply" className="block text-gray-600 hover:text-gray-900">Apply</Link>
                <Link href="/blog" className="block text-gray-600 hover:text-gray-900">Blog</Link>
                <Link href="/about" className="block text-gray-600 hover:text-gray-900">About</Link>
              </div>
              <div className="text-sm text-gray-500">
                <p>Powered by <span className="font-medium text-gray-700">Beyond Peaks</span></p>
                <p className="mt-1">Seasonal labour infrastructure</p>
              </div>
            </div>
            <p className="mt-8 text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Beyond Peaks. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
