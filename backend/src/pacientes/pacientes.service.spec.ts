import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PacientesService } from './pacientes.service';

describe('PacientesService', () => {
  let service: PacientesService;
  const findMany = jest.fn();
  const count = jest.fn();
  const findUnique = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const historicoCreate = jest.fn();
  const transaction = jest.fn();

  const registro = {
    id: 7,
    nome: 'Maria Helena',
    cpf: '52998224725',
    dataNascimento: new Date('1984-03-12T00:00:00.000Z'),
    telefone: '11988887777',
    cep: '01310000',
    endereco: 'Rua das Acácias',
    numero: null,
    complemento: null,
    bairro: null,
    cidade: null,
    uf: null,
    createdAt: new Date('2026-10-18T18:00:00.000Z'),
    updatedAt: new Date('2026-10-18T18:00:00.000Z'),
  };

  beforeEach(async () => {
    findMany.mockReset();
    count.mockReset();
    findUnique.mockReset();
    create.mockReset();
    update.mockReset();
    historicoCreate.mockReset();
    transaction.mockReset();
    findMany.mockResolvedValue([registro]);
    count.mockResolvedValue(1);
    findUnique.mockResolvedValue(null);
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        paciente: { update },
        historicoPaciente: { create: historicoCreate },
      }),
    );
    update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...registro,
      ...data,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacientesService,
        {
          provide: PrismaService,
          useValue: {
            paciente: { findMany, count, findUnique, create, update },
            historicoPaciente: { create: historicoCreate },
            $transaction: transaction,
          },
        },
      ],
    }).compile();

    service = module.get(PacientesService);
  });

  it('usa página 1, tamanho 20 e nome crescente quando os parâmetros faltam', async () => {
    await service.listar({});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { nome: 'asc' },
        skip: 0,
        take: 20,
      }),
    );
    expect(count).toHaveBeenCalledWith({ where: {} });
  });

  it('aplica paginação, ordenação, nome e CPF normalizado', async () => {
    await service.listar({
      page: 2,
      pageSize: 10,
      sort: '-createdAt',
      name: '  maria  ',
      cpf: '529.982.247-25',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          cpf: '52998224725',
          nome: { contains: 'maria', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('devolve lista vazia para CPF válido sem cadastro', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    await expect(service.listar({ cpf: '111.444.777-35' })).resolves.toEqual({
      data: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
  });

  it('rejeita CPF inválido antes de consultar', async () => {
    await expect(service.listar({ cpf: '111.111.111-11' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('mapeia o paciente persistido para o formato da lista', async () => {
    const resultado = await service.listar({});
    const paciente = resultado.data[0];

    expect(paciente).toMatchObject({
      id: '7',
      cpf: '529.982.247-25',
      fullName: 'Maria Helena',
      birthDate: '1984-03-12',
      phone: '(11) 98888-7777',
      postalCode: '01310-000',
      street: 'Rua das Acácias',
      addressNumber: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      active: true,
      age: { status: 'CALCULADA' },
    });
    expect(paciente).not.toHaveProperty('senhaHash');
    expect(resultado).toMatchObject({ page: 1, pageSize: 20, total: 1 });
  });

  it('cadastra paciente válido gravando somente os dígitos', async () => {
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 15,
      nome: data.nome,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero ?? null,
      complemento: data.complemento ?? null,
      bairro: data.bairro ?? null,
      cidade: data.cidade ?? null,
      uf: data.uf ?? null,
      createdAt: new Date('2026-10-18T18:00:00.000Z'),
      updatedAt: new Date('2026-10-18T18:00:00.000Z'),
    }));

    const resposta = await service.criar({
      cpf: '529.982.247-25',
      fullName: 'Maria Helena',
      birthDate: '1984-03-12',
      phone: '(11) 98888-7777',
      postalCode: '01310-000',
      street: 'Rua das Acácias',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        nome: 'Maria Helena',
        cpf: '52998224725',
        dataNascimento: new Date('1984-03-12T00:00:00.000Z'),
        telefone: '11988887777',
        cep: '01310000',
        endereco: 'Rua das Acácias',
        numero: null,
        complemento: null,
        bairro: null,
        cidade: null,
        uf: null,
      },
      select: expect.any(Object),
    });
    expect(resposta).toMatchObject({
      id: '15',
      cpf: '529.982.247-25',
      fullName: 'Maria Helena',
      birthDate: '1984-03-12',
      phone: '(11) 98888-7777',
      postalCode: '01310-000',
      street: 'Rua das Acácias',
      addressNumber: null,
      state: null,
    });
    expect(resposta.id).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('recusa CPF inválido sem gravar', async () => {
    await expect(
      service.criar({ cpf: '111.111.111-11', fullName: 'Maria Helena' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('recusa CPF duplicado sem atualizar o paciente', async () => {
    findUnique.mockResolvedValue({ id: 9 });

    try {
      await service.criar({ cpf: '529.982.247-25', fullName: 'Outra Pessoa' });
      throw new Error('O cadastro duplicado deveria ter sido recusado.');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        code: 'CPF_ALREADY_EXISTS',
        message: 'Já existe um paciente cadastrado com este CPF.',
        existingPatientId: '9',
      });
    }

    expect(create).not.toHaveBeenCalled();
  });

  it('recusa data de nascimento futura sem gravar', async () => {
    await expect(
      service.criar({
        cpf: '529.982.247-25',
        fullName: 'Maria Helena',
        birthDate: '2999-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('transforma conflito único concorrente em 409 sem sobrescrever', async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 21 });
    create.mockRejectedValue({ code: 'P2002' });

    try {
      await service.criar({ cpf: '529.982.247-25', fullName: 'Maria Helena' });
      throw new Error('O conflito único deveria ter sido recusado.');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: 'CPF_ALREADY_EXISTS',
        existingPatientId: '21',
      });
    }
  });

  it('grava o endereço decomposto nas colunas próprias', async () => {
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 15,
      nome: data.nome,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      createdAt: new Date('2026-10-18T18:00:00.000Z'),
      updatedAt: new Date('2026-10-18T18:00:00.000Z'),
    }));

    const resposta = await service.criar({
      cpf: '529.982.247-25',
      fullName: 'Maria Helena',
      street: 'Rua das Acácias',
      addressNumber: '120',
      city: 'Cidade Exemplo',
      state: 'sp',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          endereco: 'Rua das Acácias',
          numero: '120',
          cidade: 'Cidade Exemplo',
          uf: 'SP',
        }),
      }),
    );
    expect(resposta).toMatchObject({
      addressNumber: '120',
      city: 'Cidade Exemplo',
      state: 'SP',
    });
  });

  it('consulta o paciente pelo identificador inteiro', async () => {
    findUnique.mockResolvedValue(registro);

    await expect(service.obter('7')).resolves.toMatchObject({
      id: '7',
      fullName: 'Maria Helena',
      cpf: '529.982.247-25',
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 7 }, select: expect.any(Object) });
  });

  it('responde 404 para identificador ausente ou incompatível com o inteiro', async () => {
    await expect(service.obter('1f2e3d4c-5b6a-4789-8c0d-1e2f3a4b5c6d')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findUnique).not.toHaveBeenCalled();

    findUnique.mockResolvedValue(null);
    await expect(service.obter('99')).rejects.toBeInstanceOf(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });

  it('atualiza só o telefone e preserva os campos omitidos', async () => {
    findUnique.mockResolvedValue(registro);

    const resposta = await service.atualizar('7', { phone: '(11) 97777-6666' }, 4);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: { telefone: '11977776666' },
      }),
    );
    expect(historicoCreate).not.toHaveBeenCalled();
    expect(resposta.fullName).toBe('Maria Helena');
    expect(resposta.phone).toBe('(11) 97777-6666');
  });

  it('limpa o telefone quando o campo vem nulo', async () => {
    findUnique.mockResolvedValue(registro);

    await service.atualizar('7', { phone: null }, 4);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { telefone: null } }),
    );
  });

  it('não grava quando a data de nascimento é futura', async () => {
    await expect(
      service.atualizar('7', { birthDate: '2999-01-01' }, 4),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('exige confirmação para nome diferente e não grava sem ela', async () => {
    findUnique.mockResolvedValue(registro);

    try {
      await service.atualizar('7', { fullName: 'Maria Helena Souza' }, 4);
      throw new Error('A troca de nome deveria ter sido recusada.');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        code: 'NAME_CHANGE_CONFIRMATION_REQUIRED',
        message: 'O nome informado difere do cadastro. Confirme a alteração para continuar.',
        currentName: 'Maria Helena',
        informedName: 'Maria Helena Souza',
      });
    }

    expect(transaction).not.toHaveBeenCalled();
  });

  it('grava o nome confirmado e o histórico na mesma transação', async () => {
    findUnique.mockResolvedValue(registro);

    await service.atualizar(
      '7',
      { fullName: 'Maria Helena Souza', confirmNameChange: true },
      4,
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { nome: 'Maria Helena Souza' } }),
    );
    expect(historicoCreate).toHaveBeenCalledWith({
      data: {
        pacienteId: 7,
        usuarioId: 4,
        campoAlterado: 'fullName',
        valorAnterior: 'Maria Helena',
        valorNovo: 'Maria Helena Souza',
      },
    });
  });

  it('grava a cidade enviada e responde 404 quando o paciente não existe', async () => {
    findUnique.mockResolvedValue(registro);

    await service.atualizar('7', { city: 'Cidade Exemplo', state: null }, 4);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { cidade: 'Cidade Exemplo' } }),
    );

    findUnique.mockResolvedValue(null);
    await expect(service.atualizar('7', { phone: '11977776666' }, 4)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(update).toHaveBeenCalledTimes(1);
  });
});
