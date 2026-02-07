// client/src/App.tsx
import { Suspense, useEffect } from "react";
import { useRoutes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2 } from "lucide-react";

import routes from "./routes";
import { useUserStore } from "./store/userStore";

const GlobalLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function App() {
  const content = useRoutes(routes);
  const { checkAuth, isLoading } = useUserStore();


  useEffect(() => {
    // Agora o checkAuth roda com a confiança de que o interceptor já existe no módulo api.ts
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <GlobalLoader />;
  }

  return (
    <>
      <Suspense fallback={<GlobalLoader />}>
        {content}
      </Suspense>
      <ToastContainer theme="colored" position="bottom-right" />
    </>
  );
}

export default App;