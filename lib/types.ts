export interface Answer {
  id: string
  text: string
  description?: string
}

export interface Card {
  id: string
  question: string
  participants: string[]
  answers: Answer[]
  voteType: 'single' | 'multiple'
  createdAt: number
}

export type VoteMap = Record<string, string[]>

export type CardSortBucket = 'action-required' | 'waiting' | 'completed'

export interface CardWithStatus extends Card {
  voteMap: VoteMap
  bucket: CardSortBucket
  votedCount: number
}
