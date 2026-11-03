import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { validarPrimeiroUsuario } from './primeiro-usuario';

function conflitoUnico(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL não está definida. Nenhum usuário foi criado.');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  try {
    const emailInformado = process.env.SEED_USUARIO_EMAIL?.trim().toLowerCase();
    const existente = emailInformado
      ? await prisma.usuario.findUnique({
          where: { email: emailInformado },
          select: { id: true },
        })
      : null;

    const validacao = validarPrimeiroUsuario({
      nome: process.env.SEED_USUARIO_NOME,
      email: process.env.SEED_USUARIO_EMAIL,
      senha: process.env.SEED_USUARIO_SENHA,
      perfil: process.env.SEED_USUARIO_PERFIL,
      emailJaExiste: existente !== null,
    });

    if (!validacao.ok) {
      console.error(validacao.motivo);
      process.exitCode = 1;
      return;
    }

    const senhaHash = await hash(validacao.dados.senha, 12);

    try {
      const usuario = await prisma.usuario.create({
        data: {
          nome: validacao.dados.nome,
          email: validacao.dados.email,
          senhaHash,
          perfil: validacao.dados.perfil,
        },
        select: {
          id: true,
          email: true,
          perfil: true,
        },
      });

      console.log(
        `Usuário criado. id=${usuario.id} email=${usuario.email} perfil=${usuario.perfil}`,
      );
    } catch (error) {
      if (conflitoUnico(error)) {
        console.error(
          'Usuário já cadastrado com esse e-mail. Nenhum registro foi alterado.',
        );
        process.exitCode = 1;
        return;
      }

      console.error('Não foi possível criar o usuário. Nenhum registro foi alterado.');
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('Não foi possível criar o usuário.');
    process.exitCode = 1;
  });
}
