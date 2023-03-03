import { GlyphWrapper } from "../apply-glyph-builder.js";

const keys = ["availableWidth"] as const;

export const BreakallWrapper: GlyphWrapper<typeof keys> = {
  keys,
  wrapLine: (builder, text, textIndex, font, availableWidth) => {
    while (textIndex < text.length) {
      if (text[textIndex] === "\n") {
        builder.addText(text, textIndex, textIndex + 1);
        ++textIndex;
        break;
      }
      if (
        availableWidth != null &&
        builder.lineWidth + builder.measureText(text, textIndex, textIndex + 1) > availableWidth
      ) {
        break;
      }
      builder.addText(text, textIndex, textIndex + 1);
      ++textIndex;
    }
    return textIndex;
  },
};
