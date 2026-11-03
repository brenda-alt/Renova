import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import { useSessao } from '../sessao/SessaoContexto';

const ITENS = [
  { para: '/dashboard', rotulo: 'Dashboard', icone: LayoutDashboard },
  { para: '/receitas', rotulo: 'Receitas', icone: FileText },
  { para: '/pacientes', rotulo: 'Pacientes', icone: Users },
];

export function LayoutAutenticado() {
  const { usuario, sair } = useSessao();
  const [aberto, setAberto] = useState(false);
  const papel = usuario?.roles[0]?.name;

  return (
    <div className="aplicacao">
      <aside className={aberto ? 'menu menu-aberto' : 'menu'}>
        <div className="marca">
          <span className="marca-selo" aria-hidden="true">
            R
          </span>
          <div>
            <strong>Renova</strong>
            <small>Acompanhamento</small>
          </div>
        </div>
        <nav aria-label="Principal">
          {ITENS.map((item) => {
            const Icone = item.icone;
            return (
              <NavLink
                key={item.para}
                to={item.para}
                className={({ isActive }) => (isActive ? 'menu-item ativo' : 'menu-item')}
                onClick={() => setAberto(false)}
              >
                <Icone size={18} aria-hidden="true" />
                {item.rotulo}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="conteudo">
        <header className="topo">
          <button
            type="button"
            className="botao-icone menu-movel"
            aria-expanded={aberto}
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setAberto((atual) => !atual)}
          >
            {aberto ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="usuario">
            <strong>{usuario?.fullName}</strong>
            <span>{papel ? `${papel} · ${usuario?.username}` : usuario?.username}</span>
          </div>
          <button type="button" className="botao botao-secundario" onClick={sair}>
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
        </header>
        <main className="pagina">
          <Outlet />
        </main>
      </div>
      {aberto ? <button type="button" className="cortina" aria-label="Fechar menu" onClick={() => setAberto(false)} /> : null}
    </div>
  );
}
