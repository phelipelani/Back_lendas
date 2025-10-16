import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

// Workaround para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define o caminho para o arquivo do banco de dados SQLite local existente 'futlendas'
// Assumindo que 'futlendas' está na raiz do seu projeto
const dbPath = path.join(__dirname, '..', '..', 'futlendas');

// Cria o cliente de conexão com o banco de dados SQLite local
const dbClient = createClient({
  url: `file:${dbPath}`,
});

console.log("--- INICIANDO CONEXÃO LOCAL ---");
console.log("URL DO BANCO DE DADOS LOCAL SENDO USADA:", `file:${dbPath}`);
console.log("--- FIM DO TESTE ---");

// Exporta o cliente para ser usado em outras partes do seu código
export default dbClient;
