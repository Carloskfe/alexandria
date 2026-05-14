import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cause } from './cause.entity';
import { UserCausePreference } from './user-cause-preference.entity';
import { CausesController } from './causes.controller';
import { CausesService } from './causes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cause, UserCausePreference])],
  providers: [CausesService],
  controllers: [CausesController],
  exports: [CausesService],
})
export class CausesModule {}
