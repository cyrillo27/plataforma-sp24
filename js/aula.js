// Página de uma aula: aula.html?id=aula-26

const id = new URLSearchParams(location.search).get("id");
const posicao = AULAS.findIndex((a) => a.id === id);
const aula = AULAS[posicao];

if (!aula) {
  document.querySelector("main").innerHTML =
    `<p class="nada">Aula não encontrada. <a href="index.html">Voltar para a lista</a>.</p>`;
} else {
  const rotulo = aula.numero ? `Aula ${String(aula.numero).padStart(2, "0")}` : "Exercício extra";
  document.title = `${rotulo} — ${aula.titulo}`;
  document.querySelector("#eyebrow").textContent = `${rotulo} · ${aula.modulo}`;
  document.querySelector("#titulo").textContent = aula.titulo;
  document.querySelector("#resumo").textContent = aula.resumo;

  // ---------- Vídeo ----------
  const video = document.querySelector("#video");
  const ids = [].concat(aula.youtube || []).map(pegarIdYoutube).filter(Boolean);
  if (ids.length) {
    video.className = "videos";
    video.innerHTML = ids
      .map((v, i) => `${ids.length > 1 ? `<p class="parte">Vídeo ${i + 1} de ${ids.length}</p>` : ""}
        <div class="video"><iframe src="https://www.youtube.com/embed/${v}" title="Vídeo da aula" referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`)
      .join("");
  } else if (aula.video) {
    video.innerHTML = `<video controls preload="metadata" src="${aula.video}"></video>`;
  } else {
    video.className = "video vazio";
    video.textContent = "Vídeo em breve.";
  }

  // ---------- Slides ----------
  // O PDF é achado pelo nome: slides/aula-07.pdf, slides/extra-lampada.pdf...
  const slides = document.querySelector("#slides");
  const caminhoPdf = aula.pdf || `slides/${aula.id}.pdf`;
  existe(caminhoPdf).then((temPdf) => {
    const botoes = document.createElement("div");
    botoes.className = "botoes";
    if (temPdf) {
      botoes.innerHTML =
        `<a class="botao" href="${caminhoPdf}" target="_blank" rel="noopener">Tela cheia ↗</a>` +
        `<a class="botao secundario" href="${caminhoPdf}" download>Baixar PDF</a>`;
      slides.appendChild(botoes);
      const pdf = document.createElement("iframe");
      pdf.className = "pdf";
      pdf.src = caminhoPdf + "#view=FitH";
      pdf.title = "Slides em PDF";
      slides.appendChild(pdf);
    } else if (aula.slides) {
      botoes.innerHTML = `<a class="botao" href="${aula.slides}" target="_blank" rel="noopener">Abrir os slides ↗</a>`;
      slides.appendChild(botoes);
    } else {
      slides.textContent = "Slides em breve.";
    }
  });

  // ---------- Material ----------
  const material = document.querySelector("#material");
  for (const frase of frasesDe(aula.conteudo)) {
    const p = document.createElement("p");
    p.textContent = frase;
    material.appendChild(p);
  }

  // ---------- Dúvidas ----------
  montarDuvidas(document.querySelector("#caixa-duvidas"), aula.id);

  // ---------- Anterior / próxima ----------
  const nav = document.querySelector("#navegacao");
  const ant = AULAS[posicao - 1];
  const prox = AULAS[posicao + 1];
  nav.innerHTML =
    (ant ? `<a href="aula.html?id=${ant.id}">← ${ant.titulo}</a>` : "<span></span>") +
    (prox ? `<a href="aula.html?id=${prox.id}" class="dir">${prox.titulo} →</a>` : "<span></span>");
}

function pegarIdYoutube(link) {
  if (!link) return "";
  const m = link.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : "";
}

async function existe(caminho) {
  try {
    const r = await fetch(caminho, { method: "HEAD" });
    return r.ok;
  } catch (e) {
    return false;
  }
}
