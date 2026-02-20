import { Module } from '@nestjs/common';
import { QrModule } from '../qr/qr.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({ imports: [QrModule], controllers: [MenuController], providers: [MenuService] })
export class MenuModule {}
