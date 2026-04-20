'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createCard, addAnswerToCard } from '@/lib/kv'
import type { Card } from '@/lib/types'

export async function createCardAction(formData: FormData): Promise<void> {
  const question = (formData.get('question') as string).trim()
  const participants = formData.getAll('participants') as string[]
  const thresholdRaw = formData.get('threshold') as string
  const answers = (formData.getAll('answer') as string[]).map((a) => a.trim()).filter(Boolean)
  const voteType = formData.get('voteType') as 'single' | 'multiple'

  const threshold = parseInt(thresholdRaw, 10) || participants.length

  const card: Card = {
    id: crypto.randomUUID(),
    question,
    participants,
    threshold,
    answers,
    voteType,
    createdAt: Date.now(),
  }

  await createCard(card)
  revalidatePath('/home')
  redirect(`/card/${card.id}`)
}

export async function addAnswerAction(cardId: string, formData: FormData): Promise<void> {
  const answer = (formData.get('answer') as string).trim()
  if (!answer) return
  await addAnswerToCard(cardId, answer)
  revalidatePath(`/card/${cardId}`)
}
