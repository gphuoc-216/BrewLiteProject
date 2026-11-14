import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController RBAC', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let controller: PaymentController;

  const mockPaymentService = {
    processPayment: jest.fn(),
    syncMbPayment: jest.fn(),
    checkMbPayment: jest.fn(),
    invalidateMbPayment: jest.fn(),
  };

  const getHandler = (methodName: 'pay' | 'syncMbPayment' | 'checkMbPayment' | 'invalidateMbPayment') =>
    PaymentController.prototype[methodName] as unknown as (
      ...args: never[]
    ) => unknown;

  const createExecutionContext = (
    handler: (...args: never[]) => unknown,
    user?: { role?: Role },
  ): ExecutionContext =>
    ({
      getClass: () => PaymentController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    controller = new PaymentController(
      mockPaymentService as unknown as PaymentService,
    );
  });

  it('restricts POST /payments strictly to Role.CUSTOMER while leaving gateway endpoints unannotated', () => {
    const payRoles = reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      getHandler('pay'),
      PaymentController,
    ]);
    const mbSyncRoles = reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      getHandler('syncMbPayment'),
      PaymentController,
    ]);

    expect(controller).toBeDefined();
    expect(payRoles).toEqual([Role.CUSTOMER]);
    expect(mbSyncRoles).toBeUndefined();
  });

  it('allows Role.CUSTOMER on pay()', () => {
    const ctx = createExecutionContext(getHandler('pay'), {
      role: Role.CUSTOMER,
    });

    expect(rolesGuard.canActivate(ctx)).toBe(true);
  });

  it.each([
    ['ADMIN', { role: Role.ADMIN }],
    ['STAFF', { role: Role.STAFF }],
    ['unauthenticated caller', undefined],
  ])('rejects %s with ForbiddenException on pay()', (_label, user) => {
    const ctx = createExecutionContext(getHandler('pay'), user);

    expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
