/**
 * BrewLite Cloudflare Tunnel Runner (Dành riêng cho iPhone / Điện thoại quét QR)
 * Tự động tạo kết nối HTTPS hợp lệ từ Cloudflare -> Cổng 3000 (Next.js & Backend)
 * Cung cấp mã QR trực tiếp trên màn hình terminal để iPhone giơ camera quét vào là xong.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let qrTerminal = null;
try {
  qrTerminal = require('qrcode-terminal');
} catch (e) {
  // qrcode-terminal optional fallback
}

const rootDir = path.resolve(__dirname, '..');
const exeCandidates = [
  path.join(rootDir, 'cloudflared.exe'),
  path.join(process.cwd(), 'cloudflared.exe'),
  'cloudflared.exe'
];

let cloudflaredPath = null;
for (const p of exeCandidates) {
  if (fs.existsSync(p)) {
    cloudflaredPath = p;
    break;
  }
}

if (!cloudflaredPath) {
  console.error('\n❌ Không tìm thấy file cloudflared.exe tại thư mục gốc!');
  console.error('👉 Vui lòng đặt file cloudflared.exe vào thư mục: ' + rootDir);
  process.exit(1);
}

console.log('\n================================================================');
console.log('  🚀 BREWLITE CLOUDFLARE HTTPS TUNNEL - MOBILE QR SCANNER');
console.log('================================================================');
console.log('⏳ Đang khởi tạo đường truyền HTTPS bảo mật từ Cloudflare...');
console.log('🎯 Đích đến máy cục bộ: http://127.0.0.1:3000 (Frontend + API Gateway)\n');

const proc = spawn(cloudflaredPath, ['tunnel', '--url', 'http://127.0.0.1:3000'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let foundUrl = false;
const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g;

function handleOutput(data) {
  const text = data.toString();

  if (!foundUrl) {
    const matches = text.match(urlRegex);
    if (matches && matches.length > 0) {
      foundUrl = true;
      const publicUrl = matches[0];
      const mbbankUrl = `${publicUrl}/mbbank/index.html`;
      const mbbankAdminUrl = `${publicUrl}/mbbank/admin.html`;

      console.log('='.repeat(68));
      console.log('  🎉 ĐÃ KẾT NỐI CLOUDFLARE TUNNEL THÀNH CÔNG!');
      console.log('='.repeat(68));

      if (qrTerminal) {
        console.log('\n📷 DÙNG IPHONE QUÉT MÃ QR NÀY ĐỂ MỞ APP MBBANK NGAY:');
        qrTerminal.generate(mbbankUrl, { small: true }, (qrcode) => {
          console.log(qrcode);
        });
      }

      console.log('📱 CÁC ĐƯỜNG LINK HTTPS CHÍNH XÁC:');
      console.log('   👉 1. App Giả lập MBBank (Quét Camera thanh toán mã QR chuẩn ngân hàng):');
      console.log(`      ${mbbankUrl}`);
      console.log('   👉 2. Trang web đặt món cà phê BrewLite:');
      console.log(`      ${publicUrl}`);
      console.log('   👉 3. Trang Quản trị MBBank (Cộng tiền & xem giao dịch):');
      console.log(`      ${mbbankAdminUrl}`);

      console.log('\n💡 LƯU Ý QUAN TRỌNG:');
      console.log('   - Đuôi tên miền luôn là .com (không gõ thiếu chữ "om" thành .c).');
      console.log('   - Giơ Camera iPhone vào mã QR phía trên là Safari tự hiện thông báo mở.');
      console.log('   - Khi Safari hỏi "Muốn dùng Camera?", bấm Cho phép.');
      console.log('\n⚡ Giữ cửa sổ terminal này mở trong khi test. Nhấn Ctrl+C để dừng.');
      console.log('='.repeat(68) + '\n');
    }
  }
}

proc.stdout.on('data', handleOutput);
proc.stderr.on('data', handleOutput);

proc.on('error', (err) => {
  console.error('❌ Lỗi khi khởi động cloudflared:', err.message);
});

proc.on('close', (code) => {
  console.log(`\n🛑 Cloudflare tunnel đã đóng (Mã thoát: ${code}).`);
});

process.on('SIGINT', () => {
  console.log('\nĐang ngắt kết nối Cloudflare Tunnel...');
  proc.kill();
  process.exit(0);
});
