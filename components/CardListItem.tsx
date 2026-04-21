import Link from 'next/link'
import ProgressBar from './ProgressBar'
import DeleteCardButton from './DeleteCardButton'
import type { CardWithStatus } from '@/lib/types'

interface Props {
  card: CardWithStatus
}

const bucketConfig = {
  'action-required': {
    label: 'Action Required',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  waiting: {
    label: 'Waiting on Others',
    className: 'bg-slate-100 text-slate-500 border border-slate-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
}

export default function CardListItem({ card }: Props) {
  const config = bucketConfig[card.bucket]
  const totalParticipants = card.participants.length

  return (
    <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
      <Link href={`/card/${card.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-medium text-slate-900 leading-snug">{card.question}</h3>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
            {config.label}
          </span>
        </div>
        <div className="space-y-1.5">
          <ProgressBar voted={card.votedCount} total={card.threshold} />
          <p className="text-xs text-slate-400">
            {card.votedCount} / {card.threshold} voted
            {totalParticipants !== card.threshold && (
              <span> (threshold of {totalParticipants} participants)</span>
            )}
          </p>
        </div>
      </Link>
      <div className="absolute bottom-3 right-3">
        <DeleteCardButton cardId={card.id} question={card.question} />
      </div>
    </div>
  )
}
