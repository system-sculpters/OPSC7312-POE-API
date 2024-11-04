const router = require('express').Router();
const { signup,signupWithSSO, signin, signinWithSSO, logout, reauthenticateUser } = require('../controller/authController')
const { checkToken } = require('../middleware/authMiddleware')

router.post('/signup', signup);

router.post('/signin', signin);

router.post('/signin-sso', signinWithSSO);

router.post('/signup-sso', signupWithSSO);

router.post('/logout', logout);

router.post('/reauthenticate', reauthenticateUser)

module.exports = router