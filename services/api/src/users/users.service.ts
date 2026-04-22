import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthProvider, User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  findByProvider(provider: AuthProvider, providerId: string) {
    return this.repo.findOneBy({ provider, providerId });
  }

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
