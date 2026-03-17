export default function NotFound() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>404 — Page not found</h1>
        <a href="/dashboard">Go to dashboard</a>
      </div>
    </div>
  )
}
