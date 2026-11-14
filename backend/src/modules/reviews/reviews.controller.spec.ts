import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController RBAC', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let controller: ReviewsController;

  const mockReviewsService = {
    createReview: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
  };

  const endpointMethods = [
    'createReview',
    'updateReview',
    'deleteReview',
  ] as const;

  const getHandler = (methodName: (typeof endpointMethods)[number]) =>
    ReviewsController.prototype[methodName] as unknown as (
      ...args: never[]
    ) => unknown;

  const createExecutionContext = (
    handler: (...args: never[]) => unknown,
    user?: { role?: Role },
  ): ExecutionContext =>
    ({
      getClass: () => ReviewsController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    controller = new ReviewsController(
      mockReviewsService as unknown as ReviewsService,
    );
  });

  it('defines ReviewsController with strictly Role.CUSTOMER metadata', () => {
    const classRoles = reflector.get<Role[]>(ROLES_KEY, ReviewsController);

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
    'rejects %s with ForbiddenException across all reviews endpoints',
    (_label, user) => {
      for (const methodName of endpointMethods) {
        const ctx = createExecutionContext(getHandler(methodName), user);

        expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
      }
    },
  );
});
