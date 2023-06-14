import { Box3, Matrix4, Sphere } from "three";
import { GlyphProperties } from "./apply-glyph-builder.js";
import { Font, GlyphInfo } from "./load-font.js";

const _helper = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function calculateSpaceConversionRatio(font: Font<any>, fontSize: number): number {
  return fontSize / font.glyphSize;
}

export function calculateGlyphOffset(
  font: Font<any>,
  glyphInfo: GlyphInfo,
  prevGlyphId: number | undefined,
): number {
  const kerning = prevGlyphId == null ? 0 : font.getKerning(prevGlyphId, glyphInfo.id);
  return kerning + glyphInfo.xoffset;
}

/**
 *
 * @param text
 * @param start inclusive
 * @param end exclusive
 * @returns width in glyph space
 */
export function calculateTextWidth(
  font: Font<any>,
  letterSpacing: number,
  text: string,
  start: number,
  end: number,
): number {
  let width = 0;
  while (start < end) {
    const char = text[start];
    width += font.getGlyphInfo(char).xadvance + letterSpacing;
    ++start;
  }
  return width;
}

export class Bounds {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0,
  ) {}

  toMatrix(matrix: Matrix4): void {
    _helper[12] = this.x;
    _helper[13] = this.y;

    _helper[0] = this.width;
    _helper[5] = this.height;
    matrix.fromArray(_helper);
  }

  copy(source: this) {
    this.x = source.x;
    this.y = source.y;
    this.width = source.width;
    this.height = source.height;
  }

  toBoundingBox(box: Box3): void {
    box.min.set(this.x, this.y - this.height, 0);
    box.max.set(this.x + this.width, this.y, 0);
  }

  toBoundingSphere(sphere: Sphere): void {
    sphere.radius = Math.sqrt(this.width ** 2 + this.height ** 2) / 2;
    sphere.center.set(this.x + this.width / 2, this.y - this.height / 2, 0);
  }
}

export function getWrapperProperty(
  key: keyof GlyphProperties,
  properties: GlyphProperties,
  spaceConversionRatio: number,
): any {
  switch (key) {
    case "availableWidth":
    case "availableHeight": {
      const value = properties[key];
      if (value == null) {
        return undefined;
      }
      return value / spaceConversionRatio;
    }
    case "fontSize":
    case "lineHeightMultiplier":
    case "letterSpacing":
    case "horizontalAlign":
    case "verticalAlign":
      return properties[key];
  }
  throw new Error(`unable to get "${key}" property for the line wrapper`);
}
