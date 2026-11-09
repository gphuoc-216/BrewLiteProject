/**
 * CLI HELPER: SET STOCK QUANTITY BY INGREDIENT NAME
 * Cách dùng nhanh:
 *   node set-stock.js <tên-nguyên-liệu> <số-lượng>
 * Ví dụ:
 *   node set-stock.js chanh 10
 *   node set-stock.js "cà phê" 0
 *   node set-stock.js "bạc hà" 1
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const query = process.argv[2];
  const newStock = process.argv[3];

  if (!query) {
    console.log('📌 Vui lòng nhập tên nguyên liệu cần sửa tồn kho.');
    console.log('Ví dụ: node set-stock.js chanh 10');
    console.log('\nDanh sách nguyên liệu hiện có trong kho:');
    const all = await prisma.ingredient.findMany({ select: { name: true, stockQuantity: true, unit: true } });
    console.table(all);
    await prisma.$disconnect();
    return;
  }

  const stockNumber = Number(newStock ?? 10);
  if (isNaN(stockNumber) || stockNumber < 0) {
    console.error('❌ Số lượng tồn kho phải là số không âm.');
    await prisma.$disconnect();
    return;
  }

  // Tìm nguyên liệu theo tên (không phân biệt hoa thường) hoặc ID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
  let ing = null;

  if (isUuid) {
    ing = await prisma.ingredient.findUnique({ where: { id: query.trim() } });
  }

  if (!ing) {
    ing = await prisma.ingredient.findFirst({
      where: {
        name: {
          contains: query.trim(),
          mode: 'insensitive',
        },
      },
    });
  }

  if (!ing) {
    console.error(`❌ Không tìm thấy nguyên liệu nào khớp với từ khóa "${query}"`);
    console.log('\nDanh sách nguyên liệu trong kho:');
    const all = await prisma.ingredient.findMany({ select: { name: true, stockQuantity: true, unit: true } });
    console.table(all);
    await prisma.$disconnect();
    return;
  }

  // Cập nhật tồn kho và reset version về 1 để test tranh mua
  const updated = await prisma.ingredient.update({
    where: { id: ing.id },
    data: {
      stockQuantity: stockNumber,
      version: 1,
    },
  });

  console.log('\n======================================================');
  console.log(`✅ CẬP NHẬT TỒN KHO THÀNH CÔNG!`);
  console.log(`- Nguyên liệu:   ${updated.name}`);
  console.log(`- Tồn kho mới:   ${updated.stockQuantity} ${updated.unit}`);
  console.log(`- Phiên bản:     version = ${updated.version}`);
  console.log(`- Mã ID (UUID):  ${updated.id}`);
  console.log('======================================================\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

