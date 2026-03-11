# Agendio — Sistema de Agendamento Online

Sistema de agendamento para qualquer tipo de negócio: barbearias, salões, clínicas, estúdios de tatuagem, personal trainers, manicure e muito mais.

---

## 📁 Estrutura do Projeto

```
agendio/
├── index.html       ← Estrutura da página (HTML)
├── style.css        ← Todos os estilos visuais
├── script.js        ← Toda a lógica da aplicação
├── netlify.toml     ← Configuração para deploy no Netlify
├── vercel.json      ← Configuração para deploy na Vercel
└── README.md        ← Este arquivo
```

---

## 🚀 Deploy — Passo a Passo

### Opção 1: Netlify (recomendado para iniciantes)

1. Acesse [netlify.com](https://netlify.com) e crie uma conta gratuita
2. Na dashboard, clique em **"Add new site" → "Deploy manually"**
3. Arraste a pasta `agendio/` para a área indicada
4. Pronto! O site vai estar no ar em segundos com HTTPS automático

**Ou via GitHub:**
1. Suba a pasta para um repositório no GitHub
2. No Netlify: "Add new site" → "Import from Git" → selecione o repositório
3. Configurações de build: deixe em branco (site estático)
4. Clique em **Deploy**

---

### Opção 2: Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita
2. Clique em **"Add New Project"**
3. Importe o repositório do GitHub com os arquivos
4. Framework Preset: **Other** (site estático)
5. Clique em **Deploy**

**Ou via CLI:**
```bash
npm i -g vercel
cd agendio/
vercel
```

---

## ⚙️ Primeiro Acesso

Na primeira vez que o site for aberto, um **assistente de configuração** vai aparecer automaticamente. Ele vai pedir:

1. **Tipo de negócio** — Barbearia, Salão, Clínica, Tattoo, etc.
2. **Nome do negócio** e **nome do profissional**
3. **Criação de senha** para o painel administrativo

Cada proprietário cria a própria senha — não há senha padrão.

---

## 🔑 Painel Administrativo

Acesse pelo botão **"Admin"** no canto superior direito.

| Aba       | Função                                              |
|-----------|-----------------------------------------------------|
| Agenda    | Ver agendamentos do dia, marcar chegada, lembrete WA |
| Bloqueio  | Fechar/abrir agenda de emergência                   |
| WA        | Configurar número e lembretes de WhatsApp           |
| Config    | Nome, tipo, dias/horas de trabalho, folgas          |
| Senha     | Alterar senha de acesso ao painel                   |

---

## 💾 Armazenamento de Dados

Os dados (agendamentos, configurações, senha) são salvos no **localStorage** do navegador do dispositivo onde o painel é acessado.

> ⚠️ **Importante:** como é um sistema estático sem banco de dados, os dados ficam no dispositivo local. Para usar em múltiplos dispositivos ou ter backup, o próximo passo seria integrar com um backend (Firebase, Supabase, etc.).

---

## 🌐 Compatibilidade

- ✅ Chrome, Firefox, Safari, Edge (versões modernas)
- ✅ Mobile (iOS e Android)
- ✅ HTTPS (obrigatório para localStorage em domínios públicos)
- ✅ PWA-ready (pode ser adicionado à tela inicial do celular)

---

## 📞 Tecnologias Utilizadas

- HTML5 semântico
- CSS3 com variáveis customizadas
- JavaScript vanilla (sem frameworks, sem dependências)
- Google Fonts (Bebas Neue + DM Sans) via CDN
- localStorage para persistência de dados

---

*Powered by **Agendio***
