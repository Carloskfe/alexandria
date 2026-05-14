import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class EmailConfirmedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.user?.emailConfirmed) {
      throw new ForbiddenException('EMAIL_NOT_CONFIRMED');
    }
    return true;
  }
}
