import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev_jwt_secret',
    });
  }

  async validate(payload: { sub: string; email: string; establishmentId: string }) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || admin.establishmentId !== payload.establishmentId) {
      throw new UnauthorizedException('Session invalide, reconnectez-vous');
    }
    return payload;
  }
}
