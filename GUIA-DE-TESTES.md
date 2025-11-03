# 🧪 Guia Completo de Testes - Sistema de Análise de Empréstimos

## 📋 Pré-requisitos

1. ✅ Servidor rodando: `npm run start:dev`
2. ✅ Acesse: http://localhost:3000/api (Swagger UI)

---

## 🎯 Teste 1: Análise de Crédito (Etapa 1)

### Opção A: Usando Swagger UI (Mais Fácil)

1. Abra o navegador em: **http://localhost:3000/api**
2. Encontre o endpoint: `POST /emprestimos/analise-credito`
3. Clique em **"Try it out"**
4. Cole o JSON abaixo:

```json
{
  "cnpj": "12345678000199",
  "nomeEmpresa": "Empresa Teste Ltda",
  "valorSolicitado": 500000
}
```

5. Clique em **"Execute"**
6. Veja a resposta com todos os dados!

### Opção B: Usando PowerShell

```powershell
# Teste de cliente APROVADO para Faixa M
$body = @{
    cnpj = "12345678000199"
    nomeEmpresa = "Empresa Teste Ltda"
    valorSolicitado = 500000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/emprestimos/analise-credito" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json -Depth 10
```

### Cenários de Teste

#### 🟢 Cenário 1: Cliente Excelente (Faixa G)
```json
{
  "cnpj": "12345678000198",
  "nomeEmpresa": "Empresa Premium S.A.",
  "valorSolicitado": 2000000
}
```
**Esperado**: Aprovado, Faixa G, score >800, faturamento >1M

#### 🟡 Cenário 2: Cliente Médio (Faixa M)
```json
{
  "cnpj": "12345678000195",
  "nomeEmpresa": "Empresa Média Ltda",
  "valorSolicitado": 300000
}
```
**Esperado**: Aprovado, Faixa M, score >600, faturamento >100K

#### 🟠 Cenário 3: Cliente Básico (Faixa P)
```json
{
  "cnpj": "12345678000193",
  "nomeEmpresa": "Empresa Pequena ME",
  "valorSolicitado": 50000
}
```
**Esperado**: Aprovado, Faixa P, score >400, faturamento >10K

#### 🔴 Cenário 4: Cliente Recusado (Score Baixo)
```json
{
  "cnpj": "12345678000191",
  "nomeEmpresa": "Empresa Problemas Ltda",
  "valorSolicitado": 100000
}
```
**Esperado**: Recusado, score <400 ou problemas no histórico

---

## 📄 Teste 2: Validação de Notas Fiscais XML

### Opção A: Usando Swagger UI

1. Vá para o endpoint: `POST /emprestimos/validar-notas/xml`
2. Clique em **"Try it out"**
3. **Upload do arquivo**: Clique em "Choose File" e selecione `exemplos/notas-exemplo.xml`
4. Preencha os campos:
   - **cnpj**: `12345678000190`
   - **valorEmprestimo**: `500000`
5. Clique em **"Execute"**

### Opção B: Usando PowerShell

```powershell
# Validação de XML
$filePath = "exemplos/notas-exemplo.xml"
$uri = "http://localhost:3000/emprestimos/validar-notas/xml"

$form = @{
    arquivo = Get-Item -Path $filePath
    cnpj = "12345678000190"
    valorEmprestimo = "500000"
}

Invoke-RestMethod -Uri $uri -Method POST -Form $form | ConvertTo-Json -Depth 10
```

### Opção C: Usando cURL

```bash
curl -X POST http://localhost:3000/emprestimos/validar-notas/xml \
  -F "arquivo=@exemplos/notas-exemplo.xml" \
  -F "cnpj=12345678000190" \
  -F "valorEmprestimo=500000"
```

**Resultado Esperado:**
- Total de notas: 6
- Notas válidas: ~5-6 (depende da simulação)
- Valor total dentro da tolerância de 15%
- Status: APROVADO

---

## 📋 Teste 3: Validação de Notas Fiscais CNAB

### Opção A: Usando Swagger UI

1. Vá para: `POST /emprestimos/validar-notas/cnab`
2. Clique em **"Try it out"**
3. Upload: `exemplos/notas-exemplo.REM`
4. Preencha:
   - **cnpj**: `12345678000190`
   - **valorEmprestimo**: `500000`
5. Execute

### Opção B: Usando PowerShell

```powershell
# Validação de CNAB
$filePath = "exemplos/notas-exemplo.REM"
$uri = "http://localhost:3000/emprestimos/validar-notas/cnab"

$form = @{
    arquivo = Get-Item -Path $filePath
    cnpj = "12345678000190"
    valorEmprestimo = "500000"
}

Invoke-RestMethod -Uri $uri -Method POST -Form $form | ConvertTo-Json -Depth 10
```

---

## 🔍 Entendendo as Respostas

### Resposta da Análise de Crédito

```json
{
  "aprovado": true,
  "faixaAprovada": "M",
  "dadosBiro": {
    "score": 750,
    "historico": "BOM - Histórico positivo",
    "dataConsulta": "2025-11-02T..."
  },
  "dadosFaturamento": {
    "faturamentoMensal": 250000,
    "mes": "Novembro",
    "ano": 2025,
    "grafico": {
      "labels": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
      "valores": [200000, 220000, 280000, 240000, 260000, 250000]
    }
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
    "Bom histórico de pagamentos",
    "Pode solicitar até 3x o faturamento mensal"
  ]
}
```

