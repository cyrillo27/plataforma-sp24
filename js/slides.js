// Página "Todos os slides": lista à esquerda, PDF aberto à direita.
// Cada PDF fica em slides/ com o id da aula: slides/aula-02.pdf, slides/extra-lampada.pdf...

const lista = document.querySelector("#lista");
const visor = document.querySelector("#visor");
const titulo = document.querySelector("#titulo-slide");
const botoes = document.querySelector("#botoes");

const rotulo = (a) => (a.numero ? `Aula ${String(a.numero).padStart(2, "0")}` : "Extra");
const caminho = (a) => a.pdf || `slides/${a.id}.pdf`;

async function existe(c) {
  try { return (await fetch(c, { method: "HEAD" })).ok; } catch (e) { return false; }
}

function abrir(aula, botao) {
  lista.querySelectorAll("button").forEach((b) => b.classList.remove("ativo"));
  botao.classList.add("ativo");
  titulo.textContent = `${rotulo(aula)} · ${aula.titulo}`;
  const pdf = caminho(aula);
  botoes.innerHTML =
    `<a class="botao" href="${pdf}" target="_blank" rel="noopener">Tela cheia ↗</a>` +
    `<a class="botao secundario" href="aula.html?id=${aula.id}">Ver a aula</a>`;
  visor.innerHTML = `<iframe class="pdf" src="${pdf}#view=FitH" title="Slides"></iframe>`;
  history.replaceState(null, "", `?id=${aula.id}`);
  if (innerWidth < 800) visor.scrollIntoView({ behavior: "smooth" });
}

(async () => {
  const pedido = new URLSearchParams(location.search).get("id");
  const comPdf = [];
  for (const aula of AULAS) if (await existe(caminho(aula))) comPdf.push(aula);

  if (comPdf.length === 0) {
    titulo.textContent = "Nenhum PDF na pasta slides ainda.";
    return;
  }

  let primeiro = null;
  for (const aula of comPdf) {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span class="num"></span><span class="nome"></span>`;
    b.querySelector(".num").textContent = rotulo(aula);
    b.querySelector(".nome").textContent = aula.titulo;
    b.addEventListener("click", () => abrir(aula, b));
    lista.appendChild(b);
    if (!primeiro || aula.id === pedido) primeiro = { aula, b };
  }
  abrir(primeiro.aula, primeiro.b);
})();
