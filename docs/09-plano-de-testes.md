# 09 — Plano de testes

Os cenários abaixo serão executados quando a aplicação existir. Nesta etapa nenhum teste foi rodado: não há sistema para exercitar. O status de todos é **Não executado**.

A data corrente dos exemplos é `2026-10-18`, no fuso `America/Sao_Paulo`. Os CPFs são fictícios. `529.982.247-25` e `111.444.777-35` passam no algoritmo de dígitos verificadores e não identificam pessoas reais.

Prioridade do teste acompanha a fase em que o comportamento precisa estar demonstrável.

## Casos

### CT-01 — CPF válido

- **História:** US01-CA02, US01-CA05
- **Regra:** RN01, RN02
- **Endpoint:** `POST /patients`
- **Prioridade:** P0
- **Entrada:** CPF `529.982.247-25`, nome Maria Helena Fictícia.
- **Resultado esperado:** HTTP 201. Um único paciente. A resposta devolve o CPF mascarado. Não existe segundo registro com o mesmo CPF.

### CT-02 — CPF com dígito verificador inválido

- **História:** US01-CA03
- **Regra:** RN02
- **Endpoint:** `POST /patients`
- **Prioridade:** P0
- **Entrada:** `529.982.247-00`.
- **Resultado esperado:** HTTP 400, código `CPF_INVALID`. Nenhum paciente é gravado. A mensagem não diz se o número existiria na base.

### CT-03 — CPF com todos os dígitos iguais

- **História:** US01-CA03
- **Regra:** RN02
- **Endpoint:** `POST /patients`
- **Prioridade:** P0
- **Entrada:** `111.111.111-11`.
- **Resultado esperado:** HTTP 400, código `CPF_INVALID`. Nenhum paciente é gravado.

### CT-04 — CPF já cadastrado

- **História:** US01-CA04, US01-CA05
- **Regra:** RN01, RN03
- **Endpoint:** `POST /patients` e `GET /patients?cpf=`
- **Prioridade:** P0
- **Entrada:** repetir o CPF de CT-01 com outro nome.
- **Resultado esperado:** o `POST` responde 409, código `CPF_ALREADY_EXISTS`, com `existingPatientId`. O nome antigo permanece. O `GET` pelo CPF devolve o paciente original.

### CT-05 — Alteração de nome com confirmação

- **História:** US01-CA06, US01-CA07
- **Regra:** RN04
- **Endpoint:** `PATCH /patients/{id}`
- **Prioridade:** P0
- **Entrada:** nome diferente e `confirmNameChange: true`.
- **Resultado esperado:** HTTP 200, nome atualizado e um registro de histórico com nome anterior, nome novo, instante e autor.

### CT-06 — Alteração de nome sem confirmação

- **História:** US01-CA06
- **Regra:** RN04
- **Endpoint:** `PATCH /patients/{id}`
- **Prioridade:** P0
- **Entrada:** nome diferente e `confirmNameChange` ausente ou falso.
- **Resultado esperado:** HTTP 409, código `NAME_CHANGE_CONFIRMATION_REQUIRED`, com `currentName` e `informedName`. O nome armazenado e o histórico não mudam.

### CT-07 — Paciente sem data de nascimento

- **História:** US02-CA01, US02-CA06
- **Regra:** RN05
- **Endpoint:** `POST /patients` e `GET /patients/{id}`
- **Prioridade:** P1
- **Entrada:** paciente fictício sem `birthDate`.
- **Resultado esperado:** cadastro aceito. `age.years` nulo e `age.status` igual a `NAO_INFORMADA`. A interface informa a ausência da data.

### CT-08 — CEP indisponível

- **História:** US02-CA03
- **Regra:** RN06
- **Endpoint:** `GET /addresses/cep/{cep}` e `PATCH /patients/{id}`
- **Prioridade:** P1
- **Entrada:** CEP de oito dígitos com o adaptador indisponível; em seguida, endereço digitado.
- **Resultado esperado:** a consulta responde 503, código `CEP_LOOKUP_UNAVAILABLE`. O `PATCH` com endereço manual responde 200. O paciente não fica bloqueado.

### CT-09 — CEP encontrado e endereço corrigido

