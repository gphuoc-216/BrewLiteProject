import { Injectable, BadRequestException, RequestTimeoutException } from '@nestjs/common';

/**
 * Interface định nghĩa dữ liệu đầu vào khi yêu cầu Cổng thanh toán giả lập trừ tiền.
 */
export interface ChargeRequest {
  amount: number;                     // Số tiền cần thanh toán (VNĐ)
  method: string;                     // Phương thức: 'WALLET' (Ví điện tử) hoặc 'CARD' (Thẻ ngân hàng)
  simulateError?: 'FAIL' | 'TIMEOUT'; // Cờ giả lập kịch bản lỗi phục vụ kiểm thử / demo bảo vệ đồ án
}

/**
 * Service mô phỏng (Mock) Cổng thanh toán bên thứ ba (VNPay, MoMo, ZaloPay).
 * Giúp hệ thống hoạt động độc lập mà không cần ký hợp đồng với ngân hàng thật.
 */
@Injectable()
export class MockGatewayService {
  /**
   * Xử lý giao dịch trừ tiền từ tài khoản người dùng theo 3 kịch bản:
   * 1. TIMEOUT: Giả lập mạng bị trễ quá lâu (quá 3 giây)
   * 2. FAIL: Giả lập tài khoản không đủ tiền thanh toán
   * 3. SUCCESS: Giao dịch thành công, sinh mã tham chiếu giao dịch
   */
  async processCharge(req: ChargeRequest) {
    const methodName = req.method === 'CARD' ? 'Thẻ ngân hàng (CARD)' : 'Ví điện tử (WALLET)';
    const amountNum = Number(req.amount) || 0;
    const amountStr = amountNum.toLocaleString('vi-VN');

    // KỊCH BẢN 1: Giả lập lỗi Timeout (Chờ 3 giây rồi ngắt kết nối)
    if (req.simulateError === 'TIMEOUT') {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      throw new RequestTimeoutException(`Cổng thanh toán phản hồi TIMEOUT (mạng quá 3000ms chờ trừ ${amountStr} VNĐ)`);
    }

    // KỊCH BẢN 2: Giả lập lỗi tài khoản không đủ số dư (Từ chối trừ tiền)
    if (req.simulateError === 'FAIL') {
      return {
        success: false,
        gateway: 'Mock Payment Gateway (Mô phỏng MoMo / VNPay)',
        status: 'REJECTED',
        errorCode: 'INSUFFICIENT_FUNDS',
        message: `Giao dịch thất bại: Tài khoản ${methodName} không đủ số dư để trừ ${amountStr} VNĐ`,
      };
    }

    // KỊCH BẢN 3: Giao dịch thành công (Mặc định)
    // Sinh mã tham chiếu giao dịch chuẩn ngân hàng BREW-PAY-YYYYMMDD-XXXXXX
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      gateway: 'Mock Payment Gateway (Mô phỏng MoMo / VNPay)',
      status: 'APPROVED',
      message: `Trừ tiền thành công ${amountStr} VNĐ qua ${methodName}`,
      amount: amountNum,
      method: req.method || 'WALLET',
      transactionRef: `BREW-PAY-${dateCode}-${randomSuffix}`,
    };
  }
}

