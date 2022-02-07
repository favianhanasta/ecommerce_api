const router = require('express').Router();
const {productsController} = require('../controllers');
const {readToken} = require('../config/encrip')

router.get('/', productsController.getProducts);
router.get('/brand', productsController.getBrand);
router.get('/category', productsController.getCategory);
router.post('/', readToken,productsController.addProduct);
router.delete('/:id', readToken,productsController.softDelete);
router.patch('/:id', readToken,productsController.editData);

module.exports=router;