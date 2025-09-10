import { body } from 'express-validator';

// Exportamos um array de regras de validação para a rota de criação de ligas.
export const validateLiga = [
  // Para o campo 'nome':
  body('nome')
    .trim() // Remove espaços em branco no início e no fim
    .notEmpty().withMessage('O nome da liga é obrigatório.') // Garante que não está vazio
    .isLength({ min: 3 }).withMessage('O nome da liga precisa de ter pelo menos 3 caracteres.')
    .escape(), // Converte caracteres HTML especiais para evitar ataques XSS

  // Para o campo 'data_inicio':
  body('data_inicio')
    .isISO8601().withMessage('A data de início deve estar no formato AAAA-MM-DD.')
    .toDate(), // Converte a string para um objeto Date

  // Para o campo 'data_fim':
  body('data_fim')
    .isISO8601().withMessage('A data de término deve estar no formato AAAA-MM-DD.')
    .toDate()
    // Validação personalizada para garantir que a data de fim é posterior à de início
    .custom((value, { req }) => {
      if (value < req.body.data_inicio) {
        throw new Error('A data de término não pode ser anterior à data de início.');
      }
      return true;
    }),
];
