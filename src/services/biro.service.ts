import { Injectable, Logger } from '@nestjs/common';
import { BiroScoreDto } from '../dto/analise-credito.dto';

/**
 * Service que simula integração com API de Birô de Crédito
 *
 * EM PRODUÇÃO: Este service faria requisições HTTP para a API real do birô
 * Exemplo de implementação real:
 *
 * constructor(private readonly httpService: HttpService) {}
 *
 * async consultarScore(cnpj: string): Promise<BiroScoreDto> {
 *   const response = await this.httpService.axiosRef.post(
 *     'https://api-biro-credito.com/v1/consulta',
 *     { cnpj },
 *     { headers: { 'Authorization': `Bearer ${process.env.BIRO_API_KEY}` } }
 *   );
 *   return response.data;
 * }
 */
@Injectable()
export class BiroService {
  private readonly logger = new Logger(BiroService.name);

  /**
   * Simula consulta ao Birô de Crédito
   * Em produção, faria uma chamada HTTP à API real
   */
  async consultarScore(cnpj: string): Promise<BiroScoreDto> {
    this.logger.log(`Consultando score de crédito para CNPJ: ${cnpj}`);

    // Simula delay de API externa
    await this.delay(500);

    // Simula diferentes scores baseado no CNPJ (para testes)
    const score = this.gerarScoreSimulado(cnpj);

    return {
      score,
      historico: this.gerarHistorico(score),
      dataConsulta: new Date(),
    };
  }

  private gerarScoreSimulado(cnpj: string): number {
    // Gera score baseado no último dígito do CNPJ para testes consistentes
    const ultimoDigito = parseInt(cnpj.slice(-1));

    if (ultimoDigito >= 8) return 850 + Math.random() * 150; // Score alto (800-1000)
    if (ultimoDigito >= 5) return 650 + Math.random() * 150; // Score médio (600-800)
    if (ultimoDigito >= 3) return 450 + Math.random() * 150; // Score baixo (400-600)
    return 200 + Math.random() * 200; // Score muito baixo (200-400)
  }

  private gerarHistorico(score: number): string {
    if (score >= 800) return 'EXCELENTE - Histórico impecável de pagamentos';
    if (score >= 600) return 'BOM - Histórico positivo com pequenas variações';
    if (score >= 400) return 'REGULAR - Histórico com alguns atrasos';
    return 'RUIM - Histórico com inadimplências';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
