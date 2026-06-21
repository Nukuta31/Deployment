import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { VIRTUAL_DOCUMENTS } from "./virtualDocs.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON bodies for standard API posts if anyway needed
  app.use(express.json());

  // In-memory Database matching keywords to high-quality information URLs
  const KEYWORDS_DB: Record<string, { url: string; description: string; size?: string; title: string }[]> = {
    "react": [
      {
        url: "https://raw.githubusercontent.com/facebook/react/main/README.md",
        title: "React Official README (RAW HTML/Markdown)",
        description: "Official GitHub README file for React library, detailing basic usage and links."
      },
      {
        url: "https://raw.githubusercontent.com/facebook/react/main/LICENSE",
        title: "React License Agreement (RAW Text)",
        description: "The official open-source license documentation (MIT License) for React."
      },
      {
        url: "/virtual/react-guide",
        title: "React 19 & Vite Developer Handbook",
        description: "A production-grade, detailed offline-ready guide covering Server Actions, useActionState, hook patterns and Vite optimization.",
        size: "18.5 KB"
      }
    ],
    "space": [
      {
        url: "https://images-api.nasa.gov/search?q=mars",
        title: "NASA Mars Metadata Search API Response",
        description: "Raw JSON search content retrieved from the public NASA Images API."
      },
      {
        url: "/virtual/mars-mission",
        title: "Artemis & Mars Expedition Project Log",
        description: "Comprehensive scientific logs, spacecraft parameters, orbital projections, and colonization plans for human settlement.",
        size: "6.8 KB"
      },
      {
        url: "/virtual/cosmology",
        title: "Introduction to Stellar Astrophysics & Dark Matter",
        description: "Graduate-level lecture overviewing cosmic microwave background radiation and galaxy rotational curves.",
        size: "8.1 KB"
      }
    ],
    "offline": [
      {
        url: "/virtual/offline-cookbook",
        title: "Offline Web Applications Handbook",
        description: "Techniques for storing content securely in LocalStorage, IndexedDB rules, Service Worker lifecycle, and sync mechanisms.",
        size: "5.4 KB"
      },
      {
        url: "https://raw.githubusercontent.com/w3c/manifest/main/index.html",
        title: "W3C Web Application Manifest Spec",
        description: "W3C official draft specifications for Web Manifest definitions."
      }
    ],
    "news": [
      {
        url: "https://hn.algolia.com/api/v1/search?tags=front_page",
        title: "Hacker News Frontpage Feed JSON",
        description: "Live raw JSON summary of the current frontpage items of Hacker News."
      },
      {
        url: "/virtual/tech-news-digest",
        title: "Daily Global Tech Headlines Digest",
        description: "Curation of the most prominent technological and industrial scientific advancements of this year.",
        size: "4.2 KB"
      }
    ],
    "coding": [
      {
        url: "https://raw.githubusercontent.com/vlang/v/master/README.md",
        title: "The V Programming Language README",
        description: "Fast, safe, compiled language official documentation header from the master branch."
      },
      {
        url: "/virtual/clean-code",
        title: "Pragmatic Senior Engineer Architectural Guidelines",
        description: "A highly condensed handbook detailing decoupled design, testability, domain modeling, and error handling philosophies.",
        size: "6.2 KB"
      }
    ]
  };

  // API Route: available keywords
  app.get("/api/keywords", (req, res) => {
    try {
      res.json(Object.keys(KEYWORDS_DB));
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve keywords" });
    }
  });

  // API Route: search keyword for URLs
  app.get("/api/search", (req, res) => {
    try {
      const q = (req.query.q as string || "").trim().toLowerCase();
      if (!q) {
        return res.json(KEYWORDS_DB);
      }
      
      const results: Record<string, typeof KEYWORDS_DB[keyof typeof KEYWORDS_DB]> = {};
      
      for (const [key, items] of Object.entries(KEYWORDS_DB)) {
        if (key.includes(q) || q.includes(key)) {
          results[key] = items;
        }
      }

      if (Object.keys(results).length === 0) {
        // Search inside item titles or descriptions
        for (const [key, items] of Object.entries(KEYWORDS_DB)) {
          const filtered = items.filter(
            item => 
              item.title.toLowerCase().includes(q) || 
              item.description.toLowerCase().includes(q) || 
              item.url.toLowerCase().includes(q)
          );
          if (filtered.length > 0) {
            results[key] = filtered;
          }
        }
      }

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Search failed" });
    }
  });

  // API Route: stream proxy download with progress updates
  app.get("/api/download", async (req, res) => {
    const targetUrl = req.query.url as string;
    const keyword = (req.query.keyword as string || "general").trim();

    if (!targetUrl) {
      return res.status(400).json({ error: "URL query parameter is required" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      if (res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let isClosed = false;

    req.on("close", () => {
      isClosed = true;
      res.end();
    });

    try {
      if (targetUrl.startsWith("/virtual/")) {
        const key = targetUrl.replace("/virtual/", "");
        const doc = VIRTUAL_DOCUMENTS[key];
        if (!doc) {
          throw new Error(`Virtual document '${key}' not found on server database.`);
        }

        const title = doc.title;
        const content = doc.content;
        const sizeBytes = Buffer.byteLength(content, "utf8");

        sendEvent("start", { url: targetUrl, title, total: sizeBytes });

        // Let's split into 12 chunks to allow progress indicators to update smoothly
        const numChunks = 12;
        const charsPerChunk = Math.ceil(content.length / numChunks);
        let loaded = 0;

        for (let i = 0; i < numChunks; i++) {
          if (isClosed) break;

          const startIdx = i * charsPerChunk;
          const endIdx = Math.min((i + 1) * charsPerChunk, content.length);
          const chunkStr = content.substring(startIdx, endIdx);
          const chunkBytes = Buffer.byteLength(chunkStr, "utf8");

          loaded += chunkBytes;

          // Artificial network speed simulation (120ms latency per chunk)
          await new Promise(resolve => setTimeout(resolve, 120));

          sendEvent("progress", {
            url: targetUrl,
            loaded,
            total: sizeBytes,
            progress: Math.round((loaded / sizeBytes) * 100)
          });
        }

        if (!isClosed) {
          sendEvent("complete", {
            url: targetUrl,
            keyword,
            title,
            content,
            sizeBytes
          });
        }

      } else {
        // Real remote URL fetch proxy download
        sendEvent("start", { url: targetUrl, title: targetUrl, total: 0 });

        // Build request to external URL with absolute timeout guard
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds abort

        try {
          const response = await fetch(targetUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
          }

          const totalBytes = parseInt(response.headers.get("content-length") || "0", 10);
          let loaded = 0;
          let contentBuffer = "";

          if (response.body) {
            // @ts-ignore
            if (typeof response.body.getReader === "function") {
              // Standard web streams reader (used in latest node environment)
              // @ts-ignore
              const reader = response.body.getReader();
              const decoder = new TextDecoder("utf-8");

              while (!isClosed) {
                const { done, value } = await reader.read();
                if (done) break;

                loaded += value.length;
                contentBuffer += decoder.decode(value, { stream: true });

                const progress = totalBytes ? Math.min(Math.round((loaded / totalBytes) * 100), 99) : 50;

                sendEvent("progress", {
                  url: targetUrl,
                  loaded,
                  total: totalBytes || loaded,
                  progress
                });
              }
              contentBuffer += decoder.decode(); // Flush final decoded text
            } else {
              // Classic Node streams iterator
              // @ts-ignore
              for await (const chunk of response.body) {
                if (isClosed) break;

                loaded += chunk.length;
                contentBuffer += chunk.toString("utf8");

                const progress = totalBytes ? Math.min(Math.round((loaded / totalBytes) * 100), 99) : 50;

                sendEvent("progress", {
                  url: targetUrl,
                  loaded,
                  total: totalBytes || loaded,
                  progress
                });
              }
            }
          } else {
            // Fallback for bodies without readable streams
            const textContent = await response.text();
            contentBuffer = textContent;
            loaded = Buffer.byteLength(textContent, "utf8");
          }

          if (!isClosed) {
            const finalSize = Buffer.byteLength(contentBuffer, "utf8");
            
            // Clean title extraction
            let title = targetUrl.split("/").pop() || targetUrl;
            if (title.length > 50) {
              title = title.substring(0, 47) + "...";
            }

            sendEvent("complete", {
              url: targetUrl,
              keyword,
              title,
              content: contentBuffer,
              sizeBytes: finalSize
            });
          }

        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }

      }
    } catch (err: any) {
      console.error("Stream Proxy Error:", err);
      if (!isClosed) {
        sendEvent("error", {
          url: targetUrl,
          message: err.name === "AbortError" 
            ? "Request timeout. Target server did not respond within 12 seconds." 
            : (err.message || "Could not fetch resources.")
        });
      }
    } finally {
      res.end();
    }
  });

  // Client SPA mounting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Keyword Content Downloader running on http://localhost:${PORT}`);
  });
}

startServer();
