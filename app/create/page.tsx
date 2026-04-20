export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAllUsers } from '@/lib/kv'
import { getSession } from '@/lib/session'
import Header from '@/components/Header'
import CreateCardForm from '@/components/CreateCardForm'

export default async function CreatePage() {
  const session = await getSession()
  if (session.length === 0) redirect('/')

  const users = await getAllUsers()
  return (
    <div className="min-h-screen">
      <Header />
      <CreateCardForm users={users} sessionUsers={session} />
    </div>
  )
}
