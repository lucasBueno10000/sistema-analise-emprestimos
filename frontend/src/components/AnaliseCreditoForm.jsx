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
  const [cnpjError, setCnpjError] = useState('')

  // Função para validar CNPJ
  const validarCNPJ = (cnpj) => {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '')
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) return false
    
    // Valida DVs (dígitos verificadores)
    let tamanho = cnpj.length - 2
    let numeros = cnpj.substring(0, tamanho)
    const digitos = cnpj.substring(tamanho)
    let soma = 0
    let pos = tamanho - 7
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--
      if (pos < 2) pos = 9
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    if (resultado != digitos.charAt(0)) return false
    
    tamanho = tamanho + 1
    numeros = cnpj.substring(0, tamanho)
    soma = 0
    pos = tamanho - 7
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--
      if (pos < 2) pos = 9
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
    if (resultado != digitos.charAt(1)) return false
    
    return true
  }

  // Função para formatar CNPJ
  const formatarCNPJ = (valor) => {
    valor = valor.replace(/\D/g, '') // Remove tudo que não é dígito
    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto entre o segundo e o terceiro dígitos
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto entre o quinto e o sexto dígitos
    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca barra entre o oitavo e o nono dígitos
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2') // Coloca hífen depois do bloco de quatro dígitos
    return valor
  }

  // Função para formatar valor em moeda (Real)
  const formatarMoeda = (valor) => {
    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '')
    
    // Converte para número e depois para formato de moeda
    valor = (Number(valor) / 100).toFixed(2)
    
    // Formata com separadores
    valor = valor.replace('.', ',')
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    
    return valor
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Valida CNPJ antes de enviar
    const cnpjLimpo = formData.cnpj.replace(/\D/g, '')
    if (!validarCNPJ(cnpjLimpo)) {
      setCnpjError('CNPJ inválido. Por favor, verifique o número digitado.')
      return
    }
    
    // Limpa resultados anteriores
    setResult(null)
    setError(null)
    setCnpjError('')
    setLoading(true)

    try {
      // Converte o valor formatado de volta para número
      const valorNumerico = Number(formData.valorSolicitado.replace(/\./g, '').replace(',', '.'))
      
      // URL da API - usa variável de ambiente ou localhost para desenvolvimento
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      
      const payload = {
        cnpj: cnpjLimpo, // Envia apenas os números
        nomeEmpresa: formData.nomeEmpresa,
        valorSolicitado: valorNumerico
      }
      const response = await axios.post(`${API_URL}/emprestimos/analise-credito`, payload)
      
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
    const { name, value } = e.target
    
    if (name === 'cnpj') {
      // Formata o CNPJ enquanto digita
      const cnpjFormatado = formatarCNPJ(value)
      
      setFormData({
        ...formData,
        [name]: cnpjFormatado
      })
      
      // Valida o CNPJ apenas quando tiver 14 dígitos
      const cnpjLimpo = value.replace(/\D/g, '')
      if (cnpjLimpo.length === 14) {
        if (validarCNPJ(cnpjLimpo)) {
          setCnpjError('')
        } else {
          setCnpjError('CNPJ inválido')
        }
      } else if (cnpjLimpo.length > 0) {
        setCnpjError('')
      }
    } else if (name === 'valorSolicitado') {
      // Formata o valor em moeda enquanto digita
      const valorFormatado = formatarMoeda(value)
      
      setFormData({
        ...formData,
        [name]: valorFormatado
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
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
            placeholder="51.234.567/0001-63"
            maxLength="18"
            required
            style={{ 
              borderColor: cnpjError ? '#ef4444' : undefined,
              borderWidth: cnpjError ? '2px' : undefined
            }}
          />
          {cnpjError ? (
            <small style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '500' }}>
              ❌ {cnpjError}
            </small>
          ) : (
            <small style={{ color: '#ffffff', fontSize: '0.85rem' }}>
              Digite o CNPJ com ou sem pontuação | Exemplo: 51.234.567/0001-63
            </small>
          )}
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
            type="text"
            id="valorSolicitado"
            name="valorSolicitado"
            value={formData.valorSolicitado}
            onChange={handleChange}
            placeholder="0,00"
            required
          />
          <small style={{ color: '#ffffff', fontSize: '0.85rem' }}>
            Valor mínimo: R$ 1.000,00 | Exemplo: 50.000,00
          </small>
        </div>

        <button type="submit" className="btn btn-analise" disabled={loading}>
          {loading ? 'Analisando...' : 'Analisar Crédito 🔍 '}
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
            }).format(Number(formData.valorSolicitado.replace(/\./g, '').replace(',', '.')))}</p>
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
                <div className="value" style={{ color: '#16304C' }}>
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
