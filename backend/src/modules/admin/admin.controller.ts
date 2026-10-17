import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Quản Trị Hệ Thống (Admin)')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Tài khoản & Nhân viên
  @Get('accounts')
  @ApiOperation({ summary: 'Xem danh sách tài khoản toàn hệ thống' })
  getAccounts() {
    return this.adminService.getAccounts();
  }

  @Patch('accounts/:id/lock')
  @ApiOperation({ summary: 'Khóa tài khoản người dùng' })
  lockAccount(@Param('id') id: string) {
    return this.adminService.lockAccount(id);
  }

  @Patch('accounts/:id/unlock')
  @ApiOperation({ summary: 'Mở khóa tài khoản người dùng' })
  unlockAccount(@Param('id') id: string) {
    return this.adminService.unlockAccount(id);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Danh sách nhân viên' })
  getStaff() {
    return this.adminService.getStaffList();
  }

  @Post('staff')
  @ApiOperation({ summary: 'Tạo tài khoản nhân viên mới' })
  createStaff(@Body() dto: any) {
    return this.adminService.createStaff(dto);
  }

  @Patch('staff/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin nhân viên' })
  updateStaff(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateStaff(id, dto);
  }

  @Delete('staff/:id')
  @ApiOperation({ summary: 'Xóa hồ sơ nhân viên' })
  deleteStaff(@Param('id') id: string) {
    return this.adminService.deleteStaff(id);
  }

  // Sản phẩm, biến thể, công thức
  @Post('products')
  @ApiOperation({ summary: 'Tạo sản phẩm mới' })
  createProduct(@Body() dto: any) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Sửa sản phẩm' })
  updateProduct(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Xóa/Ẩn sản phẩm' })
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Post('variants')
  @ApiOperation({ summary: 'Thêm biến thể size cho sản phẩm' })
  createVariant(@Body() dto: any) {
    return this.adminService.createVariant(dto);
  }

  @Patch('variants/:id')
  @ApiOperation({ summary: 'Sửa đơn giá biến thể size' })
  updateVariant(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateVariant(id, dto);
  }

  @Delete('variants/:id')
  @ApiOperation({ summary: 'Xóa biến thể size' })
  deleteVariant(@Param('id') id: string) {
    return this.adminService.deleteVariant(id);
  }

  @Post('recipes')
  @ApiOperation({ summary: 'Thiết lập công thức nguyên liệu' })
  createRecipe(@Body() dto: any) {
    return this.adminService.createRecipe(dto);
  }

  @Patch('recipes/:id')
  @ApiOperation({ summary: 'Cập nhật định lượng nguyên liệu' })
  updateRecipe(@Param('id') id: string, @Body('quantityRequired') qty: number) {
    return this.adminService.updateRecipe(id, qty);
  }

  @Delete('recipes/:id')
  @ApiOperation({ summary: 'Xóa nguyên liệu khỏi công thức' })
  deleteRecipe(@Param('id') id: string) {
    return this.adminService.deleteRecipe(id);
  }

  // Khuyến mãi
  @Get('promotions')
  @ApiOperation({ summary: 'Danh sách mã khuyến mãi' })
  getPromotions() {
    return this.adminService.getPromotions();
  }

  @Post('promotions')
  @ApiOperation({ summary: 'Tạo mã khuyến mãi mới' })
  createPromotion(@Body() dto: any) {
    return this.adminService.createPromotion(dto);
  }

  @Patch('promotions/:id')
  @ApiOperation({ summary: 'Sửa mã khuyến mãi' })
  updatePromotion(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updatePromotion(id, dto);
  }

  @Delete('promotions/:id')
  @ApiOperation({ summary: 'Xóa mã khuyến mãi' })
  deletePromotion(@Param('id') id: string) {
    return this.adminService.deletePromotion(id);
  }

  // Kho & Nhà cung cấp
  @Get('ingredients')
  @ApiOperation({ summary: 'Xem tồn kho nguyên liệu' })
  getIngredients() {
    return this.adminService.getIngredients();
  }

  @Post('ingredients')
  @ApiOperation({ summary: 'Thêm nguyên liệu mới' })
  createIngredient(@Body() dto: any) {
    return this.adminService.createIngredient(dto);
  }

  @Patch('ingredients/:id')
  @ApiOperation({ summary: 'Cập nhật tồn kho/đơn vị nguyên liệu' })
  updateIngredient(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  @ApiOperation({ summary: 'Xóa nguyên liệu' })
  deleteIngredient(@Param('id') id: string) {
    return this.adminService.deleteIngredient(id);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Danh sách nhà cung cấp' })
  getSuppliers() {
    return this.adminService.getSuppliers();
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Thêm nhà cung cấp mới' })
  createSupplier(@Body() dto: any) {
    return this.adminService.createSupplier(dto);
  }

  @Get('import-receipts')
  @ApiOperation({ summary: 'Danh sách phiếu nhập kho' })
  getImportReceipts() {
    return this.adminService.getImportReceipts();
  }

  @Post('import-receipts')
  @ApiOperation({ summary: 'Lập phiếu nhập kho & tự động cộng dồn tồn kho' })
  createImportReceipt(@Body() dto: any) {
    return this.adminService.createImportReceipt(dto);
  }

  // Kiểm duyệt Đánh giá
  @Get('reviews')
  @ApiOperation({ summary: 'Toàn bộ đánh giá của khách hàng' })
  getAllReviews() {
    return this.adminService.getAllReviews();
  }

  @Patch('reviews/:id/hide')
  @ApiOperation({ summary: 'Ẩn đánh giá vi phạm' })
  hideReview(@Param('id') id: string) {
    return this.adminService.hideReview(id);
  }

  @Patch('reviews/:id/show')
  @ApiOperation({ summary: 'Mở hiển thị đánh giá' })
  showReview(@Param('id') id: string) {
    return this.adminService.showReview(id);
  }

  // Thống kê & Báo cáo
  @Get('stats/overview')
  @ApiOperation({ summary: 'Thống kê tổng quan: Doanh thu, số đơn, khách hàng' })
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('stats/revenue')
  @ApiOperation({ summary: 'Biểu đồ doanh thu theo ngày' })
  getRevenue() {
    return this.adminService.getRevenueStats();
  }

  @Get('stats/top-products')
  @ApiOperation({ summary: 'Top sản phẩm bán chạy nhất' })
  getTopProducts() {
    return this.adminService.getTopProducts();
  }

  @Get('stats/orders-by-status')
  @ApiOperation({ summary: 'Tỷ trọng đơn hàng theo trạng thái' })
  getOrdersByStatus() {
    return this.adminService.getOrdersByStatus();
  }
}
