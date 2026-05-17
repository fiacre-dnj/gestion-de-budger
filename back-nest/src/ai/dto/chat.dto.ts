import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ example: 'J\'ai dépensé 45€ au supermarché hier' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @ApiPropertyOptional({ description: 'ID de conversation existante' })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
