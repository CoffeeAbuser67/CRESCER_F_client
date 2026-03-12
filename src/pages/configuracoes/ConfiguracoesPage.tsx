// *******************
// MODIFIQUE AQUI!
// *******************
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Stethoscope, ShieldCheck } from "lucide-react";
import { ProfissionaisManager } from "./components/ProfissionaisManager";
import { ServicosManager } from "./components/ServicosManager";
import { Card, CardContent } from "@/components/ui/card"; // <- Importamos o Card para melhorar o visual
import { UsuariosManager } from "./components/UsuariosManager";



export default function ConfiguracoesPage() {
    const [activeTab, setActiveTab] = useState("operacional");

    return (
        // 1. Padding responsivo (p-4 mobile, p-8 desktop)
        <div className="h-full flex-1 flex-col space-y-6 p-2 md:p-8 bg-background overflow-y-auto">

            {/* Cabeçalho da Página */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cadastros e Configurações</h2>
                    <p className="text-muted-foreground mt-1">Gerencie os parâmetros, equipe e acessos do sistema.</p>
                </div>
            </div>

            {/* Sistema de Abas */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

                {/* Navegação das Abas */}
                <div className="border-b pb-0">
                    {/* Adicionado overflow-x-auto para evitar quebra no mobile */}
                    <TabsList className="bg-transparent h-auto p-0 gap-2 md:gap-6 flex flex-wrap md:flex-nowrap justify-start">
                        <TabsTrigger
                            value="operacional"
                            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm md:text-base flex-1 md:flex-none justify-center"
                        >
                            <Stethoscope className="mr-2 h-4 w-4" /> Operacional da Clínica
                        </TabsTrigger>
                        <TabsTrigger
                            value="acessos"
                            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm md:text-base flex-1 md:flex-none justify-center"
                        >
                            <ShieldCheck className="mr-2 h-4 w-4" /> Acessos e Usuários
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: Operacional (Profissionais + Serviços empilhados) */}
                <TabsContent value="operacional" className="space-y-8 focus-visible:outline-none">
                    <div className="flex flex-col gap-8">
                        {/* 2. Envolvendo as sessões em Cards */}
                        <Card className="shadow-sm border-muted">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-medium mb-4">Profissionais de Saúde</h3>
                                <ProfissionaisManager />
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-muted">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-medium mb-4">Catálogo de Serviços</h3>
                                <ServicosManager />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ABA 2: Usuários */}
                <TabsContent value="acessos" className="focus-visible:outline-none">
                    <Card className="shadow-sm border-muted">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-medium mb-4">Controle de Usuários</h3>
                            <UsuariosManager />
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* 3. O "Calço" Mobile para garantir respiro no final da página */}
            <div className="h-12 shrink-0 w-full block md:hidden" />

        </div>
    );
}