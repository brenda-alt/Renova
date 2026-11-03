# 11 — Decisões e pendências

Cada decisão tem contexto, alternativas, recomendação, status e responsável. Enquanto o status for pendente, a implementação usa a recomendação só no ponto necessário para a demonstração e deixa o valor ajustável.

Responsável pela confirmação, salvo observação contrária: equipe do projeto Renova, com os profissionais da ESF quando a decisão for de negócio ou de uso na unidade.

## DEC-01 — Autenticação e sessão

**Contexto:** US10 exige usuário e senha, validação no servidor, hash, erro genérico, proteção das rotas, autorização, expiração e usuário inativo.

**Alternativas:**

- Sessão de servidor com cookie `HttpOnly`.
- JWT de acesso de curta duração, sem refresh token.
- JWT com refresh token e revogação.

**Recomendação:** JWT Bearer validado no NestJS, com `expiresIn` de 3600 segundos. Hash Argon2id; bcrypt fica aceitável se a equipe padronizar uma única biblioteca. Logout da primeira versão descarta o token no cliente. Usuário inativo é verificado também nas requisições seguintes. Senha, hash e token ficam fora de log e de auditoria. O token fica em memória da aplicação, não em `localStorage`.

**Status:** recomendada, pendente de confirmação da duração, do algoritmo e do lugar em que o navegador guarda o token. O mecanismo de autenticação no servidor está definido pela US10.

**Responsável:** equipe do projeto.

## DEC-02 — Data corrente e situação calculada

**Contexto:** US06 compara o vencimento com a data atual e pede que a situação acompanhe o calendário sem atualização manual.

**Alternativas:**

- Gravar `situation` e recalcular em rotina diária.
- Calcular na leitura e não persistir a situação.
- Usar a data UTC do servidor.
- Usar o dia civil de `America/Sao_Paulo`.

**Recomendação:** não existe coluna de situação de prazo. A API devolve `situation`, `alertBand`, `daysUntilExpiry` e `referenceDate`. A data corrente é o dia civil em `America/Sao_Paulo`. O cliente não envia a data de referência.

**Status:** o cálculo na leitura está definido. O fuso `America/Sao_Paulo` é a recomendação adotada nesta especificação; a equipe confirma se a unidade operar em outro fuso.

**Responsável:** equipe do projeto.

## DEC-03 — Faixas de alerta e cores

**Contexto:** o protótipo separa vencidas, até 5 dias, 6 a 15 dias e acima de 15 dias. US07, US08 e US09 não fixavam esses números. US06 já fixa vencida e dentro do prazo.

**Alternativas:**

- Uma única faixa “próxima”, com limite a definir.
- Duas faixas, de 5 e de 15 dias, como no protótipo.
- Outros limites indicados pela equipe.

**Recomendação:** adotar como padrão inicial:

| Condição | `alertBand` | Cor proposta, sempre com texto |
| --- | --- | --- |
| Sem data | `PENDENTE_INFORMACAO` | Cinza |
| Antes de hoje | `VENCIDA` | Vermelho |
| 0 a 5 dias, inclusive hoje | `PROXIMA_5` | Âmbar |
| 6 a 15 dias | `PROXIMA_15` | Amarelo |
| Mais de 15 dias | `DENTRO_DO_PRAZO` | Verde |

Vencimento hoje permanece `situation = DENTRO_DO_PRAZO`. Os números ficam na configuração exposta em `alertWindows`.

**Status:** pendente de confirmação. A distinção entre vencida, próxima, dentro do prazo e sem data está definida.

**Responsável:** equipe do projeto e profissionais da ESF que usarão os alertas.

## DEC-04 — CPF já cadastrado

**Contexto:** US01 pede localizar o paciente existente e manter um único vínculo por CPF.

**Alternativas:**

- `POST` idempotente que devolve o paciente existente com 200 e ignora o nome novo.
- `POST` que responde 409 com o identificador, e a tela carrega o `GET`.
- `POST` que atualiza o nome automaticamente.

**Recomendação:** busca por `GET /patients?cpf=`. Criação duplicada responde 409 `CPF_ALREADY_EXISTS` e `existingPatientId`, sem alterar dados. CPF inválido é 400 `CPF_INVALID`. Identificador desconhecido é 404 `PATIENT_NOT_FOUND`. CPF válido ausente na busca é 200 com lista vazia.

**Status:** adotada nesta especificação. A regra de unicidade está definida; o código HTTP 409 é a forma escolhida para cumpri-la.

**Responsável:** equipe do projeto, se quiser outro contrato HTTP antes da implementação.

## DEC-05 — Confirmação de nome

**Contexto:** US01 pede confirmação e histórico quando o nome informado difere do cadastrado.

**Alternativas:**

