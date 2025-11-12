import { useState, useEffect } from 'react';
import { userService, tennisService } from '../lib/supabase';
import './TennisRecordPage.css';

function TennisRecordPage({ onBack }) {
  const [players, setPlayers] = useState({
    player1: '',
    player2: '',
    player3: '',
    player4: '',
  });
  const [scores, setScores] = useState({
    score_left: '',
    score_right: '',
  });
  const [userNames, setUserNames] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadUserNames();
  }, []);

  const loadUserNames = async () => {
    try {
      const names = await userService.getUserNames();
      setUserNames(names);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    }
  };

  const handlePlayerClick = (field) => {
    setSelectedPlayer(field);
    setError('');
  };

  const handleNameSelect = (name) => {
    if (selectedPlayer) {
      setPlayers((prev) => ({
        ...prev,
        [selectedPlayer]: name,
      }));
    }
    setSelectedPlayer(null);
  };

  const handleScoreChange = (field, value) => {
    const numValue = parseInt(value) || '';
    if (numValue === '' || (numValue >= 0 && numValue <= 7)) {
      setScores((prev) => ({
        ...prev,
        [field]: numValue,
      }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 유효성 검사
    if (!players.player1 || !players.player2 || !players.player3 || !players.player4) {
      setError('모든 이름을 선택하세요');
      return;
    }

    if (scores.score_left === '' || scores.score_right === '') {
      setError('결과를 입력하세요');
      return;
    }

    setIsLoading(true);

    try {
      await tennisService.saveRecord({
        ...players,
        ...scores,
      });
      setSuccess(true);
      // 폼 초기화
      setPlayers({
        player1: '',
        player2: '',
        player3: '',
        player4: '',
      });
      setScores({
        score_left: '',
        score_right: '',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError(error.message || '저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tennis-record-page">
      <header className="tennis-record-header">
        <button className="back-button" onClick={onBack} aria-label="뒤로가기">
          ←
        </button>
        <h1>테니스 경기 기록</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="tennis-record-main">
        <form className="tennis-record-form" onSubmit={handleSubmit}>
          <div className="team-section">
            <h2>왼쪽 팀</h2>
            <div className="player-inputs">
              <button
                type="button"
                className={`player-button ${selectedPlayer === 'player1' ? 'selected' : ''}`}
                onClick={() => handlePlayerClick('player1')}
              >
                {players.player1 || '이름 1'}
              </button>
              <button
                type="button"
                className={`player-button ${selectedPlayer === 'player2' ? 'selected' : ''}`}
                onClick={() => handlePlayerClick('player2')}
              >
                {players.player2 || '이름 2'}
              </button>
            </div>
          </div>

          <div className="team-section">
            <h2>오른쪽 팀</h2>
            <div className="player-inputs">
              <button
                type="button"
                className={`player-button ${selectedPlayer === 'player3' ? 'selected' : ''}`}
                onClick={() => handlePlayerClick('player3')}
              >
                {players.player3 || '이름 3'}
              </button>
              <button
                type="button"
                className={`player-button ${selectedPlayer === 'player4' ? 'selected' : ''}`}
                onClick={() => handlePlayerClick('player4')}
              >
                {players.player4 || '이름 4'}
              </button>
            </div>
          </div>

          <div className="score-section">
            <h2>세트 결과</h2>
            <div className="score-inputs">
              <div className="score-input-group">
                <label>왼쪽 팀</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.score_left}
                  onChange={(e) => handleScoreChange('score_left', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="score-separator">:</div>
              <div className="score-input-group">
                <label>오른쪽 팀</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={scores.score_right}
                  onChange={(e) => handleScoreChange('score_right', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
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
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </form>

        {selectedPlayer && (
          <div className="name-selector-overlay" onClick={() => setSelectedPlayer(null)}>
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
                onClick={() => setSelectedPlayer(null)}
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

export default TennisRecordPage;

