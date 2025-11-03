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
          <h1>💰 Sistema de Análise de Empréstimos</h1>
          <p>Análise de crédito e validação de documentos empresariais</p>
          <nav style={{ margin: '20px 0' }}>
            <Link to="/" className="tab">Análise de Crédito</Link>
            <Link to="/validacao" className="tab">Validação de Notas</Link>
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
