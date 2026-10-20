# Cấu Trúc Hoạt Động Dự Án Bé Sen AI

## 1) Tổng quan

- Dự án là trợ lý học tập AI chạy cục bộ, giao diện web React + MUI, sử dụng Ollama (`http://localhost:11434`) làm mô hình ngôn ngữ.
- Có backend Node/Express để cung cấp API công thức toán học (`/api/formula/*`).
- Có cấu hình Electron để đóng gói thành ứng dụng desktop Windows.
- Trọng tâm hiện tại: chatbot học tập cho học sinh, có kiểm tra trắc nghiệm, chấm điểm, phân tích sai lầm, bảo toàn năng lực tự học.

## 2) Cấu trúc thư mục chính

- `frontend/`: ứng dụng giao diện (Vite + React + TypeScript + MUI).
- `backend/`: server API (Express), hiện bật route công thức toán.
- `frontend/electron/main.cjs`: tiến trình chính Electron (mở app, kiểm tra Ollama, khởi chạy backend dev).
- `frontend/src/components/Chatbot.tsx`: file trung tâm chứa phần lớn logic nghiệp vụ AI + UX.

## 3) Kiến trúc runtime

### 3.1 Frontend

- Entry: `frontend/src/main.tsx` -> mount `App`.
- `App.tsx` bọc toàn bộ UI bằng `ThemeProvider`.
- `Chatbot.tsx` quản lý:
  - state hội thoại
  - stream phản hồi AI
  - quiz/đề thi/chấm điểm
  - memory cục bộ
  - telemetry
  - Prompt Studio
  - giao diện responsive desktop/mobile.

### 3.2 AI (Ollama)

- Lấy danh sách model: `GET /api/tags`.
- Chat stream: `POST /api/chat` với `stream: true`.
- Chat non-stream cho nghiệp vụ JSON (quiz/mindmap/phân tích): `stream: false`.

### 3.3 Backend Express

- File chính: `backend/server.js`.
- Route hoạt động:
  - `POST /api/formula/eval`
  - `POST /api/formula/parse`
  - `GET /api/formula/examples`
- Health check: `GET /health`.

### 3.4 Electron (desktop)

- Tự kiểm tra Ollama; nếu chưa có sẽ gợi ý cài.
- Cố gắng `ollama serve` và `ollama pull qwen2.5-coder:7b`.
- Ở chế độ dev có thể spawn backend.
- Đảm bảo single-instance (không mở nhiều cửa sổ trùng).

## 4) Luồng dữ liệu chatbot

1. Người dùng nhập prompt trong `Chatbot.tsx`.
2. Hệ thống áp dụng:
   - giải thích 3 tầng
   - guard chống "làm hộ toàn bộ" (nếu bật)
   - memory ngữ cảnh hội thoại.
3. Gọi Ollama stream, cập nhật token theo thời gian thực vào tin nhắn bot.
4. Lưu lịch sử, telemetry, memory vào localStorage/state.

## 5) Toàn bộ tính năng hiện có

## A. Chat cốt lõi

- Streaming phản hồi thời gian thực.
- Dừng sinh nội dung (`Stop generating`).
- Gửi lại prompt gần nhất (`Retry`).
- Chọn model chính, model phụ.
- So sánh A/B 2 model (nếu bật compare mode).

## B. Quản lý hội thoại

- Tạo hội thoại mới.
- Đổi tên hội thoại.
- Xóa hội thoại.
- Chọn hội thoại từ sidebar.
- Lưu hội thoại cục bộ qua localStorage.

## C. Memory & cá nhân hóa

- Lưu "bộ nhớ ngữ cảnh" theo từng hội thoại.
- Ghim thông tin từ phản hồi bot vào memory.
- Xóa memory theo hội thoại.
- System prompt tùy chỉnh.
- Temperature tùy chỉnh.

## D. Prompt Studio & thao tác nhanh

- Prompt mẫu mặc định.
- Lưu prompt template từ nội dung nhập.
- Chọn template để nạp nhanh.
- Tác vụ nhanh: tóm tắt, viết lại, checklist, giải thích đơn giản.
- Onboarding chip gợi ý prompt ban đầu.

## E. Chế độ giáo dục (MVP)

- **Giải thích 3 tầng**
  - `simple`: siêu dễ hiểu
  - `textbook`: chuẩn sách giáo khoa
  - `advanced`: nâng cao học sinh giỏi
