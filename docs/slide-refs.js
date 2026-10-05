// PDF page numbers are one-based. A semicolon can introduce another lecture.
export function getSlideRefs(question) {
  const refs = [];
  let lecture = question.lecture;
  for (let section of question.pages.split(';')) {
    section = section.trim();
    const other = section.match(/^L(\d+)\s+/);
    if (other) { lecture = Number(other[1]); section = section.slice(other[0].length); }
    for (const item of section.split(',')) {
      const range = item.trim().match(/^(\d+)(?:[–-](\d+))?$/);
      if (!range) throw new Error(`Invalid slide reference: ${question.id}: ${item}`);
      const first = Number(range[1]), last = Number(range[2] || range[1]);
      if (last < first) throw new Error(`Reversed slide range: ${question.id}`);
      for (let page = first; page <= last; page++) {
        const id = `l${lecture}-p${page}`;
        if (!refs.some(ref => ref.id === id)) refs.push({ id, lecture, page, src: `./slides/l${lecture}/p${String(page).padStart(3, '0')}.webp` });
      }
    }
  }
  return refs;
}
