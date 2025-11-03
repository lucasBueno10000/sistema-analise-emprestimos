import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-container">
      <div className="welcome-section">
        <h2>🎯 Bem-vindo ao Sistema de Análise de Empréstimos</h2>
        <p className="subtitle">
          Solução completa para análise de crédito e validação de documentos fiscais
        </p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Análise de Crédito</h3>
          <p>
            Realize análises completas de crédito com integração a bureaus, 
            histórico de pagamentos e faturamento da empresa.
          </p>
          <ul className="feature-list">
            <li>✓ Consulta ao Biro de crédito</li>
            <li>✓ Histórico de pagamentos</li>
            <li>✓ Análise de faturamento</li>
            <li>✓ Score de crédito automático</li>
          </ul>
          <Link to="/analise-credito" className="feature-btn">
            Iniciar Análise →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📄</div>
          <h3>Validação de Notas Fiscais</h3>
          <p>
            Valide notas fiscais em formato XML ou CNAB com verificação 
            automática de autenticidade e valores.
          </p>
          <ul className="feature-list">
            <li>✓ Upload de arquivos XML/CNAB</li>
            <li>✓ Validação automática</li>
            <li>✓ Verificação de autenticidade</li>
            <li>✓ Relatório detalhado</li>
          </ul>
          <Link to="/validacao-notas" className="feature-btn">
            Validar Documentos →
          </Link>
        </div>
      </div>

      <div className="workflow-section">
        <h3>🔄 Como Funciona</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="workflow-number">1</div>
            <h4>Análise de Crédito</h4>
            <p>Informe o CNPJ e a faixa de empréstimo desejada</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-number">2</div>
            <h4>Aprovação Pré-Análise</h4>
            <p>Receba o resultado com score e limite aprovado</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-number">3</div>
            <h4>Validação de Documentos</h4>
            <p>Envie as notas fiscais para validação final</p>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-number">4</div>
            <h4>Aprovação Final</h4>
            <p>Empréstimo liberado em até 48h úteis</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="info-box">
          <h4>📋 Documentos Necessários</h4>
          <ul>
            <li>CNPJ válido da empresa</li>
            <li>Notas fiscais em XML ou CNAB</li>
            <li>Valor dentro da faixa de empréstimo</li>
          </ul>
        </div>

        <div className="info-box">
          <h4>⚡ Vantagens</h4>
          <ul>
            <li>Análise automatizada em tempo real</li>
            <li>Múltiplos bureaus de crédito</li>
            <li>Validação documental completa</li>
            <li>Resposta em minutos</li>
          </ul>
        </div>

        <div className="info-box">
          <h4>🎯 Faixas de Empréstimo</h4>
          <ul>
            <li>Até R$ 50.000</li>
            <li>De R$ 50.000 a R$ 100.000</li>
            <li>De R$ 100.000 a R$ 500.000</li>
            <li>Acima de R$ 500.000</li>
          </ul>
        </div>
      </div>

      <div className="cta-section">
        <h3>🚀 Pronto para começar?</h3>
        <p>Escolha uma das opções acima para iniciar seu processo de análise de empréstimo</p>
      </div>
    </div>
  )
}

export default Home
