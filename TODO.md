# ChatGPT Exact Replica Plan ✅

**User Request**: Layout giống ChatGPT chính xác:
- PC: 2 cột (Sidebar trái + Chat chính).
- Mobile: Hamburger menu ẩn sidebar, chat full-width.
- Messages: User phải (bg xanh/xám), Bot trái (neutral), Markdown support (đã có), bottom-aligned.
- Input: Sticky bottom, auto-grow Textarea, Send (paper plane), Attach icons, keyboard-safe.

**Current Analysis**:
- Header.tsx: Có hamburger drawer responsive.
- Footer.tsx: Có.
- Chatbot.tsx: Card-based chat, need sidebar integration.

**Detailed Plan**:
**Info Gathered**: SPA React Router, MUI, Header has drawer nav, Footer grid. Chatbot standalone.

**Files to Edit**:
1. App.tsx: 2-column layout (Drawer sidebar + main chat outlet).
2. Chatbot.tsx: Remove Card/container, pure full-height chat (messages + sticky input).
3. Integrate Header/Footer.
4. Sidebar content: "Lịch" (chat history? new History component).

**Dependent**: Header, Footer, new Sidebar/History.

**Followup**: Test routing, responsive toggle.
