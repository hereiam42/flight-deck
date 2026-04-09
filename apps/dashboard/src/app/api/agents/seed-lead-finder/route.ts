import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { createAgent, createEnvironment } from '@/lib/managed-agents'

const LEAD_FINDER_SYSTEM_PROMPT = `You are a lead research agent for Beyond Peaks, a cross-border seasonal labor mobility platform connecting international workers with resort town employers across Japan, Australia, New Zealand, and Canada.

Your job is to find employers in resort towns who are actively hiring (or likely to hire) seasonal workers.

For each lead you find, output a JSON object with:
- company_name
- location (town + country)
- website_url
- roles_hiring (array of job titles you found)
- season (winter/summer/year-round)
- contact_email (if findable)
- contact_page_url
- source_url (where you found the listing)
- confidence (high/medium/low — based on how clearly they're hiring seasonal international workers)
- notes (anything relevant: visa sponsorship mentioned, languages required, staff housing offered)

Search strategy:
1. Start with the target town's major job boards and tourism employer directories
2. Check individual employer career pages
3. Look for patterns: "seasonal staff wanted", "working holiday", "visa sponsorship", "staff accommodation"
4. Prioritize employers who explicitly mention international workers or working holiday visa holders
5. Skip recruitment agencies — we want direct employers only

Target towns (search the ones specified in each session):
- Japan: Niseko, Hakuba, Furano, Rusutsu, Myoko
- New Zealand: Queenstown, Wanaka
- Australia: Thredbo, Perisher, Jindabyne
- Canada: Whistler, Banff, Revelstoke

IMPORTANT: At the end of your research, output ALL leads as a single JSON array wrapped in \`\`\`json code fences. This is what the system parses to store results. Include a brief methodology note after the JSON explaining what you searched and what gaps remain.`

/**
 * POST /api/agents/seed-lead-finder
 *
 * One-shot seed: registers the "Lead Finder" agent for the current
 * workspace if it does not already exist. Idempotent.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: existing } = await db
    .from('managed_agents')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('name', 'Lead Finder')
    .maybeSingle()
  if (existing) return NextResponse.json({ agent: existing, created: false })

  try {
    const agent = await createAgent({
      name: 'Lead Finder',
      systemPrompt: LEAD_FINDER_SYSTEM_PROMPT,
    })
    const environment = await createEnvironment({ name: 'lead-finder-env' })

    const { data, error } = await db
      .from('managed_agents')
      .insert({
        workspace_id: workspaceId,
        name: 'Lead Finder',
        description: 'Finds seasonal employers hiring international workers in resort towns.',
        anthropic_agent_id: agent.id,
        anthropic_environment_id: environment.id,
        venture: 'beyond_peaks',
        model: 'claude-sonnet-4-6',
        system_prompt: LEAD_FINDER_SYSTEM_PROMPT,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ agent: data, created: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
