export interface ToppingOption {
  id: string;
  name: string;
  price: number;
  desc: string;
  imageUrl: string;
}

export const ALL_TOPPINGS: ToppingOption[] = [
  {
    id: 'tran-chau-trang',
    name: 'Trân châu trắng 3Q',
    price: 6000,
    desc: 'Hạt ngọc trai 3Q giòn sần sật trong veo, thanh mát',
    imageUrl: '/toppings/tran-chau-trang.svg',
  },
  {
    id: 'nha-dam',
    name: 'Nha đam thanh mát',
    price: 7000,
    desc: 'Hạt lựu nha đam mọng nước giòn ngọt giải nhiệt',
    imageUrl: '/toppings/nha-dam.svg',
  },
  {
    id: 'hat-dac',
    name: 'Hạt đác rim đường phèn',
    price: 8000,
    desc: 'Hạt đác dẻo quánh ngọt bùi thơm lừng chuẩn vị',
    imageUrl: '/toppings/hat-dac.svg',
  },
  {
    id: 'thach-dao',
    name: 'Thạch đào giòn sần sật',
    price: 8000,
    desc: 'Miếng đào ngâm vàng giòn ngọt ngào thanh khiết',
    imageUrl: '/toppings/thach-dao.svg',
  },
  {
    id: 'tran-chau-den',
    name: 'Trân châu đường đen',
    price: 6000,
    desc: 'Trân châu dẻo dai đượm sốt mật mía đường đen',
    imageUrl: '/toppings/boba.svg',
  },
  {
    id: 'hat-sen',
    name: 'Hạt sen ninh đường phèn',
    price: 10000,
    desc: 'Hạt sen bùi béo ninh mềm nở căng ngọt dịu chuẩn vị',
    imageUrl: '/toppings/hat-sen.svg',
  },
  {
    id: 'khuc-bach',
    name: 'Khúc bạch phô mai',
    price: 9000,
    desc: 'Từng viên khúc bạch phô mai béo ngậy mềm mịn núng nính',
    imageUrl: '/toppings/khuc-bach.svg',
  },
  {
    id: 'cheese',
    name: 'Kem Cheese Macchiato',
    price: 10000,
    desc: 'Váng phô mai béo mặn sánh mịn thơm lừng phủ trên ly',
    imageUrl: '/toppings/kem-cheese.svg',
  },
  {
    id: 'espresso-shot',
    name: 'Thêm 1 Shot Espresso',
    price: 12000,
    desc: 'Tăng cường vị đắng đậm đà đánh thức tỉnh táo tức thì',
    imageUrl: '/toppings/espresso-shot.svg',
  },
  {
    id: 'oreo-crunch',
    name: 'Vụn bánh Oreo giòn',
    price: 8000,
    desc: 'Vụn bánh socola Oreo giòn rụm thơm lừng',
    imageUrl: '/toppings/oreo-crunch.svg',
  },
  {
    id: 'thach-ca-phe',
    name: 'Thạch cà phê sương sáo',
    price: 7000,
    desc: 'Thạch đen giòn dai thơm nồng nàn hương cà phê',
    imageUrl: '/toppings/thach-ca-phe.svg',
  },
  {
    id: 'kem-tra-sua',
    name: 'Thêm kem trà sữa',
    price: 10000,
    desc: 'Lớp kem trà sữa sánh mịn thơm béo ngậy',
    imageUrl: '/toppings/kem-tra-sua.svg',
  },
];

/**
 * Phân phối Topping CHÍNH XÁC & ĐA DẠNG theo từng loại món thực tế
 * (Mô típ chuẩn các chuỗi cafe hiện đại: Highlands / Phúc Long / Katinat / Phê La / The Coffee House):
 */
