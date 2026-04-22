import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { UserType } from '../user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;
}
