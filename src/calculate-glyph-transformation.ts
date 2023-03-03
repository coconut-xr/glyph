import { GlyphProperties } from "./apply-glyph-builder.js";
import { GlyphStructureBuilder } from "./glyph-builder.js";
import { Bounds } from "./utils.js";

export function calculateGlyphTransformation(
  structureBuilder: GlyphStructureBuilder,
  bounds: Bounds,
  setGlyphTransformation: (
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void,
  setGlyphUV: (index: number, x: number, y: number, width: number, height: number) => void,
  spaceConversionRatio: number,
  properties: GlyphProperties,
): void {
  const lineHeight =
    properties.font.lineHeight * spaceConversionRatio * properties.lineHeightMultiplier;
  const lineOffsetY =
    properties.font.lineHeight * spaceConversionRatio * (properties.lineHeightMultiplier - 1) * 0.5;

  //calculate bounds
  bounds.width =
    properties.horizontalAlign === "block" && properties.availableWidth != null
      ? properties.availableWidth
      : structureBuilder.lines.reduce(
          (prev, { width }) => Math.max(prev, width * spaceConversionRatio),
          0,
        );
  bounds.height = structureBuilder.lines.length * lineHeight;
  bounds.x = calculateXAlign(properties.horizontalAlign, properties.availableWidth, bounds.width);
  bounds.y = calculateYAlign(properties.verticalAlign, properties.availableHeight, bounds.height);

  const font = properties.font;

  //calculate glyph transformations
  let glyphIndex = 0;
  for (let lineIndex = 0; lineIndex < structureBuilder.lines.length; lineIndex++) {
    const line = structureBuilder.lines[lineIndex];
    const lineWidth = line.width * spaceConversionRatio;
    const lineX = calculateXAlign(properties.horizontalAlign, properties.availableWidth, lineWidth);
    const blockWhitespaceWidth =
      properties.horizontalAlign === "block" &&
      properties.availableWidth != null &&
      line.whitespaceAmount > 0
        ? Math.max(properties.availableWidth - lineWidth, 0) / line.whitespaceAmount
        : 0;
    const lineY = bounds.y - lineHeight * lineIndex - lineOffsetY;
    while (glyphIndex <= line.lastGlyphIndex) {
      const glyph = structureBuilder.glyphs[glyphIndex];
      setGlyphTransformation(
        glyphIndex,
        lineX + glyph.x * spaceConversionRatio + blockWhitespaceWidth * glyph.whitespacesUntilHere,
        lineY + -glyph.info.yoffset * spaceConversionRatio,
        glyph.info.width * spaceConversionRatio,
        glyph.info.height * spaceConversionRatio,
      );
      setGlyphUV(
        glyphIndex,
        glyph.info.x / font.pageWidth,
        glyph.info.y / font.pageHeight,
        glyph.info.width / font.pageWidth,
        glyph.info.height / font.pageHeight,
      );
      ++glyphIndex;
    }
  }
}

function calculateXAlign(
  horizontalAlign: GlyphProperties["horizontalAlign"],
  availableWidth: number | undefined,
  width: number,
): number {
  if (availableWidth == null) {
    return 0;
  }
  switch (horizontalAlign) {
    case "center":
      return Math.max(0, availableWidth - width) * 0.5;
    case "right":
      return Math.max(0, availableWidth - width);
    default:
      return 0;
  }
}

function calculateYAlign(
  verticalAlign: GlyphProperties["verticalAlign"],
  availableHeight: number | undefined,
  height: number,
): number {
  if (availableHeight == null) {
    return 0;
  }
  switch (verticalAlign) {
    case "center":
      return -Math.max(0, availableHeight - height) * 0.5;
    case "bottom":
      return -Math.max(0, availableHeight - height);
    default:
      return 0;
  }
}
