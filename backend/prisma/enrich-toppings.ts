import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Enriching Product Variants with Topping options...');

  // 1. Lấy thông tin các nguyên liệu topping
  const ingBoba = await prisma.ingredient.findFirst({
    where: { name: { contains: 'Trân châu' } },
  });
  const ingCheese = await prisma.ingredient.findFirst({
    where: { name: { contains: 'Kem cheese' } },
  });

  if (!ingBoba || !ingCheese) {
    console.error('❌ Không tìm thấy nguyên liệu topping trong DB.');
    return;
  }

  // 2. Cập nhật các variant 'Kèm Trân châu / Kem' thành 'Tiêu chuẩn' để đồng bộ tên gọi gốc
  const updatedL = await prisma.productVariant.updateMany({
    where: { topping: 'Kèm Trân châu / Kem' },
    data: { topping: 'Tiêu chuẩn' },
  });
  console.log(`✅ Đã chuẩn hóa ${updatedL.count} variant Size L về topping 'Tiêu chuẩn'`);

  // 3. Lấy tất cả sản phẩm cùng variants hiện tại
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          recipes: true,
        },
      },
    },
  });

  let addedCount = 0;

  for (const product of products) {
    for (const size of ['S', 'M', 'L']) {
      const baseVariant = product.variants.find((v) => v.size === size && v.topping === 'Tiêu chuẩn');
      if (!baseVariant) continue;

      const basePrice = Number(baseVariant.price);

      // Định nghĩa 2 topping thêm vào
      const toppingsToAdd = [
        {
          name: 'Thêm Trân châu đường đen',
          extraPrice: 6000,
          toppingIngId: ingBoba.id,
          toppingQuantity: 30,
        },
        {
          name: 'Thêm Kem Cheese Macchiato',
          extraPrice: 10000,
          toppingIngId: ingCheese.id,
          toppingQuantity: 25,
        },
      ];

      for (const top of toppingsToAdd) {
        // Kiểm tra xem đã tồn tại chưa
        const existing = product.variants.find((v) => v.size === size && v.topping === top.name);
        if (existing) continue;

        // Tạo variant mới
        const newVariant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: size,
            price: basePrice + top.extraPrice,
            topping: top.name,
          },
        });

        const recipeMap = new Map<string, number>();
        for (const r of baseVariant.recipes) {
          recipeMap.set(r.ingredientId, Number(r.quantityRequired));
        }

        // Nếu đã có topping này trong công thức gốc thì tăng định lượng, nếu chưa thì thêm mới
        const currentQty = recipeMap.get(top.toppingIngId) || 0;
        recipeMap.set(top.toppingIngId, currentQty + top.toppingQuantity);

        // Lưu recipe vào DB
        for (const [ingredientId, quantityRequired] of recipeMap.entries()) {
          await prisma.recipe.create({
            data: {
              variantId: newVariant.id,
              ingredientId,
              quantityRequired,
            },
          });
        }

        addedCount++;
      }
    }
  }

  console.log(`🎉 Đã bổ sung thành công ${addedCount} biến thể topping mới vào database!`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi enrich toppings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
