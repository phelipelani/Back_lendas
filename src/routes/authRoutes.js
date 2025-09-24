// Arquivo: src/routes/authRoutes.js
import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

// Define a rota POST para /api/auth/login
// Qualquer requisição para este endereço cairá na nossa função de login
router.post('/login', login);

export default router;