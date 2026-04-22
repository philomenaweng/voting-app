import { Redis } from '@upstash/redis'
import type { Card, VoteMap } from './types'

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

// Migrate legacy cards (answers without `id`, votes keyed by positional index).
// Runs atomically in one EVAL; idempotent after first run per card.
const MIGRATE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return nil end
local card = cjson.decode(raw)
local needs = false
for i, a in ipairs(card.answers) do
  if type(a) == 'string' or not a.id then needs = true break end
end
if not needs then return raw end
for i, a in ipairs(card.answers) do
  if type(a) == 'string' then
    card.answers[i] = { id = ARGV[i], text = a }
  elseif not a.id then
    a.id = ARGV[i]
  end
end
card.threshold = nil
local newRaw = cjson.encode(card)
redis.call('SET', KEYS[1], newRaw)
local votes = redis.call('HGETALL', KEYS[2])
for i = 1, #votes, 2 do
  local user = votes[i]
  local val = votes[i+1]
  local ok, sel = pcall(cjson.decode, val)
  if ok and type(sel) == 'table' then
    local newSel = {}
    for _, s in ipairs(sel) do
      local idx = tonumber(s)
      if idx and card.answers[idx + 1] then
        table.insert(newSel, card.answers[idx + 1].id)
      end
    end
    if #newSel == 0 then
      redis.call('HDEL', KEYS[2], user)
    else
      redis.call('HSET', KEYS[2], user, cjson.encode(newSel))
    end
  end
end
return newRaw
`

export async function getCard(id: string): Promise<Card | null> {
  const cardKey = `card:${id}`
  const votesKey = `votes:card:${id}`
  const raw = await getRedis().get<string>(cardKey)
  if (!raw) return null
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  const answers = Array.isArray(parsed.answers) ? parsed.answers : []
  const needsMigration = answers.some(
    (a: unknown) =>
      typeof a === 'string' ||
      (a !== null && typeof a === 'object' && !('id' in (a as object)))
  ) || 'threshold' in parsed
  if (!needsMigration) return parsed as Card
  const ids = answers.map(() => crypto.randomUUID())
  const migrated = (await getRedis().eval(
    MIGRATE_SCRIPT,
    [cardKey, votesKey],
    ids
  )) as string | null
  if (!migrated) return null
  return (typeof migrated === 'string' ? JSON.parse(migrated) : migrated) as Card
}

// Read card + votes with migration applied before votes are fetched.
export async function getCardAndVotes(
  id: string
): Promise<{ card: Card | null; voteMap: VoteMap }> {
  const card = await getCard(id)
  if (!card) return { card: null, voteMap: {} }
  const voteMap = await getVotes(id)
  return { card, voteMap }
}

export async function getAllCardIds(): Promise<string[]> {
  return getRedis().smembers('card-ids')
}

const ADD_ANSWER_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local card = cjson.decode(raw)
table.insert(card.answers, { id = ARGV[1], text = ARGV[2] })
redis.call('SET', KEYS[1], cjson.encode(card))
return 1
`

export async function addAnswerToCard(id: string, answer: string): Promise<void> {
  await getRedis().eval(
    ADD_ANSWER_SCRIPT,
    [`card:${id}`],
    [crypto.randomUUID(), answer]
  )
}

const EDIT_ANSWER_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local card = cjson.decode(raw)
for i, a in ipairs(card.answers) do
  if a.id == ARGV[1] then
    a.text = ARGV[2]
    redis.call('SET', KEYS[1], cjson.encode(card))
    return 1
  end
end
return 0
`

export async function editAnswerOnCard(
  id: string,
  answerId: string,
  text: string
): Promise<void> {
  await getRedis().eval(
    EDIT_ANSWER_SCRIPT,
    [`card:${id}`],
    [answerId, text]
  )
}

const SET_DESCRIPTION_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local card = cjson.decode(raw)
for i, a in ipairs(card.answers) do
  if a.id == ARGV[1] then
    if ARGV[2] == '' then
      a.description = nil
    else
      a.description = ARGV[2]
    end
    redis.call('SET', KEYS[1], cjson.encode(card))
    return 1
  end
end
return 0
`

export async function setAnswerDescriptionOnCard(
  id: string,
  answerId: string,
  description: string
): Promise<void> {
  await getRedis().eval(
    SET_DESCRIPTION_SCRIPT,
    [`card:${id}`],
    [answerId, description.trim()]
  )
}

const DELETE_ANSWER_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return -1 end
local card = cjson.decode(raw)
if #card.answers <= 1 then return -2 end
local found = false
local newAnswers = {}
for _, a in ipairs(card.answers) do
  if a.id == ARGV[1] then
    found = true
  else
    table.insert(newAnswers, a)
  end
end
if not found then return 0 end
card.answers = newAnswers
redis.call('SET', KEYS[1], cjson.encode(card))
local votes = redis.call('HGETALL', KEYS[2])
for i = 1, #votes, 2 do
  local user = votes[i]
  local val = votes[i+1]
  local ok, sel = pcall(cjson.decode, val)
  if ok and type(sel) == 'table' then
    local newSel = {}
    for _, aid in ipairs(sel) do
      if aid ~= ARGV[1] then
        table.insert(newSel, aid)
      end
    end
    if #newSel == 0 then
      redis.call('HDEL', KEYS[2], user)
    else
      redis.call('HSET', KEYS[2], user, cjson.encode(newSel))
    end
  end
end
return 1
`

export async function deleteAnswerFromCard(
  id: string,
  answerId: string
): Promise<number> {
  const result = await getRedis().eval(
    DELETE_ANSWER_SCRIPT,
    [`card:${id}`, `votes:card:${id}`],
    [answerId]
  )
  return Number(result)
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

// Atomic vote submission: validates voter is a participant, every selected id
// exists on the current card, non-empty, and respects single-choice cardinality.
// Returns: 1 ok, -1 no card, -2 empty, -3 too many for single, -4 unknown id,
// -5 not a participant.
const SUBMIT_VOTE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return -1 end
local card = cjson.decode(raw)
local selections = cjson.decode(ARGV[2])
if type(selections) ~= 'table' or #selections == 0 then return -2 end
if card.voteType == 'single' and #selections > 1 then return -3 end
local valid = {}
for _, a in ipairs(card.answers) do valid[a.id] = true end
for _, aid in ipairs(selections) do
  if not valid[aid] then return -4 end
end
local isParticipant = false
for _, p in ipairs(card.participants) do
  if p == ARGV[1] then isParticipant = true break end
end
if not isParticipant then return -5 end
redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
return 1
`

export async function submitVote(
  cardId: string,
  userName: string,
  answerIds: string[]
): Promise<number> {
  const result = await getRedis().eval(
    SUBMIT_VOTE_SCRIPT,
    [`card:${cardId}`, `votes:card:${cardId}`],
    [userName, JSON.stringify(answerIds)]
  )
  return Number(result)
}
