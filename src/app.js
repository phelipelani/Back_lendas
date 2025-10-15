import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Importa todas as nossas rotas
import jogadorRoutes from './routes/jogadorRoutes.js';
import ligaRoutes from './routes/ligaRoutes.js';
import rodadaRoutes from './routes/rodadaRoutes.js';
import partidaRoutes from './routes/partidaRoutes.js';
import campeonatoRoutes from './routes/campeonatoRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Workaround para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Middlewares ---

// Opções do CORS para permitir requisições do seu front-end local
const corsOptions = {
  origin: 'http://localhost:5173', // A porta do seu front-end Vite
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// --- Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/jogadores', jogadorRoutes);
app.use('/api/ligas', ligaRoutes);
app.use('/api/rodadas', rodadaRoutes);
app.use('/api/partidas', partidaRoutes);
app.use('/api/campeonatos', campeonatoRoutes);
app.use('/api/estatisticas', statsRoutes);

export default app;