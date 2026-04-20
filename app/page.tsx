import { redirect } from 'next/navigation'
import { getAllUsers } from '@/lib/kv'
import { getSession } from '@/lib/session'
import LoginForm from '@/components/LoginForm'

export default async function LoginPage() {
  const session = await getSession()
  if (session.length > 0) redirect('/home')

  const users = await getAllUsers()
  return <LoginForm users={users} />
}
