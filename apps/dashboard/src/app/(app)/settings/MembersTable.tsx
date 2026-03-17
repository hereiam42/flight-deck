'use client'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
}

interface Member {
  id: string
  user_id: string
  role: string
  created_at: string
}

export function MembersTable({ members }: { members: Member[] }) {
  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2e2e32]">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">User</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Role</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2e2e32]">
          {members.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">No members</td>
            </tr>
          ) : (
            members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{m.user_id}</td>
                <td className="px-4 py-2.5">
                  <span className="badge bg-zinc-800 text-zinc-300">
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-zinc-500">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
