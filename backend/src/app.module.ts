import { Module } from '@nestjs/common';
import { AcompanhamentosModule } from './acompanhamentos/acompanhamentos.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EnderecosModule } from './enderecos/enderecos.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReceitasModule } from './receitas/receitas.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DashboardModule,
    PacientesModule,
    AcompanhamentosModule,
    ReceitasModule,
    EnderecosModule,
  ],
})
export class AppModule {}
