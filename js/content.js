// Course content. Speaking-first: every item is a word or a ready-to-use phrase,
// with an example sentence to shadow. Pinyin shows dictionary tones, except 不 and 一,
// which are written as said (bú shì, yí ge), as textbooks do. The app works out the
// 3–3 changes (你好 → ní hǎo) itself and shows them under the pinyin.
//
// Item fields: id, zh (simplified), py (pinyin), en, ex: [zh, py, en], note?, lit? (word by word)

export const UNITS = [
  {
    id: 'u1', title: 'Hello & goodbye', emoji: '👋',
    items: [
      { id: 'nihao', zh: '你好', py: 'nǐ hǎo', en: 'hello', ex: ['你好，我是安娜。', 'Nǐ hǎo, wǒ shì Ānnà.', 'Hello, I\'m Anna.'], note: 'Two 3rd tones in a row: the first is said like a 2nd tone → ní hǎo. The "Tone change" line under the pinyin shows wherever this happens.', lit: 'you good' },
      { id: 'ninhao', zh: '您好', py: 'nín hǎo', en: 'hello (polite)', ex: ['老师，您好！', 'Lǎoshī, nín hǎo!', 'Hello, teacher!'], lit: 'you (polite) good' },
      { id: 'zaijian', zh: '再见', py: 'zài jiàn', en: 'goodbye', ex: ['明天见，再见！', 'Míngtiān jiàn, zàijiàn!', 'See you tomorrow, bye!'], lit: 'again see' },
      { id: 'xiexie', zh: '谢谢', py: 'xièxie', en: 'thank you', ex: ['谢谢你！', 'Xièxie nǐ!', 'Thank you!'] },
      { id: 'bukeqi', zh: '不客气', py: 'bú kèqi', en: 'you\'re welcome', ex: ['谢谢！——不客气。', 'Xièxie! — Bú kèqi.', 'Thanks! — You\'re welcome.'], note: '不 is normally bù, but becomes bú before a 4th tone.', lit: 'don\'t be so polite' },
      { id: 'duibuqi', zh: '对不起', py: 'duìbuqǐ', en: 'sorry', ex: ['对不起，我来晚了。', 'Duìbuqǐ, wǒ lái wǎn le.', 'Sorry, I\'m late.'], lit: 'can\'t face (you)' },
      { id: 'meiguanxi', zh: '没关系', py: 'méi guānxi', en: 'it\'s okay / no problem', ex: ['对不起！——没关系。', 'Duìbuqǐ! — Méi guānxi.', 'Sorry! — It\'s okay.'], lit: 'there\'s no connection' },
      { id: 'zaoshanghao', zh: '早上好', py: 'zǎoshang hǎo', en: 'good morning', ex: ['妈妈，早上好！', 'Māma, zǎoshang hǎo!', 'Good morning, Mom!'], lit: 'morning good' },
      { id: 'wanan', zh: '晚安', py: 'wǎn\'ān', en: 'good night', ex: ['我睡觉了，晚安！', 'Wǒ shuìjiào le, wǎn\'ān!', 'I\'m going to sleep, good night!'], lit: 'evening peace' },
      { id: 'mingtianjian', zh: '明天见', py: 'míngtiān jiàn', en: 'see you tomorrow', ex: ['好的，明天见！', 'Hǎo de, míngtiān jiàn!', 'Okay, see you tomorrow!'], lit: 'tomorrow see' },
    ],
  },
  {
    id: 'u2', title: 'Me & you', emoji: '🙋',
    items: [
      { id: 'wo', zh: '我', py: 'wǒ', en: 'I / me', ex: ['我很好。', 'Wǒ hěn hǎo.', 'I\'m well.'] },
      { id: 'ni', zh: '你', py: 'nǐ', en: 'you', ex: ['你呢？', 'Nǐ ne?', 'And you?'] },
      { id: 'ta', zh: '他 / 她', py: 'tā', en: 'he / she', ex: ['她是我朋友。', 'Tā shì wǒ péngyou.', 'She is my friend.'], note: 'Both sound exactly the same: tā.' },
      { id: 'women', zh: '我们', py: 'wǒmen', en: 'we / us', ex: ['我们走吧。', 'Wǒmen zǒu ba.', 'Let\'s go.'] },
      { id: 'shi', zh: '是', py: 'shì', en: 'to be (am / is / are)', ex: ['我是学生。', 'Wǒ shì xuésheng.', 'I am a student.'], note: 'Use 是 to link two nouns ("I am a student"), not with adjectives: "I\'m busy" is 我很忙, not 我是忙.' },
      { id: 'bushi', zh: '不是', py: 'bú shì', en: 'am not / is not', ex: ['我不是老师。', 'Wǒ bú shì lǎoshī.', 'I\'m not a teacher.'], lit: 'not be' },
      { id: 'jiao', zh: '我叫…', py: 'wǒ jiào…', en: 'my name is…', ex: ['我叫大卫。', 'Wǒ jiào Dàwèi.', 'My name is David.'], lit: 'I am called…' },
      { id: 'jiaoshenme', zh: '你叫什么名字？', py: 'nǐ jiào shénme míngzi?', en: 'what\'s your name?', ex: ['你好，你叫什么名字？', 'Nǐ hǎo, nǐ jiào shénme míngzi?', 'Hi, what\'s your name?'], lit: 'you are called what name?' },
      { id: 'henhao', zh: '很好', py: 'hěn hǎo', en: 'very good / very well', ex: ['我很好，谢谢。', 'Wǒ hěn hǎo, xièxie.', 'I\'m well, thanks.'], note: 'Before an adjective, 很 is often just a link, not "very": 我很好 simply means "I\'m well". Stress 很 when you do mean "very".' },
      { id: 'nihaoma', zh: '你好吗？', py: 'nǐ hǎo ma?', en: 'how are you?', ex: ['你好吗？——我很好。', 'Nǐ hǎo ma? — Wǒ hěn hǎo.', 'How are you? — I\'m well.'], note: '吗 (ma) at the end turns a statement into a yes/no question. 你好吗 is common in textbooks, but friends usually just say 你好.', lit: 'you good?' },
      { id: 'ne', zh: '你呢？', py: 'nǐ ne?', en: 'and you?', ex: ['我很好，你呢？', 'Wǒ hěn hǎo, nǐ ne?', 'I\'m well, and you?'] },
      { id: 'renshini', zh: '很高兴认识你', py: 'hěn gāoxìng rènshi nǐ', en: 'nice to meet you', ex: ['我叫安娜，很高兴认识你。', 'Wǒ jiào Ānnà, hěn gāoxìng rènshi nǐ.', 'I\'m Anna, nice to meet you.'], lit: 'very glad to know you' },
    ],
  },
  {
    id: 'u3', title: 'Numbers 1–10', emoji: '🔢',
    items: [
      { id: 'yi', zh: '一', py: 'yī', en: 'one', ex: ['一个人', 'yí ge rén', 'one person'], note: '一 changes tone: yí before a 4th tone, yì before tones 1–3.' },
      { id: 'er', zh: '二', py: 'èr', en: 'two', ex: ['二月', 'èryuè', 'February'] },
      { id: 'san', zh: '三', py: 'sān', en: 'three', ex: ['三个苹果', 'sān ge píngguǒ', 'three apples'], note: '个 (ge) is a measure word: Chinese puts one between a number and a noun, as in 三个苹果 (never 三苹果). 个 is the all-purpose one.' },
      { id: 'si', zh: '四', py: 'sì', en: 'four', ex: ['四点', 'sì diǎn', 'four o\'clock'] },
      { id: 'wu', zh: '五', py: 'wǔ', en: 'five', ex: ['五块钱', 'wǔ kuài qián', 'five yuan'] },
      { id: 'liu', zh: '六', py: 'liù', en: 'six', ex: ['六个人', 'liù ge rén', 'six people'] },
      { id: 'qi', zh: '七', py: 'qī', en: 'seven', ex: ['七天', 'qī tiān', 'seven days'] },
      { id: 'ba', zh: '八', py: 'bā', en: 'eight', ex: ['八点', 'bā diǎn', 'eight o\'clock'] },
      { id: 'jiu', zh: '九', py: 'jiǔ', en: 'nine', ex: ['九月', 'jiǔyuè', 'September'] },
      { id: 'shi2', zh: '十', py: 'shí', en: 'ten', ex: ['十块', 'shí kuài', 'ten yuan'] },
      { id: 'liang', zh: '两', py: 'liǎng', en: 'two (of something)', ex: ['两个人', 'liǎng ge rén', 'two people'], note: 'Use 两, not 二, when counting things.' },
      { id: 'ling', zh: '零', py: 'líng', en: 'zero', ex: ['一零一', 'yāo líng yāo', '101 (as a room number)'], note: 'In phone and room numbers, 一 is often read yāo.' },
    ],
  },
  {
    id: 'u4', title: 'Yes, no & questions', emoji: '❓',
    items: [
      { id: 'dui', zh: '对', py: 'duì', en: 'right / correct', ex: ['对，我是美国人。', 'Duì, wǒ shì Měiguó rén.', 'Right, I\'m American.'], note: 'Chinese has no single word for "yes" or "no". Answer with the verb from the question: 是 / 不是, 有 / 没有, 要 / 不要. 对 means "that\'s right".' },
      { id: 'budui', zh: '不对', py: 'bú duì', en: 'not right / wrong', ex: ['不对，是八点。', 'Bú duì, shì bā diǎn.', 'No, it\'s eight o\'clock.'] },
      { id: 'hao', zh: '好', py: 'hǎo', en: 'good / okay', ex: ['好，我们走吧。', 'Hǎo, wǒmen zǒu ba.', 'Okay, let\'s go.'] },
      { id: 'haode', zh: '好的', py: 'hǎo de', en: 'okay / sure', ex: ['好的，没问题。', 'Hǎo de, méi wèntí.', 'Sure, no problem.'] },
      { id: 'meiwenti', zh: '没问题', py: 'méi wèntí', en: 'no problem', ex: ['明天？没问题！', 'Míngtiān? Méi wèntí!', 'Tomorrow? No problem!'] },
      { id: 'shenme', zh: '什么', py: 'shénme', en: 'what', ex: ['这是什么？', 'Zhè shì shénme?', 'What is this?'], note: 'Questions with 什么, 谁 or 哪里 don\'t take 吗. The question word goes where the answer would: 这是什么？ → 这是茶。' },
      { id: 'shei', zh: '谁', py: 'shéi', en: 'who', ex: ['他是谁？', 'Tā shì shéi?', 'Who is he?'], note: 'Also said shuí.' },
      { id: 'nali', zh: '哪里', py: 'nǎlǐ', en: 'where', ex: ['洗手间在哪里？', 'Xǐshǒujiān zài nǎlǐ?', 'Where is the restroom?'], note: '哪里 nǎlǐ (where?) and 那里 nàlǐ (there) differ only in tone, and 哪里 is said nálǐ (two 3rd tones).', lit: 'which place' },
      { id: 'zenmeyang', zh: '怎么样', py: 'zěnmeyàng', en: 'how is it? / how about…?', ex: ['明天怎么样？', 'Míngtiān zěnmeyàng?', 'How about tomorrow?'] },
      { id: 'weishenme', zh: '为什么', py: 'wèishénme', en: 'why', ex: ['你为什么学中文？', 'Nǐ wèishénme xué Zhōngwén?', 'Why are you learning Chinese?'], lit: 'for what' },
      { id: 'duoshao', zh: '多少', py: 'duōshao', en: 'how many / how much', ex: ['多少钱？', 'Duōshao qián?', 'How much is it?'], note: '多少 asks about any amount. For small numbers, like the time or people in a family, use 几 jǐ: 几点？ 几口人？', lit: 'many-few' },
    ],
  },
  {
    id: 'u5', title: 'Survival phrases', emoji: '🆘',
    items: [
      { id: 'tingbudong', zh: '我听不懂', py: 'wǒ tīng bu dǒng', en: 'I don\'t understand (what I hear)', ex: ['对不起，我听不懂。', 'Duìbuqǐ, wǒ tīng bu dǒng.', 'Sorry, I don\'t understand.'], lit: 'I listen not understand' },
      { id: 'mandian', zh: '请说慢一点', py: 'qǐng shuō màn yìdiǎn', en: 'please speak a bit slower', ex: ['老师，请说慢一点。', 'Lǎoshī, qǐng shuō màn yìdiǎn.', 'Teacher, please speak a bit slower.'], lit: 'please speak slow a little' },
      { id: 'zaishuo', zh: '请再说一遍', py: 'qǐng zài shuō yí biàn', en: 'please say it again', ex: ['对不起，请再说一遍。', 'Duìbuqǐ, qǐng zài shuō yí biàn.', 'Sorry, please say it again.'], lit: 'please again say one time' },
      { id: 'zenmeshuo', zh: '…用中文怎么说？', py: '… yòng Zhōngwén zěnme shuō?', en: 'how do you say … in Chinese?', ex: ['"Apple" 用中文怎么说？', '"Apple" yòng Zhōngwén zěnme shuō?', 'How do you say "apple" in Chinese?'], lit: '… use Chinese how say?' },
      { id: 'shenmeyisi', zh: '…是什么意思？', py: '… shì shénme yìsi?', en: 'what does … mean?', ex: ['这个词是什么意思？', 'Zhège cí shì shénme yìsi?', 'What does this word mean?'], lit: '… is what meaning?' },
      { id: 'huishuo', zh: '我会说一点中文', py: 'wǒ huì shuō yìdiǎn Zhōngwén', en: 'I can speak a little Chinese', ex: ['我会说一点中文，不多。', 'Wǒ huì shuō yìdiǎn Zhōngwén, bù duō.', 'I speak a little Chinese, not much.'] },
      { id: 'buzhidao', zh: '我不知道', py: 'wǒ bù zhīdào', en: 'I don\'t know', ex: ['他在哪里？我不知道。', 'Tā zài nǎlǐ? Wǒ bù zhīdào.', 'Where is he? I don\'t know.'], lit: 'I not know' },
      { id: 'dengyixia', zh: '等一下', py: 'děng yíxià', en: 'wait a moment', ex: ['请等一下。', 'Qǐng děng yíxià.', 'Please wait a moment.'] },
      { id: 'qing', zh: '请', py: 'qǐng', en: 'please', ex: ['请进！', 'Qǐng jìn!', 'Please come in!'] },
      { id: 'keyima', zh: '可以吗？', py: 'kěyǐ ma?', en: 'is that okay? / may I?', ex: ['我坐这里，可以吗？', 'Wǒ zuò zhèlǐ, kěyǐ ma?', 'May I sit here?'] },
    ],
  },
  {
    id: 'u6', title: 'Family & people', emoji: '👨‍👩‍👧',
    items: [
      { id: 'baba', zh: '爸爸', py: 'bàba', en: 'dad', ex: ['我爸爸是医生。', 'Wǒ bàba shì yīshēng.', 'My dad is a doctor.'] },
      { id: 'mama', zh: '妈妈', py: 'māma', en: 'mom', ex: ['我妈妈很好。', 'Wǒ māma hěn hǎo.', 'My mom is well.'] },
      { id: 'pengyou', zh: '朋友', py: 'péngyou', en: 'friend', ex: ['他是我的好朋友。', 'Tā shì wǒ de hǎo péngyou.', 'He\'s my good friend.'] },
      { id: 'laoshi', zh: '老师', py: 'lǎoshī', en: 'teacher', ex: ['我的老师是中国人。', 'Wǒ de lǎoshī shì Zhōngguó rén.', 'My teacher is Chinese.'] },
      { id: 'xuesheng', zh: '学生', py: 'xuésheng', en: 'student', ex: ['你是学生吗？', 'Nǐ shì xuésheng ma?', 'Are you a student?'] },
      { id: 'de', zh: '的', py: 'de', en: '\'s (possession)', ex: ['这是我的手机。', 'Zhè shì wǒ de shǒujī.', 'This is my phone.'], note: 'With family and close relationships, 的 is usually left out: 我妈妈, 我家.' },
      { id: 'you', zh: '有', py: 'yǒu', en: 'to have / there is', ex: ['我有一个哥哥。', 'Wǒ yǒu yí ge gēge.', 'I have an older brother.'] },
      { id: 'meiyou', zh: '没有', py: 'méiyǒu', en: 'not have / there isn\'t', ex: ['我没有时间。', 'Wǒ méiyǒu shíjiān.', 'I don\'t have time.'], note: 'Negate 有 with 没, never with 不.' },
      { id: 'gege', zh: '哥哥', py: 'gēge', en: 'older brother', ex: ['我哥哥二十岁。', 'Wǒ gēge èrshí suì.', 'My older brother is twenty.'] },
      { id: 'jiejie', zh: '姐姐', py: 'jiějie', en: 'older sister', ex: ['她是我姐姐。', 'Tā shì wǒ jiějie.', 'She is my older sister.'] },
      { id: 'jikouren', zh: '你家有几口人？', py: 'nǐ jiā yǒu jǐ kǒu rén?', en: 'how many people are in your family?', ex: ['你家有几口人？——四口人。', 'Nǐ jiā yǒu jǐ kǒu rén? — Sì kǒu rén.', 'How many in your family? — Four.'], lit: 'your family has how many mouths of people?' },
    ],
  },
  {
    id: 'u7', title: 'Where are you from?', emoji: '🌍',
    items: [
      { id: 'narenr', zh: '你是哪国人？', py: 'nǐ shì nǎ guó rén?', en: 'what country are you from?', ex: ['你是哪国人？——我是英国人。', 'Nǐ shì nǎ guó rén? — Wǒ shì Yīngguó rén.', 'Where are you from? — I\'m British.'], lit: 'you are which country person?' },
      { id: 'zhongguo', zh: '中国', py: 'Zhōngguó', en: 'China', ex: ['我想去中国。', 'Wǒ xiǎng qù Zhōngguó.', 'I want to go to China.'], lit: 'middle country' },
      { id: 'zhongwen', zh: '中文', py: 'Zhōngwén', en: 'Chinese (language)', ex: ['我在学中文。', 'Wǒ zài xué Zhōngwén.', 'I\'m learning Chinese.'] },
      { id: 'yingwen', zh: '英文', py: 'Yīngwén', en: 'English (language)', ex: ['你会说英文吗？', 'Nǐ huì shuō Yīngwén ma?', 'Can you speak English?'] },
      { id: 'meiguo', zh: '美国', py: 'Měiguó', en: 'USA', ex: ['他是美国人。', 'Tā shì Měiguó rén.', 'He is American.'], lit: 'beautiful country' },
      { id: 'yingguo', zh: '英国', py: 'Yīngguó', en: 'UK', ex: ['我住在英国。', 'Wǒ zhù zài Yīngguó.', 'I live in the UK.'] },
      { id: 'ren', zh: '人', py: 'rén', en: 'person', ex: ['中国人', 'Zhōngguó rén', 'Chinese person'], note: 'Country + 人 = a person from that country.' },
      { id: 'zhuzai', zh: '住在…', py: 'zhù zài…', en: 'to live in…', ex: ['你住在哪里？', 'Nǐ zhù zài nǎlǐ?', 'Where do you live?'], lit: 'live at…' },
      { id: 'xue', zh: '学', py: 'xué', en: 'to study / learn', ex: ['我每天学中文。', 'Wǒ měitiān xué Zhōngwén.', 'I study Chinese every day.'] },
      { id: 'huishuo2', zh: '会说', py: 'huì shuō', en: 'can speak', ex: ['她会说三种语言。', 'Tā huì shuō sān zhǒng yǔyán.', 'She can speak three languages.'], note: '会 is "can" for a learned skill, like speaking a language. To ask permission ("may I?"), use 可以.' },
    ],
  },
  {
    id: 'u8', title: 'Food & drink', emoji: '🍜',
    items: [
      { id: 'chi', zh: '吃', py: 'chī', en: 'to eat', ex: ['你想吃什么？', 'Nǐ xiǎng chī shénme?', 'What do you want to eat?'] },
      { id: 'he', zh: '喝', py: 'hē', en: 'to drink', ex: ['你喝什么？', 'Nǐ hē shénme?', 'What will you drink?'] },
      { id: 'xiang', zh: '想', py: 'xiǎng', en: 'to want to / would like', ex: ['我想喝水。', 'Wǒ xiǎng hē shuǐ.', 'I\'d like some water.'] },
      { id: 'yao', zh: '要', py: 'yào', en: 'to want (to order)', ex: ['我要这个。', 'Wǒ yào zhège.', 'I\'ll have this one.'], note: '要 is direct ("I want", "I\'ll have") and normal when ordering. 想 is softer ("I\'d like to").' },
      { id: 'shui', zh: '水', py: 'shuǐ', en: 'water', ex: ['请给我一杯水。', 'Qǐng gěi wǒ yì bēi shuǐ.', 'A glass of water, please.'] },
      { id: 'cha', zh: '茶', py: 'chá', en: 'tea', ex: ['我喜欢喝茶。', 'Wǒ xǐhuan hē chá.', 'I like drinking tea.'] },
      { id: 'kafei', zh: '咖啡', py: 'kāfēi', en: 'coffee', ex: ['一杯咖啡，谢谢。', 'Yì bēi kāfēi, xièxie.', 'A coffee, thanks.'] },
      { id: 'mifan', zh: '米饭', py: 'mǐfàn', en: 'rice (cooked)', ex: ['我要一碗米饭。', 'Wǒ yào yì wǎn mǐfàn.', 'I\'d like a bowl of rice.'], lit: 'rice meal' },
      { id: 'haochi', zh: '好吃', py: 'hǎochī', en: 'tasty', ex: ['这个很好吃！', 'Zhège hěn hǎochī!', 'This is really tasty!'], lit: 'good (to) eat' },
      { id: 'maidan', zh: '买单', py: 'mǎidān', en: 'the bill, please', ex: ['服务员，买单！', 'Fúwùyuán, mǎidān!', 'Waiter, the bill please!'], lit: 'buy the bill' },
      { id: 'buyaola', zh: '不要辣', py: 'bú yào là', en: 'not spicy, please', ex: ['我不要辣，谢谢。', 'Wǒ bú yào là, xièxie.', 'No spice for me, thanks.'], lit: 'not want spicy' },
      { id: 'xihuan', zh: '喜欢', py: 'xǐhuan', en: 'to like', ex: ['你喜欢中国菜吗？', 'Nǐ xǐhuan Zhōngguó cài ma?', 'Do you like Chinese food?'] },
    ],
  },
  {
    id: 'u9', title: 'Shopping & money', emoji: '🛍️',
    items: [
      { id: 'duoshaoqian', zh: '多少钱？', py: 'duōshao qián?', en: 'how much does it cost?', ex: ['这个多少钱？', 'Zhège duōshao qián?', 'How much is this?'], lit: 'many-few money?' },
      { id: 'kuai', zh: '块', py: 'kuài', en: 'yuan (spoken)', ex: ['十五块。', 'Shíwǔ kuài.', 'Fifteen yuan.'] },
      { id: 'tai_gui', zh: '太贵了', py: 'tài guì le', en: 'too expensive', ex: ['太贵了，便宜一点吧。', 'Tài guì le, piányi yìdiǎn ba.', 'Too expensive, make it a bit cheaper.'], note: '太 … 了 means "too …", or for good things "so …": 太贵了 too expensive, 太好了 great!' },
      { id: 'pianyi', zh: '便宜', py: 'piányi', en: 'cheap', ex: ['这个很便宜。', 'Zhège hěn piányi.', 'This one is cheap.'] },
      { id: 'mai', zh: '买', py: 'mǎi', en: 'to buy', ex: ['我想买这个。', 'Wǒ xiǎng mǎi zhège.', 'I want to buy this.'], note: '买 mǎi (buy) and 卖 mài (sell) differ only in tone.' },
      { id: 'zhege', zh: '这个', py: 'zhège', en: 'this one', ex: ['我要这个。', 'Wǒ yào zhège.', 'I want this one.'], note: 'In everyday speech often zhèige (and 那个 nèige).' },
      { id: 'nage', zh: '那个', py: 'nàge', en: 'that one', ex: ['那个是什么？', 'Nàge shì shénme?', 'What is that?'] },
      { id: 'weixin', zh: '可以用微信吗？', py: 'kěyǐ yòng Wēixìn ma?', en: 'can I pay with WeChat?', ex: ['可以用微信付钱吗？', 'Kěyǐ yòng Wēixìn fù qián ma?', 'Can I pay with WeChat?'] },
      { id: 'kankan', zh: '我看看', py: 'wǒ kànkan', en: 'I\'m just looking', ex: ['谢谢，我先看看。', 'Xièxie, wǒ xiān kànkan.', 'Thanks, I\'m just looking first.'], note: 'Saying a verb twice makes it light and brief: 看看 is "have a quick look".', lit: 'I look look' },
      { id: 'buyao', zh: '不要', py: 'bú yào', en: 'don\'t want / no thanks', ex: ['不要，谢谢。', 'Bú yào, xièxie.', 'No thanks.'] },
    ],
  },
  {
    id: 'u10', title: 'Time & days', emoji: '🕐',
    items: [
      { id: 'jintian', zh: '今天', py: 'jīntiān', en: 'today', ex: ['今天很忙。', 'Jīntiān hěn máng.', 'Today is busy.'] },
      { id: 'mingtian', zh: '明天', py: 'míngtiān', en: 'tomorrow', ex: ['明天你有时间吗？', 'Míngtiān nǐ yǒu shíjiān ma?', 'Are you free tomorrow?'], note: 'Time words go before the verb, never at the end as in English: 明天你有时间吗？ or 你明天有时间吗？' },
      { id: 'zuotian', zh: '昨天', py: 'zuótiān', en: 'yesterday', ex: ['昨天我很累。', 'Zuótiān wǒ hěn lèi.', 'I was tired yesterday.'] },
      { id: 'xianzai', zh: '现在', py: 'xiànzài', en: 'now', ex: ['现在几点？', 'Xiànzài jǐ diǎn?', 'What time is it now?'] },
      { id: 'jidian', zh: '几点？', py: 'jǐ diǎn?', en: 'what time?', ex: ['我们几点见？', 'Wǒmen jǐ diǎn jiàn?', 'What time shall we meet?'], lit: 'how many o\'clock?' },
      { id: 'dian', zh: '点', py: 'diǎn', en: 'o\'clock', ex: ['三点半', 'sān diǎn bàn', 'half past three'] },
      { id: 'ban', zh: '半', py: 'bàn', en: 'half', ex: ['七点半起床。', 'Qī diǎn bàn qǐchuáng.', 'Get up at 7:30.'] },
      { id: 'shijian', zh: '时间', py: 'shíjiān', en: 'time', ex: ['你有时间吗？', 'Nǐ yǒu shíjiān ma?', 'Do you have time?'] },
      { id: 'zhoumo', zh: '周末', py: 'zhōumò', en: 'weekend', ex: ['周末你做什么？', 'Zhōumò nǐ zuò shénme?', 'What are you doing this weekend?'] },
      { id: 'xingqi', zh: '星期一', py: 'xīngqī yī', en: 'Monday', ex: ['星期一我上班。', 'Xīngqī yī wǒ shàngbān.', 'I work on Monday.'], note: '星期 + number: 一 Monday … 六 Saturday; Sunday is 星期天.' },
    ],
  },
  {
    id: 'u11', title: 'Getting around', emoji: '🚕',
    items: [
      { id: 'qu', zh: '去', py: 'qù', en: 'to go', ex: ['你去哪里？', 'Nǐ qù nǎlǐ?', 'Where are you going?'] },
      { id: 'zai', zh: '在', py: 'zài', en: 'to be at / in', ex: ['我在家。', 'Wǒ zài jiā.', 'I\'m at home.'], note: 'Before another verb, 在 means "in the middle of doing": 我在学中文 (I\'m learning Chinese).' },
      { id: 'zhelinali', zh: '这里 / 那里', py: 'zhèlǐ / nàlǐ', en: 'here / there', ex: ['请在这里停。', 'Qǐng zài zhèlǐ tíng.', 'Please stop here.'], note: '那里 nàlǐ (there) and 哪里 nǎlǐ (where?) differ only in tone.' },
      { id: 'zuozhuan', zh: '左转', py: 'zuǒ zhuǎn', en: 'turn left', ex: ['前面左转。', 'Qiánmiàn zuǒ zhuǎn.', 'Turn left up ahead.'] },
      { id: 'youzhuan', zh: '右转', py: 'yòu zhuǎn', en: 'turn right', ex: ['第二个路口右转。', 'Dì èr ge lùkǒu yòu zhuǎn.', 'Turn right at the second intersection.'] },
      { id: 'yizhizou', zh: '一直走', py: 'yìzhí zǒu', en: 'go straight', ex: ['一直走，就到了。', 'Yìzhí zǒu, jiù dào le.', 'Go straight and you\'re there.'] },
      { id: 'yuan', zh: '远吗？', py: 'yuǎn ma?', en: 'is it far?', ex: ['地铁站远吗？', 'Dìtiě zhàn yuǎn ma?', 'Is the subway station far?'] },
      { id: 'ditie', zh: '地铁', py: 'dìtiě', en: 'subway', ex: ['我坐地铁去。', 'Wǒ zuò dìtiě qù.', 'I\'ll take the subway.'], lit: 'ground iron' },
      { id: 'xishoujian', zh: '洗手间', py: 'xǐshǒujiān', en: 'restroom', ex: ['请问，洗手间在哪里？', 'Qǐngwèn, xǐshǒujiān zài nǎlǐ?', 'Excuse me, where\'s the restroom?'], lit: 'wash-hands room' },
      { id: 'qingwen', zh: '请问', py: 'qǐngwèn', en: 'excuse me (may I ask)', ex: ['请问，这是哪里？', 'Qǐngwèn, zhè shì nǎlǐ?', 'Excuse me, where am I?'], note: 'The "excuse me" before a question. For "excuse me, sorry", use 对不起.', lit: 'please ask' },
    ],
  },
  {
    id: 'u12', title: 'Feelings & chatting', emoji: '💬',
    items: [
      { id: 'lei', zh: '累', py: 'lèi', en: 'tired', ex: ['我今天很累。', 'Wǒ jīntiān hěn lèi.', 'I\'m tired today.'] },
      { id: 'e', zh: '饿', py: 'è', en: 'hungry', ex: ['你饿了吗？', 'Nǐ è le ma?', 'Are you hungry?'] },
      { id: 'mang', zh: '忙', py: 'máng', en: 'busy', ex: ['你忙吗？——不太忙。', 'Nǐ máng ma? — Bú tài máng.', 'Are you busy? — Not too busy.'] },
      { id: 'gaoxing', zh: '高兴', py: 'gāoxìng', en: 'happy / glad', ex: ['我很高兴。', 'Wǒ hěn gāoxìng.', 'I\'m happy.'], lit: 'high mood' },
      { id: 'taihaole', zh: '太好了！', py: 'tài hǎo le!', en: 'great! / wonderful!', ex: ['你来了？太好了！', 'Nǐ lái le? Tài hǎo le!', 'You came? Great!'], lit: 'too good!' },
      { id: 'zhende', zh: '真的吗？', py: 'zhēn de ma?', en: 'really?', ex: ['真的吗？我不知道！', 'Zhēn de ma? Wǒ bù zhīdào!', 'Really? I didn\'t know!'] },
      { id: 'juede', zh: '我觉得…', py: 'wǒ juéde…', en: 'I think / I feel…', ex: ['我觉得中文很有意思。', 'Wǒ juéde Zhōngwén hěn yǒu yìsi.', 'I think Chinese is interesting.'] },
      { id: 'youyisi', zh: '有意思', py: 'yǒu yìsi', en: 'interesting / fun', ex: ['这个电影很有意思。', 'Zhège diànyǐng hěn yǒu yìsi.', 'This movie is really interesting.'], lit: 'has meaning' },
      { id: 'yiqi', zh: '一起', py: 'yìqǐ', en: 'together', ex: ['我们一起吃饭吧。', 'Wǒmen yìqǐ chīfàn ba.', 'Let\'s eat together.'] },
      { id: 'ba_sugg', zh: '…吧', py: '… ba', en: 'let\'s… (suggestion)', ex: ['我们走吧！', 'Wǒmen zǒu ba!', 'Let\'s go!'], note: '吧 at the end softens a sentence into a suggestion.' },
      { id: 'jiayou', zh: '加油！', py: 'jiāyóu!', en: 'you can do it! / go for it!', ex: ['学中文，加油！', 'Xué Zhōngwén, jiāyóu!', 'Keep going with Chinese!'], lit: 'add oil!' },
    ],
  },
];

