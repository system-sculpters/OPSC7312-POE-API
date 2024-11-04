const router = require('express').Router()
const { verifyToken, verifyUser } = require('../middleware/authMiddleware');
const { getStocks, getStockBySymbol, getTop40Stocks, getBatchStocks, updateStockLogos, getTop40Data, stockHistory } =  require('../controller/stockController')

router.get('/', verifyToken, getStocks);

router.get('/top/stocks', verifyToken, getTop40Stocks);

router.get('/top/batch-stocks', verifyToken, getBatchStocks);

router.get('/top/40', verifyToken, getTop40Data);

router.get('/update/logo', verifyToken, updateStockLogos);

router.get('/history', verifyToken, stockHistory);


module.exports = router