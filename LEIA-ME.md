# Plataforma SP24: aulas, vídeos, slides e dúvidas

Site para a turma ver as aulas 02 a 26 (do Figma ao React) e os exercícios extras.
Em cada aula aparecem o vídeo, os slides e o material, além de um campo de dúvidas que responde com base no material do curso.

## O que tem na pasta

```
plataforma-sp24/
├── index.html            lista de aulas por módulo, busca e dúvidas gerais
├── aula.html             página de cada aula (aula.html?id=aula-26)
├── css/style.css
├── js/
│   ├── config.js         ← você coloca aqui o endereço do Supabase
│   ├── aulas.js          ← TODO o material (títulos, textos, vídeos, slides)
│   ├── duvidas.js        caixa de dúvidas (banco + resposta)
│   ├── index.js
│   └── aula.js
├── videos/               MP4 da calculadora (os outros vídeos estão no YouTube)
├── slides/               PDFs dos slides de todas as aulas (nome = id da aula)
├── supabase/
│   ├── schema.sql        cria as tabelas do banco
│   ├── seed.sql          coloca as aulas no banco
│   └── functions/responder/index.ts   função que responde com IA
└── ferramentas/gerar-seed.js          refaz o seed.sql a partir do aulas.js
```

## Passo 1: testar no VS Code (sem banco)

1. Abra a pasta `plataforma-sp24` no VS Code.
2. Clique com o botão direito no `index.html` e escolha **Open with Live Server**.
3. Já funciona: aulas, vídeos e dúvidas. Sem o banco, a dúvida é respondida por uma **busca no material** e fica salva só naquele navegador.

## Passo 2: criar o banco (Supabase, grátis)

1. Entre em supabase.com, crie uma conta e clique em **New project**. Guarde a senha do banco.
2. No menu da esquerda, abra **SQL Editor** e clique em **New query**.
3. Cole todo o `supabase/schema.sql` e clique em **Run**.
4. Abra outra query, cole todo o `supabase/seed.sql` e clique em **Run**.
5. Em **Table Editor** aparecem as tabelas `aulas` (28 linhas) e `duvidas`.
6. Em **Project Settings › API**, copie a **Project URL** e a chave **anon public**.
7. Cole as duas no `js/config.js`:

```js
SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```

A partir daqui as dúvidas ficam salvas no banco, e a turma inteira vê as perguntas de todos.

## Passo 3: ligar as respostas com IA (opcional)

Sem este passo, o site continua respondendo pela busca no material. Com ele, o Claude lê o material das aulas e responde do jeito de um monitor.

1. Crie uma chave em console.anthropic.com, em **API Keys**. Você precisa colocar crédito na conta.
2. No terminal do VS Code, dentro da pasta do projeto:

```
npx supabase login
npx supabase link --project-ref SEU-PROJETO
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy responder --no-verify-jwt
```

`SEU-PROJETO` é o código que aparece no endereço do Supabase, como `abcdefgh` em `abcdefgh.supabase.co`.

Custo: cada pergunta usa o modelo Claude Haiku e custa menos de 1 centavo de dólar. Para acompanhar, veja o painel da Anthropic.
Se a função falhar ou ficar sem crédito, o site volta sozinho para a busca no material.

**Nunca** coloque a chave da Anthropic no `config.js` nem no GitHub. Ela fica só no Supabase, pelo comando `secrets set`.

## Passo 4: colocar no ar

**GitHub Pages:** suba a pasta para um repositório (git add, git commit, git push). Depois vá em **Settings › Pages**, escolha a branch **main** e salve.
A chave anon pode ficar no site, porque ela só deixa ler as aulas e criar dúvidas. Ninguém de fora consegue apagar ou editar.

## Como atualizar

- **Vídeo do YouTube:** no `js/aulas.js`, preencha `youtube: "https://youtu.be/..."` na aula. O YouTube tem prioridade sobre o MP4.
- **Slides em PDF:** baixe o deck em PDF e salve na pasta `slides/` com o **id da aula** no nome: `aula-07.pdf`, `aula-12.pdf`, `extra-revisao-html.pdf`, `extra-resumo-modulo1.pdf`. O site acha o arquivo sozinho e mostra o PDF na página da aula e em **Todos os slides** (`slides.html`). Não precisa mexer no código.
- **Sem PDF:** enquanto não tiver o PDF, a aula mostra o botão "Abrir os slides", que leva ao deck no Claude. Para os alunos abrirem esse link, compartilhe o deck.
- **Material novo (aula 27 em diante):** copie um bloco de aula no `aulas.js` e mude os dados.
- **Depois de mudar o `aulas.js`:** rode `node ferramentas/gerar-seed.js` e cole o `seed.sql` de novo no SQL Editor, para a IA conhecer a mudança.
- **Apagar uma dúvida:** no Supabase, abra Table Editor › duvidas e apague a linha.

## Vídeos grandes

O GitHub aceita arquivos de até 100 MB. Os MP4 de hoje são pequenos, mas para gravações longas use o YouTube, como vídeo não listado.
