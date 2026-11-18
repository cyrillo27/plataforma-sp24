// =============================================================
// CONFIGURAÇÃO DO BANCO (Supabase)
// Pegue os dois valores em: Supabase > Project Settings > API
// Enquanto estiverem vazios, o site funciona no "modo local":
// as dúvidas são respondidas por uma busca no material e
// ficam salvas só no navegador do aluno.
// A chave "anon" pode ficar no site: ela só lê e cria dúvidas.
// NUNCA coloque aqui a service_role nem a chave da Anthropic.
// =============================================================

const CONFIG = {
  SUPABASE_URL: "",       // ex.: "https://abcdefgh.supabase.co"
  SUPABASE_ANON_KEY: "",  // ex.: "eyJhbGciOi..."
  NOME_DA_TURMA: "SP24 · Noturno",
};
