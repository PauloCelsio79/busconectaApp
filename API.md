# BusConecta API — Documentação REST

> Visão completa do sistema (requisitos, casos de uso, arquitectura, DER/UML): **[DOCUMENTACAO_GERAL.md](./DOCUMENTACAO_GERAL.md)**

**Base URL:** `http://localhost:8000/api/v1`  
**Autenticação:** Laravel Sanctum (Bearer Token)  
**Formato:** JSON

### Perfis (`users.tipo`)

| Tipo | Prefixo API | Uso |
|------|-------------|-----|
| `admin` | `/admin/*` | Painel BusConnecta Admin |
| `empresa` | `/empresa/*` | Gestão da transportadora |
| `operador` | `/operador/*` | App de embarque (QR, validação, ocorrências) |
| `passageiro` | `/app/*` | App BusConecta (reservas) |

Relação **Empresa 1 → N Operadores**: a empresa cria operadores e atribui-lhes uma viagem (`viagem_atribuida_id`).

---

## Resposta padrão

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

Erros:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": null
}
```

---

## Autenticação

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/auth/login` | Não | Login (admin, empresa, operador, passageiro) |
| POST | `/auth/register` | Não | Registo de passageiro (app) |
| POST | `/auth/logout` | Sim | Terminar sessão |
| GET | `/auth/me` | Sim | Utilizador autenticado (inclui `empresa`, `passageiro` ou `operador` conforme o tipo) |
| POST | `/auth/alterar-senha` | Sim | Alterar senha (obrigatório no primeiro acesso da empresa) |

### Primeiro acesso da empresa

Quando o **admin** pré-cadastra uma empresa (`POST /admin/empresas`), a API:

1. Gera uma **senha temporária tipo token** (ex.: `BC-K7M2X9P4Q1W8N5R3T6Y0`).
2. Define `must_change_password: true` na conta.
3. Devolve as credenciais **uma única vez** em `credenciais_temporarias` (para o modal «Credenciais temporárias» no admin).

**Resposta da criação:**

```json
{
  "success": true,
  "message": "Empresa pré-cadastrada. Guarde as credenciais temporárias e envie ao gestor.",
  "data": {
    "empresa": { "id": 1, "nome_empresa": "Elena Express Lda" },
    "credenciais_temporarias": {
      "email": "elenaexpress@gmail.com",
      "password": "BC-K7M2X9P4Q1W8N5R3T6Y0"
    }
  }
}
```

**Login da empresa** — incluir flag para o front mostrar o modal de alteração de senha:

```json
{
  "success": true,
  "data": {
    "token": "...",
    "token_type": "Bearer",
    "requer_alteracao_senha": true,
    "user": {
      "tipo": "empresa",
      "must_change_password": true,
      "requer_alteracao_senha": true
    }
  }
}
```

Enquanto `requer_alteracao_senha` for `true`, todas as rotas `/empresa/*` respondem **403** com `errors.must_change_password: true`. Apenas `/auth/me`, `/auth/logout` e `/auth/alterar-senha` permanecem acessíveis.

### Alterar senha (`POST /auth/alterar-senha`)

```http
POST /api/v1/auth/alterar-senha
Authorization: Bearer {token}
Content-Type: application/json

{
  "senha_actual": "BC-K7M2X9P4Q1W8N5R3T6Y0",
  "password": "MinhaNovaSenha123",
  "password_confirmation": "MinhaNovaSenha123"
}
```

| Campo | Regras |
|-------|--------|
| `senha_actual` | Senha temporária ou senha actual |
| `password` | Mínimo 8 caracteres, confirmada |
| `password_confirmation` | Igual a `password` |

Após sucesso: `must_change_password` passa a `false` e o painel empresa fica disponível.

**Integração frontend (empresa):**

