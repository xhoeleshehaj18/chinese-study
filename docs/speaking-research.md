# Making the app better at getting you to speak

Research notes and a prioritised roadmap (September 2026). Each suggestion says what to change, why (with the evidence), and where in the code it would go.

**Done so far:**
- #1, several voices: six for the sound drills, two for phrases and numbers, and 44 tone syllables for stage 1. The extra clips are made by `tools/make_audio.py`.
- #5, shadowing in the daily session.
- Part of #9: 14 new units (u13–u26), taking the course from 129 to 283 phrases.

## Where the app stands

**What it already does well, and the research agrees with:**
- **Tones first, with feedback on every answer.** This is how high-variability phonetic training (HVPT) works. It is the best-supported way to train tone perception: medium-to-large gains that last and carry over to new words ([Wang et al. 1999](https://kuppl.ku.edu/sites/kuppl/files/documents/publications/Wang_Spence_Jongman_Sereno_training_JASA_1999.pdf): +21% after 8 sessions, still there 6 months later; [HVPT meta-analysis, SSLA](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6)).
- **Drawing the tones.** Seeing and making pitch gestures helps learners pick up both tones and the words that carry them ([Baills et al. 2019](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/observing-and-producing-pitch-gestures-facilitates-the-learning-of-mandarin-chinese-tones-and-words/6BF1D83445A4C9E136CE01F7C53CE193); [Morett & Chang 2015](https://www.tandfonline.com/doi/abs/10.1080/23273798.2014.923105)). The tone pad works on the same idea.
- **Pitch picture next to a model.** Studies of visual pitch feedback report better tone production (e.g. [learner-created tone visualisations](https://www.researchgate.net/publication/277655376_Acquisition_of_L2_Mandarin_Chinese_tones_with_learner-created_tone_visualizations)).
- **Recall in both directions, spaced by FSRS.** Retrieving a word beats re-reading or imitating it, for both comprehension and production (review: [Rogers, *Repetition, Retrieval, and Spaced Practice*](https://onlinelibrary.wiley.com/doi/10.1002/9781405198431.wbeal20349)).
- **Whole phrases rather than single words.** Chunks that are stored and retrieved whole are a main source of fluency ([formulaic sequences and L2 speaking](https://www.researchgate.net/publication/357182719_The_role_of_formulaic_sequences_in_L2_speaking)).

**Where it falls short of "speak Chinese":**

| | Now | What speaking needs |
|---|---|---|
| Vocabulary | 129 phrases in 12 units | HSK 3.0 level 1 is 300 words and level 2 is 500 ([2025–26 syllabus](https://www.hanzistroke.com/blog/new-hsk-3-guide)). Following everyday speech takes a few thousand words: in English, 3,000 word families cover 95% of unscripted speech and 6,000–7,000 cover 98% ([Nation 2006](https://www.lextutor.ca/cover/papers/nation_2006.pdf)) |
| Saying *new* things | Only phrases memorised whole | Patterns you can fill with any word you know |
| Speaking under time pressure | Speak cards wait as long as you like | Fluency means getting the words out fast: skill acquisition goes declarative → procedural → **automatic** ([DeKeyser & Suzuki 2025](https://yuichisuzuki.net/wp-content/uploads/2025/07/PreprintDeKeyser-R.-M.-Suzuki-Y.-2025.-Skill-acquisition-theory.-In-B.-VanPatten-G.-D.-Keating-S.-Wulff-Eds.-Theories-in-second-language-acquisition-An-introduction-4th-ed.-pp.-157-182-.pdf)) |
| Conversation | None | Taking turns, including understanding the reply. Interaction has large effects on learning (d ≈ 1.09, [Mackey & Goo 2007](https://www.semanticscholar.org/paper/Interaction-research-in-SLA-:-A-meta-analysis-and-Mackey-Goo/2b270feebe31f2f01e7c645cc00f8e94d504fb8b)) |
| Listening | Single sentences from one voice | Longer speech at natural speed, from many voices |
| Tones inside words you know | Self-graded Speak cards; recognition accepts wrong tones | Checked tone recall for each word (see #2) |

The most important finding for this app is that **practice is skill-specific**. Training tone *perception* improved perception only, and training *production* improved production only ([Li & DeKeyser 2017](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/perception-practice-production-practice-and-musical-ability-in-l2-mandarin-toneword-learning/EBCB48B5D485BDB8AA9AEA20FA3AB558)). The same holds more generally: you get fast at the skill you practise ([DeKeyser & Suzuki 2025](https://www.researchgate.net/publication/393631114_DeKeyser_R_M_Suzuki_Y_2025_Skill_acquisition_theory_In_B_VanPatten_G_D_Keating_S_Wulff_Eds_Theories_in_second_language_acquisition_An_introduction_4th_ed_pp_157-182_Routledge)). Five of the seven sound stages are listening. The app will make you a very good *listener* for tones, but speaking only improves through practice that is actually speaking.

## Roadmap

Ordered by value for effort. ★ marks how much each one moves you towards speaking.

| # | Change | Speaking | Effort |
|---|--------|---|---|
| 1 | Several voices in the listening drills | ★★ | Small |
| 2 | Draw the tones on Speak cards (tone recall for every word) | ★★★ | Small |
| 3 | Time how fast you start speaking on Speak cards | ★★★ | Small |
| 4 | Keep a review log | ★ (enables the rest) | Tiny |
| 5 | Shadowing as part of the daily session | ★★ | Small |
| 6 | Sentence patterns: build new sentences from words you know | ★★★ | Medium |
| 7 | Dialogues with role-play | ★★★ | Medium |
| 8 | "About me" script and 4/3/2 fluency rounds | ★★★ | Medium |
| 9 | More content: 129 → ~500 items | ★★★ | Large (mostly writing) |
| 10 | Optional AI conversation partner | ★★★ | Medium, needs an API key |
| 11 | Bridge to real conversations | ★★★ | Small |
| 12 | Better automatic tone scoring | ★★ | Medium–large |

### 1. Several voices in the listening drills (HVPT)

**Now:** every clip is one voice (`VOICE = 'zh-CN-XiaoxiaoNeural'`, `tools/make_audio.py:18`). Stage 1 has only 48 recordings (12 syllables × 4 tones), so after a few hundred answers you've heard each exact clip many times. You can end up learning the recordings rather than the tones.

**Evidence:** a 2025 network meta-analysis (32 studies, 998 participants) found **six talkers** the most effective number, with a moderate amount of variability doing best ([Zhang et al. 2025](https://pubs.asha.org/doi/10.1044/2024_JSLHR-24-00599)). The benefit of more talkers is real but small and varies between studies ([Zhang, Cheng & Zhang 2021](https://zhanglab.wdfiles.com/local--files/publications/2021_JSLHR-21-00181_review_talker_variability.pdf)). For tones in particular, earlier studies suggest whether it helps depends on your ear for pitch (reviewed and tested in [Dong et al. 2019](https://peerj.com/articles/7191/)). The cautious design is *blocked* variability: one voice per round, a different one each round.

**Change:**
- In `make_audio.py`, also render the drill texts (tone sets, pair words, change words, sounds: 199 clips) in the other five mainland voices edge-tts has: XiaoyiNeural (female) and YunjianNeural, YunxiNeural, YunxiaNeural, YunyangNeural (male) ([voice list](https://github.com/bytectlgo/edge-tts/blob/main/voice-list.md)). That adds about 1,000 clips, roughly 10 MB.
- Change `manifest.json` from `{text: file}` to `{text: {voice: file}}`. In `speak()` (`js/speech.js`), take a voice parameter. Pick one voice per drill round, a different one each round.
- Add more syllables to `TONE_SETS` (40 or so rather than 12) so stage 1 has hundreds of different sounds instead of 48.
- For phrase cards, keep the default voice for a new phrase, then vary the voice on later reviews so you recognise the word whoever says it.
- Real human voices are more varied than synthetic ones. MSU's [Tone Perfect](https://tone.lib.msu.edu/) has all 410 syllables in all 4 tones from 6 native speakers (9,860 clips). Its rights statement is "In Copyright – Educational Use Permitted" ([details](https://ideah.pubpub.org/pub/hh90jpsu)), so ask MSU before putting the files on a public site.

### 2. Draw the tones on Speak cards

**Now:** a Speak card has you say the phrase, then grade yourself. Speech recognition checks the words, not the tones (`app.js:149` is honest about this: "Understood"). Nothing checks whether you *remember* each word's tones.

**Evidence:** even advanced learners are left with "fuzzy" tone memories for words. They reject a word with a wrong consonant or vowel far more often than one with a wrong tone ([Pelzl et al. 2021](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2021.689423/full)). Making the pitch gesture while learning a word helps attach its tones to it ([Baills et al. 2019](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/observing-and-producing-pitch-gestures-facilitates-the-learning-of-mandarin-chinese-tones-and-words/6BF1D83445A4C9E136CE01F7C53CE193)).

**Change:** after you speak and before the answer shows, show the toneless pinyin and have you draw each tone *from memory* on the tone pad. `drawTones()` in `app.js` already does exactly this, given `blanks` = every syllable. Since this is checked automatically, it can set the suggested rating: a wrong tone means Hard at best. The same step fits in `renderIntro()` for a new phrase: draw its tones once while you learn it. Change is in `renderCard()` (`app.js:1156`).

### 3. Time how fast you start speaking

**Now:** a Speak card gives you unlimited time to think, and the rating ignores how long you took.

**Evidence:** fluency is automatic retrieval. Practice has to match the skill you want, so speaking at conversational speed has to be practised at that speed ([DeKeyser & Suzuki 2025](https://yuichisuzuki.net/wp-content/uploads/2025/07/PreprintDeKeyser-R.-M.-Suzuki-Y.-2025.-Skill-acquisition-theory.-In-B.-VanPatten-G.-D.-Keating-S.-Wulff-Eds.-Theories-in-second-language-acquisition-An-introduction-4th-ed.-pp.-157-182-.pdf)). A phrase you can say only after 8 seconds of thinking isn't usable in a conversation yet.

**Change:** open the mic as soon as the English prompt appears. `trackPitch()` already detects when your voice starts (`lastVoice`). Show the time to your first sound ("1.4 s"). Feed it into the suggested rating: fast and right is Good or Easy, over ~4 s is Hard. Store the time (see #4), and show your median time dropping on the Me tab. That number measures speaking fluency directly.

### 4. Keep a review log

**Now:** `grade()` (`store.js:139`) updates the card and throws away the ts-fsrs `ReviewLog`.

**Change:** add each review `{card, rating, time, latency, toneOK}` to a log in state (or IndexedDB). This costs almost nothing, and it enables:
- training FSRS on your own reviews once you have ~1,000 of them (the default parameters are averages over many users);
- finding your weak spots: which tone pairs you get wrong in words you know, which phrases stay slow;
- the fluency trend from #3.

### 5. Shadowing as part of the daily session

**Now:** shadowing is an "Extra practice" button at the bottom of the Path tab (`app.js:1362`), outside the daily flow.

**Evidence:** a 2025 systematic review finds shadowing consistently improves pronunciation, fluency and rhythm, especially when there's feedback ([systematic review, 2025](https://www.tandfonline.com/doi/full/10.1080/29984475.2025.2546827)).

**Change:** after reviews, add 3–5 shadowing items to each session from the example sentences (and dialogues, #7) of phrases you know. Keep the 📈 pitch comparison. Move items you struggle with to the front.

### 6. Sentence patterns: build new sentences from words you know

**Now:** you can say 129 phrases exactly as written, but nothing trains you to combine them.

**Evidence:** getting from knowing a rule to using it takes practice using the rule to express meaning (proceduralisation in skill acquisition theory). Chunks are the starting point; patterns with open slots are how chunks become productive ([formulaic sequences research](https://www.sciencedirect.com/science/article/abs/pii/S0024384121000449)).

**Change:** add a `PATTERNS` list to `content.js`, where each pattern has slots that take items of a given kind:
```js
{ id: 'xiang-v-n', zh: '我想{V}{N}', en: 'I\'d like to {V} {N}', slots: { V: ['chi', 'he', 'mai'], N: ['cha', 'kafei', 'shui', 'mifan'] } }
```
Other good first patterns: 我在{place}, 我不{V}, 你{V}{N}吗？, {N}在哪里？, {N}多少钱？, 太{adj}了, 我觉得{N}很{adj}, {time}我去{place}.
Only fill slots with items you've already learned, and make generated Speak cards (English → say it; recognition checks the words). Generated sentences need audio, so either pre-generate every combination (a few hundred per pattern at most) or let those cards fall back to the browser voice. Give each pattern its own FSRS card, not each sentence, and fill it differently at every review.

### 7. Dialogues with role-play

**Now:** you only hear single sentences.

**Evidence:** interaction (d ≈ 1.09, [Mackey & Goo 2007](https://www.semanticscholar.org/paper/Interaction-research-in-SLA-:-A-meta-analysis-and-Mackey-Goo/2b270feebe31f2f01e7c645cc00f8e94d504fb8b)). Repeating the same task builds fluency ([Nation's 4/3/2](https://tesl-ej.org/wordpress/issues/volume26/ej102/ej102a1/)).

**Change:** give each unit one or two 4–8 line dialogues using its phrases (ordering food, a taxi, meeting someone), rendered in a female and a male voice. Four modes, one after another over the week:
1. **Listen**: whole dialogue at natural speed, then check understanding.
2. **Shadow**: line by line.
3. **Role-play A**: the app says one side, you say the other (recognition checks; hints available).
4. **Role-play B**: swap sides.

This is the closest you can get to conversation with no AI and no network, and it trains understanding the *reply* too, which single phrases don't.

### 8. "About me" script and 4/3/2 fluency rounds

**Evidence:** learners remember material about themselves better (the self-reference effect), and it's what beginners actually get asked: name, where you're from, work, family, why Chinese. In the 4/3/2 technique you tell the same thing three times in 4, 3 and 2 minutes. One of Nation's learners went from 86 to 127 words per minute across the three tellings ([Nation 1989](https://ihworld.com/ih-journal/issues/issue-44/an-activity-for-oral-fluency-development/); a [2025 revisit](https://www.sciencedirect.com/science/article/abs/pii/S0346251X2500346X) found that learners' aptitude affects how much they gain).

**Change:**
- A "Me" unit whose sentences you put together from templates: 我叫___。我是___人。我住在___。我是___ / 我在___工作。我学中文，因为___。 Your answers become ordinary FSRS phrase cards (browser voice for audio).
- A timed retelling drill: tell your whole introduction in 90 s, then 60 s, then 45 s, recorded each time. The pitch tracker already knows which frames are voiced, which gives **speech rate** (syllables per second) and **pause time**. Chart both over the weeks.
- A monthly **speaking snapshot**: answer the same 5 questions, keep the recordings, and play last month's next to this month's.

### 9. More content: 129 → ~500 items

Everything above needs more words to work with. Order new units by spoken frequency, following the HSK 3.0 level 1–2 lists (300 + 500 words, [2025–26 syllabus](https://www.hanzistroke.com/blog/new-hsk-3-guide)). Group them by situation (restaurant, directions, phone, work, hobbies, weather, health, plans) rather than by list. The pipeline already copes: write the units in `content.js`, then run `make_audio.py`.

With 40+ units, one unit test a day (`path.js`) becomes the bottleneck. Consider letting new units open once the previous one's phrases have graduated to review, and holding the test back as a milestone check.

### 10. Optional AI conversation partner

**Evidence:** recent studies of voice chatbots report better fluency and willingness to speak, and less anxiety. Beginners need the bot's language kept simple, and immediate vs delayed correction both help ([2025 mixed-methods study](https://www.nature.com/articles/s41599-025-05550-z); [LLM chatbot review](https://files.eric.ed.gov/fulltext/EJ1455392.pdf); [immediate vs delayed feedback](https://www.researchgate.net/publication/391485619_Personalized_Language_Learning_With_an_LLM_Chatbot_Effects_of_Immediate_vs_Delayed_Corrective_Feedback)). In correction, **prompts** (getting you to fix it yourself) work better than **recasts** (just saying it correctly back to you) ([Lyster & Saito 2010](https://eric.ed.gov/?id=EJ892626)).

**Change:** a "Conversation" mode. You speak (browser recognition), a language model replies in Chinese, and the reply is read aloud. Pass it the list of phrases you've learned and tell it to stay mostly within them. Set a scenario (the unit's topic). When you make a mistake, it prompts you to self-correct once before giving the answer. At the end it lists 2–3 phrases you were missing and offers to add them as cards.
- The app is a static site with no server, so it would need an API key that you paste in and that stays on your device, and it only works online. That's why it's optional.
- It's the only item here that costs money per use and sends your speech transcripts to a third party.

### 11. Bridge to real conversations

Nothing replaces talking to people. The app can make those conversations much more productive:
- After each unit, a **mission** card: "With a tutor or exchange partner, ask 3 questions with 什么 / 哪里 / 几 and understand the answers." Tick it off in the app.
- A "**What I can say**" page: all learned phrases and patterns on one screen, to take into a lesson.
- After a lesson: a quick way to add phrases you needed and didn't have, which then go into FSRS like the rest.

### 12. Better automatic tone scoring

**Now:** Say tone pairs accepts about 80% of correct syllables and 20% of wrong ones (README), and longer phrases aren't scored per syllable at all.
- Swap the autocorrelation pitch detector (`detectPitch`, `speech.js`) for YIN or McLeod (MPM), which make fewer octave errors on phone mics.
- Extend `checkPair` (`tone-grade.js`) to N syllables. Split at voicing breaks, using the syllable count and the durations predicted by the model contour.
- A cloud service is an option: Azure pronunciation assessment supports zh-CN at phoneme level, but its prosody scoring is English-only ([docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment)). It needs a key and a network, like #10.
- Small open tone classifiers exist ([ToneNet](https://www.researchgate.net/publication/335829403_ToneNet_A_CNN_Model_of_Tone_Classification_of_Mandarin_Chinese), [Mandarin-Tone-Classification](https://github.com/alicex2020/Mandarin-Tone-Classification)), but they're trained on native speech. Test them on learner recordings before trusting them.

## One design question worth revisiting: the order of the stages

The 49-of-50 gates are fine. Because they count your *best* recent 50, they're easier than "98%" sounds. A simulation of the gate (`need` of the last 50, sliding):

| Your real accuracy | Answers to pass 49/50 (median) |
|---|---|
| 97% | ~50 |
| 95% | ~80 (about 4 rounds) |
| 93% | ~130 |
| 90% | ~300 (about 15 rounds) |
| 85% | ~2,300 |

So a gate passes at a steady ~90%+ with some persistence, which is a sensible bar.

The question is the *order*. Seven sound stages (one with 4 levels) come before the first phrase, and five of them are listening. Since perception practice doesn't turn into production ([Li & DeKeyser 2017](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/perception-practice-production-practice-and-musical-ability-in-l2-mandarin-toneword-learning/EBCB48B5D485BDB8AA9AEA20FA3AB558)), and tones stick best learned inside words ([Pelzl et al. 2021](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2021.689423/full)), one option is to run them side by side: open unit 1 after stage 2 (Hear tone pairs), and make stages 3–7 the daily warm-up plus their own gates, run next to the phrase units. You'd start saying real phrases days earlier, and tone training would continue alongside. Whether this is right depends on how you feel about the sound stages so far. If they're going well, the current order is fine.

## Sources

- Wang, Spence, Jongman & Sereno (1999). [Training American listeners to perceive Mandarin tones](https://kuppl.ku.edu/sites/kuppl/files/documents/publications/Wang_Spence_Jongman_Sereno_training_JASA_1999.pdf). JASA.
- Wang, Jongman & Sereno (2003). [Acoustic and perceptual evaluation of Mandarin tone productions before and after perceptual training](https://pubmed.ncbi.nlm.nih.gov/12597196/). JASA.
- [High variability phonetic training (HVPT): a meta-analysis of L2 perceptual training studies](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6). SSLA.
- Zhang, Cheng & Zhang (2021). [The role of talker variability in nonnative phonetic learning](https://zhanglab.wdfiles.com/local--files/publications/2021_JSLHR-21-00181_review_talker_variability.pdf). JSLHR.
- Zhang et al. (2025). [Determining optimal talker variability for nonnative speech training: a Bayesian network meta-analysis](https://pubs.asha.org/doi/10.1044/2024_JSLHR-24-00599). JSLHR.
- Dong, Clayards, Brown & Wonnacott (2019). [High versus low talker variability and individual aptitude in phonetic training of Mandarin tones](https://peerj.com/articles/7191/). PeerJ.
- Li & DeKeyser (2017). [Perception practice, production practice, and musical ability in L2 Mandarin tone-word learning](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/perception-practice-production-practice-and-musical-ability-in-l2-mandarin-toneword-learning/EBCB48B5D485BDB8AA9AEA20FA3AB558). SSLA.
- Pelzl et al. (2021). [Advanced L2 learners of Mandarin show persistent deficits for lexical tone encoding](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2021.689423/full). Frontiers in Communication.
- Baills et al. (2019). [Observing and producing pitch gestures facilitates the learning of Mandarin tones and words](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/observing-and-producing-pitch-gestures-facilitates-the-learning-of-mandarin-chinese-tones-and-words/6BF1D83445A4C9E136CE01F7C53CE193). SSLA.
- Morett & Chang (2015). [Pitch gestures enhance Mandarin lexical tone acquisition](https://www.tandfonline.com/doi/abs/10.1080/23273798.2014.923105). Language, Cognition and Neuroscience.
- DeKeyser & Suzuki (2025). [Skill acquisition theory](https://yuichisuzuki.net/wp-content/uploads/2025/07/PreprintDeKeyser-R.-M.-Suzuki-Y.-2025.-Skill-acquisition-theory.-In-B.-VanPatten-G.-D.-Keating-S.-Wulff-Eds.-Theories-in-second-language-acquisition-An-introduction-4th-ed.-pp.-157-182-.pdf). In *Theories in SLA*, 4th ed.
- Mackey & Goo (2007). [Interaction research in SLA: a meta-analysis](https://www.semanticscholar.org/paper/Interaction-research-in-SLA-:-A-meta-analysis-and-Mackey-Goo/2b270feebe31f2f01e7c645cc00f8e94d504fb8b).
- Lyster & Saito (2010). [Oral feedback in classroom SLA: a meta-analysis](https://eric.ed.gov/?id=EJ892626). SSLA.
- [A systematic review of research on shadowing for L2 pronunciation](https://www.tandfonline.com/doi/full/10.1080/29984475.2025.2546827) (2025).
- Nation's 4/3/2: [overview](https://ihworld.com/ih-journal/issues/issue-44/an-activity-for-oral-fluency-development/), [4/3/2 with self-assessment](https://tesl-ej.org/wordpress/issues/volume26/ej102/ej102a1/), [2025 revisit](https://www.sciencedirect.com/science/article/abs/pii/S0346251X2500346X).
- [Can explicit instruction of formulaic sequences enhance L2 oral fluency?](https://www.sciencedirect.com/science/article/abs/pii/S0024384121000449)
- Nation (2006). [How large a vocabulary is needed for reading and listening?](https://www.lextutor.ca/cover/papers/nation_2006.pdf) Canadian Modern Language Review.
- AI conversation: [AI conversation bots, speaking and anxiety (2025)](https://www.nature.com/articles/s41599-025-05550-z), [LLM-based chatbots in language learning](https://files.eric.ed.gov/fulltext/EJ1455392.pdf), [immediate vs delayed feedback](https://www.researchgate.net/publication/391485619_Personalized_Language_Learning_With_an_LLM_Chatbot_Effects_of_Immediate_vs_Delayed_Corrective_Feedback).
- HSK 3.0 word counts: [2025–26 syllabus](https://www.hanzistroke.com/blog/new-hsk-3-guide), [Hacking Chinese](https://www.hackingchinese.com/the-new-hsk-3-0-what-you-need-to-know/).
- [Tone Perfect](https://tone.lib.msu.edu/), MSU; [its rights statement](https://ideah.pubpub.org/pub/hh90jpsu).
- [edge-tts voice list](https://github.com/bytectlgo/edge-tts/blob/main/voice-list.md).
- [Azure pronunciation assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment).
