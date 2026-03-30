### TÓM TẮT ĐỀ TÀI

#### 1. Ý tưởng
Ý tưởng xuất phát từ nhu cầu học tập hằng ngày của học sinh: cần một trợ lý AI tiếng Việt chạy mượt trên máy cá nhân, chi phí thấp, hoạt động cả khi không có Internet và có các tính năng chuyên cho giáo dục (tạo đề, chấm điểm, gợi ý từng bước). Một số sản phẩm tương tự còn hạn chế: phụ thuộc đám mây (tốn phí, rủi ro quyền riêng tư), thiếu tối ưu cho ngữ cảnh tiếng Việt, chưa có cơ chế “chống lệ thuộc” khi làm bài tập.

Từ đó, nhóm xây dựng “Bé Sen AI” – mô hình ứng dụng AI cục bộ, giao diện web hiện đại và có bản đóng gói desktop. Ứng dụng tập trung vào: hỗ trợ học tập, sinh hoạt hằng ngày và tăng hiệu quả tự học với các chế độ quiz, phân tích lỗi sai, và sơ đồ tư duy.

#### 2. Mô tả cấu tạo mô hình/sản phẩm
– Nguyên vật liệu (phần mềm/phần cứng cần thiết):
- Máy tính cá nhân (Windows khuyến nghị).
- Node.js (>= 18), npm (>= 9).
- Frontend: React + Vite, Material UI.
- Backend: Node.js + Express (API xử lý công thức/ký hiệu Toán).
- AI cục bộ: Ollama (mặc định dùng `qwen2.5-coder:7b`, có thể thay đổi).
- Electron (đóng gói thành ứng dụng desktop).

– Cách lắp ráp (thiết lập và chạy dự án):
1) Chuẩn bị môi trường
   - Cài Node.js và npm.
   - Cài Ollama và kéo model cần dùng (ví dụ: `ollama pull qwen2.5-coder:7b`).
2) Lắp đặt các bộ phận chính (cài dependencies)
   - Ở thư mục gốc `C:\Job`: chạy `npm run install:all` (tự cài cho `backend` và `frontend`).
3) Kết nối các thành phần
   - Chạy đồng thời Backend và Frontend: `npm run dev` (ở thư mục gốc).
   - Frontend (Vite) sẽ proxy các yêu cầu `/api` về Backend.
   - Electron (dev) có thể khởi chạy giao diện và (tùy chế độ) tự bật backend.
4) Kiểm tra và hoàn thiện
   - Truy cập giao diện React tại `http://localhost:5173`.
   - Kiểm tra API công thức tại `http://localhost:5000/health` và các endpoint `/api/formula/*`.

Thời gian hoàn thành sản phẩm: tùy quy mô tính năng; bản MVP hiện tại có thể triển khai trong khoảng 1–2 tuần (bao gồm tích hợp UI, backend công thức, kết nối Ollama và đóng gói Electron).

#### 3. Nguyên tắc hoạt động
Sản phẩm hoạt động theo chuỗi: người dùng nhập yêu cầu → Frontend (React) tiền xử lý và hiển thị → gọi AI cục bộ qua Ollama để sinh nội dung → đồng thời có thể gọi Backend (Express) để:
- Đánh giá hoặc phân tích công thức Toán với `mathjs` và hiển thị LaTeX bằng `katex`.
- Trích xuất công thức từ văn bản theo quy ước $...$ hoặc $$...$$.

Luồng tổng quát:
- Tín hiệu đầu vào (prompt, yêu cầu học tập) → Chat UI.
- Bộ xử lý (logic Frontend + API Backend + Ollama) → sinh/nắn nội dung, tạo quiz, đo thời gian, phân tích lỗi sai, tạo sơ đồ tư duy.
- Thiết bị xuất (giao diện React/Electron) → hiển thị Markdown, code block, kết quả công thức (KaTeX), sơ đồ tư duy.

