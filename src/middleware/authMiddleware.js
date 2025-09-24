import jwt from 'jsonwebtoken';

export const isAdmin = (req, res, next) => {
  // 1. Procurar pelo cabeçalho de autorização
  const authHeader = req.headers['authorization'];

  // 2. Se o cabeçalho não existir, o acesso é negado imediatamente
  if (!authHeader) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  // 3. O formato do cabeçalho é "Bearer TOKEN". Vamos separar as duas partes.
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Erro no formato do token.' });
  }
  
  const token = parts[1];

  // 4. Verificar o token
  try {
    // Usamos a nossa chave secreta para decodificar e verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Verificamos se o "payload" do token contém a role de admin
    if (decoded && decoded.role === 'admin') {
      // Se tudo estiver certo, o usuário pode prosseguir para a rota solicitada
      next();
    } else {
      // O token é válido, mas o usuário não é admin
      res.status(403).json({ message: 'Acesso proibido. Permissões insuficientes.' });
    }
  } catch (error) {
    // Se a verificação falhar (token inválido, expirado, etc.), o acesso é negado
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};