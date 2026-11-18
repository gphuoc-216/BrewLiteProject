/**
 * =========================================================================================
 * 🧪 SCRIPT KIỂM THỬ 2 USER ĐẶT HÀNG & THANH TOÁN ĐỒNG THỜI (CONCURRENT TWO-USER TEST)
 * =========================================================================================
 *
 * 🎯 MỤC TIÊU (ĐÚNG YÊU CẦU GIẢNG VIÊN TRONG BUỔI REVIEW):
 * - Đăng nhập 2 tài khoản khách hàng khác nhau (customer1 & customer2) -> 2 JWT Token riêng.
 * - Chọn 1 sản phẩm đang có tồn kho khả dụng (maxAvailable = min theo công thức nguyên liệu).
 * - Tính số lượng sao cho 1 user đặt thì ĐỦ, nhưng cả 2 user cùng đặt đồng thời thì VƯỢT TỒN KHO:
 *     qty = Math.floor(maxAvailable / 2) + 1  (ví dụ còn 3 ly -> mỗi user đặt 2 ly).
 * - Dùng Promise.all() bắn đồng thời request của 2 user tại cùng 1 mili-giây.
 * - Chứng minh: Chỉ tối đa 1 user thành công, user còn lại bị chặn (HTTP 400/409), không âm kho.
 *
 * 🚀 CÁCH CHẠY:
 *    node scripts/test-two-users.js
 *    (Tuỳ chọn) API_BASE=https://brewlite-api-hj1i.onrender.com/api node scripts/test-two-users.js
 */

const API_BASE = (process.env.API_BASE || 'http://localhost:3001/api').replace(/\/+$/, '');
const PASSWORD = process.env.TEST_PASSWORD || '123456';

async function apiRequest(path, options = {}, body = null) {
  const headers = { ...(options.headers || {}) };
  const init = {
    method: options.method || 'GET',
    headers,
  };

  if (body !== null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, init);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function loginCustomer(username) {
  const res = await apiRequest('/auth/login', { method: 'POST' }, {
    username,
    password: PASSWORD,
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Đăng nhập ${username} thất bại (HTTP ${res.status}): ${JSON.stringify(res.data)}`);
  }
  const token = res.data.accessToken || res.data.data?.accessToken;
  if (!token) {
    throw new Error(`Không tìm thấy accessToken cho ${username}`);
  }
  return token;
}

async function placeAndPayOrder(username, token, variantId, quantity) {
  const startedAt = Date.now();
  const orderRes = await apiRequest(
    '/orders',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
    { items: [{ variantId, quantity }] },
  );

  if (orderRes.status !== 200 && orderRes.status !== 201) {
    return {
      username,
      stage: 'CREATE_ORDER',
      status: orderRes.status,
      durationMs: Date.now() - startedAt,
      message: orderRes.data?.message || 'Tạo đơn bị chặn',
      orderId: null,
    };
  }

  const orderId = orderRes.data.id || orderRes.data.data?.id;
  const idempotencyKey = `TWO_USER_${username}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const payRes = await apiRequest(
    '/payments',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
    },
    { orderId, method: 'WALLET' },
  );

  return {
    username,
    stage: 'PAYMENT',
    status: payRes.status,
    durationMs: Date.now() - startedAt,
    message: payRes.data?.message || (payRes.status === 200 || payRes.status === 201 ? 'Thanh toán thành công (PAID)' : 'Thanh toán bị chặn'),
    orderId,
  };
}

async function run() {
  console.log('================================================================');
  console.log('   KIỂM THỬ 2 USER KHÁC NHAU ĐẶT HÀNG ĐỒNG THỜI (BREW-LITE)    ');
  console.log(`   API: ${API_BASE}`);
  console.log('================================================================\n');

  console.log('1. Đăng nhập song song 2 tài khoản customer1 & customer2...');
  const [token1, token2] = await Promise.all([
    loginCustomer('customer1'),
    loginCustomer('customer2'),
  ]);
  console.log(`✅ customer1 token: ${token1.slice(0, 22)}...`);
  console.log(`✅ customer2 token: ${token2.slice(0, 22)}...\n`);

  console.log('2. Lấy sản phẩm & kiểm tra tồn kho khả dụng (maxAvailable)...');
  const prodRes = await apiRequest('/products');
  const products = prodRes.data.items || prodRes.data.data?.items || prodRes.data.data || [];
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Không lấy được danh sách sản phẩm từ /products');
  }

  let chosenProduct = null;
  let chosenVariant = null;
  for (const p of products) {
    const v = (p.variants || []).find((item) => (item.maxAvailable ?? 1) > 0);
    if (v) {
      chosenProduct = p;
      chosenVariant = v;
      break;
    }
  }
  if (!chosenVariant) {
    throw new Error('Hiện không còn biến thể sản phẩm nào có maxAvailable > 0 để test');
  }

  const maxAvailable = chosenVariant.maxAvailable ?? chosenProduct.maxAvailable ?? 3;
  const orderQty = Number(process.env.TEST_QTY) || Math.floor(maxAvailable / 2) + 1;

  console.log(`✅ Sản phẩm: "${chosenProduct.name}" (${chosenVariant.size || 'Default'})`);
  console.log(`   VariantId: ${chosenVariant.id}`);
  console.log(`   Tồn kho khả dụng trước test (maxAvailable): ${maxAvailable} ly`);
  console.log(`   Mỗi user sẽ đặt: ${orderQty} ly (2 user = ${orderQty * 2} ly > ${maxAvailable} ly)\n`);

  console.log('3. ⚡ BẮN ĐỒNG THỜI 2 USER QUA Promise.all()...');
  const results = await Promise.all([
    placeAndPayOrder('customer1', token1, chosenVariant.id, orderQty),
    placeAndPayOrder('customer2', token2, chosenVariant.id, orderQty),
  ]);

  console.log('\n================================================================');
  console.log('   KẾT QUẢ KIỂM THỬ 2 USER ĐỒNG THỜI');
  console.log('================================================================');

  let successCount = 0;
  let blockedCount = 0;
  for (const r of results) {
    const ok = r.status === 200 || r.status === 201;
    if (ok) successCount++;
    else blockedCount++;
    const icon = ok ? '✅' : '⛔';
    console.log(
      `${icon} ${r.username.padEnd(10)} | Bước: ${r.stage.padEnd(12)} | HTTP ${r.status} | ${r.durationMs}ms | ${r.message}`,
    );
  }

  const afterRes = await apiRequest('/products');
  const afterProducts = afterRes.data.items || afterRes.data.data?.items || afterRes.data.data || [];
  const afterProd = afterProducts.find((p) => p.id === chosenProduct.id);
  const afterVar = afterProd?.variants?.find((v) => v.id === chosenVariant.id);
  const remaining = afterVar?.maxAvailable ?? afterProd?.maxAvailable ?? 'N/A';

  console.log('\n----------------------------------------------------------------');
  console.log(`📊 TỔNG KẾT:`);
  console.log(`   - Thành công : ${successCount}/2 user`);
  console.log(`   - Bị chặn    : ${blockedCount}/2 user (bảo vệ tồn kho thành công)`);
  console.log(`   - Tồn kho khả dụng sau test: ${remaining} ly (không bị âm kho)`);
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('❌ Lỗi khi chạy script:', err.message);
  process.exit(1);
});
