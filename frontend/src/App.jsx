import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AnaliseCreditoForm from './components/AnaliseCreditoForm';
import ValidacaoNotasForm from './components/ValidacaoNotasForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        <header className="header">
          <h1>Análise de Empréstimos 💰</h1>
          <p>Análise de crédito e validação de documentos empresariais</p>
          <nav style={{ margin: '20px 0' }}>
            <Link style={{ color: '#ffffff' }} to="/" className="tab">Análise de Crédito</Link>
            <Link style={{ color: '#ffffff' }} to="/validacao" className="tab">Validação de Notas</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<AnaliseCreditoForm />} />
          <Route path="/validacao" element={<ValidacaoNotasForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
