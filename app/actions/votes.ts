'use server'

import { revalidatePath } from 'next/cache'
import { submitVote } from '@/lib/kv'
import { getSession } from '@/lib/session'

export async function submitVoteAction(cardId: string, formData: FormData): Promise<void> {
  const session = await getSession()
  if (session.length === 0) return

  const requested = formData.getAll('voterName') as string[]
  const voterNames = requested.filter((n) => session.includes(n))
  if (voterNames.length === 0) return

  const selectedAnswers = formData.getAll('answer') as string[]
  if (selectedAnswers.length === 0) return

  await Promise.all(
    voterNames.map((name) => submitVote(cardId, name, selectedAnswers))
  )

  revalidatePath(`/card/${cardId}`)
  revalidatePath('/home')
}