Các endpoint Backend chính (`backend/routes/formula.js`):
- `POST /api/formula/eval`: Nhận `formula`, `variables` → parse, evaluate, simplify → trả về kết quả, LaTeX và HTML render qua KaTeX.
- `POST /api/formula/parse`: Trích công thức từ văn bản theo regex LaTeX ($...$, $$...$$) → danh sách công thức và văn bản đã ẩn công thức.
- `GET /api/formula/examples`: Ví dụ sử dụng/định dạng tiếng Việt.

#### 4. Tính mới
- Tối ưu cho người dùng Việt Nam và bối cảnh giáo dục: giao diện, thông điệp, và ví dụ tiếng Việt.
- Chạy AI cục bộ qua Ollama: giảm chi phí hạ tầng đám mây, bảo toàn dữ liệu cá nhân.
- Cơ chế “an toàn học đường” chống lệ thuộc: phát hiện yêu cầu kiểu “làm hộ toàn bộ” và tự chuyển sang chế độ gợi ý theo bước.
- Chế độ kiểm tra (quiz) và mô phỏng đề 15/45 phút; chấm điểm, thống kê và phân tích lỗi sai.
- Tạo sơ đồ tư duy tự động từ phản hồi gần nhất giúp ôn tập nhanh.

Nhờ các cải tiến trên, chi phí vận hành thấp, hiệu quả học tập tăng và phù hợp điều kiện thực tế của học sinh tại địa phương (máy cấu hình trung bình, mạng không ổn định).

#### 5. Tính sáng tạo
- Thiết kế giao diện đơn giản nhưng hiệu quả (Material UI, tối ưu trên di động/desktop, sidebar hội thoại, input dính cuối trang).
- Kết hợp nhiều chức năng trong một mô hình: chat AI, tạo quiz, chấm điểm, phân tích sai lầm, sơ đồ tư duy, hỗ trợ công thức Toán (KaTeX).
- Tận dụng “vật liệu chi phí thấp” (phần mềm mã nguồn mở): React, Vite, Express, Ollama, KaTeX, mathjs, Electron.
- Cải tiến hạn chế của sản phẩm cũ/giải pháp phổ biến:
  - Tối ưu cấu trúc: tách rõ Frontend/Backend, proxy linh hoạt (hỗ trợ Ngrok khi cần).
  - Giảm giá thành: chạy AI cục bộ, không lệ thuộc API đám mây.
  - Tăng độ tiện lợi: A/B so sánh 2 model, 3 tầng giải thích (siêu dễ hiểu/sách giáo khoa/nâng cao), lưu “ghi nhớ” theo hội thoại, Prompt Studio.

#### 6. Khả năng áp dụng
- Đã thử nghiệm thực tế với Ollama cục bộ: hoạt động ổn định trên Windows, giao diện mượt, chat và tạo quiz vận hành tốt trong phạm vi nội bộ.
- Có thể ứng dụng rộng rãi trong:
  - Học tập: luyện đề, ôn tập nhanh, tóm tắt, giải thích theo 3 tầng.
  - Sinh hoạt hằng ngày: viết email, checklist, tóm tắt nội dung.
  - Hỗ trợ hoạt động thực tế: trình bày công thức, trích xuất công thức, xây dựng sơ đồ tư duy.
- Sản phẩm giúp giải quyết:
  - Tiết kiệm thời gian (tạo đề tự động, chấm điểm tức thì, tóm tắt nhanh).
  - Giảm công sức (gợi ý từng bước, nhắc kiến thức nền, lưu ghi nhớ theo hội thoại).
  - Tăng hiệu quả (phân tích lỗi sai, so sánh 2 model, hoạt động được cả khi hạn chế Internet).

---

Ghi chú kỹ thuật nhanh:
- Khởi động dev toàn hệ thống: chạy tại `C:\Job` → `npm run dev` (song song backend và frontend). Frontend tại `http://localhost:5173`, Backend tại `http://localhost:5000`.
- Build Frontend: `cd frontend && npm run build`. Đóng gói desktop: `cd frontend && npm run dist` (Electron Builder).
- Endpoint kiểm tra Backend: `GET /health` trả `{ status: 'OK' }` và thông báo hỗ trợ công thức.
