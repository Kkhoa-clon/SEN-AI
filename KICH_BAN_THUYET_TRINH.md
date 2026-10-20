### KỊCH BẢN THUYẾT TRÌNH TRƯỚC GIÁM KHẢO – “Bé Sen AI”

Thời lượng gợi ý: 7–10 phút (5–7 phút trình bày + 2–3 phút demo + Q&A).

#### 0) Mở đầu (30–45 giây)
- Kính chào quý thầy cô và ban giám khảo. Em là …, đại diện nhóm …
- Hôm nay em xin trình bày đề tài “Bé Sen AI” – trợ lý học tập tiếng Việt chạy cục bộ, chi phí thấp, tối ưu cho học sinh.
- Mục tiêu: giúp học sinh học hiệu quả hơn nhờ AI, ngay cả khi điều kiện Internet và thiết bị còn hạn chế.

#### 1) Vấn đề & Nhu cầu (45–60 giây)
- Thực tế: Nhiều bạn học sinh phụ thuộc vào AI đám mây (tốn phí, lo ngại dữ liệu), khó tập trung, thiếu gợi ý theo bước.
- Các ứng dụng hiện có chưa tối ưu: tiếng Việt chưa tốt, thiếu chế độ giáo dục (quiz, phân tích lỗi sai), cần Internet ổn định.
- Nhu cầu: một trợ lý học tập tiếng Việt, chạy cục bộ, hỗ trợ tự học bền vững, có cơ chế chống “làm hộ toàn bộ”.

#### 2) Giải pháp – Bé Sen AI (60–90 giây)
- Ứng dụng web/desktop, giao diện tiếng Việt thân thiện.
- Chạy AI cục bộ qua Ollama → tiết kiệm chi phí, bảo mật dữ liệu.
- Tính năng chính:
  - Chat AI với “giải thích 3 tầng” (siêu dễ hiểu/sách giáo khoa/nâng cao).
  - Chế độ Quiz: tạo đề 15/45 phút, làm bài, chấm điểm tự động, phân tích lỗi sai.
  - Sơ đồ tư duy: tạo nhanh từ câu trả lời gần nhất để ôn tập.
  - An toàn học đường: phát hiện yêu cầu “làm hộ toàn bộ” và chuyển sang gợi ý từng bước.
  - Hỗ trợ công thức Toán: parse/evaluate/simplify và hiển thị LaTeX (KaTeX).

#### 3) Kiến trúc kỹ thuật (60–90 giây)
- Frontend: React + Vite + Material UI, tối ưu di động/desktop, lưu “ghi nhớ” theo hội thoại, Prompt Studio.
- Backend (Express): API công thức `POST /api/formula/eval`, `POST /api/formula/parse`, `GET /api/formula/examples`.
- AI: Ollama (mặc định `qwen2.5-coder:7b`, có thể thay thế).
- Electron: đóng gói thành ứng dụng desktop Windows.
- Lợi ích kỹ thuật: chi phí thấp, linh hoạt thay model, dễ mở rộng theo module (quiz, công thức, mindmap).

#### 4) Điểm mới & Sáng tạo (45–60 giây)
- Tối ưu cho học sinh Việt Nam, giọng nói/giao diện/nhãn tiếng Việt.
- Cơ chế chống lệ thuộc học tập (lọc prompt “làm hộ toàn bộ”, trả lời từng bước).
- Bộ công cụ học tập tích hợp: quiz + chấm điểm + phân tích lỗi sai + sơ đồ tư duy.
- Chạy cục bộ → giảm chi phí và tăng quyền riêng tư.

#### 5) Demo nhanh (2–3 phút)
- Kịch bản demo đề xuất (live):
  1) Mở ứng dụng (web hoặc bản Electron). Giới thiệu giao diện (sidebar hội thoại, vùng tin nhắn, input cố định phía dưới).
  2) Gõ một câu hỏi kiến thức ngắn (ví dụ: “Giải thích định luật bảo toàn năng lượng, cấp độ siêu dễ hiểu”). Cho thấy “giải thích 3 tầng” có thể chuyển nhanh giữa các mức.
  3) Bật chế độ Quiz → tạo đề 15 phút cho chủ đề vừa hỏi. Hiển thị câu hỏi trộn multiple-choice/đúng-sai, chọn thử vài đáp án → “Nộp bài” → xem điểm số, phân tích lỗi sai.
  4) Nhấn “Tạo sơ đồ tư duy” từ phản hồi gần nhất → trình chiếu mindmap mini.
  5) Gọi nhanh API công thức (hoặc mô tả): “2+2”, “∫x^2 dx” → hiển thị LaTeX/KaTeX.