- **História:** US02-CA01, US02-CA03, US02-CA04
- **Regra:** RN06
- **Endpoint:** `GET /addresses/cep/{cep}` e `PATCH /patients/{id}`
- **Prioridade:** P1
- **Entrada:** consulta com sucesso e alteração do logradouro antes de salvar.
- **Resultado esperado:** o valor gravado é o corrigido pelo profissional, não uma nova consulta silenciosa.

### CT-10 — Vencimento anterior à data atual

- **História:** US05-CA02, US05-CA04, US05-CA05, US06-CA01, US06-CA02, US06-CA04
- **Regra:** RN07, RN09
- **Endpoint:** `POST /prescriptions` e `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** receita do paciente de CT-01 com `expiresOn` `2026-10-01`.
- **Resultado esperado:** `situation` `VENCIDA`, `alertBand` `VENCIDA`, `daysUntilExpiry` `-17`, `visualEmphasis` verdadeiro, `referenceDate` `2026-10-18`. A lista destaca o caso por texto e por cor.

### CT-11 — Vencimento na data atual

- **História:** US06-CA03, US07-CA01
- **Regra:** RN09, RN11
- **Endpoint:** `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** `expiresOn` `2026-10-18`.
- **Resultado esperado:** `situation` `DENTRO_DO_PRAZO`, `alertBand` `PROXIMA_5`, `daysUntilExpiry` `0`. Entra no indicador de até 5 dias e não no de vencidas.

### CT-12 — Vencimento futuro fora da janela de alerta

