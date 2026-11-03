# 04 — Regras de negócio

As regras RN01 a RN15 têm identificador estável. Quando a regra depende de uma confirmação da equipe, a situação registra isso e aponta a decisão em [11-decisoes-e-pendencias.md](11-decisoes-e-pendencias.md).

A data corrente, usada em mais de uma regra, é o dia civil no fuso `America/Sao_Paulo` no instante da operação, calculado no servidor. Exemplo: às 22:30 de 18 de outubro de 2026 em São Paulo, a data corrente é `2026-10-18`, ainda que o relógio UTC já esteja em 19 de outubro.

## RN01 — Unicidade do CPF do paciente

**Situação:** definida.

**Descrição:** Cada CPF válido identifica no máximo um paciente.

**Condição:** Tentativa de gravar um paciente com um CPF já associado a outro registro.

**Resultado esperado:** O banco recusa o segundo vínculo. A API responde `409`, com o código `CPF_ALREADY_EXISTS` e o identificador do paciente já existente. O nome e os demais dados do paciente existente permanecem como estavam.

**Exceções:** CPF inválido não chega a ser comparado como duplicidade; a rejeição ocorre antes, pela RN02, com `400`.

**Histórias:** [US01](02-requisitos-funcionais.md).

**Casos de teste:** CT-01, CT-04.

## RN02 — Validação do CPF

**Situação:** definida.

**Descrição:** O CPF é aceito somente com 11 dígitos, dígitos verificadores corretos e sem a sequência de todos os dígitos iguais.

**Condição:** Entrada de CPF no cadastro, na alteração ou na busca exata.

**Resultado esperado:**

1. Remover máscara, conservando apenas dígitos.
2. Exigir exatamente 11 dígitos.
3. Rejeitar sequências em que os onze dígitos são iguais, como `111.111.111-11`.
4. Calcular os dois dígitos verificadores pelo módulo 11.
5. Aceitar o CPF somente se os dígitos informados coincidirem com o cálculo.

A formatação de exibição é `000.000.000-00`. A persistência recomendada guarda os 11 dígitos. A expressão regular da máscara não é a validação.

**Exceções:** Campo vazio no cadastro é erro de obrigatoriedade (`400`), não erro de dígito. Busca por nome não exige CPF.

**Histórias:** [US01](02-requisitos-funcionais.md).

**Casos de teste:** CT-01, CT-02, CT-03, CT-35.

## RN03 — Localização do paciente existente

**Situação:** definida.

**Descrição:** Informar um CPF já cadastrado localiza o paciente e carrega seus dados, em vez de abrir um segundo cadastro.

**Condição:** O profissional informa um CPF válido que já pertence a um paciente.

**Resultado esperado:** `GET /patients?cpf=` devolve esse paciente. A interface preenche o formulário com os dados armazenados. `POST /patients` com o mesmo CPF não cria outro registro e não altera o nome; responde o conflito da RN01 para o cliente carregar o registro existente.

**Exceções:**

- CPF inválido: `400`, código `CPF_INVALID`. Não se informa se algum paciente usaria aquele número.
- Consulta `GET /patients/{id}` com identificador desconhecido: `404`, código `PATIENT_NOT_FOUND`.
- Busca por CPF válido ainda não cadastrado: lista vazia e HTTP `200`.

**Histórias:** [US01](02-requisitos-funcionais.md), [US04](02-requisitos-funcionais.md).

**Casos de teste:** CT-04, CT-16, CT-17.

## RN04 — Confirmação e histórico de alteração de nome

**Situação:** definida.

**Descrição:** Nome diferente do armazenado só substitui o anterior depois de confirmação explícita. A troca fica no histórico.

**Condição:** Atualização em que o nome informado, após trim e colapso de espaços internos repetidos, difere do nome armazenado na comparação sem diferenciar maiúsculas de minúsculas.

**Resultado esperado:**

