import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Stethoscope, ShieldCheck } from "lucide-react";
import { ProfissionaisManager } from "./components/ProfissionaisManager";
import { ServicosManager } from "./components/ServicosManager";




function UsuariosManager() {
    return (
        <div className="rounded-lg border border-dashed p-8 text-center bg-muted/10">
            <h3 className="font-semibold text-lg text-muted-foreground">Módulo de Usuários</h3>
            <p className="text-sm text-muted-foreground">Tabela e controle de acessos entrarão aqui.</p>
        </div>
    );
}

export default function ConfiguracoesPage() {
    const [activeTab, setActiveTab] = useState("operacional");

    return (
        <div className="h-full flex-1 flex-col space-y-6 p-8 md:flex bg-background">

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
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger
                            value="operacional"
                            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base"
                        >
                            <Stethoscope className="mr-2 h-4 w-4" /> Operacional da Clínica
                        </TabsTrigger>
                        <TabsTrigger
                            value="acessos"
                            className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base"
                        >
                            <ShieldCheck className="mr-2 h-4 w-4" /> Acessos e Usuários
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ABA 1: Operacional (Profissionais + Serviços empilhados) */}
                <TabsContent value="operacional" className="space-y-8 focus-visible:outline-none">
                    <div className="flex flex-col gap-8">
                        <section>
                            <h3 className="text-lg font-medium mb-4">Profissionais de Saúde</h3>

                            <ProfissionaisManager />

                        </section>

                        <section>
                            <h3 className="text-lg font-medium mb-4">Catálogo de Serviços</h3>
                            <ServicosManager />
                        </section>
                    </div>
                </TabsContent>

                {/* ABA 2: Usuários */}
                <TabsContent value="acessos" className="focus-visible:outline-none">
                    <section>
                        <h3 className="text-lg font-medium mb-4">Controle de Usuários</h3>
                        <UsuariosManager />
                    </section>
                </TabsContent>

            </Tabs>

        </div>
    );
}