- **História:** US06-CA03, US07-CA04
- **Regra:** RN09, RN11
- **Endpoint:** `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** `expiresOn` `2026-11-17`.
- **Resultado esperado:** `situation` e `alertBand` iguais a `DENTRO_DO_PRAZO`, `daysUntilExpiry` `30`. Não entra em alerta de proximidade nem na lista prioritária.

### CT-13 — Receita sem data de vencimento

- **História:** US06-CA06
- **Regra:** RN08, RN10
- **Endpoint:** `POST /prescriptions`
- **Prioridade:** P0
- **Entrada:** `patientId` válido e `expiresOn` omitido.
- **Resultado esperado:** HTTP 201. `situation` e `alertBand` iguais a `PENDENTE_INFORMACAO`, `daysUntilExpiry` nulo, `visualEmphasis` falso.

### CT-14 — Usuário não autenticado

- **História:** US10-CA05
- **Regra:** RN13
- **Endpoint:** `GET /patients`
- **Prioridade:** P0
- **Entrada:** requisição sem cabeçalho `Authorization`.
- **Resultado esperado:** HTTP 401, código `UNAUTHENTICATED`. Nenhum paciente é devolvido.

### CT-15 — Usuário sem permissão

- **História:** US10-CA06
- **Regra:** RN13, RN15
- **Endpoint:** `POST /prescriptions`
- **Prioridade:** P0
- **Entrada:** token válido de um usuário sem `prescriptions:create`.
- **Resultado esperado:** HTTP 403, código `FORBIDDEN`, sem corpo da receita. Auditoria registra `ACCESS_DENIED` sem token e sem senha.

### CT-16 — Consulta sem resultados

- **História:** US05-CA01, US05-CA06
- **Regra:** RN03
- **Endpoint:** `GET /patients?cpf=` e `GET /prescriptions`
- **Prioridade:** P0
- **Entrada:** CPF válido ainda não cadastrado; lista de receitas em base vazia.
- **Resultado esperado:** HTTP 200, `data` vazio e `total` 0. A interface informa que não existem registros disponíveis. Isso não é HTTP 404.

### CT-17 — Receita para paciente inexistente

- **História:** US04-CA01, US04-CA05
- **Regra:** RN03, RN07
- **Endpoint:** `POST /prescriptions`
- **Prioridade:** P0
- **Entrada:** `patientId` de UUID inexistente.
- **Resultado esperado:** HTTP 404, código `PATIENT_NOT_FOUND`. Nenhuma receita é criada.

### CT-18 — Login com credencial válida

- **História:** US10-CA01, US10-CA02
- **Regra:** RN13
- **Endpoint:** `POST /auth/login` e `GET /auth/me`
- **Prioridade:** P0
- **Entrada:** usuário ativo fictício e senha correta.
- **Resultado esperado:** HTTP 200 com `accessToken`, `tokenType` Bearer e `expiresIn`. `GET /auth/me` devolve papéis e permissões, sem senha e sem hash.

### CT-19 — Senha incorreta e usuário inexistente

- **História:** US10-CA04
- **Regra:** RN13
- **Endpoint:** `POST /auth/login`
- **Prioridade:** P0
- **Entrada:** dois pedidos, um com usuário fictício e senha errada, outro com usuário ausente.
- **Resultado esperado:** ambos respondem 401, código `INVALID_CREDENTIALS`, mensagem “Credenciais inválidas.” Os corpos não permitem distinguir os dois casos.

### CT-20 — Usuário inativo

- **História:** US10-CA08
- **Regra:** RN13
- **Endpoint:** `POST /auth/login` e um `GET` com token antigo
- **Prioridade:** P0
- **Entrada:** usuário com `active` falso; depois, desativar um usuário que já possuía token.
- **Resultado esperado:** o login responde a mesma mensagem de CT-19. O token antigo passa a receber 401 nas rotas protegidas.

### CT-21 — Telefone formatado

- **História:** US02-CA02
- **Regra:** RN06, no mesmo espírito de normalização de entrada
- **Endpoint:** `POST /patients`
- **Prioridade:** P1
- **Entrada:** telefone `11988887777`.
- **Resultado esperado:** a resposta exibe `(11) 98888-7777`.

### CT-22 — Idade calculada

- **História:** US02-CA05
- **Regra:** RN05, RN08
- **Endpoint:** `GET /patients/{id}`
- **Prioridade:** P1
- **Entrada:** nascimento `1984-03-12` com data corrente `2026-10-18`. Outro pedido com nascimento `2026-10-19`.
- **Resultado esperado:** o primeiro devolve `age.years` 42 e `status` `CALCULADA`, porque o aniversário de 2026 já ocorreu. O segundo responde 400 e não grava a data futura. A idade não está em coluna própria.

### CT-23 — Paciente sem histórico de acompanhamento

- **História:** US03-CA04
- **Regra:** RN14
- **Endpoint:** `GET /patients/{id}/follow-ups`
- **Prioridade:** P1
- **Entrada:** paciente sem providências.
- **Resultado esperado:** HTTP 200, lista vazia. A interface informa que o paciente ainda não possui histórico de acompanhamento.

### CT-24 — Histórico com providência de renovação

- **História:** US03-CA01, US03-CA02, US03-CA03
- **Regra:** RN14
- **Endpoint:** `POST /patients/{id}/follow-ups` e o `GET` correspondente
- **Prioridade:** P1
- **Entrada:** data `2026-10-18`, descrição que menciona renovação e `prescriptionId` da receita desse paciente.
- **Resultado esperado:** o registro volta com data, descrição, autor e receita. A descrição permite identificar a ação de renovação.

### CT-25 — Indicadores do dashboard

- **História:** US07-CA01, US07-CA02, US07-CA03, US07-CA05
- **Regra:** RN11
- **Endpoint:** `GET /dashboard/summary` e `GET /prescriptions/alerts`
- **Prioridade:** P0
- **Entrada:** uma receita em cada faixa: vencida, 5 dias, 15 dias, acima de 15 dias e sem data. Todas ativas.
- **Resultado esperado:** contagens 1, 1, 1, 1 e 1. A lista de cada indicador contém a mesma receita contada. Receita vencida não aparece nas faixas de 5 ou 15 dias.

### CT-26 — Alerta de até 5 dias

- **História:** US07-CA01
- **Regra:** RN11
- **Endpoint:** `GET /prescriptions/alerts?band=proxima_5`
- **Prioridade:** P0
- **Entrada:** vencimentos em `2026-10-18` e `2026-10-23`, além de uma vencida.
- **Resultado esperado:** a lista traz as duas primeiras e exclui a vencida.

### CT-27 — Alerta de 6 a 15 dias

- **História:** US07-CA02
- **Regra:** RN11
- **Endpoint:** `GET /prescriptions/alerts?band=proxima_15`
- **Prioridade:** P0
- **Entrada:** vencimento em `2026-11-02` (15 dias) e outro em `2026-10-23` (5 dias).
- **Resultado esperado:** somente a de 15 dias entra nessa faixa.

### CT-28 — Cor acompanhada de texto

- **História:** US08-CA01, US08-CA02, US08-CA03
- **Regra:** RN09, RN11
- **Endpoint:** interface sobre `GET /prescriptions`
- **Prioridade:** P0
- **Entrada:** uma receita de cada grupo.
- **Resultado esperado:** vermelho e texto de vencida; âmbar e texto de até 5 dias; amarelo e texto de 6 a 15 dias; verde e texto de prazo acima de 15 dias; cinza e texto de pendente de informação. A proposta de cor permanece pendente em DEC-03, mas o texto da situação é obrigatório.

### CT-29 — Lista de pacientes prioritários

- **História:** US09-CA01, US09-CA02, US09-CA03, US09-CA04
- **Regra:** RN12
- **Endpoint:** `GET /patients/priority`
- **Prioridade:** P1
- **Entrada:** um paciente com receita vencida, um com vencimento em 10 dias, um só com vencimento em 30 dias e um só com receita sem data.
- **Resultado esperado:** os dois primeiros aparecem, o vencido antes. Cada item tem nome, telefone quando houver e `nearestExpiryOn`. Os dois últimos ficam de fora.

### CT-30 — Paginação e ordenação

- **História:** US05-CA01
- **Regra:** RN09, decisão DEC-09
- **Endpoint:** `GET /prescriptions`
- **Prioridade:** P0
- **Entrada:** `page=1`, `pageSize=1`, `sort=expiresOn`, com duas receitas.
- **Resultado esperado:** `total` 2, um item na página, o de vencimento mais antigo primeiro. `pageSize=101` responde 400.

### CT-31 — Vínculo obrigatório da receita

- **História:** US04-CA01, US04-CA02, US04-CA03, US04-CA05, US04-CA06, US05-CA03
- **Regra:** RN07
- **Endpoint:** `POST /prescriptions` e `GET /prescriptions?patientId=`
- **Prioridade:** P0
- **Entrada:** corpo sem `patientId`; depois, corpo com paciente existente.
- **Resultado esperado:** o primeiro responde 400 e não grava. O segundo responde 201 e a consulta por esse `patientId` devolve a receita, com o nome e o CPF do paciente.

### CT-32 — Data impossível

- **História:** US04-CA04
- **Regra:** RN08
- **Endpoint:** `POST /prescriptions`
- **Prioridade:** P0
- **Entrada:** `expiresOn` `2026-02-31`.
- **Resultado esperado:** HTTP 400, código `DATE_INVALID` ou `VALIDATION_ERROR`. Nada é gravado. O estado pendente da RN10 não é usado para data corrompida.

### CT-33 — Receita não muda de paciente

- **História:** US04-CA05
- **Regra:** RN07
- **Endpoint:** `PATCH /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** corpo com outro `patientId`.
- **Resultado esperado:** HTTP 400. O vínculo original permanece.

