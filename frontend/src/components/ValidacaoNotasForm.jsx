import React, { useState } from 'react';
import axios from 'axios';

function ValidacaoNotasForm() {
  const [formData, setFormData] = useState({
    cnpj: '',
    valorEmprestimo: '',
    arquivo: null
  })
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [cnpjError, setCnpjError] = useState('')

  // Função para validar CNPJ (mesma lógica usada no outro formulário)
  const validarCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/[^\d]/g, '')
    if (cnpj.length !== 14) return false
    if (/^(\d)\1+$/.test(cnpj)) return false
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

  const formatarCNPJ = (valor) => {
    valor = valor.replace(/\D/g, '')
    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2')
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2')
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2')
    return valor
  }

  const formatarMoeda = (valor) => {
    valor = valor.replace(/\D/g, '')
    valor = (Number(valor) / 100).toFixed(2)
    valor = valor.replace('.', ',')
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    return valor
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const cnpjLimpo = formData.cnpj.replace(/\D/g, '')
    if (!validarCNPJ(cnpjLimpo)) {
      setCnpjError('CNPJ inválido. Verifique os dígitos.')
      return
    }
    setCnpjError('')

    setLoading(true)
    setError(null)
    setResult(null)

    const valorNumerico = Number(formData.valorEmprestimo.replace(/\./g, '').replace(',', '.'))

    const data = new FormData()
    data.append('cnpj', cnpjLimpo)
    data.append('valorEmprestimo', valorNumerico)
    data.append('arquivo', formData.arquivo)

    try {
      // URL da API - usa variável de ambiente ou localhost para desenvolvimento
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      
      // Detectar tipo de arquivo pela extensão
      const fileExtension = formData.arquivo.name.split('.').pop().toUpperCase()
      const endpoint = fileExtension === 'REM' 
        ? `${API_URL}/emprestimos/validar-notas/cnab`
        : `${API_URL}/emprestimos/validar-notas/xml`

      const response = await axios.post(endpoint, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao validar notas fiscais')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'cnpj') {
      const formatado = formatarCNPJ(value)
      setFormData({ ...formData, cnpj: formatado })
      const limpo = value.replace(/\D/g, '')
      if (limpo.length === 14) {
        setCnpjError(validarCNPJ(limpo) ? '' : 'CNPJ inválido')
      } else if (limpo.length > 0) {
        setCnpjError('')
      }
    } else if (name === 'valorEmprestimo') {
      const formatado = formatarMoeda(value)
      setFormData({ ...formData, valorEmprestimo: formatado })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setFormData({
      ...formData,
      arquivo: file
    })
    setFileName(file ? file.name : '')
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
            placeholder="34.028.316/0001-96"
            maxLength="18"
            required
            style={{ borderColor: cnpjError ? '#ef4444' : undefined, borderWidth: cnpjError ? '2px' : undefined }}
          />
          {cnpjError ? (
            <small style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>❌ {cnpjError}</small>
          ) : (
            <small style={{ color: '#ffffff', fontSize: '0.85rem' }}>Digite o CNPJ completo | Ex: 34.028.316/0001-96</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="valorEmprestimo">Valor do Empréstimo (R$)</label>
          <input
            type="text"
            id="valorEmprestimo"
            name="valorEmprestimo"
            value={formData.valorEmprestimo}
            onChange={handleChange}
            placeholder="0,00"
            required
          />
          <small style={{ color: '#ffffff', fontSize: '0.85rem' }}>
            Valor mínimo: R$ 1.000,00 | Exemplo: 250.000,00
          </small>
        </div>

        <div className="form-group">
          <label>Arquivo de Notas Fiscais</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              id="arquivo"
              name="arquivo"
              onChange={handleFileChange}
              accept=".xml,.REM"
              required
            />
            <label htmlFor="arquivo" className="file-input-label">
              <span className="file-input-text">{fileName || '📎 Selecionar arquivo XML ou CNAB (.REM)'}</span>
            </label>
          </div>
          {fileName && <div className="file-name">Arquivo selecionado: {fileName}</div>}
        </div>

        <button type="submit" className="btn btn-analise" disabled={loading}>
          {loading ? 'Validando...' : '✔️ Validar Notas Fiscais'}
        </button>
      </form>

      {loading && <div className="loading">Processando arquivo</div>}

      {error && (
        <div className="error">
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {result && (
        <div className="result">
          <h2>
            Resultado da Validação
            <span className={`status-badge ${result.aprovado ? 'approved' : 'rejected'}`}>
              {result.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}
            </span>
          </h2>

          <div className="info-grid">
            <div className="info-card">
              <h3>Total de Notas</h3>
              <div className="value">{result.totalNotasEnviadas || 0}</div>
              <div className="subtitle">Processadas</div>
            </div>

            <div className="info-card">
              <h3>Notas Válidas</h3>
              <div className="value" style={{ color: '#10b981' }}>{result.notasValidas || 0}</div>
              <div className="subtitle">Autorizadas</div>
            </div>

            <div className="info-card">
              <h3>Notas Inválidas</h3>
              <div className="value" style={{ color: '#ef4444' }}>{result.notasInvalidas || 0}</div>
              <div className="subtitle">Recusadas</div>
            </div>

            <div className="info-card">
              <h3>Valor Total</h3>
              <div className="value">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(result.valorTotalValido || 0)}
              </div>
              <div className="subtitle">Soma das notas válidas</div>
            </div>
          </div>

          {result.notas && result.notas.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>📝 Detalhes das Notas Fiscais</h3>
              <table className="notas-table">
                <thead>
                  <tr>
                    <th>Chave</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {result.notas.map((nota, idx) => (
                    <tr key={idx}>
                      <td>{nota.chave.slice(0, 20)}...</td>
                      <td>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(nota.valor)}
                      </td>
                      <td>
                        <span className={`nota-status ${nota.status === 'VALIDA' ? 'valida' : 'invalida'}`}>
                          {nota.status}
                        </span>
                      </td>
                      <td>{nota.tags.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.mensagem && (
            <div className="recommendations">
              <h3>📋 Mensagem</h3>
              <p style={{ padding: '15px', background: 'white', borderRadius: '8px', color: '#16304C', fontWeight: 600 }}>
                {result.mensagem}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ValidacaoNotasForm
