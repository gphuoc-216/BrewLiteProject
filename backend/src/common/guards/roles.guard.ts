import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard kiểm tra phân quyền theo Role (Authorization - Trạm bảo vệ 2 sau JwtAuthGuard).
 * Đọc metadata từ decorator @Roles(...) và đối chiếu với request.user.role (lấy từ DB trong JwtStrategy).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách role yêu cầu gắn trên method hoặc class Controller
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu API không gắn @Roles(...) -> cho phép mọi user đã đăng nhập đi qua
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Bạn chưa đăng nhập để truy cập tài nguyên này');
    }

    // Chỉ cho qua nếu role thật trong DB nằm trong danh sách requiredRoles (sai -> 403 Forbidden)
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Tài khoản không đủ quyền hạn (Yêu cầu một trong các quyền: ${requiredRoles.join(', ')})`);
    }

    return true;
  }
}
