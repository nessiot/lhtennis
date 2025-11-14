import { useState, useEffect } from 'react'
import { billiardsService } from '../lib/supabase'
import NameSelector from './NameSelector'
import './BilliardsRecordPage.css'

const emptyRecord = {
  player_name: '',
  base_dama: '',
  minus_dama: '',
  plus_dama: '',
  percentage: 0,
}

function BilliardsRecordPage({ onBack }) {
  const [records, setRecords] = useState([
    { ...emptyRecord },
    { ...emptyRecord },
    { ...emptyRecord },
    { ...emptyRecord },
    { ...emptyRecord },
    { ...emptyRecord },
  ])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editRowIndex, setEditRowIndex] = useState(null)
  const [editForm, setEditForm] = useState({ ...emptyRecord })
  const [showNameSelector, setShowNameSelector] = useState(false)

  useEffect(() => {
    loadTodayRecords()
  }, [])

  const loadTodayRecords = async () => {
    try {
      const today = new Date().toISOString()
      const todayRecords = await billiardsService.getRecordsByDate(today)
      if (todayRecords.length > 0) {
        const formatted = todayRecords.map((r) => ({
          player_name: r.player_name,
          base_dama: r.base_dama.toString(),
          minus_dama: r.minus_dama.toString(),
          plus_dama: r.plus_dama.toString(),
          percentage: r.percentage,
        }))
        const baseRecords = [...records]
        formatted.forEach((r, i) => {
          if (i < baseRecords.length) {
            baseRecords[i] = { ...baseRecords[i], ...r }
          } else {
            baseRecords.push(r)
          }
        })
        setRecords(baseRecords)
      }
    } catch (loadError) {
      console.error('오늘 기록 로드 실패:', loadError)
    }
  }

  const handleAddRow = () => {
    const updated = [...records, { ...emptyRecord }]
    setRecords(updated)
    openEditModal(updated.length - 1, updated[updated.length - 1])
  }

  const handleRemoveRow = (index) => {
    if (records.length > 1) {
      setRecords(records.filter((_, i) => i !== index))
    }
  }

  const openEditModal = (index, baseRecord = records[index]) => {
    setEditRowIndex(index)
    setEditForm({
      player_name: baseRecord?.player_name || '',
      base_dama: baseRecord?.base_dama?.toString() || '',
      minus_dama: baseRecord?.minus_dama?.toString() || '',
      plus_dama: baseRecord?.plus_dama?.toString() || '',
      percentage: baseRecord?.percentage || 0,
    })
    setIsEditModalOpen(true)
    setError('')
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditRowIndex(null)
    setEditForm({ ...emptyRecord })
    setShowNameSelector(false)
  }

  const calculatePercentage = (base, minus, plus) => {
    const baseValue = parseFloat(base) || 0
    if (baseValue <= 0) return 0
    const minusValue = parseFloat(minus) || 0
    const plusValue = parseFloat(plus) || 0
    const denominator = baseValue / 10 + plusValue
    if (denominator <= 0) return 0
    return ((minusValue / denominator) * 100).toFixed(2)
  }

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (['base_dama', 'minus_dama', 'plus_dama'].includes(field)) {
        updated.percentage = calculatePercentage(
          field === 'base_dama' ? value : prev.base_dama,
          field === 'minus_dama' ? value : prev.minus_dama,
          field === 'plus_dama' ? value : prev.plus_dama
        )
      }
      return updated
    })
  }

  const handleModalSave = () => {
    if (!editForm.player_name) {
      setError('이름을 선택하세요')
      return
    }
    if (editRowIndex === null) return
    const updated = [...records]
    updated[editRowIndex] = {
      player_name: editForm.player_name,
      base_dama: editForm.base_dama,
      minus_dama: editForm.minus_dama,
      plus_dama: editForm.plus_dama,
      percentage: editForm.percentage,
    }
    setRecords(updated)
    closeEditModal()
  }

  const handleNameSelect = async (name) => {
    setShowNameSelector(false)
    if (!name) {
      setEditForm({
        player_name: '',
        base_dama: '',
        minus_dama: '',
        plus_dama: '',
        percentage: 0,
      })
      return
    }
    setEditForm((prev) => ({ ...prev, player_name: name }))
    try {
      const playerRecords = await billiardsService.getRecordsByName(name, 1)
      if (playerRecords.length > 0) {
        const latest = playerRecords[0]
        setEditForm((prev) => ({
          ...prev,
          player_name: name,
          base_dama: latest.base_dama.toString(),
          percentage: calculatePercentage(
            latest.base_dama,
            prev.minus_dama,
            prev.plus_dama
          ),
        }))
      }
    } catch (loadError) {
      console.error('다마수 로드 실패:', loadError)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const hasName = records.some((r) => r.player_name)
    if (!hasName) {
      setError('최소 한 명의 이름을 선택하세요')
      return
    }

    const validRecords = records
      .filter((r) => r.player_name)
      .map((r) => ({
        player_name: r.player_name,
        base_dama: parseFloat(r.base_dama) || 0,
        minus_dama: parseFloat(r.minus_dama) || 0,
        plus_dama: parseFloat(r.plus_dama) || 0,
        percentage: parseFloat(r.percentage) || 0,
      }))

    setIsLoading(true)

    try {
      await billiardsService.saveRecords(validRecords)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (saveError) {
      setError(saveError.message || '저장 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const recordsWithRank = (() => {
    const sorted = records
      .map((record, index) => ({
        index,
        percentage: parseFloat(record.percentage) || 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)

    const rankMap = {}
    sorted.forEach((entry, idx) => {
      rankMap[entry.index] = idx + 1
    })

    return records.map((record, index) => ({
      ...record,
      displayRank: rankMap[index] ? rankMap[index].toString() : '-',
    }))
  })()

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
            <button type="button" className="add-row-button" onClick={handleAddRow}>
              + 추가
            </button>
          </div>

          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>순위</th>
                  <th>이름</th>
                  <th>다마수</th>
                  <th>뺀공</th>
                  <th>히로</th>
                  <th>퍼센트</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recordsWithRank.map((record, index) => (
                  <tr
                    key={index}
                    className="records-row"
                    onClick={() => openEditModal(index)}
                  >
                    <td>{index + 1}</td>
                    <td>{record.displayRank || '-'}</td>
                    <td>{record.player_name || '이름 선택'}</td>
                    <td>{record.base_dama || '-'}</td>
                    <td>{record.minus_dama || '-'}</td>
                    <td>{record.plus_dama || '-'}</td>
                    <td
                      className={`percentage ${
                        parseFloat(record.percentage) >= 100 ? 'positive' : 'negative'
                      }`}
                    >
                      {record.percentage ? Number(record.percentage).toFixed(2) : '0.00'}%
                    </td>
                    <td>
                      {records.length > 1 && (
                        <button
                          type="button"
                          className="row-remove-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveRow(index)
                          }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {success && <div className="success-message">저장되었습니다!</div>}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? '업데이트 중...' : '업데이트'}
          </button>
        </form>
      </main>

      {isEditModalOpen && (
        <div className="record-edit-modal">
          <div className="record-edit-modal-content">
            <div className="record-edit-header">
              <h3>{`#${(editRowIndex ?? 0) + 1} 행 편집`}</h3>
              <button className="record-edit-close" onClick={closeEditModal} aria-label="닫기">
                ×
              </button>
            </div>
            <div className="record-edit-body">
              <div className="modal-field">
                <label>이름</label>
                <button
                  type="button"
                  className="modal-name-button"
                  onClick={() => setShowNameSelector(true)}
                >
                  {editForm.player_name || '이름 선택'}
                </button>
              </div>

              <div className="modal-input-grid">
                <div className="modal-input">
                  <label>다마수</label>
                  <input
                    type="number"
                    value={editForm.base_dama}
                    onChange={(e) => handleEditFieldChange('base_dama', e.target.value)}
                    min="0"
                  />
                </div>
                <div className="modal-input">
                  <label>뺀공</label>
                  <input
                    type="number"
                    value={editForm.minus_dama}
                    onChange={(e) => handleEditFieldChange('minus_dama', e.target.value)}
                    min="0"
                  />
                </div>
                <div className="modal-input">
                  <label>히로</label>
                  <input
                    type="number"
                    value={editForm.plus_dama}
                    onChange={(e) => handleEditFieldChange('plus_dama', e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="record-edit-actions">
              <button type="button" className="record-edit-cancel" onClick={closeEditModal}>
                취소
              </button>
              <button type="button" className="record-edit-save" onClick={handleModalSave}>
                적용
              </button>
            </div>
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
  )
}

export default BilliardsRecordPage
