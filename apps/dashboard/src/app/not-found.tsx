import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
      <div className="text-center">
        <p className="text-5xl font-semibold text-zinc-700">404</p>
        <p className="mt-4 text-sm text-zinc-500">Page not found</p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm text-indigo-400 hover:text-indigo-300">
          Go to dashboard →
        </Link>
      </div>
    </div>
  )
}