// Syllables with one common character per tone, for the tone trainer.
// Tone numbers index the chars array: [tone1, tone2, tone3, tone4].
export const TONE_SETS = [
  { base: 'ma', py: ['mā', 'má', 'mǎ', 'mà'], zh: ['妈', '麻', '马', '骂'] },
  { base: 'yi', py: ['yī', 'yí', 'yǐ', 'yì'], zh: ['衣', '姨', '椅', '亿'] },
  { base: 'ba', py: ['bā', 'bá', 'bǎ', 'bà'], zh: ['八', '拔', '把', '爸'] },
  { base: 'tang', py: ['tāng', 'táng', 'tǎng', 'tàng'], zh: ['汤', '糖', '躺', '烫'] },
  { base: 'shi', py: ['shī', 'shí', 'shǐ', 'shì'], zh: ['诗', '十', '使', '是'] },
  { base: 'guo', py: ['guō', 'guó', 'guǒ', 'guò'], zh: ['锅', '国', '果', '过'] },
  { base: 'tu', py: ['tū', 'tú', 'tǔ', 'tù'], zh: ['秃', '图', '土', '兔'] },
  { base: 'fan', py: ['fān', 'fán', 'fǎn', 'fàn'], zh: ['翻', '烦', '反', '饭'] },
  { base: 'mi', py: ['mī', 'mí', 'mǐ', 'mì'], zh: ['眯', '迷', '米', '蜜'] },
  { base: 'qi', py: ['qī', 'qí', 'qǐ', 'qì'], zh: ['七', '骑', '起', '气'] },
  { base: 'wen', py: ['wēn', 'wén', 'wěn', 'wèn'], zh: ['温', '文', '稳', '问'] },
  { base: 'bi', py: ['bī', 'bí', 'bǐ', 'bì'], zh: ['逼', '鼻', '笔', '必'] },
];

