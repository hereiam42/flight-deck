import { resolveBoard } from '@/lib/board'
import { ApplyForm } from './ApplyForm'

export default async function ApplyPage() {
  const board = await resolveBoard()

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Apply to work in {board.region}</h1>
      <p className="mt-2 text-gray-500">
        Submit your details and our team will match you with the best positions for the {board.season_type ?? ''} season.
      </p>
      <ApplyForm boardId={board.id} workspaceId={board.workspace_id} region={board.region} />
    </div>
  )
}
