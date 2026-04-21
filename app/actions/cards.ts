'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createCard, addAnswerToCard, deleteCard, getAllUsers } from '@/lib/kv'
import type { Card } from '@/lib/types'

export async function createCardAction(formData: FormData): Promise<void> {
  const question = (formData.get('question') as string).trim()
  const answers = (formData.getAll('answer') as string[]).map((a) => a.trim()).filter(Boolean)
  const voteType = formData.get('voteType') as 'single' | 'multiple'

  const participants = await getAllUsers()
  const threshold = participants.length

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

export async function deleteCardAction(cardId: string): Promise<void> {
  await deleteCard(cardId)
  revalidatePath('/home')
  redirect('/home')
}

export async function addAnswerAction(cardId: string, formData: FormData): Promise<void> {
  const answer = (formData.get('answer') as string).trim()
  if (!answer) return
  await addAnswerToCard(cardId, answer)
  revalidatePath(`/card/${cardId}`)
}
