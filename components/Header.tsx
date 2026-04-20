import { logoutAction } from '@/app/actions/auth'
import { getSession } from '@/lib/session'
import SubmitButton from './SubmitButton'

export default async function Header() {
  const session = await getSession()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600 truncate">
          <span className="text-slate-400 mr-1">Voting as</span>
          <span className="font-medium text-slate-900">{session.join(', ')}</span>
        </p>
        <form action={logoutAction} className="shrink-0">
          <SubmitButton variant="secondary">Log Out</SubmitButton>
        </form>
      </div>
    </header>
  )
}