### CT-34 — Token expirado

- **História:** US10-CA07
- **Regra:** RN13
- **Endpoint:** `GET /auth/me`
- **Prioridade:** P0
- **Entrada:** Bearer cujo `exp` já passou, usando a validade configurada.
- **Resultado esperado:** HTTP 401, código `UNAUTHENTICATED`. O cliente precisa autenticar de novo.

### CT-35 — Máscara do CPF

- **História:** US01-CA02
- **Regra:** RN02
- **Endpoint:** `POST /patients`
- **Prioridade:** P0
- **Entrada:** os mesmos dígitos de CT-01, uma vez só com números e outra com máscara.
- **Resultado esperado:** as duas formas são aceitas na entrada. A saída usa `529.982.247-25`. O segundo `POST` cai no CT-04.

### CT-36 — Auditoria sem segredo

- **História:** US10-CA03, US10-CA09
- **Regra:** RN15
- **Endpoint:** `POST /auth/login` e inspeção do registro de auditoria
- **Prioridade:** P0
- **Entrada:** login com sucesso e login com senha incorreta.
- **Resultado esperado:** há `AUTH_LOGIN_SUCCESS` e `AUTH_LOGIN_FAILURE`. O texto armazenado não contém a senha, o hash nem o token. A senha no banco está somente como hash.

