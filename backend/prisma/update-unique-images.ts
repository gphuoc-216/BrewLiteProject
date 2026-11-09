const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const productImages = {
  // --- COFFEE (10 món) ---
  'Cà phê Sữa Đá Truyền Thống': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'Cà Phê Muối Xứ Huế': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80',
  'Cà phê Đen Đá Đậm Vị': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
  'Cà Phê Trứng Hà Nội': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&auto=format&fit=crop&q=80',
  'Americano Đá Tỉnh Táo': 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&auto=format&fit=crop&q=80',
  'Cold Brew Cam Vàng Băng Đăng': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
  'Cappuccino Ý Bọt Mịn': 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
  'Caramel Macchiato Nóng': 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
  'Latte Hạt Dẻ Thơm Béo': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
  'Bạc Xỉu Sữa Tươi 3 Tầng': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=600&auto=format&fit=crop&q=80',

  // --- FREEZE / ĐÁ XAY (6 món) ---
  'Cà Phê Cốt Dừa Bến Tre': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
  'Freeze Cà Phê Bánh Oreo': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80',
  'Chocolate Cookie Băng Đảo': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
  'Matcha Đá Xay Đậu Đỏ Nhật Bản': 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
  'Chanh Tuyết Bạc Hà Sảng Khoái': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  'Xoài Dừa Đá Xay Nhiệt Đới': 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop&q=80',

  // --- TEA / TRÀ & TRÀ SỮA (8 món) ---
  'Trà Đào Cam Sả Tươi Mát': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
  'Trà Mãng Cầu Đắk Lắk Tươi': 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&auto=format&fit=crop&q=80',
  'Trà Sữa Ô Long Nướng Trân Châu': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop&q=80',
  'Trà Sữa Thái Xanh Trân Châu Sợi': 'https://images.unsplash.com/photo-1717398804998-ad2d48822518?w=600&auto=format&fit=crop&q=80',
  'Trà Sen Vàng Macchiato': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'Trà Lài Đác Thơm Sợi Dừa': 'https://images.unsplash.com/photo-1681974913878-1c446bac7cf5?w=600&auto=format&fit=crop&q=80',
  'Trà Vải Hoa Hồng Băng Tuyết': 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600&auto=format&fit=crop&q=80',
  'Trà Dâu Tằm Pha Lê Tuyết': 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=600&auto=format&fit=crop&q=80',
};

async function main() {
  console.log('🔄 Đang cập nhật 24 hình ảnh đồ uống hoàn toàn riêng biệt...');
  let updatedCount = 0;
  for (const [name, imageUrl] of Object.entries(productImages)) {
    const res = await prisma.product.updateMany({
      where: { name: { contains: name.trim() } },
      data: { imageUrl },
    });
    if (res.count > 0) {
      console.log(`✅ [${res.count}] ${name} -> ${imageUrl.slice(0, 50)}...`);
      updatedCount += res.count;
    } else {
      console.warn(`⚠️ Không tìm thấy món: ${name}`);
    }
  }
  console.log(`\n🎉 Đã cập nhật thành công ${updatedCount} món nước trong Database!`);

  // Verify unique check
  const all = await prisma.product.findMany({ select: { id: true, name: true, imageUrl: true } });
  const uniqueUrls = new Set(all.map((p) => p.imageUrl));
  console.log(`📊 Tổng món: ${all.length} | Số ảnh độc nhất (Unique URLs): ${uniqueUrls.size}`);
  if (all.length === uniqueUrls.size) {
    console.log('🌟 100% HOÀN TOÀN KHÔNG CÒN BỊ TRÙNG BẤT KỲ ẢNH NÀO!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

