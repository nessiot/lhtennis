import { useState } from 'react';
import { tennisService } from '../lib/supabase';
import NameSelector from './NameSelector';
import './TennisStatsPage.css';

function TennisStatsPage({ onBack }) {
  const [filters, setFilters] = useState({
    player1: '',
    player2: '',
    player3: '',
    player4: '',
  });
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const handleFilterClick = (field) => {
    setSelectedFilter(field);
    setError('');
  };

  const handleNameSelect = (name) => {
    if (selectedFilter) {
      setFilters((prev) => ({
        ...prev,
        [selectedFilter]: name || '',
      }));
    }
    setSelectedFilter(null);
  };

  const handleSearch = async () => {
    const hasFilter = Object.values(filters).some((v) => v);
    if (!hasFilter) {
      setError('조회할 이름을 입력하세요');
      return;
    }

    try {
      const records = await tennisService.getFilteredRecords(filters);
      calculateStats(records);
      setError('');
    } catch (error) {
      setError(error.message || '조회 중 오류가 발생했습니다');
      setStats(null);
    }
  };

  const calculateStats = (records) => {
    if (records.length === 0) {
      setStats({
        total: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        records: [],
      });
      return;
    }

    let wins = 0;
    let losses = 0;

    const processedRecords = records.map((record) => {
      const orientedRecord = record.flipped
        ? {
            ...record,
            player1: record.player3,
            player2: record.player4,
            player3: record.player1,
            player4: record.player2,
            score_left: record.score_right,
            score_right: record.score_left,
          }
        : record;

      const isWin = orientedRecord.score_left > orientedRecord.score_right;
      if (isWin) wins++;
      else losses++;

      return {
        ...orientedRecord,
        isWin,
        leftTeam: `${orientedRecord.player1} / ${orientedRecord.player2}`,
        rightTeam: `${orientedRecord.player3} / ${orientedRecord.player4}`,
        score: `${orientedRecord.score_left} : ${orientedRecord.score_right}`,
        date: new Date(orientedRecord.created_at).toLocaleDateString('ko-KR'),
      };
    });

    setStats({
      total: records.length,
      wins,
      losses,
      winRate: records.length > 0 ? ((wins / records.length) * 100).toFixed(1) : 0,
      records: processedRecords,
    });
  };

  const clearFilters = () => {
    setFilters({
      player1: '',
      player2: '',
      player3: '',
      player4: '',
    });
    setStats(null);
    setError('');
  };

  return (
    <div className="tennis-stats-page">
      <header className="tennis-stats-header">
        <button className="back-button" onClick={onBack} aria-label="뒤로가기">
          ←
        </button>
        <h1>테니스 통계</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="tennis-stats-main">
        <div className="stats-filters">
          <h2>조회 조건</h2>
          <div className="team-filter-sections">
            <div className="team-filter-card">
              <p className="team-filter-label">내 팀</p>
              <div className="player-inputs stats-player-inputs">
                <button
                  type="button"
                  className={`player-button stats-player-button ${
                    selectedFilter === 'player1' ? 'selected' : ''
                  }`}
                  onClick={() => handleFilterClick('player1')}
                >
                  {filters.player1 || '이름 1'}
                </button>
                <button
                  type="button"
                  className={`player-button stats-player-button ${
                    selectedFilter === 'player2' ? 'selected' : ''
                  }`}
                  onClick={() => handleFilterClick('player2')}
                >
                  {filters.player2 || '이름 2'}
                </button>
              </div>
            </div>
            <div className="team-filter-card">
              <p className="team-filter-label">상대 팀</p>
              <div className="player-inputs stats-player-inputs">
                <button
                  type="button"
                  className={`player-button stats-player-button ${
                    selectedFilter === 'player3' ? 'selected' : ''
                  }`}
                  onClick={() => handleFilterClick('player3')}
                >
                  {filters.player3 || '이름 3'}
                </button>
                <button
                  type="button"
                  className={`player-button stats-player-button ${
                    selectedFilter === 'player4' ? 'selected' : ''
                  }`}
                  onClick={() => handleFilterClick('player4')}
                >
                  {filters.player4 || '이름 4'}
                </button>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button
              type="button"
              className="action-button search-button"
              onClick={handleSearch}
            >
              조회
            </button>
            <button
              type="button"
              className="action-button clear-button"
              onClick={clearFilters}
            >
              초기화
            </button>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>

        {stats && (
          <div className="stats-results">
            <div className="stats-summary">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">전체 경기</div>
              </div>
              <div className="stat-card rate">
                <div className="stat-value">{stats.winRate}%</div>
                <div className="stat-label">승률</div>
              </div>
              <div className="stat-card win">
                <div className="stat-value">{stats.wins}</div>
                <div className="stat-label">승</div>
              </div>
              <div className="stat-card loss">
                <div className="stat-value">{stats.losses}</div>
                <div className="stat-label">패</div>
              </div>
            </div>

            <div className="stats-records">
              <h3>경기 기록</h3>
              {stats.records.length === 0 ? (
                <p className="no-records">기록이 없습니다</p>
              ) : (
                <div className="records-list">
                  {stats.records.map((record) => (
                    <div
                      key={record.id}
                      className={`record-item ${record.isWin ? 'win' : 'loss'}`}
                    >
                      <div className="record-date">{record.date}</div>
                      <div className="record-teams">
                        <div className="team">{record.leftTeam}</div>
                        <div className="score">{record.score}</div>
                        <div className="team">{record.rightTeam}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <NameSelector
        isOpen={!!selectedFilter}
        onClose={() => setSelectedFilter(null)}
        onSelect={handleNameSelect}
        title="이름 선택"
        allowEmptySelection
      />
    </div>
  );
}

export default TennisStatsPage;