- Sem `confirmNameChange: true`, a API responde `409`, código `NAME_CHANGE_CONFIRMATION_REQUIRED`, e devolve o nome atual e o nome informado. Nada é alterado.
- Com `confirmNameChange: true`, o nome é atualizado e surge um registro em `PatientNameHistory` com o nome anterior, o nome novo, o instante e o usuário autor.
- Nome igual ao armazenado, ignorando maiúsculas, não gera histórico e não exige confirmação.

**Exceções:** Nome vazio é `400`. A confirmação não dispensa a permissão `patients:update`.

**Histórias:** [US01](02-requisitos-funcionais.md).

**Casos de teste:** CT-05, CT-06.

## RN05 — Cálculo da idade

**Situação:** definida.

**Descrição:** A idade exibida é a idade em anos completos na data corrente. Ela não é armazenada.

**Condição:** O paciente possui `birthDate` válida e anterior ou igual à data corrente.

**Resultado esperado:** A resposta inclui `age.years` com os anos completos e `age.status` igual a `CALCULADA`. Se o aniversário daquele ano ainda não ocorreu, o cálculo subtrai um ano.

**Exceções:**

- Sem data de nascimento: `age.years` nulo e `age.status` igual a `NAO_INFORMADA`. A interface mostra que a data não foi informada.
- Data de nascimento posterior à data corrente: `400`, código `VALIDATION_ERROR`. A data não é gravada.

**Histórias:** [US02](02-requisitos-funcionais.md).

**Casos de teste:** CT-07, CT-22.

## RN06 — Preenchimento e correção de endereço

**Situação:** definida quanto ao preenchimento manual e à possibilidade de correção. O provedor externo está pendente ([DEC-06](11-decisoes-e-pendencias.md)).

**Descrição:** O endereço pode ser informado manualmente. Quando o profissional informa um CEP de oito dígitos, o sistema pode consultar um serviço externo e preencher logradouro, bairro, cidade e UF. Qualquer campo retornado permanece editável.

**Condição:** CEP com oito dígitos informado na ficha, com o adaptador de CEP habilitado.

**Resultado esperado:**

- Consulta bem-sucedida: a interface recebe os campos e o profissional pode corrigi-los antes de salvar. O valor salvo é o que foi confirmado no formulário, não uma nova consulta silenciosa no `PATCH`.
- CEP com formato inválido: `400` na consulta ao adaptador. O profissional pode corrigir o CEP ou seguir sem consulta.
- Serviço indisponível, tempo esgotado ou CEP sem correspondência: a consulta falha com código próprio (`CEP_LOOKUP_UNAVAILABLE` ou `CEP_NOT_FOUND`). O cadastro do paciente continua possível com endereço manual.
- A falha externa não é apresentada como erro interno do Renova.

**Exceções:** A primeira sprint pode demonstrar o fluxo com o adaptador desligado, desde que o preenchimento manual exista. A busca automática é P1.

**Histórias:** [US02](02-requisitos-funcionais.md).

**Casos de teste:** CT-08, CT-09, CT-43.

## RN07 — Associação entre receita e paciente

**Situação:** definida.

**Descrição:** Toda receita pertence a exatamente um paciente já cadastrado. Um paciente pode ter várias receitas.

**Condição:** Criação de receita.

**Resultado esperado:** `patientId` obrigatório e existente. A receita gravada referencia esse paciente. A consulta da receita devolve a identificação do paciente. A consulta por paciente devolve somente as receitas daquele vínculo.

**Exceções:**

- Paciente inexistente: `404`, código `PATIENT_NOT_FOUND`. Nenhuma receita é criada.
- Alteração do paciente de uma receita já gravada não faz parte da primeira versão. O `PATCH` que enviar outro `patientId` responde `400`.

**Histórias:** [US04](02-requisitos-funcionais.md), [US05](02-requisitos-funcionais.md).

**Casos de teste:** CT-10, CT-17, CT-31.

## RN08 — Validação de datas

**Situação:** definida para datas civis. Não há regra clínica de prazo máximo ou mínimo de validade.

