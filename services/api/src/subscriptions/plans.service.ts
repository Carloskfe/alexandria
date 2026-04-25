import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';

@Injectable()
export class PlansService {
  constructor(@InjectRepository(Plan) private readonly repo: Repository<Plan>) {}

  findAll(): Promise<Plan[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<Plan | null> {
    return this.repo.findOneBy({ id });
  }
}