### CT-37 — Erro interno sem detalhe

- **História:** US10, requisito RNF08
- **Regra:** RN15
- **Endpoint:** qualquer operação com falha inesperada simulada no servidor
- **Prioridade:** P0
- **Entrada:** exceção não tratada de infraestrutura, em ambiente de teste.
- **Resultado esperado:** HTTP 500, código `INTERNAL_ERROR`, mensagem “Não foi possível concluir a operação.” A resposta não traz stack trace, SQL nem string de conexão.

### CT-38 — Nenhum paciente prioritário

- **História:** US09-CA05
- **Regra:** RN12
- **Endpoint:** `GET /patients/priority`
- **Prioridade:** P1
- **Entrada:** base só com receita acima de 15 dias.
- **Resultado esperado:** HTTP 200, lista vazia. A interface informa que não há pacientes prioritários.

### CT-39 — Fronteira de 5 dias

- **História:** US07-CA01, US07-CA06
- **Regra:** RN11
- **Endpoint:** `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** `expiresOn` `2026-10-23`.
- **Resultado esperado:** `alertBand` `PROXIMA_5` e `daysUntilExpiry` 5.

### CT-40 — Fronteira de 6 dias

- **História:** US07-CA02
- **Regra:** RN11
- **Endpoint:** `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** `expiresOn` `2026-10-24`.
- **Resultado esperado:** `alertBand` `PROXIMA_15` e `daysUntilExpiry` 6. Não entra na faixa de 5 dias.

### CT-41 — Fronteira de 15 dias

- **História:** US07-CA02, US07-CA04
- **Regra:** RN11
- **Endpoint:** `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** `expiresOn` `2026-11-02`.
- **Resultado esperado:** `alertBand` `PROXIMA_15` e `daysUntilExpiry` 15.

### CT-42 — Fronteira de 16 dias

- **História:** US07-CA04
- **Regra:** RN11
- **Endpoint:** `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** `expiresOn` `2026-11-03`.
- **Resultado esperado:** `alertBand` `DENTRO_DO_PRAZO` e `daysUntilExpiry` 16. Fora da lista prioritária.

### CT-43 — CEP com formato inválido

- **História:** US02-CA03
- **Regra:** RN06
- **Endpoint:** `GET /addresses/cep/{cep}`
- **Prioridade:** P1
- **Entrada:** `123`.
- **Resultado esperado:** HTTP 400. O profissional pode seguir com endereço manual.

### CT-44 — Acompanhamento com receita de outro paciente

- **História:** US03-CA01
- **Regra:** RN14
- **Endpoint:** `POST /patients/{id}/follow-ups`
- **Prioridade:** P1
- **Entrada:** `prescriptionId` de uma receita de outro paciente.
- **Resultado esperado:** HTTP 400. O acompanhamento não é gravado.

### CT-45 — CPF como primeiro campo

- **História:** US01-CA01
- **Regra:** RN02
- **Endpoint:** tela de cadastro de paciente e de receita
- **Prioridade:** P0
- **Entrada:** abrir os formulários.
- **Resultado esperado:** o primeiro campo editável é o CPF, antes do nome e dos dados da receita.

### CT-46 — Limites de alerta em um só ponto

- **História:** US07-CA06, US08-CA04
- **Regra:** RN11
- **Endpoint:** `GET /dashboard/summary`
- **Prioridade:** P0
- **Entrada:** inspecionar a configuração dos limites e o campo `alertWindows`.
- **Resultado esperado:** `nearDays` 5 e `attentionDays` 15 saem da mesma configuração usada pela classificação. Alterar o par, quando a equipe confirmar outros números, não exige segunda implementação da conta.

### CT-47 — Receita cancelada fora dos indicadores

