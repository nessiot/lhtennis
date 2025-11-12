import './BilliardsMenu.css';

function BilliardsMenu({ onRecordClick, onStatsClick, onBack }) {
  return (
    <div className="billiards-menu">
      <header className="billiards-menu-header">
        <button className="back-button" onClick={onBack} aria-label="뒤로가기">
          ←
        </button>
        <h1>당구</h1>
        <div className="header-spacer"></div>
      </header>

      <main className="billiards-menu-main">
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

export default BilliardsMenu;

