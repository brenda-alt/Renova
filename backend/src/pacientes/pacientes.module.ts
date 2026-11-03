import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

@Module({
  imports: [AuthModule, DashboardModule],
  controllers: [PacientesController],
  providers: [PacientesService],
})
export class PacientesModule {}
