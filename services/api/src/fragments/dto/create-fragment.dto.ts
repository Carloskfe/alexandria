import { IsInt, IsString, IsUUID } from 'class-validator';

export class CreateFragmentDto {
  @IsUUID()
  bookId: string;

  @IsInt()
  startPhraseIndex: number;

  @IsInt()
  endPhraseIndex: number;

  @IsString()
  text: string;
}
