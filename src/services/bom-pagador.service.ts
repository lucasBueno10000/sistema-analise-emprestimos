import { Injectable, Logger } from '@nestjs/common';
import { BomPagadorDto } from '../dto/analise-credito.dto';

/**
 * Service que simula integração com API de Bom Pagador
 *
 * EM PRODUÇÃO: Este service faria requisições HTTP para a API real
 * Exemplo de implementação real:
 *
 * async consultarHistoricoPagamento(cnpj: string): Promise<BomPagadorDto> {
 *   const response = await this.httpService.axiosRef.get(
 *     `https://api-bom-pagador.com/v1/historico/${cnpj}`,
 *     { headers: { 'X-API-Key': process.env.BOM_PAGADOR_API_KEY } }
 *   );
 *   return this.transformarDados(response.data);
 * }
 */
@Injectable()
export class BomPagadorService {
  private readonly logger = new Logger(BomPagadorService.name);

  /**
   * Simula consulta ao histórico de pagamentos
   * Em produção, faria uma chamada HTTP à API real
   */
  async consultarHistoricoPagamento(cnpj: string): Promise<BomPagadorDto> {
    this.logger.log(`Consultando histórico de pagamento para CNPJ: ${cnpj}`);

    // Simula delay de API externa
    await this.delay(400);

    // Simula dados de pagamento
    const totalDividas = this.gerarTotalDividas(cnpj);
    const totalPago = this.gerarTotalPago(cnpj, totalDividas);
    const percentualPago = (totalPago / totalDividas) * 100;

    return {
      totalDividas,
      totalPago,
      percentualPago,
      classificacao: this.classificarPagador(percentualPago),
      grafico: {
        dividas: totalDividas,
        pagos: totalPago,
      },
    };
  }

  private gerarTotalDividas(cnpj: string): number {
    // Gera valor baseado no CNPJ
    const base = parseInt(cnpj.slice(-4));
    return 50000 + base * 100;
  }

  private gerarTotalPago(cnpj: string, totalDividas: number): number {
    // Percentual de pagamento agora baseado no PRIMEIRO dígito do CNPJ
    const digitos = cnpj.replace(/\D/g, '');
    const primeiroDigito = parseInt(digitos.charAt(0));

    let percentual: number;
    if (Number.isNaN(primeiroDigito)) {
      percentual = 0.5; // fallback neutro
    } else if (primeiroDigito >= 8)
      percentual = 0.95; // 95% pago - EXCELENTE
    else if (primeiroDigito >= 5)
      percentual = 0.8; // 80% pago - BOM
    else if (primeiroDigito >= 3)
      percentual = 0.65; // 65% pago - REGULAR
    else percentual = 0.4; // 40% pago - RUIM

    return totalDividas * percentual;
  }

  private classificarPagador(
    percentual: number,
  ): 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM' {
    if (percentual >= 90) return 'EXCELENTE';
    if (percentual >= 65) return 'BOM';
    if (percentual >= 50) return 'REGULAR';
    return 'RUIM';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