**Descrição:** Datas de nascimento, vencimento e acompanhamento são datas civis, sem horário, no formato `AAAA-MM-DD`.

**Condição:** Uma data é informada em cadastro ou atualização.

**Resultado esperado:**

- O valor precisa ser uma data de calendário real.
- Data de nascimento não pode ser posterior à data corrente.
- Data do acompanhamento não pode ser posterior à data corrente.
- Data de vencimento pode ser passada, presente ou futura. Passada é um dado válido e será classificada pela RN09.
- Ausência da data de vencimento é permitida e aciona a RN10.

**Exceções:** Não se rejeita vencimento “cedo demais” ou “tarde demais”. Esse limite seria regra clínica e não foi fornecido.

**Histórias:** [US02](02-requisitos-funcionais.md), [US04](02-requisitos-funcionais.md), [US06](02-requisitos-funcionais.md).

**Casos de teste:** CT-13, CT-32, CT-22.

## RN09 — Cálculo automático da situação da receita

**Situação:** definida.

**Descrição:** A situação de prazo é calculada na leitura. Ela compara `expiresOn` com a data corrente. Não existe rotina diária que grave status, nem coluna de situação usada como fonte da verdade.

**Condição:** Consulta de receita, lista, dashboard ou alerta, para receita com data de vencimento válida.

**Resultado esperado:**

| Comparação | Situação base (`situation`) |
| --- | --- |
| `expiresOn` anterior à data corrente | `VENCIDA` |
| `expiresOn` igual à data corrente | `DENTRO_DO_PRAZO` |
| `expiresOn` posterior à data corrente | `DENTRO_DO_PRAZO` |

O campo `daysUntilExpiry` é a diferença em dias civis: zero no dia do vencimento, negativo quando a data já passou.

Receita `VENCIDA` traz `visualEmphasis: true` para o destaque da interface. A cor correspondente é a da [US08](02-requisitos-funcionais.md).

**Exceções:** Sem data válida, aplica-se a RN10 e esta tabela não é usada. Receita com ciclo de vida `CANCELADA`, se esse estado existir, continua tendo a situação calculada para auditoria da data, mas sai dos indicadores operacionais ([DEC-08](11-decisoes-e-pendencias.md)).

**Histórias:** [US05](02-requisitos-funcionais.md), [US06](02-requisitos-funcionais.md).

**Casos de teste:** CT-10, CT-11, CT-12.

## RN10 — Identificação de receitas sem vencimento válido

**Situação:** definida.

**Descrição:** Receita sem data de vencimento válida não recebe situação automática de vencida nem de dentro do prazo.

**Condição:** `expiresOn` nulo na receita armazenada.

**Resultado esperado:** `situation` e `alertBand` iguais a `PENDENTE_INFORMACAO`, `daysUntilExpiry` nulo e `visualEmphasis: false`. A lista e o dashboard mostram o grupo pendente de informação, separado das vencidas e das que estão no prazo.

Data com formato inválido não é armazenada; a API responde `400`. O estado pendente representa ausência de data, não data corrompida.

**Exceções:** Nenhuma regra clínica transforma a pendência em vencida.

**Histórias:** [US06](02-requisitos-funcionais.md).

**Casos de teste:** CT-13.

## RN11 — Classificação de alertas de vencimento

**Situação:** pendente de confirmação ([DEC-03](11-decisoes-e-pendencias.md)). A proposta abaixo é o padrão inicial, extraído dos indicadores de 5 e 15 dias do protótipo.

**Descrição:** Além da situação base da RN09, cada receita ativa com data válida recebe uma faixa de alerta.

**Condição:** Classificação de receita ativa na data corrente. `daysUntilExpiry` é negativo quando vencida.

**Resultado esperado proposto:**

| Condição | `alertBand` |
| --- | --- |
| Sem data válida | `PENDENTE_INFORMACAO` |
| `daysUntilExpiry` menor que 0 | `VENCIDA` |
| `daysUntilExpiry` de 0 a 5, inclusive | `PROXIMA_5` |
| `daysUntilExpiry` de 6 a 15, inclusive | `PROXIMA_15` |
| `daysUntilExpiry` maior que 15 | `DENTRO_DO_PRAZO` |

