import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fragment } from '../fragments/fragment.entity';
import { Book } from '../books/book.entity';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fragment, Book])],
  providers: [SharingService],
  controllers: [SharingController],
})
export class SharingModule {}
