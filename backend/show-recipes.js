const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const query = process.argv.slice(2).join(' ').trim().toLowerCase();

  const products = await prisma.product.findMany({
    where: query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ]
    } : undefined,
    include: {
      variants: {
        include: {
          recipes: {
            include: {
              ingredient: true
            }
          }
        }
      }
    },
    orderBy: { category: 'asc' }
  });

  if (products.length === 0) {
    console.log(`❌ Không tìm thấy món nào khớp với từ khóa "${query}".`);
    return;
  }

  console.log('='.repeat(80));
  console.log(`☕ BẢNG TRA CỨU CÔNG THỨC PHA CHẾ & ĐỊNH LƯỢNG KHO (BREWLITE)`);
  if (query) console.log(`🔍 Tìm kiếm theo: "${query}"`);
  console.log('='.repeat(80));

  for (const p of products) {
    console.log(`\n📌 MÓN: [${p.category}] ${p.name}`);
    
    // Group variants by Size with standard topping ("Tiêu chuẩn")
    const standardVariants = p.variants.filter(v => v.topping === 'Tiêu chuẩn');
    const displayVariants = standardVariants.length > 0 ? standardVariants : p.variants.slice(0, 3);
    
    for (const v of displayVariants) {
      const ingList = v.recipes.map(r => `${r.ingredient.name} (${r.quantityRequired} ${r.ingredient.unit})`).join(' + ');
      console.log(`   👉 Size ${v.size} [${v.price.toLocaleString('vi-VN')}đ]: ${ingList || 'Chưa gán công thức'}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 Mẹo: Chỉnh tồn kho nguyên liệu bằng lệnh: npm run stock -- "<Tên>" <Số_lượng>');
  console.log('='.repeat(80));
}

main()
  .catch(err => {
    console.error('Lỗi tra cứu công thức:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
