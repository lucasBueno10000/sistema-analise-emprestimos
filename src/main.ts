import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para desenvolvimento e produção no Azure
  app.enableCors({
    origin: [
      'http://localhost:5173', // Desenvolvimento local
      'http://localhost:3000',
      'https://happy-island-0e44dd50f.3.azurestaticapps.net', // Frontend Azure Static Web App
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Análise de Empréstimos')
    .setDescription(
      `
      API para análise de crédito e validação de notas fiscais.
      
      **Etapa 1 - Pré-análise:**
      - Consulta Birô de Crédito (API simulada)
      - Consulta Faturamento (sistema sem API - web scraping simulado)
      - Consulta Bom Pagador (API simulada)
      - Classifica em faixas P, M ou G
      
      **Etapa 2 - Durante Empréstimo:**
      - Upload de arquivos XML ou CNAB
      - Validação de notas fiscais
      - Verificação de tolerância de 15%
    `,
    )
    .setVersion('1.0')
    .addTag('Empréstimos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api`);
}
void bootstrap();
