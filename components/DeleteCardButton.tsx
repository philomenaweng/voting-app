'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteCardAction } from '@/app/actions/cards'

interface Props {
  cardId: string
  question: string
}

export default function DeleteCardButton({ cardId, question }: Props) {
  const [pending, setPending] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    const confirmed = window.confirm(
      `Delete "${question}"?\n\nThis will permanently remove the question and all votes.`
    )
    if (!confirmed) return
    setPending(true)
    await deleteCardAction(cardId)
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label="Delete question"
      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
