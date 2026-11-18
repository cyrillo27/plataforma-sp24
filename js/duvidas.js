// =============================================================
// DÚVIDAS: banco (Supabase) + resposta (IA ou busca no material)
// =============================================================

const banco =
  CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase
    ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
    : null;

// ---------- Busca no material (modo local e plano B) ----------
const PALAVRAS_VAZIAS = new Set(
  "de do da em no na um se eu ou os as ao me te la lo que para com como uma uns umas por mais mas não nao sim isso esse essa este esta aqui ali onde quando qual quais porque pra pro dos das nos nas aos sua seu meu minha tem ter ser foi vai faz fazer fica ficar pode usar uso usa sobre entre ate até muito pouco depois antes tudo todo toda cada algum alguma dele dela gente voce você professor aula duvida dúvida serve servir diferenca diferença coisa certo errado funciona preciso quanto quantos quanta custa".split(" ")
);

const normalizar = (t) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const palavrasDe = (t) =>
  normalizar(t)
    .split(/[^a-z0-9#.]+/)
    .map((p) => p.replace(/^\.+|\.+$/g, ""))
    .filter((p) => p.length >= 2 && !PALAVRAS_VAZIAS.has(p));

const frasesDe = (texto) => texto.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ<0-9])/);

// palavra curta (ul, ol, li, h1) só conta se aparecer inteira
const contem = (texto, termo) =>
  termo.length <= 3
    ? new RegExp(`(^|[^a-z0-9])${termo.replace(/[.#]/g, "\\$&")}([^a-z0-9]|$)`).test(texto)
    : texto.includes(termo);

function buscarNoMaterial(pergunta, aulaAtualId) {
  const termos = [...new Set(palavrasDe(pergunta))];
  if (termos.length === 0) return null;

  // palavra que aparece em poucas aulas vale mais
  const textos = AULAS.map((a) => normalizar(a.titulo + " " + a.conteudo));
  const peso = {};
  for (const t of termos) {
    const emQuantas = textos.filter((x) => contem(x, t)).length;
    peso[t] = emQuantas ? Math.log(1 + AULAS.length / emQuantas) : 0;
  }

  let melhor = null;
  AULAS.forEach((aula) => {
    const frases = frasesDe(aula.conteudo).map((frase, i) => {
      const n = normalizar(frase);
      let pontos = 0;
      for (const t of termos) if (contem(n, t)) pontos += peso[t];
      return { frase, i, pontos };
    });
    const top = frases.filter((f) => f.pontos > 0).sort((a, b) => b.pontos - a.pontos).slice(0, 3);
    let total = top.reduce((s, f) => s + f.pontos, 0);
    const titulo = normalizar(aula.titulo + " " + aula.resumo);
    for (const t of termos) if (contem(titulo, t)) total += peso[t];
    if (aula.id === aulaAtualId && total > 0) total += 0.5;
    if (!melhor || total > melhor.total) melhor = { aula, top, total };
  });
  if (!melhor || melhor.total < 2) return null;

  const trecho = melhor.top.sort((a, b) => a.i - b.i).map((f) => f.frase).join(" ");
  const onde = melhor.aula.numero ? `Aula ${melhor.aula.numero}` : "Exercício extra";
  return `${trecho}\n\nVeja mais em: ${onde} — ${melhor.aula.titulo}.`;
}

// ---------- Perguntar ----------
async function perguntar(aulaId, pergunta, nome) {
  if (banco) {
    try {
      const { data, error } = await banco.functions.invoke("responder", {
        body: { aula_id: aulaId, pergunta, nome },
      });
      if (error) throw error;
      if (data && data.resposta) return { resposta: data.resposta, fonte: "ia" };
    } catch (e) {
      console.warn("Função responder indisponível, usando a busca no material.", e);
    }
  }

  const achou = buscarNoMaterial(pergunta, aulaId);
  const resposta =
    achou ||
    "Não encontrei esse assunto no material das aulas. Tente com outras palavras (por exemplo, o nome da tag ou do comando) ou pergunte ao professor na aula.";
  const duvida = { aula_id: aulaId, nome: nome || null, pergunta, resposta, fonte: "busca" };

  if (banco) {
    await banco.from("duvidas").insert(duvida);
  } else {
    const locais = lerLocais();
    locais.unshift({ ...duvida, created_at: new Date().toISOString() });
    try { localStorage.setItem("duvidas-sp24", JSON.stringify(locais.slice(0, 100))); } catch (e) {}
  }
  return { resposta, fonte: "busca" };
}

