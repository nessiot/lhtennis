import './TennisMenu.css';

function TennisMenu({ onRecordClick, onStatsClick, onBack }) {
  return (
    <div className="tennis-menu">
      <header className="tennis-menu-header">
        <button className="back-button" onClick={onBack} aria-label="뒤로가기">
          ←
        </button>
        <h1>테니스</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="tennis-menu-main">
        <div className="menu-buttons">
          <button
            className="menu-button record-button"
            onClick={onRecordClick}
          >
            기록
          </button>
          
          <button
            className="menu-button stats-button"
            onClick={onStatsClick}
          >
            통계
          </button>
        </div>
      </main>
    </div>
  );
}

export default TennisMenu;

