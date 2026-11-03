import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnderecosController } from './enderecos.controller';
import { EnderecosService } from './enderecos.service';
import { ViaCepClient } from './via-cep.client';

@Module({
  imports: [AuthModule],
  controllers: [EnderecosController],
  providers: [EnderecosService, ViaCepClient],
})
export class EnderecosModule {}
