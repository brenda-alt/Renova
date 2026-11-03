# Backend do Renova

Ambiente NestJS do Renova. O Prisma ORM 7 usa PostgreSQL. O contrato OpenAPI continua sendo servido pelo Scalar.

O contrato continua em [`../docs/api/openapi.yaml`](../docs/api/openapi.yaml). Este backend não gera outra especificação. O Scalar carrega esse YAML.

## Requisitos

- Node.js 20 ou superior. O ambiente usado na configuração foi Node.js 24.
- npm.
- PostgreSQL 18, com o banco `renova` em `127.0.0.1:5433`. O cluster do Renova fica em `C:\Users\brend\PostgreSQL\renova\data`. O serviço PostgreSQL já instalado na porta 5432 não é usado pela API e não foi alterado.
- O MySQL 8.4 e o banco `renova` original permanecem no ar como cópia de recuperação.

## Prisma e PostgreSQL

O Prisma ORM e o Prisma Client estão na versão 7.10.1. A conexão não fica no `schema.prisma`: o Prisma 7 lê `DATABASE_URL` em `prisma.config.ts`. O provider é `postgresql`. O cliente é gerado em `src/generated/prisma` e usa `@prisma/adapter-pg`.

As migrações ativas ficam em `prisma/migrations-postgresql`. A história criada para MySQL continua em `prisma/migrations` e não é aplicada no PostgreSQL.

O arquivo `.env.example` mostra a forma da URL. No `.env` local, `DATABASE_URL` aponta para o PostgreSQL e `MYSQL_DATABASE_URL` guarda o acesso antigo. Se a senha tiver `@`, `:`, `/` ou outro caractere reservado, codifique-o na URL.

Para subir o cluster depois de reiniciar o Windows, na pasta dos binários do PostgreSQL 18:

```bash
pg_ctl start -D C:\Users\brend\PostgreSQL\renova\data -l C:\Users\brend\PostgreSQL\renova\server.log -w
```

Antes de compilar em uma cópia nova do projeto:

```bash
npx prisma validate
npx prisma generate
```

`prisma validate` confere o schema e a configuração. `prisma generate` só grava o cliente em `src/generated/prisma`. Nenhum dos dois deve ser confundido com `prisma migrate` ou `prisma db push`, que alteram o banco e não fazem parte desta etapa.

O `PrismaService` fica disponível para injeção. Ele não chama `$connect()` na subida, então a documentação abre mesmo antes da primeira consulta. A primeira consulta ao banco só ocorre quando uma rota protegida usa o PostgreSQL.

## Instalação

Na pasta `backend`:

```bash
npm install
```

## Inicialização

Ainda na pasta `backend`:

```bash
npm run start:dev
```

O comando precisa ser executado em `backend/`, porque o processo localiza o contrato em `../docs/api/openapi.yaml`.

Outros scripts:

- `npm run build` compila para `backend/dist`.
- `npm start` sobe a versão compilada pelo Nest CLI.
- `npm run start:prod` executa `node dist/main.js` depois do build, também a partir de `backend/`.

## Documentação interativa

Com o processo no ar:

- Scalar: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- Arquivo original, servido sem regravação: [http://localhost:3000/api/openapi.yaml](http://localhost:3000/api/openapi.yaml)

A rota `/api/openapi.yaml` só entrega o arquivo de documentação. As operações de negócio usam o prefixo `/api/v1`.

Os controllers seguem `docs/api/openapi.yaml`. Não substituir esse arquivo por um documento gerado automaticamente com `SwaggerModule.createDocument` enquanto o contrato manual for a fonte da verdade.
