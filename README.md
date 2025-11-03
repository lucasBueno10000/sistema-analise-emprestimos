# Sistema de Análise de Empréstimos

Sistema completo para análise de crédito e validação de documentos para operações de empréstimo empresarial.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Requisitos do Sistema](#requisitos-do-sistema)
- [Metodologia Aplicada](#metodologia-aplicada)
- [Arquitetura da Solução](#arquitetura-da-solução)
- [Instalação e Execução](#instalação-e-execução)
- [Endpoints da API](#endpoints-da-api)
- [Exemplos de Uso](#exemplos-de-uso)
- [Deploy em Cloud](#deploy-em-cloud)

## 🎯 Visão Geral

Este sistema resolve o problema de validação manual de empréstimos empresariais através de:

### Etapa 1 - Pré-análise
Consulta automática a três sistemas:
- **Birô de Crédito**: Score de crédito via API REST
- **Faturamento Mensal**: Dados extraídos sem API (simulação de web scraping)
- **Bom Pagador**: Histórico de pagamentos via API REST

### Etapa 2 - Validação de Documentos
Processamento de notas fiscais em dois formatos:
- **XML**: Extração da tag `<chave>`
- **CNAB (.REM)**: Extração da chave nos caracteres 20-64

## 📊 Requisitos do Sistema

### Funcionais

#### RF001 - Análise de Crédito
**Descrição**: Realizar análise completa de crédito consultando múltiplas fontes
- **Entrada**: CNPJ, Nome da Empresa, Valor Solicitado
- **Saída**: Aprovação/Recusa, Faixa (P/M/G), Recomendações
- **Regras**:
  - Score > 400 e Faturamento > R$ 10.000 → Faixa P
  - Score > 600 e Faturamento > R$ 100.000 → Faixa M
  - Score > 800 e Faturamento > R$ 1.000.000 → Faixa G
  - Percentual pago < 50% → Recusa automática
  - Percentual pago ≥ 70% → Aprovação
  - Percentual pago ≥ 90% → Elegível para faixa superior

#### RF002 - Consulta Birô de Crédito
**Descrição**: Consultar score de crédito via API externa
- **Integração**: API REST com autenticação Bearer Token
- **Dados retornados**: Score, Histórico, Data da consulta

#### RF003 - Consulta Faturamento (SEM API)
**Descrição**: Extrair dados de faturamento de sistema legado sem API
- **Métodos possíveis**:
  1. Web Scraping (Puppeteer/Playwright)
  2. Processamento de arquivos CSV/Excel
  3. Acesso direto ao banco de dados
  4. RPA (Robotic Process Automation)
- **Implementação atual**: Simulação com dados gerados
- **Dados retornados**: Faturamento mensal, Gráfico de evolução

#### RF004 - Consulta Bom Pagador
**Descrição**: Verificar histórico de pagamentos via API
- **Integração**: API REST com API Key
- **Dados retornados**: Total de dívidas, Total pago, Percentual, Classificação

#### RF005 - Validação de Notas Fiscais (XML)
**Descrição**: Processar arquivo XML e validar notas
- **Entrada**: Arquivo XML, CNPJ, Valor do Empréstimo
- **Processamento**:
  1. Parse do XML
  2. Extração das tags `<chave>`
  3. Validação via API de cada chave
  4. Identificação de tags problemáticas: "RECUSADO", "NÃO RECONHECIDO"
- **Validação**: Total de notas válidas deve estar entre 85% e 115% do valor do empréstimo

#### RF006 - Validação de Notas Fiscais (CNAB)
**Descrição**: Processar arquivo CNAB e validar notas
- **Entrada**: Arquivo .REM, CNPJ, Valor do Empréstimo
- **Processamento**:
  1. Leitura linha por linha
  2. Extração da chave (posições 20-64)
  3. Validação via API
- **Validação**: Mesma regra de tolerância do XML

### Não-Funcionais

#### RNF001 - Performance
- Tempo de resposta para análise de crédito: < 3 segundos
- Processamento de 100 notas fiscais: < 10 segundos
- Suporte a requisições concorrentes

#### RNF002 - Segurança
- Validação de entrada em todos os endpoints
- Sanitização de dados
- Logs de auditoria
- HTTPS obrigatório em produção

#### RNF003 - Disponibilidade
- SLA de 99.5% uptime
- Retry automático em falhas de APIs externas
- Circuit breaker para serviços instáveis

#### RNF004 - Escalabilidade
- Arquitetura stateless
- Cache de consultas recentes
- Processamento assíncrono de arquivos grandes
- Pronto para containerização (Docker/Kubernetes)

## 🏗️ Metodologia Aplicada

### Abordagem de Desenvolvimento: Ágil (Scrum Adaptado)

#### Sprint Planning
1. **Sprint 1**: Levantamento de requisitos e arquitetura
2. **Sprint 2**: Implementação da Etapa 1 (Pré-análise)
3. **Sprint 3**: Implementação da Etapa 2 (Validação de arquivos)
4. **Sprint 4**: Testes, documentação e deploy

#### Práticas Adotadas
- **TDD (Test-Driven Development)**: Testes unitários para lógica crítica
- **Clean Code**: Código autodocumentado com TypeScript
- **SOLID**: Princípios aplicados na estrutura de services
- **API First**: Documentação Swagger completa
- **Git Flow**: Branches feature, develop, main

### Decisões Arquiteturais

#### Por que NestJS?
1. **Estrutura modular**: Facilita escalabilidade
2. **TypeScript nativo**: Segurança de tipos
3. **Injeção de dependências**: Testabilidade
4. **Decorators**: Código limpo e expressivo
5. **Ecossistema maduro**: Integração fácil com bibliotecas

#### Por que Simulação ao invés de APIs Reais?
1. **Demonstração prática**: Mostra a lógica sem depender de sistemas externos
2. **Documentação clara**: Código comenta como seria a implementação real
3. **Testabilidade**: Dados consistentes para testes
4. **Custo**: Sem necessidade de contratar serviços pagos para o protótipo

## 🏛️ Arquitetura da Solução

### Estrutura de Pastas

```
analise-emprestimo/
├── src/
│   ├── controllers/
│   │   └── emprestimo.controller.ts      # Endpoints REST
│   ├── services/
│   │   ├── analise-credito.service.ts    # Lógica de análise
│   │   ├── biro.service.ts               # Integração Birô (simulada)
│   │   ├── bom-pagador.service.ts        # Integração Bom Pagador (simulada)
│   │   ├── faturamento.service.ts        # Web scraping (simulado)
│   │   └── processamento-arquivo.service.ts # XML/CNAB
│   ├── dto/
│   │   ├── analise-credito.dto.ts        # DTOs da análise
│   │   └── validacao-notas.dto.ts        # DTOs de validação
│   ├── app.module.ts                     # Módulo principal
│   └── main.ts                           # Bootstrap da aplicação
├── exemplos/
│   ├── notas-exemplo.xml                 # Arquivo XML de teste
│   └── notas-exemplo.REM                 # Arquivo CNAB de teste
├── test/                                 # Testes E2E
└── README.md                             # Esta documentação
```

### Padrões de Design Utilizados

#### 1. Dependency Injection
```typescript
constructor(
  private readonly biroService: BiroService,
  private readonly bomPagadorService: BomPagadorService,
  private readonly faturamentoService: FaturamentoService,
) {}
```

#### 2. Service Layer Pattern
Separação de responsabilidades:
- Controllers: Validação de entrada e resposta HTTP
- Services: Lógica de negócio
- DTOs: Contratos de dados

#### 3. Strategy Pattern
Processamento de diferentes formatos de arquivo (XML vs CNAB)

#### 4. Facade Pattern
`AnaliseCreditoService` orquestra múltiplos services

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- NPM 9+

### Passos

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd analise-emprestimo
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute em modo desenvolvimento**
```bash
npm run start:dev
```

4. **Acesse a aplicação**
- API: http://localhost:3000
- Documentação Swagger: http://localhost:3000/api

5. **Execute os testes**
```bash
npm run test
npm run test:e2e
```

6. **Build para produção**
```bash
npm run build
npm run start:prod
```

## 📡 Endpoints da API

### 1. Análise de Crédito (Etapa 1)

**POST** `/emprestimos/analise-credito`

**Request Body:**
```json
{
  "cnpj": "12345678000190",
  "nomeEmpresa": "Empresa XYZ Ltda",
  "valorSolicitado": 500000
}
```

**Response 200:**
```json
{
  "aprovado": true,
  "faixaAprovada": "M",
  "dadosBiro": {
    "score": 750,
    "historico": "BOM - Histórico positivo com pequenas variações",
    "dataConsulta": "2025-11-02T10:30:00.000Z"
  },
  "dadosFaturamento": {
    "faturamentoMensal": 250000,
    "mes": "Outubro",
    "ano": 2025
  },
  "dadosBomPagador": {
    "totalDividas": 150000,
    "totalPago": 120000,
    "percentualPago": 80,
    "classificacao": "BOM"
  },
  "valorMaximoAprovado": 750000,
  "recomendacoes": [
    "Cliente aprovado para faixa M",
    "Bom histórico de pagamentos"
  ]
}
```

### 2. Validação de Notas (XML)

**POST** `/emprestimos/validar-notas/xml`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `arquivo`: arquivo XML
- `cnpj`: string
- `valorEmprestimo`: number

**Response 200:**
```json
{
  "totalNotasEnviadas": 6,
  "notasValidas": 5,
  "notasInvalidas": 1,
  "valorTotalValido": 480000,
  "valorEmprestimo": 500000,
  "percentualCobertura": 96,
  "dentroDaTolerancia": true,
  "aprovado": true,
  "mensagem": "Aprovado! Valor das notas válidas está dentro da tolerância"
}
```

### 3. Validação de Notas (CNAB)

**POST** `/emprestimos/validar-notas/cnab`

Mesma estrutura do XML, mas com arquivo .REM

## 💡 Exemplos de Uso

### Teste Rápido via Swagger

1. Acesse http://localhost:3000/api
2. Expanda o endpoint `POST /emprestimos/analise-credito`
3. Clique em "Try it out"
4. Use o exemplo de JSON fornecido
5. Clique em "Execute"

### Usando cURL

```bash
# Análise de Crédito
curl -X POST http://localhost:3000/emprestimos/analise-credito \
  -H "Content-Type: application/json" \
  -d '{
    "cnpj": "12345678000190",
    "nomeEmpresa": "Empresa Teste",
    "valorSolicitado": 500000
  }'

# Validação XML
curl -X POST http://localhost:3000/emprestimos/validar-notas/xml \
  -F "arquivo=@exemplos/notas-exemplo.xml" \
  -F "cnpj=12345678000190" \
  -F "valorEmprestimo=500000"
```

## ☁️ Deploy em Cloud (AWS)

### Opção 1: AWS Elastic Beanstalk

```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar
eb init -p node.js-18 analise-emprestimo --region us-east-1

# Criar ambiente
eb create analise-emprestimo-prod

# Deploy
eb deploy
```

### Opção 2: Docker + AWS ECS

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Opção 3: Serverless (AWS Lambda)

```bash
npm install -g serverless
serverless create --template aws-nodejs-typescript
serverless deploy
```

## 🔒 Segurança

### Implementado
- Validação de entrada (class-validator)
- CORS habilitado
- Validação de tipos TypeScript
- Logs de auditoria

### Recomendado para Produção
- Rate limiting (@nestjs/throttler)
- Helmet (headers de segurança)
- HTTPS obrigatório
- Variáveis de ambiente para credenciais
- Autenticação JWT

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📝 Como Funciona na Vida Real

### Sistema COM API (Birô de Crédito, Bom Pagador)

**Implementação Real:**
```typescript
import { HttpService } from '@nestjs/axios';

async consultarScore(cnpj: string): Promise<BiroScoreDto> {
  const response = await this.httpService.axiosRef.post(
    'https://api-biro-credito.com/v1/consulta',
    { cnpj },
    { 
      headers: { 
        'Authorization': `Bearer ${process.env.BIRO_API_KEY}` 
      } 
    }
  );
  return response.data;
}
```

### Sistema SEM API (Faturamento)

**Opção 1: Web Scraping com Puppeteer**
```typescript
import * as puppeteer from 'puppeteer';

async consultarFaturamento(cnpj: string): Promise<FaturamentoDto> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Login no sistema
  await page.goto('https://sistema-faturamento.com/login');
  await page.type('#username', process.env.FATURAMENTO_USER);
  await page.type('#password', process.env.FATURAMENTO_PASS);
  await page.click('#login-button');
  
  // Navegar e extrair dados
  await page.goto(`https://sistema-faturamento.com/consulta/${cnpj}`);
  const dados = await page.evaluate(() => ({
    faturamento: parseFloat(document.querySelector('.faturamento').textContent)
  }));
  
  await browser.close();
  return dados;
}
```

**Opção 2: Processamento de Arquivos CSV/Excel**
```typescript
import * as xlsx from 'xlsx';

async processarArquivoFaturamento(path: string): Promise<FaturamentoDto[]> {
  const workbook = xlsx.readFile(path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  return data.map(row => ({
    faturamentoMensal: row['Faturamento'],
    mes: row['Mes'],
    ano: row['Ano']
  }));
}
```

## 🎥 Vídeo de Demonstração

[Link para o vídeo será adicionado aqui]

No vídeo, demonstro:
1. ✅ Instalação e execução local
2. ✅ Teste de análise de crédito via Swagger
3. ✅ Upload e validação de XML
4. ✅ Upload e validação de CNAB
5. ✅ Explicação da arquitetura
6. ✅ Demonstração de como seria a integração real

## 📞 Contato

**Desenvolvido como projeto técnico**

Para dúvidas sobre a implementação, entre em contato através do recrutador.

---

**🚀 Sistema desenvolvido com NestJS, TypeScript e boas práticas de engenharia de software**
