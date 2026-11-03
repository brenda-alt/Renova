-- Campos aditivos. Receitas já gravadas ficam com tipo nulo.
-- Itens antigos, se existirem, recebem dosagem e quantidade vazias e os três períodos desmarcados.
ALTER TABLE "receitas" ADD COLUMN "tipo_receita" VARCHAR(20);

ALTER TABLE "receitas" ADD CONSTRAINT "receitas_tipo_receita_check"
  CHECK ("tipo_receita" IS NULL OR "tipo_receita" IN ('COMUM', 'CONTROLADA'));

ALTER TABLE "itens_receita" ADD COLUMN "dosagem" VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE "itens_receita" ADD COLUMN "quantidade" VARCHAR(40) NOT NULL DEFAULT '';
ALTER TABLE "itens_receita" ADD COLUMN "uso_manha" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "itens_receita" ADD COLUMN "uso_tarde" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "itens_receita" ADD COLUMN "uso_noite" BOOLEAN NOT NULL DEFAULT false;
