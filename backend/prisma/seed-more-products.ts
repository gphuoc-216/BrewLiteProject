import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding 12 new products to make 24 products (3 full pages)...');

  const ingRobusta = await prisma.ingredient.findFirst({ where: { name: { contains: 'Robusta' } } });
  const ingArabica = await prisma.ingredient.findFirst({ where: { name: { contains: 'Arabica' } } });
  const ingCondensedMilk = await prisma.ingredient.findFirst({ where: { name: { contains: 'Sữa đặc' } } });
  const ingFreshMilk = await prisma.ingredient.findFirst({ where: { name: { contains: 'Sữa tươi' } } });
  const ingBlackTea = await prisma.ingredient.findFirst({ where: { name: { contains: 'Trà đen' } } });
  const ingOolongTea = await prisma.ingredient.findFirst({ where: { name: { contains: 'Trà Ô Long' } } });
  const ingPeach = await prisma.ingredient.findFirst({ where: { name: { contains: 'Đào ngâm' } } });
  const ingSugar = await prisma.ingredient.findFirst({ where: { name: { contains: 'đường' } } });

  const newProducts = [
    // 4 Cà phê mới
    {
      name: 'Cà Phê Muối Xứ Huế',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=60',
      description: 'Đậm đà Robusta hòa quyện cùng lớp kem muối béo mặn đặc sản cố đô gây nghiện.',
      basePrice: 35000,
      ing1: ingRobusta?.id || '', q1: 20,
      ing2: ingCondensedMilk?.id || '', q2: 25,
    },
    {
      name: 'Cà Phê Trứng Hà Nội',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=60',
      description: 'Lớp kem trứng đánh bông mịn béo ngậy thơm lừng kết hợp cà phê phin nguyên chất.',
      basePrice: 45000,
      ing1: ingRobusta?.id || '', q1: 22,
      ing2: ingCondensedMilk?.id || '', q2: 30,
    },
    {
      name: 'Cold Brew Cam Vàng Băng Đăng',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&auto=format&fit=crop&q=60',
      description: 'Cà phê ủ lạnh 18 tiếng thanh khiết kết hợp lát cam vàng mọng nước sảng khoái.',
      basePrice: 42000,
      ing1: ingArabica?.id || '', q1: 20,
      ing2: ingSugar?.id || '', q2: 15,
    },
    {
      name: 'Caramel Macchiato Nóng',
      category: 'COFFEE',
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=60',
      description: 'Espresso đậm vị kết hợp sữa tươi thanh trùng nóng và sốt caramel béo ngọt quyến rũ.',
      basePrice: 49000,
      ing1: ingArabica?.id || '', q1: 18,
      ing2: ingFreshMilk?.id || '', q2: 120,
    },

    // 4 Trà & Trà sữa mới
    {
      name: 'Trà Mãng Cầu Đắk Lắk Tươi',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=60',
      description: 'Vị chua ngọt thanh mát từ mãng cầu xiêm dầm tươi hòa cùng cốt trà lài thơm lừng.',
      basePrice: 42000,
      ing1: ingBlackTea?.id || '', q1: 15,
      ing2: ingPeach?.id || '', q2: 35,
    },
    {
      name: 'Trà Dâu Tằm Pha Lê Tuyết',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600&auto=format&fit=crop&q=60',
      description: 'Trà lài ủ lạnh kết hợp mứt dâu tằm Đà Lạt chua ngọt dịu và đá tuyết mát lạnh.',
      basePrice: 40000,
      ing1: ingBlackTea?.id || '', q1: 15,
      ing2: ingSugar?.id || '', q2: 20,
    },
    {
      name: 'Trà Lài Đác Thơm Sợi Dừa',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60',
      description: 'Hương nhài thanh nhã kết hợp hạt đác rim đường phèn dẻo dai và cùi dừa non ngọt bùi.',
      basePrice: 45000,
      ing1: ingOolongTea?.id || '', q1: 15,
      ing2: ingPeach?.id || '', q2: 30,
    },
    {
      name: 'Trà Sữa Thái Xanh Trân Châu Sợi',
      category: 'TEA',
      imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop&q=60',
      description: 'Hương trà Thái xanh đậm đà béo ngậy sữa tươi kết hợp trân châu sợi dẻo dai.',
      basePrice: 39000,
      ing1: ingOolongTea?.id || '', q1: 15,
      ing2: ingFreshMilk?.id || '', q2: 80,
    },

    // 4 Freeze & Đá xay mới
    {
      name: 'Matcha Đá Xay Đậu Đỏ Nhật Bản',
      category: 'FREEZE',
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=60',
      description: 'Bột trà xanh Uji cao cấp xay cùng sữa tươi, phủ kem whipping béo ngậy và đậu đỏ bùi.',
      basePrice: 55000,
      ing1: ingFreshMilk?.id || '', q1: 80,
      ing2: ingSugar?.id || '', q2: 20,
    },
    {
      name: 'Chocolate Cookie Băng Đảo',
      category: 'FREEZE',
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=60',
      description: 'Sốt socola Bỉ đậm đà xay tuyết mát lạnh, rắc vụn bánh cookie giòn rụm thơm lừng.',
      basePrice: 52000,
      ing1: ingFreshMilk?.id || '', q1: 80,
      ing2: ingCondensedMilk?.id || '', q2: 30,
    },
    {
      name: 'Chanh Tuyết Bạc Hà Sảng Khoái',
      category: 'FREEZE',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=60',
      description: 'Nước cốt chanh tươi xay nhuyễn cùng đá tuyết và siro bạc hà the mát tỉnh táo.',
      basePrice: 39000,
      ing1: ingSugar?.id || '', q1: 25,
      ing2: ingFreshMilk?.id || '', q2: 30,
    },
    {
      name: 'Xoài Dừa Đá Xay Nhiệt Đới',
      category: 'FREEZE',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=60',
      description: 'Xoài cát chín vàng ngọt lịm xay cùng nước cốt dừa Bến Tre thơm béo chuẩn vị hè.',
      basePrice: 49000,
      ing1: ingCondensedMilk?.id || '', q1: 30,
      ing2: ingFreshMilk?.id || '', q2: 50,
    },
  ];

  for (const item of newProducts) {
    const existing = await prisma.product.findFirst({ where: { name: item.name } });
    if (existing) continue;

    const p = await prisma.product.create({
      data: {
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        description: item.description,
        variants: {
          create: [
            { size: 'S', price: item.basePrice, topping: 'Tiêu chuẩn' },
            { size: 'M', price: item.basePrice + 6000, topping: 'Tiêu chuẩn' },
            { size: 'L', price: item.basePrice + 12000, topping: 'Tiêu chuẩn' },
          ],
        },
      },
      include: { variants: true },
    });

    for (const v of p.variants) {
      if (item.ing1) {
        await prisma.recipe.create({
          data: {
            variantId: v.id,
            ingredientId: item.ing1,
            quantityRequired: 20,
          },
        }).catch(() => {});
      }
      if (item.ing2) {
        await prisma.recipe.create({
          data: {
            variantId: v.id,
            ingredientId: item.ing2,
            quantityRequired: 30,
          },
        }).catch(() => {});
      }
    }
  }

  const total = await prisma.product.count();
  console.log(`🎉 Tổng số sản phẩm trong Database hiện tại: ${total} sản phẩm!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

