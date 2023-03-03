import { applyGlyphBuilder, GlyphProperties } from "./apply-glyph-builder.js";
import { GlyphBuilder } from "./glyph-builder.js";
import { Font } from "./load-font.js";
import { calculateSpaceConversionRatio, calculateTextWidth } from "./utils.js";

export class GlyphMeasurementBuilder implements GlyphBuilder {
  private currentLineWidth = 0;

  private currentLineIndex = 0;

  private font!: Font<any>;
  private letterSpacing = 0;
  public maxLineWidth = 0;

  startText(font: Font<any>, letterSpacing: number): void {
    this.currentLineIndex = 0;
    this.font = font;
    this.letterSpacing = letterSpacing;
    this.maxLineWidth = 0;
  }

  startLine(): void {
    this.currentLineWidth = 0;
  }

  addText(text: string, start = 0, end: number = text.length): void {
    this.currentLineWidth += calculateTextWidth(this.font, this.letterSpacing, text, start, end);
  }

  measureText(text: string, start = 0, end: number = text.length): number {
    return calculateTextWidth(this.font, this.letterSpacing, text, start, end);
  }

  get lineWidth(): number {
    return this.currentLineWidth;
  }

  get lineIndex(): number {
    return this.currentLineIndex;
  }

  finishLine(): void {
    if (this.currentLineWidth > this.maxLineWidth) {
      this.maxLineWidth = this.currentLineWidth;
    }
    ++this.currentLineIndex;
  }

  finishText(): void {
    //nothing to do here
  }
}

const measurementBuilder = new GlyphMeasurementBuilder();

//we can reuse an object here since the object has always the same properties and overwrites everything
const propertiesHelper: Partial<GlyphProperties> = {};

export function measureGlyph(
  text: string,
  properties: GlyphProperties,
  width: number | undefined,
  height: number | undefined,
): { width: number; height: number } {
  const p = Object.assign(propertiesHelper, properties);
  p.availableWidth = width;
  p.availableHeight = height;

  applyGlyphBuilder(measurementBuilder, text, p);

  const spaceConversionRatio = calculateSpaceConversionRatio(properties.font, properties.fontSize);

  return {
    width: measurementBuilder.maxLineWidth * spaceConversionRatio,
    height:
      //assure min height of text = 1 line
      Math.max(1, measurementBuilder.lineIndex) *
      properties.font.lineHeight *
      spaceConversionRatio *
      properties.lineHeightMultiplier,
  };
}
