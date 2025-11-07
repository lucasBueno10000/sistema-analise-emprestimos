import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para desenvolvimento e produção no Azure.
  // Usa função dinâmica para aceitar apenas origens conhecidas e tratar preflight corretamente.
  // Origem padrão se variável de ambiente não estiver definida.
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://happy-island-0e44dd50f.3.azurestaticapps.net',
  ];
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : defaultOrigins;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir requisições sem origin (como curl ou servidores internos)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin não permitido pelo CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204, // Status para navegadores antigos
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
