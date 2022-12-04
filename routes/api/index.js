const router = require('express').Router();

router.use('/account', require('./account'));
router.use('/chat', require('./chat'))
router.use('/fileUpload', require('./fileUpload'))
module.exports = router;