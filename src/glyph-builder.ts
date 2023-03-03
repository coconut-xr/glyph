import { Font, GlyphInfo } from "./load-font.js";
import { calculateGlyphOffset, calculateTextWidth } from "./utils.js";

export interface GlyphBuilder {
  startText(font: Font<any>, letterSpacing: number): void;

  startLine(): void;

  addText(text: string, start?: number, end?: number): void;

  /**
   *
   * @param text
   * @param start inclusive
   * @param end exclusive
   */
  measureText(text: string, start?: number, end?: number): number;

  get lineWidth(): number;

  get lineIndex(): number;

  finishLine(): void;

  finishText(): void;
}

export class GlyphStructureBuilder implements GlyphBuilder {
  public readonly glyphs: Array<{ whitespacesUntilHere: number; x: number; info: GlyphInfo }> = [];
  public readonly lines: Array<{
    whitespaceAmount: number;
    lastGlyphIndex: number;
    width: number;
  }> = [];

  //changes per text
  private letterSpacing = 0;
  private font!: Font<any>;

  //changes per line
  private currentLineIndex = 0;

  //changes per glyph
  private glyphIndex = 0;
  private currentLineWidth = 0;
  private prevGlyphId: number | undefined;
  private whitespaceAmount = 0;

  startText(font: Font<any>, letterSpacing: number): void {
    this.letterSpacing = letterSpacing;
    this.font = font;
    this.currentLineIndex = 0;
  }

  startLine(): void {
    this.prevGlyphId = undefined;
    this.glyphIndex =
      this.currentLineIndex === 0 ? 0 : this.lines[this.currentLineIndex - 1].lastGlyphIndex + 1;
    this.currentLineWidth = 0;
    this.whitespaceAmount = 0;
  }

  addText(text: string, start = 0, end = text.length): void {
    while (start < end) {
      const char = text[start];
      if (char === " ") {
        ++this.whitespaceAmount;
      }
      const info = this.font.getGlyphInfo(char);
      const glyph = this.glyphs[this.glyphIndex];
      const x = this.currentLineWidth + calculateGlyphOffset(this.font, info, this.prevGlyphId);
      if (glyph == null) {
        this.glyphs[this.glyphIndex] = {
          whitespacesUntilHere: this.whitespaceAmount,
          x,
          info,
        };
      } else {
        glyph.whitespacesUntilHere = this.whitespaceAmount;
        glyph.x = x;
        glyph.info = info;
      }

      this.prevGlyphId = info.id;
      this.currentLineWidth += info.xadvance + this.letterSpacing;
      ++this.glyphIndex;
      ++start;
    }
  }

  measureText(text: string, start = 0, end = text.length): number {
    return calculateTextWidth(this.font, this.letterSpacing, text, start, end);
  }

  get lineWidth(): number {
    return this.currentLineWidth;
  }

  get lineIndex(): number {
    return this.currentLineIndex;
  }

  finishLine(): void {
    const line = this.lines[this.currentLineIndex];
    if (line == null) {
      this.lines[this.currentLineIndex] = {
        whitespaceAmount: this.whitespaceAmount,
        width: this.currentLineWidth,
        lastGlyphIndex: this.glyphIndex - 1,
      };
    } else {
      line.whitespaceAmount = this.whitespaceAmount;
      line.width = this.currentLineWidth;
      line.lastGlyphIndex = this.glyphIndex - 1;
    }
    ++this.currentLineIndex;
  }

  finishText(): void {
    this.lines.length = this.currentLineIndex;
    this.glyphs.length =
      this.currentLineIndex === 0 ? 0 : this.lines[this.currentLineIndex - 1].lastGlyphIndex + 1;
  }
}
