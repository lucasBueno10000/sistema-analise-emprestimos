/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValidacaoNotasRequestDto {
  @ApiProperty({ example: '12345678000190', description: 'CNPJ do cliente' })
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({
    example: 500000,
    description: 'Valor total do empréstimo aprovado',
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1000)
  valorEmprestimo: number;
}

export class NotaFiscalDto {
  chave: string;
  valor: number;
  status: 'VALIDA' | 'INVALIDA';
  tags: string[];
  motivoInvalidacao?: string;
}

export class ValidacaoNotasResponseDto {
  @ApiProperty()
  totalNotasEnviadas: number;

  @ApiProperty()
  notasValidas: number;

  @ApiProperty()
  notasInvalidas: number;

  @ApiProperty()
  valorTotalValido: number;

  @ApiProperty()
  valorEmprestimo: number;

  @ApiProperty()
  percentualCobertura: number;

  @ApiProperty()
  dentroDaTolerancia: boolean;

  @ApiProperty()
  aprovado: boolean;

  @ApiProperty()
  notas: NotaFiscalDto[];

  @ApiProperty()
  mensagem: string;
}

export enum TipoArquivo {
  XML = 'XML',
  CNAB = 'CNAB',
}
