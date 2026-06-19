import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const P = "/make-server-886336a3";

app.get(`${P}/health`, (c) => c.json({ status: "ok" }));

// ─── USER ────────────────────────────────────────────────────

app.get(`${P}/user/:userId`, async (c) => {
  try {
    const user = await kv.get(`user:${c.req.param("userId")}`);
    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(user);
  } catch (e) {
    console.log("Error getting user:", e);
    return c.json({ error: `Failed to get user: ${e}` }, 500);
  }
});

app.post(`${P}/user`, async (c) => {
  try {
    const body = await c.req.json();
    const { userId, ...userData } = body;
    if (!userId) return c.json({ error: "userId is required" }, 400);
    const user = { userId, ...userData };
    await kv.set(`user:${userId}`, user);
    return c.json({ success: true, user });
  } catch (e) {
    console.log("Error creating user:", e);
    return c.json({ error: `Failed to create user: ${e}` }, 500);
  }
});

app.post(`${P}/user/:userId/upgrade`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await kv.get(`user:${userId}`);
    if (!user) return c.json({ error: "User not found" }, 404);
    const updated = { ...user, plan: "pro" };
    await kv.set(`user:${userId}`, updated);
    return c.json({ success: true, user: updated });
  } catch (e) {
    console.log("Error upgrading user:", e);
    return c.json({ error: `Failed to upgrade user: ${e}` }, 500);
  }
});

// ─── TASKS ───────────────────────────────────────────────────

app.get(`${P}/tasks/:userId`, async (c) => {
  try {
    const tasks = await kv.get(`tasks:${c.req.param("userId")}`);
    return c.json(Array.isArray(tasks) ? tasks : []);
  } catch (e) {
    console.log("Error getting tasks:", e);
    return c.json({ error: `Failed to get tasks: ${e}` }, 500);
  }
});

app.put(`${P}/tasks/:userId`, async (c) => {
  try {
    const tasks = await c.req.json();
    await kv.set(`tasks:${c.req.param("userId")}`, tasks);
    return c.json({ success: true });
  } catch (e) {
    console.log("Error saving tasks:", e);
    return c.json({ error: `Failed to save tasks: ${e}` }, 500);
  }
});

// ─── SIMULATION HISTORY ──────────────────────────────────────

app.get(`${P}/simulations/:userId`, async (c) => {
  try {
    const history = await kv.get(`simulations:${c.req.param("userId")}`);
    return c.json(Array.isArray(history) ? history : []);
  } catch (e) {
    console.log("Error getting simulations:", e);
    return c.json({ error: `Failed to get simulations: ${e}` }, 500);
  }
});

app.delete(`${P}/simulations/:userId`, async (c) => {
  try {
    await kv.set(`simulations:${c.req.param("userId")}`, []);
    return c.json({ success: true });
  } catch (e) {
    console.log("Error clearing simulations:", e);
    return c.json({ error: `Failed to clear simulations: ${e}` }, 500);
  }
});

// ─── AI SIMULATION ───────────────────────────────────────────

app.post(`${P}/simulate`, async (c) => {
  try {
    const { tasks, goal, userName, userId, history } = await c.req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return c.json({ error: "GEMINI_API_KEY belum dikonfigurasi di server." }, 500);
    }

    const done = tasks.filter((t: any) => t.status === "done").length;
    const total = tasks.length;
    const inProgress = tasks.filter((t: any) => t.status === "in-progress").length;
    const categories = [...new Set(tasks.map((t: any) => t.category))];
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    const historyContext = history && history.length > 0
      ? `\nRiwayat simulasi sebelumnya (gunakan untuk membandingkan perkembangan):\n${
          history.slice(-3).map((h: any, i: number) => {
            const scoreMatch = h.result?.match(/SKOR POTENSI MASA DEPAN:\s*(\d+)/);
            const score = scoreMatch ? scoreMatch[1] : "?";
            const date = new Date(h.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
            return `- Simulasi ${i + 1} (${date}): Goal "${h.goal || "tidak disebutkan"}" → Skor ${score}/100`;
          }).join("\n")
        }\n`
      : "";

    const isReturning = history && history.length > 0;

    const prompt = `Kamu adalah AI productivity coach untuk aplikasi Impetus. Analisis data tugas pengguna dan buat laporan simulasi masa depan yang sangat personal dan memotivasi dalam Bahasa Indonesia.\n\nData Pengguna:\n- Nama: ${userName}\n- Total tugas: ${total}\n- Tugas selesai: ${done} (${rate}%)\n- Sedang berjalan: ${inProgress}\n- Kategori fokus: ${(categories as string[]).join(", ")}\n- Goal 6 bulan ke depan: "${goal || "Tidak disebutkan — analisis dari pola tugas"}"\n${historyContext}\n${isReturning ? `Ini adalah simulasi ke-${history.length + 1} untuk pengguna ini. Bandingkan dengan simulasi sebelumnya dan tunjukkan perkembangan atau perubahan yang terdeteksi.` : "Ini adalah simulasi pertama pengguna ini."}\n\nBuat laporan simulasi masa depan 6 bulan. Format:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔮  LAPORAN SIMULASI MASA DEPAN AI${isReturning ? ` #${history.length + 1}` : ""}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nBerdasarkan analisis AI terhadap ${total} tugas dan pola produktivitas ${userName}:\n\n📊 SKOR POTENSI MASA DEPAN: [nilai]/100\n[evaluasi singkat]\n${isReturning ? "\n📈 PERBANDINGAN DENGAN SIMULASI SEBELUMNYA:\n[bandingkan skor dan progress]\n" : ""}\n─────────────────────────────────────\n🎯 MILESTONE UTAMA (6 Bulan)\n─────────────────────────────────────\n\n▸ Bulan 1–2 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n▸ Bulan 3–4 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n▸ Bulan 5–6 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n─────────────────────────────────────\n💡 REKOMENDASI PERSONAL AI\n─────────────────────────────────────\n\n[2-3 paragraf spesifik berdasarkan data]\n\n─────────────────────────────────────\n✨ PREDIKSI AKHIR\n─────────────────────────────────────\n\n[prediksi pertumbuhan dengan angka]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n          Powered by Impetus AI ⚡\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nIsi semua bagian dengan konten nyata, sebut nama pengguna dan kategori spesifik.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.log("Gemini API error:", errText);
      return c.json({ error: `Gemini API error: ${errText}` }, 500);
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return c.json({ error: "Tidak ada respons dari Gemini AI." }, 500);

    if (userId) {
      try {
        const existing = await kv.get(`simulations:${userId}`) || [];
        const newRecord = {
          id: crypto.randomUUID(),
          goal: goal || "",
          result: text,
          createdAt: new Date().toISOString(),
          taskSnapshot: { total, done, rate, categories },
        };
        const updated = Array.isArray(existing) ? [...existing, newRecord] : [newRecord];
        await kv.set(`simulations:${userId}`, updated);
      } catch (e) {
        console.log("Warning: failed to save simulation history:", e);
      }
    }

    return c.json({ result: text });
  } catch (e) {
    console.log("Error in simulate:", e);
    return c.json({ error: `Simulasi gagal: ${e}` }, 500);
  }
});

Deno.serve(app.fetch);
