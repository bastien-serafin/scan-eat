import { Controller, Get, Param, Query } from '@nestjs/common';
import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { QrService } from '../qr/qr.service';
import { MenuService } from './menu.service';

class MenuQueryDto {
  @IsString()
  @IsNotEmpty()
  t!: string;

  @IsString()
  @IsNotEmpty()
  sig!: string;

  @IsNumberString()
  exp!: string;
}

@Controller('public/establishments')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly qrService: QrService,
  ) {}

  @Get(':slug/menu')
  async getMenu(@Param('slug') slug: string, @Query() query: MenuQueryDto) {
    const exp = Number(query.exp);
    this.qrService.verify({ slug, tableId: query.t, sig: query.sig, exp });
    return this.menuService.getBySlug(slug, query.t);
  }
}
