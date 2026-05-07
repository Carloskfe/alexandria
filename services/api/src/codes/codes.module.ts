import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadCode } from './upload-code.entity';
import { UploadCodesService } from './upload-codes.service';
import { CodesController } from './codes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UploadCode])],
  controllers: [CodesController],
  providers: [UploadCodesService],
  exports: [UploadCodesService],
})
export class CodesModule {}
