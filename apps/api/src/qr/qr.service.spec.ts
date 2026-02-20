import { UnauthorizedException } from '@nestjs/common';
import { QrService } from './qr.service';

describe('QrService', () => {
  const service = new QrService();

  it('sign + verify should pass with valid payload', () => {
    const exp = Date.now() + 60_000;
    const sig = service.sign({ slug: 'demo', tableId: 'table1', exp });
    expect(() => service.verify({ slug: 'demo', tableId: 'table1', exp, sig })).not.toThrow();
  });

  it('verify should fail on expired payload', () => {
    const exp = Date.now() - 1_000;
    const sig = service.sign({ slug: 'demo', tableId: 'table1', exp });
    expect(() => service.verify({ slug: 'demo', tableId: 'table1', exp, sig })).toThrow(
      UnauthorizedException,
    );
  });
});
