import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null

const shouldUseLocalFallback = !supabase

if (shouldUseLocalFallback) {
  console.warn(
    'Supabase 환경 변수가 설정되지 않아 로컬 스토리지에 데이터를 저장합니다.'
  )
}

const LOCAL_KEYS = {
  users: 'lhtennis_users',
  tennis: 'lhtennis_tennis_records',
  billiards: 'lhtennis_billiards_records',
}

const hasWindow = typeof window !== 'undefined'

const readLocalArray = (key) => {
  if (!hasWindow) return []
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error(`로컬 스토리지 ${key} 읽기 실패:`, error)
    return []
  }
}

const writeLocalArray = (key, value) => {
  if (!hasWindow) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const validateName = (name) => {
  if (!name || !name.trim()) {
    throw new Error('이름을 입력하세요')
  }

  if (name.trim().length > 20) {
    throw new Error('이름은 최대 20자까지 입력 가능합니다')
  }

  return name.trim()
}

const filterTennisRecords = (records, filters) => {
  const matchesTeam = (teamPlayers, firstFilter, secondFilter) => {
    const activeFilters = [firstFilter, secondFilter].filter(Boolean)
    if (activeFilters.length === 0) return true
    return activeFilters.every((name) => teamPlayers.includes(name))
  }

  const results = []

  records.forEach((record) => {
    const leftTeam = [record.player1, record.player2].filter(Boolean)
    const rightTeam = [record.player3, record.player4].filter(Boolean)

    const normalMatch =
      matchesTeam(leftTeam, filters.player1, filters.player2) &&
      matchesTeam(rightTeam, filters.player3, filters.player4)

    if (normalMatch) {
      results.push({ ...record, flipped: false })
      return
    }

    const flippedMatch =
      matchesTeam(rightTeam, filters.player1, filters.player2) &&
      matchesTeam(leftTeam, filters.player3, filters.player4)

    if (flippedMatch) {
      results.push({ ...record, flipped: true })
    }
  })

  return results
}

const getDateRange = (inputDate) => {
  const baseDate = inputDate ? new Date(inputDate) : new Date()
  const start = new Date(baseDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

const oneYearAgoIso = () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return oneYearAgo.toISOString()
}

export const userService = {
  async getUsers() {
    if (shouldUseLocalFallback) {
      return readLocalArray(LOCAL_KEYS.users)
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async registerUser(name) {
    const trimmedName = validateName(name)

    if (shouldUseLocalFallback) {
      const users = readLocalArray(LOCAL_KEYS.users)
      const isDuplicate = users.some(
        (user) => user.name.toLowerCase() === trimmedName.toLowerCase()
      )

      if (isDuplicate) {
        throw new Error('이미 등록된 이름입니다')
      }

      const newUser = {
        id: Date.now().toString(),
        name: trimmedName,
        created_at: new Date().toISOString(),
      }

      users.push(newUser)
      writeLocalArray(LOCAL_KEYS.users, users)
      return newUser
    }

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .ilike('name', trimmedName)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError
    }

    if (existing) {
      throw new Error('이미 등록된 이름입니다')
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ name: trimmedName }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserByName(name) {
    if (shouldUseLocalFallback) {
      const users = readLocalArray(LOCAL_KEYS.users)
      return users.find(
        (user) => user.name.toLowerCase() === name.toLowerCase()
      )
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('name', name.trim())
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async getUserNames() {
    if (shouldUseLocalFallback) {
      const users = readLocalArray(LOCAL_KEYS.users)
      return users.map((user) => user.name).sort()
    }

    const { data, error } = await supabase
      .from('users')
      .select('name')
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map((user) => user.name)
  },
}

export const tennisService = {
  async getRecords() {
    if (shouldUseLocalFallback) {
      return readLocalArray(LOCAL_KEYS.tennis)
    }

    const { data, error } = await supabase
      .from('tennis_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async saveRecord(record) {
    if (shouldUseLocalFallback) {
      const records = readLocalArray(LOCAL_KEYS.tennis)
      const newRecord = {
        id: Date.now().toString(),
        player1: record.player1,
        player2: record.player2,
        player3: record.player3,
        player4: record.player4,
        score_left: record.score_left,
        score_right: record.score_right,
        created_at: new Date().toISOString(),
      }
      records.push(newRecord)
      writeLocalArray(LOCAL_KEYS.tennis, records)
      return newRecord
    }

    const payload = {
      player1: record.player1,
      player2: record.player2,
      player3: record.player3,
      player4: record.player4,
      score_left: record.score_left,
      score_right: record.score_right,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('tennis_records')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getFilteredRecords(filters) {
    const records = await this.getRecords()
    return filterTennisRecords(records, filters)
  },
}

export const billiardsService = {
  async getRecords() {
    if (shouldUseLocalFallback) {
      return readLocalArray(LOCAL_KEYS.billiards)
    }

    const { data, error } = await supabase
      .from('billiards_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async saveRecords(records) {
    if (shouldUseLocalFallback) {
      const existingRecords = readLocalArray(LOCAL_KEYS.billiards)
      const today = new Date().toISOString().split('T')[0]
      const filtered = existingRecords.filter(
        (r) => r.created_at.split('T')[0] !== today
      )
      const newRecords = records.map((record) => ({
        id: Date.now().toString() + Math.random(),
        player_name: record.player_name,
        base_dama: record.base_dama || 0,
        minus_dama: record.minus_dama || 0,
        plus_dama: record.plus_dama || 0,
        percentage: record.percentage || 0,
        created_at: new Date().toISOString(),
      }))
      const allRecords = [...filtered, ...newRecords]
      writeLocalArray(LOCAL_KEYS.billiards, allRecords)
      return newRecords
    }

    const { start, end } = getDateRange(new Date())

    await supabase
      .from('billiards_records')
      .delete()
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())

    const payload = records.map((record) => ({
      player_name: record.player_name,
      base_dama: record.base_dama || 0,
      minus_dama: record.minus_dama || 0,
      plus_dama: record.plus_dama || 0,
      percentage: record.percentage || 0,
      created_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('billiards_records')
      .insert(payload)
      .select()

    if (error) throw error
    return data || []
  },

  async getRecordsByDate(date) {
    if (shouldUseLocalFallback) {
      const records = readLocalArray(LOCAL_KEYS.billiards)
      const targetDate = date.split('T')[0]
      return records.filter((r) => r.created_at.split('T')[0] === targetDate)
    }

    const { start, end } = getDateRange(date)
    const { data, error } = await supabase
      .from('billiards_records')
      .select('*')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getRecordsByName(name, limit = 365) {
    if (shouldUseLocalFallback) {
      const records = readLocalArray(LOCAL_KEYS.billiards)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      return records
        .filter(
          (r) =>
            r.player_name === name &&
            new Date(r.created_at) >= oneYearAgo
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
    }

    const { data, error } = await supabase
      .from('billiards_records')
      .select('*')
      .eq('player_name', name)
      .gte('created_at', oneYearAgoIso())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getAvailableDates() {
    if (shouldUseLocalFallback) {
      const records = readLocalArray(LOCAL_KEYS.billiards)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const dates = new Set()
      records.forEach((r) => {
        const recordDate = new Date(r.created_at)
        if (recordDate >= oneYearAgo) {
          dates.add(r.created_at.split('T')[0])
        }
      })
      return Array.from(dates).sort().reverse()
    }

    const { data, error } = await supabase
      .from('billiards_records')
      .select('created_at')
      .gte('created_at', oneYearAgoIso())

    if (error) throw error

    const dates = new Set(
      (data || [])
        .map((row) => row.created_at && row.created_at.split('T')[0])
        .filter(Boolean)
    )

    return Array.from(dates).sort().reverse()
  },
}