function lerLocais() {
  try { return JSON.parse(localStorage.getItem("duvidas-sp24")) || []; } catch (e) { return []; }
}

async function listarDuvidas(aulaId) {
  if (banco) {
    let consulta = banco.from("duvidas").select("*").order("created_at", { ascending: false }).limit(30);
    consulta = aulaId ? consulta.eq("aula_id", aulaId) : consulta.is("aula_id", null);
    const { data, error } = await consulta;
    if (error) { console.warn(error); return []; }
    return data;
  }
  return lerLocais().filter((d) => (d.aula_id || null) === (aulaId || null));
}

// ---------- Monta a caixa de dúvidas na página ----------
function montarDuvidas(caixa, aulaId) {
  caixa.innerHTML = `
    <form class="perguntar">
      <label for="pergunta">Qual é a sua dúvida?</label>
      <textarea id="pergunta" rows="3" maxlength="600" required
        placeholder="Ex.: por que o meu querySelector não acha o botão?"></textarea>
      <div class="linha-form">
        <input id="nome" type="text" maxlength="60" placeholder="Seu primeiro nome (opcional)">
        <button type="submit">Perguntar</button>
      </div>
    </form>
    <div class="resposta-atual" hidden></div>
    <h3 class="titulo-lista">Dúvidas da turma</h3>
    <ul class="lista-duvidas"><li class="vazio">Carregando…</li></ul>
    <p class="modo">${banco ? "Respostas com base no material do curso." : "Modo local: respostas pela busca no material, salvas só neste navegador."}</p>
  `;

  const form = caixa.querySelector("form");
  const campo = caixa.querySelector("#pergunta");
  const nome = caixa.querySelector("#nome");
  const botao = caixa.querySelector("button");
  const atual = caixa.querySelector(".resposta-atual");
  const lista = caixa.querySelector(".lista-duvidas");

  try { nome.value = localStorage.getItem("nome-sp24") || ""; } catch (e) {}

  const desenharLista = async () => {
    const duvidas = await listarDuvidas(aulaId);
    lista.innerHTML = "";
    if (duvidas.length === 0) {
      lista.innerHTML = `<li class="vazio">Ninguém perguntou ainda. Seja o primeiro!</li>`;
      return;
    }
    for (const d of duvidas) lista.appendChild(itemDuvida(d));
  };

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const pergunta = campo.value.trim();
    if (pergunta.length < 3) return;
    try { localStorage.setItem("nome-sp24", nome.value.trim()); } catch (e) {}

    botao.disabled = true;
    botao.textContent = "Pensando…";
    atual.hidden = false;
    atual.className = "resposta-atual carregando";
    atual.textContent = "Procurando a resposta no material…";

    const { resposta } = await perguntar(aulaId, pergunta, nome.value.trim());

    atual.className = "resposta-atual";
    atual.innerHTML = "";
    const p = document.createElement("p");
    p.className = "p-pergunta";
    p.textContent = pergunta;
    const r = document.createElement("div");
    r.className = "p-resposta";
    r.textContent = resposta;
    atual.append(p, r);

    campo.value = "";
    botao.disabled = false;
    botao.textContent = "Perguntar";
    desenharLista();
  });

  desenharLista();
}

function itemDuvida(d) {
  const li = document.createElement("li");
  const det = document.createElement("details");
  const sum = document.createElement("summary");
  sum.textContent = d.pergunta;
  const meta = document.createElement("span");
  meta.className = "meta";
  const data = d.created_at ? new Date(d.created_at).toLocaleDateString("pt-BR") : "";
  meta.textContent = [d.nome, data].filter(Boolean).join(" · ");
  sum.appendChild(meta);
  const resp = document.createElement("div");
  resp.className = "p-resposta";
  resp.textContent = d.resposta || "Sem resposta.";
  det.append(sum, resp);
  li.appendChild(det);
  return li;
}
