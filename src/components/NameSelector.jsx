import { useState, useEffect } from 'react';
import { userService } from '../lib/supabase';
import RegisterModal from './RegisterModal';
import './NameSelector.css';

function NameSelector({
  isOpen,
  onClose,
  onSelect,
  title = '이름 선택',
  allowEmptySelection = false,
}) {
  const [userNames, setUserNames] = useState([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserNames();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadUserNames();
    }
  }, [isOpen]);

  const loadUserNames = async () => {
    try {
      setIsLoading(true);
      const names = await userService.getUserNames();
      setUserNames(names);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSelect = (name) => {
    onSelect(name);
    onClose();
  };

  const handleClearSelection = () => {
    onSelect('');
    onClose();
  };

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true);
  };

  const handleRegisterClose = () => {
    setIsRegisterModalOpen(false);
  };

  const handleRegister = async (name) => {
    try {
      const newUser = await userService.registerUser(name);
      console.log('사용자 등록 성공:', newUser);
      // 이름 목록 새로고침
      await loadUserNames();
      // 등록된 이름을 자동으로 선택 (NameSelector는 열린 상태 유지)
      handleNameSelect(name);
      return newUser;
    } catch (error) {
      console.error('사용자 등록 실패:', error);
      throw error;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="name-selector-overlay" onClick={handleBackdropClick}>
        <div className="name-selector" onClick={(e) => e.stopPropagation()}>
          <div className="name-selector-header">
            <h3>{title}</h3>
          </div>
          <div className="name-list">
            {allowEmptySelection && (
              <button
                type="button"
                className="name-item clear-selection"
                onClick={handleClearSelection}
              >
                선택 안함
              </button>
            )}
            {isLoading ? (
              <p className="loading-names">로딩 중...</p>
            ) : userNames.length === 0 ? (
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
          <div className="name-selector-actions">
            <button
              type="button"
              className="register-in-selector-button"
              onClick={handleRegisterClick}
            >
              선수등록
            </button>
            <button
              type="button"
              className="close-selector name-selector-close"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={handleRegisterClose}
        onRegister={handleRegister}
      />
    </>
  );
}

export default NameSelector;

