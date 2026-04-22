'use client'

import { useState } from 'react'
import { loginAction } from '@/app/actions/auth'
import SubmitButton from './SubmitButton'

interface Props {
  users: string[]
}

export default function LoginForm({ users }: Props) {
  const [newUser, setNewUser] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  function toggleUser(name: string) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Weng Fam 2026 Tokyo Trip</h1>
          <p className="text-slate-500 text-sm mt-1">Select or add who you are voting for</p>
        </div>

        <form action={loginAction} className="space-y-4">
          {users.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm">
              {users.map((user) => (
                <label
                  key={user}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                >
                  <input
                    type="checkbox"
                    name="selected"
                    value={user}
                    checked={selected.includes(user)}
                    onChange={() => toggleUser(user)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-slate-900 text-sm font-medium">{user}</span>
                </label>
              ))}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Add new person
            </label>
            <input
              type="text"
              name="newUser"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder="Enter name…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <SubmitButton className="w-full py-2.5">
            Continue
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
