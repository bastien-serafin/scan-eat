import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  @IsObject()
  chosenOptions!: Record<string, unknown>;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  tableId!: string;

  @IsString()
  @IsNotEmpty()
  sig!: string;

  @IsNumberString()
  exp!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  @IsIn(['SIMULATED', 'STRIPE'])
  paymentMode?: 'SIMULATED' | 'STRIPE';
}
