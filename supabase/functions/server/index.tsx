import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const P = "/make-server-886336a3";

app.get(`${P}/health`, (c) => c.json({ status: "ok" }));

// ─── USER ───────────────────────────────────────────────

app.get(`${P}/user/:userId`, async (c) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", c.req.param("userId"))
      .single();
    if (error || !data) return c.json({ error: "User not found" }, 404);
    return c.json({ name: data.name, email: data.email, plan: data.plan, avatar: data.avatar, joinDate: data.join_date });
  } catch (e) {
    return c.json({ error: `Failed to get user: ${e}` }, 500);
  }
});

app.post(`${P}/user`, async (c) => {
  try {
    const body = await c.req.json();
    const { userId, name, email, plan, avatar, joinDate } = body;
    if (!userId) return c.json({ error: "userId is required" }, 400);
    const { error } = await supabase.from("users").upsert({
      id: userId,
      name: name || "",
      email: email || "",
      plan: plan || "free",
      avatar: avatar || "",
      join_date: joinDate || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to save user: ${e}` }, 500);
  }
});

app.post(`${P}/user/:userId/upgrade`, async (c) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ plan: "pro", updated_at: new Date().toISOString() })
      .eq("id", c.req.param("userId"))
      .select()
      .single();
    if (error) throw error;
    return c.json({ success: true, user: { name: data.name, email: data.email, plan: data.plan, avatar: data.avatar, joinDate: data.join_date } });
  } catch (e) {
    return c.json({ error: `Failed to upgrade user: ${e}` }, 500);
  }
});

// ─── TASKS ───────────────────────────────────────────────

app.get(`${P}/tasks/:userId`, async (c) => {
  try {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", c.req.param("userId"))
      .order("created_at", { ascending: true });
    return c.json((data || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      category: t.category,
      createdAt: t.created_at,
      dueDate: t.due_date || undefined,
    })));
  } catch (e) {
    return c.json({ error: `Failed to get tasks: ${e}` }, 500);
  }
});

app.put(`${P}/tasks/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const tasks = await c.req.json();
    await supabase.from("tasks").delete().eq("user_id", userId);
    if (Array.isArray(tasks) && tasks.length > 0) {
      const { error } = await supabase.from("tasks").insert(
        tasks.map((t: any) => ({
          id: t.id,
          user_id: userId,
          title: t.title || "",
          description: t.description || "",
          status: t.status || "todo",
          priority: t.priority || "medium",
          category: t.category || "",
          due_date: t.dueDate || null,
          created_at: t.createdAt || new Date().toISOString(),
        }))
      );
      if (error) throw error;
    }
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to save tasks: ${e}` }, 500);
  }
});

// ─── SIMULATION HISTORY ────────────────────────────────────

app.get(`${P}/simulations/:userId`, async (c) => {
  try {
    const { data } = await supabase
      .from("simulation_history")
      .select("*")
      .eq("user_id", c.req.param("userId"))
      .order("created_at", { ascending: true });
    return c.json((data || []).map((s: any) => ({
      id: s.id,
      goal: s.goal,
      result: s.result,
      createdAt: s.created_at,
      taskSnapshot: s.task_snapshot,
    })));
  } catch (e) {
    return c.json({ error: `Failed to get simulations: ${e}` }, 500);
  }
});

app.delete(`${P}/simulations/:userId`, async (c) => {
  try {
    await supabase.from("simulation_history").delete().eq("user_id", c.req.param("userId"));
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to clear simulations: ${e}` }, 500);
  }
});

// ─── CHAT HISTORY ──────────────────────────────────────────

app.get(`${P}/chat/:userId`, async (c) => {
  try {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", c.req.param("userId"))
      .order("created_at", { ascending: true });
    return c.json((data || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })));
  } catch (e) {
    return c.json({ error: `Failed to get chat: ${e}` }, 500);
  }
});

