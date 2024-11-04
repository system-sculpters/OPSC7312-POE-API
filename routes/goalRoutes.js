const router = require('express').Router();
const { getGoals, createGoal, updateGoal, deleteGoal, batchAddGoals } =  require('../controller/goalController')
const { verifyToken, verifyUser } = require('../middleware/authMiddleware');

router.get('/:id', verifyToken, getGoals);

router.post('/create', verifyToken, createGoal);

router.put('/:id', verifyToken, updateGoal);

router.delete('/:id', verifyToken, deleteGoal);

router.post('/batch-create', verifyToken, batchAddGoals)


module.exports = router;