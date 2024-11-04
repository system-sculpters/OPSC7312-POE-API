const router = require('express').Router()
const { getPortfolioValue, getUserInvestments, getUserInvestment, buyInvestment, sellInvestment } =  require('../controller/investmentController')
const { verifyToken, verifyUser } = require('../middleware/authMiddleware');

router.get('/:id', verifyToken, getUserInvestments);

router.get('/user/stock', verifyToken, getUserInvestment);

router.get('/:id/value', verifyToken, getPortfolioValue);

router.post('/buy', verifyToken, buyInvestment)

router.post('/sell', verifyToken, sellInvestment)

module.exports = router