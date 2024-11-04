const router = require('express').Router();
const { verifyToken, verifyUser } = require('../middleware/authMiddleware');
const { getCategories, createCategory, updateCategory, deleteCategory, batchAddCategories } =  require('../controller/categoryController')

router.get('/:id', verifyToken, getCategories);

router.post('/create', verifyToken, createCategory);

router.put('/:id', verifyToken, updateCategory);

router.delete('/:id', verifyToken, deleteCategory);

router.post('/batch-create', verifyToken, batchAddCategories)

module.exports = router;