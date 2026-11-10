import { NextResponse } from 'next/server';

// Bộ nhớ cache giao dịch phía Next.js (phục vụ fallback khi backend offline hoặc khác port)
declare global {
  // eslint-disable-next-line no-var
  var __brewlite_mb_payments: Map<string, any> | undefined;
}

if (!global.__brewlite_mb_payments) {
  global.__brewlite_mb_payments = new Map();
}
const localPayments = global.__brewlite_mb_payments;

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const content = String(data?.content || '').toUpperCase().trim().replace(/\s+/g, ' ');
    const rawCode = String(data?.invoice_code || '').toUpperCase().trim();

    // Bắt buộc nội dung chuyển khoản phải khớp chuẩn "BREWLITE <mã_đơn>"
    let orderCode = '';
    const matchExact = content.match(/^BREWLITE\s+(BL\d{6}|ORD-[A-Z0-9]+)$/i);
    if (matchExact) {
      orderCode = matchExact[1].toUpperCase();
    } else if (rawCode && content === `BREWLITE ${rawCode}`) {
      orderCode = rawCode;
    }

    const paymentRecord = {
      orderCode,
      amount: Number(data?.amount) || 0,
      content: data?.content || '',
      sender: String(data?.sender || '0589822346'),
      senderName: String(data?.sender_name || data?.senderName || 'NGUYEN HOANG ANH'),
      transId: String(data?.trans_id || data?.transId || `FT${Date.now()}`),
      time: Date.now(),
    };

    if (orderCode) localPayments.set(orderCode, paymentRecord);
    if (rawCode && rawCode !== orderCode) localPayments.set(rawCode, paymentRecord);
    if (content) localPayments.set(content, paymentRecord);
    localPayments.set('LATEST_TX', paymentRecord);

    // Forward đồng thời sang NestJS backend (hỗ trợ cả môi trường docker và máy local)
    const backendEndpoints = [
      'http://backend:3001/api/payments/mbbank-sync',
      'http://brewlite_backend:3001/api/payments/mbbank-sync',
      'http://127.0.0.1:3001/api/payments/mbbank-sync',
      'http://localhost:3001/api/payments/mbbank-sync',
    ];

    for (const url of backendEndpoints) {
      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {});
      } catch {
        // bỏ qua lỗi fetch backend
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã nhận biến động số dư chuyển khoản MBBank (Next.js Route)',
      payment: paymentRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi xử lý webhook' },
      { status: 500 }
    );
  }
}
