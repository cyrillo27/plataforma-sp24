// Gera o supabase/seed.sql a partir do js/aulas.js
// Rode no terminal do VS Code, na pasta do projeto:
//   node ferramentas/gerar-seed.js
// Use sempre que mudar o material ou colocar um link do YouTube.

const fs = require("fs");
const path = require("path");

const codigo = fs.readFileSync(path.join(__dirname, "..", "js", "aulas.js"), "utf8");
const AULAS = new Function(codigo + "; return AULAS;")();

const q = (v) => (v === null || v === undefined || v === "" ? "null" : "'" + String(v).replace(/'/g, "''") + "'");

const linhas = AULAS.map((a) =>
  `(${q(a.id)}, ${a.numero}, ${q(a.modulo)}, ${q(a.titulo)}, ${q(a.resumo)}, ${q(a.conteudo)}, ${q(a.video)}, ${q([].concat(a.youtube || []).join(" "))}, ${q(a.slides)}, ${q(a.pdf)})`
);

const sql = `-- Gerado por ferramentas/gerar-seed.js — não edite à mão.
-- Cole no Supabase: SQL Editor > New query > Run (depois do schema.sql)
insert into aulas (id, numero, modulo, titulo, resumo, conteudo, video, youtube, slides, pdf) values
${linhas.join(",\n")}
on conflict (id) do update set
  numero = excluded.numero, modulo = excluded.modulo, titulo = excluded.titulo,
  resumo = excluded.resumo, conteudo = excluded.conteudo, video = excluded.video,
  youtube = excluded.youtube, slides = excluded.slides, pdf = excluded.pdf;
`;

fs.writeFileSync(path.join(__dirname, "..", "supabase", "seed.sql"), sql);
console.log(`seed.sql gerado com ${AULAS.length} aulas.`);
