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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const data = new FormData()
    data.append('cnpj', formData.cnpj)
    data.append('valorEmprestimo', Number(formData.valorEmprestimo))
    data.append('arquivo', formData.arquivo)

    try {
      // Detectar tipo de arquivo pela extensão
      const fileExtension = formData.arquivo.name.split('.').pop().toUpperCase()
      const endpoint = fileExtension === 'REM' 
        ? 'http://localhost:3000/emprestimos/validar-notas/cnab'
        : 'http://localhost:3000/emprestimos/validar-notas/xml'

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
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
            placeholder="12345678000190"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="valorEmprestimo">Valor do Empréstimo (R$)</label>
          <input
            type="number"
            id="valorEmprestimo"
            name="valorEmprestimo"
            value={formData.valorEmprestimo}
            onChange={handleChange}
            placeholder="100000"
            min="1000"
            step="0.01"
            required
          />
          <small style={{ color: '#666', fontSize: '0.85rem' }}>
            Valor mínimo: R$ 1.000,00
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
              {fileName || '📎 Selecionar arquivo XML ou CNAB (.REM)'}
            </label>
          </div>
          {fileName && <div className="file-name">Arquivo selecionado: {fileName}</div>}
        </div>

        <button type="submit" className="btn" disabled={loading}>
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
              <p style={{ padding: '15px', background: 'white', borderRadius: '8px' }}>
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
