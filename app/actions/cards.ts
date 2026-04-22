'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createCard,
  addAnswerToCard,
  deleteCard,
  editAnswerOnCard,
  deleteAnswerFromCard,
  setAnswerDescriptionOnCard,
  getAllUsers,
} from '@/lib/kv'
import { getSession } from '@/lib/session'
import type { Answer, Card } from '@/lib/types'

async function requireSession(): Promise<string[]> {
  const session = await getSession()
  if (session.length === 0) throw new Error('Unauthorized')
  return session
}

export async function createCardAction(formData: FormData): Promise<void> {
  await requireSession()
  const question = (formData.get('question') as string).trim()
  const rawTexts = formData.getAll('answer') as string[]
  const rawDescriptions = formData.getAll('answerDetails') as string[]
  const answers: Answer[] = rawTexts
    .map((text, i) => {
      const description = (rawDescriptions[i] ?? '').trim()
      return {
        id: crypto.randomUUID(),
        text: text.trim(),
        ...(description ? { description } : {}),
      }
    })
    .filter((a) => a.text)
  const voteType = formData.get('voteType') as 'single' | 'multiple'

  const participants = await getAllUsers()

  const card: Card = {
    id: crypto.randomUUID(),
    question,
    participants,
    answers,
    voteType,
    createdAt: Date.now(),
  }

  await createCard(card)
  revalidatePath('/home')
  redirect(`/card/${card.id}`)
}

export async function deleteCardAction(cardId: string): Promise<void> {
  await requireSession()
  await deleteCard(cardId)
  revalidatePath('/home')
  redirect('/home')
}

export async function addAnswerAction(cardId: string, formData: FormData): Promise<void> {
  await requireSession()
  const answer = (formData.get('answer') as string).trim()
  if (!answer) return
  await addAnswerToCard(cardId, answer)
  revalidatePath(`/card/${cardId}`)
}

export async function editAnswerAction(
  cardId: string,
  answerId: string,
  text: string
): Promise<void> {
  await requireSession()
  const trimmed = text.trim()
  if (!trimmed) return
  await editAnswerOnCard(cardId, answerId, trimmed)
  revalidatePath(`/card/${cardId}`)
}

export async function deleteAnswerAction(
  cardId: string,
  answerId: string
): Promise<void> {
  await requireSession()
  await deleteAnswerFromCard(cardId, answerId)
  revalidatePath(`/card/${cardId}`)
}

export async function setAnswerDescriptionAction(
  cardId: string,
  answerId: string,
  description: string
): Promise<void> {
  await requireSession()
  await setAnswerDescriptionOnCard(cardId, answerId, description)
  revalidatePath(`/card/${cardId}`)
}
