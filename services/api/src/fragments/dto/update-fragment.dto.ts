import { IsOptional, IsString } from 'class-validator';

export class UpdateFragmentDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
