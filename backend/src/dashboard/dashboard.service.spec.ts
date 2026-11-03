import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const count = jest.fn();
  const groupBy = jest.fn();
  const findMany = jest.fn();

  beforeEach(async () => {
    count.mockReset();
    groupBy.mockReset();
    findMany.mockReset();
    count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            receita: { count, groupBy },
            paciente: { findMany },
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('conta as faixas e mantém pendentes em zero', async () => {
    const resumo = await service.resumo();

    expect(count).toHaveBeenCalledTimes(5);
    expect(resumo.timezone).toBe('America/Sao_Paulo');
    expect(resumo.alertWindows).toEqual({ nearDays: 5, attentionDays: 15 });
    expect(resumo.counts).toEqual({
      vencidas: 1,
      proximas5: 2,
      proximas15: 3,
      dentroDoPrazo: 4,
      pendentesInformacao: 5,
    });
  });

  it('agrupa pacientes pela receita que vence até 15 dias', async () => {
    const vencimento = new Date('2020-01-01T00:00:00.000Z');
    groupBy.mockResolvedValueOnce([
      { pacienteId: 7, _min: { dataVencimento: vencimento } },
    ]);
    groupBy.mockResolvedValueOnce([{ pacienteId: 7 }]);
    findMany.mockResolvedValue([
      { id: 7, nome: 'Maria Helena', telefone: '11988887777' },
    ]);

    const lista = await service.listarPrioritarios({});

    expect(lista.total).toBe(1);
    expect(lista.data[0]).toMatchObject({
      id: '7',
      fullName: 'Maria Helena',
      phone: '(11) 98888-7777',
      nearestExpiryOn: '2020-01-01',
      alertBand: 'VENCIDA',
    });
    expect(lista.data[0].daysUntilExpiry).toBeLessThan(0);
  });
});
