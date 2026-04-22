'use client'

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  Circle,
  Edit2,
  Pencil,
  Trash2,
  Check,
  X,
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

function selectionsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((x) => set.has(x))
}

export default function VoteForm({ card, voteMap, sessionUsers, unvotedSessionUsers }: Props) {
  const totalParticipants = card.participants.length
  const isCompleted =
    totalParticipants > 0 && card.participants.every((p) => voteMap[p])
  const hasUnvotedSessionUsers = unvotedSessionUsers.length > 0

  const answerById = new Map(card.answers.map((a) => [a.id, a]))

  const initialVotingAs = unvotedSessionUsers.length > 0 ? unvotedSessionUsers : sessionUsers
  const baseline = sessionUsers.length > 0 ? (voteMap[sessionUsers[0]] ?? []) : []

  const [isEditing, setIsEditing] = useState(false)
  const [votingAs, setVotingAs] = useState<string[]>(initialVotingAs)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')
  const [answerPending, setAnswerPending] = useState(false)
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set())

  const showVotingUI = hasUnvotedSessionUsers || isEditing
  const showResults = !showVotingUI

  const boundAction = submitVoteAction.bind(null, card.id)

  async function handleVoteSubmit(formData: FormData) {
    await boundAction(formData)
    setIsEditing(false)
  }

  function toggleAnswer(answerId: string) {
    if (card.voteType === 'single') {
      setSelectedAnswers([answerId])
    } else {
      setSelectedAnswers((prev) =>
        prev.includes(answerId) ? prev.filter((a) => a !== answerId) : [...prev, answerId]
      )
    }
  }

  function toggleVotingAs(name: string) {
    setVotingAs((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  function startEditing() {
    setSelectedAnswers(baseline)
    // Only pre-check users whose existing vote matches the baseline. Users with
    // a different vote must be explicitly opted in, so proxy voters never get
    // silently overwritten.
    const matching = sessionUsers.filter((u) => {
      const v = voteMap[u]
      return v && selectionsEqual(v, baseline)
    })
    setVotingAs(matching.length > 0 ? matching : [sessionUsers[0]])
    setIsEditing(true)
  }

  const totalVotes = (answerId: string) =>
    Object.values(voteMap).filter((selections) => selections.includes(answerId)).length

  const totalVoters = Object.keys(voteMap).length

  function startEditAnswer(answerId: string, currentText: string, currentDesc: string | undefined) {
    setEditingAnswerId(answerId)
    setAnswerDraft(currentText)
    setDescDraft(currentDesc ?? '')
  }

  function cancelEditAnswer() {
    setEditingAnswerId(null)
    setAnswerDraft('')
    setDescDraft('')
  }

  async function saveEditAnswer(answerId: string) {
    const answer = answerById.get(answerId)
    if (!answer) {
      cancelEditAnswer()
      return
    }
    const trimmedText = answerDraft.trim()
    const trimmedDesc = descDraft.trim()
    const currentText = answer.text
    const currentDesc = answer.description ?? ''

    if (!trimmedText) {
      cancelEditAnswer()
      return
    }

    const textChanged = trimmedText !== currentText
    const descChanged = trimmedDesc !== currentDesc

    if (!textChanged && !descChanged) {
      cancelEditAnswer()
      return
    }

    setAnswerPending(true)
    if (textChanged) await editAnswerAction(card.id, answerId, trimmedText)
    if (descChanged) await setAnswerDescriptionAction(card.id, answerId, trimmedDesc)
    setAnswerPending(false)
    cancelEditAnswer()
  }

  async function handleDeleteAnswer(answerId: string, text: string) {
    if (card.answers.length <= 1) {
      window.alert('Cannot delete the only option.')
      return
    }
    const voteCount = totalVotes(answerId)
    const message = voteCount > 0
      ? `Delete option "${text}"? ${voteCount} vote${voteCount !== 1 ? 's' : ''} for this option will be removed.`
      : `Delete option "${text}"?`
    const confirmed = window.confirm(message)
    if (!confirmed) return
    setAnswerPending(true)
    await deleteAnswerAction(card.id, answerId)
    setAnswerPending(false)
  }

  function toggleExpanded(answerId: string) {
    setExpandedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(answerId)) next.delete(answerId)
      else next.add(answerId)
      return next
    })
  }

  function describeVote(selections: string[] | undefined): string {
    if (!selections || selections.length === 0) return 'not yet voted'
    const texts = selections
      .map((id) => answerById.get(id)?.text)
      .filter((t): t is string => !!t)
    return texts.length > 0 ? texts.join(', ') : 'not yet voted'
  }

  return (
    <div className="space-y-6">
      {/* Question */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 leading-snug">{card.question}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {totalVoters} / {totalParticipants} voted
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
                  const currentVote = voteMap[name]
                  const showCurrent = isEditing && currentVote
                  return (
                    <label
                      key={name}
                      className={`flex items-start gap-3 cursor-pointer ${alreadyVoted ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={votingAs.includes(name)}
                        onChange={() => !alreadyVoted && toggleVotingAs(name)}
                        disabled={alreadyVoted}
                        className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-900 flex-1">
                        <span>{name}</span>
                        {alreadyVoted && (
                          <span className="ml-2 text-xs text-slate-400">(already voted)</span>
                        )}
                        {showCurrent && (
                          <span className="block text-xs text-slate-400 mt-0.5">
                            current: {describeVote(currentVote)}
                          </span>
                        )}
                      </span>
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
            {card.answers.map((answer) => {
              const isSelected = selectedAnswers.includes(answer.id)
              const isRowEditing = editingAnswerId === answer.id
              const isExpanded = expandedAnswers.has(answer.id)

              if (isRowEditing) {
                return (
                  <div
                    key={answer.id}
                    className="space-y-2 px-3 py-3 rounded-xl border border-indigo-300 bg-white"
                  >
                    <input
                      type="text"
                      value={answerDraft}
                      onChange={(e) => setAnswerDraft(e.target.value)}
                      autoFocus
                      placeholder="Option"
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      rows={3}
                      placeholder="Add more details about this option…"
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => saveEditAnswer(answer.id)}
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
                  </div>
                )
              }

              return (
                <div
                  key={answer.id}
                  className={`group rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAnswer(answer.id)}
                      className={`flex-1 text-left text-base font-medium ${
                        isSelected ? 'text-indigo-800' : 'text-slate-800'
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
                      onClick={() => startEditAnswer(answer.id, answer.text, answer.description)}
                      disabled={answerPending}
                      aria-label="Edit option"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100 focus-within:opacity-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnswer(answer.id, answer.text)}
                      disabled={answerPending}
                      aria-label="Delete option"
                      title="Delete option"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {answer.description && (
                    <div className="mt-2 pl-7">
                      <DescriptionPanel
                        description={answer.description}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleExpanded(answer.id)}
                      />
                    </div>
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
      {showResults && (() => {
        const maxVotes = card.answers.reduce(
          (m, a) => Math.max(m, totalVotes(a.id)),
          0
        )
        return (
        <div className="space-y-5">
          <div className="space-y-3">
            {[...card.answers]
              .sort((a, b) => totalVotes(b.id) - totalVotes(a.id))
              .map((answer) => {
              const count = totalVotes(answer.id)
              const mySelections = sessionUsers.flatMap((n) => voteMap[n] ?? [])
              const isMyChoice = mySelections.includes(answer.id)
              const isLeader = maxVotes > 0 && count === maxVotes
              const highlight = totalParticipants > 0 && count / totalParticipants > 0.75
              const isRowEditing = editingAnswerId === answer.id
              const isExpanded = expandedAnswers.has(answer.id)

              return (
                <div
                  key={answer.id}
                  className={`rounded-xl border p-4 group ${
                    highlight
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {isRowEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={answerDraft}
                        onChange={(e) => setAnswerDraft(e.target.value)}
                        autoFocus
                        placeholder="Option"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <textarea
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        rows={3}
                        placeholder="Add more details about this option…"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                      />
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => saveEditAnswer(answer.id)}
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
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 min-w-0">
                          <span className={`text-base truncate ${isLeader ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
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
                            onClick={() => startEditAnswer(answer.id, answer.text, answer.description)}
                            disabled={answerPending}
                            aria-label="Edit option"
                            className="p-1 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnswer(answer.id, answer.text)}
                            disabled={answerPending}
                            aria-label="Delete option"
                            title="Delete option"
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${isLeader ? 'bg-indigo-500' : 'bg-indigo-200'}`}
                          style={{
                            width: `${maxVotes > 0 ? (count / maxVotes) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      {answer.description && (
                        <div className="mt-3">
                          <DescriptionPanel
                            description={answer.description}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleExpanded(answer.id)}
                          />
                        </div>
                      )}
                    </>
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
        )
      })()}
    </div>
  )
}

interface DescriptionPanelProps {
  description: string
  isExpanded: boolean
  onToggleExpand: () => void
}

function DescriptionPanel({ description, isExpanded, onToggleExpand }: DescriptionPanelProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [canTruncate, setCanTruncate] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
      if (!lineHeight) return
      setCanTruncate(el.scrollHeight > lineHeight * 2 + 1)
    }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [description])

  return (
    <div className="space-y-1.5">
      <p
        ref={ref}
        className={`text-sm text-slate-600 whitespace-pre-wrap break-words ${
          canTruncate && !isExpanded ? 'line-clamp-2' : ''
        }`}
      >
        {linkify(description)}
      </p>
      {canTruncate && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="text-xs text-slate-300 hover:text-slate-500 font-medium transition-colors"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
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
