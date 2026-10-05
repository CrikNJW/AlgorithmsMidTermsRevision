import { questions, lectures } from '../docs/questions.js';
import { getSlideRefs } from '../docs/slide-refs.js';
const slides = [...new Map(questions.flatMap(getSlideRefs).map(ref => [ref.id, ref])).values()];
console.log(JSON.stringify({ lectures, slides }));
