import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

describe('StaffController RBAC', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let controller: StaffController;

  const mockStaffService = {
    getOrders: jest.fn(),
    acceptOrder: jest.fn(),
    markReady: jest.fn(),
    completeOrder: jest.fn(),
    getOrderRecipes: jest.fn(),
  };

  const endpointMethods = [
    'getOrders',
    'acceptOrder',
    'markReady',
    'completeOrder',
    'getOrderRecipes',
  ] as const;

  const getHandler = (methodName: (typeof endpointMethods)[number]) =>
    StaffController.prototype[methodName] as unknown as (
      ...args: never[]
    ) => unknown;

  const createExecutionContext = (
    handler: (...args: never[]) => unknown,
    user?: { role?: Role },
  ): ExecutionContext =>
    ({
      getClass: () => StaffController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    controller = new StaffController(
      mockStaffService as unknown as StaffService,
    );
  });

  it('defines StaffController with strictly Role.STAFF metadata', () => {
    const classRoles = reflector.get<Role[]>(ROLES_KEY, StaffController);

    expect(controller).toBeDefined();
    expect(classRoles).toEqual([Role.STAFF]);
    expect(classRoles).not.toContain(Role.ADMIN);
    expect(classRoles).not.toContain(Role.CUSTOMER);
  });

  it.each(endpointMethods)(
    'resolves effective @Roles metadata to [Role.STAFF] for %s',
    (methodName) => {
      const effectiveRoles = reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        getHandler(methodName),
        StaffController,
      ]);

      expect(effectiveRoles).toEqual([Role.STAFF]);
    },
  );

  it.each(endpointMethods)('allows Role.STAFF on %s', (methodName) => {
    const ctx = createExecutionContext(getHandler(methodName), {
      role: Role.STAFF,
    });

    expect(rolesGuard.canActivate(ctx)).toBe(true);
  });

  it.each([
    ['ADMIN', { role: Role.ADMIN }],
    ['CUSTOMER', { role: Role.CUSTOMER }],
    ['unauthenticated caller', undefined],
  ])(
    'rejects %s with ForbiddenException across all staff endpoints',
    (_label, user) => {
      for (const methodName of endpointMethods) {
        const ctx = createExecutionContext(getHandler(methodName), user);

        expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
      }
    },
  );
});
