import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnaliseCreditoRequestDto {
  @ApiProperty({ example: '12345678000190', description: 'CNPJ do cliente' })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({ example: 'Empresa XYZ Ltda', description: 'Nome da empresa' })
  @IsString()
  @IsNotEmpty()
  nomeEmpresa: string;

  @ApiProperty({
    example: 500000,
    description: 'Valor do empréstimo solicitado',
  })
  @IsNumber()
  @Min(1000)
  valorSolicitado: number;
}

export class BiroScoreDto {
  score: number;
  historico: string;
  dataConsulta: Date;
}

export class FaturamentoDto {
  faturamentoMensal: number;
  mes: string;
  ano: number;
  grafico: {
    labels: string[];
    valores: number[];
  };
}

export class BomPagadorDto {
  totalDividas: number;
  totalPago: number;
  percentualPago: number;
  classificacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RUIM';
  grafico: {
    dividas: number;
    pagos: number;
  };
}

export enum FaixaEmprestimo {
  P = 'P',
  M = 'M',
  G = 'G',
  NENHUMA = 'NENHUMA',
}

export class AnaliseCreditoResponseDto {
  @ApiProperty()
  aprovado: boolean;

  @ApiProperty()
  faixaAprovada: FaixaEmprestimo;

  @ApiProperty()
  motivoRecusa?: string;

  @ApiProperty()
  dadosBiro: BiroScoreDto;

  @ApiProperty()
  dadosFaturamento: FaturamentoDto;

  @ApiProperty()
  dadosBomPagador: BomPagadorDto;

  @ApiProperty()
  recomendacoes: string[];

  @ApiProperty()
  valorMaximoAprovado?: number;
}
