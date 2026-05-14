import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class SavePreferencesDto {
  @IsOptional()
  @IsUUID()
  cause1Id?: string | null;

  @IsOptional()
  @IsUUID()
  cause2Id?: string | null;

  @IsBoolean()
  randomDistribution: boolean;
}
