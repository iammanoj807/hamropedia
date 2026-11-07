// Normal English spelling -> Nepali Unicode, for names and short phrases.
//
// The Romanized tool needs Romanized rules ("raam bahaadur thaapaa"). People
// filling PAN, NID or licence forms type their name the way it is written in
// English on their documents ("Ram Bahadur Thapa"), which Romanized rules read
// wrongly (रम बहदुर थप). This converter:
//   1. lowercases each word (capitals carry no meaning here),
//   2. looks it up in a list of common Nepali names and words,
//   3. otherwise guesses with simple sound rules and flags the word,
// and returns alternatives so the person can pick the spelling on their
// citizenship certificate.

import { romanizedToUnicode, SMART_WORDS } from './romanized.js';

// First spelling is the default; any others are offered as alternatives.
export const NAME_WORDS = {
  // middle names and name parts
  bahadur: 'बहादुर', bdr: 'बहादुर', kumar: 'कुमार', kumari: 'कुमारी', prasad: 'प्रसाद', devi: 'देवी',
  raj: 'राज', lal: 'लाल', nath: 'नाथ', man: 'मान', bikram: ['विक्रम', 'बिक्रम'], shree: 'श्री', shri: 'श्री',
  chandra: 'चन्द्र', narayan: 'नारायण', mani: 'मणि', kanta: 'कान्त', kant: 'कान्त', bir: 'वीर',
  // surnames
  thapa: 'थापा', shrestha: 'श्रेष्ठ', sharma: 'शर्मा', gurung: 'गुरुङ', tamang: 'तामाङ', rai: 'राई',
  limbu: 'लिम्बु', magar: 'मगर', adhikari: 'अधिकारी', poudel: 'पौडेल', paudel: 'पौडेल', bhattarai: 'भट्टराई',
  khanal: 'खनाल', karki: 'कार्की', basnet: 'बस्नेत', bista: 'बिष्ट', chhetri: 'क्षेत्री', khatri: 'खत्री',
  rana: 'राणा', shah: 'शाह', sah: 'साह', yadav: 'यादव', mahato: 'महतो', chaudhary: 'चौधरी', chaudhari: 'चौधरी',
  tharu: 'थारु', ghimire: 'घिमिरे', koirala: 'कोइराला', pokharel: 'पोखरेल', pokhrel: 'पोखरेल', dahal: 'दाहाल',
  acharya: 'आचार्य', aryal: 'अर्याल', bhandari: 'भण्डारी', dhakal: 'ढकाल', gautam: 'गौतम', joshi: 'जोशी',
  pandey: 'पाण्डे', pande: 'पाण्डे', pant: 'पन्त', regmi: 'रेग्मी', rijal: 'रिजाल', sapkota: 'सापकोटा',
  subedi: ['सुवेदी', 'सुबेदी'], upadhyay: 'उपाध्याय', lamichhane: 'लामिछाने', lama: 'लामा', sherpa: 'शेर्पा',
  maharjan: 'महर्जन', manandhar: 'मानन्धर', shakya: 'शाक्य', bajracharya: 'बज्राचार्य', pradhan: 'प्रधान',
  rawal: 'रावल', oli: 'ओली', deuba: 'देउवा', neupane: 'न्यौपाने', pun: 'पुन', sunar: 'सुनार', pariyar: 'परियार',
  mainali: 'मैनाली', baral: 'बराल', parajuli: 'पराजुली', khadka: 'खड्का', dhami: 'धामी', thakuri: 'ठकुरी',
  tiwari: 'तिवारी', mishra: 'मिश्र', jha: 'झा', singh: 'सिंह', gupta: 'गुप्ता', das: 'दास', mandal: 'मण्डल',
  ansari: 'अन्सारी', khan: 'खान', timsina: 'तिम्सिना', bhusal: 'भुसाल', luitel: 'लुइटेल', gyawali: 'ज्ञवाली',
  kafle: 'काफ्ले', wagle: 'वाग्ले', nepal: 'नेपाल', nepali: 'नेपाली',
  // men's first names
  ram: 'राम', shyam: 'श्याम', hari: 'हरि', krishna: 'कृष्ण', gopal: 'गोपाल', ramesh: 'रमेश', suresh: 'सुरेश',
  rajesh: 'राजेश', mahesh: 'महेश', dinesh: 'दिनेश', ganesh: 'गणेश', umesh: 'उमेश', naresh: 'नरेश',
  prakash: 'प्रकाश', bikash: ['विकास', 'बिकास'], bikas: ['विकास', 'बिकास'], akash: 'आकाश', aakash: 'आकाश',
  anil: 'अनिल', sunil: 'सुनिल', manoj: 'मनोज', santosh: 'सन्तोष', sanjay: ['सञ्जय', 'संजय'], bijay: ['विजय', 'बिजय'],
  ajay: 'अजय', binod: ['विनोद', 'बिनोद'], pramod: 'प्रमोद', subash: ['सुवास', 'सुबास'], subas: ['सुवास', 'सुबास'],
  rabin: ['रविन', 'रबिन'], ravi: 'रवि', rabi: 'रवि', bishnu: 'विष्णु', shiva: 'शिव', deepak: 'दीपक', dipak: ['दिपक', 'दीपक'],
  arjun: 'अर्जुन', bibek: ['विवेक', 'बिबेक'], bivek: 'विवेक', nabin: ['नवीन', 'नबिन'], sagar: 'सागर', saroj: 'सरोज',
  sujan: 'सुजन', sudip: ['सुदीप', 'सुदिप'], sandip: ['सन्दीप', 'सन्दिप'], sandeep: 'सन्दीप', prabin: ['प्रवीण', 'प्रबिन'],
  roshan: 'रोशन', rohan: 'रोहन', rohit: 'रोहित', amit: 'अमित', sushil: 'सुशील', kamal: 'कमल', bimal: ['विमल', 'बिमल'],
  nirmal: 'निर्मल', rajendra: 'राजेन्द्र', surendra: 'सुरेन्द्र', mahendra: 'महेन्द्र', birendra: 'वीरेन्द्र',
  narendra: 'नरेन्द्र', devendra: 'देवेन्द्र', upendra: 'उपेन्द्र', balen: 'बालेन', balendra: 'बालेन्द्र',
  kiran: 'किरण', raju: 'राजु', babu: 'बाबु', bhim: 'भीम', dhan: 'धन', dil: 'दिल', lok: 'लोक', tek: 'टेक',
  khem: 'खेम', yam: 'याम', min: 'मिन', bal: 'बल', nar: 'नर', puspa: 'पुष्प', pushpa: 'पुष्प', suman: 'सुमन',
  // women's first names
  sita: 'सीता', gita: 'गीता', rita: 'रीता', anita: 'अनिता', sunita: 'सुनिता', sabita: ['सविता', 'सबिता'],
  savita: 'सविता', kabita: ['कविता', 'कबिता'], kavita: 'कविता', babita: 'बबिता', sarita: 'सरिता',
  laxmi: 'लक्ष्मी', lakshmi: 'लक्ष्मी', maya: 'माया', radha: 'राधा', parbati: ['पार्वती', 'पार्बती'],
  parvati: 'पार्वती', ganga: 'गंगा', yamuna: 'यमुना', saraswati: 'सरस्वती', durga: 'दुर्गा', kamala: 'कमला',
  bimala: ['विमला', 'बिमला'], nirmala: 'निर्मला', sharmila: 'शर्मिला', samjhana: 'सम्झना', sapana: 'सपना',
  sapna: 'सपना', puja: 'पूजा', pooja: 'पूजा', priya: 'प्रिया', asmita: 'अस्मिता', sushma: 'सुष्मा',
  srijana: 'सृजना', manisha: 'मनिषा', nisha: 'निशा', usha: 'उषा', asha: 'आशा', rekha: 'रेखा',
  sangita: ['संगीता', 'सङ्गीता'], anju: 'अञ्जु', manju: 'मञ्जु', indira: 'इन्दिरा', kalpana: 'कल्पना',
  archana: 'अर्चना', rachana: 'रचना', shanti: 'शान्ति', bindu: 'बिन्दु', ramila: 'रमिला', tulsi: 'तुलसी',
  rupa: 'रूपा', sabina: 'सबिना', deepa: 'दीपा', dipa: ['दिपा', 'दीपा'], sushila: 'सुशीला', prabha: 'प्रभा',
  pratima: 'प्रतिमा', srishti: 'सृष्टि', aarati: 'आरती', aarti: 'आरती', prerana: 'प्रेरणा', ranjana: 'रञ्जना',
  bhawana: 'भावना', bhawna: 'भावना', januka: 'जानुका', binita: ['विनिता', 'बिनिता'], sumitra: 'सुमित्रा',
  // words used in names and addresses on forms
  naam: 'नाम', thar: 'थर', ward: 'वडा', wada: 'वडा', tole: 'टोल', gaun: 'गाउँ', jilla: 'जिल्ला', pradesh: 'प्रदेश',
  nagarpalika: 'नगरपालिका', gaunpalika: 'गाउँपालिका', mahanagarpalika: 'महानगरपालिका', marga: 'मार्ग', chowk: 'चोक',
  // places people write on forms
  kathmandu: 'काठमाडौं', pokhara: 'पोखरा', lalitpur: 'ललितपुर', bhaktapur: 'भक्तपुर', biratnagar: 'विराटनगर',
  chitwan: 'चितवन', dharan: 'धरान', butwal: 'बुटवल', janakpur: 'जनकपुर', birgunj: 'वीरगंज', nepalgunj: 'नेपालगंज',
};

