# 10 — Planejamento da primeira sprint

Este plano organiza a primeira versão demonstrável. Não há duração nem esforço estimados, porque a capacidade da equipe não foi informada. As histórias US01 a US10 permanecem especificadas em [02-requisitos-funcionais.md](02-requisitos-funcionais.md), mesmo quando a implementação fica para depois.

A sprint termina quando o fluxo integrado puder ser demonstrado com dados fictícios e os casos críticos tiverem sido testados. Não termina com telas estáticas desligadas da API.

## P0 — Essencial para a primeira demonstração

- Autenticação funcional: login, token, usuário inativo, rotas protegidas e autorização no servidor para as permissões já semeadas.
- Cadastro e consulta de pacientes, com CPF como primeiro campo.
- Validação do CPF pelo algoritmo e unicidade.
- Localização do CPF existente, sem criar duplicata e sem trocar o nome por engano.
- Confirmação e histórico quando o nome mudar.
- Cadastro e consulta de receitas vinculadas a um paciente existente.
- Recusa de receita para paciente inexistente.
- Cálculo automático da situação na leitura, no fuso `America/Sao_Paulo`, sem coluna de status diário.
- Dashboard com as contagens das faixas propostas e destaque visual das vencidas, com texto.
- Alertas de até 5 dias e de 6 a 15 dias, em configuração única.
- Persistência real em PostgreSQL.
- Testes do fluxo principal, cobrindo os casos P0 de [09-plano-de-testes.md](09-plano-de-testes.md).

## P1 — Importante, com implementação simplificada

- Atualização da ficha: nascimento, telefone, CEP e endereço.
- Busca automática de CEP por adaptador, com falha tratada e preenchimento manual. Se o provedor não estiver confirmado, o adaptador pode ficar desligado e o manual permanece.
- Lista de pacientes prioritários pela regra proposta da RN12.
- Registro básico de acompanhamento: data, descrição e receita opcional do mesmo paciente.
- Matriz inicial de permissões semeada conforme [DEC-10](11-decisoes-e-pendencias.md), ainda com células pendentes. A tela completa de administração não entra aqui.
- Cancelamento de receita somente se a equipe confirmar quem pode cancelar. O campo `lifecycleStatus` pode existir com valor `ATIVA`.

## P2 — Evolução futura

- Administração completa de usuários, cargos e permissões.
- Relatórios avançados e impressão.
- Integração com WhatsApp.
- Notificações externas automatizadas.
- Itens de medicamento, tipo de receita, emissão, profissional responsável e renovação estruturada, depois de [DEC-12](11-decisoes-e-pendencias.md).
- Microárea e restrição de pacientes por área do ACS, se a equipe transformar isso em requisito.
- Revogação de token antes do vencimento e política formal de senha.
- Metas numéricas de desempenho e disponibilidade, depois de [DEC-14](11-decisoes-e-pendencias.md).

## Fluxo que a demonstração precisa percorrer

1. Profissional fictício entra com usuário e senha.
2. Informa um CPF novo e cadastra o paciente.
3. Informa o mesmo CPF de novo e vê o paciente carregado, sem duplicar.
4. Atualiza um dado cadastral permitido. Se mudar o nome, confirma e o histórico registra.
5. Cadastra uma receita desse paciente.
6. Consulta a receita e vê a situação calculada.
7. Abre o dashboard e localiza vencidas e próximas do vencimento.
8. Abre a lista de prioritários e reconhece o paciente que exige acompanhamento.

Uma receita com vencimento anterior, uma que vence no dia, uma futura e uma sem data devem aparecer em grupos distintos.

## Tarefas sugeridas

A ordem abaixo reduz bloqueio. Ela não é uma estimativa.

1. Inicializar o repositório de código, o projeto NestJS, o projeto Vite e o Prisma, fora do escopo desta documentação.
2. Modelar as tabelas de [06-modelagem-de-dados.md](06-modelagem-de-dados.md), sem `PrescriptionItem`.
3. Implementar hash de senha, login e guard de permissão.
4. Implementar paciente, CPF e histórico de nome.
5. Implementar receita e o serviço único de classificação.
6. Implementar dashboard e alertas usando esse serviço.
7. Implementar ficha, CEP, acompanhamento e lista prioritária.
8. Montar o login no modelo visual do protótipo e a área interna com menu lateral.
9. Automatizar os testes P0 e percorrer o fluxo na interface.
10. Semear usuários fictícios. Não copiar senha em texto puro do protótipo.

## Dependências

- US04, US05 e US06 dependem de paciente e de login.
- Dashboard e alertas dependem da classificação.
- Lista prioritária depende das mesmas faixas do dashboard.
- CEP depende do adaptador e não bloqueia o cadastro manual.
- A permissão de cadastrar receita depende de DEC-10. Até a confirmação, usar um único usuário fictício de demonstração com `prescriptions:create` e deixar os demais papéis sem essa permissão.

## Critérios de conclusão

A primeira sprint está concluída quando todos os pontos abaixo forem verdadeiros:

- O fluxo integrado da seção anterior funciona no navegador contra a API e o PostgreSQL, com dado fictício.
- Receita vencida, vencendo hoje, com prazo acima de 15 dias e sem data produzem os resultados de CT-10, CT-11, CT-12 e CT-13.
- CPF inválido, CPF repetido e CPF duplicado produzem CT-02, CT-03 e CT-04.
- Troca de nome sem confirmação não grava; com confirmação, grava o histórico.
- Requisição sem token recebe 401. Usuário sem permissão recebe 403 sem dados do recurso.
- Senha não aparece em banco legível, em log nem em auditoria.
- A situação muda ao cruzar a data corrente sem rotina manual de atualização de status, conforme CT-48.
- Os casos P0 de [09-plano-de-testes.md](09-plano-de-testes.md) foram executados e o resultado foi registrado.
- Itens P1 não concluídos permanecem listados, sem serem tratados como prontos.
- Nenhum dado real de paciente foi carregado.

## Fora da sprint

WhatsApp, impressão em lote, gestão visual completa de permissões, medicamento obrigatório e qualquer integração com sistema oficial de saúde ficam no P2 ou em decisão pendente. O protótipo externo não deve ser alterado para “adiantar” essas funções.
