import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export type OrderStatus = 'NOUVELLE' | 'EN_PREPA' | 'PRETE' | 'SERVIE' | 'ANNULEE';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['NOUVELLE', 'EN_PREPA', 'PRETE', 'SERVIE', 'ANNULEE'])
  status!: OrderStatus;

  @IsOptional()
  @IsBoolean()
  seen?: boolean;
}
