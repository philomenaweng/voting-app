import { logoutAction } from '@/app/actions/auth'
import { getSession } from '@/lib/session'
import SubmitButton from './SubmitButton'

export default async function Header() {
  const session = await getSession()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-slate-900 truncate">Weng Fam 2026 Tokyo Trip</h1>
          <p className="text-xs text-slate-600 truncate">
            <span className="text-slate-400 mr-1">Voting as</span>
            <span className="font-medium text-slate-900">{session.join(', ')}</span>
          </p>
        </div>
        <form action={logoutAction} className="shrink-0">
          <SubmitButton variant="secondary">Log Out</SubmitButton>
        </form>
      </div>
    </header>
  )
}