1. Após login, se `data.requer_alteracao_senha === true`, abrir modal bloqueante (como «Credenciais temporárias», mas com campos de nova senha).
2. Enviar `POST /auth/alterar-senha` com a senha temporária em `senha_actual`.
3. Em sucesso, fechar modal e redireccionar para `/empresa`.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@busconecta.ao",
  "password": "password"
}
```

### Registo (passageiro)

```http
POST /api/v1/auth/register

{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "password": "secret123",
  "password_confirmation": "secret123",
  "telefone": "+244900000099",
  "bi": "000111222LA033"
}
```

**Header autenticado:** `Authorization: Bearer {token}`

### Resposta de login / `me` (operador)

Quando `tipo` é `operador`, o objeto `user` inclui `operador` com empresa e viagem atribuída (se existir):

```json
{
  "id": 10,
  "nome": "João Operador",
  "email": "joao@huamboexpress.ao",
  "tipo": "operador",
  "operador": {
    "id": 1,
    "ativo": true,
    "viagem_atribuida_id": 5,
    "empresa": { "id": 1, "nome": "Huambo Express" },
    "viagem": { "id": 5, "data_partida": "2026-06-10", "hora_partida": "08:00" }
  }
}
```

---

## App Operador (role `operador`)

Endpoints para validação de bilhetes, embarque e registo de ocorrências na viagem atribuída.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/operador/viagem` | Consultar viagem atribuída |
| GET | `/operador/passageiros` | Lista de passageiros (bilhetes pagos da viagem) |
| POST | `/operador/bilhetes/validar` | Validar bilhete (leitura QR / código) |
| POST | `/operador/bilhetes/confirmar-embarque` | Confirmar embarque após validação |
| GET | `/operador/ocorrencias` | Ocorrências registadas na viagem actual |
| POST | `/operador/ocorrencias` | Registar ocorrência |

### Código do bilhete (QR)

Formato recomendado para o QR impresso ou no ecrã do passageiro:

| Caso | Formato | Exemplo |
|------|---------|---------|
| Um lugar na reserva | `codigo_reserva` | `BC-A1B2C3D4` |
| Vários lugares | `codigo_reserva:reserva_assento_id` | `BC-A1B2C3D4:12` |

O campo `codigo` nos POST abaixo aceita qualquer um destes formatos (o conteúdo lido do QR).

### Validar bilhete

```http
POST /api/v1/operador/bilhetes/validar
Authorization: Bearer {token}
Content-Type: application/json

{
  "codigo": "BC-A1B2C3D4:12",
  "reserva_assento_id": 12
}
```

`reserva_assento_id` é opcional quando o `codigo` já inclui `:id` ou quando a reserva tem um único lugar.

**Resposta — embarque autorizado:**

```json
{
  "success": true,
  "data": {
    "autorizado": true,
    "mensagem": "Embarque autorizado",
    "verificacoes": {
      "bilhete_existe": true,
      "pagamento_confirmado": true,
      "viagem_correta": true,
      "bilhete_nao_utilizado": true,
      "passageiro_na_viagem": true
    },
    "bilhete": {
      "codigo_bilhete": "BC-A1B2C3D4:12",
      "codigo_reserva": "BC-A1B2C3D4",
      "reserva_assento_id": 12,
      "assento_numero": 5,
      "nome_passageiro": "Maria Silva"
    }
  }
}
```

**Resposta — bilhete inválido** (`autorizado: false`, `mensagem: "Bilhete inválido"`). Cada chave em `verificacoes` indica o que falhou.

| Verificação | Critério |
|-------------|----------|
| `bilhete_existe` | Reserva / lugar encontrado pelo código |
| `pagamento_confirmado` | Reserva `confirmada` e pagamento `pago` |
| `viagem_correta` | Bilhete pertence à `viagem_atribuida_id` do operador |
| `bilhete_nao_utilizado` | Ainda não existe registo em `embarques` para esse lugar |
| `passageiro_na_viagem` | Reserva associada à viagem da empresa do operador |

### Confirmar embarque

