import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutAutenticado } from './components/LayoutAutenticado';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NovaReceitaPage } from './pages/NovaReceitaPage';
import { PacienteDetalhePage } from './pages/PacienteDetalhePage';
import { PacienteFormPage } from './pages/PacienteFormPage';
import { PacientesPage } from './pages/PacientesPage';
import { ReceitaDetalhePage } from './pages/ReceitaDetalhePage';
import { ReceitasPage } from './pages/ReceitasPage';
import { RotaPrivada, RotaPublica } from './routes/Rotas';
import { SessaoProvider } from './sessao/SessaoContexto';

const consultas = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={consultas}>
      <BrowserRouter>
        <SessaoProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <RotaPublica>
                  <LoginPage />
                </RotaPublica>
              }
            />
            <Route element={<RotaPrivada />}>
              <Route element={<LayoutAutenticado />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/receitas" element={<ReceitasPage />} />
                <Route path="/receitas/nova" element={<NovaReceitaPage />} />
                <Route path="/receitas/:id" element={<ReceitaDetalhePage />} />
                <Route path="/pacientes" element={<PacientesPage />} />
                <Route path="/pacientes/novo" element={<PacienteFormPage modo="criar" />} />
                <Route path="/pacientes/:id" element={<PacienteDetalhePage />} />
                <Route path="/pacientes/:id/editar" element={<PacienteFormPage modo="editar" />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SessaoProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