app.post(`${P}/chat/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const { message, userName } = await c.req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return c.json({ error: "GEMINI_API_KEY belum dikonfigurasi." }, 500);

    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const conversationContext = (history || []).slice(-20).map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `Kamu adalah AI productivity coach untuk aplikasi Impetus. Nama pengguna adalah ${userName}. Bantu dia meningkatkan produktivitas, mencapai goal, dan membangun kebiasaan positif. Jawab dalam Bahasa Indonesia. Jadilah singkat, personal, dan memotivasi.` }],
          },
          contents: [...conversationContext, { role: "user", parts: [{ text: message }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return c.json({ error: `Gemini error: ${errText}` }, 500);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return c.json({ error: "Tidak ada respons dari AI." }, 500);

    const { data: inserted } = await supabase
      .from("chat_messages")
      .insert([
        { user_id: userId, role: "user", content: message },
        { user_id: userId, role: "assistant", content: text },
      ])
      .select();

    const aiMsg = inserted?.[1];
    return c.json({
      message: {
        id: aiMsg?.id ?? crypto.randomUUID(),
        role: "assistant",
        content: text,
        createdAt: aiMsg?.created_at ?? new Date().toISOString(),
      },
    });
  } catch (e) {
    return c.json({ error: `Chat gagal: ${e}` }, 500);
  }
});

app.delete(`${P}/chat/:userId`, async (c) => {
  try {
    await supabase.from("chat_messages").delete().eq("user_id", c.req.param("userId"));
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to clear chat: ${e}` }, 500);
  }
});

// ─── AI SIMULATION ─────────────────────────────────────────

app.post(`${P}/simulate`, async (c) => {
  try {
    const { tasks, goal, userName, userId, history } = await c.req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return c.json({ error: "GEMINI_API_KEY belum dikonfigurasi." }, 500);

    const done = tasks.filter((t: any) => t.status === "done").length;
    const total = tasks.length;
    const inProgress = tasks.filter((t: any) => t.status === "in-progress").length;
    const categories = [...new Set(tasks.map((t: any) => t.category))];
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    const historyContext = history && history.length > 0
      ? `\nRiwayat simulasi sebelumnya:\n${history.slice(-3).map((h: any, i: number) => {
          const scoreMatch = h.result?.match(/SKOR POTENSI MASA DEPAN:\s*(\d+)/);
          const score = scoreMatch ? scoreMatch[1] : "?";
          const date = new Date(h.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
          return `- Simulasi ${i + 1} (${date}): Goal "${h.goal || "tidak disebutkan"}" → Skor ${score}/100`;
        }).join("\n")}\n`
      : "";

    const isReturning = history && history.length > 0;
    const prompt = `Kamu adalah AI productivity coach untuk aplikasi Impetus. Analisis data tugas pengguna dan buat laporan simulasi masa depan yang sangat personal dan memotivasi dalam Bahasa Indonesia.\n\nData Pengguna:\n- Nama: ${userName}\n- Total tugas: ${total}\n- Tugas selesai: ${done} (${rate}%)\n- Sedang berjalan: ${inProgress}\n- Kategori fokus: ${(categories as string[]).join(", ")}\n- Goal 6 bulan ke depan: "${goal || "Tidak disebutkan"}"\n${historyContext}\n${isReturning ? `Ini simulasi ke-${history.length + 1}. Bandingkan dengan sebelumnya.` : "Ini simulasi pertama."}\n\nBuat laporan simulasi masa depan 6 bulan. Format:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔮  LAPORAN SIMULASI MASA DEPAN AI${isReturning ? ` #${history.length + 1}` : ""}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nBerdasarkan analisis AI terhadap ${total} tugas dan pola produktivitas ${userName}:\n\n📊 SKOR POTENSI MASA DEPAN: [nilai]/100\n[evaluasi singkat]\n${isReturning ? "\n📈 PERBANDINGAN DENGAN SIMULASI SEBELUMNYA:\n[bandingkan skor dan progress]\n" : ""}\n─────────────────────────────────────\n🎯 MILESTONE UTAMA (6 Bulan)\n─────────────────────────────────────\n\n▸ Bulan 1–2 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n▸ Bulan 3–4 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n▸ Bulan 5–6 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n─────────────────────────────────────\n💡 REKOMENDASI PERSONAL AI\n─────────────────────────────────────\n\n[2-3 paragraf spesifik berdasarkan data]\n\n─────────────────────────────────────\n✨ PREDIKSI AKHIR\n─────────────────────────────────────\n\n[prediksi pertumbuhan dengan angka]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n          Powered by Impetus AI ⚡\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nIsi semua bagian dengan konten nyata.`;

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
      return c.json({ error: `Gemini API error: ${errText}` }, 500);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return c.json({ error: "Tidak ada respons dari Gemini AI." }, 500);

    if (userId) {
      await supabase.from("simulation_history").insert({
        user_id: userId,
        goal: goal || "",
        result: text,
        task_snapshot: { total, done, rate, categories },
      }).catch(e => console.log("Warning: failed to save simulation:", e));
    }

    return c.json({ result: text });
  } catch (e) {
    return c.json({ error: `Simulasi gagal: ${e}` }, 500);
  }
});

Deno.serve(app.fetch);
