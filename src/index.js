const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, provider: "Gemini" });
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Use POST for chat requests." }, 405);
      }

      if (!env.GEMINI_API_KEY) {
        return json({ error: "The Gemini API key is not configured on the Cloudflare Worker yet." }, 503);
      }

      let body;
      try {
        const raw = await request.text();
        if (raw.length > 7_000_000) {
          return json({ error: "This request is too large. Try fewer or smaller attachments." }, 413);
        }
        body = JSON.parse(raw);
      } catch {
        return json({ error: "The request body must be valid JSON." }, 400);
      }

      const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
      if (!messages.length) return json({ error: "Type a message before sending." }, 400);

      const contents = [];
      for (const message of messages) {
        if (!message || !["user", "assistant"].includes(message.role)) continue;
        const text = typeof message.content === "string" ? message.content.slice(0, 24000) : "";
        if (!text.trim()) continue;
        contents.push({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text }]
        });
      }

      if (!contents.length || contents[contents.length - 1].role !== "user") {
        return json({ error: "The latest message must be from the user." }, 400);
      }

      const images = Array.isArray(body.images) ? body.images.slice(0, 4) : [];
      for (const image of images) {
        if (!image || typeof image.data !== "string") continue;
        if (image.data.length > 3_500_000) {
          return json({ error: "An attached image is too large. Try a smaller image." }, 413);
        }
        const mimeType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.mimeType)
          ? image.mimeType : "image/jpeg";
        contents[contents.length - 1].parts.push({
          inlineData: { mimeType, data: image.data }
        });
      }

      const model = env.GEMINI_MODEL || "gemini-2.5-flash";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

      let upstream;
      try {
        upstream = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: typeof body.system === "string" ? body.system.slice(0, 12000) : "You are Kensei AI, a helpful assistant." }]
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192
            }
          })
        });
      } catch {
        return json({ error: "Could not reach the Gemini service. Check your connection and try again." }, 502);
      }

      let result;
      try {
        result = await upstream.json();
      } catch {
        return json({ error: "Gemini returned an unreadable response." }, 502);
      }

      if (!upstream.ok) {
        const detail = result?.error?.message || "Gemini request failed.";
        const status = upstream.status === 429 ? 429 : 502;
        return json({
          error: upstream.status === 429
            ? "Gemini's free-tier quota or rate limit has been reached. Please try again later."
            : detail
        }, status);
      }

      const text = (result?.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || "")
        .join("")
        .trim();

      if (!text) {
        return json({ error: "Gemini returned no text. Try rephrasing your message." }, 502);
      }
      return json({ text });
    }

    return env.ASSETS.fetch(request);
  }
};
