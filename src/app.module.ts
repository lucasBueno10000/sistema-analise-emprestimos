import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmprestimoController } from './controllers/emprestimo.controller';
import { AnaliseCreditoService } from './services/analise-credito.service';
import { BiroService } from './services/biro.service';
import { BomPagadorService } from './services/bom-pagador.service';
import { FaturamentoService } from './services/faturamento.service';
import { ProcessamentoArquivoService } from './services/processamento-arquivo.service';

@Module({
  imports: [],
  controllers: [AppController, EmprestimoController],
  providers: [
    AppService,
    AnaliseCreditoService,
    BiroService,
    BomPagadorService,
    FaturamentoService,
    ProcessamentoArquivoService,
  ],
})
export class AppModule {}
