import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Download, 
  BookOpen, 
  Trash2, 
  FileText, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  RefreshCw, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  BookMarked,
  Layers,
  Copy,
  Maximize2,
  Minimize2,
  Calendar,
  Save,
  HelpCircle,
  Hash
} from "lucide-react";
import MarkdownRenderer from "./components/MarkdownRenderer";
import { UrlItem, DownloadProgress, DownloadedItem, DownloadStatus } from "./types";

export default function App() {
  // Keyword Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Record<string, UrlItem[]>>({});
  const [isSearching, setIsSearching] = useState(false);
  
  // Custom external URL insertion state
  const [customUrl, setCustomUrl] = useState("");
  const [customKeyword, setCustomKeyword] = useState("general");
  const [customTitle, setCustomTitle] = useState("");
  const [isCustomExpanded, setIsCustomExpanded] = useState(false);

  // Active Downloads
  const [activeDownload, setActiveDownload] = useState<DownloadProgress | null>(null);
  const activeEventSource = useRef<EventSource | null>(null);
  
  // Stored Offline Items
  const [downloadedItems, setDownloadedItems] = useState<DownloadedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DownloadedItem | null>(null);
  const [readerInFocusMode, setReaderInFocusMode] = useState(false);
  const [readerSearchTerm, setReaderSearchTerm] = useState("");

  // Error and UI Messages
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);

  // Load static configurations & saved contents
  useEffect(() => {
    // 1. Monitor real browser network availability
    const handleOnline = () => setIsNetworkOnline(true);
    const handleOffline = () => setIsNetworkOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 2. Load preseeded keywords list from server
    fetchKeywords();

    // 3. Load downloaded elements from local storage
    const loadedLocalStorage = localStorage.getItem("OFFLINE_DOWNLOADS");
    if (loadedLocalStorage) {
      try {
        const parsed = JSON.parse(loadedLocalStorage);
        setDownloadedItems(parsed);
        if (parsed.length > 0) {
          // Default select the first item to let the user see how it reads
          setSelectedItem(parsed[0]);
        }
      } catch (err) {
        console.error("Local storage offline cache parse error:", err);
      }
    }

    // 4. Fire an initial empty search to populate all resources
    triggerSearch("");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (activeEventSource.current) {
        activeEventSource.current.close();
      }
    };
  }, []);

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/keywords");
      if (res.ok) {
        const keys = await res.json();
        setAvailableKeywords(keys);
      }
    } catch (e) {
      console.error("Failed to load server keyword list", e);
    }
  };

  const triggerSearch = async (query: string) => {
    setIsSearching(true);
    setGeneralError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (err: any) {
      console.error("Searching error:", err);
      setGeneralError(err.message || "Failed to contact database on the server.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(searchQuery);
  };

  const handleQuickKeywordClick = (key: string) => {
    setSearchQuery(key);
    triggerSearch(key);
  };

  // Human-readable bytes formatter
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Stream proxy connection
  const initiateContentDownload = (url: string, keyword: string, titleSuggested: string) => {
    if (activeEventSource.current) {
      activeEventSource.current.close();
    }

    setGeneralError(null);
    setFeedbackMessage(null);

    // Initial state trigger
    setActiveDownload({
      url,
      status: "connecting",
      loaded: 0,
      total: 0,
      progress: 0,
      sizeFormatted: "Connecting to server proxy..."
    });

    const encodedUrl = encodeURIComponent(url);
    const encodedKeyword = encodeURIComponent(keyword);

    const es = new EventSource(`/api/download?url=${encodedUrl}&keyword=${encodedKeyword}`);
    activeEventSource.current = es;

    es.addEventListener("start", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setActiveDownload(prev => prev ? {
          ...prev,
          status: "downloading",
          total: data.total || 0,
          sizeFormatted: data.total ? formatBytes(data.total) : "Streaming size..."
        } : null);
      } catch (err) {
        console.error("Malformed start metadata stream event", err);
      }
    });

    es.addEventListener("progress", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setActiveDownload(prev => {
          if (!prev) return null;
          const pct = data.total ? Math.min(Math.round((data.loaded / data.total) * 100), 99) : 50;
          return {
            ...prev,
            status: "downloading",
            loaded: data.loaded,
            total: data.total || 0,
            progress: pct,
            sizeFormatted: data.total ? formatBytes(data.total) : `Transferred ${formatBytes(data.loaded)}`
          };
        });
      } catch (err) {
        console.error("Malformed progress payload", err);
      }
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        
        const newDownloadedItem: DownloadedItem = {
          id: encodeURIComponent(data.url) + "_" + Date.now(),
          url: data.url,
          keyword: data.keyword,
          title: data.title || titleSuggested || "Cached Resource Content",
          content: data.content,
          sizeBytes: data.sizeBytes,
          downloadedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("ru-RU")
        };

        // Save into local state array & flush to browser storage
        setDownloadedItems(prev => {
          // Prevent exact duplicate URLs to save space
          const filtered = prev.filter(item => item.url !== data.url);
          const updated = [newDownloadedItem, ...filtered];
          localStorage.setItem("OFFLINE_DOWNLOADS", JSON.stringify(updated));
          return updated;
        });

        setActiveDownload(prev => prev ? {
          ...prev,
          status: "completed",
          loaded: data.sizeBytes,
          total: data.sizeBytes,
          progress: 100,
          sizeFormatted: formatBytes(data.sizeBytes)
        } : null);

        // Auto selection trigger for the reader layout
        setSelectedItem(newDownloadedItem);
        setFeedbackMessage({
          text: `"${newDownloadedItem.title}" successfully saved offline!`,
          type: "success"
        });

        // Close stream
        es.close();
        activeEventSource.current = null;
      } catch (err: any) {
        console.error("Critical completing event assembly error:", err);
        setActiveDownload(prev => prev ? {
          ...prev,
          status: "failed",
          error: "Failed to assemble or compile document payload files safely."
        } : null);
        es.close();
        activeEventSource.current = null;
      }
    });

    es.addEventListener("error", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setActiveDownload(prev => prev ? {
          ...prev,
          status: "failed",
          error: data.message || "Failed downloading content through server proxy bypass."
        } : null);
      } catch {
        setActiveDownload(prev => prev ? {
          ...prev,
          status: "failed",
          error: "External target host is blocking CORS proxy or timed out."
        } : null);
      }
      es.close();
      activeEventSource.current = null;
    });

    es.onerror = () => {
      setActiveDownload(prev => {
        if (prev && prev.status !== "completed" && prev.status !== "failed") {
          return {
            ...prev,
            status: "failed",
            error: "Local network socket stream terminated prematurely."
          };
        }
        return prev;
      });
      es.close();
      activeEventSource.current = null;
    };
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    
    let targetUrl = customUrl.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://") && !targetUrl.startsWith("/virtual/")) {
      targetUrl = "https://" + targetUrl; // default protocol
    }

    const keyword = customKeyword.trim() || "general";
    const title = customTitle.trim() || targetUrl.split("/").pop() || "Custom Resource Address";

    initiateContentDownload(targetUrl, keyword, title);
    
    // Clear custom form fields after trigger
    setCustomUrl("");
    setCustomTitle("");
    setIsCustomExpanded(false);
  };

  const deleteDownloadedItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card read activation
    
    const confirmDelete = window.confirm("Are you sure you want to delete this offline resource copy from your local storage?");
    if (!confirmDelete) return;

    setDownloadedItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      localStorage.setItem("OFFLINE_DOWNLOADS", JSON.stringify(filtered));
      if (selectedItem?.id === id) {
        setSelectedItem(filtered.length > 0 ? filtered[0] : null);
      }
      return filtered;
    });

    setFeedbackMessage({
      text: "Resource purged from offline disk successfully.",
      type: "info"
    });
  };

  const purgeAllOfflineCache = () => {
    const confirmAll = window.confirm("CRITICAL WARNING: This will immediately erase all downloaded contents from your offline disk. Proceed?");
    if (!confirmAll) return;

    localStorage.removeItem("OFFLINE_DOWNLOADS");
    setDownloadedItems([]);
    setSelectedItem(null);
    setFeedbackMessage({
      text: "All offline cache files cleared.",
      type: "info"
    });
  };

  // Estimate reading time
  const estimateReadingTime = (text: string): number => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200)); // Average rate of 200 wpm
  };

  // Search occurrence utility inside active document contents
  const countOccurrencesInDoc = (docText: string, textSearch: string): number => {
    if (!textSearch.trim()) return 0;
    const cleanSearch = textSearch.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(cleanSearch, 'gi');
    const matches = docText.match(regex);
    return matches ? matches.length : 0;
  };

  // Highlight matches or search lines helper
  const textOccurrences = selectedItem ? countOccurrencesInDoc(selectedItem.content, readerSearchTerm) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs px-6 py-4" id="headerbar">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-xl p-2.5 shadow-md shadow-sky-500/10">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Загрузчик Контента</span>
                <span className="text-[10px] uppercase tracking-widest bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  v1.1
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium font-sans">
                Потоковое сохранение через прокси &bull; Комфортное оффлайн-чтение
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Real Network Status Indicator Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isNetworkOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`} id="network-badge">
              {isNetworkOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-650" />
                  <span>СЕТЬ АКТИВНА</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-650" />
                  <span>ТОЛЬКО ОФФЛАЙН-РЕЖИМ</span>
                </>
              )}
            </div>

            {/* Offline Cache counter */}
            <div className="bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-medium flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-sans">Файлов оффлайн: <b className="text-slate-950 font-mono">{downloadedItems.length}</b></span>
            </div>

            {downloadedItems.length > 0 && (
              <button
                onClick={purgeAllOfflineCache}
                title="Очистить локальное хранилище в браузере"
                className="text-xs text-slate-500 hover:text-red-650 font-medium border border-slate-200 hover:border-red-200 rounded-lg px-2.5 py-1.5 bg-slate-50 hover:bg-red-50 transition"
              >
                Очистить кэш
              </button>
            )}
          </div>

        </div>
      </header>

      {/* BANNER NOTIFICATIONS & FEEDBACK CODES */}
      {feedbackMessage && (
        <div className="mx-6 mt-4 max-w-7xl md:mx-auto w-full">
          <div className={`p-4 rounded-xl text-sm font-medium flex justify-between items-center gap-2 border shadow-xs animate-fadeIn ${
            feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
            feedbackMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-sky-50 text-sky-800 border-sky-200'
          }`} id="feedback-bar">
            <span className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <Layers className="w-4 h-4 text-sky-600 flex-shrink-0" />}
              {feedbackMessage.text}
            </span>
            <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {generalError && (
        <div className="mx-6 mt-4 max-w-7xl md:mx-auto w-full">
          <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-sm font-medium flex justify-between items-start gap-2 shadow-sm" id="error-badge">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Произошла ошибка:</p>
                <p className="text-xs mt-1 text-rose-700">{generalError}</p>
              </div>
            </div>
            <button onClick={() => setGeneralError(null)} className="text-rose-400 hover:text-rose-600 transition flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC BROADCAST DOWNLOAD TRACKING OVERLAY CARD */}
      {activeDownload && (
        <div className="mx-6 mt-4 max-w-7xl md:mx-auto w-full antialiased" id="transfer-progress-overlay">
          <div className={`border rounded-xl p-5 shadow-md bg-white transition-all ${
            activeDownload.status === 'failed' ? 'border-rose-300 shadow-rose-100/40 bg-rose-50/10' :
            activeDownload.status === 'completed' ? 'border-emerald-300 shadow-emerald-100/40 bg-emerald-50/10' : 'border-sky-300 shadow-sky-100/40'
          }`}>
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2 mt-0.5 ${
                  activeDownload.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                  activeDownload.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                }`}>
                  <RefreshCw className={`w-5 h-5 ${activeDownload.status === 'downloading' || activeDownload.status === 'connecting' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-md sm:max-w-xl md:max-w-2xl">
                    Загрузка ресурса: <span className="font-mono text-xs font-semibold text-sky-600 break-all">{activeDownload.url}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-705 uppercase tracking-wider text-[10px]">
                      СТАТУС: {
                        activeDownload.status === 'connecting' ? 'Подключение...' :
                        activeDownload.status === 'downloading' ? 'Скачивание...' :
                        activeDownload.status === 'completed' ? 'Готово' : 'Ошибка'
                      }
                    </span>
                    &bull;
                    <span>Скачано: {formatBytes(activeDownload.loaded)} ({activeDownload.sizeFormatted})</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 block font-mono">
                  {activeDownload.progress}%
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Прогресс загрузки
                </span>
              </div>
            </div>

            {/* Simulated Live Loading Progress Bar Layout */}
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    activeDownload.status === 'failed' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                    activeDownload.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-sky-500 to-indigo-600 animate-pulse'
                  }`}
                  style={{ width: `${activeDownload.progress}%` }}
                />
              </div>
            </div>

            {/* Subtext info or Error display */}
            {activeDownload.status === 'failed' && (
              <div className="mt-4 flex items-center gap-2 bg-rose-50 border border-rose-150 rounded-lg p-3 text-xs text-rose-800 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span><b>Ошибка при получении данных:</b> {activeDownload.error || "Не удалось получить контент через прокси-сервер."}</span>
              </div>
            )}

            {activeDownload.status === 'completed' && (
              <div className="mt-4 flex items-center justify-between gap-4 bg-emerald-50 border border-emerald-150 rounded-lg p-3 text-xs text-emerald-800 font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Документ успешно загружен и сохранен в памяти вашего браузера (LocalStorage).</span>
                </span>
                <button 
                  onClick={() => setActiveDownload(null)} 
                  className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Закрыть
                </button>
              </div>
            )}

            {activeDownload.status === 'downloading' && (
              <div className="mt-3 flex justify-between items-center text-[10px] font-semibold text-slate-400 font-mono">
                <span>ПОЛУЧЕНИЕ ЧАНКОВ ДАННЫХ: АКТИВНО</span>
                <span className="animate-pulse text-indigo-505 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-850">Потоковый прокси-канал открыт</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN LAYOUT STRUCTURE */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 antialiased">
        
        {/* LEFT COMPILER: SEARCH & SOURCES MANAGER (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="left-sidebar">
          
          {/* A. SEARCH COMPACT BLOCK */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Search className="w-4 h-4 text-slate-500" />
              <span>Центр поиска по ключевым словам</span>
            </h2>

            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Введите ключевое слово (например: react, space, news...)"
                value={searchQuery}
                aria-label="Ввод ключевого слова"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Real-time debounce AJAX search
                  triggerSearch(e.target.value);
                }}
                className="w-full bg-slate-50 font-medium hover:bg-slate-100/70 border border-slate-200 focus:border-sky-500 focus:bg-white text-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm transition outline-none"
              />
              <button 
                type="submit" 
                title="Искать на сервере"
                className="absolute right-2.5 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white hover:scale-105 active:scale-95 p-2 rounded-lg shadow-sm font-semibold transition"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Seeding Pills suggestions layout */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Доступные ключевые слова на сервере:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableKeywords.length === 0 ? (
                  <span className="text-xs text-slate-400">Проверка пресетов с сервера...</span>
                ) : (
                  availableKeywords.map((key) => {
                    const isActive = searchQuery.toLowerCase().trim() === key.toLowerCase().trim();
                    return (
                      <button
                        key={key}
                        onClick={() => handleQuickKeywordClick(key)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          isActive 
                            ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white border-transparent shadow-sm' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
                        }`}
                      >
                        #{key}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* B. MATCHING SERVER URL DIRECTORY CARDS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Найденные документы на сервере</span>
              </h2>
              <span className="text-[10px] font-sans font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {(Object.values(searchResults) as UrlItem[][]).reduce((acc, current) => acc + current.length, 0)} результатов
              </span>
            </div>

            {/* Error & state representations */}
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-550" />
                <span className="text-xs font-semibold tracking-wider font-sans uppercase">Поиск совпадений...</span>
              </div>
            ) : Object.keys(searchResults).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <HelpCircle className="w-10 h-10 text-slate-350 mb-2" />
                <h4 className="text-xs font-bold text-slate-700">Ничего не найдено</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  По этому запросу готовые пресеты отсутствуют. Вы можете ввести любое слово для поиска файлов или воспользоваться формой <b>произвольного URL</b> ниже!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[420px] pr-1.5">
                {Object.entries(searchResults).map(([keyword, urls]) => (
                  <div key={keyword} className="space-y-2">
                    <div className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-widest flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span>Категория: "{keyword}"</span>
                    </div>

                    <div className="space-y-2">
                      {(urls as UrlItem[]).map((item) => {
                        const isVirtual = item.url.startsWith("/virtual/");
                        return (
                          <div 
                            key={item.url} 
                            className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 hover:border-sky-300 hover:bg-slate-50/10 transition group"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 group-hover:text-sky-655 transition truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[9px] font-mono text-slate-400 block truncate mt-0.5">
                                  {item.url}
                                </span>
                              </div>
                              <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isVirtual 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                  : 'bg-teal-100 text-teal-800 border border-teal-200'
                              }`}>
                                {isVirtual ? 'ВИРТУАЛЬНЫЙ' : 'ВНЕШНИЙ'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>

                            <div className="mt-3.5 flex justify-between items-center border-t border-slate-200/50 pt-2.5">
                              <span className="text-[10px] font-sans text-slate-400">
                                Ожидаемый размер: <b className="text-slate-600 font-mono">{item.size || "Потоковый"}</b>
                              </span>
                              <button
                                onClick={() => initiateContentDownload(item.url, keyword, item.title)}
                                disabled={!isNetworkOnline}
                                className="flex items-center gap-1.5 bg-white hover:bg-gradient-to-tr hover:from-sky-500 hover:to-indigo-600 text-slate-700 hover:text-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 hover:border-transparent rounded-lg px-3 py-1.5 text-[11px] font-bold shadow-xs active:scale-95 transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Скачать</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* C. CUSTOM URL INSERTION PANEL */}
            <div className="border-t border-slate-150 pt-4 mt-auto">
              <button
                onClick={() => setIsCustomExpanded(!isCustomExpanded)}
                className="w-full flex justify-between items-center text-xs font-bold text-slate-500 hover:text-slate-850 py-1.5 transition"
              >
                <span>🌐 Скачать по произвольному веб-адресу (URL)</span>
                <span className="text-slate-400">{isCustomExpanded ? "Свернуть" : "Развернуть поля"}</span>
              </button>

              {isCustomExpanded && (
                <form onSubmit={handleCustomUrlSubmit} className="space-y-3 mt-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Адрес веб-ресурса (URL)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например: raw.githubusercontent.com/... "
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Ключевое слово для группировки (необязательно)
                    </label>
                    <input
                      type="text"
                      placeholder="Например: general, docs"
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Пользовательское название закладок (необязательно)
                    </label>
                    <input
                      type="text"
                      placeholder="Например: Документация React"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isNetworkOnline}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 bg-gradient-to-tr from-sky-500 to-indigo-600 disabled:from-slate-350 text-white rounded-lg p-2 text-xs font-bold shadow-md hover:scale-[1.01] transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать через прокси-сервер</span>
                  </button>
                  {!isNetworkOnline && (
                    <p className="text-[10px] text-amber-600 text-center font-semibold leading-relaxed">
                      Нельзя скачивать новые ссылки в оффлайн-режиме.
                    </p>
                  )}
                </form>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT CONTROLLER: DOWNLOADED INVENTORY & READER COMPASS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6" id="right-reader">
          
          {/* A. OFFLINE STORAGE INVENTORY BAR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-3.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Оффлайн-библиотека документов</span>
            </h3>

            {downloadedItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-250 rounded-xl">
                <FileText className="w-10 h-10 text-slate-350 mx-auto mb-2.5" />
                <h4 className="text-xs font-bold text-slate-700">Библиотека пуста</h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Пока нет скачанных страниц. Введите ключевое слово или ссылку и нажмите «Скачать». Документы сохранятся в памяти браузера для комфортного чтения без интернета!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                {downloadedItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`border rounded-xl p-3.5 cursor-pointer flex flex-col justify-between hover:border-indigo-400 hover:shadow-xs transition relative group ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10' 
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-3">
                          <span className="text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded border border-indigo-200">
                            #{item.keyword}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-400">
                            {formatBytes(item.sizeBytes)}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-800 line-clamp-1 mt-2.5">
                          {item.title}
                        </h4>
                        
                        <p className="text-[10px] font-mono text-slate-400 leading-relaxed truncate mt-1">
                          {item.url}
                        </p>
                      </div>
                      <div className="mt-4 pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-[10px] text-slate-500 font-medium font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.downloadedAt}</span>
                        </span>

                        <button
                          onClick={(e) => deleteDownloadedItem(item.id, e)}
                          title="Удалить копию"
                          className="p-1.5 text-slate-400 hover:text-red-550 hover:bg-red-50 rounded-md transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. DISTRACTION-FREE RICH OFFLINE READER HUD */}
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-5 lg:p-7 flex-1 min-h-[450px] ${
            readerInFocusMode ? 'fixed inset-0 z-50 p-6 md:p-12 overflow-y-auto' : ''
          }`} id="reader-frame">
            
            {selectedItem ? (
              <div className="flex flex-col h-full gap-5">
                
                {/* Book Header Segment */}
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-150 pb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full">
                        Категория: #{selectedItem.keyword}
                      </span>
                      <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Оффлайн-режим активен (Готово к чтению)
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-400">
                        &bull; ~{estimateReadingTime(selectedItem.content)} мин. чтения
                      </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 leading-snug">
                      {selectedItem.title}
                    </h2>

                    <p className="text-xs text-slate-400 font-mono mt-1 break-all select-all hover:text-slate-700 transition" title="Исходный URL-адрес">
                      Источник: {selectedItem.url}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedItem.content);
                        setFeedbackMessage({ text: "Содержимое документа скопировано в буфер обмена!", type: "success" });
                      }}
                      title="Скопировать исходный текст"
                      className="p-2 border border-slate-250 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl shadow-xs transition active:scale-95"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setReaderInFocusMode(!readerInFocusMode)}
                      title={readerInFocusMode ? "Выйти из полноэкранного режима" : "Включить режим фокуса"}
                      className="p-2 border border-slate-250 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl shadow-xs transition active:scale-95"
                    >
                      {readerInFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    {readerInFocusMode && (
                      <button
                        onClick={() => setReaderInFocusMode(false)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-xl hover:scale-105 active:scale-95 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub search highlighter block inside content */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3.5 gap-3">
                  <div className="relative w-full sm:max-w-xs flex items-center">
                    <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Искать текст в документе..."
                      value={readerSearchTerm}
                      onChange={(e) => setReaderSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-220 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-slate-800"
                    />
                    {readerSearchTerm && (
                      <button 
                        onClick={() => setReaderSearchTerm("")}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-700 font-bold"
                        title="Очистить фильтр"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    {readerSearchTerm.trim() && (
                      <span className="font-semibold bg-sky-100 text-sky-850 border border-sky-200 px-2.5 py-0.5 rounded-full font-mono">
                        Совпадений: {textOccurrences}
                      </span>
                    )}
                    <span>Слов: <b className="text-slate-850 font-mono">{selectedItem.content.split(/\s+/).length}</b></span>
                    &bull;
                    <span>Размер: <b className="text-slate-850 font-mono">{formatBytes(selectedItem.sizeBytes)}</b></span>
                  </div>
                </div>

                {/* Reader sheet area */}
                <div className="flex-1 overflow-y-auto max-h-[480px] pr-2 mt-2 leading-relaxed" id="reader-content-body">
                  <article className="prose max-w-none bg-white border border-slate-100 rounded-xl p-5 md:p-8 shadow-xs selection:bg-indigo-150">
                    <MarkdownRenderer content={selectedItem.content} />
                  </article>
                </div>

                <div className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-100 mt-auto">
                  &bull; КОНЕЦ ОФФЛАЙН-ДОКУМЕНТА &bull;
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-16 px-6">
                <BookOpen className="w-14 h-14 text-slate-300 stroke-1 mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-700">Интерфейс чтения</h3>
                <p className="text-xs text-slate-400 mt-2.5 max-w-sm leading-relaxed">
                  Выберите документ из вашей оффлайн-библиотеки выше, чтобы начать комфортное изучение без интернета.
                </p>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-850 text-slate-400 py-6 mt-12 text-center text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-medium text-slate-400 flex items-center gap-1 justify-center">
            <span>Загрузчик контента по ключевым словам &bull; Создано на React и Node.js</span>
          </p>
          <div className="flex items-center gap-4 text-slate-500 font-medium font-sans">
            <span>Потоковая загрузка</span>
            <span>&bull;</span>
            <span>Локальное оффлайн-хранилище</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