export const TONE_INFO = [
  { n: 1, name: '1st tone', shape: 'high & flat', tip: 'Hold one high note, like singing "laaa".', path: [[0, 5], [1, 5]] },
  { n: 2, name: '2nd tone', shape: 'rising', tip: 'Rise like asking "Huh?"', path: [[0, 3], [1, 5]] },
  { n: 3, name: '3rd tone', shape: 'low (dip)', tip: 'Dip low, then come back up. (Inside words it usually just stays low.)', path: [[0, 2], [0.5, 1], [1, 3.5]] },
  { n: 4, name: '4th tone', shape: 'falling', tip: 'Drop sharply, like a firm "No!"', path: [[0, 5], [1, 1]] },
];

// Real two-syllable words for the tone-pair stage: 3 per tone combination.
// 3–3 words are left out on purpose: they're spoken 2–3 (tone sandhi), which is taught later with phrases.
export const PAIR_WORDS = [
  ['飞机', 'fēijī', 'airplane'], ['咖啡', 'kāfēi', 'coffee'], ['今天', 'jīntiān', 'today'],
  ['中国', 'Zhōngguó', 'China'], ['欢迎', 'huānyíng', 'welcome'], ['公园', 'gōngyuán', 'park'],
  ['身体', 'shēntǐ', 'body'], ['铅笔', 'qiānbǐ', 'pencil'], ['开始', 'kāishǐ', 'to begin'],
  ['医院', 'yīyuàn', 'hospital'], ['音乐', 'yīnyuè', 'music'], ['高兴', 'gāoxìng', 'happy'],
  ['明天', 'míngtiān', 'tomorrow'], ['房间', 'fángjiān', 'room'], ['国家', 'guójiā', 'country'],
  ['学习', 'xuéxí', 'to study'], ['银行', 'yínháng', 'bank'], ['同学', 'tóngxué', 'classmate'],
  ['苹果', 'píngguǒ', 'apple'], ['没有', 'méiyǒu', 'not have'], ['游泳', 'yóuyǒng', 'to swim'],
  ['学校', 'xuéxiào', 'school'], ['同事', 'tóngshì', 'colleague'], ['迟到', 'chídào', 'to be late'],
  ['老师', 'lǎoshī', 'teacher'], ['北京', 'Běijīng', 'Beijing'], ['手机', 'shǒujī', 'mobile phone'],
  ['美国', 'Měiguó', 'USA'], ['旅行', 'lǚxíng', 'to travel'], ['可能', 'kěnéng', 'maybe'],
  ['考试', 'kǎoshì', 'exam'], ['马上', 'mǎshàng', 'right away'], ['米饭', 'mǐfàn', 'rice'],
  ['面包', 'miànbāo', 'bread'], ['上班', 'shàngbān', 'to go to work'], ['汽车', 'qìchē', 'car'],
  ['问题', 'wèntí', 'question'], ['大学', 'dàxué', 'university'], ['练习', 'liànxí', 'to practise'],
  ['电脑', 'diànnǎo', 'computer'], ['汉语', 'Hànyǔ', 'Chinese language'], ['跳舞', 'tiàowǔ', 'to dance'],
  ['再见', 'zàijiàn', 'goodbye'], ['电视', 'diànshì', 'TV'], ['睡觉', 'shuìjiào', 'to sleep'],
].map(([zh, py, en]) => ({ zh, py, en }));

