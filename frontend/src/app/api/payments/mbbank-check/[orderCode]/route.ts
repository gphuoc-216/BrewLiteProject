import { NextResponse } from 'next/server';

declare global {
  // eslint-disable-next-line no-var
  var __brewlite_mb_payments: Map<string, any> | undefined;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  const { orderCode } = await params;
  const code = String(orderCode || '').toUpperCase().trim();

  // 1. Thử hỏi NestJS Backend trước
  const backendEndpoints = [
    `http://backend:3001/api/payments/mbbank-check/${encodeURIComponent(code)}`,
    `http://brewlite_backend:3001/api/payments/mbbank-check/${encodeURIComponent(code)}`,
    `http://127.0.0.1:3001/api/payments/mbbank-check/${encodeURIComponent(code)}`,
    `http://localhost:3001/api/payments/mbbank-check/${encodeURIComponent(code)}`,
  ];

  for (const url of backendEndpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const payload = json.data || json;
        if (payload && payload.paid) {
          return NextResponse.json({ success: true, data: payload });
        }
      }
    } catch {
      // Thử endpoint tiếp theo
    }
  }

  // 2. Fallback: tra cứu trong local cache của Next.js
  const localPayments = global.__brewlite_mb_payments;
  if (localPayments && code.length >= 4) {
    let payment = localPayments.get(code);
    if (!payment) {
      const expectedMemo = `BREWLITE ${code}`;
      localPayments.forEach((val, key) => {
        if (!payment && key !== 'LATEST_TX') {
          const txContent = String(val?.content || '').toUpperCase().trim().replace(/\s+/g, ' ');
          const txOrderCode = String(val?.orderCode || '').toUpperCase().trim();
          if (txContent === expectedMemo || (txOrderCode === code && txContent === expectedMemo)) {
            payment = val;
          }
        }
      });
    }

    if (payment && Date.now() - payment.time < 300000) {
      return NextResponse.json({
        success: true,
        data: { paid: true, payment },
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: { paid: false },
  });
}
