'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, PlusCircle, Trash2 } from 'lucide-react'
import { createCardAction } from '@/app/actions/cards'
import SubmitButton from './SubmitButton'

interface Draft {
  text: string
  description: string
  expanded: boolean
}

export default function CreateCardForm() {
  const [answers, setAnswers] = useState<Draft[]>([
    { text: '', description: '', expanded: false },
    { text: '', description: '', expanded: false },
  ])
  const [voteType, setVoteType] = useState<'single' | 'multiple'>('single')

  function addAnswer() {
    setAnswers((prev) => [...prev, { text: '', description: '', expanded: false }])
  }

  function removeAnswer(index: number) {
    setAnswers((prev) => prev.filter((_, i) => i !== index))
  }

  function updateText(index: number, value: string) {
    setAnswers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, text: value } : a))
    )
  }

  function updateDescription(index: number, value: string) {
    setAnswers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, description: value } : a))
    )
  }

  function toggleExpanded(index: number) {
    setAnswers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, expanded: !a.expanded } : a))
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">New Vote</h1>
      </div>

      <form action={createCardAction} className="space-y-6">
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
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(index)}
                    aria-label={answer.expanded ? 'Collapse details' : 'Expand details'}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {answer.expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    name="answer"
                    value={answer.text}
                    onChange={(e) => updateText(index, e.target.value)}
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
                <input type="hidden" name="answerDetails" value={answer.description} />
                {answer.expanded && (
                  <textarea
                    value={answer.description}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    rows={3}
                    placeholder="Add more details about this option…"
                    className="ml-8 w-[calc(100%-2rem)] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  />
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
