import dotenv from 'dotenv';
dotenv.config(); // Adicione estas duas linhas no TOPO do arquivo

import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});