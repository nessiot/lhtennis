// Supabase 클라이언트 설정
// TODO: 실제 Supabase 프로젝트 URL과 API 키로 교체 필요

// 환경 변수에서 가져오거나, 실제 값으로 교체
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 (나중에 @supabase/supabase-js 패키지 설치 후 사용)
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 임시: 로컬 스토리지를 사용한 사용자 관리 (개발용)
// 실제 Supabase 연결 후 이 부분을 교체해야 함

export const userService = {
  // 사용자 목록 가져오기 (로컬 스토리지)
  async getUsers() {
    try {
      const stored = localStorage.getItem('lhtennis_users');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('사용자 목록 가져오기 실패:', error);
      return [];
    }
  },

  // 사용자 등록
  async registerUser(name) {
    // 유효성 검사
    if (!name || !name.trim()) {
      throw new Error('이름을 입력하세요');
    }

    if (name.trim().length > 20) {
      throw new Error('이름은 최대 20자까지 입력 가능합니다');
    }

    const trimmedName = name.trim();
    const users = await this.getUsers();

    // 중복 확인
    const isDuplicate = users.some(
      (user) => user.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error('이미 등록된 이름입니다');
    }

    // 새 사용자 추가
    const newUser = {
      id: Date.now().toString(), // 임시 ID
      name: trimmedName,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('lhtennis_users', JSON.stringify(users));

    return newUser;
  },

  // 사용자 이름으로 검색
  async getUserByName(name) {
    const users = await this.getUsers();
    return users.find(
      (user) => user.name.toLowerCase() === name.toLowerCase()
    );
  },

  // 모든 사용자 이름 목록 가져오기
  async getUserNames() {
    const users = await this.getUsers();
    return users.map((user) => user.name).sort();
  },
};

// 테니스 경기 기록 서비스
export const tennisService = {
  // 테니스 기록 목록 가져오기
  async getRecords() {
    try {
      const stored = localStorage.getItem('lhtennis_tennis_records');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('테니스 기록 가져오기 실패:', error);
      return [];
    }
  },

  // 테니스 기록 저장
  async saveRecord(record) {
    const records = await this.getRecords();
    const newRecord = {
      id: Date.now().toString(),
      player1: record.player1,
      player2: record.player2,
      player3: record.player3,
      player4: record.player4,
      score_left: record.score_left,
      score_right: record.score_right,
      created_at: new Date().toISOString(),
    };
    records.push(newRecord);
    localStorage.setItem('lhtennis_tennis_records', JSON.stringify(records));
    return newRecord;
  },

  // 필터링된 기록 가져오기
  async getFilteredRecords(filters) {
    const records = await this.getRecords();
    const matchesTeam = (teamPlayers, firstFilter, secondFilter) => {
      const activeFilters = [firstFilter, secondFilter].filter(Boolean);
      if (activeFilters.length === 0) return true;
      return activeFilters.every((name) => teamPlayers.includes(name));
    };

    const results = [];

    records.forEach((record) => {
      const leftTeam = [record.player1, record.player2];
      const rightTeam = [record.player3, record.player4];

      const normalMatch =
        matchesTeam(leftTeam, filters.player1, filters.player2) &&
        matchesTeam(rightTeam, filters.player3, filters.player4);

      if (normalMatch) {
        results.push({ ...record, flipped: false });
        return;
      }

      const flippedMatch =
        matchesTeam(rightTeam, filters.player1, filters.player2) &&
        matchesTeam(leftTeam, filters.player3, filters.player4);

      if (flippedMatch) {
        results.push({ ...record, flipped: true });
      }
    });

    return results;
  },
};

// 당구 경기 기록 서비스
export const billiardsService = {
  // 당구 기록 목록 가져오기
  async getRecords() {
    try {
      const stored = localStorage.getItem('lhtennis_billiards_records');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('당구 기록 가져오기 실패:', error);
      return [];
    }
  },

  // 당구 기록 저장/업데이트
  async saveRecords(records) {
    const existingRecords = await this.getRecords();
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 날짜의 기록 제거
    const filtered = existingRecords.filter(
      (r) => r.created_at.split('T')[0] !== today
    );
    
    // 새 기록 추가
    const newRecords = records.map((record) => ({
      id: Date.now().toString() + Math.random(),
      player_name: record.player_name,
      base_dama: record.base_dama || 0,
      minus_dama: record.minus_dama || 0,
      plus_dama: record.plus_dama || 0,
      percentage: record.percentage || 0,
      created_at: new Date().toISOString(),
    }));
    
    const allRecords = [...filtered, ...newRecords];
    localStorage.setItem('lhtennis_billiards_records', JSON.stringify(allRecords));
    return newRecords;
  },

  // 날짜별 기록 가져오기
  async getRecordsByDate(date) {
    const records = await this.getRecords();
    const targetDate = date.split('T')[0];
    return records.filter((r) => r.created_at.split('T')[0] === targetDate);
  },

  // 이름별 기록 가져오기 (최근 1년)
  async getRecordsByName(name, limit = 365) {
    const records = await this.getRecords();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return records
      .filter(
        (r) =>
          r.player_name === name &&
          new Date(r.created_at) >= oneYearAgo
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  // 사용 가능한 날짜 목록 가져오기 (최근 1년)
  async getAvailableDates() {
    const records = await this.getRecords();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const dates = new Set();
    records.forEach((r) => {
      const recordDate = new Date(r.created_at);
      if (recordDate >= oneYearAgo) {
        dates.add(r.created_at.split('T')[0]);
      }
    });
    
    return Array.from(dates).sort().reverse();
  },
};

// 실제 Supabase를 사용하는 경우의 예시 함수
/*
export const userService = {
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async registerUser(name) {
    // 중복 확인
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('name', name)
      .single();

    if (existing) {
      throw new Error('이미 등록된 이름입니다');
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ name: name.trim() }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserByName(name) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('name', name)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserNames() {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map((user) => user.name);
  },
};
*/
