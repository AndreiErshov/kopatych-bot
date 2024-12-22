import {
    randRange,
    randArr
} from '../util/functions'
import { SMESHARIKI } from '../util/constants';
import { generate } from 'random-words'
import russianWords from 'russian-words'

export const random = {
    coinflip: () => randRange(0, 1) === 0 ? 'Орёл' : 'Решка',
    diceRoll: () => randRange(1, 6),
    int32: () => randRange(-2147483648, 2147483647),
    grade: () => randArr(['2-', '2', '2+', '3-', '3', '3+', '4-', '4', '4+', '5-', '5', '5+']),
    smesharik: () => randArr(Object.keys(SMESHARIKI)),
    color: () => {
        const r = randRange(0, 255);
        const g = randRange(0, 255);
        const b = randRange(0, 255);
        const hex = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}` as const;
        return hex;
    },
    word: (lang: 'en' | 'ru') => {
        if (lang === 'en') {
            const word = generate()
            return word
        } else if (lang === 'ru') {
            const word = randArr(russianWords)
            return word
        }
    },
    ip: () => `${randRange(0, 255)}.${randRange(0, 255)}.${randRange(0, 255)}.${randRange(0, 255)}` as const
}
