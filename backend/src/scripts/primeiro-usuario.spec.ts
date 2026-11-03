import { validarPrimeiroUsuario } from './primeiro-usuario';

describe('validarPrimeiroUsuario', () => {
  const completo = {
    nome: 'Ana Souza',
    email: 'Ana.Souza@example.com',
    senha: 'senha-ficticia',
    perfil: 'ADMIN',
  };

  it('normaliza o e-mail e aceita o primeiro cadastro', () => {
    const resultado = validarPrimeiroUsuario(completo);

    expect(resultado).toEqual({
      ok: true,
      dados: {
        nome: 'Ana Souza',
        email: 'ana.souza@example.com',
        senha: 'senha-ficticia',
        perfil: 'ADMIN',
      },
    });
  });

  it('recusa duplicidade sem devolver a senha', () => {
    const resultado = validarPrimeiroUsuario({
      ...completo,
      emailJaExiste: true,
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.motivo).toContain('Nenhum registro foi alterado');
      expect(resultado.motivo).not.toContain('senha-ficticia');
    }
  });

  it('recusa dados ausentes, perfil fora da lista e senha fora do limite', () => {
    expect(validarPrimeiroUsuario({ nome: 'Ana' }).ok).toBe(false);
    expect(validarPrimeiroUsuario({ ...completo, perfil: 'ACS' }).ok).toBe(false);
    expect(validarPrimeiroUsuario({ ...completo, senha: 'curta' }).ok).toBe(false);
    expect(
      validarPrimeiroUsuario({ ...completo, email: 'sem-arroba' }).ok,
    ).toBe(false);
  });
});
