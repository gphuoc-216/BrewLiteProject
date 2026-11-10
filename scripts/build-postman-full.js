const fs = require('fs');
const path = require('path');

const basePath = 'C:/Users/Lenovo/Desktop/tong hop/Assigment1';
const p7CollectionPath = path.join(basePath, 'docs/BrewLite_P7_Core_Business_Collection.postman_collection.json');
const outputPath = path.join(basePath, 'docs/BrewLite_Full_API_Collection.postman_collection.json');

// Read existing P7 collection
const p7 = JSON.parse(fs.readFileSync(p7CollectionPath, 'utf8'));

// Helper to make test script that updates both environment and collectionVariables
function makeScript(lines) {
  return [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: lines
      }
    }
  ];
}

// 0. Khởi tạo & Đăng nhập (Auth & Profile)
const folder0 = {
  name: '0. Khởi tạo & Đăng nhập (Auth & Profile)',
  item: [
    {
      name: '0.1 Đăng nhập Customer',
      event: makeScript([
        'const res = pm.response.json();',
        'const token = res.accessToken || res.data?.accessToken;',
        'pm.environment.set("customerToken", token);',
        'pm.collectionVariables.set("customerToken", token);',
        'pm.test("Đăng nhập Customer thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '    pm.expect(token).to.be.a("string");',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ username: 'customer1', password: 'password123' }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/auth/login',
          host: ['{{baseUrl}}'],
          path: ['auth', 'login']
        }
      }
    },
    {
      name: '0.2 Đăng nhập Barista (Staff)',
      event: makeScript([
        'const res = pm.response.json();',
        'const token = res.accessToken || res.data?.accessToken;',
        'pm.environment.set("staffToken", token);',
        'pm.collectionVariables.set("staffToken", token);',
        'pm.test("Đăng nhập Barista thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '    pm.expect(token).to.be.a("string");',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ username: 'barista1', password: 'password123' }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/auth/login',
          host: ['{{baseUrl}}'],
          path: ['auth', 'login']
        }
      }
    },
    {
      name: '0.3 Đăng nhập Admin',
      event: makeScript([
        'const res = pm.response.json();',
        'const token = res.accessToken || res.data?.accessToken;',
        'pm.environment.set("adminToken", token);',
        'pm.collectionVariables.set("adminToken", token);',
        'pm.test("Đăng nhập Admin thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '    pm.expect(token).to.be.a("string");',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ username: 'admin', password: 'password123' }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/auth/login',
          host: ['{{baseUrl}}'],
          path: ['auth', 'login']
        }
      }
    },
    {
      name: '0.4 Xem Profile hiện tại kèm Role (/auth/me)',
      event: makeScript([
        'const res = pm.response.json();',
        'pm.test("Lấy profile thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '    pm.expect(res.role).to.be.oneOf(["CUSTOMER", "STAFF", "ADMIN"]);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{customerToken}}' }],
        url: {
          raw: '{{baseUrl}}/auth/me',
          host: ['{{baseUrl}}'],
          path: ['auth', 'me']
        }
      }
    },
    {
      name: '0.5 Đăng ký khách hàng mới (/auth/register)',
      event: makeScript([
        'pm.test("Đăng ký khách hàng mới hoàn tất (HTTP 201 hoặc 409 nếu trùng)", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([201, 409]);',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            username: 'new_customer_' + Date.now().toString().slice(-4),
            password: 'password123',
            email: 'user_' + Date.now().toString().slice(-4) + '@example.com',
            fullName: 'Nguyen Van Test',
            phone: '090' + Math.floor(1000000 + Math.random() * 9000000)
          }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/auth/register',
          host: ['{{baseUrl}}'],
          path: ['auth', 'register']
        }
      }
    },
    {
      name: '0.6 Kiểm tra hệ thống (Health Check)',
      event: makeScript([
        'pm.test("Server Backend phản hồi tốt (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        url: {
          raw: '{{baseUrl}}/health',
          host: ['{{baseUrl}}'],
          path: ['health']
        }
      }
    }
  ]
};

