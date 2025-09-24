// Arquivo: src/controllers/authController.js
import jwt from 'jsonwebtoken';

export function login(req, res) {
  const { password } = req.body;

  // 1. Pega a senha do corpo da requisição
  if (!password) {
    return res.status(400).json({ message: 'A senha é obrigatória.' });
  }

  // 2. Compara com a senha mestra do nosso arquivo .env
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Senha incorreta.' });
  }

  // 3. Se a senha estiver correta, cria o "payload" do token
  // O payload são as informações que queremos guardar dentro do token
  const payload = {
    user: 'admin',
    role: 'admin' 
  };

  // 4. Gera o token JWT, assinado com nossa chave secreta
  // Ele vai expirar em 8 horas ('8h').
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // 5. Envia o token de volta para o frontend
  res.status(200).json({ 
    message: 'Login bem-sucedido!',
    token: token 
  });
}