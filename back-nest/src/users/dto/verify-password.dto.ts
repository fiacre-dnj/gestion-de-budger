import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPasswordDto {
  @ApiProperty({ example: 'monMotDePasse123' })
  @IsString()
  password: string;
}
