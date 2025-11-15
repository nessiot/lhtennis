import { useState, useEffect } from 'react';
import { billiardsService } from '../lib/supabase';
import NameSelector from './NameSelector';
import './BilliardsStatsPage.css';

function BilliardsStatsPage({ onBack }) {
  const [mode, setMode] = useState('date'); // 'date' or 'name'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showNameSelector, setShowNameSelector] = useState(false);

  useEffect(() => {
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
      const sorted = dateRecords
        .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
        .map((record, index) => ({ ...record, rank: index + 1 }));
      setRecords(sorted);
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
    setSelectedName(name || '');
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
                : `${selectedName} 최근 1년 기록`}
            </h3>
            <div className="records-table-wrapper">
              <table className={`stats-table ${mode === 'name' ? 'with-date' : ''}`}>
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>이름</th>
                    <th>다마수</th>
                    <th>뺀공</th>
                    <th>히로</th>
                    <th>퍼센트</th>
                    {mode === 'name' && <th>날짜</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="cell-rank">{record.rank || '-'}</td>
                      <td className="cell-name">{record.player_name}</td>
                      <td className="cell-number">{record.base_dama}</td>
                      <td className="cell-number">{record.minus_dama}</td>
                      <td className="cell-number">{record.plus_dama}</td>
                      <td
                        className={`cell-percentage ${
                          parseFloat(record.percentage) >= 100 ? 'positive' : 'negative'
                        }`}
                      >
                        {Number(record.percentage || 0).toFixed(2)}%
                      </td>
                      {mode === 'name' && (
                        <td className="cell-date">
                          {new Date(record.created_at).toLocaleDateString('ko-KR')}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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

      <NameSelector
        isOpen={showNameSelector}
        onClose={() => setShowNameSelector(false)}
        onSelect={handleNameSelect}
        title="이름 선택"
        allowEmptySelection
      />
    </div>
  );
}

export default BilliardsStatsPage;