- Endpoint separado de confirmação.
- Campo `confirmNameChange` no `PATCH`.
- Atualizar o nome sem confirmação.

**Recomendação:** `PATCH` sem confirmação responde 409 `NAME_CHANGE_CONFIRMATION_REQUIRED`. Com `confirmNameChange: true`, atualiza o nome e grava `PatientNameHistory` na mesma transação. Comparação sem diferenciar maiúsculas, depois de normalizar espaços.

**Status:** adotada nesta especificação.

**Responsável:** equipe do projeto.

## DEC-06 — Consulta de CEP

**Contexto:** US02 pede busca automática e permite corrigir o endereço. O serviço é externo e opcional.

**Alternativas:**

- ViaCEP, já usado no protótipo.
- Outro provedor institucional.
- Somente preenchimento manual na primeira versão.

**Recomendação:** adaptador no back-end, operação `GET /addresses/cep/{cep}`, provedor inicial ViaCEP. Enviar só o CEP. Timeout ou falha responde 503 `CEP_LOOKUP_UNAVAILABLE`. CEP inexistente responde 404 `CEP_NOT_FOUND`. Formato inválido responde 400. O `PATCH` do paciente grava o que o profissional confirmou. O adaptador pode ser desligado sem impedir o cadastro.

**Status:** pendente de confirmação do provedor. O preenchimento manual e a correção estão definidos.

**Responsável:** equipe do projeto. Se houver restrição institucional a serviço externo, a confirmação cabe também à unidade.

## DEC-07 — Itens da receita

**Contexto:** o protótipo cadastra medicamentos com validade própria. US04 a US06 falam da data de vencimento da receita.

**Alternativas:**

- Classificar pela data da receita e deixar itens para depois.
- Criar `PrescriptionItem` já na primeira versão, com a data do item mandando no alerta.
- Exigir um medicamento para salvar a receita.

**Recomendação:** a primeira versão persiste `Prescription.expiresOn` e classifica essa data. Não cria `PrescriptionItem` e não exige medicamento. A observação livre não deve ser usada para diagnóstico.

**Status:** pendente de confirmação clínica. A recomendação está adotada para desbloquear a sprint.

**Responsável:** equipe do projeto, com profissional habilitado da ESF.

## DEC-08 — Cancelamento da receita

**Contexto:** a matriz de permissões inclui cancelar/inativar. O vencimento não pode ser apagado por uma coluna de status desatualizada.

**Alternativas:**

- Exclusão física.
- Reutilizar a situação calculada para representar cancelamento.
- Gravar `lifecycleStatus` `ATIVA` ou `CANCELADA`, separado do prazo.

**Recomendação:** `lifecycleStatus` persistido, padrão `ATIVA`. Cancelar exige `prescriptions:cancel`. A receita cancelada sai do dashboard, dos alertas e da prioridade, e continua consultável no detalhe com a situação de prazo ainda calculada. Não há exclusão física. Quem recebe a permissão continua pendente em DEC-10. A demonstração P0 pode operar só com receitas ativas.

**Status:** a separação entre ciclo de vida e prazo está adotada. A autorização para cancelar está pendente.

**Responsável:** equipe do projeto e responsáveis da unidade.

## DEC-09 — Paginação e ordenação

**Contexto:** listas de pacientes, receitas, alertas, acompanhamentos e prioritários podem crescer.

**Alternativas:**

- Devolver a coleção inteira.
- Paginação por página.
- Paginação por cursor.

**Recomendação:** `page` a partir de 1, `pageSize` padrão 20 e máximo 100, `sort` com prefixo `-`. Fora da lista permitida, a API responde 400. Prioritários ordenam por `nearestExpiryOn` crescente. Receitas, por padrão, usam `-createdAt`.

**Status:** adotada nesta especificação. O teto de 100 é recomendação técnica, não meta de negócio.

**Responsável:** equipe do projeto.

## DEC-10 — Papéis e permissões

**Contexto:** há quatro papéis propostos. As histórias não dizem que todo profissional pode emitir ou cancelar receita. Papel de acesso não é habilitação legal.

**Alternativas:**

- Um único perfil com acesso total na demonstração.
- Matriz completa fechada agora, sem a equipe.
- Papéis criados, com células não comprovadas marcadas como pendentes e seed conservador.

**Recomendação:** criar Administrador, Médico ou profissional habilitado, Recepção e ACS. Seed inicial:

- Administrador recebe `access:admin` e as permissões de demonstração do cadastro.
- ACS recebe `patients:read`, `patients:update`, `prescriptions:read`, `followups:read`, `followups:create` e `dashboard:read`.
- `prescriptions:create`, `prescriptions:update` e `prescriptions:cancel` ficam desligadas nos papéis genéricos até a equipe confirmar. Um usuário fictício adicional, identificado como profissional autorizado de demonstração, pode recebê-las para o fluxo P0.
- Recepção e Médico existem no seed com permissões mínimas de leitura do que a equipe autorizar na confirmação; não recebem prescrição por suposição.