Repete as mesmas validações; em caso de sucesso grava o embarque (bilhete passa a utilizado).

```http
POST /api/v1/operador/bilhetes/confirmar-embarque
Authorization: Bearer {token}

{
  "codigo": "BC-A1B2C3D4:12"
}
```

Erro **422** se o bilhete for inválido (corpo inclui `errors.verificacoes`).

### Lista de passageiros

```http
GET /api/v1/operador/passageiros
Authorization: Bearer {token}
```

Resposta (resumo):

```json
{
  "success": true,
  "data": {
    "viagem_id": 5,
    "total": 24,
    "embarcados": 10,
    "items": [
      {
        "reserva_id": 3,
        "codigo_reserva": "BC-A1B2C3D4",
        "codigo_bilhete": "BC-A1B2C3D4:12",
        "reserva_assento_id": 12,
        "assento_numero": 5,
        "nome": "Maria Silva",
        "bi": "000111222LA033",
        "embarcado": false,
        "embarcado_em": null
      }
    ]
  }
}
```

### Registar ocorrência

```http
POST /api/v1/operador/ocorrencias
Authorization: Bearer {token}

{
  "tipo": "atraso",
  "descricao": "Partida atrasada 30 minutos por trânsito."
}
```

Tipos: `atraso`, `incidente`, `documento`, `outro`.

---

## App Mobile (passageiro)

### Pesquisa de viagens (público)

```http
GET /api/v1/viagens/pesquisar?origem=Lubango&destino=Luanda&data=2026-05-28
```

### Detalhe e assentos (público)

```http
GET /api/v1/viagens/{id}
GET /api/v1/viagens/{id}/assentos
```

### Reservas (auth + role `passageiro`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/app/reservas` | Minhas reservas |
| POST | `/app/reservas` | Criar reserva |
| POST | `/app/reservas/{id}/confirmar-pagamento` | Confirmar pagamento |
| POST | `/app/reservas/{id}/cancelar` | Cancelar reserva |

```http
POST /api/v1/app/reservas
Authorization: Bearer {token}

{
  "viagem_id": 1,
  "assento_ids": [1, 2],
  "metodo_pagamento": "multicaixa",
  "referencia_pagamento": "REF-12345"
}
```

---

## Painel Admin (role `admin`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/dashboard` | KPIs globais |
| GET | `/admin/empresas` | Listar empresas |
| POST | `/admin/empresas` | Pré-cadastrar empresa |
| GET | `/admin/empresas/{id}` | Detalhe |
| POST | `/admin/empresas/{id}/aprovar` | Aprovar |
| POST | `/admin/empresas/{id}/rejeitar` | Rejeitar |
| POST | `/admin/empresas/{id}/suspender` | Suspender |
| GET | `/admin/usuarios` | Listar utilizadores |
| POST | `/admin/usuarios` | Criar utilizador |
| PUT/PATCH | `/admin/usuarios/{id}` | Actualizar |
| GET | `/admin/viagens` | Viagens (rede global) |
| GET | `/admin/auditorias` | Logs de auditoria |
| GET | `/admin/backups` | Listar backups gerados |
| POST | `/admin/backups` | Gerar novo backup JSON |
| GET | `/admin/backups/{fileName}` | Download do backup gerado |

### Backup do sistema

O endpoint `POST /api/v1/admin/backups` gera um ficheiro JSON contendo os dados principais do sistema, incluindo utilizadores, empresas, operadores, passageiros, rotas, autocarros, viagens, reservas, pagamentos, embarques, ocorrências e auditorias. O ficheiro é guardado em armazenamento local em `storage/app/backups` e pode ser descarregado via `GET /api/v1/admin/backups/{fileName}`.

---

