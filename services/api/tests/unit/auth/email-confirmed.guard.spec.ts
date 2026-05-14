import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EmailConfirmedGuard } from '../../../src/auth/email-confirmed.guard';

function mockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any;
}

describe('EmailConfirmedGuard', () => {
  let guard: EmailConfirmedGuard;

  beforeEach(() => {
    guard = new EmailConfirmedGuard();
  });

  it('allows a user whose email is confirmed', () => {
    expect(guard.canActivate(mockContext({ emailConfirmed: true }))).toBe(true);
  });

  it('throws ForbiddenException when emailConfirmed is false', () => {
    expect(() => guard.canActivate(mockContext({ emailConfirmed: false }))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is null', () => {
    expect(() => guard.canActivate(mockContext(null))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when emailConfirmed is undefined', () => {
    expect(() => guard.canActivate(mockContext({}))).toThrow(ForbiddenException);
  });
});