A matriz comentada está em [02-requisitos-funcionais.md](02-requisitos-funcionais.md).

**Status:** mecanismo de autorização definido. Quase todas as células estão pendentes de validação. As exceções já apoiadas pelas histórias são: ACS consulta e atualiza a ficha permitida, consulta o histórico e vê a lista prioritária; Administrador administra acessos; o back-end é quem autoriza.

**Responsável:** equipe do projeto e responsáveis da ESF. Não atribuir prescrição sem essa confirmação.

## DEC-11 — Menu lateral da área interna

**Contexto:** o protótipo concentra a operação em uma tela. O enunciado do sistema pede menu lateral.

**Alternativas:**

- Reproduzir a tela única do protótipo.
- Usar o menu lateral especificado e reaproveitar os cartões de vencimento.

**Recomendação:** login no modelo visual do protótipo. Área interna com os itens Dashboard, Receitas, Pacientes, Histórico de Acompanhamento, Alertas e Prioridades e Usuários, Cargos e Permissões. Os atalhos de login com senha em claro do protótipo não são migrados.

**Status:** definida para a implementação.

**Responsável:** equipe do projeto. O protótipo externo não deve ser alterado.

## DEC-12 — Dados clínicos ainda não definidos

**Contexto:** o protótipo mostra medicamento, dose, quantidade, uso diário, receita comum ou controlada, data de emissão, renovação por prazo, microárea e ACS responsável. As histórias não definem essas regras.

**Alternativas:**

- Copiar o protótipo como se fosse requisito clínico.
- Registrar a lacuna e limitar a primeira versão ao vencimento da receita e ao texto de acompanhamento.

**Recomendação:** não inventar validade legal, controle especial, profissional emissor nem renovação automática. Avaliar depois, com quem responde pelo ato clínico:

- se uma receita tem vários itens;
- se a data que dispara o alerta é a da receita ou a de cada item;
- se emissão e profissional responsável são obrigatórios;
- se microárea restringe o que o ACS vê;
- se renovação cria outra receita ou altera a data da existente.

**Status:** pendente de confirmação.

**Responsável:** equipe do projeto e profissional habilitado da ESF.

## DEC-13 — Retenção, descarte e dado real

**Contexto:** o sistema pode tratar dado pessoal e dado relacionado à saúde. Não há prazo institucional nem autorização para base real.

**Alternativas:**

- Definir um prazo numérico sem a instituição.
- Operar a demonstração só com dado fictício e revisar antes de qualquer dado real.
- Assumir conformidade com a LGPD por existir esta documentação.

**Recomendação:** seeds, testes e exemplos permanecem fictícios. Backup de ambiente com dado persistido recebe o mesmo cuidado do banco. Retenção e descarte ficam sem número até os responsáveis decidirem. Esta documentação não afirma conformidade legal.

**Status:** pendente institucional.

**Responsável:** responsáveis pela unidade ou pela instituição de ensino, conforme o uso que se pretenda dar ao sistema. A equipe do projeto evita dado real enquanto isso não ocorrer.

## DEC-14 — Desempenho e disponibilidade

**Contexto:** o ambiente de implantação e o volume de receitas não foram informados.

**Alternativas:**

- Publicar metas como 200 ms ou 99,5% sem medição.
- Paginar e calcular na leitura agora, e fixar números depois do ambiente.

**Recomendação:** não há meta numérica. A primeira versão pagina listas e mantém a classificação em um único serviço. Meta de tempo de resposta, volume e recuperação de backup serão definidas por quem operar o ambiente, antes de uso que não seja demonstração local com dado fictício.

**Status:** pendente.

**Responsável:** equipe do projeto, junto de quem for hospedar o sistema.

## O que já pode ser implementado sem nova decisão

- Fluxo P0 de [10-planejamento-sprints.md](10-planejamento-sprints.md), com as recomendações deste registro.
- Faixas 5 e 15 em configuração única, deixando claro na interface que os limites podem mudar.
- CEP manual mesmo que o adaptador espere a confirmação do provedor.
- Seed de permissão de receita restrito ao usuário fictício de demonstração.

## O que não deve ser implementado como regra fechada

- Obrigatoriedade de medicamento, tipo controlado ou prazo clínico máximo.
- WhatsApp ou outro envio externo de dados do paciente.
- Carga de CPF ou prontuário real.
- Atalho de login que grave ou exiba senha em texto puro.
- Declaração de conformidade com a LGPD baseada apenas nestes documentos.
