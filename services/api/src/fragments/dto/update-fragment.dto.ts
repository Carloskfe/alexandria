import { IsOptional, IsString } from 'class-validator';

export class UpdateFragmentDto {
  @IsOptional()
  @IsString()
  note?: string;
}
