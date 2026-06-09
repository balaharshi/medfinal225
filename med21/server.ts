import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

app.use(express.json());

app.use("/api", async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}${req.originalUrl}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.cookie ? { Cookie: String(req.headers.cookie) } : {}),
        ...(req.headers.authorization ? { Authorization: String(req.headers.authorization) } : {}),
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
    });

    const body = await response.text();
    res.status(response.status);
    const setCookieHeaders =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie") as string]
          : [];
    response.headers.forEach((value, key) => {
      if (!["content-encoding", "set-cookie"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    if (setCookieHeaders.length) {
      res.setHeader("Set-Cookie", setCookieHeaders);
    }
    res.send(body);
  } catch (error) {
    console.error("Backend proxy error:", error);
    res.status(502).json({ error: "We could not complete your request right now. Please try again in a moment." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      return res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend running on http://localhost:${PORT}`);
    console.log(`API proxy forwarding /api requests to ${BACKEND_URL}`);
  });
}

startServer();
