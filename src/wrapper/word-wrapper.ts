import { GlyphWrapper } from "../apply-glyph-builder.js";

const keys = ["availableWidth"] as const;

export const WordWrapper: GlyphWrapper<typeof keys> = {
  keys,
  wrapLine: (builder, text, textIndex, font, availableWidth) => {
    const startIndex = textIndex;
    let afterLastValidBreakIndex = textIndex;
    while (textIndex < text.length) {
      if (text[textIndex] != " " && text[textIndex] != "\n" && textIndex != text.length - 1) {
        ++textIndex;
        continue;
      }

      if (
        availableWidth != null &&
        startIndex != afterLastValidBreakIndex &&
        builder.lineWidth + builder.measureText(text, afterLastValidBreakIndex, textIndex + 1) >
          availableWidth
      ) {
        return afterLastValidBreakIndex;
      }

      if (text[textIndex] === "\n") {
        ++textIndex;
        break;
      }

      ++textIndex;
      builder.addText(text, afterLastValidBreakIndex, textIndex);

      afterLastValidBreakIndex = textIndex;
    }

    builder.addText(text, afterLastValidBreakIndex, textIndex);
    return textIndex;
  },
};
