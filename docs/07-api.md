# 07 — API REST

Contrato normativo: [api/openapi.yaml](api/openapi.yaml), OpenAPI 3.0.3. Este texto explica as convenções e as decisões. O detalhe de cada campo, exemplo e código HTTP está no YAML.

A API ainda não está implementada. O prefixo previsto é `/api/v1` ([RNF10](03-requisitos-nao-funcionais.md)).

## Estilo

- Recursos no plural, em inglês, como no contrato: `/patients`, `/prescriptions`.
- JSON em UTF-8.
- Identificadores de recurso são UUID.
- Datas civis usam `format: date` (`AAAA-MM-DD`), sem horário. Instantâneos de auditoria usam `format: date-time`.
- A data corrente não vem do navegador. O servidor calcula o dia civil em `America/Sao_Paulo`. Não há parâmetro para o cliente escolher “hoje”, para que a classificação não seja alterada pela estação de quem consulta.
- Verbos HTTP: `GET` lê, `POST` cria, `PATCH` altera parcialmente. Não há `PUT` nem exclusão física nesta versão.
- `operationId` único em cada operação, para geração futura de cliente.

## Autenticação

`POST /auth/login` é público. As demais operações exigem `Authorization: Bearer` com JWT de acesso ([DEC-01](11-decisoes-e-pendencias.md)).

Resposta de login bem-sucedido: `accessToken`, `tokenType` (`Bearer`) e `expiresIn` em segundos. A proposta pendente de `expiresIn` é `3600`. O corpo não devolve a senha nem o hash. `GET /auth/me` devolve o usuário ativo, os papéis e os códigos de permissão.

Credencial inválida, usuário desconhecido e usuário inativo respondem `401` com a mensagem “Credenciais inválidas.” Token ausente, inválido ou expirado responde `401` com “Autenticação necessária.” Usuário autenticado sem permissão responde `403` com “Você não tem permissão para esta operação.” e sem o recurso pedido.

O logout da primeira versão é local: o cliente descarta o token. Não há endpoint de logout enquanto não existir revogação no servidor.

## Códigos HTTP

| Código | Uso |
| --- | --- |
| 200 | Leitura ou atualização concluída |
| 201 | Paciente, receita ou acompanhamento criado |
| 400 | Validação, CPF inválido, data impossível ou campo não aceito |
| 401 | Credencial ausente, inválida, expirada ou usuário inativo no login |
| 403 | Autenticado sem permissão |
| 404 | Paciente, receita ou CEP sem correspondência, conforme a operação |
| 409 | CPF já cadastrado ou troca de nome sem confirmação |
| 500 | Falha inesperada, mensagem genérica |
| 503 | Serviço externo de CEP indisponível. Não se usa para erro interno do Renova |

O corpo de erro contém `code` e `message`. Validação de campo inclui `details`, com `field` e `message`.

## Paginação, filtro e ordenação

Listas usam `page` (padrão 1), `pageSize` (padrão 20, máximo 100) e `sort`. A resposta traz `data`, `page`, `pageSize` e `total`.

`sort` aceita o nome do campo e o prefixo `-` para ordem decrescente. Valores fora da lista da operação respondem `400`.

Filtro de prazo em receitas, parâmetro `statusFilter`:

| Valor | Efeito |
| --- | --- |
| `vencida` | Faixa `VENCIDA` |
| `proxima` | Faixas `PROXIMA_5` e `PROXIMA_15` |
| `dentro_do_prazo` | Faixa `DENTRO_DO_PRAZO`, acima de 15 dias na proposta atual |
| `pendente` | `PENDENTE_INFORMACAO` |

O parâmetro `alertBand` seleciona uma faixa específica, para os cartões do dashboard. Os limites numéricos são os da [RN11](04-regras-de-negocio.md) e continuam pendentes ([DEC-03](11-decisoes-e-pendencias.md)).

`GET /patients?cpf=` faz busca exata depois de normalizar o CPF. CPF inválido nesse filtro é `400`. CPF válido sem cadastro é `200` com lista vazia.

## Situação calculada

A receita devolvida inclui:

- `situation`: `VENCIDA`, `DENTRO_DO_PRAZO` ou `PENDENTE_INFORMACAO`, conforme [RN09](04-regras-de-negocio.md) e [RN10](04-regras-de-negocio.md);
- `alertBand`: faixa da [RN11](04-regras-de-negocio.md);
- `daysUntilExpiry`: inteiro, negativo se a data já passou, nulo se não houver data;
- `visualEmphasis`: verdadeiro quando `situation` é `VENCIDA`;
- `referenceDate`: o dia civil usado no cálculo;
- `lifecycleStatus`: `ATIVA` ou `CANCELADA`, este sim persistido ([DEC-08](11-decisoes-e-pendencias.md)).

Indicadores, alertas e lista prioritária consideram apenas `lifecycleStatus = ATIVA`.

## Operações

