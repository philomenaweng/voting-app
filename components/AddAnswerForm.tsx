'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { addAnswerAction } from '@/app/actions/cards'
import SubmitButton from './SubmitButton'

interface Props {
  cardId: string
}

export default function AddAnswerForm({ cardId }: Props) {
  const [value, setValue] = useState('')
  const boundAction = addAnswerAction.bind(null, cardId)

  async function handleAction(formData: FormData) {
    await boundAction(formData)
    setValue('')
  }

  return (
    <form action={handleAction} className="flex items-center gap-2">
      <input
        type="text"
        name="answer"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write-in answer…"
        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <SubmitButton variant="secondary">
        <PlusCircle className="w-4 h-4 mr-1.5" />
        Add
      </SubmitButton>
    </form>
  )
}