export function getToppingsForProduct(product: { category?: string; name?: string } | null): ToppingOption[] {
  if (!product) return ALL_TOPPINGS.slice(0, 6);
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toUpperCase();

  const getTop = (id: string) => ALL_TOPPINGS.find((t) => t.id === id);

  // 1. Trà Sen Vàng (Highlands style)
  if (name.includes('sen vàng') || name.includes('hạt sen')) {
    return [
      getTop('hat-sen')!,
      getTop('cheese')!,
      getTop('tran-chau-trang')!,
      getTop('khuc-bach')!,
      getTop('tran-chau-den')!,
      getTop('nha-dam')!,
    ].filter(Boolean);
  }

  // 2. Trà Mãng Cầu Đắk Lắk Tươi
  if (name.includes('mãng cầu')) {
    return [
      getTop('hat-dac')!,
      getTop('tran-chau-trang')!,
      getTop('nha-dam')!,
      getTop('thach-dao')!,
      getTop('cheese')!,
    ].filter(Boolean);
  }

  // 3. Trà Đào Cam Sả
  if (name.includes('đào')) {
    return [
      getTop('thach-dao')!,
      getTop('tran-chau-trang')!,
      getTop('nha-dam')!,
      getTop('hat-dac')!,
      getTop('cheese')!,
    ].filter(Boolean);
  }

  // 4. Trà Vải Hoa Hồng / Trà Dâu Tằm / Trà Lài
  if (name.includes('vải') || name.includes('dâu') || name.includes('đác') || name.includes('lài')) {
    return [
      getTop('tran-chau-trang')!,
      getTop('nha-dam')!,
      getTop('thach-dao')!,
      getTop('hat-dac')!,
      getTop('hat-sen')!,
      getTop('cheese')!,
    ].filter(Boolean);
  }

  // 5. Trà Sữa (Trà Sữa Ô Long Nướng, Trà Sữa Thái Xanh,...)
  const isMilkTea =
    name.includes('trà sữa') ||
    name.includes('thái xanh') ||
    name.includes('hồng trà sữa') ||
    name.includes('ô long');

  if (isMilkTea) {
    return [
      getTop('tran-chau-den')!,
      getTop('tran-chau-trang')!,
      getTop('khuc-bach')!,
      getTop('cheese')!,
      getTop('kem-tra-sua')!,
      getTop('thach-ca-phe')!,
    ].filter(Boolean);
  }

  // 6. Trà Trái Cây giải nhiệt chung
  if (category === 'TEA') {
    return [
      getTop('tran-chau-trang')!,
      getTop('thach-dao')!,
      getTop('nha-dam')!,
      getTop('hat-dac')!,
      getTop('hat-sen')!,
      getTop('cheese')!,
    ].filter(Boolean);
  }

  // 7. Cà phê (Cà phê sữa đá, đen đá, bạc xỉu, muối, trứng, cold brew,...)
  if (category === 'COFFEE') {
    const list = [
      getTop('espresso-shot')!,
      getTop('cheese')!,
      getTop('thach-ca-phe')!,
      getTop('tran-chau-den')!,
      getTop('kem-tra-sua')!,
      getTop('tran-chau-trang')!,
    ];
    return list.filter(Boolean);
  }

  // 8. Freeze & Đá xay (Oreo, matcha đậu đỏ, socola, xoài dừa, chanh tuyết, cốt dừa,...)
  if (category === 'FREEZE') {
    const isCoffeeFreeze = name.includes('cà phê') || name.includes('coffee') || name.includes('cốt dừa');
    if (isCoffeeFreeze) {
      return [
        getTop('oreo-crunch')!,
        getTop('espresso-shot')!,
        getTop('thach-ca-phe')!,
        getTop('cheese')!,
        getTop('tran-chau-den')!,
        getTop('tran-chau-trang')!,
      ].filter(Boolean);
    }
    return [
      getTop('oreo-crunch')!,
      getTop('tran-chau-trang')!,
      getTop('cheese')!,
      getTop('nha-dam')!,
      getTop('thach-dao')!,
      getTop('khuc-bach')!,
    ].filter(Boolean);
  }

  return ALL_TOPPINGS.slice(0, 6);
}
