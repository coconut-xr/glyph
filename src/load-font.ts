export type FontInfo = {
  pages: Array<string>;
  chars: Array<GlyphInfo>;
  info: {
    face: string;
    size: number;
    bold: number;
    italic: number;
    charset: Array<string>;
    unicode: number;
    stretchH: number;
    smooth: number;
    aa: number;
    padding: [number, number, number, number];
    spacing: [number, number, number, number];
    outline: number;
  };
  common: {
    lineHeight: number;
    base: number;
    scaleW: number;
    scaleH: number;
    pages: number;
    packed: number;
    alphaChnl: number;
    redChnl: number;
    greenChnl: number;
    blueChnl: number;
  };
  distanceField: {
    fieldType: string;
    distanceRange: number;
  };
  kernings: Array<{
    first: number;
    second: number;
    amount: number;
  }>;
};

export type GlyphInfo = Readonly<{
  id: number;
  index: number;
  char: string;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
  chnl: number;
  x: number;
  y: number;
  page: number;
}>;

export class Font<P> {
  private glyphInfoMap = new Map<string, GlyphInfo>();
  private kerningMap = new Map<string, number>();

  public readonly pageWidth: number;
  public readonly pageHeight: number;
  public readonly glyphSize: number;
  public readonly lineHeight: number;
  public readonly distanceRange: number;

  private questionmarkGlyphInfo: GlyphInfo;

  constructor(info: FontInfo, public page: P) {
    this.pageWidth = info.common.scaleW;
    this.pageHeight = info.common.scaleH;
    this.glyphSize = info.info.size;
    this.lineHeight = info.common.lineHeight;
    this.distanceRange = info.distanceField.distanceRange;

    for (const glyph of info.chars) {
      this.glyphInfoMap.set(glyph.char, glyph);
    }

    for (const { first, second, amount } of info.kernings) {
      this.kerningMap.set(`${first}/${second}`, amount);
    }

    const questionmarkGlyphInfo = this.glyphInfoMap.get("?");
    if (questionmarkGlyphInfo == null) {
      throw new Error("missing '?' glyph in font");
    }
    this.questionmarkGlyphInfo = questionmarkGlyphInfo;
  }

  getGlyphInfo(char: string): GlyphInfo {
    return (
      this.glyphInfoMap.get(char) ??
      (char == "\n" ? this.glyphInfoMap.get(" ") : this.questionmarkGlyphInfo) ??
      this.questionmarkGlyphInfo
    );
  }

  getKerning(firstId: number, secondId: number): number {
    return this.kerningMap.get(`${firstId}/${secondId}`) ?? 0;
  }
}

export async function loadFont<P>(
  baseUrl: string,
  url: string,
  loadPage: (url: string) => Promise<P>,
): Promise<Font<P>> {
  const info: FontInfo = await (await fetch(baseUrl + url)).json();

  if (info.pages.length !== 1) {
    throw new Error("only supporting exactly 1 page");
  }

  const page = await loadPage(baseUrl + info.pages[0]);

  return new Font(info, page);
}