Assim, o vencimento na data corrente permanece `situation = DENTRO_DO_PRAZO` e `alertBand = PROXIMA_5`.

Os indicadores do dashboard contam receitas ativas em cada faixa. A lista aberta a partir do indicador aplica o mesmo filtro.

**Exceções:** Se a equipe alterar os limites, os valores 5 e 15 mudam juntos na configuração. Os quatro grupos — vencida, próxima, dentro do prazo e sem data — permanecem distintos. “Próxima” pode voltar a ser uma faixa única, se a equipe recusar a divisão entre 5 e 15 dias.

**Histórias:** [US07](02-requisitos-funcionais.md), [US08](02-requisitos-funcionais.md).

**Casos de teste:** CT-25, CT-26, CT-27, CT-28, CT-39, CT-40, CT-41, CT-42.

## RN12 — Identificação de pacientes prioritários

**Situação:** pendente de confirmação ([DEC-03](11-decisoes-e-pendencias.md)). Proposta alinhada à RN11.

**Descrição:** Paciente prioritário é aquele com ao menos uma receita ativa na faixa `VENCIDA`, `PROXIMA_5` ou `PROXIMA_15`.

**Condição:** Consulta da lista de busca ativa.

**Resultado esperado proposto:**

- O paciente entra uma única vez.
- A data considerada é o menor `expiresOn` entre as receitas ativas que o tornaram prioritário.
- A ordenação é crescente por essa data, de modo que o vencimento mais antigo apareça primeiro.
- O item traz nome, telefone se houver, identificador do paciente e a data usada na ordenação.
- Lista sem pacientes informa que não há prioritários.
- Receita só em `DENTRO_DO_PRAZO` acima de 15 dias, receita pendente de informação e receita cancelada não incluem o paciente, salvo se outra receita ativa dele cumprir o critério.

**Exceções:** A equipe pode restringir a lista às faixas de proximidade e deixar as vencidas apenas no dashboard. Até essa confirmação, vencidas e próximas em até 15 dias compõem a proposta.

**Histórias:** [US09](02-requisitos-funcionais.md).

**Casos de teste:** CT-29, CT-38.

## RN13 — Controle de acesso por perfil e permissão

**Situação:** definida quanto ao mecanismo. A matriz de quem pode o quê está pendente ([DEC-10](11-decisoes-e-pendencias.md)).

**Descrição:** O back-end autentica o usuário e verifica a permissão da operação. O papel agrupa permissões. O usuário pode ter um ou mais papéis; na primeira versão, o seed atribui um papel a cada usuário.

**Condição:** Qualquer endpoint exceto `POST /auth/login`.

**Resultado esperado:**

- Sem token, token inválido ou token expirado: `401`, código `UNAUTHENTICATED`.
- Token válido e usuário ativo sem a permissão: `403`, código `FORBIDDEN`, sem dados do recurso.
- Usuário inativo: o login responde `401` com a mesma mensagem das credenciais inválidas. Token antigo deixa de ser aceito porque a checagem de usuário ativo ocorre também nas requisições seguintes.
- Administrador é o único papel com recomendação fechada de `access:admin`. Os demais vínculos estão na matriz de [02-requisitos-funcionais.md](02-requisitos-funcionais.md).

**Exceções:** Perfil de acesso não concede habilitação legal para ato clínico. A permissão `prescriptions:create` só deve ser semeada para um papel depois da confirmação da equipe.

**Histórias:** [US10](02-requisitos-funcionais.md).

**Casos de teste:** CT-14, CT-15, CT-18, CT-19, CT-20, CT-34.

## RN14 — Registro de histórico de acompanhamento

**Situação:** definida para o conteúdo mínimo. O vocabulário clínico das providências não foi padronizado.