## Painel Empresa (role `empresa`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresa/dashboard` | KPIs da empresa |
| GET/PATCH | `/empresa/perfil` | Perfil |
| POST | `/empresa/perfil/documentos` | Submeter documentação (multipart) |
| CRUD | `/empresa/autocarros` | Frota |
| CRUD | `/empresa/rotas` | Rotas |
| PUT | `/empresa/rotas/{id}/paragens` | Sincronizar paragens |
| GET/POST/PATCH | `/empresa/viagens` | Viagens |
| GET | `/empresa/reservas` | Reservas da empresa |
| GET | `/empresa/operadores` | Listar operadores da empresa |
| POST | `/empresa/operadores` | Criar operador (credenciais de login) |
| GET | `/empresa/operadores/{id}` | Detalhe do operador |
| PATCH | `/empresa/operadores/{id}` | Actualizar nome, telefone, password, `ativo` |
| POST | `/empresa/operadores/{id}/atribuir-viagem` | Atribuir ou remover viagem |

### Criar operador (`POST /empresa/operadores`)

A empresa deve estar **aprovada** (`estado: aprovada`).

```http
POST /api/v1/empresa/operadores
Authorization: Bearer {token}

{
  "nome": "João",
  "email": "joao@huamboexpress.ao",
  "telefone": "+244900000010",
  "password": "secret123"
}
```

Cria um `user` com `tipo: operador` e o registo em `operadores` ligado à empresa autenticada.

### Atribuir viagem ao operador

```http
POST /api/v1/empresa/operadores/1/atribuir-viagem
Authorization: Bearer {token}

{ "viagem_id": 5 }
```

Para remover a atribuição: `{ "viagem_id": null }`.

A viagem tem de pertencer à mesma empresa; caso contrário **422**.

### Agendar viagem (`POST /empresa/viagens`)

Envia apenas **partida**; `data_chegada` e `hora_chegada` são calculadas pela API com base em `rotas.tempo_estimado` (minutos).

```http
POST /api/v1/empresa/viagens
Authorization: Bearer {token}

{
  "rota_id": 1,
  "autocarro_id": 1,
  "data_partida": "2026-06-01",
  "hora_partida": "08:00",
  "preco": 11500
}
```

Resposta inclui chegada calculada (ex.: partida 08:00 + 600 min → chegada 18:00 do mesmo dia, ou dia seguinte se ultrapassar meia-noite).

A rota deve ter `tempo_estimado` definido; caso contrário a API devolve erro 422.

---

## Contas de demonstração

| Perfil | Email | Password |
|--------|-------|----------|
| Admin | `admin@busconecta.ao` | `password` |
| Empresa | `empresa@busconecta.ao` | `password` |
| Passageiro | `passageiro@busconecta.ao` | `password` |

Operadores não vêm no seed por defeito: criar via `POST /empresa/operadores`, atribuir viagem e fazer login com o email definido.

## Modelo de dados (operador)

| Tabela | Descrição |
|--------|-----------|
| `operadores` | `user_id`, `empresa_id`, `viagem_atribuida_id`, `ativo` |
| `embarques` | Um registo por lugar (`reserva_assento_id`) — bilhete utilizado |
| `ocorrencias` | `operador_id`, `viagem_id`, `tipo`, `descricao` |

---

## Instalação

```bash
composer install
cp .env.example .env
php artisan key:generate

# PostgreSQL (produção)
# Configurar DB_* no .env

# SQLite (desenvolvimento rápido)
# DB_CONNECTION=sqlite

php artisan migrate --seed
php artisan storage:link
php artisan serve
```

---

## Integração com frontends

| Cliente | Variável sugerida | Exemplo |
|---------|-------------------|---------|
| App React Native (passageiro) | `EXPO_PUBLIC_API_URL` | `http://192.168.x.x:8000/api/v1` |
| App operador (embarque / QR) | `EXPO_PUBLIC_API_URL` | `http://192.168.x.x:8000/api/v1` |
| Admin TanStack | `VITE_API_URL` | `http://localhost:8000/api/v1` |

Substituir dados mock por chamadas `fetch` / React Query com header `Authorization: Bearer {token}`.