| Método e caminho | operationId | Permissão | Função |
| --- | --- | --- | --- |
| `POST /auth/login` | `login` | pública | Autenticar |
| `GET /auth/me` | `getAuthenticatedUser` | usuário ativo | Identidade e permissões |
| `POST /patients` | `createPatient` | `patients:create` | Cadastrar paciente |
| `GET /patients` | `listPatients` | `patients:read` | Buscar pacientes |
| `GET /patients/priority` | `listPriorityPatients` | `dashboard:read` | Pacientes prioritários |
| `GET /patients/{id}` | `getPatient` | `patients:read` | Detalhe do paciente |
| `PATCH /patients/{id}` | `updatePatient` | `patients:update` | Atualizar ficha |
| `GET /patients/{id}/follow-ups` | `listPatientFollowUps` | `followups:read` | Histórico |
| `POST /patients/{id}/follow-ups` | `createPatientFollowUp` | `followups:create` | Registrar providência |
| `POST /prescriptions` | `createPrescription` | `prescriptions:create` | Cadastrar receita |
| `GET /prescriptions` | `listPrescriptions` | `prescriptions:read` | Consultar receitas |
| `GET /prescriptions/alerts` | `listPrescriptionAlerts` | `dashboard:read` | Alertas de vencimento |
| `GET /prescriptions/{id}` | `getPrescription` | `prescriptions:read` | Detalhe da receita |
| `PATCH /prescriptions/{id}` | `updatePrescription` | `prescriptions:update`; cancelar exige também `prescriptions:cancel` | Alteração permitida |
| `GET /dashboard/summary` | `getDashboardSummary` | `dashboard:read` | Indicadores |
| `GET /addresses/cep/{cep}` | `lookupCep` | `patients:read` | Consulta opcional de CEP |

`POST /patients/{id}/follow-ups` não estava na lista mínima inicial. Ele existe porque [RN14](04-regras-de-negocio.md) e a prioridade P1 pedem o registro da providência; sem escrita, a consulta do histórico não tem origem no sistema. `GET /addresses/cep/{cep}` existe para a [US02](02-requisitos-funcionais.md) tratar a falha externa no servidor, enviando só o CEP.

Na implementação NestJS, registrar `priority` e `alerts` antes das rotas com `{id}`.

Não há endpoints de exclusão, de gestão completa de papéis, de WhatsApp, de impressão nem de itens de medicamento. Esses assuntos não têm regra fechada.

## CPF na interface HTTP

A entrada aceita 11 dígitos ou a máscara `000.000.000-00`. A saída usa a máscara. O padrão regular do contrato só descreve o formato. O servidor ainda executa a [RN02](04-regras-de-negocio.md). Exemplo fictício usado nos payloads: `529.982.247-25`.

## Decisões de contrato

### 1. CPF já cadastrado

`GET /patients?cpf=` localiza e devolve o paciente em `200`. `POST /patients` com o mesmo CPF responde `409` e `existingPatientId`, sem alterar o nome. A tela usa o identificador para carregar os dados. Detalhe em [DEC-04](11-decisoes-e-pendencias.md) e [RN01](04-regras-de-negocio.md).

### 2. Paciente não encontrado e CPF inválido

CPF que não passa na RN02: `400` e `CPF_INVALID`, tanto no `POST` quanto no filtro. Identificador desconhecido em `GET /patients/{id}`: `404` e `PATIENT_NOT_FOUND`. CPF válido e ausente na busca: `200` e lista vazia. São três resultados diferentes.

### 3. Atualização do nome

`PATCH /patients/{id}` com nome diferente e sem `confirmNameChange: true` responde `409` e `NAME_CHANGE_CONFIRMATION_REQUIRED`, com `currentName` e `informedName`. Com a confirmação, responde `200`, grava o nome e o histórico. [RN04](04-regras-de-negocio.md).

### 4. Status calculado

Não há campo persistido de situação de prazo. A resposta traz `situation` e `alertBand` calculados, mais `referenceDate`. [DEC-02](11-decisoes-e-pendencias.md).

### 5. Filtros de vencimento

`statusFilter` cobre vencida, próxima, dentro do prazo e pendente. `alertBand` distingue `PROXIMA_5` e `PROXIMA_15`. Receita cancelada fica de fora desses filtros operacionais.

### 6. Paginação e ordenação

`page`, `pageSize` e `sort`, com teto de 100 itens. Ordenação padrão de receitas: `-createdAt`. Ordenação padrão da lista prioritária: `nearestExpiryOn` crescente. [DEC-09](11-decisoes-e-pendencias.md).

### 7. Cancelamento

`PATCH /prescriptions/{id}` aceita `expiresOn`, `notes` e `lifecycleStatus`. Não aceita trocar `patientId`. Passar a `CANCELADA` exige `prescriptions:cancel`. Quem possui essa permissão está pendente ([DEC-08](11-decisoes-e-pendencias.md)). O prazo continua sendo calculado; o ciclo de vida é o estado gravado.

### 8. Autenticado sem permissão

`403` e mensagem estável, sem ficha, receita ou indício de que o UUID existe. A auditoria grava `ACCESS_DENIED`.

### 9. Sessão

JWT Bearer de curta duração, proposta de 60 minutos, validado no servidor. Usuário inativo é recusado no login e nas requisições seguintes. Sem refresh token e sem revogação antecipada nesta versão ([DEC-01](11-decisoes-e-pendencias.md)).

### 10. Falha na consulta de CEP

`GET /addresses/cep/{cep}` pode responder `200` com logradouro, bairro, cidade e UF; `400` se o CEP não tiver oito dígitos; `404` se o provedor não encontrar o CEP; `503` se o provedor não responder. Nenhum desses resultados grava o paciente. O `PATCH` seguinte aceita o endereço digitado, inclusive diferente do retorno. Provedor recomendado e ainda não definitivo: ViaCEP ([DEC-06](11-decisoes-e-pendencias.md)).

## Exemplos

Os exemplos do OpenAPI usam a data de referência `2026-10-18` e pessoas fictícias. Eles não devem ser copiados de cadastros reais.
