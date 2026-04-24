import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fragment } from './fragment.entity';
import { FragmentsService } from './fragments.service';
import { FragmentsController } from './fragments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fragment])],
  controllers: [FragmentsController],
  providers: [FragmentsService],
  exports: [FragmentsService],
})
export class FragmentsModule {}
