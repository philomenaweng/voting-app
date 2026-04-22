import Link from 'next/link'
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
  const total = card.participants.length

  return (
    <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
      <Link href={`/card/${card.id}`} className="block p-5">
        <div className="mb-3 pr-40 sm:pr-36">
          <h3 className="font-medium text-slate-900 leading-snug">{card.question}</h3>
        </div>
        <p className="text-xs text-slate-400">
          {card.votedCount} / {total} voted
        </p>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${total > 0 && card.votedCount * 2 >= total ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{
              width: `${total > 0 ? Math.min(100, (card.votedCount / total) * 100) : 0}%`,
            }}
          />
        </div>
      </Link>
      <div className="absolute top-5 right-5 flex items-center gap-1.5">
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
          {config.label}
        </span>
        <DeleteCardButton cardId={card.id} question={card.question} />
      </div>
    </div>
  )
}
