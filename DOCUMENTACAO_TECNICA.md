# Documentação Técnica - BusConecta

## 📋 Índice
1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Arquitetura da Aplicação](#arquitetura-da-aplicação)
5. [Componentes Principais](#componentes-principais)
6. [Fluxo de Funcionalidades](#fluxo-de-funcionalidades)
7. [Guia de Instalação e Execução](#guia-de-instalação-e-execução)
8. [Configurações e Variáveis de Ambiente](#configurações-e-variáveis-de-ambiente)
9. [Dependências](#dependências)
10. [Convenções de Código](#convenções-de-código)
11. [Plano de Desenvolvimento Futuro](#plano-de-desenvolvimento-futuro)

---

## Visão Geral do Projeto

### Descrição
**BusConecta** é uma aplicação móvel multiplataforma (Android, iOS e Web) desenvolvida com React Native e Expo, destinada à procura, comparação e reserva de bilhetes de autocarros em Angola.

### Objetivo Principal
Facilitar aos utilizadores a procura e reserva de viagens de autocarro entre diferentes cidades angolanas, oferecendo:
- Busca inteligente de viagens
- Comparação de agências e preços
- Seleção de assentos
- Sistema de reservas e pagamentos

### Versão
- Versão atual: **1.0.0**
- Data de criação: Fevereiro 2026

---

## Tecnologias Utilizadas

### Stack Principal
| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **React Native** | 0.81.5 | Framework para desenvolvimento mobile cross-platform |
| **Expo** | ~54.0.30 | Plataforma de desenvolvimento para aplicações React Native |
| **Expo Router** | ~6.0.21 | Sistema de roteamento baseado em ficheiros |
| **TypeScript** | ~5.9.2 | Linguagem de programação com tipagem estática |
| **React** | 19.1.0 | Biblioteca de UI |
| **React Navigation** | 7.x | Navegação entre ecrãs |
| **AsyncStorage** | ^1.x | Persistência local (utilizadores, reservas, tickets) |

### Bibliotecas de UI e Animações
- **React Native Reanimated**: ~4.1.1 - Animações de alto desempenho
- **React Native Gesture Handler**: ~2.28.0 - Gestos avançados
- **Expo Image**: ~3.0.11 - Otimização de imagens
- **Expo Haptics**: ~15.0.8 - Feedback tátil

### Ícones e Design
- **@expo/vector-icons**: ^15.0.3 - Bibliotecas de ícones (Material, Ionicons, FontAwesome)
- **expo-symbols**: ~1.0.8 - Símbolos nativos

### Segurança e Sistema
- **Expo Status Bar**: ~3.0.9 - Barra de estado
- **Expo Linking**: ~8.0.11 - Deep linking
- **Expo Constants**: ~18.0.12 - Constantes da aplicação
- **Expo Splash Screen**: ~31.0.13 - Ecrã de carregamento

### Desenvolvimento
- **ESLint**: ^9.25.0 - Linter para código JavaScript/TypeScript
- **eslint-config-expo**: ~10.0.0 - Configuração ESLint para Expo

### Suporte Web
- **React DOM**: 19.1.0
- **React Native Web**: ~0.21.0
- **Expo Web Browser**: ~15.0.10

---

## Estrutura do Projeto

```
busconectaApp/
├── app/                              # Navegação e ecrãs principais
│   ├── _layout.tsx                   # Root layout com ThemeProvider + Stack (tabs, páginas extra)
│   ├── modal.tsx                     # Modal genérico
│   ├── reserva.tsx                   # Ecrã de reserva de bilhetes (assentos, passageiros, pagamento)
│   ├── resultados.tsx                # Ecrã de resultados de viagens
│   ├── register.tsx                  # Ecrã de registo de utilizador
│   ├── minhas-viagens.tsx           # Ecrã de gestão de reservas (cancelar / remarcar)
│   ├── meus-tickets.tsx             # Ecrã de visualização de tickets com QR
│   ├── (tabs)/                       # Navegação com abas
│   │   ├── _layout.tsx               # Configuração das abas (Home, Dashboard, Explore)
│   │   ├── index.tsx                 # Home (Login)
│   │   ├── dashboard.tsx             # Ecrã principal de pesquisa + menu hambúrguer
│   │   └── explore.tsx               # Ecrã de exploração/educativo
│   └── viagem/
│       └── [id].tsx                  # Detalhe de viagem (dinâmico)
│
├── components/                       # Componentes reutilizáveis
│   ├── external-link.tsx             # Componente para links externos
│   ├── haptic-tab.tsx                # Tab com feedback háptico
│   ├── hello-wave.tsx                # Componente animado
│   ├── parallax-scroll-view.tsx       # ScrollView com paralaxe
│   ├── themed-text.tsx               # Texto com tema
│   ├── themed-view.tsx               # View com tema
│   └── ui/                           # Componentes de UI
│       ├── collapsible.tsx           # Componente expansível
│       ├── icon-symbol.tsx           # Ícones
│       └── icon-symbol.ios.tsx       # Ícones específicos iOS
│
├── constants/                        # Constantes globais
│   └── theme.ts                      # Temas (cores, fontes) light/dark
│
├── hooks/                            # Custom React Hooks
│   ├── use-color-scheme.ts           # Hook para tema do sistema
│   ├── use-color-scheme.web.ts       # Variante web
│   └── use-theme-color.ts            # Hook de cores do tema
│
├── assets/                           # Recursos estáticos
│   └── images/                       # Ícones, logos e imagens
│
├── scripts/                          # Scripts de utilitários
│   └── reset-project.js              # Script para limpar projeto
│
├── app.json                          # Configuração da aplicação Expo
├── expo-env.d.ts                     # Declarações de tipos Expo
├── tsconfig.json                     # Configuração TypeScript
├── package.json                      # Dependências e scripts
├── eslint.config.js                  # Configuração ESLint
└── README.md                         # Documentação básica
```

---

## Arquitetura da Aplicação

### Padrão de Arquitetura
A aplicação segue o padrão **File-based Routing** do Expo Router, combinado com componentes React organizados por funcionalidade.

### Fluxo de Navegação

```
RootLayout (_layout.tsx)
│
├── (tabs)
│   ├── Home (`app/(tabs)/index.tsx`)
│   │   └── [Login do utilizador]
│   │
│   ├── Dashboard (`app/(tabs)/dashboard.tsx`)
│   │   ├── [Formulário de pesquisa]
│   │   └── [Menu hambúrguer com links para "Minhas viagens",
│   │        "Meus tickets" e terminar sessão]
│   │
│   └── Explore (`app/(tabs)/explore.tsx`)
│       └── [Informações educativas]
│
├── resultados.tsx
│   └── [Lista de viagens disponíveis com cabeçalho origem/destino/data]
│
├── reserva.tsx
│   └── [Seleção de assentos, passageiros e pagamento + gravação em AsyncStorage]
│
├── register.tsx
│   └── [Registo de novo utilizador]
│
├── minhas-viagens.tsx
│   └── [Lista de reservas do utilizador + cancelamento e remarcação]
│
├── meus-tickets.tsx
│   └── [Tickets com QR code para embarque]
│
├── modal.tsx
│   └── [Modal genérico]
│
└── viagem/[id].tsx
    └── [Detalhe individual de viagem]
```

### Ciclo de Vida da Aplicação

```
1. Inicialização
   └─> RootLayout (ThemeProvider)
   
2. Navegação Tabbed
   └─> TabLayout com 2 abas (Home, Explore)
   
3. Fluxo de Pesquisa
   └─> Dashboard: Utilizador pesquisa viagem
   └─> resultados.tsx: API retorna resultados
   
4. Fluxo de Reserva
   └─> reserva.tsx: Seleção de assentos
   └─> reserva.tsx: Dados de passageiros
   └─> reserva.tsx: Pagamento
```

---

## Componentes Principais

### 1. **RootLayout** (`app/_layout.tsx`)
**Propósito**: Gerencia o tema global e estrutura raiz da aplicação

```typescript
- Importa: ThemeProvider, Stack, StatusBar
- Funções:
  • Detecta esquema de cores do sistema (dark/light)
  • Configura navegação em Stack (root + modal)
  • Aplica tema global a toda aplicação
```

**Props e Estados:**
- `colorScheme`: Detectado via `useColorScheme()` hook
- `DarkTheme/DefaultTheme`: Temas do React Navigation

**Ecrãs configurados:**
- `(tabs)` - Navegação com abas (padrão)
- `modal` - Modal para popups/diálogos

---

### 2. **Home / Login** (`app/(tabs)/index.tsx`)
**Propósito**: Autenticação do utilizador antes de aceder ao sistema

**Funcionalidades:**
- ✅ Campos de e-mail e senha
- ✅ Validação básica de preenchimento
- ✅ Autenticação local usando utilizadores guardados em AsyncStorage (`users`)
- ✅ Guarda `currentUserEmail` ao autenticar
- ✅ Link para ecrã de registo

---

### 3. **Registo** (`app/register.tsx`)
**Propósito**: Criar conta de utilizador localmente (sem backend) usando AsyncStorage

**Funcionalidades:**
- ✅ Campos: nome, e-mail, senha, confirmação de senha
- ✅ Valida campos obrigatórios, tamanho mínimo de senha e confirmação
- ✅ Garante unicidade de e-mail
- ✅ Persiste utilizador em `AsyncStorage` (`users`)
- ✅ Define `currentUserEmail` após registo
- ✅ Redireciona de volta para o login

---

### 4. **Dashboard** (`app/(tabs)/dashboard.tsx`)
**Propósito**: Ecrã principal onde utilizador pesquisa viagens, depois de autenticado

**Funcionalidades (Pesquisa):**
- ✅ Input de origem
- ✅ Input de destino
- ✅ Seletor de data (ida)
- ✅ Checkbox para ida e volta
- ✅ Campo de data de regresso (condicional)
- ✅ Botão de pesquisa

**Estados principais:**
```typescript
const [origem, setOrigem] = useState('');
const [destino, setDestino] = useState('');
const [dataIda, setDataIda] = useState('');
const [dataRegresso, setDataRegresso] = useState('');
const [idaVolta, setIdaVolta] = useState(false);
const [userName, setUserName] = useState<string | null>(null);
const [menuOpen, setMenuOpen] = useState(false);
```

**Navegação:**
- Ao pressionar "Pesquisar", navega para `/resultados` com parâmetros (`origem`, `destino`, `dataIda`)

**Menu Hambúrguer (topo da tela):**
- Opções:
  - **Minhas viagens** → `/minhas-viagens`
  - **Meus tickets** → `/meus-tickets`
  - **Terminar sessão** → limpa `currentUserEmail` e volta ao login (`/`)

**Saudação:**
- Mostra mensagem do tipo:  
  **"Para bazamos hoje NomeDoUtilizador?"**  
  usando o nome do utilizador autenticado lido de AsyncStorage

**Validação:**
- Verifica se origem, destino e data de ida estão preenchidos
- Mostra alerta se campos estiverem vazios

---

### 5. **Resultados** (`app/resultados.tsx`)
**Propósito**: Exibe lista de viagens disponíveis com detalhes

**Dados de Exemplo:**
```typescript
const viagens = [
  {
    id: 1,
    agencia: 'Huambo Express',
    origem: 'Lubango',
    destino: 'Luanda',
    hora: '07:00',
    preco: '15.000 Kz',
    duracao: '12h',
    embarque: 'Terminal Rodoviário do Lubango',
  },
  // ... mais 3 viagens
];
```

**Funcionalidades:**
- ✅ Cabeçalho com origem, destino e data de ida provenientes do `Dashboard`
- ✅ Expansão/contração de cards de viagem
- ✅ Visualização de detalhes (embarque, duração)
- ✅ Botão "Reservar" que navega para `/reserva` passando dados da viagem + data
- ✅ ScrollView para múltiplas viagens

**Estados:**
```typescript
const [viagemExpandida, setViagemExpandida] = useState<number | null>(null);
```

**Lógica de Expansão:**
- Cada card pode ser expandido/colapsado clicando
- Mostra informações adicionais quando expandido
- Botão de reserva disponível no card expandido

---

### 6. **Reserva** (`app/reserva.tsx`)
**Propósito**: Gerencia reserva de bilhetes, seleção de assentos e pagamento

**Componentes Principais:**

#### 6.1 Resumo da Viagem
Exibe informações recebidas como parâmetros:
- Origem → Destino
- Agência
- Data
- Hora de partida
- Duração
- Preço

#### 6.2 Seleção de Passageiros
```typescript
const TOTAL_ASSENTOS = 30;
const ASSENTOS_POR_FILA = 4;

const [numPassageiros, setNumPassageiros] = useState(1);
const [numPassageirosInput, setNumPassageirosInput] = useState('1');
const [passageiros, setPassageiros] = useState([{ nome: '', bilhete: '' }]);
```

- Permite selecionar número de passageiros (1-30) com input controlado (`numPassageirosInput`)
- Gera campos dinâmicos para cada passageiro
- Cada passageiro precisa de nome e bilhete

#### 6.3 Mapa de Assentos
- Grid de assentos (30 total, 4 por fila)
- Estados: disponível, selecionado, ocupado
- Lógica: só permite selecionar assentos = número de passageiros
- Toque para alternar seleção

**Funções:**
```typescript
toggleAssento(numero: number)    // Seleciona/deseleciona assento
atualizarPassageiros(qtd: number) // Cria campos de passageiro
efetuarPagamento()                // Processa pagamento (mock)
```

#### 6.4 Seleção de Método de Pagamento
```typescript
const [pagamento, setPagamento] = useState<'referencia' | 'transferencia'>('referencia');
```

- Opção 1: Pagamento por referência
- Opção 2: Transferência bancária

#### 6.5 Processamento de Pagamento e Persistência
```typescript
const [processando, setProcessando] = useState(false);
const [pago, setPago] = useState(false);
```

- Simula processamento de 3 segundos
- Valida seleção de assentos
- Após sucesso, mostra confirmação

---

### 7. **TabLayout** (`app/(tabs)/_layout.tsx`)
**Propósito**: Configura navegação com abas na base

**Abas:**
1. **Home** (`index.tsx`)
   - Ícone: house.fill
   - Conteúdo: Login

2. **Dashboard** (`dashboard.tsx`)
   - Ícone: magnifyingglass
   - Conteúdo: Pesquisa + menu hambúrguer (Minhas viagens, Meus tickets, logout)

3. **Explore** (`explore.tsx`)
   - Ícone: paperplane.fill
   - Conteúdo: Informações educativas

**Configurações:**
- Cor ativa: Tint color do tema
- Feedback háptico ao pressionar
- Header oculto (headerShown: false)

---

### 8. **Explore** (`app/(tabs)/explore.tsx`)
**Propósito**: Ecrã educativo com exemplos de funcionalidades

**Componentes utilizados:**
- ParallaxScrollView - ScrollView com paralaxe no header
- Collapsible - Componentes expansíveis
- ThemedText/ThemedView - Componentes com tema

**Conteúdo:**
- File-based routing explanation
- Android, iOS, web support
- Image handling
- Dark mode support
- Animations

---

## Fluxo de Funcionalidades

### Fluxo 1: Pesquisa de Viagem

```
┌─────────────────────────────────────────────────────┐
│ Dashboard                                           │
│ - Utilizador preenche:                              │
│   • Origem                                          │
│   • Destino                                         │
│   • Data de ida                                     │
│   • [Opcional] Data de regresso                    │
└──────────────┬──────────────────────────────────────┘
               │ Clica em "Pesquisar"
               ▼
┌─────────────────────────────────────────────────────┐
│ Validação                                           │
│ - Verifica campos obrigatórios                      │
│ - Mostra alerta se vazio                            │
└──────────────┬──────────────────────────────────────┘
               │ Dados válidos
               ▼
┌─────────────────────────────────────────────────────┐
│ Navegação para Resultados                           │
│ router.push('/resultados', { origem, destino... }) │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ Resultados                                          │
│ - Lista de viagens filtradas                        │
│ - Cards com informações básicas                     │
│ - Expansão para mais detalhes                       │
└─────────────────────────────────────────────────────┘
```

### Fluxo 2: Reserva de Bilhete

```
┌──────────────────────────────────────┐
│ Resultados                           │
│ Clica em "Reservar" numa viagem      │
└────────────┬─────────────────────────┘
             │ router.push('/reserva', {...viagem, dataIda})
             ▼
┌──────────────────────────────────────┐
│ Reserva - Secção 1                   │
│ Resumo da viagem (read-only)         │
│ - Origem, destino, data, hora, etc.  │
└────────────┬─────────────────────────┘
             │ Utilizador scrolls down
             ▼
┌──────────────────────────────────────┐
│ Reserva - Secção 2                   │
│ Seleção de número de passageiros     │
│ (1-30)                               │
└────────────┬─────────────────────────┘
             │ Utilizador seleciona qtd
             │ Campos de passageiro gerados
             ▼
┌──────────────────────────────────────┐
│ Reserva - Secção 3                   │
│ Preencher dados de passageiros       │
│ - Nome                               │
│ - Número de bilhete                  │
└────────────┬─────────────────────────┘
             │ Todos os dados preenchidos
             ▼
┌──────────────────────────────────────┐
│ Reserva - Secção 4                   │
│ Mapa de assentos (grid 4x7-8)        │
│ - Seleciona assento por passageiro   │
│ - Limite = número de passageiros     │
└────────────┬─────────────────────────┘
             │ Assentos selecionados
             ▼
┌──────────────────────────────────────┐
│ Reserva - Secção 5                   │
│ Método de pagamento                  │
│ ☑ Referência                          │
│ ☐ Transferência                       │
└────────────┬─────────────────────────┘
             │ Seleciona método
             ▼
┌──────────────────────────────────────┐
│ Reserva - Secção 6                   │
│ Botão "Confirmar Pagamento"          │
│ - Valida assentos = passageiros      │
│ - Mostra loading (3 segundos)        │
│ - Grava reserva em AsyncStorage      │
│ - Confirmação de reserva             │
└──────────────────────────────────────┘
```

### Fluxo 3: Minhas Viagens (Cancelar / Remarcar)

```
┌──────────────────────────────────────┐
│ Dashboard                            │
│ Menu hambúrguer → "Minhas viagens"  │
└────────────┬─────────────────────────┘
             ▼
┌──────────────────────────────────────┐
│ Minhas viagens                       │
│ - Lista reservas do utilizador       │
│   (filtradas por `currentUserEmail`) │
│ - Mostra status: Ativa/Cancelada/    │
│   Remarcada                          │
└────────────┬─────────────────────────┘
             │ Ações por reserva
             ▼
┌──────────────────────────────────────┐
│ Cancelar                             │
│ - Confirma via `confirm()`           │
│ - Atualiza status para "cancelada"   │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Remarcar                             │
│ - Abre inputs de nova data e hora    │
│ - Valida preenchimento               │
│ - Atualiza reserva em AsyncStorage   │
│   com nova data/hora e status        │
│   "remarcada"                        │
└──────────────────────────────────────┘
```

### Fluxo 4: Meus Tickets (QR para embarque)

```
┌──────────────────────────────────────┐
│ Dashboard                            │
│ Menu hambúrguer → "Meus tickets"    │
└────────────┬─────────────────────────┘
             ▼
┌──────────────────────────────────────┐
│ Meus tickets                         │
│ - Carrega reservas do utilizador     │
│ - Lista em cards                     │
└────────────┬─────────────────────────┘
             │ Clica num card
             ▼
┌──────────────────────────────────────┐
│ Detalhe do ticket                    │
│ - Mostra imagem QR (`assets/images/  │
│   qr-code.jpg`)                      │
│ - Mostra código textual (ex:         │
│   "TICKET-<id>")                     │
│ - Instrução para apresentar no       │
│   momento do embarque                │
└──────────────────────────────────────┘
```

---

## Guia de Instalação e Execução

### Pré-requisitos
- **Node.js**: v18+ ou superior
- **npm**: v9+ ou superior
- **Expo CLI**: instalado globalmente (recomendado)
- **Emulador/Simulador**: Android Studio ou Xcode (opcional)

### Passos de Instalação

#### 1. Clonar Repositório
```bash
git clone https://github.com/seu-usuario/busconectaApp.git
cd busconectaApp
```

#### 2. Instalar Dependências
```bash
npm install
```

#### 3. Instalar Expo CLI (se necessário)
```bash
npm install -g expo-cli
```

### Execução da Aplicação

#### Opção A: Desenvolvimento Web
```bash
npm run web
```
- Abre a aplicação no navegador em `http://localhost:19006`
- Hot reload automático
- DevTools do React disponíveis

#### Opção B: Android
```bash
npm run android
```
- Requer Android Studio e emulador configurado
- Compila APK de debug
- Instala no emulador/dispositivo

#### Opção C: iOS
```bash
npm run ios
```
- Requer macOS e Xcode
- Compila app iOS
- Abre no simulador

#### Opção D: Expo Go (Desenvolvimento Rápido)
```bash
npm start
```
- Abre menu Expo no terminal
- Pressionar `w` para web
- Pressionar `i` para iOS (macOS)
- Pressionar `a` para Android
- Escanear QR code com Expo Go app (Android) ou câmara (iOS)

### Linting
```bash
npm run lint
```
- Verifica erros ESLint
- Segue configuração `eslint-config-expo`

### Reset do Projeto
```bash
npm run reset-project
```
- Move código existente para `app-example/`
- Cria novo diretório `app/` vazio
- Útil para começar do zero

---

## Configurações e Variáveis de Ambiente

### Arquivo `app.json`
Define configurações específicas da aplicação Expo:

```json
{
  "expo": {
    "name": "busconecta",           // Nome da aplicação
    "slug": "busconecta",            // Identificador único
    "version": "1.0.0",              // Versão da aplicação
    "orientation": "portrait",       // Orientação (portrait/landscape/default)
    "icon": "./assets/images/icon.png",
    "scheme": "busconecta",          // URI scheme para deep linking
    "userInterfaceStyle": "automatic", // Tema automático (light/dark)
    "newArchEnabled": true,          // New Architecture React Native ativada
    
    "ios": {
      "supportsTablet": true         // Suporta iPad
    },
    
    "android": {
      "adaptiveIcon": {...},         // Ícone adaptativo
      "edgeToEdgeEnabled": true      // Full screen (edge to edge)
    },
    
    "web": {
      "output": "static",            // Saída estática HTML
      "favicon": "./assets/images/favicon.png"
    },
    
    "plugins": [
      "expo-router",
      ["expo-splash-screen", {...}]
    ],
    
    "experiments": {
      "typedRoutes": true,           // Type-safe routing
      "reactCompiler": true          // React Compiler experimental
    }
  }
}
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,                 // Modo strict ativado
    "paths": {
      "@/*": ["./*"]                // Alias @ para root
    }
  }
}
```

**Path Alias:**
- `@/` aponta para raiz do projeto
- Exemplo: `@/components/button` = `components/button`

### ESLint Configuration (`eslint.config.js`)
- Segue `eslint-config-expo`
- Verifica padrões de código
- Avisa sobre anti-patterns React

---

## Dependências

### Dependências Principais (Production)

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react` | 19.1.0 | Framework UI |
| `react-native` | 0.81.5 | Desenvolvimento mobile |
| `expo` | ~54.0.30 | Plataforma de desenvolvimento |
| `expo-router` | ~6.0.21 | Roteamento baseado em ficheiros |
| `react-navigation/native` | ^7.1.8 | Navegação |
| `react-navigation/bottom-tabs` | ^7.4.0 | Abas na base |

### Dependências de Animação e Gestos

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react-native-reanimated` | ~4.1.1 | Animações GPU-aceleradas |
| `react-native-gesture-handler` | ~2.28.0 | Reconhecimento de gestos |
| `react-native-worklets` | 0.5.1 | Execução em thread separada |

### Dependências de Interface

| Pacote | Versão | Uso |
|--------|--------|-----|
| `@expo/vector-icons` | ^15.0.3 | Ícones (Material, Ionicons) |
| `expo-symbols` | ~1.0.8 | Símbolos SF |
| `expo-image` | ~3.0.11 | Componente Image otimizado |

### Dependências de Sistema

| Pacote | Versão | Uso |
|--------|--------|-----|
| `expo-status-bar` | ~3.0.9 | Controlo da barra de estado |
| `expo-haptics` | ~15.0.8 | Feedback háptico |
| `expo-linking` | ~8.0.11 | Deep linking e URLs |
| `expo-constants` | ~18.0.12 | Constantes da aplicação |
| `expo-font` | ~14.0.10 | Carregamento de fontes |
| `expo-splash-screen` | ~31.0.13 | Ecrã de splash |

### Dependências DevOps

| Pacote | Versão | Uso |
|--------|--------|-----|
| `typescript` | ~5.9.2 | Linguagem com tipos |
| `eslint` | ^9.25.0 | Linter |
| `eslint-config-expo` | ~10.0.0 | Config ESLint Expo |
| `@types/react` | ~19.1.0 | Tipos React |

### Suporte Web

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react-dom` | 19.1.0 | React para web |
| `react-native-web` | ~0.21.0 | RN para web |
| `expo-web-browser` | ~15.0.10 | Browser API |

---

## Convenções de Código

### Estrutura de Ficheiros

#### Nomenclatura
- **Componentes**: PascalCase (Ex: `Dashboard.tsx`, `SearchBar.tsx`)
- **Hooks**: camelCase com prefixo `use` (Ex: `useColorScheme.ts`, `useAuth.ts`)
- **Constantes**: UPPER_SNAKE_CASE (Ex: `TOTAL_ASSENTOS`, `API_URL`)
- **Ficheiros de configuração**: kebab-case (Ex: `eslint.config.js`)

#### Tipos e Interfaces
```typescript
// Interface para Props de componente
interface DashboardProps {
  onSearch: (origem: string, destino: string) => void;
  disabled?: boolean;
}

// Type para estado complexo
type PaymentMethod = 'referencia' | 'transferencia';

// Interface para dados de API
interface Viagem {
  id: number;
  agencia: string;
  origem: string;
  destino: string;
  hora: string;
  preco: string;
  duracao: string;
  embarque: string;
}
```

### Estilo de Código

#### Componentes Funcionais
```typescript
export default function Dashboard() {
  // Hooks no topo
  const [origem, setOrigem] = useState('');
  
  // Funções de lógica
  const handleSearch = () => {
    // Lógica
  };
  
  // Render
  return (
    <View>
      {/* JSX */}
    </View>
  );
}
```

#### Imports
```typescript
// Order: React, RN, third-party, local
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CustomButton } from '@/components/ui/custom-button';
```

#### StyleSheet
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

### TypeScript Best Practices
- ✅ `strict: true` ativado
- ✅ Usar tipos explícitos para funções públicas
- ✅ Evitar `any`
- ✅ Usar Union Types (`'light' | 'dark'`)
- ✅ Interfaces para Props
- ✅ Types para dados complexos

---

## Plano de Desenvolvimento Futuro

### Fase 1: Backend Integration (Sprint 1-2)
- [ ] Implementar API REST para viagens
- [ ] Autenticação de utilizadores (JWT)
- [ ] Integração com base de dados
- [ ] Endpoints:
  - `GET /viagens?origem=X&destino=Y&data=Z`
  - `POST /reservas`
  - `GET /reservas/:id`
  - `POST /pagamentos`

### Fase 2: Autenticação e Conta de Utilizador (Sprint 2-3)
- [ ] Sistema de login/registo
- [ ] Perfil de utilizador
- [ ] Histórico de reservas
- [ ] Notificações por email
- [ ] Recuperação de senha

### Fase 3: Sistema de Pagamento (Sprint 3-4)
- [ ] Integração com gateway de pagamento (Stripe, PayPal)
- [ ] Pagamento por referência (integração com banco)
- [ ] Validação de dados bancários
- [ ] Recibos e confirmações

### Fase 4: Recursos Avançados (Sprint 4+)
- [ ] Filtros avançados (preço, horário, duração)
- [ ] Classificações e reviews de agências
- [ ] Chat em tempo real com agências
- [ ] Notificações push para confirmações
- [ ] Integração de mapa (Google Maps)
- [ ] Compartilhar viagens (WhatsApp, SMS)
- [ ] Descuentos e cupons
- [ ] Sistema de pontos/fidelização

### Fase 5: Otimizações e Deployment (Sprint 5+)
- [ ] Testes unitários (Jest)
- [ ] Testes de integração (Detox)
- [ ] Performance optimization
- [ ] Segurança (HTTPS, validação de entrada)
- [ ] Analytics e telemetria
- [ ] Publicação em App Store e Play Store
- [ ] Suporte a múltiplos idiomas (Português, Inglês)

### Melhorias Técnicas
- [ ] Migrar para Zustand/Redux para estado global
- [ ] Implementar error boundary
- [ ] Logging e crash reporting
- [ ] Offline-first com SQLite
- [ ] Caching de dados
- [ ] WebSockets para notificações em tempo real

---

## Problemas Conhecidos e Limitações

### Limitações Atuais
1. **Dados Mock**: As viagens continuam hardcoded, sem integração de API
2. **Autenticação Local**: Login/registo são apenas locais com AsyncStorage (sem backend, JWT ou recuperação de senha)
3. **Pagamentos Simulados**: Processamento de pagamento continua simulado (3s), sem gateway real
4. **Tickets QR Genéricos**: O QR apresentado é uma imagem estática (`qr-code.jpg`) e um código textual simples, não integrado com sistema externo
5. **Sem Notificações**: Sem push notifications ou email

### Padrões de Erro Conhecidos
- Validação mínima de inputs
- Sem tratamento de erros de rede
- Sem timeouts para requisições

---

## Suporte e Recursos

### Documentação Oficial
- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs

### Comunidade
- Fórum Expo: https://forums.expo.dev
- Stack Overflow: `expo` tag
- Discord Expo: https://chat.expo.dev

### Ferramentas Recomendadas
- **VS Code**: Editor recomendado
- **Expo DevTools**: Debugging
- **React DevTools**: Browser extension
- **React Native Debugger**: Aplicação standalone

---

## Conclusão

**BusConecta** é uma aplicação modern e escalável para reserva de viagens de autocarro. Com base em Expo e React Native, oferece suporte cross-platform (iOS, Android, Web) com foco em experiência do utilizador.

O projeto segue best practices de desenvolvimento, usa TypeScript para segurança de tipos, e está organizado para fácil manutenção e expansão futuro.

**Data de Documentação**: Fevereiro 2026
**Versão da Aplicação**: 1.0.0
**Status**: Desenvolvimento Ativo

---

*Documentação gerada automaticamente. Para atualizações ou correções, contribuir ao repositório.*