// 1. Thực đơn & Khuyến mãi (Menu & Vouchers)
const folder1 = {
  name: '1. Thực đơn & Khuyến mãi (Menu & Vouchers)',
  item: [
    {
      name: '1.1 Lấy danh sách sản phẩm Menu (Tự động lưu Variant ID)',
      event: makeScript([
        'const res = pm.response.json();',
        'const items = res.items || res.data?.items || (Array.isArray(res) ? res : []);',
        'pm.test("Lấy Menu sản phẩm thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '    pm.expect(items.length).to.be.above(0);',
        '});',
        'if (items.length > 0) {',
        '    const prod = items[0];',
        '    pm.environment.set("testProductId", prod.id);',
        '    pm.collectionVariables.set("testProductId", prod.id);',
        '    if (prod.variants && prod.variants.length > 0) {',
        '        pm.environment.set("testVariantId", prod.variants[0].id);',
        '        pm.collectionVariables.set("testVariantId", prod.variants[0].id);',
        '    }',
        '}'
      ]),
      request: {
        method: 'GET',
        url: {
          raw: '{{baseUrl}}/products',
          host: ['{{baseUrl}}'],
          path: ['products']
        }
      }
    },
    {
      name: '1.2 Xem chi tiết sản phẩm theo ID',
      event: makeScript([
        'pm.test("Lấy chi tiết sản phẩm thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        url: {
          raw: '{{baseUrl}}/products/{{testProductId}}',
          host: ['{{baseUrl}}'],
          path: ['products', '{{testProductId}}']
        }
      }
    },
    {
      name: '1.3 Lấy danh sách Topping',
      event: makeScript([
        'pm.test("Lấy danh sách Topping thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        url: {
          raw: '{{baseUrl}}/products/toppings',
          host: ['{{baseUrl}}'],
          path: ['products', 'toppings']
        }
      }
    },
    {
      name: '1.4 Danh sách Voucher khả dụng',
      event: makeScript([
        'pm.test("Lấy danh sách Voucher thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        url: {
          raw: '{{baseUrl}}/promotions/available',
          host: ['{{baseUrl}}'],
          path: ['promotions', 'available']
        }
      }
    },
    {
      name: '1.5 Kiểm tra hợp lệ Voucher (Validate Promo Code)',
      event: makeScript([
        'pm.test("Kiểm tra Voucher hoàn tất (HTTP 200 hoặc 400)", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 400]);',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ code: 'BREW10', orderSubtotal: 50000 }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/promotions/validate',
          host: ['{{baseUrl}}'],
          path: ['promotions', 'validate']
        }
      }
    }
  ]
};

// 2. Đặt hàng & Lịch sử đơn (Orders)
const folder2 = {
  name: '2. Đặt hàng & Lịch sử đơn (Orders)',
  item: [
    {
      name: '2.1 Tạo đơn hàng mới (Tự động lưu activeOrderId)',
      event: makeScript([
        'const res = pm.response.json();',
        'const orderId = res.id || res.data?.id;',
        'pm.environment.set("activeOrderId", orderId);',
        'pm.collectionVariables.set("activeOrderId", orderId);',
        'pm.test("Tạo đơn hàng mới thành công (HTTP 201)", () => {',
        '    pm.response.to.have.status(201);',
        '    pm.expect(orderId).to.be.a("string");',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [
          { key: 'Authorization', value: 'Bearer {{customerToken}}' },
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            items: [
              {
                variantId: '{{testVariantId}}',
                quantity: 1
              }
            ]
          }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/orders',
          host: ['{{baseUrl}}'],
          path: ['orders']
        }
      }
    },
    {
      name: '2.2 Xem lịch sử đơn của tôi (/orders/me)',
      event: makeScript([
        'pm.test("Lấy lịch sử đơn hàng thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{customerToken}}' }],
        url: {
          raw: '{{baseUrl}}/orders/me',
          host: ['{{baseUrl}}'],
          path: ['orders', 'me']
        }
      }
    },
    {
      name: '2.3 Xem chi tiết 1 đơn hàng (/orders/:id)',
      event: makeScript([
        'pm.test("Xem chi tiết đơn hàng thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{customerToken}}' }],
        url: {
          raw: '{{baseUrl}}/orders/{{activeOrderId}}',
          host: ['{{baseUrl}}'],
          path: ['orders', '{{activeOrderId}}']
        }
      }
    },
    {
      name: '2.4 Hủy đơn hàng PENDING (/orders/:id/cancel)',
      event: makeScript([
        'pm.test("Hủy đơn hàng hoàn tất (HTTP 200 hoặc 201)", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Authorization', value: 'Bearer {{customerToken}}' }],
        url: {
          raw: '{{baseUrl}}/orders/{{activeOrderId}}/cancel',
          host: ['{{baseUrl}}'],
          path: ['orders', '{{activeOrderId}}', 'cancel']
        }
      }
    }
  ]
};

