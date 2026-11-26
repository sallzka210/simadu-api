const router = require('express').Router();
const { validateLogin } = require('../middleware/validate.cjs');
const controller = require('../controllers/authController.cjs');

router.post('/login', validateLogin, controller.login);

module.exports = router;
