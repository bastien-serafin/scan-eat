import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
      include: { establishment: true },
    });
    if (!admin) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const token = await this.jwtService.signAsync({
      sub: admin.id,
      email: admin.email,
      establishmentId: admin.establishmentId,
    });

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        establishmentId: admin.establishmentId,
        establishmentName: admin.establishment.name,
      },
    };
  }
}
