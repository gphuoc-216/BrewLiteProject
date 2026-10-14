import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('Thực đơn (Menu & Products)')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thực đơn đồ uống (Menu)' })
  @ApiQuery({ name: 'search', required: false, description: 'Từ khóa tìm kiếm theo tên' })
  @ApiQuery({ name: 'category', required: false, description: 'Lọc theo danh mục (COFFEE, TEA, FREEZE)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAll({ search, category, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết sản phẩm, danh sách biến thể size/topping và đánh giá' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
