'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Edit2 } from 'lucide-react'
import { submitVoteAction } from '@/app/actions/votes'
import SubmitButton from './SubmitButton'
import AddAnswerForm from './AddAnswerForm'
import type { Card, VoteMap } from '@/lib/types'

interface Props {
  card: Card
  voteMap: VoteMap
  sessionUsers: string[]
  unvotedSessionUsers: string[]
}

export default function VoteForm({ card, voteMap, sessionUsers, unvotedSessionUsers }: Props) {
  const isCompleted = Object.keys(voteMap).length >= card.threshold
  const hasUnvotedSessionUsers = unvotedSessionUsers.length > 0

  const initialVotingAs = unvotedSessionUsers.length > 0 ? unvotedSessionUsers : sessionUsers
  const existingSelections = sessionUsers.length > 0
    ? (voteMap[sessionUsers[0]] ?? [])
    : []

  const [isEditing, setIsEditing] = useState(false)
  const [votingAs, setVotingAs] = useState<string[]>(initialVotingAs)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    isEditing ? existingSelections : []
  )

  const showVotingUI = hasUnvotedSessionUsers || isEditing
  const showResults = !showVotingUI

  const boundAction = submitVoteAction.bind(null, card.id)

  async function handleVoteSubmit(formData: FormData) {
    await boundAction(formData)
    setIsEditing(false)
  }

  function toggleAnswer(index: string) {
    if (card.voteType === 'single') {
      setSelectedAnswers([index])
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(index) ? prev.filter((a) => a !== index) : [...prev, index]
      )
    }
  }

  function toggleVotingAs(name: string) {
    setVotingAs((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  function startEditing() {
    setSelectedAnswers(existingSelections)
    setVotingAs(sessionUsers)
    setIsEditing(true)
  }

  const totalVotes = (answerIndex: string) =>
    Object.values(voteMap).filter((selections) => selections.includes(answerIndex)).length

  const totalVoters = Object.keys(voteMap).length

  return (
    <div className="space-y-6">
      {/* Question */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 leading-snug">{card.question}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {totalVoters} / {card.threshold} voted
          {isCompleted && (
            <span className="ml-2 text-green-600 font-medium">· Completed</span>
          )}
        </p>
      </div>

      {/* Voting UI */}
      {showVotingUI && (
        <div className="space-y-5">
          {/* Voting As */}
          {sessionUsers.length > 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                Voting as
              </p>
              <div className="space-y-2">
                {sessionUsers.map((name) => {
                  const alreadyVoted = !unvotedSessionUsers.includes(name) && !isEditing
                  return (
                    <label
                      key={name}
                      className={`flex items-center gap-3 cursor-pointer ${alreadyVoted ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={votingAs.includes(name)}
                        onChange={() => !alreadyVoted && toggleVotingAs(name)}
                        disabled={alreadyVoted}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-900">{name}</span>
                      {alreadyVoted && (
                        <span className="text-xs text-slate-400">(already voted)</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Answers */}
          <div className="space-y-2">
            {card.answers.map((answer, index) => {
              const idx = String(index)
              const isSelected = selectedAnswers.includes(idx)
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleAnswer(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {card.voteType === 'single' ? (
                      isSelected
                        ? <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        : <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    ) : (
                      <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </span>
                    )}
                    {answer}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Write-in — separate form, outside the vote form */}
          <AddAnswerForm cardId={card.id} />

          {/* Vote submit — own form with hidden inputs for controlled state */}
          <form action={handleVoteSubmit} className="space-y-3">
            {votingAs.map((name) => (
              <input key={name} type="hidden" name="voterName" value={name} />
            ))}
            {selectedAnswers.map((a) => (
              <input key={a} type="hidden" name="answer" value={a} />
            ))}
            <SubmitButton
              className="w-full py-2.5"
              disabled={selectedAnswers.length === 0 || votingAs.length === 0}
            >
              Submit Vote
            </SubmitButton>
          </form>

          {isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Results UI */}
      {showResults && (
        <div className="space-y-5">
          <div className="space-y-3">
            {card.answers.map((answer, index) => {
              const idx = String(index)
              const count = totalVotes(idx)
              const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0
              const mySelections = sessionUsers.flatMap((n) => voteMap[n] ?? [])
              const isMyChoice = mySelections.includes(idx)

              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 ${
                    isMyChoice
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isMyChoice ? 'text-indigo-800' : 'text-slate-800'}`}>
                      {isMyChoice && <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-indigo-600" />}
                      {answer}
                    </span>
                    <span className="text-sm text-slate-500">
                      {count} vote{count !== 1 ? 's' : ''} · {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${isMyChoice ? 'bg-indigo-500' : 'bg-slate-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {sessionUsers.length > 0 && (
            <button
              type="button"
              onClick={startEditing}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Change vote
            </button>
          )}
        </div>
      )}
    </div>
  )
}
