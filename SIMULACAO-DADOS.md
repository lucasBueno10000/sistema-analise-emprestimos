# 🎲 Como Funciona a Simulação de Dados

## 📊 Geração de Dados por CNPJ

O sistema usa o **último dígito do CNPJ** para gerar dados consistentes e previsíveis para testes.

---

## 🏦 Sistema BOM PAGADOR (Histórico de Pagamentos)

### Lógica baseada no ÚLTIMO DÍGITO do CNPJ:

| Último Dígito | Percentual Pago | Classificação | Status na Análise |
|---------------|----------------|---------------|-------------------|
| **8 ou 9**    | 95%           | EXCELENTE     | ✅ APROVADO + Promoção de faixa |
| **5, 6 ou 7** | 80%           | BOM           | ✅ APROVADO |
| **3 ou 4**    | 65%           | REGULAR       | ❌ RECUSADO (< 70%) |
| **0, 1 ou 2** | 40%           | RUIM          | ❌ RECUSADO (< 50%) |

### Critérios de Aprovação:
- ✅ **Percentual ≥ 70%**: Cliente aprovado
- ⭐ **Percentual ≥ 90%**: Cliente promovido para faixa superior (P→M, M→G)
- ❌ **Percentual < 50%**: Recusa automática (regra eliminatória)
- ⚠️ **Percentual 50-69%**: Recusado por histórico insuficiente

---

## 💳 Sistema BIRÔ DE CRÉDITO (Score)

### Lógica baseada no ÚLTIMO DÍGITO do CNPJ:

| Último Dígito | Score Gerado | Classificação | Elegível para Faixa |
|---------------|--------------|---------------|---------------------|
| **8 ou 9**    | 850-1000     | EXCELENTE     | Até G (se faturamento permitir) |
| **5, 6 ou 7** | 650-800      | BOM           | Até M (se faturamento permitir) |
| **3 ou 4**    | 450-600      | REGULAR       | Apenas P |
| **0, 1 ou 2** | 200-400      | RUIM          | Nenhuma |

---

## 💰 Sistema FATURAMENTO MENSAL (Sem API)

### Lógica baseada nos ÚLTIMOS 3 DÍGITOS do CNPJ:

| Últimos 3 Dígitos | Faturamento      | Elegível para Faixa |
|-------------------|------------------|---------------------|
| **≥ 800**         | R$ 1.5M - 2M    | Até G |
| **500-799**       | R$ 200K - 500K  | Até M |
| **200-499**       | R$ 30K - 100K   | Até P |
| **< 200**         | < R$ 15K        | Nenhuma |

---

## 📋 CNPJs para Teste (Exemplos Prontos)

### ✅ Cliente EXCELENTE - Aprovado Faixa G

```json
{
  "cnpj": "12345678000998",
  "nomeEmpresa": "Empresa Premium S.A.",
  "valorSolicitado": 2000000
}
```
**Resultado esperado:**
- Score: ~900 (excelente)
- Faturamento: ~R$ 1.8M
- Bom Pagador: 95% (EXCELENTE)
- **✅ APROVADO - FAIXA G**

---

### ✅ Cliente BOM - Aprovado Faixa M

```json
{
  "cnpj": "12345678000597",
  "nomeEmpresa": "Empresa Média Ltda",
  "valorSolicitado": 500000
}
```
**Resultado esperado:**
- Score: ~700 (bom)
- Faturamento: ~R$ 250K
- Bom Pagador: 80% (BOM)
- **✅ APROVADO - FAIXA M**

---

### ✅ Cliente REGULAR - Aprovado Faixa P (com promoção)

```json
{
  "cnpj": "12345678000389",
  "nomeEmpresa": "Empresa Pequena ME",
  "valorSolicitado": 100000
}
```
**Resultado esperado:**
- Score: ~550 (regular)
- Faturamento: ~R$ 50K
- Bom Pagador: 95% (EXCELENTE) - **promovido para faixa M**
- **✅ APROVADO - FAIXA M** (promoção por excelente pagador)

---

### ❌ Cliente RECUSADO - Histórico Insuficiente

```json
{
  "cnpj": "12345678000190",
  "nomeEmpresa": "Empresa Problemas Ltda",
  "valorSolicitado": 500000
}
```
**Resultado esperado:**
- Score: ~300 (ruim)
- Faturamento: ~R$ 25K
- Bom Pagador: 40% (RUIM)
- **❌ RECUSADO - Percentual de pagamentos < 50%**

---

### ❌ Cliente RECUSADO - Score Baixo

```json
{
  "cnpj": "12345678000291",
  "nomeEmpresa": "Empresa Score Baixo Ltda",
  "valorSolicitado": 100000
}
```
**Resultado esperado:**
- Score: ~350 (ruim)
- Faturamento: ~R$ 35K
- **❌ RECUSADO - Score e faturamento insuficientes**

---

## 🎯 Tabela de Faixas de Empréstimo

| Faixa | Score Mínimo | Faturamento Mínimo | Valor Máximo | Multiplicador |
|-------|--------------|-------------------|--------------|---------------|
| **G** | > 800       | > R$ 1.000.000    | 5x faturamento | Grande Empresa |
| **M** | > 600       | > R$ 100.000      | 3x faturamento | Média Empresa |
| **P** | > 400       | > R$ 10.000       | 2x faturamento | Pequena Empresa |

---

## 🔄 Promoção de Faixa (Bônus)

Clientes com **≥ 90% de pagamentos em dia** são promovidos:
- Faixa P → **Faixa M**
- Faixa M → **Faixa G**
- Faixa G → **Permanece G** (não há faixa superior)

---

## 💡 Dica para Testes Rápidos

### CNPJs Garantidos de Aprovação:

**Para Faixa G:**
- `12345678000998` (último dígito 8)
- `12345678000999` (último dígito 9)

**Para Faixa M:**
- `12345678000597` (últimos dígitos 97)
- `12345678000598` (últimos dígitos 98)

**Para Faixa P (com promoção para M):**
- `12345678000388` (últimos dígitos 88)
- `12345678000389` (últimos dígitos 89)

---

## 🧪 Como Criar Seus Próprios CNPJs de Teste

1. **Escolha o resultado desejado** (tabela acima)
2. **Ajuste o último dígito** do CNPJ conforme a tabela
3. **Ajuste os 3 últimos dígitos** para controlar o faturamento
4. **Teste!**

### Exemplo:
Quero um cliente **APROVADO para faixa M**:
- Último dígito: `8` (para 95% de pagamento)
- Últimos 3 dígitos: `598` (para faturamento ~250K)
- CNPJ final: `12345678000598` ✅

---

## 📝 Observações Importantes

1. **Dados são determinísticos**: Mesmo CNPJ sempre gera os mesmos resultados
2. **Simulação realista**: Percentuais e valores são consistentes
3. **Em produção**: Esses valores viriam de APIs reais (Serasa, Boa Vista, etc)
4. **Código documentado**: Cada service explica como seria a implementação real

---

**🎲 Use esta tabela para criar cenários de teste personalizados!**