// 3. Đánh giá món ăn (Reviews)
const folder3 = {
  name: '3. Đánh giá món ăn (Reviews)',
  item: [
    {
      name: '3.1 Gửi đánh giá món (Tự động lưu reviewId)',
      event: makeScript([
        'const res = pm.response.json();',
        'if (res.id || res.data?.id) {',
        '    const revId = res.id || res.data?.id;',
        '    pm.environment.set("reviewId", revId);',
        '    pm.collectionVariables.set("reviewId", revId);',
        '}',
        'pm.test("Gửi đánh giá món hoàn tất (HTTP 201 hoặc 403 nếu chưa mua)", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([201, 400, 403]);',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [
          { key: 'Authorization', value: 'Bearer {{customerToken}}' },
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            productId: '{{testProductId}}',
            rating: 5,
            comment: 'Cà phê rất thơm và đậm đà!'
          }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/reviews',
          host: ['{{baseUrl}}'],
          path: ['reviews']
        }
      }
    },
    {
      name: '3.2 Cập nhật đánh giá món',
      event: makeScript([
        'pm.test("Cập nhật đánh giá hoàn tất", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 404]);',
        '});'
      ]),
      request: {
        method: 'PATCH',
        header: [
          { key: 'Authorization', value: 'Bearer {{customerToken}}' },
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            rating: 4,
            comment: 'Cập nhật lại: Đồ uống ngon, phục vụ nhanh!'
          }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/reviews/{{reviewId}}',
          host: ['{{baseUrl}}'],
          path: ['reviews', '{{reviewId}}']
        }
      }
    },
    {
      name: '3.3 Xóa đánh giá món',
      event: makeScript([
        'pm.test("Xóa đánh giá hoàn tất", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 204, 404]);',
        '});'
      ]),
      request: {
        method: 'DELETE',
        header: [{ key: 'Authorization', value: 'Bearer {{customerToken}}' }],
        url: {
          raw: '{{baseUrl}}/reviews/{{reviewId}}',
          host: ['{{baseUrl}}'],
          path: ['reviews', '{{reviewId}}']
        }
      }
    }
  ]
};

