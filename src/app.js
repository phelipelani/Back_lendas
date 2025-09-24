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
import statsRoutes from './routes/statsRoutes.js'; // <-- A importação que faltava
import authRoutes from './routes/authRoutes.js';

// Workaround para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/jogadores', jogadorRoutes);
app.use('/api/ligas', ligaRoutes);
app.use('/api/rodadas', rodadaRoutes);
app.use('/api/partidas', partidaRoutes);
app.use('/api/campeonatos', campeonatoRoutes);
app.use('/api/estatisticas', statsRoutes); // <-- A utilização da nova rota

export default app;
