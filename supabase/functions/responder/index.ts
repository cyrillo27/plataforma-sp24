// =============================================================
// FUNÇÃO "responder" (Supabase Edge Function)
// Recebe a pergunta do aluno, junta o material das aulas,
// pergunta para o Claude e salva a resposta no banco.
//
// Precisa do segredo ANTHROPIC_API_KEY (veja o LEIA-ME).
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY o Supabase já coloca sozinho.
// =============================================================

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const MODELO = "claude-haiku-4-5-20251001";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ erro: "Use POST" }, 405);

  try {
    const { aula_id, pergunta, nome } = await req.json();
    const texto = String(pergunta || "").trim().slice(0, 600);
    if (texto.length < 3) return json({ erro: "Escreva a dúvida." }, 400);

    const banco = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Busca o material de todas as aulas
    const { data: aulas, error } = await banco
      .from("aulas")
      .select("id, numero, titulo, conteudo")
      .order("numero");
    if (error) throw error;

    const atual = aulas.find((a) => a.id === aula_id);
    const material = aulas
      .map((a) => `### ${a.numero ? "Aula " + a.numero : "Extra"}: ${a.titulo}\n${a.conteudo}`)
      .join("\n\n");

    // 2. Pergunta para o Claude
    const instrucoes =
      `Você é o monitor do curso de desenvolvimento web da turma SP24 (noturno), do professor Leandro.
Responda a dúvida do aluno em português do Brasil, de forma simples, curta (até 8 linhas) e prática,
como um professor paciente falaria com um iniciante.
Use SOMENTE o material do curso abaixo. Se a resposta não estiver no material, diga que esse assunto
ainda não foi visto e sugira perguntar ao professor na aula.
Quando ajudar, mostre um pequeno trecho de código e diga em qual aula o assunto aparece.
Não resolva a atividade inteira pelo aluno: explique o caminho.
${atual ? `O aluno está na página da Aula ${atual.numero || ""}: ${atual.titulo}. Dê prioridade a ela.` : ""}

MATERIAL DO CURSO:
${material}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 700,
        system: instrucoes,
        messages: [{ role: "user", content: texto }],
      }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
    const resultado = await r.json();
    const resposta = resultado.content?.[0]?.text?.trim() || "Não consegui responder agora.";

    // 3. Salva a dúvida e a resposta
    await banco.from("duvidas").insert({
      aula_id: atual ? atual.id : null,
      nome: String(nome || "").slice(0, 60) || null,
      pergunta: texto,
      resposta,
      fonte: "ia",
    });

    return json({ resposta });
  } catch (e) {
    console.error(e);
    return json({ erro: "Falha ao responder", detalhe: String(e) }, 500);
  }
});