- **An toàn học đường / chống lệ thuộc AI**
  - Phát hiện yêu cầu "làm hộ hoàn toàn"
  - Tự chuyển sang chế độ gợi ý từng bước
  - Cảnh báo rõ cho người dùng
- **Đề kiểm tra mô phỏng**
  - Tạo đề trắc nghiệm + đúng/sai bằng AI
  - Chọn số câu, mức độ (`de/trung_binh/kho`)
  - Chế độ đề 15 phút / 45 phút (đếm ngược)
  - Nộp bài -> chấm điểm % + số câu đúng + tổng điểm
  - Phân tích sai lầm phổ biến sau khi nộp
- **Nút bật chế độ trả về quiz**
  - Khi bật, prompt giải bài sẽ tạo bộ câu hỏi để học sinh làm và tính điểm.

## F. Phân tích nội dung học

- Tạo sơ đồ tư duy từ phản hồi AI gần nhất (AI trả JSON mindmap).
- Hiển thị mindmap cây ở mobile/desktop.
- Hỗ trợ nhập tài liệu dạng văn bản trong luồng prompt (nội dung text).
- Đã có xử lý nhận PDF/DOCX ở UI; trích xuất trực tiếp còn phụ thuộc mức parser hiện dùng.

## G. Hiển thị nội dung nâng cao

- Render Markdown.
- Highlight code block.
- Nút copy code.
- Thu gọn/mở rộng code dài.

## H. Telemetry UX

- Theo dõi:
  - tổng prompt
  - phản hồi thành công
  - lỗi
  - số lần dừng
  - thời gian phản hồi trung bình
  - vote hữu ích/chưa đúng

## I. Giao diện & responsive

- Responsive mobile + desktop.
- Sidebar hội thoại (desktop) + drawer (mobile).
- Khu vực input dạng pill.
- Theme xanh lá nhấn (đã chuyển từ xanh dương theo yêu cầu gần nhất).
- Hiệu ứng nhẹ, ưu tiên mượt và dễ đọc.

## 6) LocalStorage keys đang dùng

- `chatbot_v3_conversations`: danh sách hội thoại + memory.
- `chatbot_v3_active_id`: hội thoại đang mở.
- `chatbot_v3_settings`: model, compare mode, temperature, system prompt.
- `chatbot_v3_telemetry`: thống kê UX.
- `chatbot_v3_templates`: Prompt Studio.

## 7) API backend hiện hữu

## `POST /api/formula/eval`

- Input: `formula`, `variables`, `safe`.
- Output: kết quả tính toán, latex, giải thích, html render KaTeX.

## `POST /api/formula/parse`

- Input: `text`.
- Output: danh sách công thức phát hiện được trong văn bản.

## `GET /api/formula/examples`

- Trả ví dụ công thức mẫu + hướng dẫn dùng API.

## 8) Điểm mạnh hiện tại

- Chạy AI local (riêng tư, không phụ thuộc cloud).
- Trải nghiệm giáo dục có chiều sâu (quiz + chấm + phân tích + chống lệ thuộc).
- Quản lý hội thoại/memory/tùy chỉnh khá đầy đủ trong một giao diện.
- Có đường phát triển lên desktop app qua Electron.

## 9) Hạn chế hiện tại

- Nhiều logic tập trung trong một file `Chatbot.tsx` (khó mở rộng lâu dài).
- Parsing PDF/DOCX chưa hoàn chỉnh end-to-end trong mọi trường hợp.
- Backend hiện mới bật route formula; các route khác đang để TODO.

## 10) Định hướng nâng cấp kỹ thuật

- Tách `Chatbot.tsx` thành:
  - hooks: `useChat`, `useAssessment`, `useTelemetry`
  - components: `ChatPanel`, `AssessmentPanel`, `Sidebar`, `MindmapPanel`.
- Chuẩn hóa schema JSON khi gọi model (quiz/mindmap) với validate.
- Tách service layer Ollama (`chatService.ts`) để test đơn vị.
- Bổ sung parser PDF/DOCX ổn định cho luồng phân tích tài liệu học tập.

---

Tài liệu này phản ánh trạng thái code hiện tại trong workspace và có thể dùng làm nền để thuyết trình, bàn giao, hoặc viết tài liệu kỹ thuật chi tiết hơn.
