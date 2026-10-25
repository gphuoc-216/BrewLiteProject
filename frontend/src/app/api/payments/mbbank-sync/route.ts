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
    const content = String(data?.content || '').toUpperCase().trim();
    const rawCode = String(data?.invoice_code || '').toUpperCase().trim();

    // Tách mã hóa đơn chuẩn BLxxxxxx
    let orderCode = '';
    const match6Digits = content.match(/BL\d{6}/) || rawCode.match(/BL\d{6}/);
    if (match6Digits) {
      orderCode = match6Digits[0];
    } else {
      const matchGeneral = content.match(/BL\d+/) || content.match(/ORD-[A-Z0-9]+/) || [rawCode];
      orderCode = (matchGeneral[0] || rawCode).replace(/^BREWLITE\s*/i, '').trim();
      if (orderCode.length === 10 && orderCode.endsWith('6304')) {
        orderCode = orderCode.slice(0, 6);
      }
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
