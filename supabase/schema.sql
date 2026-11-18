-- =============================================================
-- PLATAFORMA SP24 — estrutura do banco
-- Cole tudo no Supabase: SQL Editor > New query > Run
-- =============================================================

-- 1. Tabela das aulas (o material que a IA usa para responder)
create table if not exists aulas (
  id        text primary key,          -- ex.: 'aula-26'
  numero    int  not null default 0,
  modulo    text not null,
  titulo    text not null,
  resumo    text,
  conteudo  text not null,             -- o material da aula
  video     text,                      -- arquivo MP4 do site
  youtube   text,                      -- link do YouTube
  slides    text,                      -- link dos slides
  pdf       text                       -- PDF dos slides
);

-- 2. Tabela das dúvidas dos alunos
create table if not exists duvidas (
  id         bigint generated always as identity primary key,
  aula_id    text references aulas(id) on delete cascade,
  nome       text check (char_length(nome) <= 60),
  pergunta   text not null check (char_length(pergunta) between 3 and 600),
  resposta   text,
  fonte      text default 'ia',        -- 'ia' ou 'busca'
  created_at timestamptz not null default now()
);

create index if not exists duvidas_aula_idx on duvidas (aula_id, created_at desc);

-- 3. Segurança (RLS): todo mundo lê; aluno só pode criar dúvida.
--    Ninguém de fora apaga ou edita. Você apaga pelo painel do Supabase.
alter table aulas   enable row level security;
alter table duvidas enable row level security;

drop policy if exists "ler aulas" on aulas;
create policy "ler aulas" on aulas for select using (true);

drop policy if exists "ler duvidas" on duvidas;
create policy "ler duvidas" on duvidas for select using (true);

drop policy if exists "criar duvida" on duvidas;
create policy "criar duvida" on duvidas for insert with check (true);