// Words where what you hear differs from the dictionary tones, for the tone-changes stage.
// [zh, written pinyin, spoken pinyin (only when it differs), en]. Unmarked syllables are neutral tone.
export const CHANGE_WORDS = [
  // Neutral tone: the second syllable is short and light, its pitch set by the tone before it.
  ['妈妈', 'māma', null, 'mom'], ['哥哥', 'gēge', null, 'older brother'], ['东西', 'dōngxi', null, 'thing'],
  ['衣服', 'yīfu', null, 'clothes'], ['先生', 'xiānsheng', null, 'Mr. / sir'], ['他们', 'tāmen', null, 'they'],
  ['朋友', 'péngyou', null, 'friend'], ['名字', 'míngzi', null, 'name'], ['孩子', 'háizi', null, 'child'],
  ['什么', 'shénme', null, 'what'], ['便宜', 'piányi', null, 'cheap'], ['石头', 'shítou', null, 'stone'],
  ['姐姐', 'jiějie', null, 'older sister'], ['喜欢', 'xǐhuan', null, 'to like'], ['我们', 'wǒmen', null, 'we'],
  ['椅子', 'yǐzi', null, 'chair'], ['耳朵', 'ěrduo', null, 'ear'], ['奶奶', 'nǎinai', null, 'grandma'],
  ['爸爸', 'bàba', null, 'dad'], ['谢谢', 'xièxie', null, 'thank you'], ['意思', 'yìsi', null, 'meaning'],
  ['漂亮', 'piàoliang', null, 'pretty'], ['弟弟', 'dìdi', null, 'younger brother'], ['看看', 'kànkan', null, 'have a look'],
  // Two 3rd tones: the first one is said as a 2nd tone.
  ['你好', 'nǐ hǎo', 'ní hǎo', 'hello'], ['很好', 'hěn hǎo', 'hén hǎo', 'very good'], ['可以', 'kěyǐ', 'kéyǐ', 'can / may'],
  ['水果', 'shuǐguǒ', 'shuíguǒ', 'fruit'], ['老虎', 'lǎohǔ', 'láohǔ', 'tiger'], ['小姐', 'xiǎojiě', 'xiáojiě', 'Miss'],
  ['洗澡', 'xǐzǎo', 'xízǎo', 'to shower'], ['手表', 'shǒubiǎo', 'shóubiǎo', 'watch'], ['雨伞', 'yǔsǎn', 'yúsǎn', 'umbrella'],
  ['所以', 'suǒyǐ', 'suóyǐ', 'so / therefore'], ['口语', 'kǒuyǔ', 'kóuyǔ', 'spoken language'], ['很远', 'hěn yuǎn', 'hén yuǎn', 'very far'],
  // 不 (bù) becomes bú before a 4th tone, and stays bù otherwise.
  ['不是', 'bù shì', 'bú shì', 'is not'], ['不对', 'bù duì', 'bú duì', 'not right'], ['不要', 'bù yào', 'bú yào', 'don\'t want'],
  ['不去', 'bù qù', 'bú qù', 'not go'], ['不好', 'bù hǎo', null, 'not good'], ['不来', 'bù lái', null, 'not come'],
  ['不喝', 'bù hē', null, 'not drink'], ['不忙', 'bù máng', null, 'not busy'],
  // 一 (yī) becomes yí before a 4th tone and yì before tones 1–3.
  ['一样', 'yīyàng', 'yíyàng', 'the same'], ['一定', 'yīdìng', 'yídìng', 'definitely'], ['一半', 'yībàn', 'yíbàn', 'half'],
  ['一起', 'yīqǐ', 'yìqǐ', 'together'], ['一天', 'yī tiān', 'yì tiān', 'one day'], ['一年', 'yī nián', 'yì nián', 'one year'],
].map(([zh, py, said, en]) => ({ zh, py, said: said || py, en }));

