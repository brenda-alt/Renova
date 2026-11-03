import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { formatarDataCivil, somarDiasCivis } from '../pacientes/idade';
import { PrismaService } from '../prisma/prisma.service';
import { referenciaCivil } from '../prazo/prazo';
import { ReceitasService } from './receitas.service';

describe('ReceitasService', () => {
  let service: ReceitasService;
  const findPaciente = jest.fn();
  const findReceita = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const findMany = jest.fn();
  const count = jest.fn();
  const transaction = jest.fn();

  const receita = {
    id: 21,
    dataEmissao: new Date('2026-10-18T00:00:00.000Z'),
    dataVencimento: new Date('2026-11-17T00:00:00.000Z'),
    tipoReceita: null as string | null,
    canceladaEm: null as Date | null,
    observacoes: null as string | null,
    createdAt: new Date('2026-10-18T18:00:00.000Z'),
    updatedAt: new Date('2026-10-18T18:00:00.000Z'),
    paciente: { id: 7, nome: 'Maria Helena', cpf: '52998224725' },
    itens: [] as Array<Record<string, unknown>>,
  };

  beforeEach(async () => {
    findPaciente.mockReset();
    findReceita.mockReset();
    create.mockReset();
    update.mockReset();
    findMany.mockReset();
    count.mockReset();
    transaction.mockReset();
    findPaciente.mockResolvedValue({ id: 7 });
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...receita,
      dataEmissao: data.dataEmissao,
      dataVencimento: data.dataVencimento,
      tipoReceita: data.tipoReceita ?? null,
      canceladaEm: null,
      observacoes: data.observacoes ?? null,
      itens: itensCriados(data.itens),
    }));
    transaction.mockImplementation(async (operacao: (tx: unknown) => Promise<unknown>) =>
      operacao({ receita: { create } }),
    );
    update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...receita,
      ...data,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceitasService,
        {
          provide: PrismaService,
          useValue: {
            paciente: { findUnique: findPaciente },
            receita: { findUnique: findReceita, create, update, findMany, count },
            $transaction: transaction,
          },
        },
      ],
    }).compile();

    service = module.get(ReceitasService);
  });

  it('grava a receita vinculada ao paciente e ao usuário autenticado', async () => {
    const resposta = await service.criar(
      { patientId: '7', expiresOn: '2026-11-17', notes: 'Orientação fictícia' },
      4,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pacienteId: 7,
          usuarioId: 4,
          dataVencimento: new Date('2026-11-17T00:00:00.000Z'),
          observacoes: 'Orientação fictícia',
        }),
      }),
    );
    expect(resposta).toMatchObject({
      id: '21',
      lifecycleStatus: 'ATIVA',
      expiresOn: '2026-11-17',
      patient: { id: '7', cpf: '529.982.247-25' },
    });
  });

  it('não grava data inválida nem paciente ausente e cancela a receita existente', async () => {
    await expect(
      service.criar({ patientId: '7', expiresOn: '2026-02-31' }, 4),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();

    findPaciente.mockResolvedValue(null);
    await expect(
      service.criar({ patientId: '7', expiresOn: '2026-11-17' }, 4),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(create).not.toHaveBeenCalled();

    await expect(service.criar({ patientId: 'nao-e-inteiro', expiresOn: '2026-11-17' }, 4)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findPaciente).toHaveBeenCalledTimes(1);

    findReceita.mockResolvedValue(receita);
    await service.atualizar('21', { lifecycleStatus: 'CANCELADA', expiresOn: '2026-12-01' }, 4);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dataVencimento: new Date('2026-12-01T00:00:00.000Z'),
          canceladaPorId: 4,
        }),
      }),
    );
  });

  it('grava receita sem vencimento e consulta as canceladas', async () => {
    const semVencimento = await service.criar({ patientId: '7' }, 4);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ dataVencimento: null }) }),
    );
    expect(semVencimento.expiresOn).toBeNull();
    expect(semVencimento.alertBand).toBe('PENDENTE_INFORMACAO');
    expect(semVencimento.items).toEqual([]);
    expect(transaction).toHaveBeenCalled();

    findReceita.mockResolvedValue(receita);
    await service.atualizar('21', { notes: 'Nova orientação' }, 4);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { observacoes: 'Nova orientação' } }),
    );

    findMany.mockResolvedValue([]);
    count.mockResolvedValue(2);
    const canceladas = await service.listar({ lifecycleStatus: 'CANCELADA' });
    expect(canceladas.total).toBe(2);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ canceladaEm: { not: null } }) }),
    );
  });

  it('grava tipo, emissão, vencimento calculado e medicamentos na mesma transação', async () => {
    const emissao = formatarDataCivil(referenciaCivil(new Date()));
    const vencimento = formatarDataCivil(somarDiasCivis(referenciaCivil(new Date()), 3));
    const resposta = await service.criar(
      {
        patientId: '7',
        prescriptionType: 'CONTROLADA',
        issuedOn: emissao,
        validityDays: 3,
        expiresOn: vencimento,
        items: [
          {
            medicationName: ' Losartana ',
            dosage: '50 mg',
            quantity: '30',
            morning: true,
            afternoon: false,
            night: true,
          },
        ],
      },
      4,
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pacienteId: 7,
          usuarioId: 4,
          tipoReceita: 'CONTROLADA',
          dataEmissao: new Date(`${emissao}T00:00:00.000Z`),
          dataVencimento: new Date(`${vencimento}T00:00:00.000Z`),
          itens: {
            create: [
              {
                nomeMedicamento: 'Losartana',
                dosagem: '50 mg',
                quantidade: '30',
                usoManha: true,
                usoTarde: false,
                usoNoite: true,
              },
            ],
          },
        }),
      }),
    );
    expect(resposta).toMatchObject({
      issuedOn: emissao,
      expiresOn: vencimento,
      prescriptionType: 'CONTROLADA',
      alertBand: 'PROXIMA_5',
      items: [{ medicationName: 'Losartana', morning: true, night: true }],
    });
  });

  it('recusa vencimento divergente, período vazio e medicamento sem tipo', async () => {
    await expect(
      service.criar(
        {
          patientId: '7',
          prescriptionType: 'COMUM',
          issuedOn: '2026-10-25',
          validityDays: 30,
          expiresOn: '2026-10-26',
          items: [medicamento()],
        },
        4,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.criar(
        {
          patientId: '7',
          prescriptionType: 'COMUM',
          items: [medicamento({ morning: false })],
        },
        4,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.criar(
        {
          patientId: '7',
          items: [medicamento()],
        },
        4,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(create).not.toHaveBeenCalled();
  });
});

function medicamento(parcial: Record<string, unknown> = {}) {
  return {
    medicationName: 'Losartana',
    dosage: '50 mg',
    quantity: '30',
    morning: true,
    afternoon: false,
    night: false,
    ...parcial,
  };
}

function itensCriados(itens: unknown): Array<Record<string, unknown>> {
  if (!itens || typeof itens !== 'object' || !('create' in itens) || !Array.isArray(itens.create)) {
    return [];
  }

  return itens.create.map((item: Record<string, unknown>, indice: number) => ({
    id: indice + 1,
    ...item,
  }));
}
