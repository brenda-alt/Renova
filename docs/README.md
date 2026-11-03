# Documentação do Renova

Esta pasta especifica o Renova antes da implementação. Os documentos usam identificadores estáveis: histórias `US`, critérios `CA`, regras `RN`, decisões `DEC`, requisitos não funcionais `RNF` e casos de teste `CT`.

A aplicação ainda não existe. O contrato em [api/openapi.yaml](api/openapi.yaml) orienta a implementação futura; ele não descreve um servidor em execução.

## Ordem de leitura

1. [01-visao-geral.md](01-visao-geral.md) — contexto, problema, público, escopo e limites.
2. [02-requisitos-funcionais.md](02-requisitos-funcionais.md) — histórias US01 a US10, critérios de aceite e prioridade.
3. [03-requisitos-nao-funcionais.md](03-requisitos-nao-funcionais.md) — qualidade, segurança, privacidade e manutenibilidade.
4. [04-regras-de-negocio.md](04-regras-de-negocio.md) — regras RN01 a RN15.
5. [05-arquitetura.md](05-arquitetura.md) — cliente-servidor, módulos e fluxos.
6. [06-modelagem-de-dados.md](06-modelagem-de-dados.md) — entidades, restrições e diagrama entidade-relacionamento.
7. [07-api.md](07-api.md) — convenções da API REST.
8. [api/openapi.yaml](api/openapi.yaml) — contrato OpenAPI 3.0.3.
9. [08-seguranca-e-lgpd.md](08-seguranca-e-lgpd.md) — controles previstos e pendências institucionais.
10. [09-plano-de-testes.md](09-plano-de-testes.md) — cenários e matriz de rastreabilidade.
11. [10-planejamento-sprints.md](10-planejamento-sprints.md) — escopo da primeira sprint e backlog.
12. [11-decisoes-e-pendencias.md](11-decisoes-e-pendencias.md) — decisões recomendadas e o que a equipe ainda precisa confirmar.

## Finalidade de cada arquivo

| Arquivo | Finalidade |
| --- | --- |
| [01-visao-geral.md](01-visao-geral.md) | Explica o problema da ESF, o objetivo do Renova, quem usa o sistema e o que está dentro ou fora do escopo. |
| [02-requisitos-funcionais.md](02-requisitos-funcionais.md) | Registra todas as histórias fornecidas, com critérios testáveis, prioridade e dependências. |
| [03-requisitos-nao-funcionais.md](03-requisitos-nao-funcionais.md) | Separa requisitos obrigatórios, recomendações e metas que ainda precisam de número ou de validação institucional. |
| [04-regras-de-negocio.md](04-regras-de-negocio.md) | Detalha a lógica de CPF, idade, endereço, vínculo da receita, vencimento, alertas, permissões, histórico e auditoria. |
| [05-arquitetura.md](05-arquitetura.md) | Define responsabilidades de front-end, back-end e banco, módulos de domínio e a sequência das requisições. |
| [06-modelagem-de-dados.md](06-modelagem-de-dados.md) | Descreve o modelo conceitual e lógico inicial do PostgreSQL e justifica o que entra na primeira versão. |
| [07-api.md](07-api.md) | Explica autenticação, datas, paginação, erros e as decisões de contrato. O detalhe de cada operação está no OpenAPI. |
| [api/openapi.yaml](api/openapi.yaml) | Contrato importável por ferramentas compatíveis com OpenAPI 3.x e pela futura Swagger UI do NestJS. |
| [08-seguranca-e-lgpd.md](08-seguranca-e-lgpd.md) | Reúne controles proporcionais ao tratamento de dados pessoais e de saúde. Não declara conformidade legal. |
| [09-plano-de-testes.md](09-plano-de-testes.md) | Liga cada história, critério, regra e endpoint aos casos de teste e ao resultado esperado. |
| [10-planejamento-sprints.md](10-planejamento-sprints.md) | Organiza P0, P1 e P2 e define como saber que a primeira demonstração está concluída. |
| [11-decisoes-e-pendencias.md](11-decisoes-e-pendencias.md) | Mantém o registro único das decisões, com alternativa, recomendação, status e responsável. |

## Rastreabilidade

A matriz completa está em [09-plano-de-testes.md](09-plano-de-testes.md). Em resumo:

- As histórias US01 a US10 estão em [02-requisitos-funcionais.md](02-requisitos-funcionais.md).
- As regras RN01 a RN15 estão em [04-regras-de-negocio.md](04-regras-de-negocio.md).
- As entidades que sustentam essas regras estão em [06-modelagem-de-dados.md](06-modelagem-de-dados.md).
- Os endpoints estão em [07-api.md](07-api.md) e em [api/openapi.yaml](api/openapi.yaml).
- Os casos CT-01 a CT-48 estão em [09-plano-de-testes.md](09-plano-de-testes.md).
- O que ainda depende da equipe está em [11-decisoes-e-pendencias.md](11-decisoes-e-pendencias.md).

## Convenção de status

- **Definida:** o enunciado do projeto já fixa a regra. A implementação deve segui-la.
- **Recomendada, pendente de confirmação:** há uma proposta concreta para destravar a primeira sprint. A equipe pode alterá-la antes do código correspondente.
- **Pendente institucional:** exige decisão de responsáveis pela unidade, pela privacidade ou pelo uso de dados reais. A documentação não fecha esse ponto.
