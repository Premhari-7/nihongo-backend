const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');

mongoose.connect('mongodb://127.0.0.1:27017/nihongo')
  .then(() => console.log('MongoDB connected for seeding...'))
  .catch(err => console.log(err));

const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
const sections = ['Kanji', 'Vocabulary', 'Grammar'];

// Real vocabulary and kanji data to make realistic questions
const kanjiDict = {
    N5: [
        { k: '一', r: 'いち', e: 'One' }, { k: '二', r: 'に', e: 'Two' }, { k: '三', r: 'さん', e: 'Three' },
        { k: '四', r: 'よん', e: 'Four' }, { k: '五', r: 'ご', e: 'Five' }, { k: '六', r: 'ろく', e: 'Six' },
        { k: '日', r: 'にち', e: 'Sun/Day' }, { k: '月', r: 'げつ', e: 'Moon/Month' }, { k: '火', r: 'か', e: 'Fire' },
        { k: '水', r: 'みず', e: 'Water' }, { k: '木', r: 'き', e: 'Tree' }, { k: '金', r: 'きん', e: 'Gold' },
        { k: '土', r: 'つち', e: 'Earth' }, { k: '人', r: 'ひと', e: 'Person' }, { k: '本', r: 'ほん', e: 'Book' },
        { k: '男', r: 'おとこ', e: 'Man' }, { k: '女', r: 'おんな', e: 'Woman' }, { k: '子', r: 'こ', e: 'Child' },
        { k: '車', r: 'くるま', e: 'Car' }, { k: '学', r: 'がく', e: 'Study' }
    ],
    N4: [
        { k: '悪', r: 'わるい', e: 'Bad' }, { k: '安', r: 'やすい', e: 'Cheap' }, { k: '暗', r: 'くらい', e: 'Dark' },
        { k: '医', r: 'い', e: 'Doctor' }, { k: '意', r: 'い', e: 'Mind' }, { k: '育', r: 'いく', e: 'Nurture' },
        { k: '員', r: 'いん', e: 'Member' }, { k: '院', r: 'いん', e: 'Institution' }, { k: '飲', r: 'のむ', e: 'Drink' },
        { k: '運', r: 'うん', e: 'Carry' }, { k: '泳', r: 'およぐ', e: 'Swim' }, { k: '駅', r: 'えき', e: 'Station' },
        { k: '央', r: 'おう', e: 'Center' }, { k: '横', r: 'よこ', e: 'Side' }, { k: '屋', r: 'や', e: 'Shop' },
        { k: '温', r: 'あたたかい', e: 'Warm' }, { k: '化', r: 'か', e: 'Change' }, { k: '荷', r: 'に', e: 'Luggage' },
        { k: '界', r: 'かい', e: 'World' }, { k: '開', r: 'あける', e: 'Open' }
    ],
    N3: [
        { k: '愛', r: 'あい', e: 'Love' }, { k: '案', r: 'あん', e: 'Plan' }, { k: '以', r: 'い', e: 'By means of' },
        { k: '衣', r: 'ころも', e: 'Garment' }, { k: '位', r: 'くらい', e: 'Rank' }, { k: '囲', r: 'かこむ', e: 'Surround' },
        { k: '胃', r: 'い', e: 'Stomach' }, { k: '印', r: 'しるし', e: 'Mark' }, { k: '英', r: 'えい', e: 'England/Excellent' },
        { k: '栄', r: 'さかえる', e: 'Flourish' }, { k: '塩', r: 'しお', e: 'Salt' }, { k: '億', r: 'おく', e: 'Hundred Million' },
        { k: '加', r: 'くわえる', e: 'Add' }, { k: '果', r: 'はたす', e: 'Fruit/Result' }, { k: '貨', r: 'か', e: 'Freight' },
        { k: '課', r: 'か', e: 'Chapter' }, { k: '芽', r: 'め', e: 'Sprout' }, { k: '改', r: 'あらためる', e: 'Reform' },
        { k: '械', r: 'かい', e: 'Machine' }, { k: '害', r: 'がい', e: 'Harm' }
    ],
    N2: [
        { k: '圧', r: 'あつ', e: 'Pressure' }, { k: '移', r: 'うつる', e: 'Shift' }, { k: '因', r: 'よる', e: 'Cause' },
        { k: '永', r: 'ながい', e: 'Eternity' }, { k: '営', r: 'いとなむ', e: 'Manage' }, { k: '衛', r: 'えい', e: 'Defense' },
        { k: '易', r: 'やさしい', e: 'Easy' }, { k: '益', r: 'えき', e: 'Benefit' }, { k: '液', r: 'えき', e: 'Fluid' },
        { k: '演', r: 'えん', e: 'Perform' }, { k: '応', r: 'こたえる', e: 'Respond' }, { k: '往', r: 'おう', e: 'Journey' },
        { k: '桜', r: 'さくら', e: 'Cherry Blossom' }, { k: '恩', r: 'おん', e: 'Grace' }, { k: '可', r: 'か', e: 'Possible' },
        { k: '仮', r: 'かり', e: 'Temporary' }, { k: '価', r: 'あたい', e: 'Value' }, { k: '河', r: 'かわ', e: 'River' },
        { k: '過', r: 'すぎる', e: 'Exceed' }, { k: '賀', r: 'が', e: 'Congratulations' }
    ],
    N1: [
        { k: '亜', r: 'あ', e: 'Sub-' }, { k: '哀', r: 'あわれ', e: 'Pathetic' }, { k: '挨', r: 'あい', e: 'Approach' },
        { k: '曖', r: 'あい', e: 'Obscure' }, { k: '握', r: 'にぎる', e: 'Grip' }, { k: '扱', r: 'あつかう', e: 'Handle' },
        { k: '宛', r: 'あてる', e: 'Address' }, { k: '嵐', r: 'あらし', e: 'Storm' }, { k: '依', r: 'よる', e: 'Reliant' },
        { k: '威', r: 'い', e: 'Intimidate' }, { k: '為', r: 'ため', e: 'Do' }, { k: '畏', r: 'おそれる', e: 'Fear' },
        { k: '異', r: 'ことなる', e: 'Uncommon' }, { k: '維', r: 'い', e: 'Fiber' }, { k: '慰', r: 'なぐさめる', e: 'Console' },
        { k: '遺', r: 'のこす', e: 'Bequeath' }, { k: '緯', r: 'い', e: 'Horizontal' }, { k: '犠', r: 'ぎ', e: 'Sacrifice' },
        { k: '茂', r: 'しげる', e: 'Overgrown' }, { k: '繁', r: 'しげる', e: 'Luxuriant' }
    ]
};

