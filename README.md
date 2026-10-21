# 🌐 GlowAuth — Google SSO Integration

O **GlowAuth** é um ecossistema completo de autenticação que implementa o padrão **Single Sign-On (SSO)** utilizando o ecossistema oficial do **Google Identity Services**. O projeto foi construído sob uma arquitetura totalmente desacoplada, separando o cliente de renderização visual (Front-end) do servidor de auditoria de segurança (Back-end).

A aplicação conta com gerenciamento de estado persistente local, tratamento dinâmico do ciclo de vida dos componentes e blindagem de chaves privadas através de variáveis de ambiente.

---

## 🚀 Tecnologias e Ferramentas

### Front-end
* **React 18** (Biblioteca base para a interface reativa)
* **Vite** (Build tool de altíssima performance para desenvolvimento local)
* **TypeScript** (Tipagem estática estrita e prevenção de comportamentos inesperados)
* **Google Identity Services SDK** (Biblioteca nativa do Google para autenticação segura)

### Back-end
* **Node.js** com **Express** (Infraestrutura de servidor e roteamento rápido)
* **TypeScript** (Manutenção de consistência de dados entre client/server)
* **Google Auth Library** (Biblioteca criptográfica do Google para auditoria de assinaturas de JWT)
* **TSX** (Executor nativo do ecossistema TypeScript em runtime)

---

## 📐 Arquitetura do Fluxo de Autenticação

O projeto foge do modelo simplista de autenticação local e adota o fluxo recomendado para sistemas de nível de produção:

1. **Renderização Segura:** O Front-end consome dinamicamente o SDK do Google, instanciando o botão oficial através de referências diretas da DOM (`buttonDiv`).
2. **Emissão do Token:** O usuário realiza o login na janela isolada do Google. Após a aprovação dos escopos, o Google gera um **JWT (JSON Web Token)** criptografado com o perfil do usuário e devolve ao Front-end.
3. **Ponte de Transporte:** O Front-end captura as credenciais e realiza uma requisição `POST` para o servidor Node.js.
4. **Auditoria Criptográfica (Back-end):** O servidor recebe o token e faz uma verificação de assinatura junto às chaves públicas do Google através do método `verifyIdToken`. O servidor valida se o remetente, os tempos de expiração e o `Audience` (ID do Cliente) são legítimos.
5. **Persistência Estável:** Com o payload aprovado pelo back-end, o front-end grava o perfil de forma segura no **LocalStorage** e sincroniza a interface do React para exibir o card do usuário com a foto oficial.

---

## 🛠️ Como Executar o Projeto Localmente

### 1. Pré-requisitos
* [Node.js](https://nodejs.org) instalado (v18 ou superior).
* Um projeto e um **Client ID OAuth2** configurados no [Google Cloud Console](https://google.com).

### 2. Configurando as Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` na raiz da pasta `backend/`:
```env
GOOGLE_CLIENT_ID=seu_id_do_google_
PORT=3000
```

Crie um arquivo `.env` na raiz da pasta `frontend/`:
```env
VITE_GOOGLE_CLIENT_ID=seu_id_do_google_
```

### 3. Executando o Back-end
```bash
cd backend
npm install
npm run dev
```
*O servidor iniciará em `http://localhost:3000`*

### 4. Executando o Front-end
```bash
cd ../frontend
npm install
npm run dev
```
*O cliente iniciará em `http://localhost:5173`*

---

## 🔒 Segurança e Tratamento de Edge Cases Implementados

* **Proteção contra Vazamento de Chaves:** O repositório possui uma regra unificada de `.gitignore` que impede o rastreamento estrutural de arquivos `.env` e diretórios pesados de terceiros (`node_modules`).
* **Segurança de Referenciador (CORS):** Implementação da diretiva `referrerPolicy="no-referrer"` nas tags de imagem para permitir o carregamento seguro de avatares vindos dos servidores de conteúdo do Google (`://googleusercontent.com`) em ambiente de desenvolvimento.
* **Sincronização de Estado Assíncrono:** Uso de microtarefas temporizadas (`setTimeout`) para garantir o re-alinhamento correto do botão dinâmico do Google ao alternar entre os estados de login e logout no ciclo de vida do React.
