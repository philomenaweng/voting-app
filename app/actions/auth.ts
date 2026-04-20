'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { addUser } from '@/lib/kv'
import { setSession, clearSession } from '@/lib/session'

export async function loginAction(formData: FormData): Promise<void> {
  const selected = formData.getAll('selected') as string[]
  const newUserName = (formData.get('newUser') as string | null)?.trim()

  const names = [...selected]

  if (newUserName) {
    await addUser(newUserName)
    if (!names.includes(newUserName)) {
      names.push(newUserName)
    }
  }

  if (names.length === 0) {
    return
  }

  await setSession(names)
  revalidatePath('/home')
  redirect('/home')
}

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/')
}
