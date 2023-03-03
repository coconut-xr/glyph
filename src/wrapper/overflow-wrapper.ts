/*import { calculateGlyphOffset } from "../utils"
import { GlyphWrapper } from "../glyph-builder"
import { trim } from "./index"

const keys = ["availableWidth", "availableHeight", "lineHeightMultiplier", "letterSpacing"] as const

export const OverflowWrapper: GlyphWrapper<typeof keys> = {
    keys,
    hasNextLine: (
        lineIndex,
        text,
        textOffset,
        font,
        availableWidth,
        availableHeight,
        lineHeightMultiplier,
        letterSpacing
    ) => {
        const lineHeight = font.lineHeight * lineHeightMultiplier
        return availableHeight == null || (lineIndex + 1) * lineHeight <= availableHeight
    },
    wrapLine: (
        target,
        lineIndex,
        text,
        textOffset,
        font,
        availableWidth,
        availableHeight,
        lineHeightMultiplier,
        letterSpacing
    ) => {
        const lineHeight = font.lineHeight * lineHeightMultiplier

        const lastLine = availableHeight != null && (lineIndex + 2) * lineHeight > availableHeight

        let x = 0
        let prevGlyphId: number | undefined

        const dotGlyphInfo = font.getGlyphInfo(".")

        const dotGlyphOffset = calculateGlyphOffset(font, dotGlyphInfo, dotGlyphInfo.id)
        const dotHorizontalSpace = dotGlyphInfo.xadvance + letterSpacing

        let textIndex = textOffset
        let glyphIndex = 0
        for (; textIndex < text.length; textIndex++) {
            const char = text[textIndex]

            if (char === "\n") {
                textIndex++ //we consume this character
                break
            }

            const glyphInfo = font.getGlyphInfo(char)

            const horizontalSpace = glyphInfo.xadvance + letterSpacing

            if (
                availableWidth != null &&
                x + (horizontalSpace + (lastLine ? 3 * dotHorizontalSpace : 0)) > availableWidth
            ) {
                if (lastLine) {
                    for (let ii = 0; ii < 3; ii++) {
                        target.xPositions[glyphIndex] = x + ii * dotHorizontalSpace + dotGlyphOffset
                        target.glyphInfos[glyphIndex] = dotGlyphInfo
                        ++glyphIndex
                    }
                    x += 3 * dotHorizontalSpace
                    //consume all text
                    textIndex = text.length
                }
                break
            }

            target.xPositions[glyphIndex] = x + calculateGlyphOffset(font, glyphInfo, prevGlyphId)
            target.glyphInfos[glyphIndex] = glyphInfo
            ++glyphIndex

            x += horizontalSpace
            prevGlyphId = glyphInfo.id
        }

        target.glyphInfos.length = glyphIndex
        target.xPositions.length = glyphIndex
        target.originalText = text.slice(textOffset, textIndex)

        trim(font, target)
    },
}
*/