### Resposta da Validação de Notas

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
  "mensagem": "Aprovado! Valor das notas válidas (R$ 480.000,00) está dentro da tolerância de 15%",
  "notas": [
    {
      "chave": "35210812345678000190550010000123451234567890",
      "valor": 50000,
      "status": "VALIDA",
      "tags": ["AUTORIZADA", "PROCESSADA"]
    },
    {
      "chave": "35210812345678000190550010000123461234567891",
      "valor": 75000,
      "status": "INVALIDA",
      "tags": ["RECUSADO"],
      "motivoInvalidacao": "Nota contém tag problemática: RECUSADO"
    }
  ]
}
```

---

## 🎨 Teste Visual no Navegador

### 1. Abra o Swagger UI
```
http://localhost:3000/api
```

### 2. Teste Interativo
- Todos os endpoints documentados
- Botão "Try it out" em cada um
- Exemplos de JSON já preenchidos
- Resposta formatada e colorida
- Códigos de erro explicados

---

## 🧪 Teste de Integração Completo

Execute esse teste completo em PowerShell:

```powershell
Write-Host "=== TESTE COMPLETO DO SISTEMA ===" -ForegroundColor Cyan

# 1. Análise de Crédito
Write-Host "`n1️⃣  ETAPA 1: Análise de Crédito..." -ForegroundColor Yellow
$analise = @{
    cnpj = "12345678000198"
    nomeEmpresa = "Empresa Teste Premium"
    valorSolicitado = 500000
} | ConvertTo-Json

$resultado = Invoke-RestMethod -Uri "http://localhost:3000/emprestimos/analise-credito" `
    -Method POST -ContentType "application/json" -Body $analise

Write-Host "✅ Aprovado: $($resultado.aprovado)" -ForegroundColor Green
Write-Host "✅ Faixa: $($resultado.faixaAprovada)" -ForegroundColor Green
Write-Host "✅ Score: $($resultado.dadosBiro.score)" -ForegroundColor Green
Write-Host "✅ Faturamento: R$ $($resultado.dadosFaturamento.faturamentoMensal)" -ForegroundColor Green

# 2. Validação de Notas XML
Write-Host "`n2️⃣  ETAPA 2: Validação de Notas XML..." -ForegroundColor Yellow
$validacao = Invoke-RestMethod -Uri "http://localhost:3000/emprestimos/validar-notas/xml" `
    -Method POST -Form @{
        arquivo = Get-Item "exemplos/notas-exemplo.xml"
        cnpj = "12345678000190"
        valorEmprestimo = "500000"
    }

Write-Host "✅ Notas Válidas: $($validacao.notasValidas)/$($validacao.totalNotasEnviadas)" -ForegroundColor Green
Write-Host "✅ Valor Total: R$ $($validacao.valorTotalValido)" -ForegroundColor Green
Write-Host "✅ Dentro da Tolerância: $($validacao.dentroDaTolerancia)" -ForegroundColor Green
Write-Host "✅ Resultado: $($validacao.mensagem)" -ForegroundColor Green

Write-Host "`n=== TODOS OS TESTES CONCLUÍDOS! ===" -ForegroundColor Cyan
```

---

## 📊 Monitoramento em Tempo Real

Enquanto testa, observe o terminal onde o servidor está rodando. Você verá logs como:

```
[Nest] 12345  - 02/11/2025, 17:30:00     LOG [AnaliseCreditoService] Iniciando análise de crédito para Empresa Teste Ltda
[Nest] 12345  - 02/11/2025, 17:30:00     LOG [BiroService] Consultando score de crédito para CNPJ: 12345678000190
[Nest] 12345  - 02/11/2025, 17:30:00     LOG [FaturamentoService] Consultando faturamento para CNPJ: 12345678000190
[Nest] 12345  - 02/11/2025, 17:30:00     LOG [FaturamentoService] ⚠️  ATENÇÃO: Sistema sem API - Em produção usaria Web Scraping
```

---

## 🐛 Troubleshooting

### Servidor não inicia
```powershell
# Verificar se a porta 3000 está livre
netstat -ano | findstr :3000

# Matar processo se necessário
taskkill /PID <PID> /F
```

### Erro ao fazer upload
- Verifique se os arquivos estão na pasta `exemplos/`
- Use caminho relativo ou absoluto
- Tamanho máximo padrão: 10MB

### Erro de CORS
- CORS já está habilitado no `main.ts`
- Se testar de um frontend, está liberado

---

## 📸 Próximos Passos

1. ✅ Teste todos os cenários
2. ✅ Capture screenshots dos resultados
3. ✅ Grave vídeo mostrando:
   - Swagger UI funcionando
   - Teste de análise de crédito
   - Upload de XML
   - Upload de CNAB
   - Explicação da arquitetura
4. ✅ Faça commit no GitHub
5. ✅ Envie link do repositório + vídeo para o recrutador

---
