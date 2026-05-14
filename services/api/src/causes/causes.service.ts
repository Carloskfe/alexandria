import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cause } from './cause.entity';
import { UserCausePreference } from './user-cause-preference.entity';
import { SavePreferencesDto } from './dto/save-preferences.dto';

@Injectable()
export class CausesService {
  constructor(
    @InjectRepository(Cause)
    private readonly causeRepo: Repository<Cause>,
    @InjectRepository(UserCausePreference)
    private readonly prefRepo: Repository<UserCausePreference>,
  ) {}

  findAllActive(): Promise<Cause[]> {
    return this.causeRepo.find({ where: { active: true }, order: { createdAt: 'ASC' } });
  }

  async getPreferences(userId: string): Promise<UserCausePreference | null> {
    return this.prefRepo.findOne({ where: { userId } });
  }

  async savePreferences(userId: string, dto: SavePreferencesDto): Promise<UserCausePreference> {
    let pref = await this.prefRepo.findOne({ where: { userId } });
    if (!pref) {
      pref = this.prefRepo.create({ userId });
    }
    pref.cause1Id = dto.cause1Id ?? null;
    pref.cause2Id = dto.cause2Id ?? null;
    pref.randomDistribution = dto.randomDistribution;
    return this.prefRepo.save(pref);
  }
}
