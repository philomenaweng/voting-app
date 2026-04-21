import { Redis } from '@upstash/redis'
import type { Answer, Card, VoteMap } from './types'

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

// --- Users ---

export async function getAllUsers(): Promise<string[]> {
  const members = await getRedis().smembers('users')
  return members.sort()
}

export async function addUser(name: string): Promise<void> {
  await getRedis().sadd('users', name)
}

// --- Cards ---

export async function createCard(card: Card): Promise<void> {
  await Promise.all([
    getRedis().set(`card:${card.id}`, JSON.stringify(card)),
    getRedis().sadd('card-ids', card.id),
  ])
}

export async function getCard(id: string): Promise<Card | null> {
  const raw = await getRedis().get<string>(`card:${id}`)
  if (!raw) return null
  const card = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Card
  card.answers = (card.answers as unknown as (string | Answer)[]).map((a) =>
    typeof a === 'string' ? { text: a } : a
  )
  return card
}

export async function getAllCardIds(): Promise<string[]> {
  return getRedis().smembers('card-ids')
}

export async function addAnswerToCard(id: string, answer: string): Promise<void> {
  const card = await getCard(id)
  if (!card) return
  card.answers.push({ text: answer })
  await getRedis().set(`card:${id}`, JSON.stringify(card))
}

export async function editAnswerOnCard(
  id: string,
  index: number,
  text: string
): Promise<void> {
  const card = await getCard(id)
  if (!card) return
  if (index < 0 || index >= card.answers.length) return
  card.answers[index] = { ...card.answers[index], text }
  await getRedis().set(`card:${id}`, JSON.stringify(card))
}

export async function setAnswerDescriptionOnCard(
  id: string,
  index: number,
  description: string
): Promise<void> {
  const card = await getCard(id)
  if (!card) return
  if (index < 0 || index >= card.answers.length) return
  const trimmed = description.trim()
  if (trimmed) {
    card.answers[index] = { ...card.answers[index], description: trimmed }
  } else {
    const { description: _drop, ...rest } = card.answers[index]
    card.answers[index] = rest
  }
  await getRedis().set(`card:${id}`, JSON.stringify(card))
}

export async function deleteAnswerFromCard(
  id: string,
  index: number
): Promise<void> {
  const card = await getCard(id)
  if (!card) return
  if (index < 0 || index >= card.answers.length) return

  card.answers.splice(index, 1)
  await getRedis().set(`card:${id}`, JSON.stringify(card))

  const voteMap = await getVotes(id)
  const migrated: Record<string, string> = {}
  for (const [user, selections] of Object.entries(voteMap)) {
    const next = selections
      .filter((i) => Number(i) !== index)
      .map((i) => (Number(i) > index ? String(Number(i) - 1) : i))
    migrated[user] = JSON.stringify(next)
  }
  if (Object.keys(migrated).length > 0) {
    await getRedis().hset(`votes:card:${id}`, migrated)
  }
}

export async function deleteCard(id: string): Promise<void> {
  await Promise.all([
    getRedis().del(`card:${id}`),
    getRedis().del(`votes:card:${id}`),
    getRedis().srem('card-ids', id),
  ])
}

// --- Votes ---

export async function getVotes(cardId: string): Promise<VoteMap> {
  const raw = await getRedis().hgetall(`votes:card:${cardId}`)
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
  await getRedis().hset(`votes:card:${cardId}`, { [userName]: JSON.stringify(answers) })
}