const DEV_DIGITS = '०१२३४५६७८९';

// English spelling -> Romanized scheme, for words not in the lists.
function guessRomanized(w) {
  let s = w.replace(/x/g, 'ksh').replace(/q/g, 'k').replace(/c(?!h)/g, 'k');
  if (s.length > 3 && /[^aeiou]a$/.test(s)) s = s.slice(0, -1) + 'aa'; // Thapa, Sharma-style endings
  if (s.length > 3 && /[^aeiou]i$/.test(s)) s = s.slice(0, -1) + 'ee'; // Kumari, Adhikari-style endings
  return s;
}

const toUni = (rom) => romanizedToUnicode(rom, { smart: false, digits: false, danda: false });

// Other likely spellings of a guessed word: vowel length and similar letters.
function guessVariants(rom) {
  const cands = [];
  if (/aa$/.test(rom)) cands.push(rom.replace(/aa$/, 'a'));
  if (/ee$/.test(rom)) cands.push(rom.replace(/ee$/, 'i'));
  const firstA = rom.search(/a(?!a|i|u)/);
  if (firstA >= 0 && rom[firstA - 1] !== 'a') cands.push(rom.slice(0, firstA) + 'aa' + rom.slice(firstA + 1));
  const firstI = rom.search(/i(?!i)/);
  if (firstI > 0 && rom[firstI - 1] !== 'a' && rom[firstI - 1] !== 'r') cands.push(rom.slice(0, firstI) + 'ee' + rom.slice(firstI + 1));
  if (/u/.test(rom) && !/uu|ou|au/.test(rom)) cands.push(rom.replace('u', 'oo'));
  if (/sh/.test(rom)) { cands.unshift(rom.replace('sh', 'Sh')); cands.push(rom.replace('sh', 's')); }
  else if (/s/.test(rom)) cands.push(rom.replace('s', 'sh'));
  if (/^b/.test(rom)) cands.push('w' + rom.slice(1));
  return cands;
}

