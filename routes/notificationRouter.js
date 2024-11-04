const router = require('express').Router()
const { createNotification, getNotifications, markAsRead, registerToken } = require('../controller/notificationController')
const { verifyToken, verifyUser } = require('../middleware/authMiddleware');

router.get('/:id', verifyToken, getNotifications);

router.post('/create', verifyToken, createNotification)

router.put('/:id', verifyToken, markAsRead)

router.put('/:id/register-token', verifyToken, registerToken)

module.exports = router