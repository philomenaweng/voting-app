import { Redis } from '@upstash/redis'
import type { Card, VoteMap } from './types'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// --- Users ---

export async function getAllUsers(): Promise<string[]> {
  const members = await redis.smembers('users')
  return members.sort()
}

export async function addUser(name: string): Promise<void> {
  await redis.sadd('users', name)
}

// --- Cards ---

export async function createCard(card: Card): Promise<void> {
  await Promise.all([
    redis.set(`card:${card.id}`, JSON.stringify(card)),
    redis.sadd('card-ids', card.id),
  ])
}

export async function getCard(id: string): Promise<Card | null> {
  const raw = await redis.get<string>(`card:${id}`)
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export async function getAllCardIds(): Promise<string[]> {
  return redis.smembers('card-ids')
}

export async function addAnswerToCard(id: string, answer: string): Promise<void> {
  const card = await getCard(id)
  if (!card) return
  card.answers.push(answer)
  await redis.set(`card:${id}`, JSON.stringify(card))
}

// --- Votes ---

export async function getVotes(cardId: string): Promise<VoteMap> {
  const raw = await redis.hgetall(`votes:card:${cardId}`)
  if (!raw) return {}
  return Object.fromEntries(
    Object.entries(raw).map(([user, val]) => [
      user,
      typeof val === 'string' ? JSON.parse(val) : val,
    ])
  )
}

export async function setVote(
  cardId: string,
  userName: string,
  answers: string[]
): Promise<void> {
  await redis.hset(`votes:card:${cardId}`, { [userName]: JSON.stringify(answers) })
}
