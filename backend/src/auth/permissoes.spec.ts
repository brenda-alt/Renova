import { PERMISSOES, permissoesEfetivas } from './permissoes';

describe('permissoesEfetivas', () => {
  it('entrega ao ADMIN todas as permissões do catálogo', () => {
    expect(permissoesEfetivas('ADMIN')).toEqual([...PERMISSOES]);
    expect(permissoesEfetivas(' ADMIN ')).toEqual([...PERMISSOES]);
  });

  it('não entrega o catálogo ao PROFISSIONAL nem a perfil desconhecido', () => {
    expect(permissoesEfetivas('PROFISSIONAL')).toEqual([]);
    expect(permissoesEfetivas('ACS')).toEqual([]);
    expect(permissoesEfetivas('PROFISSIONAL')).not.toEqual([...PERMISSOES]);
  });
});
