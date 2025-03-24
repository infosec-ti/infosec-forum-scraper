# Forum Scraper

## Descrição
Uma aplicação Node.js para extrair dados de fóruns web utilizando Puppeteer. Esta ferramenta permite buscar por posts específicos em um fórum e extrair tanto os posts quanto seus comentários.

## Requisitos
- Node.js 18+
- npm

## Instalação

```bash
# Clone o repositório
git clone [url-do-repositório]

# Entre no diretório do projeto
cd node-forum-scraper

# Instale as dependências
npm install

## Configuração
Antes de usar, você precisa configurar as variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
```bash
PORT=3000
FORUM_URL=https://url-do-forum
FORUM_USERNAME=seu-usuario
FORUM_PASSWORD=sua-senha
AUTH_TOKEN=token-de-autenticacao
```

## Uso

### Iniciando o servidor
```bash
npm run start
```

### Realizando uma busca
A API disponibiliza um endpoint para busca:

```
GET /forum-scraper/:searchText
```

Onde `:searchText` é o texto que você deseja buscar no fórum.

### Modos Verbose

Este projeto suporta modos de log detalhados para auxiliar no diagnóstico de problemas:

1. **Modo Verbose Básico**: Mostra logs básicos da execução
   ```bash
   npm run start verbose
   ```

2. **Modo Verbose 2**: Mostra logs ainda mais detalhados
   ```bash
   npm run start verbose verbose2
   ```

## Estrutura do Projeto

```
src/
├── common/              # Utilidades compartilhadas
│   ├── config/          # Configurações da aplicação
│   └── utils/           # Funções utilitárias
├── core/                # Lógica principal
│   └── forum-scraper/   # Módulo de scraping
│       ├── services/    # Serviços
│       └── forum-scraper.controller.ts
├── domain/              # Definições de domínio
│   ├── entities/        # Entidades (Post, Comment)
│   ├── puppeteer/       # Wrapper para Puppeteer
│   └── server/          # Configuração do servidor Express
│       ├── middlewares/ # Middlewares (auth, error handling)
│       └── routes/      # Rotas da API
└── index.ts             # Ponto de entrada da aplicação
```

## Tratamento de Erros

O sistema possui tratamento de erros abrangente que retorna respostas padronizadas:

```json
{
  "error": true,
  "message": "Mensagem de erro detalhada",
  "code": "CODIGO_DE_ERRO",
  "status": 500
}
```

## Exemplos de Uso

### Exemplo de requisição
```bash
curl -H "Authorization: seu-token-de-autenticacao" http://localhost:3000/forum-scraper/termo-de-busca
```

### Exemplo de resposta
```json
{
  "search_text": "termo-de-busca",
  "danger_quantity": 2,
  "dangers": [
    {
      "author": "Autor do Post",
      "url": "https://url-do-post",
      "date": "2023-09-15T12:00:00",
      "replies": 5,
      "title": "Título do Post",
      "text": "Conteúdo do post...",
      "tags": "[Tag1][Tag2]",
      "comments": [
        {
          "author": "Autor do Comentário",
          "date": "2023-09-16T10:30:00",
          "text": "Texto do comentário...",
          "url": "https://url-do-comentario"
        }
      ]
    }
  ]
}
``` 
