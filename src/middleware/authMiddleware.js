// Arquivo: src/middleware/authMiddleware.js

// !! AVISO: Este é um middleware de placeholder (simulação) !!
// Para um sistema de produção, você precisaria de um sistema de autenticação real (ex: JWT).
// O backend não sabe quem está fazendo a requisição sem um token de login.

// Esta função SIMULA a verificação de um usuário que fez login.
const getUsuarioDaRequisicao = (req) => {
    // Em um sistema real, você decodificaria um token JWT do cabeçalho Authorization.
    // Ex: const token = req.headers.authorization.split(' ')[1];
    // const decoded = jwt.verify(token, 'seu_segredo_super_secreto');
    // return findUserById(decoded.id);

    // Para nosso teste, vamos assumir que um header especial na requisição identifica um admin.
    // Se a requisição tiver o header 'X-User-Role: admin', o acesso é concedido.
    const role = req.headers['x-user-role'] || 'player';
    return { role };
};

export const isAdmin = (req, res, next) => {
    const usuario = getUsuarioDaRequisicao(req);

    if (usuario && usuario.role === 'admin') {
        // O usuário é um admin, pode prosseguir para a próxima função (o controller)
        next();
    } else {
        // Não é admin, a requisição é bloqueada aqui com status 403 (Forbidden)
        res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
    }
};
