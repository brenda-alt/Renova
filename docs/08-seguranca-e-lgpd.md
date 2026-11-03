# 08 — Segurança e LGPD

Este documento reúne controles proporcionais ao Renova. Segui-los na implementação melhora a proteção. Isso não declara que o sistema, a unidade ou o projeto acadêmico está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD) nem com normas de saúde.

Antes de qualquer uso com dados reais, os responsáveis pela instituição precisam revisar base legal, papéis de operador e controlador, contrato com hospedagem, retenção e o enquadramento dos dados de receita. Essa revisão é pendência institucional ([DEC-13](11-decisoes-e-pendencias.md)).

## Dados tratados

| Dado | Natureza no desenho | Onde vive |
| --- | --- | --- |
| Usuário, nome do profissional e hash de senha | Credencial e dado pessoal do operador | `User` |
| CPF, nome, nascimento, telefone e endereço | Dados pessoais do paciente | `Patient` e `PatientNameHistory` |
| Existência da receita, vencimento e observação | Dados relacionados à saúde; a observação pode ampliar o risco | `Prescription` |
| Descrição do acompanhamento | Pode revelar condição de saúde | `FollowUp` |
| Trilha de auditoria | Dado pessoal de rastreio | `AuditLog` |

A especificação não coleta CNS, CID, resultado de exame nem prontuário amplo. Incluir esses dados exigiria nova análise.

## Princípio do menor privilégio

Cada papel recebe somente as permissões necessárias. A matriz ainda tem células pendentes ([DEC-10](11-decisoes-e-pendencias.md)). Enquanto a equipe não confirmar, a recomendação de seed é conservadora:

- Administrador administra acessos e pode operar o cadastro necessário à demonstração.
- ACS consulta e atualiza a ficha permitida, consulta receitas, vê a lista prioritária e registra acompanhamento se a equipe mantiver a recomendação.
- Cadastrar, editar ou cancelar receita não é concedido a todos os papéis. A permissão fica desligada até a confirmação, exceto em um usuário fictício de demonstração explicitamente marcado como profissional autorizado no seed.

A interface pode ocultar ações não permitidas. O back-end recusa a ação mesmo assim.

## Autorização no servidor

Toda operação exceto o login passa por autenticação e por checagem de permissão no NestJS ([RN13](04-regras-de-negocio.md)). `403` não devolve o recurso. Identificador de paciente em poder de quem não tem permissão de leitura não serve como canal de consulta.

Não há, nesta especificação, separação por microárea. Se a equipe exigir que o ACS veja apenas pacientes da sua área, isso será requisito novo, com impacto em modelo e testes. O protótipo mostra microárea, mas as histórias não impõem esse filtro.

## Proteção das credenciais

- Senha somente como hash Argon2id ou, se a equipe padronizar, bcrypt ([DEC-01](11-decisoes-e-pendencias.md)).
- O hash usa sal próprio por senha, no formato que a biblioteca já produz.
- Senha não é registrada em log, auditoria, exemplo de API nem mensagem de erro.
- O token JWT não entra em log. O cliente o guarda em memória da aplicação. Guardar em `localStorage` é desaconselhado por causa de exposição a script da página; a recomendação é memória volátil na primeira versão, ciente de que o recarregamento pede novo login. Cookie `HttpOnly` e `Secure` é alternativa mais forte e fica como evolução se a equipe quiser sessão de navegador.
- O segredo de assinatura é longo, aleatório e fornecido por variável de ambiente.
- Usuário inativo recebe a mesma resposta de login inválido.

Não há política institucional de tamanho mínimo de senha, expiração de senha nem bloqueio por tentativas. A recomendação técnica, pendente, é exigir ao menos 8 caracteres no cadastro administrativo futuro e limitar tentativas de login quando o sistema for exposto fora da máquina local. Esses números não são requisito fechado.

## Transporte

Em ambiente publicado, o tráfego usa HTTPS. Cookie, se for adotado depois, usa o atributo `Secure`. Ambiente local de desenvolvimento pode usar HTTP apenas na própria máquina, sem dados reais.

## Validação de entrada

