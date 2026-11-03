import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AcompanhamentosService } from './acompanhamentos.service';

describe('AcompanhamentosService', () => {
  let service: AcompanhamentosService;
  const findPaciente = jest.fn();
  const findReceita = jest.fn();
  const create = jest.fn();
  const findMany = jest.fn();
  const count = jest.fn();

  beforeEach(async () => {
    findPaciente.mockReset();
    findReceita.mockReset();
    create.mockReset();
    findMany.mockReset();
    count.mockReset();
    findPaciente.mockResolvedValue({ id: 7 });
    create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 3,
      pacienteId: data.pacienteId,
      receitaId: data.receitaId,
      ocorreuEm: data.ocorreuEm,
      descricao: data.descricao,
      createdAt: new Date('2026-10-18T18:00:00.000Z'),
      usuario: { id: data.usuarioId, nome: 'Admin Renova' },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcompanhamentosService,
        {
          provide: PrismaService,
          useValue: {
            paciente: { findUnique: findPaciente },
            receita: { findUnique: findReceita },
            acompanhamento: { create, findMany, count },
          },
        },
      ],
    }).compile();

    service = module.get(AcompanhamentosService);
  });

  it('grava o acompanhamento do paciente e do usuário autenticado', async () => {
    findReceita.mockResolvedValue({ pacienteId: 7 });

    const resposta = await service.criar(
      '7',
      {
        occurredOn: '2026-10-18',
        description: 'Contato telefônico fictício',
        prescriptionId: '21',
      },
      4,
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          pacienteId: 7,
          receitaId: 21,
          usuarioId: 4,
          ocorreuEm: new Date('2026-10-18T00:00:00.000Z'),
          descricao: 'Contato telefônico fictício',
        },
      }),
    );
    expect(resposta).toMatchObject({
      id: '3',
      patientId: '7',
      prescriptionId: '21',
      occurredOn: '2026-10-18',
      recordedBy: { id: '4', fullName: 'Admin Renova' },
    });
  });

  it('não grava paciente ausente, data inválida nem receita de outro paciente', async () => {
    findPaciente.mockResolvedValue(null);
    await expect(
      service.criar('7', { occurredOn: '2026-10-18', description: 'Contato' }, 4),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(create).not.toHaveBeenCalled();

    findPaciente.mockResolvedValue({ id: 7 });
    await expect(
      service.criar('7', { occurredOn: '2026-02-31', description: 'Contato' }, 4),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();

    findReceita.mockResolvedValue({ pacienteId: 8 });
    await expect(
      service.criar(
        '7',
        { occurredOn: '2026-10-18', description: 'Contato', prescriptionId: '21' },
        4,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
});
