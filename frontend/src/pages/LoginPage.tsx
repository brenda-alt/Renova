import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { IlustracaoClinica } from '../components/IlustracaoClinica';
import { CampoTexto } from '../components/Campo';
import { ErroApi } from '../services/api';
import { esquemaLogin, type DadosLogin } from '../schemas/login';
import { useSessao } from '../sessao/SessaoContexto';

export function LoginPage() {
  const navegar = useNavigate();
  const { entrar } = useSessao();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosLogin>({ resolver: zodResolver(esquemaLogin) });

  return (
    <main className="login">
      <section className="login-painel" aria-hidden="true">
        <IlustracaoClinica />
        <div className="login-texto">
          <p>Sistema de acompanhamento</p>
          <h1>Renova</h1>
          <p>Receitas, prazos e pacientes em um só lugar.</p>
        </div>
      </section>
      <section className="login-formulario">
        <form
          onSubmit={handleSubmit(async (dados) => {
            setErro(null);
            try {
              await entrar(dados.username, dados.password);
              navegar('/dashboard', { replace: true });
            } catch (falha) {
              setErro(falha instanceof ErroApi ? falha.message : 'Não foi possível entrar.');
            }
          })}
          noValidate
        >
          <p className="olho">Acesso</p>
          <h2>Entrar no Renova</h2>
          <CampoTexto
            id="username"
            rotulo="E-mail"
            type="email"
            autoComplete="username"
            placeholder="nome@dominio"
            erro={errors.username?.message}
            {...register('username')}
          />
          <CampoTexto
            id="password"
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            erro={errors.password?.message}
            {...register('password')}
          />
          {erro ? (
            <p className="alerta alerta-erro" role="alert">
              {erro}
            </p>
          ) : null}
          <button type="submit" className="botao botao-largo" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
