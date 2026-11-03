# 03 — Requisitos não funcionais

Os requisitos abaixo são adequados ao contexto de uma ESF que passará a tratar dados cadastrais e dados relacionados a receitas de saúde. Cada item está classificado como:

- **Obrigatório** — deve ser atendido na implementação do escopo correspondente.
- **Recomendação** — orientação técnica proporcional, ainda ajustável.
- **Meta pendente** — precisa de número, ambiente ou decisão institucional antes de virar critério de aceite.

Não há meta numérica de tempo de resposta nem de disponibilidade. Inventar esses números sem medição ou acordo com a equipe produziria um critério impossível de justificar. O registro dessa pendência é [DEC-14](11-decisoes-e-pendencias.md).

## RNF01 — Segurança e controle de acesso

**Classificação:** obrigatório.

O servidor autentica o usuário e autoriza cada operação. Esconder um botão na interface não substitui a verificação no NestJS ([RN13](04-regras-de-negocio.md)).

- Senha armazenada somente como hash produzido por algoritmo adaptativo. A recomendação é Argon2id; bcrypt é alternativa aceitável se a equipe padronizar a biblioteca ([DEC-01](11-decisoes-e-pendencias.md)).
- A resposta de login inválido é única para usuário inexistente, senha incorreta e usuário inativo.
- Endpoints de negócio exigem credencial válida, exceto `POST /auth/login`.
- Usuário sem permissão recebe `403`, sem corpo que descreva dados do paciente ou da receita.
- Segredos de assinatura do token ficam em configuração do ambiente, fora do código versionado.
- Logs de aplicação e trilha de auditoria não registram senha, hash de senha nem token.

## RNF02 — Proteção de dados pessoais e de saúde

**Classificação:** obrigatório no desenho; a adequação legal é pendência institucional.

O Renova trata dados pessoais, como nome, CPF, telefone e endereço, e dados relacionados à saúde, como a existência de uma receita e sua data de vencimento. Receita médica pode caracterizar dado pessoal sensível. A classificação jurídica final cabe aos responsáveis pela unidade, não a esta especificação.

Controles previstos:

- coleta limitada aos campos desta documentação;
- acesso por permissão, no servidor;
- exemplos e seeds de desenvolvimento exclusivamente fictícios;
- proibição de carregar planilhas ou cadernos reais no ambiente de demonstração acadêmica até a revisão descrita em [08-seguranca-e-lgpd.md](08-seguranca-e-lgpd.md).

Documentar esses controles não significa que a aplicação está em conformidade com a LGPD.

## RNF03 — Integridade e consistência

**Classificação:** obrigatório.

- CPF único por paciente, com validação de dígitos verificadores no servidor.
- Receita sempre associada a um paciente existente.
- Datas civis rejeitadas quando o calendário não as reconhece.
- Situação de vencimento calculada na leitura, com a mesma regra no dashboard, na lista e no detalhe.
- Alteração de nome confirmada gera registro de histórico na mesma operação.
- Falha no meio de uma operação que envolva mais de uma escrita deve desfazer o conjunto, para não gravar nome novo sem histórico, nem receita sem paciente.

## RNF04 — Usabilidade

**Classificação:** obrigatório para o fluxo principal; detalhes visuais do protótipo seguem [01-visao-geral.md](01-visao-geral.md).

- O CPF é o primeiro campo no cadastro de paciente e na localização do paciente da receita.
- Máscaras de CPF, telefone e CEP aparecem durante a digitação.
- Listas vazias explicam a ausência de registros, em vez de mostrar uma área em branco.
- Receita vencida permanece identificável por texto e por destaque visual.
- Mensagens de validação apontam o campo e o motivo, sem expor pilha de erro ou comando SQL.

## RNF05 — Acessibilidade

**Classificação:** obrigatório no básico; nível formal de conformidade é recomendação pendente.

- Campos com rótulo visível associado ao controle.
- Situação da receita anunciada por texto, não apenas por cor ([US08-CA03](02-requisitos-funcionais.md)).
- Foco visível e ordem de tabulação coerente com a leitura da tela, em especial no login e nos formulários.
- Recomendação: seguir a WCAG 2.2 nível AA como referência de revisão. O nível exato a exigir na avaliação acadêmica ainda precisa ser confirmado pela equipe.
- O protótipo possui alternância de alto contraste. Oferecer controle equivalente é recomendação para a área autenticada.

## RNF06 — Responsividade

**Classificação:** obrigatório em nível utilizável.