// 4. Quy trình Barista (Staff / Barista Flow)
const folder4 = {
  name: '4. Quy trình Barista (Staff / Barista Flow)',
  item: [
    {
      name: '4.1 Danh sách đơn cần chế biến (/staff/orders)',
      event: makeScript([
        'pm.test("Lấy danh sách đơn chế biến thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
        url: {
          raw: '{{baseUrl}}/staff/orders',
          host: ['{{baseUrl}}'],
          path: ['staff', 'orders']
        }
      }
    },
    {
      name: '4.2 Xem công thức pha chế của đơn (/staff/orders/:id/recipes)',
      event: makeScript([
        'pm.test("Xem công thức hoàn tất (HTTP 200 hoặc 404)", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 404]);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
        url: {
          raw: '{{baseUrl}}/staff/orders/{{activeOrderId}}/recipes',
          host: ['{{baseUrl}}'],
          path: ['staff', 'orders', '{{activeOrderId}}', 'recipes']
        }
      }
    },
    {
      name: '4.3 Barista nhận đơn (PAID -> PREPARING)',
      event: makeScript([
        'pm.test("Barista nhận đơn hoàn tất", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 400, 409]);',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
        url: {
          raw: '{{baseUrl}}/staff/orders/{{activeOrderId}}/accept',
          host: ['{{baseUrl}}'],
          path: ['staff', 'orders', '{{activeOrderId}}', 'accept']
        }
      }
    },
    {
      name: '4.4 Pha chế xong (PREPARING -> READY)',
      event: makeScript([
        'pm.test("Barista pha xong hoàn tất", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 400, 409]);',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
        url: {
          raw: '{{baseUrl}}/staff/orders/{{activeOrderId}}/ready',
          host: ['{{baseUrl}}'],
          path: ['staff', 'orders', '{{activeOrderId}}', 'ready']
        }
      }
    },
    {
      name: '4.5 Hoàn thành giao khách (READY -> COMPLETED)',
      event: makeScript([
        'pm.test("Giao khách hoàn tất", () => {',
        '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 400, 409]);',
        '});'
      ]),
      request: {
        method: 'POST',
        header: [{ key: 'Authorization', value: 'Bearer {{staffToken}}' }],
        url: {
          raw: '{{baseUrl}}/staff/orders/{{activeOrderId}}/complete',
          host: ['{{baseUrl}}'],
          path: ['staff', 'orders', '{{activeOrderId}}', 'complete']
        }
      }
    }
  ]
};

// 5. Quản trị hệ thống (Admin Portal)
const folder5 = {
  name: '5. Quản trị hệ thống (Admin Portal)',
  item: [
    {
      name: '5.1 Thống kê tổng quan (/admin/stats/overview)',
      event: makeScript([
        'pm.test("Xem thống kê tổng quan thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/stats/overview',
          host: ['{{baseUrl}}'],
          path: ['admin', 'stats', 'overview']
        }
      }
    },
    {
      name: '5.2 Doanh thu theo ngày (/admin/stats/revenue)',
      event: makeScript([
        'pm.test("Xem doanh thu thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/stats/revenue',
          host: ['{{baseUrl}}'],
          path: ['admin', 'stats', 'revenue']
        }
      }
    },
    {
      name: '5.3 Top sản phẩm bán chạy (/admin/stats/top-products)',
      event: makeScript([
        'pm.test("Xem top sản phẩm thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/stats/top-products',
          host: ['{{baseUrl}}'],
          path: ['admin', 'stats', 'top-products']
        }
      }
    },
    {
      name: '5.4 Tỷ trọng đơn hàng theo trạng thái (/admin/stats/orders-by-status)',
      event: makeScript([
        'pm.test("Xem tỷ trọng đơn hàng thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/stats/orders-by-status',
          host: ['{{baseUrl}}'],
          path: ['admin', 'stats', 'orders-by-status']
        }
      }
    },
    {
      name: '5.5 Xem tồn kho nguyên liệu (Tự động lưu robustaId)',
      event: makeScript([
        'const res = pm.response.json();',
        'const items = Array.isArray(res) ? res : (res.items || res.data || []);',
        'pm.test("Lấy kho nguyên liệu thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});',
        'const robusta = items.find(i => i.name && i.name.toLowerCase().includes("robusta")) || items[0];',
        'if (robusta) {',
        '    pm.environment.set("robustaId", robusta.id);',
        '    pm.collectionVariables.set("robustaId", robusta.id);',
        '}'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/ingredients',
          host: ['{{baseUrl}}'],
          path: ['admin', 'ingredients']
        }
      }
    },
    {
      name: '5.6 Cập nhật tồn kho Robusta (/admin/ingredients/:id)',
      event: makeScript([
        'pm.test("Cập nhật tồn kho thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'PATCH',
        header: [
          { key: 'Authorization', value: 'Bearer {{adminToken}}' },
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ stock: 30000 }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/admin/ingredients/{{robustaId}}',
          host: ['{{baseUrl}}'],
          path: ['admin', 'ingredients', '{{robustaId}}']
        }
      }
    },
    {
      name: '5.7 Xem danh sách tài khoản toàn hệ thống (/admin/accounts)',
      event: makeScript([
        'pm.test("Lấy danh sách tài khoản thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/accounts',
          host: ['{{baseUrl}}'],
          path: ['admin', 'accounts']
        }
      }
    },
    {
      name: '5.8 Danh sách nhân viên (/admin/staff)',
      event: makeScript([
        'pm.test("Lấy danh sách nhân viên thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/staff',
          host: ['{{baseUrl}}'],
          path: ['admin', 'staff']
        }
      }
    },
    {
      name: '5.9 Xem danh sách công thức pha chế (/admin/recipes)',
      event: makeScript([
        'pm.test("Lấy công thức pha chế thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/recipes',
          host: ['{{baseUrl}}'],
          path: ['admin', 'recipes']
        }
      }
    },
    {
      name: '5.10 Xem danh sách khuyến mãi (/admin/promotions)',
      event: makeScript([
        'pm.test("Lấy danh sách khuyến mãi thành công (HTTP 200)", () => {',
        '    pm.response.to.have.status(200);',
        '});'
      ]),
      request: {
        method: 'GET',
        header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
        url: {
          raw: '{{baseUrl}}/admin/promotions',
          host: ['{{baseUrl}}'],
          path: ['admin', 'promotions']
        }
      }
    }
  ]
};

// 6. [BẢO VỆ ĐỒ ÁN - CORE BUSINESS TESTS]
// Enhance existing P7 folders so tests set both collectionVariables and environment
function updateTestsToSyncEnv(folder) {
  folder.item.forEach(req => {
    if (req.event) {
      req.event.forEach(ev => {
        if (ev.script && ev.script.exec) {
          const newLines = [];
          ev.script.exec.forEach(line => {
            newLines.push(line);
            // If line sets collectionVariable, also set environment
            const match = line.match(/pm\.collectionVariables\.set\(['"]([^'"]+)['"],\s*([^)]+)\);/);
            if (match) {
              newLines.push(`pm.environment.set('${match[1]}', ${match[2]});`);
            }
          });
          ev.script.exec = newLines;
        }
      });
    }
  });
  return folder;
}

const folder6 = {
  name: '6. [BẢO VỆ ĐỒ ÁN - CORE BUSINESS TESTS]',
  item: [
    updateTestsToSyncEnv(p7.item[1]), // Task 9 - State Machine
    updateTestsToSyncEnv(p7.item[2]), // Task 8 - Idempotent Payment
    updateTestsToSyncEnv(p7.item[3])  // Task 10.3 - Optimistic Locking
  ]
};

// Assemble Full Collection
const fullCollection = {
  info: {
    _postman_id: 'brewlite-full-api-collection-2026',
    name: 'BrewLite Coffee - Full API Collection (A-Z)',
    description: 'Bộ sưu tập API hoàn chỉnh A-Z của đồ án BrewLite Coffee:\n- Đầy đủ toàn bộ Auth, Menu, Orders, Reviews, Staff Barista, Admin.\n- Bao gồm bộ kịch bản kiểm thử độc quyền phục vụ bảo vệ đồ án (Task 8, 9, 10).\n- Tự động bắt Token (JWT) và đồng bộ biến môi trường (Environment & Collection Variables).',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://127.0.0.1:3001/api', type: 'string' },
    { key: 'customerToken', value: '', type: 'string' },
    { key: 'staffToken', value: '', type: 'string' },
    { key: 'adminToken', value: '', type: 'string' },
    { key: 'testProductId', value: '', type: 'string' },
    { key: 'testVariantId', value: '', type: 'string' },
    { key: 'activeOrderId', value: '', type: 'string' },
    { key: 'robustaId', value: '', type: 'string' },
    { key: 'reviewId', value: '', type: 'string' },
    { key: 'fixedIdempotencyKey', value: 'POSTMAN_IDEMP_TEST_9999', type: 'string' },
    { key: 'orderIdLastCup1', value: '', type: 'string' },
    { key: 'orderIdLastCup2', value: '', type: 'string' }
  ],
  item: [
    folder0,
    folder1,
    folder2,
    folder3,
    folder4,
    folder5,
    folder6
  ]
};

fs.writeFileSync(outputPath, JSON.stringify(fullCollection, null, 2), 'utf8');
console.log('✅ Generated successfully: ' + outputPath);
