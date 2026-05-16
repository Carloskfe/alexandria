import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { TokenPackage } from './token-package.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private readonly repo: Repository<Plan>,
    @InjectRepository(TokenPackage) private readonly packageRepo: Repository<TokenPackage>,
  ) {}

  findAll(): Promise<Plan[]> {
    return this.repo.find({ order: { amountCents: 'ASC' } });
  }

  findById(id: string): Promise<Plan | null> {
    return this.repo.findOneBy({ id });
  }

  findActiveTokenPackages(): Promise<TokenPackage[]> {
    return this.packageRepo.find({ where: { active: true }, order: { tokenCount: 'ASC' } });
  }
}
