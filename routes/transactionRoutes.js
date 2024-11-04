const router = require('express').Router();
const { verifyToken, verifyUser } = require('../middleware/authMiddleware')
const { getTransactions, createTransaction, updateTransaction, deleteTransaction, batchAddTransactions } =  require('../controller/transactionController')

router.get('/:id', verifyToken, getTransactions);

router.post('/create', verifyToken, createTransaction);
 
router.put('/:id', verifyToken, updateTransaction);

router.delete('/:id', verifyToken, deleteTransaction);

router.post('/batch-create', verifyToken, batchAddTransactions)

module.exports = router;