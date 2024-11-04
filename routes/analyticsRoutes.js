const router = require('express').Router()
const { getTransactionsByMonth, getExpenseCategoryStats, getTransactionsForLast7Days, getDashboardData } = require('../controller/analyticsController')
const { verifyToken, verifyUser } = require('../middleware/authMiddleware')
 
router.get('/:id/transactions/monthly', verifyToken, getTransactionsByMonth)

router.get('/:id/categories', verifyToken, getExpenseCategoryStats) 

router.get('/:id/transactions/weekly', verifyToken, getTransactionsForLast7Days) 

router.get('/:id', verifyToken, getDashboardData) 

module.exports = router