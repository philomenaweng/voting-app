export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCard, getVotes } from '@/lib/kv'
import { getSession } from '@/lib/session'
import Header from '@/components/Header'
import VoteForm from '@/components/VoteForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CardPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()
  if (session.length === 0) redirect('/')

  const [card, voteMap] = await Promise.all([getCard(id), getVotes(id)])
  if (!card) notFound()

  const unvotedSessionUsers = session.filter((name) => !voteMap[name])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to votes
        </Link>

        <VoteForm
          card={card}
          voteMap={voteMap}
          sessionUsers={session}
          unvotedSessionUsers={unvotedSessionUsers}
        />
      </main>
    </div>
  )
}
