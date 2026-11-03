import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ACESSO_NEGADO } from '../auth/auth.constants';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

describe('PacientesController', () => {
  let controller: PacientesController;
  const listar = jest.fn();
  const validarParametros = jest.fn();
  const validarCadastro = jest.fn();
  const criar = jest.fn();
  const validarAtualizacao = jest.fn();
  const obter = jest.fn();
  const atualizar = jest.fn();
  const listarPrioritarios = jest.fn();
  const exigirPermissao = jest.fn();
  const consulta = { page: 1, pageSize: 20, sort: 'fullName' as const };
  const requisicao = {
    user: {
      id: 4,
      username: 'ana.souza@example.com',
      fullName: 'Ana Souza',
      active: true as const,
      perfil: 'PROFISSIONAL',
    },
  };

  beforeEach(async () => {
    listar.mockReset();
    validarParametros.mockReset();
    validarCadastro.mockReset();
    criar.mockReset();
    validarAtualizacao.mockReset();
    obter.mockReset();
    atualizar.mockReset();
    listarPrioritarios.mockReset();
    exigirPermissao.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PacientesController],
      providers: [
        {
          provide: PacientesService,
          useValue: {
            listar,
            validarParametros,
            validarCadastro,
            criar,
            validarAtualizacao,
            obter,
            atualizar,
          },
        },
        { provide: AuthService, useValue: { exigirPermissao } },
        { provide: DashboardService, useValue: { listarPrioritarios } },
      ],
    }).compile();

    controller = module.get(PacientesController);
  });

  it('consulta pacientes somente depois de patients:read', async () => {
    const resposta = { data: [], page: 1, pageSize: 20, total: 0 };
    exigirPermissao.mockResolvedValue(undefined);
    listar.mockResolvedValue(resposta);

    await expect(controller.listar(requisicao, consulta)).resolves.toEqual(resposta);
    expect(exigirPermissao).toHaveBeenCalledWith(4, 'patients:read');
    expect(listar).toHaveBeenCalledWith(consulta);
  });

  it('não consulta o banco quando a permissão falta', async () => {
    exigirPermissao.mockRejectedValue(new ForbiddenException(ACESSO_NEGADO));

    await expect(controller.listar(requisicao, consulta)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(listar).not.toHaveBeenCalled();
  });

  it('cadastra somente depois de patients:create', async () => {
    const corpo = { cpf: '529.982.247-25', fullName: 'Maria Helena' };
    const resposta = { id: '15', fullName: 'Maria Helena' };
    criar.mockResolvedValue(resposta);

    await expect(controller.criar(requisicao, corpo as never)).resolves.toEqual(resposta);
    expect(validarCadastro).toHaveBeenCalledWith(corpo);
    expect(exigirPermissao).toHaveBeenCalledWith(4, 'patients:create');
    expect(criar).toHaveBeenCalledWith(corpo);
  });

  it('não grava o paciente quando a permissão falta', async () => {
    exigirPermissao.mockRejectedValue(new ForbiddenException(ACESSO_NEGADO));

    await expect(
      controller.criar(requisicao, { cpf: '529.982.247-25', fullName: 'Maria' } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(criar).not.toHaveBeenCalled();
  });

  it('consulta um paciente somente depois de patients:read', async () => {
    obter.mockResolvedValue({ id: '7' });

    await expect(controller.obter(requisicao, '7')).resolves.toEqual({ id: '7' });
    expect(exigirPermissao).toHaveBeenCalledWith(4, 'patients:read');
    expect(obter).toHaveBeenCalledWith('7');
  });

  it('atualiza somente depois de patients:update e não grava sem permissão', async () => {
    const corpo = { phone: '11977776666' };
    atualizar.mockResolvedValue({ id: '7' });

    await expect(controller.atualizar(requisicao, '7', corpo)).resolves.toEqual({ id: '7' });
    expect(validarAtualizacao).toHaveBeenCalledWith(corpo);
    expect(exigirPermissao).toHaveBeenCalledWith(4, 'patients:update');
    expect(atualizar).toHaveBeenCalledWith('7', corpo, 4);

    exigirPermissao.mockRejectedValue(new ForbiddenException(ACESSO_NEGADO));
    await expect(controller.atualizar(requisicao, '7', corpo)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('lista prioridade somente com dashboard:read', async () => {
    listarPrioritarios.mockResolvedValue({ data: [], total: 0 });

    await controller.prioritarios(requisicao, {});
    expect(exigirPermissao).toHaveBeenCalledWith(4, 'dashboard:read');

    exigirPermissao.mockRejectedValue(new ForbiddenException(ACESSO_NEGADO));
    await expect(controller.prioritarios(requisicao, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(listarPrioritarios).toHaveBeenCalledTimes(1);
  });
});
