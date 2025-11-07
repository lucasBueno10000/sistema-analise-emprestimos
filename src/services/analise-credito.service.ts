/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { BiroService } from './biro.service';
import { BomPagadorService } from './bom-pagador.service';
import { FaturamentoService } from './faturamento.service';
import {
  AnaliseCreditoRequestDto,
  AnaliseCreditoResponseDto,
  FaixaEmprestimo,
} from '../dto/analise-credito.dto';

/**
 * Service principal para análise de crédito
 * Implementa toda a lógica de negócio da Etapa 1 - Pré-análise
 */
@Injectable()
export class AnaliseCreditoService {
  private readonly logger = new Logger(AnaliseCreditoService.name);

  constructor(
    private readonly biroService: BiroService,
    private readonly bomPagadorService: BomPagadorService,
    private readonly faturamentoService: FaturamentoService,
  ) {}

  /**
   * Realiza análise completa de crédito do cliente
   * Etapa 1: Pré-análise
   */
  async analisarCredito(
    request: AnaliseCreditoRequestDto,
  ): Promise<AnaliseCreditoResponseDto> {
    this.logger.log(`Iniciando análise de crédito para ${request.nomeEmpresa}`);

    try {
      // Consultar dados dos três sistemas em paralelo
      const [dadosBiro, dadosFaturamento, dadosBomPagador] = await Promise.all([
        this.biroService.consultarScore(request.cnpj),
        this.faturamentoService.consultarFaturamento(request.cnpj),
        this.bomPagadorService.consultarHistoricoPagamento(request.cnpj),
      ]);

      // Verificar critério de BOM_PAGADOR (regra eliminatória)
      if (dadosBomPagador.percentualPago < 50) {
        return {
          aprovado: false,
          faixaAprovada: FaixaEmprestimo.NENHUMA,
          motivoRecusa:
            'Percentual de dívidas pagas inferior a 50%. Cliente não elegível para empréstimos.',
          dadosBiro,
          dadosFaturamento,
          dadosBomPagador,
          recomendacoes: [
            'Regularizar dívidas pendentes',
            'Melhorar histórico de pagamentos',
            'Solicitar novamente após 6 meses com situação regularizada',
          ],
        };
      }

      // Determinar faixa de empréstimo baseado em score e faturamento
      let faixaBase = this.determinarFaixaEmprestimo(
        dadosBiro.score,
        dadosFaturamento.faturamentoMensal,
      );

      // Aplicar bônus por bom histórico de pagamento
      if (dadosBomPagador.percentualPago >= 90) {
        faixaBase = this.promoverFaixa(faixaBase);
        this.logger.log(
          'Cliente elegível para faixa superior devido a excelente histórico de pagamento',
        );
      }

      // Verificar se cliente atende faixa mínima
      if (faixaBase === FaixaEmprestimo.NENHUMA) {
        return {
          aprovado: false,
          faixaAprovada: FaixaEmprestimo.NENHUMA,
          motivoRecusa: this.gerarMotivoRecusa(
            dadosBiro.score,
            dadosFaturamento.faturamentoMensal,
          ),
          dadosBiro,
          dadosFaturamento,
          dadosBomPagador,
          recomendacoes: this.gerarRecomendacoes(
            dadosBiro.score,
            dadosFaturamento.faturamentoMensal,
          ),
        };
      }

      // Cliente aprovado
      const valorMaximo = this.calcularValorMaximo(
        faixaBase,
        dadosFaturamento.faturamentoMensal,
      );

      // Verificar se o valor solicitado está dentro do limite aprovado
  // Ajuste: aprovação agora exige >=65% de histórico pago (antes 70%)
  const valorAprovado = dadosBomPagador.percentualPago >= 65 && request.valorSolicitado <= valorMaximo;

      return {
        aprovado: valorAprovado,
        faixaAprovada: faixaBase,
        dadosBiro,
        dadosFaturamento,
        dadosBomPagador,
        valorMaximoAprovado: valorMaximo,
        recomendacoes: this.gerarRecomendacoesAprovacao(
          faixaBase,
          dadosBomPagador.percentualPago,
          valorAprovado,
          request.valorSolicitado,
          valorMaximo,
        ),
        motivoRecusa: !valorAprovado
          ? dadosBomPagador.percentualPago < 65
            ? 'Histórico de pagamentos insuficiente (mínimo 65% requerido)'
            : `Valor solicitado (R$ ${request.valorSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) excede o limite aprovado (R$ ${valorMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
          : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao analisar crédito: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Determina a faixa de empréstimo baseado em score e faturamento
   * Faixas:
   * - P: score > 400 E faturamento > R$ 10.000
   * - M: score > 600 E faturamento > R$ 100.000
   * - G: score > 800 E faturamento > R$ 1.000.000
   */
  private determinarFaixaEmprestimo(
    score: number,
    faturamento: number,
  ): FaixaEmprestimo {
    if (score > 800 && faturamento > 1000000) {
      return FaixaEmprestimo.G;
    }
    if (score > 600 && faturamento > 100000) {
      return FaixaEmprestimo.M;
    }
    if (score > 400 && faturamento > 10000) {
      return FaixaEmprestimo.P;
    }
    return FaixaEmprestimo.NENHUMA;
  }

  /**
   * Promove cliente para faixa superior quando tem >90% de pagamentos em dia
   */
  private promoverFaixa(faixaAtual: FaixaEmprestimo): FaixaEmprestimo {
    switch (faixaAtual) {
      case FaixaEmprestimo.P:
        return FaixaEmprestimo.M;
      case FaixaEmprestimo.M:
        return FaixaEmprestimo.G;
      default:
        return faixaAtual;
    }
  }

  /**
   * Calcula valor máximo de empréstimo baseado na faixa e faturamento
   */
  private calcularValorMaximo(
    faixa: FaixaEmprestimo,
    faturamento: number,
  ): number {
    const multiplicadores = {
      [FaixaEmprestimo.P]: 2.0, // 2x o faturamento mensal
      [FaixaEmprestimo.M]: 3.0, // 3x o faturamento mensal
      [FaixaEmprestimo.G]: 5.0, // 5x o faturamento mensal
      [FaixaEmprestimo.NENHUMA]: 0,
    };

    return faturamento * multiplicadores[faixa];
  }

  private gerarMotivoRecusa(score: number, faturamento: number): string {
    const motivos: string[] = [];

    if (score <= 400) {
      motivos.push(`Score de crédito insuficiente (${score.toFixed(0)})`);
    }
    if (faturamento <= 10000) {
      motivos.push(
        `Faturamento mensal insuficiente (R$ ${faturamento.toLocaleString('pt-BR')})`,
      );
    }

    return `Cliente não atende critérios mínimos: ${motivos.join('; ')}`;
  }

  private gerarRecomendacoes(score: number, faturamento: number): string[] {
    const recomendacoes: string[] = [];

    if (score <= 400) {
      recomendacoes.push('Melhorar score de crédito pagando dívidas em dia');
      recomendacoes.push('Evitar novas consultas de crédito por 90 dias');
    }

    if (faturamento <= 10000) {
      recomendacoes.push(
        'Aumentar faturamento mensal antes de solicitar empréstimo',
      );
      recomendacoes.push(
        'Considerar empréstimos de menor valor em outras modalidades',
      );
    }

    recomendacoes.push('Solicitar nova análise em 6 meses');

    return recomendacoes;
  }

  private gerarRecomendacoesAprovacao(
    faixa: FaixaEmprestimo,
    percentualPago: number,
    valorAprovado: boolean,
    valorSolicitado: number,
    valorMaximo: number,
  ): string[] {
    // Se não foi aprovado por exceder o valor
  // Ajuste: recomendações de excesso de valor agora consideram >=65%
  if (!valorAprovado && percentualPago >= 65) {
      return [
        `Valor solicitado (R$ ${valorSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) excede o limite aprovado`,
        `Limite máximo aprovado: R$ ${valorMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `Considere solicitar um valor até R$ ${valorMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        'Aumente seu faturamento mensal para conseguir limites maiores',
      ];
    }

    const historicoMensagens = [
      {
        minimo: 90,
        mensagem: 'Excelente histórico de pagamentos - Cliente Premium',
      },
      { minimo: 65, mensagem: 'Bom histórico de pagamentos' },
    ];

    const faixaMensagens = {
      [FaixaEmprestimo.G]: [
        'Elegível para taxas preferenciais',
        'Pode solicitar até 5x o faturamento mensal',
      ],
      [FaixaEmprestimo.M]: ['Pode solicitar até 3x o faturamento mensal'],
      [FaixaEmprestimo.P]: ['Pode solicitar até 2x o faturamento mensal'],
      [FaixaEmprestimo.NENHUMA]: [],
    };

    const historicoMsg = historicoMensagens.find(
      (h) => percentualPago >= h.minimo,
    )?.mensagem;

    return [
      `Cliente aprovado para faixa ${faixa}`,
      ...(historicoMsg ? [historicoMsg] : []),
      ...faixaMensagens[faixa],
    ];
  }
}
