import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class QrService {
  private readonly secret = process.env.QR_SECRET ?? 'dev_qr_secret';

  sign(payload: { slug: string; tableId: string; exp: number }) {
    const base = `${payload.slug}:${payload.tableId}:${payload.exp}`;
    return crypto.createHmac('sha256', this.secret).update(base).digest('hex');
  }

  verify(input: { slug: string; tableId: string; exp: number; sig: string }) {
    if (!input.exp || Number.isNaN(input.exp)) {
      throw new UnauthorizedException('QR exp invalide');
    }

    const now = Date.now();
    if (input.exp < now) {
      throw new UnauthorizedException('QR expiré');
    }

    const maxHorizon = now + 24 * 60 * 60 * 1000;
    if (input.exp > maxHorizon) {
      throw new UnauthorizedException('QR hors fenêtre 24h');
    }

    const expected = this.sign({ slug: input.slug, tableId: input.tableId, exp: input.exp });
    if (expected.length !== input.sig.length) {
      throw new UnauthorizedException('Signature QR invalide');
    }
    const isValid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.sig));
    if (!isValid) {
      throw new UnauthorizedException('Signature QR invalide');
    }
  }
}