// Sounds English speakers mix up. Each group differs in one sound only and shares a tone,
// so the only thing to listen for is the contrast itself.
export const SOUND_SETS = [
  { id: 'zh-j-z', label: 'zh · j · z', tip: 'zh: tongue tip curled back. j: tongue flat behind the lower teeth, lips spread. z: like the "ds" in "kids".',
    groups: [[['知', 'zhī'], ['鸡', 'jī'], ['资', 'zī']], [['找', 'zhǎo'], ['早', 'zǎo']], [['战', 'zhàn'], ['赞', 'zàn']]] },
  { id: 'ch-q-c', label: 'ch · q · c', tip: 'Same tongue positions as zh · j · z, plus a strong puff of air. c sounds like the "ts" in "cats".',
    groups: [[['吃', 'chī'], ['七', 'qī'], ['疵', 'cī']], [['炒', 'chǎo'], ['草', 'cǎo']], [['春', 'chūn'], ['村', 'cūn']]] },
  { id: 'sh-x-s', label: 'sh · x · s', tip: 'sh: tongue curled back. x: tongue flat, lips spread, between "see" and "she". s: like English s.',
    groups: [[['诗', 'shī'], ['西', 'xī'], ['丝', 'sī']], [['山', 'shān'], ['三', 'sān']], [['是', 'shì'], ['四', 'sì']], [['少', 'shǎo'], ['小', 'xiǎo'], ['扫', 'sǎo']]] },
  { id: 'u-v', label: 'u · ü', tip: 'ü: say "ee", then round your lips without moving your tongue. u is like "oo".',
    groups: [[['路', 'lù'], ['绿', 'lǜ']], [['努', 'nǔ'], ['女', 'nǚ']], [['无', 'wú'], ['鱼', 'yú']]] },
  { id: 'n-ng', label: '-n · -ng', tip: '-n ends with the tongue tip touching behind the teeth. -ng ends at the back of the mouth, like "sing".',
    groups: [[['饭', 'fàn'], ['放', 'fàng']], [['班', 'bān'], ['帮', 'bāng']], [['心', 'xīn'], ['星', 'xīng']], [['亲', 'qīn'], ['青', 'qīng']], [['盆', 'pén'], ['朋', 'péng']], [['人', 'rén'], ['仍', 'réng']]] },
  { id: 'r-l', label: 'r · l', tip: 'Chinese r is close to the "s" in "pleasure", said with the tongue curled back. l is like English l.',
    groups: [[['日', 'rì'], ['力', 'lì']], [['入', 'rù'], ['路', 'lù']], [['让', 'ràng'], ['浪', 'làng']], [['肉', 'ròu'], ['漏', 'lòu']]] },
  { id: 'air', label: 'b/p · d/t · g/k', tip: 'p, t, k, c, ch, q have a strong puff of air (hold a hand in front of your mouth). b, d, g, z, zh, j have none.',
    groups: [[['爸', 'bà'], ['怕', 'pà']], [['大', 'dà'], ['踏', 'tà']], [['个', 'gè'], ['课', 'kè']], [['在', 'zài'], ['菜', 'cài']], [['纸', 'zhǐ'], ['尺', 'chǐ']], [['多', 'duō'], ['拖', 'tuō']]] },
];
