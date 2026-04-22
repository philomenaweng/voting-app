export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import { getAllCardIds, getCardAndVotes } from '@/lib/kv'
import { getSession } from '@/lib/session'
import Header from '@/components/Header'
import CardListItem from '@/components/CardListItem'
import type { CardWithStatus, CardSortBucket } from '@/lib/types'

function getCardBucket(
  participants: string[],
  sessionUsers: string[],
  votedUsers: string[]
): CardSortBucket {
  const everyoneVoted = participants.every((p) => votedUsers.includes(p))
  if (everyoneVoted) return 'completed'
  const hasUnvotedSessionUser = sessionUsers.some(
    (u) => participants.includes(u) && !votedUsers.includes(u)
  )
  return hasUnvotedSessionUser ? 'action-required' : 'waiting'
}

const BUCKET_ORDER: CardSortBucket[] = ['action-required', 'waiting', 'completed']

export default async function HomePage() {
  const session = await getSession()
  if (session.length === 0) redirect('/')

  const ids = await getAllCardIds()

  const cardsWithVotes: CardWithStatus[] = (
    await Promise.all(
      ids.map(async (id) => {
        const { card, voteMap } = await getCardAndVotes(id)
        if (!card) return null
        const votedUsers = Object.keys(voteMap)
        const votedCount = votedUsers.length
        const bucket = getCardBucket(card.participants, session, votedUsers)
        return { ...card, voteMap, bucket, votedCount } satisfies CardWithStatus
      })
    )
  ).filter((c): c is CardWithStatus => c !== null)

  cardsWithVotes.sort((a, b) => {
    const bucketDiff =
      BUCKET_ORDER.indexOf(a.bucket) - BUCKET_ORDER.indexOf(b.bucket)
    if (bucketDiff !== 0) return bucketDiff
    return b.createdAt - a.createdAt
  })

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <Link
          href="/create"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-4 font-medium text-sm transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Vote
        </Link>

        {cardsWithVotes.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">No votes yet. Create one above!</p>
          </div>
        ) : (
          cardsWithVotes.map((card) => <CardListItem key={card.id} card={card} />)
        )}
      </main>
    </div>
  )
}