- **História:** US06-CA05, US09-CA01
- **Regra:** RN09, RN12
- **Endpoint:** `PATCH /prescriptions/{id}` e `GET /dashboard/summary`
- **Prioridade:** P1
- **Entrada:** receita vencida alterada para `lifecycleStatus` `CANCELADA` por usuário com `prescriptions:cancel`.
- **Resultado esperado:** a situação de prazo continua calculada no detalhe. A receita sai do contador de vencidas e não coloca o paciente na lista prioritária se não houver outra receita ativa que o qualifique. Usuário sem `prescriptions:cancel` recebe 403.

### CT-48 — Fuso horário na virada do dia

- **História:** US06-CA01, US06-CA05
- **Regra:** RN09
- **Endpoint:** `GET /prescriptions/{id}`
- **Prioridade:** P0
- **Entrada:** relógio do servidor em `2026-10-19T01:30:00Z`, que é `2026-10-18T22:30:00-03:00`. Receita com vencimento `2026-10-18`.
- **Resultado esperado:** a data corrente usada é `2026-10-18`. A receita permanece na situação de quem vence hoje, não na de vencida.

## Matriz de rastreabilidade

| Teste | História | Critério | Regra | Endpoint | Prioridade | Status |
| --- | --- | --- | --- | --- | --- | --- |
| CT-01 | US01 | CA02, CA05 | RN01, RN02 | `POST /patients` | P0 | Não executado |
| CT-02 | US01 | CA03 | RN02 | `POST /patients` | P0 | Não executado |
| CT-03 | US01 | CA03 | RN02 | `POST /patients` | P0 | Não executado |
| CT-04 | US01 | CA04, CA05 | RN01, RN03 | `POST /patients`, `GET /patients` | P0 | Não executado |
| CT-05 | US01 | CA06, CA07 | RN04 | `PATCH /patients/{id}` | P0 | Não executado |
| CT-06 | US01 | CA06 | RN04 | `PATCH /patients/{id}` | P0 | Não executado |
| CT-07 | US02 | CA01, CA06 | RN05 | `POST /patients`, `GET /patients/{id}` | P1 | Não executado |
| CT-08 | US02 | CA03 | RN06 | `GET /addresses/cep/{cep}`, `PATCH /patients/{id}` | P1 | Não executado |
| CT-09 | US02 | CA01, CA03, CA04 | RN06 | `GET /addresses/cep/{cep}`, `PATCH /patients/{id}` | P1 | Não executado |
| CT-10 | US05, US06 | US05-CA02, CA04, CA05; US06-CA01, CA02, CA04 | RN07, RN09 | `POST /prescriptions`, `GET /prescriptions/{id}` | P0 | Não executado |
| CT-11 | US06, US07 | US06-CA03, US07-CA01 | RN09, RN11 | `GET /prescriptions/{id}` | P0 | Não executado |
| CT-12 | US06, US07 | US06-CA03, US07-CA04 | RN09, RN11 | `GET /prescriptions/{id}` | P0 | Não executado |
| CT-13 | US06 | CA06 | RN08, RN10 | `POST /prescriptions` | P0 | Não executado |
| CT-14 | US10 | CA05 | RN13 | `GET /patients` | P0 | Não executado |
| CT-15 | US10 | CA06 | RN13, RN15 | `POST /prescriptions` | P0 | Não executado |
| CT-16 | US05 | CA01, CA06 | RN03 | `GET /patients`, `GET /prescriptions` | P0 | Não executado |
| CT-17 | US04 | CA01, CA05 | RN03, RN07 | `POST /prescriptions` | P0 | Não executado |
| CT-18 | US10 | CA01, CA02 | RN13 | `POST /auth/login`, `GET /auth/me` | P0 | Não executado |
| CT-19 | US10 | CA04 | RN13 | `POST /auth/login` | P0 | Não executado |
| CT-20 | US10 | CA08 | RN13 | `POST /auth/login` | P0 | Não executado |
| CT-21 | US02 | CA02 | RN06 | `POST /patients` | P1 | Não executado |
| CT-22 | US02 | CA05 | RN05, RN08 | `GET /patients/{id}` | P1 | Não executado |
| CT-23 | US03 | CA04 | RN14 | `GET /patients/{id}/follow-ups` | P1 | Não executado |
| CT-24 | US03 | CA01, CA02, CA03 | RN14 | `POST /patients/{id}/follow-ups` | P1 | Não executado |
| CT-25 | US07 | CA01, CA02, CA03, CA05 | RN11 | `GET /dashboard/summary`, `GET /prescriptions/alerts` | P0 | Não executado |
| CT-26 | US07 | CA01 | RN11 | `GET /prescriptions/alerts` | P0 | Não executado |
| CT-27 | US07 | CA02 | RN11 | `GET /prescriptions/alerts` | P0 | Não executado |
| CT-28 | US08 | CA01, CA02, CA03 | RN09, RN11 | Interface e `GET /prescriptions` | P0 | Não executado |
| CT-29 | US09 | CA01, CA02, CA03, CA04 | RN12 | `GET /patients/priority` | P1 | Não executado |
| CT-30 | US05 | CA01 | DEC-09 | `GET /prescriptions` | P0 | Não executado |
| CT-31 | US04, US05 | US04-CA01 a CA03, CA05, CA06; US05-CA03 | RN07 | `POST /prescriptions`, `GET /prescriptions` | P0 | Não executado |
| CT-32 | US04 | CA04 | RN08 | `POST /prescriptions` | P0 | Não executado |
| CT-33 | US04 | CA05 | RN07 | `PATCH /prescriptions/{id}` | P0 | Não executado |
| CT-34 | US10 | CA07 | RN13 | `GET /auth/me` | P0 | Não executado |
| CT-35 | US01 | CA02 | RN02 | `POST /patients` | P0 | Não executado |
| CT-36 | US10 | CA03, CA09 | RN15 | `POST /auth/login` | P0 | Não executado |
| CT-37 | RNF08 | RNF08 | RN15 | Operação com falha simulada | P0 | Não executado |
| CT-38 | US09 | CA05 | RN12 | `GET /patients/priority` | P1 | Não executado |
| CT-39 | US07 | CA01, CA06 | RN11 | `GET /prescriptions/{id}` | P0 | Não executado |
| CT-40 | US07 | CA02 | RN11 | `GET /prescriptions/{id}` | P0 | Não executado |
| CT-41 | US07 | CA02, CA04 | RN11 | `GET /prescriptions/{id}` | P0 | Não executado |
| CT-42 | US07 | CA04 | RN11 | `GET /prescriptions/{id}` | P0 | Não executado |
| CT-43 | US02 | CA03 | RN06 | `GET /addresses/cep/{cep}` | P1 | Não executado |
| CT-44 | US03 | CA01 | RN14 | `POST /patients/{id}/follow-ups` | P1 | Não executado |
| CT-45 | US01 | CA01 | RN02 | Telas de paciente e de receita | P0 | Não executado |
| CT-46 | US07, US08 | US07-CA06, US08-CA04 | RN11 | `GET /dashboard/summary` | P0 | Não executado |
| CT-47 | US06, US09 | US06-CA05, US09-CA01 | RN09, RN12 | `PATCH /prescriptions/{id}`, `GET /dashboard/summary` | P1 | Não executado |
| CT-48 | US06 | CA01, CA05 | RN09 | `GET /prescriptions/{id}` | P0 | Não executado |

## Cobertura mínima pedida

| Pedido | Caso |
| --- | --- |
| CPF válido | CT-01 |
| CPF inválido | CT-02 |
| CPF com dígitos repetidos | CT-03 |
| CPF já cadastrado | CT-04 |
| Alteração de nome com confirmação | CT-05 |
| Paciente sem data de nascimento | CT-07 |
| CEP indisponível | CT-08 |
| Receita com vencimento anterior | CT-10 |
| Receita vencendo na data atual | CT-11 |
| Receita com vencimento futuro | CT-12 |
| Receita sem data válida | CT-13 |
| Usuário não autenticado | CT-14 |
| Usuário sem permissão | CT-15 |
| Consulta sem resultados | CT-16 |
| Receita para paciente inexistente | CT-17 |

## Como executar na implementação

Os casos P0 de API devem virar testes automatizados do módulo de domínio e da camada HTTP, com banco de teste e data corrente controlada. CT-28, CT-45 e o texto das listas vazias precisam de verificação na interface. CT-08 e CT-09 usam um adaptador de CEP substituível, para não depender da rede no teste. Nenhum cenário deve usar dado real de paciente.
