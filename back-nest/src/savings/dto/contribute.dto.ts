import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContributeDto {
  @ApiProperty({ example: 100, minimum: 0.01, description: 'Montant de la contribution' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
