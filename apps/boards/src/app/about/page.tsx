import { resolveBoard } from '@/lib/board'

export default async function AboutPage() {
  const board = await resolveBoard()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">About {board.name}</h1>
      <div className="mt-6 space-y-4 text-gray-700">
        <p>
          {board.name} connects seasonal workers with top employers in {board.region}, {board.country}.
          Whether you&apos;re looking for hospitality, ski instruction, food &amp; beverage, or outdoor adventure roles,
          we help you find the right position for the {board.season_type ?? ''} season.
        </p>
        <p>
          We partner directly with employers in {board.region} to bring you verified positions with
          competitive pay, accommodation options, and a supportive community of international seasonal workers.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">Powered by Beyond Peaks</h2>
        <p>
          Beyond Peaks is the infrastructure behind the world&apos;s best seasonal job boards. We operate
          destination-specific platforms that connect workers with employers across ski resorts,
          beach towns, wine regions, and adventure destinations globally.
        </p>
        <p>
          Our AI-powered matching system ensures candidates find the right roles, and employers find
          the right people — fast.
        </p>
      </div>
    </div>
  )
}
