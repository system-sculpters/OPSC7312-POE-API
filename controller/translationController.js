const { Translate } = require('@google-cloud/translate').v2;
const axios = require('axios')
const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY});

// const translateText = async (text, targetLanguage) => {
//     try {
//         const [translations] = await translate.translate(text, targetLanguage);
//         console.log(`Text: ${text}`);
//         console.log(`Translation: ${translations}`);
//         return translations
//       } catch (error) {
//         console.error('Error during translation:', error);
//       }
// }
const translateText = async (text, sourceLang, targetLang) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;

    try {
        const response = await axios.get(url);
        const translatedText = response.data.responseData.translatedText;

        return translatedText;
    } catch (error) {
        console.error('Error translating text:', error);
        return null;
    }
};

const reqTranslate  = async (req, res) => {
    const { sourceLang, targetLang } = req.params
    const { text } = req.body 

    try {
        const result = await translateText(text, sourceLang, targetLang)
        res.status(200).json(result)
    } catch (error) {
        console.error('translating text Transaction:', error);
        res.status(500).json({ error: 'Failed to delete Transaction' });
    }
}

module.exports = { reqTranslate }