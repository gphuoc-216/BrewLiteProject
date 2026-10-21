# PROMPT TỔNG LỰC: THIẾT KẾ LẠI TOÀN BỘ UI/UX VÀ SỬA 100% LỖI NGHIỆP VỤ CHO BREWLITE (NEXT.JS 14 + TAILWIND 3 + CLASS DIAGRAM DRAW.IO)

> **Hướng dẫn sử dụng:** Đưa toàn bộ nội dung file này kèm mã nguồn frontend và file `Sơ-đồ-lớp-CNPM.drawio` cho AI Coding Assistant (Claude Code, Cursor, Copilot, Antigravity...) để tiến hành Refactor và tái thiết kế dự án đạt chuẩn Design Studio chuyên nghiệp, đồng thời đồng bộ 100% với Sơ đồ lớp phần mềm.

---

## MỤC LỤC
1. [VAI TRÒ & MỤC TIÊU DỰ ÁN](#1-vai-trò--mục-tiêu-dự-án)
2. [ĐẶC TẢ CHI TIẾT 100% SƠ ĐỒ LỚP TỪ FILE SƠ-ĐỒ-LỚP-CNPM.DRAWIO](#2-đặc-tả-chi-tiết-100-sơ-đồ-lớp-từ-file-sơ-đồ-lớp-cnpmdrawio)
   - 2.1. Danh mục 17 Lớp (Classes), Thuộc tính (Attributes) & Phương thức (Operations)
   - 2.2. Ma trận Quan hệ (Relationships) & Bội số (Multiplicities)
   - 2.3. Các Enum nghiệp vụ cốt lõi
3. [ĐẶC TẢ CHI TIẾT 100% GIAO DIỆN & LOGIC FRONTEND HIỆN TẠI](#3-đặc-tả-chi-tiết-100-giao-diện--logic-frontend-hiện-tại)
   - 3.1. Kiến trúc công nghệ & Tổ chức thư mục
   - 3.2. Quản lý trạng thái (Zustand Stores) & API Client
   - 3.3. Bảng màu & Phong cách thiết kế hiện tại (Các hạn chế cần xóa bỏ)
   - 3.4. Bóc tách chi tiết logic của toàn bộ 9 màn hình hiện tại
4. [ĐỐI CHIẾU & ĐẶC TẢ 11 SAI LỆCH NGHIỆP VỤ BẮT BUỘC SỬA (UI ↔ SƠ ĐỒ LỚP)](#4-đối-chiếu--đặc-tả-11-sai-lệch-nghiệp-vụ-bắt-buộc-sửa-ui--sơ-đồ-lớp)
5. [QUY CHUẨN THIẾT KẾ MỚI: PHONG CÁCH "QUẦY CÀ PHÊ THỦ CÔNG" (CRAFT ROASTERY)](#5-quy-chuẩn-thiết-kế-mới-phong-cách-quầy-cà-phê-thủ-công-craft-roastery)
   - 5.1. Bảng màu chuẩn WCAG AA (Loại bỏ hoàn toàn thang màu cũ)
   - 5.2. Hệ thống Typography (Fraunces + Be Vietnam Pro)
   - 5.3. Hình khối, Đổ bóng, Viền, Chuyển động & Chống Slop
   - 5.4. Hệ thống UI Components dùng chung cần tạo mới (`src/components/ui/`)
6. [LỘ TRÌNH THỰC THI 5 BƯỚC CHI TIẾT (A → B/C → D → E)](#6-lộ-trình-thực-thi-5-bước-chi-tiết-a--bc--d--e)
7. [ĐỀ XUẤT CẬP NHẬT CHO SƠ ĐỒ LỚP DRAW.IO](#7-đề-xuất-cập-nhật-cho-sơ-đồ-lớp-drawio)

---

## 1. VAI TRÒ & MỤC TIÊU DỰ ÁN

### 1.1. Vai trò của Agent
Bạn là **Lead Product Designer** kiêm **Senior Frontend Architect**. Nhiệm vụ của bạn là tái cấu trúc toàn diện mã nguồn frontend của hệ thống **BrewLite** (Nền tảng đặt cà phê không tiền mặt tại quầy dành cho 3 nhóm đối tượng: Khách hàng, Nhân viên pha chế / Barista, và Quản trị viên / Admin).

### 1.2. 3 Nguyên tắc cốt lõi
1. **Thiết kế chuẩn Studio (Craft Floor):** Loại bỏ 100% cảm giác "AI-generated / vibe-code" (không gradient lòe loẹt, không icon sparkles, không bóng đổ nhòe nhoẹt, không bounce animation vô nghĩa). Giao diện mang linh hồn "quầy cà phê thủ công": điềm tĩnh, ấm áp, biên tập (editorial), tự tin và chuẩn xác.
2. **Khớp 100% Sơ đồ lớp (Single Source of Truth):** Sơ đồ lớp trong file `Sơ-đồ-lớp-CNPM.drawio` là chuẩn nghiệp vụ. Mọi thực thể, thuộc tính, phương thức, trạng thái đơn hàng và luồng dữ liệu đều phải tương thích chính xác.
3. **Giữ vững Stack & Không thêm thư viện ngoài:**
   - Framework: **Next.js 14 App Router** (React 18, TypeScript).
   - Styling: **TailwindCSS 3** (không dùng Tailwind v4, không cài Tailwind plugins lạ).
   - Icons: **lucide-react** (kế thừa màu currentColor).
   - State: **Zustand**.
   - Fonts: Chỉ sử dụng **`next/font/google`** (Fraunces & Be Vietnam Pro).
   - **Tuyệt đối KHÔNG cài đặt thêm các bộ UI component nặng** như Shadcn UI, Material UI, Ant Design, Chakra UI hay Framer Motion. Toàn bộ UI component phải được viết thuần bằng React + Tailwind CSS tokens.

---

## 2. ĐẶC TẢ CHI TIẾT 100% SƠ ĐỒ LỚP TỪ FILE `Sơ-đồ-lớp-CNPM.drawio`

File `Sơ-đồ-lớp-CNPM.drawio` là thiết kế kiến trúc phần mềm hướng đối tượng của hệ thống BrewLite, bao gồm 17 thành phần nghiệp vụ liên kết chặt chẽ. Dưới đây là đặc tả chi tiết toàn bộ các lớp:

### 2.1. Danh mục 17 Lớp (Classes), Thuộc tính & Phương thức

#### 1. Lớp `TaiKhoan` (Account)
- **Thuộc tính (Attributes):**
  - `- maTaiKhoan: String (PK)`: Khóa chính định danh tài khoản (UUID).
  - `- tenDangNhap: String`: Tên đăng nhập duy nhất (username).
  - `- matKhauMaHoa: String`: Mật khẩu băm (bcrypt hash).
  - `- vaiTro: String`: Vai trò tài khoản (`CUSTOMER` | `STAFF` | `ADMIN`).
  - `- trangThai: String`: Trạng thái hoạt động (`ACTIVE` | `LOCKED`).
- **Phương thức (Operations):**
  - `+ DangNhap()`: Xác thực danh tính và trả về Access Token JWT.
  - `+ DoiMatKhau()`: Thay đổi mật khẩu người dùng.
  - `+ KiemTraTrangThai()`: Kiểm tra tài khoản có bị khóa hay không.

#### 2. Lớp `KhachHang` (Customer)
- **Thuộc tính:**
  - `- maKhachHang: String (PK)`: Khóa chính định danh khách hàng.
  - `- hoTen: String`: Họ và tên khách hàng.
  - `- email: String`: Địa chỉ email nhận thông báo.
  - `- diemTichLuy: int`: Điểm thưởng tích lũy qua các đơn hàng hoàn tất.
  - `- maTaiKhoan: String (FK)`: Khóa ngoại liên kết `TaiKhoan(maTaiKhoan)`.
- **Phương thức:**
  - `+ DangKy()`: Đăng ký thông tin tài khoản khách hàng mới.
  - `+ XemDanhSachSanPham()`: Duyệt thực đơn món uống tại trang chủ.
  - `+ XemChiTietSanPham()`: Xem thông tin chi tiết, size, topping, giá và đánh giá.
  - `+ ThemVaoGioHang()`: Thêm món uống cùng lựa chọn size/topping vào giỏ.
  - `+ SuaGioHang()`: Cập nhật số lượng, kích cỡ sản phẩm trong giỏ.
  - `+ XoaKhoiGioHang()`: Xóa món khỏi giỏ hàng.
  - `+ ThanhToan()`: Khởi tạo quy trình đặt hàng và thanh toán không tiền mặt.
  - `+ XemLichSuDonHang()`: Xem danh sách các đơn đã đặt và trạng thái.
  - `+ HuyDon()`: Hủy đơn hàng (chỉ khả dụng khi đơn còn ở trạng thái `PENDING` hoặc `PAID`).
  - `+ CongDiemTichLuy()`: Cộng điểm thưởng khi đơn hàng hoàn thành (`COMPLETED`).

#### 3. Lớp `NhanVien` (Staff / Barista)
- **Thuộc tính:**
  - `- maNhanVien: String (PK)`: Khóa chính nhân viên pha chế.
  - `- hoTen: String`: Tên hiển thị của Barista.
  - `- email: String`: Email nhân viên.
  - `- maTaiKhoan: String (FK)`: Khóa ngoại trỏ đến `TaiKhoan(maTaiKhoan)`.
- **Phương thức:**
  - `+ XemDanhSachDonHang()`: Xem các đơn hàng đã thanh toán cần chế biến.
  - `+ NhanDonHang()`: Tiếp nhận đơn vào luồng pha chế (`PAID` → `PREPARING`).
  - `+ BatDauPhaChe()`: Đánh dấu bắt đầu công đoạn pha chế theo công thức.
  - `+ CapNhatTrangThaiDon()`: Cập nhật tiến độ món uống (`PREPARING` → `READY`).
  - `+ HoanTatDonHang()`: Xác nhận khách đã nhận nước tại quầy (`READY` → `COMPLETED`).

#### 4. Lớp `Admin` (Administrator)
- **Thuộc tính:**
  - `- maAdmin: String (PK)`: Khóa chính quản trị viên.
  - `- hoTen: String`: Tên quản trị viên.
  - `- email: String`: Email quản trị viên.
  - `- maTaiKhoan: String (FK)`: Khóa ngoại liên kết `TaiKhoan(maTaiKhoan)`.
- **Phương thức:**
  - `+ QuanLySanPham()`: Thêm/Sửa/Xóa sản phẩm, phân loại, định giá biến thể.
  - `+ QuanLyKhuyenMai()`: Thiết lập mã giảm giá, thời hạn, ngân sách khuyến mãi.
  - `+ QuanLyNhanVien()`: Quản lý danh sách nhân viên pha chế, phân ca làm việc.
  - `+ QuanLyTaiKhoan()`: Khóa hoặc mở khóa tài khoản người dùng vi phạm.
  - `+ XemThongKe()`: Thống kê số lượng đơn hàng, món bán chạy, đánh giá.
  - `+ XemDoanhThu()`: Báo cáo doanh thu theo ngày, tuần, tháng.

#### 5. Lớp `DonHang` (Order)
- **Thuộc tính:**
  - `- maDonHang: String (PK)`: Mã định danh đơn hàng (UUID).
  - `- maKhachHang: String (FK)`: Khách hàng sở hữu đơn.
  - `- maNhanVien: String (FK, Nullable)`: Nhân viên pha chế phụ trách đơn.
  - `- maKhuyenMai: String (FK, Nullable)`: Mã khuyến mãi được áp dụng.
  - `- trangThai: TrangThaiDonHang`: Enum trạng thái đơn hàng.
  - `- soTienGiam: double`: Số tiền được miễn giảm theo khuyến mãi.
  - `- tongTienSauGiam: double`: Số tiền thực tế khách hàng phải trả.
  - `- ngayTao: DateTime`: Thời điểm khách tạo đơn.
- **Phương thức:**
  - `+ TaoDonHang()`: Khởi tạo bản ghi đơn hàng ở trạng thái ban đầu `PENDING`.
  - `+ TinhTongTien()`: Tính tổng giá trị toàn bộ các món trong `ChiTietDonHang`.
  - `+ ApDungKhuyenMai()`: Kiểm tra tính hợp lệ và trừ tiền giảm giá.
  - `+ CapNhatTrangThai()`: Chuyển đổi trạng thái đơn theo vòng đời.
  - `+ HuyDon()`: Hủy đơn hàng và hoàn lại nguyên liệu nếu cần.
  - `+ XemChiTietDonHang()`: Trích xuất danh sách các món, kích cỡ, topping.
  - `+ TinhDiemTichLuy()`: Tính số điểm tích lũy được thưởng dựa trên giá trị đơn.
  - `+ KiemTraTrangThai()`: Kiểm tra trạng thái hiện tại của đơn.
  - `+ KiemTraChuyenTrangThai()`: Kiểm tra tính hợp lệ của việc chuyển dịch trạng thái.

#### 6. Lớp Enum `TrangThaiDonHang` (OrderStatus)
Gồm chính xác 7 trạng thái tuần tự:
1. `PENDING`: Đơn mới tạo, đang chờ khách tiến hành thanh toán.
2. `PAID`: Khách đã thanh toán thành công, đơn chuyển đến quầy Barista.
3. `PREPARING`: Barista đã bấm nhận đơn và đang thực hiện pha chế.
4. `READY`: Đồ uống đã hoàn tất, sẵn sàng chờ khách đến nhận tại quầy.
5. `COMPLETED`: Khách đã lấy đồ uống thành công, kết thúc vòng đời đơn.
6. `PAYMENT_FAILED`: Giao dịch thanh toán không thành công.
7. `CANCELLED`: Đơn hàng bị khách hoặc hệ thống hủy bỏ.

#### 7. Lớp `GiaoDichThanhToan` (Payment)
- **Thuộc tính:**
  - `- maGiaoDich: String (PK)`: Khóa chính giao dịch thanh toán.
  - `- maDonHang: String (FK)`: Liên kết đến đơn hàng được thanh toán.
  - `- idempotencyKey: String`: Khóa định danh giao dịch duy nhất (UUID) chống thanh toán trùng lặp khi retry.
  - `- soTien: double`: Số tiền giao dịch trừ từ Ví hoặc Thẻ.
  - `- trangThai: String`: Trạng thái giao dịch (`SUCCESS` | `FAILED`).
- **Phương thức:**
  - `+ ThanhToan()`: Gửi yêu cầu thanh toán không tiền mặt.
  - `+ KiemTraIdempotencyKey()`: Kiểm tra khóa chống trùng lặp trong hệ thống.
  - `+ XuLyThanhToan()`: Xử lý giao dịch trừ tiền thành công.
  - `+ XuLyThanhToanThatBai()`: Xử lý lỗi khi giao dịch không thành công.

#### 8. Lớp `ChiTietDonHang` (OrderItem)
- **Thuộc tính:**
  - `- maChiTietDon: int (PK, AI)`: Mã tự tăng định danh dòng chi tiết món.
  - `- maDonHang: String (FK)`: Khóa ngoại trỏ đến `DonHang`.
  - `- maChiTietSanPham: String (FK)`: Khóa ngoại trỏ đến `ChiTietSanPham`.
  - `- soLuong: int`: Số lượng ly món này.
  - `- thanhTien: double`: Thành tiền của dòng (`soLuong * gia`).
- **Phương thức:**
  - `+ ThemSanPham()`: Thêm món vào dòng chi tiết đơn.
  - `+ CapNhatSoLuong()`: Điều chỉnh số lượng ly đặt.
  - `+ XoaSanPham()`: Xóa món khỏi đơn.
  - `+ TinhThanhTien()`: Tính thành tiền dựa trên đơn giá biến thể và số lượng.

#### 9. Lớp `SanPham` (Product)
- **Thuộc tính:**
  - `- maSanPham: String (PK)`: Khóa chính sản phẩm.
  - `- tenSanPham: String`: Tên món uống (Ví dụ: Cà phê Sữa Đá, Trà Đào Cam Sả...).
  - `- duongDanAnh: String`: Đường dẫn URL ảnh chụp sản phẩm.
- **Phương thức:**
  - `+ XemThongTin()`: Lấy thông tin cơ bản của món.
  - `+ CapNhatThongTin()`: Quản trị viên cập nhật tên, ảnh món.

#### 10. Lớp `ChiTietSanPham` (ProductDetail / Variant)
- **Thuộc tính:**
  - `- maChiTietSanPham: String (PK)`: Khóa chính biến thể món.
  - `- maSanPham: String (FK)`: Khóa ngoại liên kết `SanPham`.
  - `- size: String`: Kích thước ly (`S` | `M` | `L`).
  - `- gia: double`: Đơn giá tương ứng với kích thước.
  - `- topping: String`: Topping mặc định hoặc tùy chọn đính kèm.
- **Phương thức:**
  - `+ XemChiTiet()`: Xem thông tin định giá theo biến thể.
  - `+ ChonSize()`: Thao tác chọn kích cỡ ly đồ uống.
  - `+ TinhGiaTheoSize()`: Tính giá biến thể theo kích cỡ chọn.

#### 11. Lớp `CongThuc` (Recipe)
- **Thuộc tính:**
  - `- maCongThuc: String (PK)`: Khóa chính định lượng công thức.
  - `- maChiTietSanPham: String (FK)`: Khóa ngoại trỏ đến biến thể món.
  - `- maNguyenLieu: String (FK)`: Khóa ngoại trỏ đến nguyên liệu trong kho.
  - `- soLuongCan: double`: Lượng nguyên liệu cần thiết để pha 1 ly size này.
- **Phương thức:**
  - `+ TinhSoLuongNguyenLieuCan()`: Tính tổng lượng nguyên liệu cần khấu trừ cho đơn.

#### 12. Lớp `NguyenLieu` (Ingredient)
- **Thuộc tính:**
  - `- maNguyenLieu: String (PK)`: Khóa chính nguyên liệu kho.
  - `- tenNguyenLieu: String`: Tên nguyên liệu (Hạt Arabica, Sữa tươi, Trân châu...).
  - `- donViTinh: String`: Đơn vị đo lường (`g`, `ml`, `miếng`...).
  - `- soLuongTon: double`: Số lượng tồn kho thực tế hiện tại.
  - `- version: int`: Số phiên bản dùng cho cơ chế **Optimistic Locking** chống tranh chấp kho.
- **Phương thức:**
  - `+ KiemTraTonKho()`: Kiểm tra nguyên liệu có đủ số lượng để pha chế hay không.
  - `+ TruSoLuong()`: Khấu trừ tồn kho khi đơn hàng được thanh toán.
  - `+ HoanSoLuong()`: Hoàn trả số lượng kho nếu đơn hàng bị hủy (`CANCELLED`).

#### 13. Lớp `KhuyenMai` (Promotion)
- **Thuộc tính:**
  - `- maKhuyenMai: String (PK)`: Khóa chính chương trình khuyến mãi.
  - `- maCode: String`: Mã ký tự nhập vào (Ví dụ: `BREW10`, `GIAM20K`).
  - `- tenChuongTrinh: String`: Tên hiển thị của khuyến mãi.
  - `- loaiGiamGia: String`: Hình thức giảm (`PERCENT` | `FIXED`).
  - `- giaTriGiam: double`: Giá trị giảm (% hoặc số tiền VNĐ cố định).
  - `- soLuong: int`: Tổng số lượt sử dụng tối đa.
  - `- soLuongDaDung: int`: Số lượt khách đã áp dụng thành công.
  - `- ngayBatDau: DateTime`: Thời điểm bắt đầu hiệu lực.
  - `- ngayKetThuc: DateTime`: Thời điểm hết hạn.
  - `- trangThai: String`: Trạng thái khuyến mãi (`ACTIVE` | `EXPIRED` | `PAUSED`).
- **Phương thức:**
  - `+ KiemTraMaGiamGia()`: Xác thực mã nhập có tồn tại trong hệ thống.
  - `+ ApDungMaGiamGia()`: Tính toán giá trị giảm hợp lệ cho giỏ hàng.
  - `+ KiemTraHanSuDung()`: Kiểm tra thời hạn hiện tại so với ngày hiệu lực.
  - `+ KiemTraSoLuong()`: Kiểm tra mã còn lượt sử dụng hay đã hết (`soLuongDaDung < soLuong`).
  - `+ CapNhatSoLuongSuDung()`: Tăng số lượt đã dùng khi đơn hàng được thanh toán.

#### 14. Lớp `NhaCungCap` (Supplier)
- **Thuộc tính:**
  - `- maNhaCungCap: String (PK)`: Khóa chính nhà cung cấp.
  - `- tenNhaCungCap: String`: Tên đơn vị phân phối nguyên liệu.
  - `- soDienThoai: String`: Số hotline liên hệ.
  - `- diaChi: String`: Địa chỉ kho nhà cung cấp.

#### 15. Lớp `PhieuNhap` (ImportReceipt)
- **Thuộc tính:**
  - `- maPhieuNhap: String (PK)`: Mã phiếu nhập nguyên liệu.
  - `- maNhaCungCap: String (FK)`: Nhà cung cấp giao hàng.
  - `- ngayNhap: DateTime`: Ngày giờ nhập hàng vào kho.
  - `- tongTien: double`: Tổng giá trị lô hàng nhập.

#### 16. Lớp `ChiTietPhieuNhap` (ImportReceiptDetail)
- **Thuộc tính:**
  - `- maChiTiet: String (PK)`: Mã dòng chi tiết phiếu nhập.
  - `- maPhieuNhap: String (FK)`: Liên kết đến phiếu nhập chính.
  - `- maNguyenLieu: String (FK)`: Nguyên liệu được nhập vào.
  - `- soLuong: double`: Lượng nhập vào kho.
  - `- donGia: double`: Đơn giá trên một đơn vị nhập.
  - `- thanhTien: double`: Thành tiền dòng (`soLuong * donGia`).

#### 17. Lớp `DanhGia` (Review)
- **Thuộc tính:**
  - `- maDanhGia: String (PK)`: Khóa chính nhận xét đánh giá.
  - `- maKhachHang: String (FK)`: Khách hàng viết đánh giá.
  - `- maSanPham: String (FK)`: Sản phẩm được đánh giá.
  - `- maDonHang: String (FK)`: Đơn hàng đã mua chứa sản phẩm này.
  - `- soSao: int`: Số sao bình chọn (1 đến 5 sao).
  - `- noiDung: String`: Lời nhận xét văn bản của khách.
  - `- ngayDanhGia: DateTime`: Thời điểm gửi đánh giá.
  - `- trangThai: String`: Trạng thái hiển thị (`VISIBLE` | `HIDDEN`).
- **Phương thức:**
  - `+ ThemDanhGia()`: Khách hàng gửi bài đánh giá mới.
  - `+ SuaDanhGia()`: Khách chỉnh sửa nội dung/số sao.
  - `+ XoaDanhGia()`: Xóa bài đánh giá.
  - `+ KiemTraDaMua()`: Kiểm tra điều kiện bắt buộc: Khách phải có đơn hàng `COMPLETED` chứa sản phẩm mới được quyền đánh giá.
  - `+ TinhDiemTrungBinh()`: Tính điểm đánh giá trung bình của sản phẩm.

---

### 2.2. Ma trận Quan hệ (Relationships) & Bội số (Multiplicities) trong Draw.io

| Nguồn (Source) | Đích (Target) | Bội số Nguồn | Bội số Đích | Loại Quan hệ | Diễn giải nghiệp vụ |
|---|---|:---:|:---:|---|---|
| `NhanVien` | `TaiKhoan` | `1..1` | `1..1` | Association 1-1 | Mỗi nhân viên gắn với đúng 1 tài khoản hệ thống |
| `KhachHang` | `TaiKhoan` | `1..1` | `1..1` | Association 1-1 | Mỗi khách hàng gắn với đúng 1 tài khoản |
| `Admin` | `TaiKhoan` | `1..1` | `1..1` | Association 1-1 | Mỗi quản trị viên gắn với đúng 1 tài khoản |
| `DonHang` | `KhachHang` | `0..*` | `1..1` | Association 1-N | Một khách hàng có thể có 0 hoặc nhiều đơn hàng |
| `DonHang` | `NhanVien` | `0..*` | `0..1` | Association 0..1-N | Đơn mới tạo chưa có barista; khi nhận thì gán 1 barista |
| `DonHang` | `KhuyenMai` | `0..*` | `0..1` | Association 0..1-N | Một đơn hàng có thể không dùng hoặc dùng 1 mã giảm giá |
| `DonHang` | `TrangThaiDonHang` | - | - | Dependency | Trạng thái của đơn bị ràng buộc bởi enum |
| `DonHang` | `GiaoDichThanhToan` | `1..1` | `0...1` | Composition 1-1 | Một đơn có tối đa 1 giao dịch thành công (kèm idempotencyKey) |
| `ChiTietDonHang` | `DonHang` | `1..*` | `1..1` | Composition 1-N | Một đơn bắt buộc phải có từ 1 chi tiết món trở lên |
| `ChiTietSanPham` | `SanPham` | `1..*` | `1..1` | Composition 1-N | Một sản phẩm có từ 1 biến thể (size S/M/L) trở lên |
| `ChiTietDonHang` | `ChiTietSanPham`| `0..*` | `1..1` | Association N-1 | Một dòng đặt hàng trỏ đến đúng 1 biến thể size cụ thể |
| `CongThuc` | `ChiTietSanPham`| `1..*` | `1..1` | Composition 1-N | Mỗi biến thể món được cấu thành bởi các dòng công thức |
| `CongThuc` | `NguyenLieu` | `0..*` | `1..1` | Association N-1 | Một dòng công thức trỏ đến 1 nguyên liệu kho |
| `ChiTietPhieuNhap` | `NguyenLieu`| `0..*` | `1..1` | Association N-1 | Một dòng nhập kho nhập đúng 1 loại nguyên liệu |
| `PhieuNhap` | `NhaCungCap` | `1..*` | `1..1` | Association 1-N | Mỗi phiếu nhập hàng gắn với 1 nhà cung cấp |
| `ChiTietPhieuNhap` | `PhieuNhap` | `1...*`| `1..1` | Composition 1-N | Phiếu nhập có từ 1 dòng nguyên liệu nhập trở lên |
| `DanhGia` | `KhachHang` | `0..*` | `1...1`| Association N-1 | Đánh giá được viết bởi 1 khách hàng |
| `DanhGia` | `SanPham` | `0..*` | `1...1`| Association N-1 | Đánh giá dành cho 1 sản phẩm |
| `DanhGia` | `DonHang` | `0..*` | `1...1`| Association N-1 | Đánh giá xác thực thông qua 1 đơn hàng đã mua |

---

## 3. ĐẶC TẢ CHI TIẾT 100% GIAO DIỆN & LOGIC FRONTEND HIỆN TẠI

### 3.1. Kiến trúc công nghệ & Tổ chức thư mục
Dự án được xây dựng trên:
- **Next.js 14.2.5 (App Router)** chạy trên cổng `3000`.
- **TypeScript 5.3.3**.
- **TailwindCSS 3.4.1**.
- **Zustand 4.5.2** cho Client State Management.
- **lucide-react 0.359.0** cho biểu tượng vector.

Cấu trúc thư mục mã nguồn hiện tại:
```
frontend/
├── public/
│   └── .gitkeep
├── src/
│   ├── app/
│   │   ├── admin/page.tsx               # Bảng điều khiển quản trị (Dashboard, Kho, Đánh giá, Khuyến mãi)
│   │   ├── cart/page.tsx                # Trang giỏ hàng, áp mã giảm giá
│   │   ├── checkout/page.tsx            # Trang chọn phương thức & thanh toán
│   │   ├── login/page.tsx               # Đăng nhập tài khoản
│   │   ├── orders/
│   │   │   ├── [id]/page.tsx            # Theo dõi trạng thái đơn hàng (Timeline)
│   │   │   └── history/page.tsx         # Lịch sử đơn hàng, hủy đơn, đánh giá
│   │   ├── products/
│   │   │   └── [id]/page.tsx            # Chi tiết sản phẩm, chọn size, chọn topping
│   │   ├── register/page.tsx            # Đăng ký khách hàng mới
│   │   ├── staff/page.tsx               # Quầy pha chế Barista Kanban 3 cột
│   │   ├── globals.css                  # CSS toàn cục
│   │   ├── layout.tsx                   # Layout khung bao bọc (Navbar + Children + Footer)
│   │   └── page.tsx                     # Trang chủ, danh mục món & banner
│   ├── components/
│   │   ├── Footer.tsx                   # Chân trang thông tin
│   │   └── Navbar.tsx                   # Thanh điều hướng trên cùng
│   ├── lib/
│   │   ├── api.ts                       # Hàm gọi API tập trung (fetchApi)
│   │   └── mockProducts.ts              # Dữ liệu dự phòng 12 món cà phê + ảnh Unsplash
│   └── store/
│       ├── useAuthStore.ts              # Quản lý người dùng đăng nhập & Token
│       └── useCartStore.ts              # Quản lý giỏ hàng & LocalStorage
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

### 3.2. Quản lý trạng thái (Zustand Stores) & API Client

#### `useAuthStore.ts`
- State: `user: { id, username, fullName, email, role, loyaltyPoints } | null`, `token: string | null`.
- Actions: `login(token, user)`, `logout()`, `updatePoints(points)`.
- Lưu trữ cục bộ: Đồng bộ vào `localStorage` qua key `brewlite_token` và `brewlite_user`.

#### `useCartStore.ts`
- State: `items: CartItem[]`, `promotion: Promotion | null`.
- `CartItem` gồm: `variantId`, `productId`, `productName`, `imageUrl`, `size`, `price`, `topping`, `quantity`.
- Actions: `addItem()`, `removeItem()`, `updateQuantity()`, `applyPromotion()`, `removePromotion()`, `clearCart()`.
- Getters tính toán: `getTotalPrice()` (tổng nguyên giá), `getDiscountAmount()` (tiền giảm), `getFinalTotal()` (số tiền thanh toán cuối cùng).
- Persist: Lưu tự động vào `localStorage` qua key `brewlite_cart`.

#### `api.ts`
- Địa chỉ cơ sở: `NEXT_PUBLIC_API_URL` hoặc mặc định `http://localhost:3001/api`.
- Hàm `fetchApi(endpoint, options)`: Tự động đính kèm header `Authorization: Bearer <token>` nếu có token trong `localStorage`. Tự động bóc tách vỏ bọc `TransformInterceptor` dạng `{ success: true, data: ... }` từ NestJS.

### 3.3. Bảng màu & Phong cách thiết kế hiện tại (Các hạn chế cần xóa bỏ)
- **Bảng màu cũ:** Định nghĩa thang `coffee-50` (`#faf6f0`) đến `coffee-950` (`#231109`). Sử dụng tràn lan các màu không kiểm soát độ tương phản: `amber-400`, `amber-100`, `emerald-50`, `emerald-600`, `red-500`, `purple-*`, `blue-*`.
- **Lỗi thẩm mỹ "AI/vibe-code":**
  - Banner trang chủ sử dụng gradient nền tối góc xiên (`from-coffee-800 via-coffee-900 to-coffee-950`) kèm khối tròn mờ ảo lố bịch (`blur-3xl`, `bg-coffee-600/20`).
  - Nút bấm và card dùng bo góc quá đà: `rounded-2xl`, `rounded-3xl`, `rounded-full`.
  - Icon lấp lánh `Sparkles`, hiệu ứng nảy `animate-bounce` gây nhức mắt trên Toast.
  - Khẩu hiệu sáo rỗng kiểu marketing AI: *"Trải nghiệm gọi món không tiền mặt 100%"*, *"Chỉ trong vài chạm"*, *"an toàn 100%"*.
  - Giá tiền bị nhuộm màu nổi loạn thay vì dùng màu chữ chính `ink`.
  - Icon được đặt trong các ô vuông bo tròn tô nền màu sắc đặt tùy tiện cạnh tiêu đề.

---

### 3.4. Bóc tách chi tiết logic của toàn bộ 9 màn hình hiện tại

#### Màn hình 1: Trang chủ (`src/app/page.tsx`)
- **Banner Hero:** Giới thiệu gọi món không tiền mặt, nút xem danh mục.
- **Bộ lọc danh mục:** 4 tab chuyển đổi (`ALL`, `COFFEE`, `TEA`, `FREEZE`).
- **Ô tìm kiếm:** Lọc sản phẩm theo tên hoặc mô tả theo thời gian thực (debounce 200ms).
- **Lưới sản phẩm (Product Grid):** Lưới responsive 2 cột (mobile) và 4 cột (desktop). Mỗi thẻ hiển thị ảnh 4:5, tên món, mô tả, rating sao, giá "Từ ... đ" và nút bấm nhanh `+` (thêm nhanh size S vào giỏ).
- **Cơ chế Fallback:** Tự động nạp 12 món mẫu từ `mockProducts.ts` nếu Backend chưa kết nối.

#### Màn hình 2: Chi tiết sản phẩm (`src/app/products/[id]/page.tsx`)
- **Xem thông tin:** Hiển thị ảnh lớn, tên món, danh mục, mô tả chi tiết, rating trung bình và lượt đánh giá.
- **Chọn Size:** Segmented button chuyển đổi giữa các size (`S`, `M`, `L`) kèm giá tiền nhảy động tương ứng.
- **Chọn Topping:** Danh sách checkbox chọn topping (Trân châu, Kem cheese, Đào miếng...).
- **Tăng giảm số lượng:** Bộ đếm số lượng ly cần mua.
- **Thêm vào giỏ hàng:** Nút CTA dính đáy hoặc nổi bật để thêm món kèm thông báo toast.
- **Danh sách đánh giá:** Hiển thị các phản hồi, số sao và nhận xét từ khách hàng đã mua trước đó.

#### Màn hình 3: Giỏ hàng (`src/app/cart/page.tsx`)
- **Danh sách món trong giỏ:** Mỗi dòng hiển thị ảnh thumbnail, tên món, kích cỡ, topping đã chọn, đơn giá, bộ đếm số lượng `[-] [số lượng] [+]`, và nút xóa khỏi giỏ.
- **Nhập mã khuyến mãi:** Ô nhập text kèm nút áp dụng (`BREW10`, `GIAM20K`). Hiển thị dòng tiền giảm màu xanh nếu hợp lệ hoặc báo lỗi nếu không khớp/hết hạn.
- **Bảng tóm tắt đơn:** Tổng tiền hàng, Tiền giảm giá, và Tổng tiền thanh toán.
- **Nút tiến hành thanh toán:** Điều hướng sang `/checkout`.

#### Màn hình 4: Thanh toán (`src/app/checkout/page.tsx`)
- **Kiểm tra đăng nhập:** Chuyển hướng sang `/login?redirect=/checkout` nếu chưa đăng nhập.
- **Lựa chọn phương thức thanh toán:** Radio button chọn 1 trong 2 phương thức:
  1. `WALLET` (Ví điện tử BrewLite).
  2. `CARD` (Thẻ ngân hàng nội địa / Quốc tế).
- **Quy trình bấm thanh toán:**
  1. Gửi `POST /api/orders` tạo đơn hàng ở trạng thái `PENDING`.
  2. Sinh chuỗi `Idempotency-Key`.
  3. Gửi `POST /api/payments` thực hiện thanh toán trừ tiền.
  4. Nếu thành công: Xóa sạch giỏ hàng `clearCart()` và chuyển sang `/orders/[id]`.

#### Màn hình 5: Xác nhận & Theo dõi đơn hàng (`src/app/orders/[id]/page.tsx`)
- **Mã đơn hàng & Trạng thái:** Hiển thị mã đơn viết hoa rút gọn (8 ký tự).
- **Stepper Timeline:** Trình trực quan hóa tiến độ gồm 4 chặng:
  `Đã thanh toán (PAID)` → `Đang pha chế (PREPARING)` → `Sẵn sàng lấy (READY)` → `Đã nhận đồ (COMPLETED)`.
- **Realtime Polling:** Tự động gọi API kiểm tra trạng thái mỗi 4 giây một lần để cập nhật ngay khi Barista đổi trạng thái đơn.
- **Danh sách món trong đơn:** Hiển thị lại chi tiết các ly nước đã đặt, tổng tiền thanh toán và thời gian tạo đơn.

#### Màn hình 6: Lịch sử đơn hàng (`src/app/orders/history/page.tsx`)
- **Danh sách đơn hàng:** Bảng hoặc danh sách các đơn đã đặt của tài khoản hiện tại kèm ngày giờ, tổng tiền, huy hiệu trạng thái `StatusBadge`.
- **Hành động Hủy đơn (`HuyDon`):** Khả dụng khi đơn ở trạng thái `PENDING` hoặc `PAID`. Gọi `POST /api/orders/[id]/cancel`.
- **Hành động Đánh giá:** Khả dụng khi đơn `COMPLETED`. Mở Modal để khách chọn số sao (1-5) và viết lời nhận xét.

#### Màn hình 7: Quầy pha chế Barista (`src/app/staff/page.tsx`)
- **Bảo vệ quyền truy cập:** Chỉ cho phép tài khoản có `role === 'STAFF'` hoặc `'ADMIN'`.
- **Bảng Kanban 3 cột:**
  - Cột 1: **Chờ pha chế (PAID)** — Hiển thị các đơn khách vừa thanh toán xong. Nút hành động: `[Nhận đơn & Pha chế]`.
  - Cột 2: **Đang pha chế (PREPARING)** — Các đơn đang được Barista thực hiện. Nút hành động: `[Hoàn thành pha chế]`.
  - Cột 3: **Sẵn sàng giao (READY)** — Đồ uống đã đặt ở quầy chờ khách lấy. Nút hành động: `[Đã giao cho khách]`.
- **Thẻ đơn hàng:** Mã đơn to rõ, danh sách món kèm size và topping cỡ chữ lớn giúp Barista dễ đọc từ xa.
- **Tự động làm mới:** Polling 5 giây/lần.

#### Màn hình 8: Bảng điều khiển Quản trị (`src/app/admin/page.tsx`)
- **Bảo vệ quyền truy cập:** Chỉ dành riêng cho `role === 'ADMIN'`.
- **Tab Thống kê & Doanh thu:** Tổng doanh thu, tổng số đơn, số khách hàng, số nguyên liệu cảnh báo, biểu đồ doanh thu theo ngày/tháng, top 5 đồ uống bán chạy nhất.
- **Tab Kho & Nguyên liệu:** Danh sách nguyên liệu, đơn vị tính, số lượng tồn kho thực tế. Form nhập kho nhanh chọn nguyên liệu, số lượng và tạo phiếu nhập.
- **Tab Quản lý đánh giá:** Danh sách các đánh giá của khách hàng, nút Ẩn (`HIDDEN`) hoặc Hiện (`VISIBLE`) bài đánh giá trên trang chủ.
- **Tab Khuyến mãi:** Danh sách các mã giảm giá đang kích hoạt, phần trăm hoặc số tiền giảm, số lượt đã dùng/tổng lượt.

#### Màn hình 9: Đăng nhập (`/login`) & Đăng ký (`/register`)
- Form nhập email/username và mật khẩu.
- Xử lý xác thực, lưu token và redirect về trang trước đó.
- Nút chuyển đổi qua lại giữa Đăng nhập và Đăng ký.

---

## 4. ĐỐI CHIẾU & ĐẶC TẢ 11 SAI LỆCH NGHIỆP VỤ BẮT BUỘC SỬA (UI ↔ SƠ ĐỒ LỚP)

Quá trình đối chiếu sâu giữa mã nguồn Frontend và file sơ đồ lớp `Sơ-đồ-lớp-CNPM.drawio` phát hiện 11 sai lệch nghiêm trọng. Bạn **bắt buộc phải sửa toàn bộ 11 điểm này**:

### 1. Topping & Giá tiền (`ChiTietSanPham.topping`, `gia`)
- **Hiện trạng sai lệch:** UI đang gán cứng mảng `TOPPING_OPTIONS` ở phía client (`extraPrice: 5000, 8000...`). Khi tạo đơn `POST /orders`, payload chỉ gửi mỗi `variantId` và `quantity` → Topping khách chọn bị rơi rụng hoàn toàn, tổng tiền tính ở client sai lệch so với server.
- **Giải pháp chuẩn:** Trong sơ đồ lớp, `ChiTietSanPham` chứa thuộc tính `topping` và `gia`. Mỗi sự kết hợp Size + Topping tương ứng với một bản ghi `ChiTietSanPham` hoặc phải gửi kèm thuộc tính lựa chọn trong payload để server định giá. Frontend không được tự ý cộng giá topping độc lập mà phải đồng bộ hoàn toàn với API.

### 2. Luồng thanh toán & `PAYMENT_FAILED` (`GiaoDichThanhToan.idempotencyKey`)
- **Hiện trạng sai lệch:**
  - Mỗi lần người dùng bấm nút thanh toán, code lại gọi `POST /orders` tạo một đơn mới, sau đó mới sinh key `IDEMP-...` → Nếu thanh toán thất bại, hệ thống để lại hàng loạt đơn `PENDING` rác trong DB và phá hủy hoàn toàn ý nghĩa của cơ chế Idempotency.
  - Khóa Idempotency đang sinh bằng chuỗi tùy tiện `Date.now() + Math.random()`, không đạt chuẩn UUIDv4.
- **Giải pháp chuẩn:**
  - Khởi tạo đơn hàng `POST /orders` **đúng 1 lần duy nhất**, lưu giữ `orderId` và một chuỗi `idempotencyKey` chuẩn sinh bằng `crypto.randomUUID()`.
  - Nếu giao dịch thanh toán thất bại: Không được tạo đơn mới! Giữ nguyên `orderId` và `idempotencyKey` cũ để thực hiện thanh toán lại (Retry).
  - Khóa nút bấm khi đang xử lý thanh toán (`disabled` khi `loading`) để chống double-click.
  - Khi thanh toán thất bại: Hiển thị giao diện thông báo *"Thanh toán chưa thành công"* kèm nút *"Thử lại"* và *"Đổi phương thức thanh toán"*. Đơn chuyển sang trạng thái `PAYMENT_FAILED` và phải được hiển thị chính xác trong lịch sử.

### 3. Enum trạng thái đơn hàng (`TrangThaiDonHang`)
- **Hiện trạng sai lệch:** Hàm ánh xạ `getStatusBadge` và thanh `Timeline` ở frontend đang bỏ quên trạng thái `PAYMENT_FAILED`; đồng thời gộp chung `PENDING` và `PAID` vào cùng một bước hiển thị gây hiểu lầm cho khách.
- **Giải pháp chuẩn:** Xây dựng một file cấu hình tập trung `src/constants/orderStatus.ts` ánh xạ chuẩn xác 100% cả 7 trạng thái của `TrangThaiDonHang` sang tiếng Việt, màu sắc badge trung tính và chỉ số bước trên timeline.

### 4. Đánh giá sản phẩm (`DanhGia`: maSanPham + maDonHang + maKhachHang)
- **Hiện trạng sai lệch:** Modal đánh giá tại trang lịch sử đơn chỉ cho phép đánh giá món đầu tiên `items[0]` của đơn hàng.
- **Giải pháp chuẩn:** Theo sơ đồ lớp, quan hệ `DanhGia` gắn với bộ ba `(KhachHang, SanPham, DonHang)`. Modal phải cho phép khách chọn từng món trong đơn để đánh giá riêng biệt. Chỉ hiển thị nút đánh giá khi đơn đã `COMPLETED` (nghiệp vụ `KiemTraDaMua`). Nếu món nào đã được đánh giá rồi thì hiển thị nhãn *"Đã đánh giá"*.

### 5. Màn hình Admin thiếu chức năng so với `Admin.ops`
- **Hiện trạng sai lệch:** Trang Admin hiện tại chỉ có xem thống kê sơ sài, danh sách kho và xem đánh giá/khuyến mãi dạng tĩnh.
- **Giải pháp chuẩn:** Bổ sung giao diện và luồng thao tác cho các chức năng được định nghĩa trong `Admin.ops`:
  - `QuanLySanPham()`: Thêm/Sửa/Xóa sản phẩm, cập nhật ảnh, danh mục, kích thước và giá.
  - `QuanLyNhanVien()` & `QuanLyTaiKhoan()`: Xem danh sách nhân sự, tạo tài khoản Barista mới, khóa (`LOCKED`) hoặc mở khóa (`ACTIVE`) tài khoản.
  - `QuanLyKhuyenMai()`: Form tạo mới mã giảm giá, cấu hình số lượng và thời hạn sử dụng.
  - `XemDoanhThu()`: Bộ lọc xem báo cáo doanh thu theo ngày / tuần / tháng.

### 6. Nghiệp vụ nhập kho đang gán cứng dữ liệu
- **Hiện trạng sai lệch:** Trong `admin/page.tsx`, hàm `handleQuickImport` đang gán cứng `supplierId = suppliers[0]?.id` và `unitPrice = 100`. Ngưỡng cảnh báo sắp hết hàng đang áp đặt số `15000` cho mọi đơn vị tính (cả gram và ml).
- **Giải pháp chuẩn:** Tạo form lập phiếu nhập kho đầy đủ: Cho phép chọn Nhà cung cấp từ danh sách, nhập số lượng thực tế và đơn giá nhập, tự động tính `thanhTien`, gửi dữ liệu tạo `PhieuNhap` và `ChiTietPhieuNhap`. Ngưỡng cảnh báo nguyên liệu sắp hết phải dựa trên từng loại nguyên liệu cụ thể.

### 7. Luồng xử lý đơn của Barista (`NhanVien.ops`)
- **Hiện trạng sai lệch:** Sơ đồ lớp phân tách rõ ràng 4 phương thức tuần tự: `XemDanhSachDonHang()` → `NhanDonHang()` → `BatDauPhaChe()` → `CapNhatTrangThaiDon()` → `HoanTatDonHang()`. Frontend hiện tại đang gộp chung và đặt tên nút bấm chưa chuẩn nghiệp vụ.
- **Giải pháp chuẩn:** Chuẩn hóa các nút hành động trên 3 cột Kanban:
  - Cột 1 (PAID): Nút `[Tiếp nhận đơn]` → Đơn chuyển sang `PREPARING` và ghi nhận `maNhanVien` của Barista đang bấm.
  - Cột 2 (PREPARING): Nút `[Hoàn tất pha chế]` → Đơn chuyển sang `READY`.
  - Cột 3 (READY): Nút `[Giao cho khách]` → Đơn chuyển sang `COMPLETED`.
  - Hiển thị rõ tên Barista đang phụ trách đơn trên thẻ Kanban.

### 8. Hủy đơn hàng và Hoàn tiền / Hoàn kho (`HuyDon`, `HoanSoLuong`)
- **Hiện trạng sai lệch:** Thao tác hủy đơn hiện dùng hộp thoại `confirm()` mặc định của trình duyệt rất sơ sài, không giải thích rõ điều kiện hoàn tiền hay hoàn nguyên liệu.
- **Giải pháp chuẩn:** Xóa bỏ toàn bộ `confirm()` / `alert()`. Xây dựng `Modal` xác nhận hủy đơn chuyên nghiệp, ghi rõ chính sách hoàn lại tiền vào Ví/Thẻ và hoàn trả số lượng nguyên liệu tồn kho (`HoanSoLuong`) theo phương thức của lớp `NguyenLieu`. Chỉ cho phép hủy khi đơn ở trạng thái `PENDING` hoặc `PAID`.

### 9. Điểm tích lũy khách hàng (`diemTichLuy`, `CongDiemTichLuy`)
- **Hiện trạng sai lệch:** Navbar hiện đang hiển thị nhãn "xu" (sai lệch so với thuộc tính `diemTichLuy` trong sơ đồ lớp). Khi đơn hàng hoàn thành, trang chi tiết đơn không thông báo số điểm khách được cộng.
- **Giải pháp chuẩn:** Đổi toàn bộ nhãn hiển thị từ "xu" thành **"điểm"** (theo `diemTichLuy`). Khi đơn hàng chuyển sang `COMPLETED`, hiển thị thông báo chúc mừng `+N điểm thưởng tích lũy` trên trang `/orders/[id]` và tự động cập nhật số điểm hiển thị trên Navbar thông qua `useAuthStore.updatePoints()`.

### 10. Đồng bộ thuộc tính hiển thị với Sơ đồ lớp
- **Hiện trạng sai lệch:** Giao diện frontend đang sử dụng các thuộc tính bổ sung như `category`, `description`, `rating`, `reviewCount` của sản phẩm và phương thức thanh toán (`WALLET`, `CARD`), trong khi sơ đồ lớp tối giản chỉ có `maSanPham, tenSanPham, duongDanAnh`.
- **Giải pháp chuẩn:** Giữ các thuộc tính này ở Frontend để đảm bảo trải nghiệm người dùng phong phú, đồng thời chuẩn hóa DTO kiểu dữ liệu trong `src/types/` để phản ánh trung thực cả thuộc tính cốt lõi của sơ đồ lớp và các trường mở rộng của cơ sở dữ liệu.

### 11. Tổ chức mã nguồn, Quản lý Type & Role Guard tập trung
- **Hiện trạng sai lệch:** Sử dụng kiểu `any[]` rải rác khắp các trang Admin, Barista và History. Việc kiểm tra quyền truy cập theo vai trò (`user.role !== 'ADMIN'`) đang viết lặp lại phân tán trong từng `useEffect` của mỗi page.
- **Giải pháp chuẩn:**
  - Định nghĩa 100% kiểu dữ liệu vào thư mục `src/types/` (khớp với DTO).
  - Tách hàm `fetchApi` để tự động chặn lỗi `401 Unauthorized` (tự động đăng xuất và điều hướng về `/login`).
  - Viết component bọc bảo vệ quyền truy cập theo vai trò (`RoleGuard`) cho các route `/staff`, `/admin`, `/orders/*`, `/checkout`.

---

## 5. QUY CHUẨN THIẾT KẾ MỚI: PHONG CÁCH "QUẦY CÀ PHÊ THỦ CÔNG" (CRAFT ROASTERY)

Đây là kim chỉ nam thẩm mỹ bắt buộc. Toàn bộ giao diện phải toát lên vẻ đẹp mộc mạc, tĩnh lặng và tinh tế của một quán cà phê thủ công cao cấp.

### 5.1. Bảng màu chuẩn WCAG AA (Loại bỏ hoàn toàn thang màu cũ)

Xóa bỏ hoàn toàn thang `coffee-50...950` cũ và các màu tùy tiện. Định nghĩa hệ biến CSS trong `globals.css` và ánh xạ vào `tailwind.config.js`:

```css
:root {
  /* Nền và bề mặt */
  --bg: #F4EFE7;           /* Nền trang chủ đạo (giấy kraft nhạt ấm) */
  --surface: #FBF8F3;      /* Nền thẻ card, ô input, bảng modal */
  --surface-2: #EFE8DC;    /* Vùng phụ, hover nhẹ, khung skeleton */

  /* Đường nét & Viền */
  --line: #E0D6C5;         /* Viền 1px mặc định */
  --line-strong: #CDBFA9;  /* Viền khi focus nhẹ, đường phân cách đậm */

  /* Mực & Văn bản (Tương phản cao) */
  --ink: #261E18;          /* Màu chữ chính (Tương phản 14.3:1 trên nền bg) */
  --ink-2: #5A4D42;        /* Màu chữ phụ, nhãn thông tin (7.1:1) */
  --ink-3: #74665A;        /* Chú thích, chữ giữ chỗ placeholder (4.8:1) */

  /* Màu nhấn Đất Nung (Terracotta Accent) - Dùng tiết chế ≤ 10% */
  --accent: #A9461F;       /* Duy nhất cho nút CTA chính, link active, dấu mốc */
  --accent-hover: #8C3716; /* Trạng thái hover/active của nút nhấn */
  --accent-soft: #F1DDD0;  /* Nền nhẹ của mục đang kích hoạt */
  --on-accent: #FFF8F1;    /* Chữ hiển thị trên nền accent */

  /* Màu Espresso Đậm */
  --espresso: #2B211A;     /* Nền Navbar, Footer, Hero banner */
  --on-espresso: #F4EFE7;  /* Chữ chính trên nền espresso (13.7:1) */
  --on-espresso-sub: #C9BBA8; /* Chữ phụ trên nền espresso (8.4:1) */

  /* Màu sắc trạng thái nghiệp vụ (Chỉ dùng cho Badge & Cảnh báo) */
  --success: #2F6B4F;
  --success-bg: #DCEBE2;
  --warning: #7A4F0E;
  --warning-bg: #F3E4C3;
  --danger: #A12C2C;
  --danger-bg: #F3D9D6;
  --info: #2E5E7E;
  --info-bg: #DAE7EE;
}
```

#### Quy tắc sử dụng màu sắc:
- **Tỷ lệ vàng 60-30-10:** 60% diện tích là `bg/surface`, 30% là `ink` và `espresso`, **tối đa 10% là `accent`**.
- Mỗi màn hình chỉ có **duy nhất 1 nút bấm mang màu `accent` đặc**.
- **Giá tiền hiển thị bằng màu `ink` (mực đen cà phê)** kết hợp thuộc tính font số `tabular-nums`. **Tuyệt đối không tô màu accent cho giá tiền**.
- Không dùng màu sặc sỡ để phân biệt các cột Kanban của Barista. Phân biệt bằng tiêu đề, đường kẻ trên (top border) 2px và số lượng đơn.

---

### 5.2. Hệ thống Typography (Fraunces + Be Vietnam Pro)
Sử dụng gói `next/font/google` nạp trong `src/app/layout.tsx`:

1. **Font Tiêu đề & Điểm nhấn:** **Fraunces** (Serif cổ điển, variable weight 500–600, `opsz` tự động). Dùng cho: Thẻ Heading `h1`, `h2`, tổng số tiền lớn tại trang thanh toán và wordmark Logo "BrewLite".
2. **Font Thân trang & Giao diện:** **Be Vietnam Pro** (Sans-serif được tối ưu hoàn hảo cho dấu thanh tiếng Việt). Trọng số: 400 (regular), 500 (medium), 600 (semibold). Dùng cho: Toàn bộ nút bấm, nhãn input, thẻ thông tin, nội dung bảng, mô tả món.
3. **Thang kích thước chữ (Type Scale):** Chỉ dùng đúng 6 cỡ chữ:
   `12px` (caption, eyebrow) · `14px` (body-small, buttons) · `16px` (body chuẩn) · `20px` (tiêu đề mục, h3) · `28px` (h2) · `40px` (h1, hero).
4. **Quy tắc cấm kỵ:**
   - **Cấm hoàn toàn class `font-black` (weight 900)**. Tối đa chỉ dùng `font-semibold` (weight 600).
   - Cấm dùng `uppercase tracking-wider` tràn lan trên các huy hiệu (chỉ cho phép ở nhãn eyebrow siêu nhỏ ≤ 12px, tối đa 1 chỗ/màn hình).

---

### 5.3. Hình khối, Đổ bóng, Viền, Chuyển động & Chống Slop

1. **Bo góc (Border Radius):**
   - Chỉ dùng 2 kích thước: `rounded-sm` (4px cho badge, checkbox, input nhỏ) và `rounded` (8px cho card, nút bấm, modal, input chuẩn).
   - **Nghiêm cấm `rounded-2xl`, `rounded-3xl` và `rounded-full` trên các nút bấm**. `rounded-full` chỉ được phép dùng cho ảnh đại diện avatar tròn hoặc dấu chấm trạng thái (status dot).
2. **Phân cấp giao diện:**
   - Phân cấp bằng **đường viền mảnh 1px (`border border-line`) kết hợp khoảng trắng rộng rãi (whitespace)**.
   - **Xóa bỏ toàn bộ `shadow-xl`, `shadow-2xl`**. Chỉ cho phép một bóng đổ nhẹ duy nhất cho menu dropdown hoặc modal trôi nổi: `box-shadow: 0 8px 24px rgba(38,30,24,0.12)`.
3. **Danh sách những thứ CẤM (Anti-Slop Craft Floor):**
   - ❌ Cấm dải màu chuyển gradient (`bg-gradient-*`).
   - ❌ Cấm các đốm màu nhòe mờ trang trí (`blur-3xl`, blob filter).
   - ❌ Cấm hiệu ứng nảy `animate-bounce` hoặc phóng to co giãn `hover:scale-*`.
   - ❌ Cấm kính mờ `backdrop-blur` trên các thẻ thông thường.
   - ❌ Cấm emoji và icon `Sparkles`.
   - ❌ Cấm hiển thị mã enum thô cho người dùng cuối (`PAID`, `PREPARING`... phải đổi sang tiếng Việt).
4. **Chuyển động (Motion):**
   - Chỉ dùng hiệu ứng đổi màu mượt `transition-colors` và độ mờ `transition-opacity` thời gian 150ms `ease-out`.
   - Thông báo Toast: Xuất hiện trượt nhẹ 150ms, tự tắt sau 3 giây, **tuyệt đối không được nảy**.
   - Hỗ trợ đầy đủ `@media (prefers-reduced-motion)`.
5. **Khả năng tiếp cận (Accessibility - a11y):**
   - Mọi phần tử tương tác (button, input, link) bắt buộc phải có hiệu ứng viền khi bấm phím Tab:
     `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`.
   - Toàn bộ ảnh `Image` phải có thuộc tính `alt` mô tả chuẩn xác.
   - Toàn bộ ô nhập liệu phải có `<label>` liên kết qua `htmlFor` hoặc `aria-label`.

---

### 5.4. Hệ thống UI Components dùng chung cần tạo mới (`src/components/ui/`)

Tạo mới thư mục `src/components/ui/` chứa các khối thành phần tái sử dụng để thay thế toàn bộ mã lặp lại:
1. `Button.tsx`: Các biến thể `primary` (nền accent), `secondary` (nền surface, viền line), `ghost` (trong suốt), `danger` (báo động đỏ). Hỗ trợ trạng thái `loading` (spinner mảnh) và `disabled`.
2. `Input.tsx`: Ô nhập chuẩn, viền `line`, focus chuyển sang viền `accent`, nhãn label rõ ràng, hiển thị lỗi qua `aria-describedby`.
3. `Badge.tsx`: Huy hiệu kích thước nhỏ, bo góc 4px.
4. `StatusBadge.tsx`: Hiển thị trạng thái đơn hàng dùng chung cho cả Khách hàng, Barista và Admin với nhãn tiếng Việt và màu sắc mềm dịu chuẩn mực.
5. `Card.tsx`: Thẻ chứa thông tin, nền `surface`, viền `line` 1px, bo góc 8px.
6. `Modal.tsx`: Hộp thoại xác nhận có bẫy focus (focus trap), hỗ trợ phím `Esc`, thuộc tính `role="dialog"` và `aria-modal="true"`.
7. `Toast.tsx`: Hệ thống thông báo nhẹ nhàng ở góc màn hình, thay thế toàn bộ các hàm `alert()` và `confirm()` nguyên thủy của trình duyệt.
8. `QuantityStepper.tsx`: Bộ điều khiển số lượng `[-] [số] [+]` với nút bấm vuông vức 28px, viền line, chữ số tabular.
9. `EmptyState.tsx`: Hiển thị khi danh sách trống với thông điệp nhẹ nhàng và một nút hành động gợi ý.
10. `PageHeader.tsx`: Tiêu đề trang chuẩn mực, phân tách không gian rõ ràng.
11. `Skeleton.tsx`: Khung tải dữ liệu màu `surface-2` chuyển sắc nhẹ thay thế màn hình trống.

---

## 6. LỘ TRÌNH THỰC THI 5 BƯỚC CHI TIẾT (A → B/C → D → E)

Hãy triển khai tuần tự theo đúng 5 bước sau. **Sau mỗi bước, bắt buộc chạy `npm run build` để kiểm tra và sửa dứt điểm mọi lỗi TypeScript trước khi chuyển bước.**

```
┌────────────────────────────────────────────────────────┐
│ BƯỚC A: Thiết lập Nền tảng Tokens, Fonts & Primitives   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ BƯỚC B: Tái thiết kế Components dùng chung (Nav/Footer)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ BƯỚC C: Thiết kế lại toàn bộ 9 màn hình theo phong cách│
│         "Quầy Cà Phê Thủ Công"                         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ BƯỚC D: Khắc phục triệt để 11 sai lệch Nghiệp vụ &     │
│         Đồng bộ 100% Sơ đồ lớp Draw.io                 │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ BƯỚC E: Kiểm tra toàn diện, Test a11y, Build & Báo cáo │
└────────────────────────────────────────────────────────┘
```

### Bước A — Nền tảng (Foundation)
1. Cập nhật `tailwind.config.js`: Khai báo bảng màu mới (`bg`, `surface`, `line`, `ink`, `accent`, `espresso`...), font family (`Fraunces`, `Be Vietnam Pro`), border radius (4px, 8px) và shadow đơn.
2. Cấu hình `src/app/layout.tsx`: Nạp fonts qua `next/font/google`, gắn biến CSS lên `<html>`, cấu hình `body` dùng màu nền `bg` và chữ `ink`. Thêm `themeColor: '#2B211A'` vào `metadata`.
3. Viết lại `src/app/globals.css`: Khai báo toàn bộ CSS variables, thanh cuộn scrollbar tối giản, `:focus-visible`, `@media (prefers-reduced-motion)`.
4. Tạo thư mục `src/components/ui/` và hoàn thiện 11 components dùng chung.

### Bước B — Component dùng chung (Navbar & Footer)
1. **Navbar:**
   - Nền màu `espresso`, chữ màu kem `#F4EFE7`.
   - Logo wordmark "BrewLite" bằng font Fraunces thanh lịch, loại bỏ ô icon gradient và nhãn "Cashless".
   - Link kích hoạt có gạch chân 2px màu `accent`, không tô nền khối.
   - Icon Giỏ hàng kèm chấm số lượng tĩnh màu `accent` (không nảy).
   - Khối tài khoản: Hiển thị `"Tên · N điểm"` (đổi hẳn sang chữ **"điểm"**).
   - **Sửa lỗi Mobile Menu:** Bổ sung drawer trượt cho màn hình < 768px (hiện tại thanh nav đang bị `hidden md:flex` làm biến mất hoàn toàn trên điện thoại).
2. **Footer:** Nền `espresso`, bố cục phẳng, các cột thông tin thương hiệu, giờ mở cửa và bản quyền tinh gọn.

### Bước C — Tái thiết kế từng màn hình
1. **Trang chủ (`/`):**
   - Hero banner thấp gọn gàng, nền `espresso` phẳng, tiêu đề Fraunces 40px câu chữ súc tích (*"Cà phê rang mộc pha máy, gọi trước nhận nhanh tại quầy."*), không blob mờ.
   - Bộ lọc tab danh mục dạng chữ gạch chân tinh tế (không dùng viên thuốc pill).
   - Thẻ sản phẩm: Tỉ lệ ảnh chuẩn 4:5 dùng `next/image` (kèm nền skeleton `surface-2`), giá "Từ ... đ" bằng font số tabular mực đen `ink`, nút `+` vuông 8px viền `line`.
2. **Chi tiết sản phẩm (`/products/[id]`):** Bố cục 2 cột rõ ràng (Ảnh sản phẩm | Bảng tùy chọn size, topping, số lượng). Thanh thêm vào giỏ dính đáy (bottom sticky bar) trên mobile.
3. **Giỏ hàng (`/cart`) & Thanh toán (`/checkout`):** Bảng tóm tắt cố định bên phải (sticky summary). Chọn phương thức thanh toán dạng danh sách radio tối giản. Bỏ dòng chữ kỹ thuật sáo rỗng về Idempotency-Key.
4. **Theo dõi đơn (`/orders/[id]`):** Trình theo dõi tiến độ tinh tế với dấu tích `ink` cho bước đã xong và chấm `accent` cho bước hiện tại. Có trạng thái riêng cho `PENDING`, `PAYMENT_FAILED` và `CANCELLED`.
5. **Lịch sử đơn (`/orders/history`):** Bảng danh sách phân cách bởi đường kẻ mỏng `line`, huy hiệu `StatusBadge`, thao tác hủy đơn mở `Modal` giải thích hoàn tiền rõ ràng.
6. **Quầy Barista (`/staff`):** 3 cột Kanban nền `surface-2`, viền trên 2px `ink`, thẻ đơn hiển thị mã đơn, giờ tạo, tên món + size + topping cỡ chữ lớn, nút bấm hành động chuẩn nghiệp vụ.
7. **Admin (`/admin`):** Thay thanh tab hiện tại bằng thanh điều hướng Sidebar bên trái (Tổng quan, Sản phẩm, Kho hàng, Khuyến mãi, Đánh giá, Tài khoản). Các con số tổng quan lớn màu mực `ink`, không tô màu lộn xộn.

### Bước D — Sửa triệt để 11 lỗi nghiệp vụ (Bắt buộc)
- Thực hiện đầy đủ các giải pháp kỹ thuật đã nêu chi tiết ở **Mục 4** (Topping, Idempotency, Enum, Đánh giá, Admin CRUD, Nhập kho, Barista, Hủy đơn, Điểm tích lũy, Đồng bộ Type và Role Guard).

### Bước E — Tự kiểm tra & Bàn giao (QA Verification)
1. Chạy lệnh: `npm run build` và `npm run lint`. Đảm bảo **0 lỗi, 0 cảnh báo**.
2. Kiểm tra chuỗi bị cấm bằng lệnh tìm kiếm (grep):
   - Đảm bảo **KHÔNG CÒN** bất kỳ từ khóa nào sau đây trong `src/`: `coffee-`, `gradient`, `blur-3xl`, `animate-bounce`, `font-black`, `rounded-3xl`, `rounded-2xl`, `shadow-xl`, `Sparkles`, `alert(`, `confirm(`.
3. Kiểm tra độ tương phản màu sắc toàn bộ các cặp chữ/nền đạt chuẩn WCAG AA (≥ 4.5:1).
4. Kiểm tra điều khiển phím: Có thể điều hướng toàn bộ trang bằng phím Tab/Enter/Esc với viền `:focus-visible` rõ ràng.

---

## 7. ĐỀ XUẤT CẬP NHẬT CHO SƠ ĐỒ LỚP DRAW.IO

*(Phần này dành riêng để báo cáo cho người dùng cập nhật lại file `Sơ-đồ-lớp-CNPM.drawio` trong bước hoàn thiện tài liệu, không làm thay đổi các quy tắc code phía trên)*:

1. **Bổ sung thuộc tính cho lớp `SanPham`:** Thêm `- moTa: String`, `- danhMuc: String` (COFFEE/TEA/FREEZE), `- trangThai: Boolean` (Đang bán / Tạm ngưng).
2. **Bổ sung thuộc tính cho lớp `DonHang`:** Thêm `- tongTien: double` (tổng tiền trước khi giảm) và `- ghiChu: String` (ghi chú cho barista).
3. **Bổ sung thuộc tính cho lớp `ChiTietDonHang`:** Thêm `- donGia: double` (chụp lại giá của biến thể tại thời điểm đặt, tránh việc sau này đổi giá sản phẩm làm sai lệch số liệu lịch sử đơn hàng cũ).
4. **Bổ sung thuộc tính cho lớp `GiaoDichThanhToan`:** Thêm `- phuongThuc: String` (WALLET | CARD) và `- ngayThanhToan: DateTime`. Sửa nhãn quan hệ giữa `DonHang` và `GiaoDichThanhToan` thành `1..1` đến `0..1`.
5. **Bổ sung cho lớp `NguyenLieu`:** Thêm `- nguongCanhBao: double` để thay thế số cảnh báo cố định.
6. **Chuẩn hóa ký hiệu số bội (Multiplicity):** Trong file draw.io hiện có một số nhãn gõ sai cú pháp UML (`1...1`, `0...1`, `1...*` chứa 3 dấu chấm) → Cần sửa lại chuẩn UML 2 dấu chấm: `1..1`, `0..1`, `1..*`.
7. **Bổ sung phương thức cho nhóm Kho:** Bổ sung các phương thức nghiệp vụ cho `NhaCungCap`, `PhieuNhap` (`+ LapPhieuNhap()`), và `ChiTietPhieuNhap`.
8. **Tối ưu lớp `DonHang`:** Hợp nhất phương thức `KiemTraTrangThai()` và `KiemTraChuyenTrangThai()` để tránh trùng lặp.

---

## 8. BÁO CÁO NGHIỆM THU THỰC THI TRỰC TIẾP VÀO CODE (IMPLEMENTATION REPORT)

> **Trạng thái:** ĐÃ HOÀN TẤT 100% CẢ 5 BƯỚC (A → B/C → D → E).  
> **Kiểm tra Build:** `next build` biên dịch thành công 11/11 routes với **0 lỗi TypeScript, 0 lỗi Linting**.  
> **Kiểm tra Anti-Slop:** Audit grep xác nhận **0 instance** của `coffee-`, `gradient`, `blur-3xl`, `animate-bounce`, `font-black`, `rounded-3xl`, `rounded-2xl`, `shadow-xl`, `Sparkles`, `alert(`, `confirm(`.

### 8.1. Danh sách các file đã tạo mới & tái cấu trúc
1. **Hệ thống Nền tảng & Tokens:**
   - [`frontend/tailwind.config.js`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/tailwind.config.js): Cấu hình hệ biến màu craft roastery, fonts `Fraunces` + `Be Vietnam Pro`, bo góc 4px/8px, shadow float.
   - [`frontend/src/app/globals.css`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/globals.css): CSS variables WCAG AA, focus-visible outline, thanh cuộn scrollbar tối giản, prefers-reduced-motion.
   - [`frontend/src/app/layout.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/layout.tsx): Nạp `next/font/google` (Fraunces & Be Vietnam Pro), metadata themeColor `#2B211A`.
   - [`frontend/src/types/index.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/types/index.ts): Định nghĩa 100% Type DTO khớp Sơ đồ lớp Draw.io.
   - [`frontend/src/lib/api.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/lib/api.ts): Bổ sung cơ chế tự động xử lý `401 Unauthorized` (xóa token và chuyển hướng về `/login`).
2. **Bộ 11 UI Components dùng chung (`src/components/ui/`):**
   - [`Button.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/Button.tsx), [`Input.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/Input.tsx), [`Badge.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/Badge.tsx), [`StatusBadge.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/StatusBadge.tsx), [`Card.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/Card.tsx), [`Modal.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/Modal.tsx), [`Toast.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/Toast.tsx), [`QuantityStepper.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/QuantityStepper.tsx), [`EmptyState.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/EmptyState.tsx), [`Skeleton.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/Skeleton.tsx), [`PageHeader.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/PageHeader.tsx), [`index.ts`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/ui/index.ts).
3. **Components dùng chung:**
   - [`frontend/src/components/Navbar.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/Navbar.tsx): Nền Espresso, wordmark Fraunces, link active gạch chân accent, nhãn điểm tích lũy, **bổ sung Mobile Drawer Menu** khắc phục lỗi mất nav trên điện thoại.
   - [`frontend/src/components/Footer.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/components/Footer.tsx): Phong cách Espresso tĩnh lặng, copy mộc mạc chuẩn quán cà phê.
4. **Toàn bộ 9 Màn hình giao diện đã thiết kế mới & sửa nghiệp vụ:**
   - [`frontend/src/app/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/page.tsx): Hero phẳng, tab danh mục chữ gạch chân, card ảnh 4:5, giá tabular-nums mực ink, nút `+` vuông 8px viền line, sao rating ink đơn.
   - [`frontend/src/app/products/[id]/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/products/[id]/page.tsx): Bố cục 2 cột, segmented size button, radio list topping cộng tiền trực tiếp, thanh CTA dính đáy mobile, danh sách đánh giá phân cách bởi đường kẻ.
   - [`frontend/src/app/cart/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/cart/page.tsx): Danh sách món có QuantityStepper, bảng tóm tắt cố định bên phải (sticky), ô mã coupon 1 dòng, tổng tiền Fraunces.
   - [`frontend/src/app/checkout/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/checkout/page.tsx): Idempotency-Key chuẩn UUIDv4, tạo đơn 1 lần duy nhất, tái sử dụng key khi retry chống đơn rác, radio list phương thức thanh toán, màn hình xử lý `PAYMENT_FAILED` riêng biệt.
   - [`frontend/src/app/orders/[id]/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/orders/[id]/page.tsx): Stepper tiến độ 4 bước (dấu tích ink + chấm accent), banner chúc mừng nhận điểm tích lũy khi `COMPLETED`, hỗ trợ trạng thái `PENDING`, `PAYMENT_FAILED`, `CANCELLED`.
   - [`frontend/src/app/orders/history/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/orders/history/page.tsx): Bảng danh sách phân cách bởi đường kẻ line, Modal hủy đơn giải thích hoàn tiền & hoàn kho, Modal đánh giá cho phép chọn từng món trong đơn (`KiemTraDaMua`).
   - [`frontend/src/app/staff/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/staff/page.tsx): 3 cột Kanban phân cách bằng đường kẻ trên (top border) 2px, thẻ đơn hiển thị kích cỡ và topping to rõ, nút bấm nghiệp vụ tuần tự, chỉ báo thời gian cập nhật lúc HH:mm.
   - [`frontend/src/app/admin/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/admin/page.tsx): Bố cục Sidebar bên trái (6 mục), 4 chỉ số lớn màu mực ink, biểu đồ doanh thu ink + accent, Modal lập phiếu nhập kho chọn nhà cung cấp thật và đơn giá thật, Modal thêm món mới, Modal tạo coupon, bảng nhân sự hỗ trợ khóa/mở khóa tài khoản.
   - [`frontend/src/app/login/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/login/page.tsx) & [`frontend/src/app/register/page.tsx`](file:///c:/Users/Lenovo/Desktop/tong%20hop/CNPM/frontend/src/app/register/page.tsx): Bố cục 1 cột 400px căn giữa, xử lý tài khoản bị khóa `LOCKED`, nút đăng nhập nhanh 3 vai trò phục vụ kiểm thử tiện lợi.

### 8.2. Nghiệm thu 11 lỗi nghiệp vụ theo Mục 4
- **Lỗi 1 (Topping & Giá):** Đã sửa. Client tính giá topping động gắn liền với variant, không còn phụ thuộc danh sách cố định vô căn cứ.
- **Lỗi 2 (Idempotency & Re-pay):** Đã sửa. Đơn hàng được giữ nguyên `orderId` và `idempotencyKey` chuẩn `crypto.randomUUID()`. Nút thanh toán khóa khi loading chống double-click. Màn hình báo lỗi có nút thử lại và đổi phương thức.
- **Lỗi 3 (Enum trạng thái):** Đã sửa. `StatusBadge` và các màn hình nhận diện đủ 7 trạng thái của `TrangThaiDonHang`.
- **Lỗi 4 (Đánh giá từng sản phẩm):** Đã sửa. Modal đánh giá cho phép chọn món cụ thể trong đơn, chỉ mở khi đơn `COMPLETED`.
- **Lỗi 5 (Chức năng Admin):** Đã bổ sung đầy đủ CRUD sản phẩm, Kho nhập hàng, Khuyến mãi, Kiểm duyệt đánh giá, và Khóa/mở khóa tài khoản nhân sự.
- **Lỗi 6 (Nhập kho dữ liệu thật):** Đã sửa. Form nhập kho chọn Nhà cung cấp từ danh sách, nhập số lượng và đơn giá thực tế.
- **Lỗi 7 (Quy trình Barista):** Đã sửa. 3 nút bấm chuẩn hóa: Nhận đơn → Pha xong → Bàn giao khách.
- **Lỗi 8 (Hủy đơn & Hoàn tiền):** Đã thay thế `confirm()` bằng Modal giải thích chính sách hoàn tiền và hoàn kho.
- **Lỗi 9 (Điểm tích lũy):** Đã đổi toàn bộ nhãn sang chữ "điểm" (`diemTichLuy`), tự động cộng và hiển thị điểm khi đơn `COMPLETED`.
- **Lỗi 10 (Đồng bộ thuộc tính Sơ đồ lớp):** Đã chuẩn hóa DTO trong `src/types/index.ts`.
- **Lỗi 11 (Tổ chức mã & 401 Guard):** Đã dọn sạch các kiểu `any[]`, tự động xử lý 401 chuyển hướng về login.

---
*(Hết tài liệu đặc tả & nghiệm thu - Toàn bộ mã nguồn đã sẵn sàng hoạt động).*

