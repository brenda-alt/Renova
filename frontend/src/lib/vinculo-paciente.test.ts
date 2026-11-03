import { describe, expect, it } from 'vitest';
import { resolverVinculo, type PacienteBusca } from './vinculo-paciente';

const maria: PacienteBusca = {
  id: '7',
  fullName: 'Maria Helena',
  cpf: '529.982.247-25',
};
const outraMaria: PacienteBusca = {
  id: '8',
  fullName: 'Maria Helena',
  cpf: '153.509.460-56',
};
const semDocumento: PacienteBusca = {
  id: '9',
  fullName: 'João Sem Documento',
  cpf: null,
};

const base = {
  cpf: '',
  nome: '',
  cpfConsultado: false,
  nomeConsultado: false,
};

describe('resolverVinculo', () => {
  it('vincula pelo CPF cadastrado mesmo quando o nome digitado é outro', () => {
    const vinculo = resolverVinculo({
      ...base,
      cpf: '52998224725',
      nome: 'Outra pessoa',
      cpfConsultado: true,
      buscaCpf: [maria],
    });

    expect(vinculo).toEqual({ status: 'vinculado', paciente: maria });
  });

  it('pede o cadastro quando o CPF válido não existe', () => {
    const vinculo = resolverVinculo({
      ...base,
      cpf: '529.982.247-25',
      cpfConsultado: true,
      buscaCpf: [],
    });

    expect(vinculo.status).toBe('ausente');
    if (vinculo.status === 'ausente') {
      expect(vinculo.message).toContain('Cadastre o paciente');
    }
  });

  it('rejeita CPF inválido e não usa o nome para substituir o documento', () => {
    const vinculo = resolverVinculo({
      ...base,
      cpf: '111.111.111-11',
      nome: 'Maria Helena',
      nomeConsultado: true,
      buscaNome: [maria],
      totalNome: 1,
    });

    expect(vinculo.status).toBe('cpf-invalido');
  });

  it('não vincula nome enquanto o CPF ainda está incompleto', () => {
    const vinculo = resolverVinculo({
      ...base,
      cpf: '529',
      nome: 'Maria Helena',
      nomeConsultado: true,
      buscaNome: [maria],
      totalNome: 1,
    });

    expect(vinculo).toEqual({ status: 'aguardando' });
  });

  it('vincula um único nome e deixa nomes iguais para escolha', () => {
    const unico = resolverVinculo({
      ...base,
      nome: 'joão',
      nomeConsultado: true,
      buscaNome: [semDocumento],
      totalNome: 1,
    });
    const ambiguo = resolverVinculo({
      ...base,
      nome: 'Maria',
      nomeConsultado: true,
      buscaNome: [maria, outraMaria],
      totalNome: 2,
    });
    const escolhido = resolverVinculo({
      ...base,
      nome: 'Maria Helena',
      nomeConsultado: true,
      buscaNome: [maria, outraMaria],
      totalNome: 2,
      escolhaId: '8',
    });

    expect(unico).toEqual({ status: 'vinculado', paciente: semDocumento });
    expect(ambiguo.status).toBe('ambiguo');
    expect(escolhido).toEqual({ status: 'vinculado', paciente: outraMaria });
  });
});
