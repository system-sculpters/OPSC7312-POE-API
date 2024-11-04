const router = require('express').Router()
const { verifyToken, verifyUser } = require('../middleware/authMiddleware')
const { getUser, updateEmailAndUsername, updatePassword} = require('../controller/userController')

router.get('/:id', verifyToken, getUser)

router.put('/:id/update-email-and-username', verifyToken, updateEmailAndUsername)

router.put('/:id/update-password', verifyToken, updatePassword)
 
module.exports = router