**Descrição:** Um acompanhamento é um registro livre, vinculado a um paciente, com data e descrição. Pode referenciar uma receita quando a providência disser respeito a ela, inclusive renovação.

**Condição:** Profissional com `followups:create` registra uma providência. A consulta exige `followups:read`.

**Resultado esperado:**

- Campos obrigatórios: paciente existente, data civil não futura e descrição não vazia.
- Campo opcional: receita do mesmo paciente. Receita de outro paciente é `400`.
- A consulta do paciente devolve os registros com data, descrição, autor e receita relacionada quando houver.
- Sem registros, a resposta é uma lista vazia e a interface informa que o paciente ainda não possui histórico de acompanhamento.
- Não se apaga acompanhamento na primeira versão. Correção de texto fica pendente.

**Exceções:** A descrição é o que identifica a renovação nesta versão. Não há tipo enumerado obrigatório de providência.

**Histórias:** [US03](02-requisitos-funcionais.md).

**Casos de teste:** CT-23, CT-24, CT-44.

## RN15 — Proteção e rastreabilidade de operações relevantes

**Situação:** definida para o conjunto mínimo de eventos. Retenção e descarte estão pendentes ([DEC-13](11-decisoes-e-pendencias.md)).

**Descrição:** Operações relevantes geram registro de auditoria sem segredos.

**Condição:** Ocorrência de um dos eventos abaixo.

**Resultado esperado:** Gravar instante, usuário quando identificado, tipo do evento, tipo e identificador do recurso quando existirem, e desfecho `SUCCESS` ou `FAILURE`. O resumo é curto e não contém senha, hash, token, corpo cru da requisição nem CPF completo se o identificador do recurso já bastar. Login com falha pode não ter usuário; nesse caso o ator fica nulo e o resumo não repete a senha digitada.

Eventos mínimos:

| Evento | Quando |
| --- | --- |
| `AUTH_LOGIN_SUCCESS` | Login de usuário ativo aceito |
| `AUTH_LOGIN_FAILURE` | Credencial inválida ou usuário inativo |
| `ACCESS_DENIED` | Autenticado sem permissão |
| `PATIENT_CREATED` | Paciente gravado |
| `PATIENT_UPDATED` | Ficha alterada sem troca de nome |
| `PATIENT_NAME_CHANGED` | Nome confirmado e histórico gerado |
| `PRESCRIPTION_CREATED` | Receita gravada |
| `PRESCRIPTION_UPDATED` | Vencimento ou observação alterados |
| `PRESCRIPTION_CANCELLED` | Ciclo de vida passa a cancelada |
| `FOLLOW_UP_CREATED` | Acompanhamento gravado |

**Exceções:** Falha ao gravar auditoria de uma operação de negócio bem-sucedida deve ser tratada na implementação como falha da operação, para não concluir uma alteração relevante sem trilha. O desenho transacional exato fica para a sprint, com esse resultado como critério.

**Histórias:** [US10](02-requisitos-funcionais.md). Relaciona-se também a [RN04](#rn04--confirmação-e-histórico-de-alteração-de-nome).

**Casos de teste:** CT-36, CT-15.

## Decisões que estas regras não fecham

Os pontos abaixo têm recomendação no registro de decisões e não devem ser implementados como se já estivessem homologados:

- duração do token e algoritmo de hash: [DEC-01](11-decisoes-e-pendencias.md);
- limites de 5 e 15 dias: [DEC-03](11-decisoes-e-pendencias.md);
- provedor de CEP: [DEC-06](11-decisoes-e-pendencias.md);
- medicamentos e demais dados clínicos da receita: [DEC-07](11-decisoes-e-pendencias.md) e [DEC-12](11-decisoes-e-pendencias.md);
- quem cancela receita e se o cancelamento entra na primeira demonstração: [DEC-08](11-decisoes-e-pendencias.md);
- células pendentes da matriz de permissões: [DEC-10](11-decisoes-e-pendencias.md);
- retenção de dados e de auditoria: [DEC-13](11-decisoes-e-pendencias.md).
