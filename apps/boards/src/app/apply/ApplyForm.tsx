'use client'

import { useState } from 'react'

const VISA_OPTIONS = ['working_holiday', 'student', 'spouse', 'pr', 'citizen', 'other']
const EXPERIENCE_OPTIONS = ['hospitality', 'food_beverage', 'retail', 'ski_instruction', 'childcare', 'housekeeping', 'front_desk', 'maintenance', 'driving', 'kitchen', 'bar', 'events', 'outdoor_activities', 'other']

export function ApplyForm({ boardId, workspaceId, region }: { boardId: string; workspaceId: string; region: string }) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form.entries())

    // Build the application text for the agent
    const applicationText = [
      `Name: ${data.first_name} ${data.last_name}`,
      `Email: ${data.email}`,
      data.phone ? `Phone: ${data.phone}` : null,
      data.nationality ? `Nationality: ${data.nationality}` : null,
      data.languages ? `Languages: ${data.languages}` : null,
      data.visa_status ? `Visa: ${data.visa_status}` : null,
      data.experience ? `Experience: ${form.getAll('experience').join(', ')}` : null,
      data.available_from ? `Available from: ${data.available_from}` : null,
      data.available_to ? `Available to: ${data.available_to}` : null,
      `Preferred region: ${region}`,
      data.cover_letter ? `Cover letter: ${data.cover_letter}` : null,
      `Source: website_form`,
      `Board: ${boardId}`,
    ].filter(Boolean).join('\n')

    try {
      // POST to server-side route — agent lookup and invocation happen server-side only
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          workspaceId,
          applicationText,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to submit' }))
        throw new Error(err.error ?? 'Failed to submit')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-lg bg-green-50 p-8 text-center">
        <p className="text-2xl">🎉</p>
        <h2 className="mt-2 text-xl font-semibold text-green-800">Application received!</h2>
        <p className="mt-2 text-green-700">
          We&apos;ll review your details and be in touch with matching positions.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">First name *</label>
          <input name="first_name" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input name="last_name" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email *</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input name="phone" type="tel" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nationality</label>
          <input name="nationality" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Languages spoken</label>
          <input name="languages" placeholder="English, Japanese" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Visa status</label>
        <select name="visa_status" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">Select...</option>
          {VISA_OPTIONS.map((v) => (
            <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Experience areas</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXPERIENCE_OPTIONS.map((exp) => (
            <label key={exp} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <input type="checkbox" name="experience" value={exp} className="h-3.5 w-3.5" />
              {exp.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Available from</label>
          <input name="available_from" type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Available to</label>
          <input name="available_to" type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tell us about yourself</label>
        <textarea name="cover_letter" rows={4} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Your experience, what you're looking for, why this destination..." />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  )
}