O servidor valida tipo, tamanho, data civil, CPF pelo algoritmo, existência de chaves estrangeiras e campos permitidos no `PATCH`. O front-end repete a validação de máscara para orientar o profissional. Confiar só no front-end não atende [RNF01](03-requisitos-nao-funcionais.md).

Tamanhos máximos recomendados, para evitar payload abusivo: nome 200 caracteres, observação e descrição de acompanhamento 2000 caracteres, usuário 80 caracteres. São limites técnicos de implementação, não regras de negócio da ESF.

## Acesso a pacientes e receitas

Não existe endpoint público de listagem. Busca por CPF e listagens exigem permissão. A resposta de lista prioritária traz os campos da US09, não a ficha completa nem os acompanhamentos.

Erro de paciente inexistente e erro de CPF inválido permanecem distintos ([DEC-04](11-decisoes-e-pendencias.md)), porque o profissional autenticado precisa corrigir a digitação. A mensagem de CPF inválido não confirma existência de cadastro.

## Auditoria

Os eventos de [RN15](04-regras-de-negocio.md) cobrem login, acesso negado, paciente, troca de nome, receita e acompanhamento. O resumo do log é operacional. Exemplo aceitável: “Nome do paciente atualizado após confirmação.” Exemplo incompatível com esta especificação: registrar a senha apresentada, o token ou o corpo completo da requisição.

## Minimização

Formulários não pedem dado sem história que o use. Medicamento, CID e documento clínico ficam de fora até [DEC-12](11-decisoes-e-pendencias.md). Seeds, capturas de tela e a documentação usam pessoas fictícias, como Maria Helena Fictícia e o CPF de exemplo `529.982.247-25`, marcado como fictício.

## Retenção e descarte

Não há prazo definido para paciente, receita, acompanhamento ou auditoria. Alternativas a discutir com os responsáveis:

- manter enquanto a equipe usar o Renova no acompanhamento daquela receita e revisar periodicamente;
- alinhar o prazo ao arquivo da unidade, se o Renova vier a substituir um controle oficial;
- em projeto acadêmico, apagar a base ao encerrar a disciplina, desde que ela só tenha dados fictícios.

A recomendação até lá: não gravar dado real; documentar no ambiente de demonstração que a base é fictícia e descartável. Registro formal em [DEC-13](11-decisoes-e-pendencias.md).

## Backups

Quem operar um ambiente com dados persistidos protege o backup com controle de acesso equivalente ao do banco e impede que o arquivo circule em pasta pessoal sem necessidade. Restauração deve ser ensaiada antes de qualquer conversa sobre dado real. Ambiente só com dado fictício na máquina de desenvolvimento pode ficar sem rotina formal, e isso deve estar explícito para a equipe ([RNF12](03-requisitos-nao-funcionais.md)).

## Erros

Resposta `500` usa mensagem genérica, como “Não foi possível concluir a operação.” Stack trace, nome de tabela e string de conexão ficam no log do servidor, com o mesmo cuidado de não registrar segredo.

## Cuidados específicos com saúde

- Tratar a receita como informação de saúde mesmo na demonstração.
- Evitar o campo `notes` para descrever diagnóstico.
- Não enviar vencimento ou nome de paciente a serviço externo. A consulta de CEP envia apenas o CEP ([DEC-06](11-decisoes-e-pendencias.md)).
- Não acoplar WhatsApp nesta versão. Notificação externa levaria dado pessoal a outro operador e exige decisão própria, hoje classificada como P2.

## O que a instituição ainda precisa avaliar

- Quem é o controlador dos dados e qual é a base legal se o sistema sair do exercício acadêmico.
- Se receita, mesmo sem CID, será tratada como dado pessoal sensível no entendimento da instituição.
- Se estudantes podem acessar ambiente com dado real. A recomendação desta especificação é que não acessem.
- Onde o PostgreSQL ficará hospedado e quem administra backup.
- Prazo de retenção e procedimento de descarte.
- Se há obrigação de registro em sistemas oficiais que o Renova não substitui.
- Necessidade de termo, política de senha e registro de operadores da unidade.

Enquanto essas respostas não existirem, a implementação segue com dados fictícios e com os controles técnicos deste documento.
