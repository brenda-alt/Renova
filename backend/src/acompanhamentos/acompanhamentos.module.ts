import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcompanhamentosController } from './acompanhamentos.controller';
import { AcompanhamentosService } from './acompanhamentos.service';

@Module({
  imports: [AuthModule],
  controllers: [AcompanhamentosController],
  providers: [AcompanhamentosService],
})
export class AcompanhamentosModule {}
