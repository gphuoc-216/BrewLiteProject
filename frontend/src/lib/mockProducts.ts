export interface MockProduct {
  id: string;
  name: string;
  category: 'COFFEE' | 'TEA' | 'FREEZE';
  imageUrl: string;
  description: string;
  minPrice: number;
  rating: number;
  reviewCount: number;
  variants: Array<{
    id: string;
    size: 'S' | 'M' | 'L';
    price: number;
    topping?: string;
  }>;
  reviews?: Array<{
    id: string;
    stars: number;
    content: string;
    createdAt: string;
    customer: { fullName: string };
  }>;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-001',
    name: 'Cà phê Sữa Đá Truyền Thống',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    description: 'Hạt cà phê Robusta rang đậm kết hợp sữa đặc ngọt ngào béo ngậy chuẩn vị Sài Gòn.',
    minPrice: 29000,
    rating: 4.9,
    reviewCount: 128,
    variants: [
      { id: 'var-001-s', size: 'S', price: 29000 },
      { id: 'var-001-m', size: 'M', price: 35000 },
      { id: 'var-001-l', size: 'L', price: 42000 },
    ],
    reviews: [
      { id: 'rev-1', stars: 5, content: 'Đậm đà, thơm mùi cà phê rang mộc rất thích!', createdAt: '2026-03-15', customer: { fullName: 'Nguyễn Văn Minh' } },
      { id: 'rev-2', stars: 5, content: 'Vị ngọt vừa phải, uống buổi sáng tỉnh táo cả ngày.', createdAt: '2026-03-20', customer: { fullName: 'Lê Thuỳ Dung' } },
    ],
  },
  {
    id: 'prod-002',
    name: 'Cà phê Đen Đá Đậm Vị',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    description: 'Vị đắng thuần khiết, hương thơm nồng nàn từ 100% Robusta Đắk Lắk nguyên chất.',
    minPrice: 25000,
    rating: 4.8,
    reviewCount: 96,
    variants: [
      { id: 'var-002-s', size: 'S', price: 25000 },
      { id: 'var-002-m', size: 'M', price: 30000 },
      { id: 'var-002-l', size: 'L', price: 36000 },
    ],
  },
  {
    id: 'prod-003',
    name: 'Bạc Xỉu Sữa Tươi 3 Tầng',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80',
    description: 'Sự hòa quyện êm dịu giữa sữa đặc, sữa tươi thanh trùng và lớp cà phê thơm lừng.',
    minPrice: 35000,
    rating: 4.9,
    reviewCount: 145,
    variants: [
      { id: 'var-003-s', size: 'S', price: 35000 },
      { id: 'var-003-m', size: 'M', price: 42000 },
      { id: 'var-003-l', size: 'L', price: 48000 },
    ],
  },
  {
    id: 'prod-004',
    name: 'Americano Đá Tỉnh Táo',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&auto=format&fit=crop&q=80',
    description: 'Chiết xuất từ hạt Arabica thơm chua thanh khiết, thêm nước đá mát lạnh sảng khoái.',
    minPrice: 35000,
    rating: 4.7,
    reviewCount: 78,
    variants: [
      { id: 'var-004-s', size: 'S', price: 35000 },
      { id: 'var-004-m', size: 'M', price: 42000 },
    ],
  },
  {
    id: 'prod-005',
    name: 'Cappuccino Ý Bọt Mịn',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
    description: 'Espresso đậm đà kết hợp sữa nóng đánh bọt mịn màng như nhung rắc bột cacao.',
    minPrice: 45000,
    rating: 4.9,
    reviewCount: 88,
    variants: [
      { id: 'var-005-s', size: 'S', price: 45000 },
      { id: 'var-005-m', size: 'M', price: 52000 },
    ],
  },
  {
    id: 'prod-006',
    name: 'Latte Hạt Dẻ Thơm Béo',
    category: 'COFFEE',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
    description: 'Hương vị nhẹ nhàng, ngọt dịu thích hợp cho những ai yêu thích vị sữa ngậy.',
    minPrice: 49000,
    rating: 4.8,
    reviewCount: 65,
    variants: [
      { id: 'var-006-s', size: 'S', price: 49000 },
      { id: 'var-006-m', size: 'M', price: 56000 },
    ],
  },
  {
    id: 'prod-007',
    name: 'Trà Đào Cam Sả Tươi Mát',
    category: 'TEA',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    description: 'Trà đen ủ lạnh kết hợp đào miếng giòn sần sật, sả đập dập và nước cốt cam tươi.',
    minPrice: 39000,
    rating: 4.9,
    reviewCount: 172,
    variants: [
      { id: 'var-007-m', size: 'M', price: 39000 },
      { id: 'var-007-l', size: 'L', price: 46000 },
    ],
  },
  {
    id: 'prod-008',
    name: 'Trà Sữa Ô Long Nướng Trân Châu',
    category: 'TEA',
    imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop&q=80',
    description: 'Hương vị trà nướng thơm khói đặc trưng kết hợp sữa béo ngậy và trân châu dai mềm.',
    minPrice: 42000,
    rating: 5.0,
    reviewCount: 210,
    variants: [
      { id: 'var-008-m', size: 'M', price: 42000 },
      { id: 'var-008-l', size: 'L', price: 49000 },
    ],
  },
  {
    id: 'prod-009',
    name: 'Trà Sen Vàng Macchiato',
    category: 'TEA',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    description: 'Hạt sen bùi béo ninh mềm, nước trà thanh nhẹ phủ lớp kem phô mai Macchiato sánh mịn.',
    minPrice: 45000,
    rating: 4.9,
    reviewCount: 135,
    variants: [
      { id: 'var-009-m', size: 'M', price: 45000 },
      { id: 'var-009-l', size: 'L', price: 52000 },
    ],
  },
  {
    id: 'prod-010',
    name: 'Trà Vải Hoa Hồng Băng Tuyết',
    category: 'TEA',
    imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=600&auto=format&fit=crop&q=80',
    description: 'Nước cốt trà đen thanh khiết kết hợp hương vải ngọt lịm và cánh hoa hồng phảng phất.',
    minPrice: 40000,
    rating: 4.7,
    reviewCount: 84,
    variants: [
      { id: 'var-010-m', size: 'M', price: 40000 },
      { id: 'var-010-l', size: 'L', price: 47000 },
    ],
  },
  {
    id: 'prod-011',
    name: 'Freeze Cà Phê Bánh Oreo',
    category: 'FREEZE',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
    description: 'Đá xay bông tuyết với cà phê Robusta, vụn bánh Oreo giòn tan và kem tươi bông xốp.',
    minPrice: 49000,
    rating: 4.9,
    reviewCount: 160,
    variants: [
      { id: 'var-011-m', size: 'M', price: 49000 },
      { id: 'var-011-l', size: 'L', price: 57000 },
    ],
  },
  {
    id: 'prod-012',
    name: 'Cà Phê Cốt Dừa Bến Tre',
    category: 'FREEZE',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    description: 'Món nước đặc sản đá xay cốt dừa ngọt béo hòa cùng vị cà phê đắng nồng nàn.',
    minPrice: 49000,
    rating: 4.8,
    reviewCount: 114,
    variants: [
      { id: 'var-012-m', size: 'M', price: 49000 },
      { id: 'var-012-l', size: 'L', price: 57000 },
    ],
  },
];
