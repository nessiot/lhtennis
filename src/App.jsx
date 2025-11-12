import { useState } from 'react'
import HomePage from './components/HomePage'
import RegisterModal from './components/RegisterModal'
import TennisMenu from './components/TennisMenu'
import TennisRecordPage from './components/TennisRecordPage'
import TennisStatsPage from './components/TennisStatsPage'
import BilliardsMenu from './components/BilliardsMenu'
import BilliardsRecordPage from './components/BilliardsRecordPage'
import BilliardsStatsPage from './components/BilliardsStatsPage'
import { userService } from './lib/supabase'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  const handleTennisClick = () => {
    setCurrentPage('tennis-menu')
  }

  const handleBilliardsClick = () => {
    setCurrentPage('billiards-menu')
  }

  const handleRegisterClick = () => {
    setIsRegisterModalOpen(true)
  }

  const handleRegisterClose = () => {
    setIsRegisterModalOpen(false)
  }

  const handleRegister = async (name) => {
    try {
      const newUser = await userService.registerUser(name)
      console.log('사용자 등록 성공:', newUser)
      return newUser
    } catch (error) {
      console.error('사용자 등록 실패:', error)
      throw error
    }
  }

  const handleBack = () => {
    if (currentPage === 'tennis-menu' || currentPage === 'billiards-menu') {
      setCurrentPage('home')
    } else if (currentPage === 'tennis-record' || currentPage === 'tennis-stats') {
      setCurrentPage('tennis-menu')
    } else if (currentPage === 'billiards-record' || currentPage === 'billiards-stats') {
      setCurrentPage('billiards-menu')
    }
  }

  return (
    <div className="app">
      {currentPage === 'home' && (
        <HomePage
          onTennisClick={handleTennisClick}
          onBilliardsClick={handleBilliardsClick}
          onRegisterClick={handleRegisterClick}
        />
      )}

      {currentPage === 'tennis-menu' && (
        <TennisMenu
          onRecordClick={() => setCurrentPage('tennis-record')}
          onStatsClick={() => setCurrentPage('tennis-stats')}
          onBack={handleBack}
        />
      )}

      {currentPage === 'tennis-record' && (
        <TennisRecordPage onBack={handleBack} />
      )}

      {currentPage === 'tennis-stats' && (
        <TennisStatsPage onBack={handleBack} />
      )}

      {currentPage === 'billiards-menu' && (
        <BilliardsMenu
          onRecordClick={() => setCurrentPage('billiards-record')}
          onStatsClick={() => setCurrentPage('billiards-stats')}
          onBack={handleBack}
        />
      )}

      {currentPage === 'billiards-record' && (
        <BilliardsRecordPage onBack={handleBack} />
      )}

      {currentPage === 'billiards-stats' && (
        <BilliardsStatsPage onBack={handleBack} />
      )}
      
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={handleRegisterClose}
        onRegister={handleRegister}
      />
    </div>
  )
}

export default App
