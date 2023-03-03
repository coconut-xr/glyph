import { calculateSpaceConversionRatio, getWrapperProperty } from "./utils.js";
import { Font } from "./load-font.js";
import { GlyphBuilder } from "./glyph-builder.js";

export type GlyphProperties = {
  font: Font<any>;
  availableWidth?: number;
  availableHeight?: number;
  letterSpacing: number;
  lineHeightMultiplier: number;
  fontSize: number;
  wrapper: GlyphWrapper;
  horizontalAlign: "left" | "center" | "right" | "block";
  verticalAlign: "top" | "center" | "bottom";
};

export type GlyphWrapper<T extends ReadonlyArray<keyof GlyphProperties> = ReadonlyArray<any>> = {
  keys: T;
  wrapLine: (
    builder: GlyphBuilder,
    text: string,
    textOffset: number,
    font: Font<any>,
    ...props: { [K in keyof T]: T[K] extends keyof GlyphProperties ? GlyphProperties[T[K]] : never }
  ) => number | undefined;
};
export function applyGlyphBuilder(
  builder: GlyphBuilder,
  text: string,
  properties: GlyphProperties,
): void {
  let textOffset = 0;

  const spaceConversionRatio = calculateSpaceConversionRatio(properties.font, properties.fontSize);

  const wrapperParams = properties.wrapper.keys.map((key) =>
    getWrapperProperty(key, properties, spaceConversionRatio),
  );

  builder.startText(properties.font, properties.letterSpacing);

  while (textOffset < text.length) {
    builder.startLine();

    const newTextOffset = properties.wrapper.wrapLine(
      builder,
      text,
      textOffset,
      properties.font,
      ...wrapperParams,
    );

    if (newTextOffset == null) {
      break;
    }

    builder.finishLine();

    if (newTextOffset === textOffset) {
      break;
    }

    textOffset = newTextOffset;
  }

  builder.finishText();
}
