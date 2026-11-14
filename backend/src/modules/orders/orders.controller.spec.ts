import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController RBAC', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let controller: OrdersController;

  const mockOrdersService = {
    createOrder: jest.fn(),
    getMyOrders: jest.fn(),
    getOrderById: jest.fn(),
    cancelOrder: jest.fn(),
  };

  const endpointMethods = [
    'create',
    'getMyOrders',
    'getOrderById',
    'cancelOrder',
  ] as const;

  const getHandler = (methodName: (typeof endpointMethods)[number]) =>
    OrdersController.prototype[methodName] as unknown as (
      ...args: never[]
    ) => unknown;

  const createExecutionContext = (
    handler: (...args: never[]) => unknown,
    user?: { role?: Role },
  ): ExecutionContext =>
    ({
      getClass: () => OrdersController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    controller = new OrdersController(
      mockOrdersService as unknown as OrdersService,
    );
  });

  it('defines OrdersController with strictly Role.CUSTOMER metadata', () => {
    const classRoles = reflector.get<Role[]>(ROLES_KEY, OrdersController);

    expect(controller).toBeDefined();
    expect(classRoles).toEqual([Role.CUSTOMER]);
    expect(classRoles).not.toContain(Role.ADMIN);
    expect(classRoles).not.toContain(Role.STAFF);
  });

  it.each(endpointMethods)('allows Role.CUSTOMER on %s', (methodName) => {
    const ctx = createExecutionContext(getHandler(methodName), {
      role: Role.CUSTOMER,
    });

    expect(rolesGuard.canActivate(ctx)).toBe(true);
  });

  it.each([
    ['ADMIN', { role: Role.ADMIN }],
    ['STAFF', { role: Role.STAFF }],
    ['unauthenticated caller', undefined],
  ])(
    'rejects %s with ForbiddenException across all orders endpoints',
    (_label, user) => {
      for (const methodName of endpointMethods) {
        const ctx = createExecutionContext(getHandler(methodName), user);

        expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
      }
    },
  );
});
