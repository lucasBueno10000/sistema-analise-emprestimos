import { useState } from 'react'
import axios from 'axios'

function AnaliseCreditoForm() {
  const [formData, setFormData] = useState({
    cnpj: '',
    nomeEmpresa: '',
    valorSolicitado: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Limpa resultados anteriores
    setResult(null)
    setError(null)
    setLoading(true)

    try {
      const payload = {
        cnpj: formData.cnpj,
        nomeEmpresa: formData.nomeEmpresa,
        valorSolicitado: Number(formData.valorSolicitado)
      }
      const response = await axios.post('http://localhost:3000/emprestimos/analise-credito', payload)
      
      // Força atualização do estado
      setTimeout(() => {
        setResult(response.data)
        setLoading(false)
      }, 100)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao realizar análise')
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="cnpj">CNPJ da Empresa</label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            value={formData.cnpj}
            onChange={handleChange}
            placeholder="12345678000190"
            required
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            Sem pontuação (apenas números)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="nomeEmpresa">Nome da Empresa</label>
          <input
            type="text"
            id="nomeEmpresa"
            name="nomeEmpresa"
            value={formData.nomeEmpresa}
            onChange={handleChange}
            placeholder="Empresa Exemplo LTDA"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="valorSolicitado">Valor Solicitado (R$)</label>
          <input
            type="number"
            id="valorSolicitado"
            name="valorSolicitado"
            value={formData.valorSolicitado}
            onChange={handleChange}
            placeholder="50000"
            min="1000"
            step="0.01"
            required
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            Valor mínimo: R$ 1.000,00
          </small>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Analisando...' : '🔍 Analisar Crédito'}
        </button>
      </form>

      {loading && <div className="loading">Consultando bureaus de crédito</div>}

      {error && (
        <div className="error">
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result" key={`${result.scoreBiro}-${result.faturamentoAnual}-${Date.now()}`}>
          <div className="result-header">
            <h2>📊 Resultado da Análise de Crédito</h2>
            <div className={`status-badge-large ${result.aprovado ? 'approved' : 'rejected'}`}>
              {result.aprovado ? '✅ CRÉDITO APROVADO' : '❌ CRÉDITO NEGADO'}
            </div>
          </div>

          <div className="empresa-info">
            <h3>🏢 Dados da Empresa</h3>
            <p><strong>Empresa:</strong> {formData.nomeEmpresa}</p>
            <p><strong>CNPJ:</strong> {formData.cnpj}</p>
            <p><strong>Valor Solicitado:</strong> {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(formData.valorSolicitado)}</p>
          </div>

          <div className="scores-section">
            <h3>📈 Indicadores Financeiros</h3>
            <div className="info-grid">
              <div className="info-card">
                <div className="card-icon">🎯</div>
                <h3>Score de Crédito</h3>
                <div className="value" style={{ color: getScoreColor(result.dadosBiro?.score || 0) }}>
                  {result.dadosBiro?.score ? result.dadosBiro.score.toFixed(2) : '0.00'}
                </div>
                <div className="subtitle">Score Biro</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((result.dadosBiro?.score || 0) / 1000) * 100}%`, backgroundColor: getScoreColor(result.dadosBiro?.score || 0) }}
                  ></div>
                </div>
              </div>

              <div className="info-card">
                <div className="card-icon">💳</div>
                <h3>Histórico de Pagamento</h3>
                <div className="value" style={{ color: getPaymentColor(result.dadosBomPagador?.percentualPago || 0) }}>
                  {result.dadosBomPagador?.percentualPago || 0}%
                </div>
                <div className="subtitle">Pagamentos em Dia</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${result.dadosBomPagador?.percentualPago || 0}%`, backgroundColor: getPaymentColor(result.dadosBomPagador?.percentualPago || 0) }}
                  ></div>
                </div>
              </div>

              <div className="info-card">
                <div className="card-icon">💰</div>
                <h3>Faturamento Anual</h3>
                <div className="value" style={{ color: '#667eea' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(result.dadosFaturamento?.faturamentoMensal || 0)}
                </div>
                <div className="subtitle">Últimos 12 meses</div>
              </div>

              <div className="info-card highlight">
                <div className="card-icon">🏦</div>
                <h3>Limite Aprovado</h3>
                <div className="value" style={{ color: result.aprovado ? '#10b981' : '#ef4444' }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(result.valorMaximoAprovado || 0)}
                </div>
                <div className="subtitle">Valor máximo disponível</div>
              </div>
            </div>
          </div>

          {result.recomendacoes && result.recomendacoes.length > 0 && (
            <div className="recommendations">
              <h3>📋 Recomendações e Observações</h3>
              <ul>
                {result.recomendacoes.map((rec, idx) => (
                  <li key={idx}>
                    <span className="rec-icon">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.aprovado && (
            <div className="next-steps">
              <h3>🚀 Próximos Passos</h3>
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h4>Validação de Documentos</h4>
                  <p>Acesse a aba "Validação de Notas" para enviar as notas fiscais</p>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h4>Análise Documental</h4>
                  <p>Aguarde a verificação das notas fiscais para confirmar o empréstimo</p>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h4>Aprovação Final</h4>
                  <p>Receba o valor aprovado em até 48 horas úteis</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const getScoreColor = (score) => {
  if (score >= 700) return '#10b981'
  if (score >= 500) return '#f59e0b'
  return '#ef4444'
}

const getPaymentColor = (percentage) => {
  if (percentage >= 70) return '#10b981'
  if (percentage >= 50) return '#f59e0b'
  return '#ef4444'
}

export default AnaliseCreditoForm
