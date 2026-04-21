'use client'

import { Fragment, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  Circle,
  Edit2,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { submitVoteAction } from '@/app/actions/votes'
import {
  editAnswerAction,
  deleteAnswerAction,
  setAnswerDescriptionAction,
} from '@/app/actions/cards'
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
  const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(null)
  const [answerDraft, setAnswerDraft] = useState('')
  const [answerPending, setAnswerPending] = useState(false)
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set())
  const [editingDescIndex, setEditingDescIndex] = useState<number | null>(null)
  const [descDraft, setDescDraft] = useState('')

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

  function startEditAnswer(index: number, current: string) {
    setEditingAnswerIndex(index)
    setAnswerDraft(current)
  }

  function cancelEditAnswer() {
    setEditingAnswerIndex(null)
    setAnswerDraft('')
  }

  async function saveEditAnswer(index: number) {
    const trimmed = answerDraft.trim()
    if (!trimmed || trimmed === card.answers[index].text) {
      cancelEditAnswer()
      return
    }
    setAnswerPending(true)
    await editAnswerAction(card.id, index, trimmed)
    setAnswerPending(false)
    cancelEditAnswer()
  }

  async function handleDeleteAnswer(index: number, text: string) {
    const confirmed = window.confirm(`Delete option "${text}"?`)
    if (!confirmed) return
    setAnswerPending(true)
    await deleteAnswerAction(card.id, index)
    setAnswerPending(false)
  }

  function toggleExpanded(index: number) {
    setExpandedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function startEditDescription(index: number, current: string) {
    setExpandedAnswers((prev) => new Set(prev).add(index))
    setEditingDescIndex(index)
    setDescDraft(current)
  }

  function cancelEditDescription() {
    setEditingDescIndex(null)
    setDescDraft('')
  }

  async function saveEditDescription(index: number) {
    const trimmed = descDraft.trim()
    if (trimmed === (card.answers[index].description ?? '')) {
      cancelEditDescription()
      return
    }
    setAnswerPending(true)
    await setAnswerDescriptionAction(card.id, index, trimmed)
    setAnswerPending(false)
    cancelEditDescription()
  }

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
          <p className="text-xs text-slate-400">
            {card.voteType === 'multiple' ? 'Select all that apply' : 'Select one'}
          </p>
          <div className="space-y-2">
            {card.answers.map((answer, index) => {
              const idx = String(index)
              const isSelected = selectedAnswers.includes(idx)
              const hasVotes = totalVotes(idx) > 0
              const isRowEditing = editingAnswerIndex === index
              const isExpanded = expandedAnswers.has(index)
              const isDescEditing = editingDescIndex === index

              if (isRowEditing) {
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-300 bg-white"
                  >
                    <input
                      type="text"
                      value={answerDraft}
                      onChange={(e) => setAnswerDraft(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => saveEditAnswer(index)}
                      disabled={answerPending}
                      aria-label="Save"
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditAnswer}
                      disabled={answerPending}
                      aria-label="Cancel"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              }

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(index)}
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAnswer(idx)}
                      className={`flex-1 text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
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
                        {answer.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditAnswer(index, answer.text)}
                      disabled={answerPending}
                      aria-label="Edit option"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnswer(index, answer.text)}
                      disabled={answerPending || hasVotes}
                      aria-label={hasVotes ? 'Cannot delete: has votes' : 'Delete option'}
                      title={hasVotes ? 'Cannot delete: someone has voted for this' : 'Delete option'}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isExpanded && (
                    <DescriptionPanel
                      description={answer.description}
                      isEditing={isDescEditing}
                      draft={descDraft}
                      pending={answerPending}
                      onDraftChange={setDescDraft}
                      onStartEdit={() => startEditDescription(index, answer.description ?? '')}
                      onSave={() => saveEditDescription(index)}
                      onCancel={cancelEditDescription}
                    />
                  )}
                </div>
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
              const hasVotes = count > 0
              const isRowEditing = editingAnswerIndex === index
              const isExpanded = expandedAnswers.has(index)
              const isDescEditing = editingDescIndex === index

              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 ${
                    isMyChoice
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {isRowEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          autoFocus
                          className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => saveEditAnswer(index)}
                          disabled={answerPending}
                          aria-label="Save"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditAnswer}
                          disabled={answerPending}
                          aria-label="Cancel"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(index)}
                            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <span className={`text-sm font-medium truncate ${isMyChoice ? 'text-indigo-800' : 'text-slate-800'}`}>
                            {isMyChoice && <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-indigo-600" />}
                            {answer.text}
                          </span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-sm text-slate-500 mr-1">
                            {count} vote{count !== 1 ? 's' : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditAnswer(index, answer.text)}
                            disabled={answerPending}
                            aria-label="Edit option"
                            className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnswer(index, answer.text)}
                            disabled={answerPending || hasVotes}
                            aria-label={hasVotes ? 'Cannot delete: has votes' : 'Delete option'}
                            title={hasVotes ? 'Cannot delete: someone has voted for this' : 'Delete option'}
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${isMyChoice ? 'bg-indigo-500' : 'bg-slate-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isExpanded && !isRowEditing && (
                    <div className="mt-3">
                      <DescriptionPanel
                        description={answer.description}
                        isEditing={isDescEditing}
                        draft={descDraft}
                        pending={answerPending}
                        onDraftChange={setDescDraft}
                        onStartEdit={() => startEditDescription(index, answer.description ?? '')}
                        onSave={() => saveEditDescription(index)}
                        onCancel={cancelEditDescription}
                      />
                    </div>
                  )}
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

interface DescriptionPanelProps {
  description: string | undefined
  isEditing: boolean
  draft: string
  pending: boolean
  onDraftChange: (value: string) => void
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
}

function DescriptionPanel({
  description,
  isEditing,
  draft,
  pending,
  onDraftChange,
  onStartEdit,
  onSave,
  onCancel,
}: DescriptionPanelProps) {
  if (isEditing) {
    return (
      <div className="ml-8 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          autoFocus
          rows={3}
          placeholder="Add more details about this option…"
          className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            aria-label="Save details"
            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            aria-label="Cancel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (!description) {
    return (
      <div className="ml-8">
        <button
          type="button"
          onClick={onStartEdit}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Add details
        </button>
      </div>
    )
  }

  return (
    <div className="ml-8 flex items-start gap-2">
      <p className="flex-1 text-sm text-slate-600 whitespace-pre-wrap break-words">
        {linkify(description)}
      </p>
      <button
        type="button"
        onClick={onStartEdit}
        aria-label="Edit details"
        className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  )
}

function linkify(text: string): ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const trailingPunct = /[.,;:!?)\]'"]+$/
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0
  for (const match of text.matchAll(urlRegex)) {
    const start = match.index ?? 0
    let url = match[0]
    let trailing = ''
    const trim = url.match(trailingPunct)
    if (trim) {
      trailing = trim[0]
      url = url.slice(0, url.length - trailing.length)
    }
    if (start > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, start)}</Fragment>)
    }
    nodes.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-indigo-800 underline"
      >
        {url}
      </a>
    )
    if (trailing) nodes.push(<Fragment key={key++}>{trailing}</Fragment>)
    lastIndex = start + match[0].length
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>)
  }
  return nodes
}
