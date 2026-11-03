-- Linha de base do PostgreSQL.
-- O histórico MySQL permanece em prisma/migrations e não é reexecutado aqui.
-- O banco MySQL renova só tinha a migração init aplicada; as colunas de
-- endereço, cancelamento e a tabela de acompanhamentos entram nesta base
-- para acompanhar o schema atual. Registros antigos recebem nulo nesses campos.
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "cpf" VARCHAR(11),
    "data_nascimento" DATE,
    "telefone" VARCHAR(20),
    "cep" VARCHAR(8),
    "endereco" VARCHAR(255),
    "numero" VARCHAR(20),
    "complemento" VARCHAR(120),
    "bairro" VARCHAR(120),
    "cidade" VARCHAR(120),
    "uf" VARCHAR(2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "perfil" VARCHAR(30) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "data_emissao" DATE NOT NULL,
    "data_vencimento" DATE,
    "observacoes" TEXT,
    "cancelada_em" TIMESTAMP(3),
    "cancelada_por_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamentos" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "receita_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "ocorreu_em" DATE NOT NULL,
    "descricao" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acompanhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_receita" (
    "id" SERIAL NOT NULL,
    "receita_id" INTEGER NOT NULL,
    "nome_medicamento" VARCHAR(180) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_receita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_pacientes" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "campo_alterado" VARCHAR(100) NOT NULL,
    "valor_anterior" TEXT,
    "valor_novo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cpf_key" ON "pacientes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "receitas_data_vencimento_idx" ON "receitas"("data_vencimento");

-- CreateIndex
CREATE INDEX "receitas_paciente_id_idx" ON "receitas"("paciente_id");

-- CreateIndex
CREATE INDEX "receitas_cancelada_em_idx" ON "receitas"("cancelada_em");

-- CreateIndex
CREATE INDEX "acompanhamentos_paciente_id_ocorreu_em_idx" ON "acompanhamentos"("paciente_id", "ocorreu_em");

-- CreateIndex
CREATE INDEX "acompanhamentos_receita_id_idx" ON "acompanhamentos"("receita_id");

-- CreateIndex
CREATE INDEX "itens_receita_receita_id_idx" ON "itens_receita"("receita_id");

-- CreateIndex
CREATE INDEX "historico_pacientes_paciente_id_idx" ON "historico_pacientes"("paciente_id");

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_cancelada_por_id_fkey" FOREIGN KEY ("cancelada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos" ADD CONSTRAINT "acompanhamentos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos" ADD CONSTRAINT "acompanhamentos_receita_id_fkey" FOREIGN KEY ("receita_id") REFERENCES "receitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos" ADD CONSTRAINT "acompanhamentos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_receita" ADD CONSTRAINT "itens_receita_receita_id_fkey" FOREIGN KEY ("receita_id") REFERENCES "receitas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_pacientes" ADD CONSTRAINT "historico_pacientes_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_pacientes" ADD CONSTRAINT "historico_pacientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
