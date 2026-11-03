import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReceitasController } from './receitas.controller';
import { ReceitasService } from './receitas.service';

@Module({
  imports: [AuthModule],
  controllers: [ReceitasController],
  providers: [ReceitasService],
})
export class ReceitasModule {}
