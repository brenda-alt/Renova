# Renova

Sistema de gestão de receitas médicas e acompanhamento de vencimentos, destinado ao contexto de uma Estratégia Saúde da Família (ESF).

O Renova centraliza o cadastro de pacientes e receitas, acompanha datas de vencimento, apresenta alertas visuais e organiza as providências da equipe. O objetivo é reduzir a dependência de cadernos, papéis, planilhas e consultas manuais.

**Status atual:** especificação funcional e técnica. A aplicação ainda não foi implementada. Não há front-end, back-end, banco de dados, migrations nem ambiente de execução neste repositório.

## Tecnologias previstas

| Camada | Tecnologia |
| --- | --- |
| Front-end | React, TypeScript e Vite |
| Back-end | Node.js, NestJS e TypeScript |
| Banco de dados | PostgreSQL |
| ORM | Prisma |
| Contrato da API | OpenAPI 3.0.3, com visualização futura por Swagger UI |
| Controle de versão | Git e GitHub |

A arquitetura prevista é cliente-servidor: o front-end consome uma API REST do NestJS. As decisões ainda abertas estão em [docs/11-decisoes-e-pendencias.md](docs/11-decisoes-e-pendencias.md).

## Documentação

A especificação completa está em [docs/README.md](docs/README.md). Ordem recomendada para quem for implementar:

1. [Visão geral](docs/01-visao-geral.md)
2. [Requisitos funcionais](docs/02-requisitos-funcionais.md)
3. [Regras de negócio](docs/04-regras-de-negocio.md)
4. [Modelagem de dados](docs/06-modelagem-de-dados.md)
5. [API](docs/07-api.md) e o contrato [docs/api/openapi.yaml](docs/api/openapi.yaml)
6. [Planejamento da primeira sprint](docs/10-planejamento-sprints.md)

## Requisitos para a execução futura

Estes itens descrevem o ambiente previsto para quando a implementação começar. Nenhum deles está instalado ou configurado nesta etapa.

- Node.js em versão LTS compatível com NestJS e Vite no momento da implementação.
- PostgreSQL acessível ao back-end.
- Gerenciador de pacotes do ecossistema Node.js.
- Git, para versionar o código quando o repositório for inicializado.

Comandos de instalação, variáveis de ambiente e scripts de subida da aplicação serão definidos na sprint de implementação. Este repositório, hoje, contém apenas documentação.

## Protótipo visual

As etapas de empatia, definição, ideação e prototipação já foram concluídas. O protótipo de referência fica fora deste repositório, em `care-calm-clarity-main/src/renova/document.html`. Ele não deve ser alterado nem copiado para cá. A tela de login da aplicação deve preservar o modelo visual desse protótipo. A área interna deve usar menu lateral, conforme [docs/01-visao-geral.md](docs/01-visao-geral.md).

## Dados de exemplo

Os exemplos da documentação são fictícios. Eles não representam pacientes, profissionais, senhas ou prontuários reais.
# Dependências
node_modules/

# Variáveis de ambiente
.env
.env.*
!.env.example

# Builds
dist/
build/
coverage/

# Logs
*.log

# Dados locais do PostgreSQL
data/
pg_wal/
postmaster.pid