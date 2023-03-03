/*import { calculateGlyphOffset } from "../utils"
import { Font } from "../load-font"
import { StructuralLineData } from "../structural-line-data"

export function trim(font: Font<any>, target: StructuralLineData): void {
    trimStart(font, target)
    trimEnd(target)
}

export function trimStart(font: Font<any>, target: StructuralLineData): void {
    let i = 0
    while (i < target.glyphs.length && target.glyphs[i].info.char === " ") {
        ++i
    }
    if(i === 0) {
        return
    }
    target["_glyphs"].splice(0, i)
    const firstGlyph = target.glyphs[0]
    const translateX = -firstGlyph.x + calculateGlyphOffset(font, firstGlyph.info, undefined)
    for(i = 0; i < target.glyphs.length; i++) {
        target.glyphs[i].x += translateX
    }
}

export function trimEnd(target: StructuralLineData): void {
    let length = target.glyphs.length
    while (length > 0 && target.glyphs[length - 1].info.char === " ") {
        --length
    }
}
*/

export * from "./breakall-wrapper.js";
export * from "./nowrap-wrapper.js";
