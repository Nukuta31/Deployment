# Keyword Content Downloader & Offline Reader
[Russian version below]

A highly polished, production-grade full-stack Node.js + React web application designed to query keywords, fetch mappings, download content in real-time through a server proxy with live chunked streaming transfer progress logs, and persist copy segments inside `LocalStorage` for fully functional offline reading.

## Features
- **Keyword Search Portal**: Query matched indexing paths stored in server memory (presets: `#react`, `#space`, `#news`, `#offline`, `#coding`).
- **Dynamic Proxy Stream**: Downloads both local virtual documents (with simulated latency) and real remote web URLs through a server-side Express SSE (Server-Sent Events) pipeline reporting size metrics and percentage progress bars instantly.
- **Robust Client Cache**: Persists crawled contents inside standard `LocalStorage` so any document can be opened and parsed when the internet is completely absent.
- **Aesthetic Text Reader**: Includes inline search filter highlight, word-counts, reading session estimators, copy triggers, and high-fidelity Markdown parsing in a beautiful distraction-free full-screen paper layout.

---

## Getting Started / Инструкция по запуску

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm

### Installation & Run
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run in Development Mode**:
   ```bash
   npm run dev
   ```
   *The server dynamically binds on `0.0.0.0:3000` with hot-rebuilding enabled.*

3. **Build & Run Production compiled build**:
   ```bash
   npm run build
   ```
   This compiles the React single-page client and packages the background Express backend into a standalone file `dist/server.cjs` using esbuild to resolve references perfectly.

4. **Launch Production**:
   ```bash
   npm run start
   ```

---

## Endpoints structure
- `GET /api/keywords` — Returns list of pre-seeded keywords.
- `GET /api/search?q=query` — Returns keyword matches or searches for titles and descriptions.
- `GET /api/download?url=url&keyword=keyword` — Establish background Server-Sent Events (SSE) connection which streams downloading progress chunks.

---

# Описание проекта и Алгоритм

Полнофункциональное веб-приложение на JavaScript/TypeScript (React + Node.js/Express) для фонового скачивания и оффлайн-чтения документов по ключевым словам.

### Архитектурный Алгоритм:
1. **Поиск по ключевому слову**: Клиент в фоновом режиме (AJAX/Fetch) отправляет запрос на сервер по ключевому слову. Сервер возвращает список подходящих URL с описанием и ожидаемым размером.
2. **Фоновое скачивание с индикацией прогресса**: При выборе ссылки клиент открывает однонаправленный канал `EventSource` (Server-Sent Events) к `/api/download`. Сервер скачивает контент из источника и транслирует его клиенту по частям (чанками), непрерывно передавая:
   - Объем скачанных байт (`loaded`)
   - Общий размер ресурса (`total`)
   - Процент загрузки (`progress`)
3. **Сохранение в LocalStorage**: После завершения ретрансляции клиент сохраняет финальный текст в свое локальное хранилище данных (`LocalStorage`).
4. **Оффлайн Чтение**: Приложение полностью работоспособно при отсутствии интернета. Пользователь может открывать сохраненные материалы, искать фрагменты текста через встроенный фильтр, переходить в полноэкранный режим чтения, удалять или очищать кэш.

### Используемые технологии:
- **Разработчик/Сервер**: Node.js, Express, tsx.
- **Клиент**: React 19, Tailwind CSS, Lucide Icons, Custom Markdown high-fidelity parser.
