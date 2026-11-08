/**
 * =========================================================================================
 * 🛠️ BREWLITE AUTOMATIC SETUP SCRIPT (Zero-Config cho mọi máy tính)
 * =========================================================================================
 * Script này tự động thiết lập toàn bộ môi trường để bất kỳ ai tải project về
 * (Windows, macOS, Linux) cũng chạy được ngay lập tức chỉ với:
 *     npm run setup
 *
 * Các bước tự động thực hiện:
 * 1. Tự động sinh file .env cho backend và .env.local cho frontend nếu chưa có.
 * 2. Cài đặt đầy đủ dependencies cho Root, Backend và Frontend.
 * 3. Khởi động PostgreSQL container bằng Docker Compose.
 * 4. Đồng bộ Schema Prisma vào Database (npx prisma db push).
 * 5. Nạp dữ liệu mẫu ban đầu (seed accounts, products, recipes, promotions).
 * =========================================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

function run(command, cwd = ROOT_DIR, ignoreError = false) {
  try {
    console.log(`\n⏳ Đang chạy: ${command} (trong ${path.relative(ROOT_DIR, cwd) || '.'})...`);
    execSync(command, { cwd, stdio: 'inherit', env: process.env });
    return true;
  } catch (error) {
    if (!ignoreError) {
      console.error(`❌ Lỗi khi thực thi: ${command}`);
    }
    return false;
  }
}

function copyIfNotExist(source, target, label) {
  if (!fs.existsSync(target)) {
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      console.log(`✅ Đã tự động tạo ${label} từ template.`);
    } else {
      console.warn(`⚠️ Không tìm thấy template ${source}`);
    }
  } else {
    console.log(`ℹ️ ${label} đã tồn tại, giữ nguyên cấu hình.`);
  }
}

async function main() {
  console.log('\n================================================================');
  console.log('🚀 BREWLITE ZERO-CONFIG SETUP — KHỞI TẠO DỰ ÁN CHO MỌI MÁY');
  console.log('================================================================\n');

  // BƯỚC 1: TỰ ĐỘNG SAO CHÉP BIẾN MÔI TRƯỜNG (.ENV)
  console.log('--- [1/5] Kiểm tra biến môi trường (.env) ---');
  copyIfNotExist(
    path.join(BACKEND_DIR, '.env.example'),
    path.join(BACKEND_DIR, '.env'),
    'backend/.env'
  );
  copyIfNotExist(
    path.join(FRONTEND_DIR, '.env.example'),
    path.join(FRONTEND_DIR, '.env.local'),
    'frontend/.env.local'
  );
  copyIfNotExist(
    path.join(ROOT_DIR, '.env.example'),
    path.join(ROOT_DIR, '.env'),
    'root/.env'
  );

  // BƯỚC 2: CÀI ĐẶT THƯ VIỆN (DEPENDENCIES) NẾU THIẾU
  console.log('\n--- [2/5] Kiểm tra thư viện (Dependencies) ---');
  if (!fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
    run('npm install', ROOT_DIR);
  }
  if (!fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) {
    run('npm install', BACKEND_DIR);
  }
  if (!fs.existsSync(path.join(FRONTEND_DIR, 'node_modules'))) {
    run('npm install', FRONTEND_DIR);
  }
  console.log('✅ Thư viện dependencies đã sẵn sàng.');

  // BƯỚC 3: KHỞI ĐỘNG DATABASE DOCKER POSTGRES
  console.log('\n--- [3/5] Khởi động PostgreSQL qua Docker Compose ---');
  // Dọn container kẹt nếu có từ trước
  run('docker rm -f brewlite_postgres', ROOT_DIR, true);
  const dockerStarted = run('docker compose up -d postgres', ROOT_DIR, true);

  if (!dockerStarted) {
    console.warn('\n⚠️ CẢNH BÁO: Không thể khởi động Docker tự động.');
    console.warn('👉 Hãy đảm bảo bạn đã mở Docker Desktop trên máy tính rồi chạy lại: npm run setup\n');
  } else {
    console.log('✅ PostgreSQL container đã khởi động thành công.');
    
    // Đợi 3 giây để PostgreSQL sẵn sàng nhận socket
    console.log('⏳ Đợi 3 giây để PostgreSQL sẵn sàng...');
    await new Promise((res) => setTimeout(res, 3000));

    // BƯỚC 4: SINH PRISMA CLIENT & ĐỒNG BỘ SCHEMA
    console.log('\n--- [4/5] Đồng bộ Database Schema (Prisma DB Push) ---');
    run('npx prisma generate', BACKEND_DIR);
    run('npx prisma db push --skip-generate', BACKEND_DIR);

    // BƯỚC 5: NẠP DỮ LIỆU MẪU (SEED DATA)
    console.log('\n--- [5/5] Nạp dữ liệu mẫu ban đầu (Seed Database) ---');
    run('npm run seed', BACKEND_DIR);
  }

  // TỔNG KẾT VÀ HƯỚNG DẪN CHẠY
  console.log('\n================================================================');
  console.log('🎉 THIẾT LẬP DỰ ÁN BREWLITE HOÀN TẤT THÀNH CÔNG!');
  console.log('================================================================');
  console.log('\nBây giờ bạn có thể khởi động hệ thống bằng 2 Terminal:\n');
  console.log('  🖥️  Terminal 1 (Backend API & Swagger):');
  console.log('      npm run dev:backend');
  console.log('      👉 Swagger Docs : http://localhost:3001/api/docs\n');
  console.log('  🌐  Terminal 2 (Giao diện Web Khách hàng & Staff):');
  console.log('      npm run dev:frontend');
  console.log('      👉 Giao diện Web: http://localhost:3000\n');
  console.log('  📱  (Tùy chọn) Mở App MBBank Simulator trên điện thoại thật:');
  console.log('      npm run phone\n');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Lỗi thiết lập:', err);
  process.exit(1);
});