/**
 * Split text into tokens. Word tokens carry the Nepali default, alternatives,
 * and whether the spelling was guessed (not found in the lists).
 */
export function englishToNepaliTokens(text, options = {}) {
  const { digits = true, danda = true } = options;
  const tokens = [];
  const re = /\{([^}]*)\}|([A-Za-z]+)|([^A-Za-z{]+|\{)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) { tokens.push({ type: 'raw', out: m[1] }); continue; }
    if (m[3] !== undefined) {
      let s = m[3];
      if (digits) s = s.replace(/[0-9]/g, (d) => DEV_DIGITS[d]);
      if (danda) s = s.replace(/\.(?=\s|$)/g, '।');
      tokens.push({ type: 'raw', out: s });
      continue;
    }
    const word = m[2];
    const key = word.toLowerCase();
    let options = NAME_WORDS[key] ?? SMART_WORDS[key];
    let guessed = false;
    if (options === undefined) {
      guessed = true;
      const rom = guessRomanized(key);
      options = [toUni(rom), ...guessVariants(rom).map(toUni)];
    }
    const list = [...new Set(Array.isArray(options) ? options : [options])].slice(0, 5);
    tokens.push({ type: 'word', word, key, options: list, guessed });
  }
  return tokens;
}

/**
 * Convert normal English spelling to Nepali. `choices` maps a lowercase word to
 * the index of the spelling the person picked (from the token's options).
 */
export function englishToNepali(text, options = {}, choices = {}) {
  return englishToNepaliTokens(text, options)
    .map((t) => (t.type === 'raw' ? t.out : t.options[Math.min(choices[t.key] ?? 0, t.options.length - 1)]))
    .join('');
}
