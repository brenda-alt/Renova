# 02 — Requisitos funcionais

Este documento registra as histórias US01 a US10. Os identificadores e os significados originais foram preservados. US10 foi acrescentada para o login.

Cada critério de aceite tem um identificador `CA` usado na matriz de [09-plano-de-testes.md](09-plano-de-testes.md). A prioridade indica a fase de implementação proposta em [10-planejamento-sprints.md](10-planejamento-sprints.md). Ela não apaga o requisito.

Prioridades:

- **P0** — essencial para a primeira demonstração.
- **P1** — importante na primeira sprint, com implementação simplificada quando indicado.
- **P2** — evolução futura, depois da primeira demonstração.

## Grupo 1 — Cadastro e consulta de pacientes

### US01 — Cadastrar paciente

**Prioridade:** P0.

**História:** Como profissional da ESF, quero cadastrar um paciente a partir do CPF, para identificá-lo corretamente e vinculá-lo às suas receitas médicas.

**Dependências:** [US10](#us10--autenticar-usuário). Regras [RN01](04-regras-de-negocio.md), [RN02](04-regras-de-negocio.md), [RN03](04-regras-de-negocio.md) e [RN04](04-regras-de-negocio.md).

| ID | Critério de aceite |
| --- | --- |
| US01-CA01 | O CPF é o primeiro campo do formulário. |
| US01-CA02 | O sistema formata e valida o CPF automaticamente. |
| US01-CA03 | CPFs inválidos e com todos os dígitos iguais são rejeitados. |
| US01-CA04 | Se o CPF já existir, o sistema localiza o paciente e carrega seus dados. |
| US01-CA05 | Cada CPF está vinculado a um único paciente. |
| US01-CA06 | Se o nome informado for diferente do cadastrado, o sistema pede confirmação antes de alterá-lo. |
| US01-CA07 | As alterações de nome são registradas no histórico. |

A validação dos dígitos verificadores usa o algoritmo do CPF. Uma máscara ou expressão regular apenas organiza a entrada; ela não substitui o algoritmo ([RN02](04-regras-de-negocio.md)).

Quando o CPF já existe, a tela carrega o paciente. O `POST /patients` não sobrescreve o cadastro: responde conflito e devolve o identificador existente ([DEC-04](11-decisoes-e-pendencias.md)).

### US02 — Consultar pacientes

**Prioridade:** P1 para a atualização cadastral completa e para a busca de CEP. A consulta do paciente criado na US01 é necessária ao fluxo P0.

**História:** Como ACS, quero consultar e atualizar os dados cadastrais do paciente, para manter as informações necessárias ao acompanhamento das receitas médicas atualizadas.

**Dependências:** US01. Regras [RN05](04-regras-de-negocio.md) e [RN06](04-regras-de-negocio.md). Decisão [DEC-06](11-decisoes-e-pendencias.md).

| ID | Critério de aceite |
| --- | --- |
| US02-CA01 | O cadastro permite informar nome, data de nascimento, telefone, CEP e endereço. |
| US02-CA02 | O telefone é formatado automaticamente. |
| US02-CA03 | Ao informar o CEP, o sistema busca o endereço automaticamente. |
| US02-CA04 | O endereço retornado pode ser corrigido. |
| US02-CA05 | A idade é calculada automaticamente pela data de nascimento. |
| US02-CA06 | Quando a data de nascimento não está informada, o sistema indica essa ausência. |

O endereço da primeira versão compreende CEP, logradouro, número, complemento, bairro, cidade e UF. Complemento, cidade e UF acompanham o retorno usual de consulta de CEP e podem ser corrigidos junto com o restante.

A consulta de CEP é dependência externa opcional. A falha do serviço, o timeout e o CEP sem resultado permitem o preenchimento manual. O provedor recomendado é o ViaCEP, o mesmo usado no protótipo, atrás de um adaptador no back-end. A escolha definitiva permanece pendente ([DEC-06](11-decisoes-e-pendencias.md)).

Quem, além do ACS, pode alterar a ficha está pendente na matriz de permissões ([DEC-10](11-decisoes-e-pendencias.md)).

### US03 — Consultar histórico de acompanhamento

**Prioridade:** P1, em registro básico: data, descrição, paciente e, quando houver, receita relacionada.

**História:** Como profissional da ESF, quero consultar o histórico de acompanhamento do paciente, para verificar as providências tomadas em relação às receitas médicas e identificar possíveis pendências.

**Dependências:** US01. Regra [RN14](04-regras-de-negocio.md).

| ID | Critério de aceite |
| --- | --- |
| US03-CA01 | O sistema permite consultar os registros de acompanhamento vinculados ao paciente. |
| US03-CA02 | Cada registro apresenta a data e a descrição da providência realizada. |
| US03-CA03 | O histórico permite identificar as ações relacionadas à renovação das receitas. |
| US03-CA04 | Quando não há registros, o sistema informa que o paciente ainda não possui histórico de acompanhamento. |

A identificação da renovação, nesta versão, é a descrição informada pelo profissional e o vínculo opcional com uma receita. Não há fluxo automático de renovação clínica. Esse fluxo aparece no protótipo e permanece pendente ([DEC-12](11-decisoes-e-pendencias.md)).

## Grupo 2 — Gestão de receitas

### US04 — Cadastrar receita médica

**Prioridade:** P0.

**História:** Como profissional autorizado, quero cadastrar uma receita médica vinculada a um paciente, informando sua data de vencimento, para permitir o acompanhamento dos prazos e a identificação de receitas vencidas.

**Dependências:** US01 e US10. Regras [RN07](04-regras-de-negocio.md) e [RN08](04-regras-de-negocio.md).

| ID | Critério de aceite |
| --- | --- |
| US04-CA01 | O formulário permite localizar e selecionar o paciente vinculado à receita. |
| US04-CA02 | O sistema permite informar os dados necessários da receita, incluindo sua data de vencimento. |
| US04-CA03 | Os campos obrigatórios são validados antes de salvar o cadastro. |
| US04-CA04 | O sistema valida o formato e a consistência da data informada. |
| US04-CA05 | Após o cadastro, a receita é armazenada e vinculada ao paciente selecionado. |
| US04-CA06 | O sistema disponibiliza a receita para consulta e verificação de vencimento. |

O paciente é obrigatório. A data de vencimento pode ser omitida: nesse caso a receita é gravada e classificada como pendente de informação ([RN10](04-regras-de-negocio.md)). Data impossível, como dia 31 de fevereiro, é rejeitada e não é gravada.

“Profissional autorizado” depende da permissão `prescriptions:create`. A atribuição dessa permissão aos papéis está pendente ([DEC-10](11-decisoes-e-pendencias.md)).

### US05 — Consultar receitas

**Prioridade:** P0.

**História:** Como profissional da ESF, quero consultar as receitas cadastradas e suas respectivas datas de vencimento, para identificar quais estão dentro do prazo e quais já estão vencidas.

**Dependências:** US04 e US06.

| ID | Critério de aceite |
| --- | --- |
| US05-CA01 | O sistema exibe as receitas cadastradas. |
| US05-CA02 | Cada receita apresenta a identificação do paciente e sua data de vencimento. |
| US05-CA03 | O sistema permite localizar as receitas vinculadas a um paciente. |
| US05-CA04 | A situação da receita é identificada automaticamente com base na data de vencimento. |
| US05-CA05 | Receitas vencidas são destacadas visualmente para facilitar sua identificação. |
| US05-CA06 | Quando não há receitas cadastradas, o sistema informa que não existem registros disponíveis. |

### US06 — Atualizar status da receita

**Prioridade:** P0.

**História:** Como profissional da ESF, quero que o sistema identifique automaticamente a situação de cada receita com base na data de vencimento, para reconhecer as receitas vencidas sem precisar verificar manualmente cada registro.

**Dependências:** US04. Regras [RN09](04-regras-de-negocio.md) e [RN10](04-regras-de-negocio.md). Decisão [DEC-02](11-decisoes-e-pendencias.md).

| ID | Critério de aceite |
| --- | --- |
| US06-CA01 | O sistema compara a data de vencimento da receita com a data atual. |
| US06-CA02 | Quando a data de vencimento é anterior à data atual, a receita é classificada como Vencida. |
| US06-CA03 | Quando a data de vencimento é igual ou posterior à data atual, a receita é classificada como Dentro do prazo. |
| US06-CA04 | Receitas vencidas recebem um destaque visual de fácil identificação. |
| US06-CA05 | A situação é atualizada conforme a data atual, sem exigir alteração manual do status. |
| US06-CA06 | Receitas sem data de vencimento válida não são classificadas automaticamente e são identificadas como pendentes de informação. |

A situação de prazo é derivada. Ela não é gravada como coluna operacional que possa ficar desatualizada. Cancelar ou inativar uma receita, se a equipe confirmar essa ação, é outro estado, persistido à parte ([DEC-08](11-decisoes-e-pendencias.md)).

A data atual é o dia civil no fuso `America/Sao_Paulo`, calculado no servidor no momento da consulta.

## Grupo 3 — Alertas e priorização

Os critérios US07-CA, US08-CA e US09-CA são propostas testáveis. As faixas de 5 e 15 dias vêm do protótipo e permanecem pendentes de confirmação ([DEC-03](11-decisoes-e-pendencias.md), [RN11](04-regras-de-negocio.md), [RN12](04-regras-de-negocio.md)).

Quatro grupos devem permanecer distinguíveis, qualquer que seja a confirmação das faixas:

- receita vencida;
- receita próxima do vencimento;
- receita dentro do prazo;
- receita sem data válida.

### US07 — Visualizar alertas de vencimento

**Prioridade:** P0, usando a proposta de 5 e 15 dias até a equipe confirmar outro limite.

**História:** Como profissional da ESF, quero visualizar alertas de receitas próximas do vencimento, para iniciar o acompanhamento antes que o prazo termine.

**Dependências:** US06. Decisão [DEC-03](11-decisoes-e-pendencias.md).

| ID | Critério de aceite proposto |
| --- | --- |
| US07-CA01 | O dashboard exibe a quantidade de receitas ativas com vencimento na data atual ou em até 5 dias. |
| US07-CA02 | O dashboard exibe a quantidade de receitas ativas com vencimento entre 6 e 15 dias. |
| US07-CA03 | Receitas já vencidas aparecem no indicador de vencidas e não entram nas faixas de 5 ou 15 dias. |
| US07-CA04 | Receitas com vencimento acima de 15 dias e receitas sem data válida não entram nas faixas de proximidade. |
| US07-CA05 | Ao acionar um indicador, a lista correspondente mostra as mesmas receitas contadas no indicador. |
| US07-CA06 | Os limites de 5 e 15 dias são proposta pendente. A implementação deve concentrá-los em um único ponto de configuração para que a equipe possa ajustá-los sem reescrever a regra. |

Uma receita que vence na data atual permanece “Dentro do prazo” na situação base da US06 e, ao mesmo tempo, entra no alerta de até 5 dias.

### US08 — Visualizar receitas por cores

**Prioridade:** P0 para o destaque de vencidas, já exigido por US05 e US06. As demais cores seguem a proposta pendente.

**História:** Como profissional da ESF, quero visualizar as receitas com indicadores de cores, para reconhecer rapidamente os casos que precisam de atenção.

**Dependências:** US06 e US07.

| ID | Critério de aceite proposto |
| --- | --- |
| US08-CA01 | Cada grupo de situação possui indicador visual distinto: vencida, próxima em até 5 dias, próxima de 6 a 15 dias, dentro do prazo acima de 15 dias e pendente de informação. |
| US08-CA02 | A proposta de cor é: vermelho para vencida, âmbar para até 5 dias, amarelo para 6 a 15 dias, verde para dentro do prazo acima de 15 dias e cinza para pendente de informação. |
| US08-CA03 | A cor vem acompanhada de texto com a situação. O reconhecimento do caso não depende só da cor. |
| US08-CA04 | O mapeamento de cores é proposta pendente de confirmação com a equipe. |

O contraste das cores deve atender [RNF05](03-requisitos-nao-funcionais.md). O protótipo já oferece um controle de alto contraste na interface; incluí-lo na primeira versão é recomendação, não critério fechado.

### US09 — Consultar lista de pacientes prioritários

**Prioridade:** P1.

**História:** Como ACS, quero visualizar uma lista de pacientes com receitas próximas do vencimento, para organizar a busca ativa e o acompanhamento.

**Dependências:** US01, US06 e US07. Regra [RN12](04-regras-de-negocio.md).

| ID | Critério de aceite proposto |
| --- | --- |
| US09-CA01 | A lista inclui o paciente que possui ao menos uma receita ativa vencida ou com vencimento em até 15 dias, contando a data atual. |
| US09-CA02 | A ordenação usa o vencimento mais próximo do paciente. Receitas vencidas aparecem antes das que ainda vão vencer. |
| US09-CA03 | Cada item mostra o nome, o telefone quando existir e a data de vencimento mais próxima, dados necessários à busca ativa. |
| US09-CA04 | Paciente sem receita vencida e sem receita na janela de até 15 dias não aparece na lista. |
| US09-CA05 | Quando não há pacientes nessas condições, o sistema informa que não há pacientes prioritários. |
| US09-CA06 | O critério da lista é proposta pendente, alinhada a [RN12](04-regras-de-negocio.md). |

Receita cancelada, se esse estado for confirmado, não torna o paciente prioritário ([DEC-08](11-decisoes-e-pendencias.md)).

## US10 — Autenticar usuário

**Prioridade:** P0.

**História:** Como profissional autorizado, quero entrar no sistema com minhas credenciais, para acessar as funcionalidades permitidas ao meu perfil.

**Dependências:** [RN13](04-regras-de-negocio.md) e [RN15](04-regras-de-negocio.md). Decisões [DEC-01](11-decisoes-e-pendencias.md) e [DEC-10](11-decisoes-e-pendencias.md).

| ID | Critério de aceite |
| --- | --- |
| US10-CA01 | A autenticação usa usuário e senha. |
| US10-CA02 | As credenciais são validadas no servidor. |
| US10-CA03 | Senhas são armazenadas somente em formato de hash seguro. |
| US10-CA04 | A mensagem de erro não revela se o usuário existe. |
| US10-CA05 | Os endpoints que exigem autenticação rejeitam requisição sem credencial válida. |
| US10-CA06 | A autorização por perfil e permissão é aplicada no back-end. |
| US10-CA07 | A sessão se encerra ou expira conforme a estratégia definida. |
| US10-CA08 | Usuário inativo não acessa o sistema. |
| US10-CA09 | Eventos de segurança relevantes são registrados sem armazenar senhas ou tokens em logs. |

A estratégia recomendada está em [DEC-01](11-decisoes-e-pendencias.md): token JWT de acesso, com expiração, validado no NestJS. O logout da primeira versão descarta o token no cliente. Não existe, nesta versão, revogação central antes do vencimento do token.

A tela de login preserva o modelo visual descrito em [01-visao-geral.md](01-visao-geral.md).

## Papéis e matriz inicial de permissões

Os papéis abaixo são proposta. Eles não estão homologados pela equipe.

Ações da matriz: visualizar, cadastrar, editar, cancelar/inativar e administrar acessos.

Legenda:

- **Sim** — decorrente direta da história ou da definição do papel. Ainda assim, a equipe pode restringir.
- **Não** — a recomendação é negar até decisão contrária.
- **Pendente** — a célula precisa de validação. A recomendação entre parênteses serve só para um seed inicial de demonstração, se a equipe não decidir a tempo.

| Recurso e ação | Administrador | Médico ou profissional habilitado | Recepção | ACS |
| --- | --- | --- | --- | --- |
| Visualizar pacientes | Pendente (sim) | Pendente (sim) | Pendente | Sim, pela US02 |
| Cadastrar pacientes | Pendente (sim) | Pendente | Pendente | Pendente (sim, se a equipe tratar o ACS como profissional da ESF da US01) |
| Editar dados cadastrais permitidos | Pendente (sim) | Pendente | Pendente | Sim, pela US02 |
| Cancelar/inativar paciente | Pendente | Pendente (não) | Pendente (não) | Pendente (não) |
| Visualizar receitas | Pendente (sim) | Pendente (sim) | Pendente | Pendente (sim, pela US05) |
| Cadastrar receita | Pendente | Pendente (sim, somente se a equipe autorizar o papel) | Pendente (não) | Pendente (não) |
| Editar dados permitidos da receita | Pendente | Pendente | Pendente (não) | Pendente (não) |
| Cancelar/inativar receita | Pendente | Pendente | Pendente (não) | Pendente (não) |
| Visualizar acompanhamento | Pendente (sim) | Pendente | Pendente | Sim, pela US03 |
| Registrar acompanhamento | Pendente (sim) | Pendente | Pendente | Pendente (sim) |
| Visualizar dashboard, alertas e prioritários | Pendente (sim) | Pendente | Pendente | Sim para a lista prioritária, pela US09; dashboard e alertas pendentes (sim) |
| Administrar acessos | Sim | Não | Não | Não |

Nenhuma célula “Pendente (sim)” autoriza, por si, emitir, alterar ou cancelar receita. A permissão de acesso também não comprova habilitação profissional para o ato.

Códigos recomendados para o back-end, sujeitos à mesma confirmação:

| Código | Ação |
| --- | --- |
| `patients:read` | Visualizar pacientes |
| `patients:create` | Cadastrar pacientes |
| `patients:update` | Editar dados cadastrais |
| `patients:deactivate` | Cancelar ou inativar paciente |
| `prescriptions:read` | Visualizar receitas |
| `prescriptions:create` | Cadastrar receita |
| `prescriptions:update` | Editar campos permitidos da receita |
| `prescriptions:cancel` | Cancelar ou inativar receita |
| `followups:read` | Visualizar acompanhamento |
| `followups:create` | Registrar acompanhamento |
| `dashboard:read` | Visualizar dashboard, alertas e prioritários |
| `access:admin` | Administrar usuários, cargos e permissões |

A administração completa de usuários, cargos e permissões é P2. Na primeira sprint, a matriz pode ser semeada e consultada, sem tela completa de gestão ([10-planejamento-sprints.md](10-planejamento-sprints.md)).

## Requisitos relacionados que permanecem no backlog

Estes itens aparecem no protótipo ou no planejamento e não substituem as histórias acima:

- integração com WhatsApp e outras notificações externas: P2;
- relatórios avançados e impressão: P2;
- tela completa de usuários, cargos e permissões: P2;
- itens de medicamento, tipo de receita, emissão, profissional responsável e renovação automática: pendentes em [DEC-12](11-decisoes-e-pendencias.md).

## Mapa rápido história–regra–fase

| História | Regras principais | Fase |
| --- | --- | --- |
| US01 | RN01, RN02, RN03, RN04 | P0 |
| US02 | RN05, RN06 | P1, com consulta básica no fluxo P0 |
| US03 | RN14 | P1 |
| US04 | RN07, RN08 | P0 |
| US05 | RN09, RN10 | P0 |
| US06 | RN09, RN10 | P0 |
| US07 | RN11 | P0, faixas pendentes |
| US08 | RN09, RN11 | P0, cores pendentes |
| US09 | RN12 | P1, critério pendente |
| US10 | RN13, RN15 | P0 |
