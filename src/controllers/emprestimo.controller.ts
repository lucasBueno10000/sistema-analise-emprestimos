import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AnaliseCreditoService } from '../services/analise-credito.service';
import { ProcessamentoArquivoService } from '../services/processamento-arquivo.service';
import {
  AnaliseCreditoRequestDto,
  AnaliseCreditoResponseDto,
} from '../dto/analise-credito.dto';
import {
  ValidacaoNotasRequestDto,
  ValidacaoNotasResponseDto,
} from '../dto/validacao-notas.dto';

/**
 * Controller principal para operações de empréstimo
 */
@ApiTags('Empréstimos')
@Controller('emprestimos')
export class EmprestimoController {
  constructor(
    private readonly analiseCreditoService: AnaliseCreditoService,
    private readonly processamentoArquivoService: ProcessamentoArquivoService,
  ) {}

  /**
   * Etapa 1: Pré-análise de crédito
   * Consulta Birô, Faturamento e Bom Pagador
   */
  @Post('analise-credito')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Realizar análise de crédito (Etapa 1 - Pré-análise)',
    description: `
      Realiza análise completa de crédito consultando:
      - Birô de Crédito (score)
      - Sistema de Faturamento (sem API - simulado com scraping)
      - Bom Pagador (histórico de pagamentos)
      
      Classifica cliente em faixas P, M ou G baseado em:
      - Score e faturamento
      - Histórico de pagamentos
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Análise realizada com sucesso',
    type: AnaliseCreditoResponseDto,
  })
  async analisarCredito(
    @Body() request: AnaliseCreditoRequestDto,
  ): Promise<AnaliseCreditoResponseDto> {
    return await this.analiseCreditoService.analisarCredito(request);
  }

  /**
   * Etapa 2: Upload e validação de arquivo XML
   */
  @Post('validar-notas/xml')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('arquivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Validar notas fiscais via arquivo XML',
    description: `
      Processa arquivo XML contendo notas fiscais.
      Busca tag <chave> em cada nota e valida via API.
      Verifica tolerância de 15% em relação ao valor do empréstimo.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arquivo: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo XML com notas fiscais',
        },
        cnpj: {
          type: 'string',
          example: '12345678000190',
        },
        valorEmprestimo: {
          type: 'number',
          example: 500000,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notas validadas com sucesso',
    type: ValidacaoNotasResponseDto,
  })
  async validarNotasXML(
    @UploadedFile() arquivo: any,
    @Body() dadosValidacao: ValidacaoNotasRequestDto,
  ): Promise<ValidacaoNotasResponseDto> {
    if (!arquivo) {
      throw new BadRequestException('Arquivo XML é obrigatório');
    }

    const conteudo = arquivo.buffer.toString('utf-8');
    return await this.processamentoArquivoService.processarXML(
      conteudo,
      dadosValidacao,
    );
  }

  /**
   * Etapa 2: Upload e validação de arquivo CNAB
   */
  @Post('validar-notas/cnab')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('arquivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Validar notas fiscais via arquivo CNAB',
    description: `
      Processa arquivo CNAB (.REM) contendo notas fiscais.
      Extrai chave da nota dos caracteres 20-64 de cada linha.
      Valida cada chave via API.
      Verifica tolerância de 15% em relação ao valor do empréstimo.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arquivo: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo CNAB (.REM) com notas fiscais',
        },
        cnpj: {
          type: 'string',
          example: '12345678000190',
        },
        valorEmprestimo: {
          type: 'number',
          example: 500000,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notas validadas com sucesso',
    type: ValidacaoNotasResponseDto,
  })
  async validarNotasCNAB(
    @UploadedFile() arquivo: any,
    @Body() dadosValidacao: ValidacaoNotasRequestDto,
  ): Promise<ValidacaoNotasResponseDto> {
    if (!arquivo) {
      throw new BadRequestException('Arquivo CNAB é obrigatório');
    }

    const conteudo = arquivo.buffer.toString('utf-8');
    return await this.processamentoArquivoService.processarCNAB(
      conteudo,
      dadosValidacao,
    );
  }
}
