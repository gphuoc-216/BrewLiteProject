import { NextResponse } from 'next/server';

const globalForMbPayments = globalThis as typeof globalThis & {
  __brewlite_mb_payments?: Map<string, { orderCode?: string }>;
};

export async function POST(
  _request: Request,
  context: { params: { orderCode: string } },
) {
  const code = String(context?.params?.orderCode || '').toUpperCase().trim();
  const store = globalForMbPayments.__brewlite_mb_payments;
  if (store && code) {
    store.delete(code);
    store.forEach((val, key) => {
      if (key.includes(code) || (val?.orderCode && val.orderCode.includes(code))) {
        store.delete(key);
      }
    });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api').replace(/\/+$/, '');
  try {
    await fetch(`${baseUrl}/payments/mbbank-invalidate/${encodeURIComponent(code)}`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Ignore backend timeout; local cache already invalidated
  }

  return NextResponse.json({
    success: true,
    message: `Đã hủy mã thanh toán ${code}`,
  });
}
