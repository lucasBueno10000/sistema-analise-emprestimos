import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import {
  ValidacaoNotasRequestDto,
  ValidacaoNotasResponseDto,
  NotaFiscalDto,
} from '../dto/validacao-notas.dto';

/**
 * Service para processamento de arquivos de notas fiscais
 * Etapa 2: Durante o Empréstimo
 *
 * Processa dois tipos de arquivo:
 * 1. XML: arquivo com tag <chave> contendo a chave da NF
 * 2. CNAB: arquivo .REM onde a chave está entre caracteres 20-64
 */
@Injectable()
export class ProcessamentoArquivoService {
  private readonly logger = new Logger(ProcessamentoArquivoService.name);
  private readonly TOLERANCIA_PERCENTUAL = 0.15; // 15% de tolerância

  /**
   * Processa arquivo XML de notas fiscais
   */
  async processarXML(
    conteudoXml: string,
    dadosValidacao: ValidacaoNotasRequestDto,
  ): Promise<ValidacaoNotasResponseDto> {
    this.logger.log('Processando arquivo XML de notas fiscais');

    try {
      // Parse do XML
      const parsed = (await parseStringPromise(conteudoXml)) as Record<
        string,
        any
      >;

      // Extrair notas com chave e valor
      const notasExtraidas = this.extrairNotasXML(parsed);

      // Validar cada nota
      const notas = await this.validarNotas(notasExtraidas);

      // Retornar resultado da validação
      return this.montarResposta(notas, dadosValidacao);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao processar XML: ${error.message}`);
      throw new BadRequestException('Arquivo XML inválido ou mal formatado');
    }
  }

  /**
   * Processa arquivo CNAB (.REM)
   */
  async processarCNAB(
    conteudoCnab: string,
    dadosValidacao: ValidacaoNotasRequestDto,
  ): Promise<ValidacaoNotasResponseDto> {
    this.logger.log('Processando arquivo CNAB de notas fiscais');

    try {
      // Dividir em linhas
      const linhas = conteudoCnab
        .split('\n')
        .filter((linha) => linha.trim().length > 0);

      // Extrair chaves (caracteres 20 a 64 de cada linha)
      const chaves = linhas
        .map((linha) => {
          if (linha.length >= 64) {
            return linha.substring(20, 64).trim();
          }
          return null;
        })
        .filter((chave) => chave !== null);

      this.logger.log(`Extraídas ${chaves.length} chaves do arquivo CNAB`);

      // Para CNAB, não temos valor no arquivo, então geramos baseado na chave
      const notasExtraidas = chaves.map((chave) => ({
        chave,
        valor: this.gerarValorBaseadoEmChave(chave),
      }));

      // Validar cada nota
      const notas = await this.validarNotas(notasExtraidas);

      // Retornar resultado da validação
      return this.montarResposta(notas, dadosValidacao);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Erro ao processar CNAB: ${error.message}`);
      throw new BadRequestException('Arquivo CNAB inválido ou mal formatado');
    }
  }

  /**
   * Gera valor para nota fiscal baseado na chave (usado apenas para CNAB)
   */
  private gerarValorBaseadoEmChave(chave: string): number {
    const valorBase = parseInt(chave.slice(-4), 16) || 1000;
    return valorBase * 10 + Math.random() * 5000;
  }

  /**
   * Extrai chaves de notas fiscais de um objeto XML parseado
   */
  private extrairNotasXML(xmlParsed: any): Array<{chave: string, valor: number}> {
    const notas: Array<{chave: string, valor: number}> = [];

    // Buscar recursivamente por tags <nota>, <chave> e <valor>
    const buscarNotas = (obj: any) => {
      if (!obj) return;

      if (typeof obj === 'object') {
        // Verificar se é um objeto "nota" completo
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (obj.chave && obj.valor) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const chaveValor = Array.isArray(obj.chave) ? obj.chave[0] : obj.chave;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const valorValor = Array.isArray(obj.valor) ? obj.valor[0] : obj.valor;
          
          let chave: string = '';
          let valor: number = 0;

          // Extrair chave
          if (typeof chaveValor === 'string') {
            chave = chaveValor;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          } else if (typeof chaveValor === 'object' && chaveValor._) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            chave = chaveValor._;
          }

          // Extrair valor
          if (typeof valorValor === 'string') {
            valor = parseFloat(valorValor);
          } else if (typeof valorValor === 'number') {
            valor = valorValor;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          } else if (typeof valorValor === 'object' && valorValor._) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            valor = parseFloat(valorValor._);
          }

          if (chave && !isNaN(valor)) {
            notas.push({ chave, valor });
          }
        }

        // Continuar busca recursiva
        Object.values(obj).forEach((value) => buscarNotas(value));
      }
    };

    buscarNotas(xmlParsed);
    this.logger.log(`Extraídas ${notas.length} notas do arquivo XML`);

    return notas;
  }

  private extrairChavesXML(xmlParsed: any): string[] {
    const chaves: string[] = [];

    // Buscar recursivamente por tags <chave>
    const buscarChaves = (obj: any) => {
      if (!obj) return;

      if (typeof obj === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (obj.chave) {
          // Se tem tag chave, adicionar o valor
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const valor = Array.isArray(obj.chave) ? obj.chave[0] : obj.chave;
          if (typeof valor === 'string') {
            chaves.push(valor);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          } else if (typeof valor === 'object' && valor._) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            chaves.push(valor._);
          }
        }

        // Continuar busca recursiva
        Object.values(obj).forEach((value) => buscarChaves(value));
      }
    };

    buscarChaves(xmlParsed);
    this.logger.log(`Extraídas ${chaves.length} chaves do arquivo XML`);

    return chaves;
  }

  /**
   * Valida todas as notas consultando API externa (simulada)
   */
  private async validarNotas(
    notasExtraidas: Array<{ chave: string; valor: number }>,
  ): Promise<NotaFiscalDto[]> {
    this.logger.log(`Validando ${notasExtraidas.length} notas fiscais`);

    // Validar notas em paralelo (com limite de concorrência)
    const notas = await Promise.all(
      notasExtraidas.map((notaExtraida) =>
        this.validarNotaIndividual(notaExtraida.chave, notaExtraida.valor),
      ),
    );

    const validas = notas.filter((n) => n.status === 'VALIDA').length;
    const invalidas = notas.filter((n) => n.status === 'INVALIDA').length;

    this.logger.log(
      `Validação concluída: ${validas} válidas, ${invalidas} inválidas`,
    );

    return notas;
  }

  /**
   * Valida uma nota individual consultando API (simulada)
   * Em produção, faria chamada HTTP real
   */
  private async validarNotaIndividual(
    chave: string,
    valorReal: number,
  ): Promise<NotaFiscalDto> {
    // Simula delay de API
    await this.delay(50);

    // Simular consulta à API de validação de notas
    // Em produção seria algo como:
    // const response = await this.httpService.axiosRef.get(
    //   `https://api-notas-fiscais.gov.br/v1/consulta/${chave}`,
    //   { headers: { 'Authorization': `Bearer ${process.env.NF_API_KEY}` } }
    // );

    const dadosNota = this.simularConsultaAPI(chave, valorReal);

    // Verificar tags problemáticas
    const tagsProblematicas = [
      'RECUSADO',
      'NÃO RECONHECIDO',
      'NAO RECONHECIDO',
    ];
    const temTagProblematica = dadosNota.tags.some((tag) =>
      tagsProblematicas.some((tp) => tag.toUpperCase().includes(tp)),
    );

    return {
      chave,
      valor: dadosNota.valor,
      status: temTagProblematica ? 'INVALIDA' : 'VALIDA',
      tags: dadosNota.tags,
      motivoInvalidacao: temTagProblematica
        ? `Nota contém tag problemática: ${dadosNota.tags.filter((t) => tagsProblematicas.some((tp) => t.toUpperCase().includes(tp))).join(', ')}`
        : undefined,
    };
  }

  /**
   * Simula resposta da API de consulta de notas fiscais
   */
  private simularConsultaAPI(
    chave: string,
    valorReal: number,
  ): { valor: number; tags: string[] } {
    // Usar o valor real extraído do XML
    const valor = valorReal;

    // Simular tags - usar último dígito da chave para ser determinístico
    const ultimoDigito = parseInt(chave.slice(-1));
    let tags: string[];

    // Notas com último dígito 0 ou 1 são inválidas (20% das notas)
    if (ultimoDigito === 0) {
      tags = ['RECUSADO', 'INCONSISTENCIA_DADOS'];
    } else if (ultimoDigito === 1) {
      tags = ['NÃO RECONHECIDO', 'CHAVE_INVALIDA'];
    } else {
      // 80% das notas são válidas
      tags = ['AUTORIZADA', 'PROCESSADA', 'ATIVA'];
    }

    return { valor, tags };
  }

  /**
   * Monta resposta final da validação
   */
  private montarResposta(
    notas: NotaFiscalDto[],
    dadosValidacao: ValidacaoNotasRequestDto,
  ): ValidacaoNotasResponseDto {
    const notasValidas = notas.filter((n) => n.status === 'VALIDA');
    const notasInvalidas = notas.filter((n) => n.status === 'INVALIDA');

    const valorTotalValido = notasValidas.reduce(
      (sum, nota) => sum + nota.valor,
      0,
    );
    const percentualCobertura =
      (valorTotalValido / dadosValidacao.valorEmprestimo) * 100;

    // Verificar tolerância de 15%
    const limiteInferior =
      dadosValidacao.valorEmprestimo * (1 - this.TOLERANCIA_PERCENTUAL);
    const limiteSuperior =
      dadosValidacao.valorEmprestimo * (1 + this.TOLERANCIA_PERCENTUAL);
    const dentroDaTolerancia =
      valorTotalValido >= limiteInferior && valorTotalValido <= limiteSuperior;

    const aprovado = dentroDaTolerancia && notasValidas.length > 0;

    let mensagem: string;
    if (aprovado) {
      mensagem = `Aprovado! Valor das notas válidas (R$ ${valorTotalValido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) está dentro da tolerância de 15% do empréstimo solicitado.`;
    } else if (!dentroDaTolerancia) {
      mensagem = `Reprovado! Valor das notas válidas (R$ ${valorTotalValido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) está fora da tolerância permitida.`;
    } else {
      mensagem = 'Reprovado! Nenhuma nota válida encontrada.';
    }

    return {
      totalNotasEnviadas: notas.length,
      notasValidas: notasValidas.length,
      notasInvalidas: notasInvalidas.length,
      valorTotalValido,
      valorEmprestimo: dadosValidacao.valorEmprestimo,
      percentualCobertura,
      dentroDaTolerancia,
      aprovado,
      notas,
      mensagem,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
