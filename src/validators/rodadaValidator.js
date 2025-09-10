import { body, param } from 'express-validator';

// Regras para criar uma nova rodada
export const validateCreateRodada = [
  // Valida o 'liga_id' que vem no URL (parâmetro)
  param('liga_id')
    .isInt({ min: 1 }).withMessage('O ID da liga é inválido.'),

  // Valida a 'data' que vem no corpo da requisição
  body('data')
    .isISO8601().withMessage('A data da rodada deve estar no formato AAAA-MM-DD.')
    .toDate(),
];

// Regras para sincronizar (adicionar/validar) jogadores numa rodada
export const validateSyncJogadores = [
  param('rodada_id')
    .isInt({ min: 1 }).withMessage('O ID da rodada é inválido.'),
  
  body('nomes')
    .isArray({ min: 1 }).withMessage('A lista de nomes de jogadores é obrigatória e não pode estar vazia.'),
  
  // Valida cada item dentro do array 'nomes'
  body('nomes.*')
    .trim()
    .notEmpty().withMessage('O nome de um jogador não pode ser vazio.')
    .isString().withMessage('Cada nome na lista deve ser um texto.')
    .escape(),
];
