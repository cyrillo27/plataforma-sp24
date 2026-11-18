// Página inicial: lista de aulas por módulo, busca e dúvidas gerais


const modulos = document.querySelector("#modulos");
const busca = document.querySelector("#busca");
const ORDEM = ["Figma", "HTML", "CSS", "Git e GitHub", "JavaScript", "React", "Exercícios"];

const rotulo = (aula) => (aula.numero ? `Aula ${String(aula.numero).padStart(2, "0")}` : "Extra");

function cardAula(aula) {
  const a = document.createElement("a");
  a.className = "card-aula";
  a.href = `aula.html?id=${aula.id}`;

  const num = document.createElement("span");
  num.className = "num";
  num.textContent = rotulo(aula);

  const h3 = document.createElement("h3");
  h3.textContent = aula.titulo;

  const p = document.createElement("p");
  p.textContent = aula.resumo;

  const tags = document.createElement("div");
  tags.className = "tags";
  const temVideo = [].concat(aula.youtube || []).length > 0 || aula.video;
  tags.innerHTML =
    `<span class="tag ${temVideo ? "" : "off"}">${temVideo ? "▶ Vídeo" : "Vídeo em breve"}</span>` +
    (aula.slides || aula.pdf ? `<span class="tag">Slides</span>` : "");

  a.append(num, h3, p, tags);
  return a;
}

function desenhar(filtro = "") {
  const f = normalizar(filtro.trim());
  modulos.innerHTML = "";
  let total = 0;

  for (const modulo of ORDEM) {
    const aulas = AULAS.filter(
      (a) =>
        a.modulo === modulo &&
        (!f || normalizar(`${a.titulo} ${a.resumo} ${a.conteudo} ${a.numero}`).includes(f))
    );
    if (aulas.length === 0) continue;
    total += aulas.length;

    const sec = document.createElement("section");
    sec.className = "modulo";
    const h2 = document.createElement("h2");
    h2.innerHTML = `${modulo} <span>${aulas.length}</span>`;
    const grade = document.createElement("div");
    grade.className = "grade";
    aulas.forEach((a) => grade.appendChild(cardAula(a)));
    sec.append(h2, grade);
    modulos.appendChild(sec);
  }

  if (total === 0) {
    modulos.innerHTML = `<p class="nada">Nenhuma aula com “${filtro}”. Tente outra palavra ou pergunte lá embaixo.</p>`;
  }
}

busca.addEventListener("input", () => desenhar(busca.value));
desenhar();
montarDuvidas(document.querySelector("#caixa-duvidas"), null);
