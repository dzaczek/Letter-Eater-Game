// Global language configuration
window.languageConfig = {
    supportedLanguages: {
        'pl': {
            name: 'Polish',
            eatText: 'Zjedzono literę {letter}!',
            outOfBounds: 'POZA GRANICAMI',
            gameOver: 'Koniec gry! Kliknij, aby kontynuować...',
            selectLanguage: 'Wybierz język',
            score: 'Wynik: {score}',
            powerups: 'Aktywne wzmocnienia: {powerups}'
        },
        'en': {
            name: 'English',
            eatText: 'Ate letter {letter}!',
            outOfBounds: 'OUT OF BOUNDS',
            gameOver: 'Game Over! Click to continue...',
            selectLanguage: 'Select Language',
            score: 'Score: {score}',
            powerups: 'Active Power-ups: {powerups}'
        },
        'de': {
            name: 'German',
            eatText: 'Buchstabe {letter} gefressen!',
            outOfBounds: 'AUSSERHALB DER GRENZEN',
            gameOver: 'Spiel vorbei! Klicken Sie zum Fortfahren...',
            selectLanguage: 'Sprache auswählen',
            score: 'Punktzahl: {score}',
            powerups: 'Aktive Verbesserungen: {powerups}'
        },
        'fr': {
            name: 'French',
            eatText: 'Lettre {letter} mangée !',
            outOfBounds: 'HORS LIMITES',
            gameOver: 'Partie terminée ! Cliquez pour continuer...',
            selectLanguage: 'Sélectionner la langue',
            score: 'Score: {score}',
            powerups: 'Améliorations actives: {powerups}'
        },
        'uk': {
            name: 'Ukrainian',
            eatText: 'З\'їдено літеру {letter}!',
            outOfBounds: 'ПОЗА МЕЖАМИ',
            gameOver: 'Гра закінчена! Натисніть, щоб продовжити...',
            selectLanguage: 'Виберіть мову',
            score: 'Рахунок: {score}',
            powerups: 'Активні покращення: {powerups}'
        },
        'es': {
            name: 'Spanish',
            eatText: '¡Comiste la letra {letter}!',
            outOfBounds: 'FUERA DE LÍMITES',
            gameOver: '¡Juego terminado! Haz clic para continuar...',
            selectLanguage: 'Seleccionar idioma',
            score: 'Puntuación: {score}',
            powerups: 'Mejoras activas: {powerups}'
        },
        'it': {
            name: 'Italian',
            eatText: 'Lettera {letter} mangiata!',
            outOfBounds: 'FUORI LIMITI',
            gameOver: 'Gioco finito! Clicca per continuare...',
            selectLanguage: 'Seleziona lingua',
            score: 'Punteggio: {score}',
            powerups: 'Potenziamenti attivi: {powerups}'
        },
        'ru': {
            name: 'Russian',
            eatText: 'Съедена буква {letter}!',
            outOfBounds: 'ВНЕ ГРАНИЦ',
            gameOver: 'Игра окончена! Нажмите, чтобы продолжить...',
            selectLanguage: 'Выберите язык',
            score: 'Счёт: {score}',
            powerups: 'Активные улучшения: {powerups}'
        },
        'ja': {
            name: 'Japanese',
            eatText: '文字{letter}を食べました！',
            outOfBounds: '範囲外',
            gameOver: 'ゲームオーバー！クリックして続ける...',
            selectLanguage: '言語を選択',
            score: 'スコア: {score}',
            powerups: 'アクティブな強化: {powerups}'
        },
        'zh': {
            name: 'Chinese',
            eatText: '吃掉了字母{letter}！',
            outOfBounds: '超出边界',
            gameOver: '游戏结束！点击继续...',
            selectLanguage: '选择语言',
            score: '分数: {score}',
            powerups: '激活的强化: {powerups}'
        },
        'ko': {
            name: 'Korean',
            eatText: '문자 {letter}를 먹었습니다!',
            outOfBounds: '경계를 벗어남',
            gameOver: '게임 오버! 계속하려면 클릭하세요...',
            selectLanguage: '언어 선택',
            score: '점수: {score}',
            powerups: '활성화된 강화: {powerups}'
        }
    },
    currentLanguage: 'pl',

    // Function to get text for current language
    getText(key, params = {}) {
        const lang = this.supportedLanguages[this.currentLanguage];
        if (!lang || !lang[key]) {
            console.warn(`Missing translation for key "${key}" in language "${this.currentLanguage}"`);
            return key;
        }
        
        let text = lang[key];
        
        // Replace parameters in text
        Object.entries(params).forEach(([key, value]) => {
            text = text.replace(`{${key}}`, value);
        });
        
        return text;
    },

    // Function to change language
    setLanguage(langCode) {
        if (this.supportedLanguages[langCode]) {
            this.currentLanguage = langCode;
            return true;
        }
        return false;
    },

    // Function to get all supported languages
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
}; 