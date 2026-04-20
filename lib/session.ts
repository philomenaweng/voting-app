import { cookies } from 'next/headers'

const COOKIE_NAME = 'voting-session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

export async function getSession(): Promise<string[]> {
  const cookieStore = await cookies()
  const value = cookieStore.get(COOKIE_NAME)?.value
  if (!value) return []
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

export async function setSession(names: string[]): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify(names), COOKIE_OPTIONS)
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
