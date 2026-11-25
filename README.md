# Kawaii English 5 Playland • Easy Peasy Style + AI Mun & Mèo Mochi

Website học tiếng Anh tiểu học (bám sát **Tiếng Anh 5 Global Success Tập 1 & Tập 2** cùng các chủ đề cơ bản lớp 1–5) với **20 trò chơi tương tác**, **Trợ lý AI Mun (4 cảm xúc + Chat Gemini 3 Flash)**, **Góc nuôi Pet Mèo Mochi & Bông hoa 🌸**, **Kho Lỗi Sai**, **Game Editor cho Giáo viên**, và **Trình kiểm thử đa thiết bị**.

## Cấu trúc thư mục
- `index.html`: Trang chủ Kawaii Playland, 14 game nền tảng, Mèo Mochi, Chuỗi 7 ngày, Kho Lỗi Sai, Game Editor (PDF/DOCX/TXT/Ảnh).
- `phonics-racing.js`: Game **Phonics Racing – Đua Xe Thu Thập Chữ Cái** (khu vườn xanh, đường đua tím, âm phonics, Editor riêng).
- `block-blast.js`: Game **Block Blast Tiếng Anh** (bàn cờ 8×8, mở khóa 3 khối gạch bằng từ vựng, kéo thả lệch ngón tay cho mobile, lưu lỗi sai).
- `demo-games-pack.js`: 4 game phong cách Easy Peasy Demo (`Mochi Merge`, `Peekaboo Pals!`, `Sneaky Spotlight`, `Shadow Fusion`).
- `mun-ai.js` & `assets/mun/`: Bạn đồng hành **AI Mun** (4 biểu cảm `normal`, `happy`, `sad`, `suspicious`, hiệu ứng âm thanh Web Audio và khung chat giải bài tập).
- `device-tester.html`: Công cụ kiểm thử hiển thị local HTML trên nhiều dòng điện thoại/tablet (hỗ trợ xoay ngang/dọc, so sánh nhiều máy).
- `ai-proxy-server.mjs` & `package.json`: Máy chủ proxy bảo mật giữ `GEMINI_API_KEY` ở phía server khi chạy local (mặc định dùng `gemini-3-flash-preview`).
- `api/` & `vercel.json`: Các Vercel Serverless Functions (`/api/health`, `/api/chat-mun`, `/api/generate-game`) để deploy trọn vẹn cả giao diện lẫn AI Mun lên **Vercel**.
- `.env.example`: File mẫu cấu hình biến môi trường (sao chép thành `.env` khi chạy local — không bao giờ push `.env` lên GitHub).
- `.github/workflows/deploy-pages.yml`: Tự động deploy bản web tĩnh lên **GitHub Pages** khi push lên nhánh `main` / `master`.

## Cách chạy nhanh
### 1. Deploy lên Vercel (Khuyên dùng)
1. Upload toàn bộ **các file và thư mục bên trong** `github-upload/` lên thư mục gốc của repo GitHub (hoặc vào Vercel Project → **Settings → Build and Deployment → Root Directory** chọn `github-upload`).
2. Vào Vercel Project → **Settings → Environment Variables**, thêm `GEMINI_API_KEY` (và bấm Redeploy) để bật **Chat AI Mun** & **AI Tạo Game** trực tiếp trên `/api/chat-mun` và `/api/generate-game`.

### 2. Chạy đầy đủ với AI Proxy Server ở Local
1. Cài Node.js (>= 18).
2. Tạo file `.env` từ `.env.example` và điền `GEMINI_API_KEY=...`.
3. Chạy `npm start` (hoặc nhấp đúp `start-playland.bat` trên Windows), sau đó mở `http://localhost:3001`.

### 3. Chạy trực tiếp / Deploy GitHub Pages
- Mở `index.html` trực tiếp hoặc bật **Settings → Pages → Source: GitHub Actions** trên repo GitHub của bạn.
- Toàn bộ 20 trò chơi, Mèo Mochi, Bông hoa 🌸, Kho Lỗi Sai và 4 biểu cảm của Mun chạy ngay không cần server; riêng khung Chat AI Mun có tùy chọn nhập API key tạm theo phiên (`sessionStorage`) khi chạy bản tĩnh hoặc kết nối tới `/api` trên Vercel.
