import { useMemo, useState, useEffect, useRef } from 'react'
import './App.css'
import Header from './Header'
import Main from '.'

function App() {
  return (
    <div className="app-container">
      <Header />
      <Main />
    </div>
  )
}

export default App
