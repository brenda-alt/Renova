-- AlterTable
ALTER TABLE `pacientes` ADD COLUMN `bairro` VARCHAR(120) NULL,
    ADD COLUMN `cidade` VARCHAR(120) NULL,
    ADD COLUMN `complemento` VARCHAR(120) NULL,
    ADD COLUMN `numero` VARCHAR(20) NULL,
    ADD COLUMN `uf` VARCHAR(2) NULL;

-- AlterTable
ALTER TABLE `receitas` ADD COLUMN `cancelada_em` DATETIME(3) NULL,
    ADD COLUMN `cancelada_por_id` INTEGER NULL,
    MODIFY `data_vencimento` DATE NULL;

-- CreateTable
CREATE TABLE `acompanhamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente_id` INTEGER NOT NULL,
    `receita_id` INTEGER NULL,
    `usuario_id` INTEGER NOT NULL,
    `ocorreu_em` DATE NOT NULL,
    `descricao` VARCHAR(2000) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `acompanhamentos_paciente_id_ocorreu_em_idx`(`paciente_id`, `ocorreu_em`),
    INDEX `acompanhamentos_receita_id_idx`(`receita_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `receitas_cancelada_em_idx` ON `receitas`(`cancelada_em`);

-- AddForeignKey
ALTER TABLE `receitas` ADD CONSTRAINT `receitas_cancelada_por_id_fkey` FOREIGN KEY (`cancelada_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acompanhamentos` ADD CONSTRAINT `acompanhamentos_paciente_id_fkey` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acompanhamentos` ADD CONSTRAINT `acompanhamentos_receita_id_fkey` FOREIGN KEY (`receita_id`) REFERENCES `receitas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acompanhamentos` ADD CONSTRAINT `acompanhamentos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
