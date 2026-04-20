'use server'

import { revalidatePath } from 'next/cache'
import { setVote } from '@/lib/kv'

export async function submitVoteAction(cardId: string, formData: FormData): Promise<void> {
  const voterNames = formData.getAll('voterName') as string[]
  const selectedAnswers = formData.getAll('answer') as string[]

  await Promise.all(
    voterNames.map((name) => setVote(cardId, name, selectedAnswers))
  )

  revalidatePath(`/card/${cardId}`)
  revalidatePath('/home')
}