const grammarDict = {
    N5: ['〜は〜です', '〜ます/〜ません', '〜に/〜へ', '〜を', '〜が', '〜て/〜で', '〜も', '〜から/〜まで', '〜と', '〜や'],
    N4: ['〜てみる', '〜やすい/にくい', '〜かもしれない', '〜ば/なら/たら', '〜ように', '〜ために', '〜つもり', '〜たがる', '〜はず', '〜らしい'],
    N3: ['〜について', '〜にとって', '〜として', '〜ばかり', '〜くらい', '〜代わりに', '〜うえに', '〜ために', '〜おかげで', '〜せいで'],
    N2: ['〜において', '〜に際して', '〜を問わず', '〜にかかわらず', '〜もかまわず', '〜はともかく', '〜はさておき', '〜わけがない', '〜どころではない', '〜ものか'],
    N1: ['〜あっての', '〜いかん', '〜かたがた', '〜かたわら', '〜がてら', '〜ずくめ', '〜すら', '〜そばから', '〜ただならぬ', '〜たりとも']
};

// Shuffle array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const generateOptions = (correctAnswer, allPossible, type) => {
    let options = [correctAnswer];
    while (options.length < 4) {
        let randomWrong = allPossible[Math.floor(Math.random() * allPossible.length)];
        if (!options.includes(randomWrong)) {
            options.push(randomWrong);
        }
    }
    options = shuffle(options);
    return {
        options,
        correctIndex: options.indexOf(correctAnswer)
    };
};

const generateQuestions = (level, section) => {
    const questions = [];
    const kanjis = kanjiDict[level];
    
    for (let i = 0; i < 20; i++) {
        let qText = '';
        let correctAnswer = '';
        let optionsArr = [];
        let exp = '';
        
        if (section === 'Kanji') {
            const k = kanjis[i];
            qText = `What is the correct reading for the kanji 「${k.k}」?`;
            correctAnswer = k.r;
            const allReadings = kanjis.map(x => x.r);
            const { options, correctIndex } = generateOptions(correctAnswer, allReadings);
            questions.push({
                question: qText,
                options,
                correctAnswerIndex: correctIndex,
                explanation: `「${k.k}」 is read as ${k.r} and means "${k.e}".`
            });
        } 
        else if (section === 'Vocabulary') {
            const k = kanjis[i];
            qText = `Which word translates to "${k.e}" in English?`;
            correctAnswer = k.k;
            const allKanjis = kanjis.map(x => x.k);
            const { options, correctIndex } = generateOptions(correctAnswer, allKanjis);
            questions.push({
                question: qText,
                options,
                correctAnswerIndex: correctIndex,
                explanation: `"${k.e}" translates to 「${k.k}」 (${k.r}).`
            });
        } 
        else if (section === 'Grammar') {
            const pattern = grammarDict[level][i % 10]; // Loop through 10 patterns to make 20 questions
            qText = `Choose the correct grammar pattern to complete the sentence using: ${pattern}`;
            correctAnswer = pattern;
            const { options, correctIndex } = generateOptions(correctAnswer, grammarDict[level]);
            questions.push({
                question: qText,
                options,
                correctAnswerIndex: correctIndex,
                explanation: `This pattern (${pattern}) is the standard grammar structure for this JLPT ${level} question.`
            });
        }
    }
    return questions;
};

const seedDB = async () => {
    try {
        await Quiz.deleteMany({}); // Clear existing quizzes
        
        const quizDocs = [];
        
        for (const level of levels) {
            for (const section of sections) {
                quizDocs.push({
                    jlptLevel: level,
                    section: section,
                    questions: generateQuestions(level, section)
                });
            }
        }
        
        await Quiz.insertMany(quizDocs);
        console.log(`Successfully seeded ${quizDocs.length} quiz banks (300 total questions)!`);
        
        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding DB:', err);
    }
};

seedDB();
