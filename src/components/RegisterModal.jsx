import { useState, useEffect, useRef } from 'react';
import './RegisterModal.css';

function RegisterModal({ isOpen, onClose, onRegister }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // 모달이 열릴 때 입력 필드에 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // 모달이 닫힐 때 상태 초기화
      setName('');
      setError('');
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        if (!isLoading) {
          setName('');
          setError('');
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!name.trim()) {
      setError('이름을 입력하세요');
      inputRef.current?.focus();
      return;
    }

    if (name.trim().length > 20) {
      setError('이름은 최대 20자까지 입력 가능합니다');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    
    try {
      await onRegister(name.trim());
      // 성공 시 모달 닫기 (약간의 지연으로 성공 피드백 제공)
      setTimeout(() => {
        setName('');
        onClose();
      }, 300);
    } catch (err) {
      // 에러 처리 (중복 이름 등)
      if (err.message.includes('중복') || err.message.includes('이미')) {
        setError('이미 등록된 이름입니다');
      } else {
        setError(err.message || '선수등록 중 오류가 발생했습니다');
      }
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return; // 로딩 중에는 닫기 방지
    setName('');
    setError('');
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="register-modal-overlay" onClick={handleBackdropClick}>
      <div className="register-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="register-modal-header">
          <h2>선수 등록</h2>
          <button 
            className="register-modal-close"
            onClick={handleCancel}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form className="register-modal-form" onSubmit={handleSubmit}>
          <div className="register-modal-input-group">
            <label htmlFor="user-name">이름</label>
            <input
              id="user-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(''); // 입력 시 에러 메시지 제거
              }}
              placeholder="이름을 입력하세요 (최대 20자)"
              maxLength={20}
              disabled={isLoading}
              className={error ? 'error' : ''}
            />
            <div className="register-modal-char-count">
              {name.length}/20
            </div>
          </div>

          {error && (
            <div className="register-modal-error" role="alert">
              {error}
            </div>
          )}

          <div className="register-modal-actions">
            <button
              type="button"
              className="register-modal-button cancel-button"
              onClick={handleCancel}
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="register-modal-button submit-button"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? '선수등록 중...' : '선수등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;