- Lưu ý khi demo:
  - Ollama phải sẵn sàng, model đã pull. Nếu mạng/CPU yếu, ưu tiên câu hỏi ngắn.
  - Có sẵn 1–2 hội thoại và đề mẫu để fallback khi tốc độ sinh chậm.

#### 6) Đánh giá hiệu quả & Khả năng áp dụng (45–60 giây)
- Lợi ích: tiết kiệm thời gian (tạo/chấm đề), tăng hiệu quả (phân tích lỗi sai), hạn chế lệ thuộc (gợi ý từng bước), học mọi nơi (cục bộ).
- Thử nghiệm: chạy ổn định trên Windows với cấu hình phổ thông; UI mượt, quiz/chấm điểm hoạt động tốt.
- Khả năng mở rộng: thêm bộ môn, thêm rubric chấm tự luận, kết nối kho bài tập, thêm TTS/ASR tiếng Việt.

#### 7) Kế hoạch & Chi phí (30–45 giây)
- MVP đã hoàn thiện các luồng chính. Kế hoạch tiếp theo: tối ưu tốc độ sinh, thêm quản lý lớp/học sinh, đồng bộ đám mây tùy chọn.
- Chi phí: gần như 0 cho hạ tầng (cục bộ); chủ yếu là thời gian phát triển và máy tính người dùng.

#### 8) Kết luận (20–30 giây)
- Bé Sen AI mang AI đến gần học sinh Việt Nam hơn: rẻ, an toàn, hiệu quả.
- Kính mong nhận góp ý từ ban giám khảo để phát triển sản phẩm sâu hơn cho giáo dục.

---

### Dàn ý slide gợi ý (10–12 slide)
1) Tiêu đề & thành viên
2) Vấn đề & nhu cầu thực tế
3) Giải pháp Bé Sen AI (tóm tắt)
4) Tính năng chính (chat 3 tầng, quiz, mindmap, an toàn học đường)
5) Demo flow (5 bước)
6) Kiến trúc kỹ thuật (sơ đồ bloc: Frontend ↔ Backend ↔ Ollama)
7) Điểm mới & sáng tạo
8) Hiệu quả & thử nghiệm thực tế
9) Khả năng áp dụng & mở rộng
10) Kế hoạch & chi phí
11) Rủi ro & phương án giảm thiểu
12) Kết luận & lời cảm ơn

---

### Câu hỏi thường gặp (Q&A) và gợi ý trả lời
- Hỏi: Tại sao cần chạy cục bộ, không dùng API đám mây?
  - Đáp: Giảm chi phí dài hạn, tăng quyền riêng tư dữ liệu học sinh, hoạt động ngay cả khi mạng yếu.
- Hỏi: Model có đủ chính xác không? Có thể thay được không?
  - Đáp: Dùng Ollama nên có thể thay/pull model khác phù hợp bài toán. Có thể tinh chỉnh hướng dẫn hệ thống và cấu hình nhiệt độ để ổn định hơn.
- Hỏi: Làm sao hạn chế học sinh “lười”?
  - Đáp: Cơ chế phát hiện “làm hộ toàn bộ” → ép AI trả lời theo bước gợi ý. Quiz/chấm điểm/ phân tích lỗi sai để củng cố kiến thức thay vì chỉ đưa đáp án.
- Hỏi: Bảo mật dữ liệu thế nào?
  - Đáp: Xử lý cục bộ, không gửi dữ liệu cá nhân ra ngoài. Với bản đám mây (nếu có), sẽ có cơ chế ẩn danh hóa/tuân thủ.
- Hỏi: Khả năng mở rộng?
  - Đáp: Kiến trúc module: thêm bộ môn, rubric tự luận, bài tập chuẩn hóa, đồng bộ lớp học, tích hợp TTS/ASR tiếng Việt.
- Hỏi: Chi phí thiết bị?
  - Đáp: Máy phổ thông có thể chạy; có thể chọn model nhẹ. Không cần GPU bắt buộc cho demo/ứng dụng cơ bản.

---

### Checklist demo nhanh (1 phút trước khi lên)
- Ollama đang chạy; model đã pull (`qwen2.5-coder:7b` hoặc tương đương).
- Backend `http://localhost:5000/health` báo OK.
- Frontend mở sẵn 1 tab với hội thoại mẫu, sẵn prompt ngắn gọn.
- Có sẵn 1 đề quiz đã sinh để fallback nếu mạng/CPU bận.
- Nút “Tạo sơ đồ tư duy” hiển thị và hoạt động.

---

### Phụ lục kỹ thuật (tham chiếu nhanh)
- Dev: `npm run dev` tại thư mục gốc để chạy cả frontend và backend.
- API công thức: `POST /api/formula/eval | /api/formula/parse`, `GET /api/formula/examples`.
- Electron build: `cd frontend && npm run dist` (Windows NSIS).
