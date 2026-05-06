import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { ReadingProgress } from '../books/reading-progress.entity';
import { User } from '../users/user.entity';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, ReadingProgress, User])],
  controllers: [AuthorsController],
  providers: [AuthorsService],
})
export class AuthorsModule {}
