import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { definirAoNaoAutorizado } from '../services/api';
import { entrar as autenticar, obterEu } from '../services/auth';
import { lerToken, limparToken, salvarToken } from '../services/sessao';
import type { UsuarioAutenticado } from '../types/api';

interface Sessao {
  usuario: UsuarioAutenticado | null;
  carregando: boolean;
  entrar: (username: string, password: string) => Promise<void>;
  sair: () => void;
  temPermissao: (codigo: string) => boolean;
}

const Contexto = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const navegar = useNavigate();
  const consultas = useQueryClient();
  const [token, setToken] = useState<string | null>(() => lerToken());

  const eu = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: obterEu,
    enabled: Boolean(token),
    retry: false,
  });

  function sair(): void {
    limparToken();
    setToken(null);
    consultas.clear();
    navegar('/login', { replace: true });
  }

  useEffect(() => {
    definirAoNaoAutorizado(sair);
    return () => definirAoNaoAutorizado(null);
  });

  useEffect(() => {
    if (token && eu.isError) {
      limparToken();
      setToken(null);
    }
  }, [eu.isError, token]);

  const usuario = token && eu.data ? eu.data : null;

  const valor: Sessao = {
    usuario,
    carregando: Boolean(token) && eu.isLoading,
    async entrar(username: string, password: string) {
      const resposta = await autenticar(username, password);
      salvarToken(resposta.accessToken);
      setToken(resposta.accessToken);
      await consultas.fetchQuery({
        queryKey: ['auth', 'me', resposta.accessToken],
        queryFn: obterEu,
      });
    },
    sair,
    temPermissao(codigo: string) {
      return usuario?.permissions.includes(codigo) ?? false;
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): Sessao {
  const sessao = useContext(Contexto);

  if (!sessao) {
    throw new Error('A sessão do Renova não está disponível nesta tela.');
  }

  return sessao;
}
