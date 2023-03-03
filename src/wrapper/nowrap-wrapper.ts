import { GlyphWrapper } from "../apply-glyph-builder.js";

export const NowrapWrapper: GlyphWrapper<[]> = {
  keys: [],
  wrapLine: (builder, text, textIndex) => {
    let lineEnd = textIndex;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (lineEnd === text.length) {
        builder.addText(text, textIndex, lineEnd);
        return lineEnd;
      }
      if (text[lineEnd] === "\n") {
        builder.addText(text, textIndex, lineEnd);
        return lineEnd + 1;
      }
      ++lineEnd;
    }
  },
};
