import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriaDespesaModule } from './categoria-despesa/categoria-despesa.module';
import { FonteReceitaModule } from './fonte-receita/fonte-receita.module';
import { DespesasModule } from './despesas/despesas.module';
import { ReceitasModule } from './receitas/receitas.module';
import { MetasModule } from './metas/metas.module';
import { ContribuicaoMetaModule } from './contribuicao-meta/contribuicao-meta.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CategoriaDespesaModule,
    FonteReceitaModule,
    DespesasModule,
    ReceitasModule,
    MetasModule,
    ContribuicaoMetaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