A interface deve poder ser usada em computador de secretaria e em tela menor, como a de um ACS em campo. O menu lateral pode recolher em viewport estreita, desde que os itens Dashboard, Receitas, Pacientes, Histórico de Acompanhamento, Alertas e Prioridades e Usuários, Cargos e Permissões continuem alcançáveis.

Não há largura mínima institucional definida. A recomendação de verificação é exercitar o fluxo principal em viewport de computador e em viewport estreita durante a implementação.

## RNF07 — Desempenho

**Classificação:** meta pendente.

A primeira versão deve calcular a situação na consulta e paginar listas, para evitar carregar a base inteira na interface. Não se fixa tempo máximo de resposta, taxa de requisições nem volume de pacientes. Esses números dependem do ambiente e da quantidade real de receitas ([DEC-14](11-decisoes-e-pendencias.md)).

Enquanto a meta não existir, o critério prático da sprint é: o fluxo demonstrável responde de forma utilizável no ambiente local, com a massa fictícia usada nos testes.

## RNF08 — Tratamento de erros

**Classificação:** obrigatório.

- A API usa os códigos HTTP documentados em [07-api.md](07-api.md).
- O corpo de erro traz um código estável e uma mensagem compreensível.
- Falha inesperada responde `500` com mensagem genérica. Detalhe interno fica no log do servidor, sem senha, token ou dado clínico desnecessário.
- Indisponibilidade do serviço de CEP não impede salvar o paciente. A interface informa que o endereço deve ser preenchido manualmente.

## RNF09 — Manutenibilidade

**Classificação:** obrigatório como prática de implementação.

- Front-end e back-end em TypeScript, com a stack definida em [05-arquitetura.md](05-arquitetura.md).
- Regras de CPF, idade, situação da receita e faixas de alerta concentradas em um módulo de domínio no back-end, coberto pelos casos de [09-plano-de-testes.md](09-plano-de-testes.md).
- Limites de 5 e 15 dias em configuração única ([US07-CA06](02-requisitos-funcionais.md)).
- Contrato OpenAPI versionado junto com o código, quando o código existir.
- Nomes de campos persistidos alinhados a [06-modelagem-de-dados.md](06-modelagem-de-dados.md) e ao contrato.

## RNF10 — Versionamento da API

**Classificação:** obrigatório.

O prefixo previsto é `/api/v1`. Mudança incompatível de contrato exige novo prefixo ou acordo explícito de versão. Correções compatíveis permanecem em `v1` e são descritas no OpenAPI.

A interface Swagger UI será servida pelo NestJS na implementação. Ela não faz parte desta entrega documental.

## RNF11 — Rastreabilidade de alterações relevantes

**Classificação:** obrigatório para os eventos listados em [RN15](04-regras-de-negocio.md).

Alteração de nome, criação e alteração de receita, cancelamento, registro de acompanhamento, login com falha ou sucesso e acesso negado geram trilha com autor, instante, tipo de evento e identificador do recurso. A trilha não é um prontuário clínico. O prazo de retenção está pendente ([DEC-13](11-decisoes-e-pendencias.md)).

## RNF12 — Disponibilidade e recuperação

**Classificação:** meta pendente, dependente do ambiente.

Não há percentual de disponibilidade nem objetivo de tempo de recuperação. Para qualquer ambiente em que dados de demonstração ou dados reais venham a persistir, a recomendação é:

- backup do PostgreSQL definido por quem operar o ambiente;
- backup protegido com o mesmo cuidado dos dados de origem;
- restauração testada antes de considerar o ambiente apto a dados reais.

Ambiente acadêmico local pode operar sem meta formal, desde que isso esteja explícito e sem dados reais. Detalhes em [08-seguranca-e-lgpd.md](08-seguranca-e-lgpd.md) e [DEC-14](11-decisoes-e-pendencias.md).

## RNF13 — Minimização e respostas da API

**Classificação:** obrigatório.

As respostas devolvem os campos necessários à história correspondente. Listas de pacientes prioritários incluem identificação útil à busca ativa, não o histórico completo nem credenciais. Nenhum endpoint devolve hash de senha, senha ou token de outro usuário.

## Rastreabilidade

| Requisito | Histórias e regras mais ligadas |
| --- | --- |
| RNF01, RNF13 | US10, RN13, RN15 |
| RNF02, RNF12 | US01, US04, DEC-13, DEC-14 |
| RNF03 | RN01, RN07, RN09 |
| RNF04, RNF05, RNF06 | US01, US05, US08 |
| RNF07, RNF10 | US05, DEC-09, DEC-14 |
| RNF08 | RN06, RN08 |
| RNF09, RNF11 | RN04, RN14, RN15 |
