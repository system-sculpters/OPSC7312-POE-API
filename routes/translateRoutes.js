const router = require('express').Router()
const { reqTranslate } = require('../controller/translationController')

router.post('/:sourceLang/:targetLang/translate', reqTranslate)

module.exports = router