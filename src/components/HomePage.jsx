import './HomePage.css';

function HomePage({ onTennisClick, onBilliardsClick, onRegisterClick }) {
  return (
    <div className="home-page">
      <header className="home-header">
        <button 
          className="register-button"
          onClick={onRegisterClick}
        >
          등록
        </button>
      </header>
      
      <main className="home-main">
        <h1 className="home-title">경기 기록 관리</h1>
        
        <div className="menu-buttons">
          <button 
            className="menu-button tennis-button"
            onClick={onTennisClick}
          >
            테니스
          </button>
          
          <button 
            className="menu-button billiards-button"
            onClick={onBilliardsClick}
          >
            당구
          </button>
        </div>
      </main>
    </div>
  );
}

export default HomePage;

