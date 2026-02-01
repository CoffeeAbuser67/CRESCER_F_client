import { useEffect, useState } from 'react';
import axios from 'axios';

// Configuração básica do Axios
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // URL da sua API FastAPI
});

// Tipagem (Interface) igual ao seu Schema do Python
interface Medico {
  id?: string; // UUID é string no JS
  pkid?: number;
  name: string;
  last_name: string;
  email: string;
}

function App() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [form, setForm] = useState({ name: '', last_name: '', email: '' });
  const [erro, setErro] = useState('');

  // Função para buscar médicos (GET)
  const fetchMedicos = async () => {
    try {
      const response = await api.get<Medico[]>('/medicos/');
      setMedicos(response.data);
      setErro('');
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setErro("Erro ao conectar com a API (O server tá rodando?)");
    }
  };

  // Carrega a lista ao abrir a página
  useEffect(() => {
    fetchMedicos();
  }, []);

  // Função para criar médico (POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/medicos/', form);
      // Limpa form e recarrega lista
      setForm({ name: '', last_name: '', email: '' });
      fetchMedicos();
      alert("Médico cadastrado com sucesso!");
    } catch (error: any) {
      // Se a API retornar 400 (Email duplicado), mostramos aqui
      if (error.response) {
        alert(`Erro: ${error.response.data.detail}`);
      } else {
        alert("Erro desconhecido ao salvar.");
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Gestão de Médicos</h1>
      
      {erro && <p style={{ color: 'red', fontWeight: 'bold' }}>{erro}</p>}

      {/* FORMULÁRIO */}
      <div style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px' }}>
        <h3>Novo Médico</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input 
            placeholder="Nome" 
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
            required
          />
          <input 
            placeholder="Sobrenome" 
            value={form.last_name} 
            onChange={e => setForm({...form, last_name: e.target.value})} 
            required
          />
          <input 
            placeholder="Email" 
            type="email"
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})} 
            required
          />
          <button type="submit">Cadastrar</button>
        </form>
      </div>

      {/* LISTAGEM */}
      <h3>Lista de Cadastrados</h3>
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Nome Completo</th>
            <th>Email</th>
            <th>ID (UUID)</th>
          </tr>
        </thead>
        <tbody>
          {medicos.map((medico) => (
            <tr key={medico.id}>
              <td>{medico.name} {medico.last_name}</td>
              <td>{medico.email}</td>
              <td style={{ fontSize: '12px', color: '#666' }}>{medico.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;