import { useState, useEffect } from 'react';
import { userService, billiardsService } from '../lib/supabase';
import './BilliardsStatsPage.css';

function BilliardsStatsPage({ onBack }) {
  const [mode, setMode] = useState('date'); // 'date' or 'name'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [userNames, setUserNames] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showNameSelector, setShowNameSelector] = useState(false);

  useEffect(() => {
    loadUserNames();
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (mode === 'date' && selectedDate) {
      loadRecordsByDate();
    } else if (mode === 'name' && selectedName) {
      loadRecordsByName();
    } else {
      setRecords([]);
    }
  }, [mode, selectedDate, selectedName]);

  const loadUserNames = async () => {
    try {
      const names = await userService.getUserNames();
      setUserNames(names);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const dates = await billiardsService.getAvailableDates();
      setAvailableDates(dates);
    } catch (error) {
      console.error('날짜 목록 로드 실패:', error);
    }
  };

  const loadRecordsByDate = async () => {
    try {
      const dateRecords = await billiardsService.getRecordsByDate(selectedDate);
      setRecords(dateRecords.sort((a, b) => 
        parseFloat(b.percentage) - parseFloat(a.percentage)
      ));
      setError('');
    } catch (error) {
      setError(error.message || '조회 중 오류가 발생했습니다');
      setRecords([]);
    }
  };

  const loadRecordsByName = async () => {
    try {
      const nameRecords = await billiardsService.getRecordsByName(selectedName);
      setRecords(nameRecords);
      setError('');
    } catch (error) {
      setError(error.message || '조회 중 오류가 발생했습니다');
      setRecords([]);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setSelectedDate('');
    setSelectedName('');
    setRecords([]);
    setError('');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowDateSelector(false);
  };

  const handleNameSelect = (name) => {
    setSelectedName(name);
    setShowNameSelector(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="billiards-stats-page">
      <header className="billiards-stats-header">
        <button className="back-button" onClick={onBack} aria-label="뒤로가기">
          ←
        </button>
        <h1>당구 통계</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="billiards-stats-main">
        <div className="stats-mode-selector">
          <button
            type="button"
            className={`mode-button ${mode === 'date' ? 'active' : ''}`}
            onClick={() => handleModeChange('date')}
          >
            날짜
          </button>
          <button
            type="button"
            className={`mode-button ${mode === 'name' ? 'active' : ''}`}
            onClick={() => handleModeChange('name')}
          >
            이름
          </button>
        </div>

        <div className="stats-filters">
          {mode === 'date' && (
            <div className="filter-section">
              <h2>날짜 선택</h2>
              <button
                type="button"
                className="filter-select-button"
                onClick={() => setShowDateSelector(true)}
              >
                {selectedDate ? formatDate(selectedDate) : '날짜를 선택하세요'}
              </button>
            </div>
          )}

          {mode === 'name' && (
            <div className="filter-section">
              <h2>이름 선택</h2>
              <button
                type="button"
                className="filter-select-button"
                onClick={() => setShowNameSelector(true)}
              >
                {selectedName || '이름을 선택하세요'}
              </button>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>

        {records.length > 0 && (
          <div className="stats-results">
            <h3>
              {mode === 'date' 
                ? `${formatDate(selectedDate)} 경기 결과`
                : `${selectedName} 최근 1년 기록`
              }
            </h3>
            <div className="records-table">
              <div className={`table-header ${mode === 'name' ? 'with-date' : ''}`}>
                <div>이름</div>
                <div>기존 다마수</div>
                <div>뺀 다마수</div>
                <div>추가 다마수</div>
                <div>퍼센트</div>
                {mode === 'name' && <div>날짜</div>}
              </div>
              {records.map((record) => (
                <div key={record.id} className={`table-row ${mode === 'name' ? 'with-date' : ''}`}>
                  <div className="cell-name">{record.player_name}</div>
                  <div className="cell-number">{record.base_dama}</div>
                  <div className="cell-number">{record.minus_dama}</div>
                  <div className="cell-number">{record.plus_dama}</div>
                  <div className={`cell-percentage ${parseFloat(record.percentage) >= 100 ? 'positive' : 'negative'}`}>
                    {record.percentage}%
                  </div>
                  {mode === 'name' && (
                    <div className="cell-date">
                      {new Date(record.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {records.length === 0 && (selectedDate || selectedName) && !error && (
          <div className="no-results">
            <p>결과가 없습니다</p>
          </div>
        )}
      </main>

      {showDateSelector && (
        <div className="selector-overlay" onClick={() => setShowDateSelector(false)}>
          <div className="selector" onClick={(e) => e.stopPropagation()}>
            <h3>날짜 선택</h3>
            <div className="selector-list">
              {availableDates.length === 0 ? (
                <p className="no-items">저장된 날짜가 없습니다</p>
              ) : (
                availableDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    className="selector-item"
                    onClick={() => handleDateSelect(date)}
                  >
                    {formatDate(date)}
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              className="close-selector"
              onClick={() => setShowDateSelector(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showNameSelector && (
        <div className="selector-overlay" onClick={() => setShowNameSelector(false)}>
          <div className="selector" onClick={(e) => e.stopPropagation()}>
            <h3>이름 선택</h3>
            <div className="selector-list">
              {userNames.length === 0 ? (
                <p className="no-items">등록된 이름이 없습니다</p>
              ) : (
                userNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="selector-item"
                    onClick={() => handleNameSelect(name)}
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              className="close-selector"
              onClick={() => setShowNameSelector(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BilliardsStatsPage;

