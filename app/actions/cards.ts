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
import type { Answer, Card } from '@/lib/types'

export async function createCardAction(formData: FormData): Promise<void> {
  const question = (formData.get('question') as string).trim()
  const rawTexts = formData.getAll('answer') as string[]
  const rawDescriptions = formData.getAll('answerDetails') as string[]
  const answers: Answer[] = rawTexts
    .map((text, i) => {
      const description = (rawDescriptions[i] ?? '').trim()
      return {
        text: text.trim(),
        ...(description ? { description } : {}),
      }
    })
    .filter((a) => a.text)
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

export async function editAnswerAction(
  cardId: string,
  index: number,
  text: string
): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  await editAnswerOnCard(cardId, index, trimmed)
  revalidatePath(`/card/${cardId}`)
}

export async function deleteAnswerAction(
  cardId: string,
  index: number
): Promise<void> {
  await deleteAnswerFromCard(cardId, index)
  revalidatePath(`/card/${cardId}`)
}

export async function setAnswerDescriptionAction(
  cardId: string,
  index: number,
  description: string
): Promise<void> {
  await setAnswerDescriptionOnCard(cardId, index, description)
  revalidatePath(`/card/${cardId}`)
}
