const { readToken } = require('../config/encrip');
const { transactionsController } = require('../controllers');

const router = require('express').Router();

router.get('/carts', readToken, transactionsController.getCart);
router.post('/carts', readToken, transactionsController.addToCart);
router.delete('/carts/:id', transactionsController.deleteCart);
router.patch('/carts/:id', transactionsController.updateQty);
router.post('/checkout', readToken, transactionsController.checkout);
router.get('/history', readToken, transactionsController.getTransactions);

module.exports = router;

