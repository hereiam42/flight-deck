'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Something went wrong</h1>
            <button onClick={reset} style={{ cursor: 'pointer' }}>Try again</button>
          </div>
        </div>
      </body>
    </html>
  )
}
