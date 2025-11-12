import { useState, useEffect } from 'react';
import { userService, billiardsService } from '../lib/supabase';
import './BilliardsRecordPage.css';

function BilliardsRecordPage({ onBack }) {
  const [records, setRecords] = useState([
    { player_name: '', base_dama: '', minus_dama: '', plus_dama: '', percentage: 0 },
    { player_name: '', base_dama: '', minus_dama: '', plus_dama: '', percentage: 0 },
    { player_name: '', base_dama: '', minus_dama: '', plus_dama: '', percentage: 0 },
    { player_name: '', base_dama: '', minus_dama: '', plus_dama: '', percentage: 0 },
    { player_name: '', base_dama: '', minus_dama: '', plus_dama: '', percentage: 0 },
    { player_name: '', base_dama: '', minus_dama: '', plus_dama: '', percentage: 0 },
  ]);
  const [userNames, setUserNames] = useState([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadUserNames();
    loadTodayRecords();
  }, []);

  const loadUserNames = async () => {
    try {
      const names = await userService.getUserNames();
      setUserNames(names);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    }
  };

  const loadTodayRecords = async () => {
    try {
      const today = new Date().toISOString();
      const todayRecords = await billiardsService.getRecordsByDate(today);
      if (todayRecords.length > 0) {
        const formatted = todayRecords.map((r) => ({
          player_name: r.player_name,
          base_dama: r.base_dama.toString(),
          minus_dama: r.minus_dama.toString(),
          plus_dama: r.plus_dama.toString(),
          percentage: r.percentage,
        }));
        // 빈 레코드와 병합
        const merged = [...records];
        formatted.forEach((r, i) => {
          if (i < merged.length) {
            merged[i] = { ...merged[i], ...r };
          }
        });
        setRecords(merged);
      }
    } catch (error) {
      console.error('오늘 기록 로드 실패:', error);
    }
  };

  const handleAddRow = () => {
    setRecords([...records, { player_name: '', base_dama: '', minus_dama: '', plus_dama: '', percentage: 0 }]);
  };

  const handleRemoveRow = (index) => {
    if (records.length > 1) {
      setRecords(records.filter((_, i) => i !== index));
    }
  };

  const handlePlayerClick = (index) => {
    setSelectedPlayerIndex(index);
    setError('');
  };

  const handleNameSelect = (name) => {
    if (selectedPlayerIndex !== null) {
      const updated = [...records];
      updated[selectedPlayerIndex] = {
        ...updated[selectedPlayerIndex],
        player_name: name,
      };
      setRecords(updated);
      // 이름 선택 시 기존 다마수 로드
      loadBaseDama(selectedPlayerIndex, name);
    }
    setSelectedPlayerIndex(null);
  };

  const loadBaseDama = async (index, name) => {
    try {
      const playerRecords = await billiardsService.getRecordsByName(name, 1);
      if (playerRecords.length > 0) {
        const latest = playerRecords[0];
        const updated = [...records];
        updated[index] = {
          ...updated[index],
          base_dama: latest.base_dama.toString(),
        };
        setRecords(updated);
      }
    } catch (error) {
      console.error('기존 다마수 로드 실패:', error);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...records];
    if (field === 'base_dama' || field === 'minus_dama' || field === 'plus_dama') {
      const numValue = value === '' ? '' : parseInt(value) || 0;
      updated[index][field] = numValue.toString();
      // 퍼센트 자동 계산
      const base = parseFloat(updated[index].base_dama) || 0;
      const minus = parseFloat(updated[index].minus_dama) || 0;
      const plus = parseFloat(updated[index].plus_dama) || 0;
      const total = base - minus + plus;
      updated[index].percentage = base > 0 ? ((total / base) * 100).toFixed(1) : 0;
    }
    setRecords(updated);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 유효성 검사
    const hasName = records.some((r) => r.player_name);
    if (!hasName) {
      setError('최소 한 명의 이름을 선택하세요');
      return;
    }

    const validRecords = records
      .filter((r) => r.player_name)
      .map((r) => ({
        player_name: r.player_name,
        base_dama: parseFloat(r.base_dama) || 0,
        minus_dama: parseFloat(r.minus_dama) || 0,
        plus_dama: parseFloat(r.plus_dama) || 0,
        percentage: parseFloat(r.percentage) || 0,
      }));

    setIsLoading(true);

    try {
      await billiardsService.saveRecords(validRecords);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error.message || '저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="billiards-record-page">
      <header className="billiards-record-header">
        <button className="back-button" onClick={onBack} aria-label="뒤로가기">
          ←
        </button>
        <h1>당구 경기 기록</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="billiards-record-main">
        <form className="billiards-record-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>오늘의 경기 결과</h2>
            <button
              type="button"
              className="add-row-button"
              onClick={handleAddRow}
            >
              + 추가
            </button>
          </div>

          <div className="records-list">
            {records.map((record, index) => (
              <div key={index} className="record-row">
                <div className="row-header">
                  <span className="row-number">{index + 1}</span>
                  {records.length > 1 && (
                    <button
                      type="button"
                      className="remove-row-button"
                      onClick={() => handleRemoveRow(index)}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="row-content">
                  <button
                    type="button"
                    className={`player-button ${selectedPlayerIndex === index ? 'selected' : ''}`}
                    onClick={() => handlePlayerClick(index)}
                  >
                    {record.player_name || '이름 선택'}
                  </button>

                  <div className="input-group">
                    <label>기존 다마수</label>
                    <input
                      type="number"
                      value={record.base_dama}
                      onChange={(e) => handleInputChange(index, 'base_dama', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="input-group">
                    <label>뺀 다마수</label>
                    <input
                      type="number"
                      value={record.minus_dama}
                      onChange={(e) => handleInputChange(index, 'minus_dama', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="input-group">
                    <label>추가 다마수</label>
                    <input
                      type="number"
                      value={record.plus_dama}
                      onChange={(e) => handleInputChange(index, 'plus_dama', e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="percentage-display">
                    <label>퍼센트</label>
                    <div className="percentage-value">{record.percentage}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              저장되었습니다!
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? '업데이트 중...' : '업데이트'}
          </button>
        </form>

        {selectedPlayerIndex !== null && (
          <div className="name-selector-overlay" onClick={() => setSelectedPlayerIndex(null)}>
            <div className="name-selector" onClick={(e) => e.stopPropagation()}>
              <h3>이름 선택</h3>
              <div className="name-list">
                {userNames.length === 0 ? (
                  <p className="no-names">등록된 이름이 없습니다</p>
                ) : (
                  userNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="name-item"
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
                onClick={() => setSelectedPlayerIndex(null)}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default BilliardsRecordPage;

