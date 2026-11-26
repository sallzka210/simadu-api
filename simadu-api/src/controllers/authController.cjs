const authService = require('../services/authService.cjs');

exports.login = async (req, res) => {
  const { username, password } = req.validated;
  const result = await authService.login(username, password);
  res.status(200).json({ success: true, message: 'Login berhasil', data: result });
};
