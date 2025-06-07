const CONFIG = {
  
    defaultLanguage: 'en',
    soundCache: new Map(),
    currentLanguage: 'en'
};

// Function to get text for current language
function getText(key, params = {}) {
    const lang = CONFIG.languages[CONFIG.currentLanguage];
    let text = lang[key];
    
    // Replace parameters in text
    Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value);
    });
    
    return text;
}

// Function to get sound filename for a letter
function getSoundFilename(letter) {
    const lang = CONFIG.languages[CONFIG.currentLanguage];
    return `${lang.cachePrefix}${letter.toLowerCase()}${lang.cacheSuffix}`;
}

// Function to change language
function setLanguage(lang) {
    if (CONFIG.languages[lang]) {
        CONFIG.currentLanguage = lang;
        return true;
    }
    return false;
} 