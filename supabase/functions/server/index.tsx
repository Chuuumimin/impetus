import { Hono } from "npm:hono@4";
import { cors } from "npm:hono@4/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

app.use("/*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], exposeHeaders: ["Content-Length"], maxAge: 600 }));

const P = "/make-server-886336a3";

const STRICT_COACH = `Kamu adalah seorang Pelatih Kehidupan (Life Coach) yang sangat analitis, tegas, dan berorientasi pada hasil. Jangan terlalu banyak memuji. Berikan kritik tajam, evaluasi yang pragmatis, dan tantang pengguna jika target mereka tidak realistis dengan rutinitas harian mereka. Gunakan nada bicara yang lugas layaknya mentor profesional yang peduli tetapi tidak memanjakan. Jawab dalam Bahasa Indonesia.`;

function extractJSON(text: string): any {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return JSON.parse((match ? match[1] : text).trim());
}

async function callGemini(apiKey: string, prompt: string, systemInstruction?: string, temperature = 0.8, maxTokens = 2048) {
  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  if (systemInstruction) body.system_instruction = { parts: [{ text: systemInstruction }] };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini error: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Tidak ada respons dari Gemini AI.");
  return text;
}

app.get(`${P}/health`, (c) => c.json({ status: "ok" }));

// ─ USER ────────────────────────────────────────────────

app.get(`${P}/user/:userId`, async (c) => {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", c.req.param("userId")).single();
    if (error || !data) return c.json({ error: "User not found" }, 404);
    return c.json({
      name: data.name, email: data.email, plan: data.plan, avatar: data.avatar, joinDate: data.join_date,
      onboardingComplete: data.onboarding_complete || false,
      age: data.age, occupation: data.occupation, income: data.income,
      shortGoals: data.short_goals || [], longGoals: data.long_goals || [],
      skills: data.skills || [], habits: data.habits || [],
      lifeProfile: data.life_profile, roadmap: data.roadmap,
    });
  } catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

app.post(`${P}/user`, async (c) => {
  try {
    const body = await c.req.json();
    const { userId, name, email, plan, avatar, joinDate, onboardingComplete,
      age, occupation, income, shortGoals, longGoals, skills, habits, lifeProfile, roadmap } = body;
    if (!userId) return c.json({ error: "userId required" }, 400);
    const { error } = await supabase.from("users").upsert({
      id: userId, name: name || "", email: email || "", plan: plan || "free", avatar: avatar || "",
      join_date: joinDate || new Date().toISOString(), updated_at: new Date().toISOString(),
      onboarding_complete: onboardingComplete ?? false,
      age: age ?? null, occupation: occupation ?? "", income: income ?? 0,
      short_goals: shortGoals ?? [], long_goals: longGoals ?? [],
      skills: skills ?? [], habits: habits ?? [],
      life_profile: lifeProfile ?? null, roadmap: roadmap ?? null,
    });
    if (error) throw error;
    return c.json({ success: true });
  } catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

app.post(`${P}/user/:userId/upgrade`, async (c) => {
  try {
    const { data, error } = await supabase.from("users").update({ plan: "pro", updated_at: new Date().toISOString() }).eq("id", c.req.param("userId")).select().single();
    if (error) throw error;
    return c.json({ success: true, user: { name: data.name, email: data.email, plan: data.plan, avatar: data.avatar, joinDate: data.join_date } });
  } catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

// ─ TASKS ──────────────────────────────────────────────

app.get(`${P}/tasks/:userId`, async (c) => {
  try {
    const { data } = await supabase.from("tasks").select("*").eq("user_id", c.req.param("userId")).order("created_at", { ascending: true });
    return c.json((data || []).map((t: any) => ({ id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority, category: t.category, createdAt: t.created_at, dueDate: t.due_date || undefined })));
  } catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

app.put(`${P}/tasks/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const tasks = await c.req.json();
    await supabase.from("tasks").delete().eq("user_id", userId);
    if (Array.isArray(tasks) && tasks.length > 0) {
      const { error } = await supabase.from("tasks").insert(tasks.map((t: any) => ({ id: t.id, user_id: userId, title: t.title || "", description: t.description || "", status: t.status || "todo", priority: t.priority || "medium", category: t.category || "", due_date: t.dueDate || null, created_at: t.createdAt || new Date().toISOString() })));
      if (error) throw error;
    }
    return c.json({ success: true });
  } catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

// ─ SIMULATION HISTORY ───────────────────────────────

app.get(`${P}/simulations/:userId`, async (c) => {
  try {
    const { data } = await supabase.from("simulation_history").select("*").eq("user_id", c.req.param("userId")).order("created_at", { ascending: true });
    return c.json((data || []).map((s: any) => ({ id: s.id, goal: s.goal, result: s.result, createdAt: s.created_at, taskSnapshot: s.task_snapshot })));
  } catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

app.delete(`${P}/simulations/:userId`, async (c) => {
  try { await supabase.from("simulation_history").delete().eq("user_id", c.req.param("userId")); return c.json({ success: true }); }
  catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

// ─ CHAT ────────────────────────────────────────────────

app.get(`${P}/chat/:userId`, async (c) => {
  try {
    const { data } = await supabase.from("chat_messages").select("*").eq("user_id", c.req.param("userId")).order("created_at", { ascending: true });
    return c.json((data || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at })));
  } catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

app.post(`${P}/chat/:userId`, async (c) => {
  try {
    const userId = c.req.param("userId");
    const { message, userName } = await c.req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return c.json({ error: "GEMINI_API_KEY belum dikonfigurasi." }, 500);

    const { data: history } = await supabase.from("chat_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: true });
    const ctx = (history || []).slice(-20).map((m: any) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] }));

    const sysPrompt = `${STRICT_COACH} Nama pengguna adalah ${userName}. Kamu memiliki akses penuh ke data produktivitas dan target hidupnya. Respons singkat, langsung ke poin, dan berikan tantangan konkret jika diperlukan.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_instruction: { parts: [{ text: sysPrompt }] }, contents: [...ctx, { role: "user", parts: [{ text: message }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 1024 } }),
    });
    if (!res.ok) return c.json({ error: `Gemini error: ${await res.text()}` }, 500);
    const geminiData = await res.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return c.json({ error: "Tidak ada respons dari AI." }, 500);

    const { data: inserted } = await supabase.from("chat_messages").insert([
      { user_id: userId, role: "user", content: message },
      { user_id: userId, role: "assistant", content: text },
    ]).select();
    const aiMsg = inserted?.[1];
    return c.json({ message: { id: aiMsg?.id ?? crypto.randomUUID(), role: "assistant", content: text, createdAt: aiMsg?.created_at ?? new Date().toISOString() } });
  } catch (e) { return c.json({ error: `Chat gagal: ${e}` }, 500); }
});

app.delete(`${P}/chat/:userId`, async (c) => {
  try { await supabase.from("chat_messages").delete().eq("user_id", c.req.param("userId")); return c.json({ success: true }); }
  catch (e) { return c.json({ error: `Failed: ${e}` }, 500); }
});

// ─ GENERATE LIFE PROFILE (Onboarding) ──────────────────

app.post(`${P}/generate-life-profile`, async (c) => {
  try {
    const { userId, age, occupation, income, shortGoals, longGoals, skills, habits, userName } = await c.req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return c.json({ error: "GEMINI_API_KEY belum dikonfigurasi." }, 500);

    const prompt = `Analisis data pengguna berikut dan buat Life Profile yang komprehensif.

Data:
- Nama: ${userName}, Umur: ${age}, Pekerjaan: ${occupation}
- Pendapatan bulanan: Rp ${Number(income).toLocaleString('id-ID')}
- Target jangka pendek: ${(shortGoals || []).join(', ')}
- Visi jangka panjang: ${(longGoals || []).join(', ')}
- Keahlian: ${(skills || []).join(', ') || 'Tidak disebutkan'}
- Kebiasaan harian: ${(habits || []).join(', ') || 'Tidak disebutkan'}

Berikan evaluasi JUJUR dan TAJAM. Jangan basa-basi. Tantang asumsi yang tidak realistis.

Respons HANYA dalam format JSON berikut (tanpa markdown, tanpa teks lain):
{
  "summary": "evaluasi 3-4 kalimat yang jujur. Sebut nama. Identifikasi gap antara ambisi dan realita saat ini.",
  "strengths": ["kekuatan konkret 1", "kekuatan 2", "kekuatan 3"],
  "weaknesses": ["kelemahan kritis 1 yang perlu segera diatasi", "kelemahan 2", "kelemahan 3"],
  "roadmap": [
    {"label": "Bulan 1-2", "focus": "fondasi yang harus dibangun", "actions": ["aksi spesifik 1", "aksi 2", "aksi 3"], "color": "#D4A853"},
    {"label": "Bulan 3-4", "focus": "momentum yang harus dijaga", "actions": ["aksi 1", "aksi 2", "aksi 3"], "color": "#4ADE80"},
    {"label": "Bulan 5-6", "focus": "target yang harus dicapai", "actions": ["aksi 1", "aksi 2", "aksi 3"], "color": "#38BDF8"}
  ]
}`;

    const text = await callGemini(apiKey, prompt, STRICT_COACH, 0.75, 1500);
    let profile: any;
    try { profile = extractJSON(text); }
    catch { return c.json({ error: "AI mengembalikan format yang tidak valid. Coba lagi." }, 500); }

    if (userId) {
      const { error: saveError } = await supabase.from("users").upsert({
        id: userId, age, occupation, income,
        short_goals: shortGoals || [], long_goals: longGoals || [],
        skills: skills || [], habits: habits || [],
        life_profile: { summary: profile.summary, strengths: profile.strengths, weaknesses: profile.weaknesses },
        roadmap: profile.roadmap,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      });
      if (saveError) console.log("Warning: failed to save profile:", saveError);
    }

    return c.json({ summary: profile.summary, strengths: profile.strengths, weaknesses: profile.weaknesses, roadmap: profile.roadmap });
  } catch (e) { return c.json({ error: `Profile generation gagal: ${e}` }, 500); }
});

// ─ AI SIMULATION ─────────────────────────────────────

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

    const histCtx = history && history.length > 0
      ? `\nRiwayat simulasi sebelumnya:\n${history.slice(-3).map((h: any, i: number) => {
          const scoreMatch = h.result?.match(/SKOR POTENSI MASA DEPAN:\s*(\d+)/);
          const score = scoreMatch ? scoreMatch[1] : "?";
          return `- Simulasi ${i + 1}: Goal "${h.goal || "tidak disebutkan"}" → Skor ${score}/100`;
        }).join("\n")}\n`
      : "";

    const isReturning = history && history.length > 0;
    const prompt = `Analisis data tugas pengguna dan buat laporan simulasi masa depan yang JUJUR dan TAJAM dalam Bahasa Indonesia.\n\nData:\n- Nama: ${userName}\n- Total tugas: ${total}, Selesai: ${done} (${rate}%), Berjalan: ${inProgress}\n- Kategori: ${(categories as string[]).join(", ")}\n- Goal 6 bulan: "${goal || "Tidak disebutkan"}"\n${histCtx}\n${isReturning ? `Simulasi ke-${history.length + 1}. Bandingkan dengan sebelumnya dan tunjukkan apakah ada perbaikan nyata atau stagnansi.` : "Simulasi pertama."}\n\nFormat:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔮  LAPORAN SIMULASI MASA DEPAN AI${isReturning ? ` #${history.length + 1}` : ""}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📊 SKOR POTENSI MASA DEPAN: [nilai]/100\n[evaluasi jujur — kalau skornya rendah, jelaskan kenapa tanpa basa-basi]\n${isReturning ? "\n📈 PERKEMBANGAN VS SIMULASI SEBELUMNYA:\n[apakah ada kemajuan nyata atau hanya stagnan?]\n" : ""}\n─────────────────────────────────────\n🎯 MILESTONE UTAMA (6 Bulan)\n─────────────────────────────────────\n\n▸ Bulan 1–2 · [judul]\n  • [pencapaian konkret]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n▸ Bulan 3–4 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n▸ Bulan 5–6 · [judul]\n  • [pencapaian 1]\n  • [pencapaian 2]\n  • [pencapaian 3]\n\n─────────────────────────────────────\n💡 EVALUASI MENTOR\n─────────────────────────────────────\n\n[2-3 paragraf kritik jujur. Sebut apa yang tidak berjalan dan mengapa. Berikan tantangan spesifik.]\n\n─────────────────────────────────────\n✨ PREDIKSI AKHIR\n─────────────────────────────────────\n\n[prediksi konkret dengan angka. Jujur tentang kemungkinan gagal jika pola tidak berubah.]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n          Powered by Impetus AI ⚡\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const text = await callGemini(apiKey, prompt, STRICT_COACH, 0.85, 2048);

    if (userId) {
      const { error: simError } = await supabase.from("simulation_history").insert({ user_id: userId, goal: goal || "", result: text, task_snapshot: { total, done, rate, categories } });
      if (simError) console.log("Warning: failed to save simulation:", simError);
    }
    return c.json({ result: text });
  } catch (e) { return c.json({ error: `Simulasi gagal: ${e}` }, 500); }
});

Deno.serve(app.fetch);
