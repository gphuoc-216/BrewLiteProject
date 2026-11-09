export interface ToppingItem {
  id: string;
  name: string;
  price: number;
  desc?: string;
}

export const TOPPING_CATALOG: ToppingItem[] = [
  { id: 'tran-chau-den', name: 'Trân châu đường đen', price: 6000, desc: 'Dẻo dai thơm lừng mật mía' },
  { id: 'tran-chau-trang', name: 'Trân châu trắng 3Q', price: 6000, desc: 'Giòn sần sật thanh mát' },
  { id: 'thach-dao', name: 'Thạch đào giòn sần sật', price: 8000, desc: 'Miếng đào ngâm giòn ngọt thanh mát' },
  { id: 'nha-dam', name: 'Nha đam thanh mát', price: 7000, desc: 'Hạt lựu nha đam giòn ngọt thanh nhiệt' },
  { id: 'hat-dac', name: 'Hạt đác rim đường phèn', price: 8000, desc: 'Dẻo quánh ngọt bùi thơm lừng' },
  { id: 'khuc-bach', name: 'Khúc bạch phô mai', price: 9000, desc: 'Béo ngậy mềm mịn núng nính' },
  { id: 'cheese', name: 'Kem Cheese Macchiato', price: 10000, desc: 'Váng phô mai béo mặn sánh mịn' },
  { id: 'kem-tra-sua', name: 'Thêm kem trà sữa', price: 10000, desc: 'Đậm đà ngậy béo chuẩn vị' },
  { id: 'espresso-shot', name: 'Thêm 1 Shot Espresso', price: 12000, desc: 'Tăng cường vị đắng đậm đà tỉnh táo' },
  { id: 'oreo-crunch', name: 'Vụn bánh Oreo giòn', price: 8000, desc: 'Vụn bánh socola Oreo giòn rụm' },
  { id: 'thach-ca-phe', name: 'Thạch cà phê sương sáo', price: 7000, desc: 'Thạch đen giòn thơm cà phê' },
];

export function calculateToppingsExtraPrice(toppings?: string[]): number {
  if (!toppings || !Array.isArray(toppings)) return 0;
  return toppings.reduce((sum, name) => {
    const rawName = name.trim().toLowerCase();
    const item = TOPPING_CATALOG.find(
      (t) =>
        t.id.toLowerCase() === rawName ||
        t.name.toLowerCase() === rawName ||
        t.name.toLowerCase().includes(rawName) ||
        rawName.includes(t.name.toLowerCase()),
    );
    return sum + (item ? item.price : 0);
  }, 0);
}
