'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2 } from 'lucide-react'
import { createCardAction } from '@/app/actions/cards'
import SubmitButton from './SubmitButton'

interface Props {
  users: string[]
  sessionUsers: string[]
}

export default function CreateCardForm({ users, sessionUsers }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState(['', ''])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(users)
  const [threshold, setThreshold] = useState(users.length)
  const [voteType, setVoteType] = useState<'single' | 'multiple'>('single')

  function toggleParticipant(name: string) {
    setSelectedParticipants((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
      setThreshold(next.length)
      return next
    })
  }

  function toggleSelectAll() {
    const allSelected = selectedParticipants.length === users.length
    const next = allSelected ? [] : [...users]
    setSelectedParticipants(next)
    setThreshold(next.length)
  }

  function addAnswer() {
    setAnswers((prev) => [...prev, ''])
  }

  function removeAnswer(index: number) {
    setAnswers((prev) => prev.filter((_, i) => i !== index))
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">New Vote</h1>
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Skip / Not participating
        </button>
      </div>

      <form action={createCardAction} className="space-y-6">
        {/* Hidden inputs for controlled state */}
        {selectedParticipants.map((p) => (
          <input key={p} type="hidden" name="participants" value={p} />
        ))}
        <input type="hidden" name="threshold" value={threshold} />
        <input type="hidden" name="voteType" value={voteType} />

        {/* Question */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Question
          </label>
          <input
            type="text"
            name="question"
            required
            placeholder="What are we deciding?"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Participants */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Participants
            </label>
            {users.length > 1 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                {selectedParticipants.length === users.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <label key={user} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(user)}
                  onChange={() => toggleParticipant(user)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {user}
                  {sessionUsers.includes(user) && (
                    <span className="ml-1.5 text-xs text-indigo-500">(you)</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Threshold */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Completion Threshold
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={selectedParticipants.length || 1}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-sm text-slate-500">
              of {selectedParticipants.length} participants
            </span>
          </div>
        </div>

        {/* Vote Type */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Vote Type
          </label>
          <div className="flex gap-3">
            {(['single', 'multiple'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setVoteType(type)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  voteType === type
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type === 'single' ? 'Single choice' : 'Multiple choice'}
              </button>
            ))}
          </div>
        </div>

        {/* Answers */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Answers
          </label>
          <div className="space-y-2">
            {answers.map((answer, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  name="answer"
                  value={answer}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {answers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAnswer(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addAnswer}
            className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add option
          </button>
        </div>

        <SubmitButton className="w-full py-2.5">
          Create Vote
        </SubmitButton>
      </form>
    </div>
  )
}
