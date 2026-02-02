import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import routes from "./routes";
import AppInitializer from './components/AppInitializer';
import { setupAxiosInterceptor } from "./utils/axiosAuthInterceptor";
import { useUserStore } from "./store/userStore";

// Componente de Loader Global inicial
const GlobalLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

function App() {
  const content = useRoutes(routes);
  
  // Precisamos criar um "hook" simples ou função para logout no interceptor
  // Como o interceptor é fora do componente, passamos uma função que manipula o store/router
  const logoutUser = () => {
     useUserStore.getState().setActiveUser(null);
     window.location.href = "/login"; // Força o refresh para limpar estados
  };
  
  // Configura o interceptor (uma única vez ou garantindo idempotência)
  setupAxiosInterceptor(logoutUser);

  return (
    <HelmetProvider>
      <Helmet
        titleTemplate="%s | HM Admin"
        defaultTitle="HM Admin"
      />
      
      {/* AppInitializer garante que verificamos o cookie antes de renderizar qualquer rota */}
      <AppInitializer>
        <Suspense fallback={<GlobalLoader />}>
            {content}
        </Suspense>
      </AppInitializer>
      
      <ToastContainer theme="colored" position="bottom-right" />
    </HelmetProvider>
  );
}

export default App;