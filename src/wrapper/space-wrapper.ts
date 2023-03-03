/*import { GlyphWrapper } from "../apply-glyph-builder"

const keys = ["availableWidth"] as const

export const SpaceWrapper: GlyphWrapper<typeof keys> = {
    keys,
    wrapLine: (builder, text, textIndex, font, availableWidth) => {
        let indexLastBreakpoint = 0
        let finalBreakpointFound = false
        while (!finalBreakpointFound) {
            let breakpoint = false
            if (text[textIndex] === "\n") {
                return availableWidth != null &&
                    builder.lineWidth + builder.measureText(text, indexLastBreakpoint, textIndex) > availableWidth
                    ? indexLastBreakpoint
                    : textIndex + 2
            }
            if(textIndex + 1 === text.length - 1) {
                return availableWidth != null &&
                    builder.lineWidth + builder.measureText(text, indexLastBreakpoint, textIndex + 1) > availableWidth
                    ? indexLastBreakpoint
                    : textIndex + 2
            }
            if (text[textIndex] === " " || text[textIndex + 1] !== " ") {
                continue
            }
            if (
                availableWidth != null &&
                builder.lineWidth + builder.measureText(text, indexLastBreakpoint, textIndex) > availableWidth
            ) {
                textIndex = indexLastBreakpoint
                break
            }

            builder.addText(text, indexLastBreakpoint, textIndex)
            
            indexLastBreakpoint = textIndex + 1
            textIndex++
        }

        return textIndex
    },
}

function findBreakpoint(text: string, textIndex: number): number {
    while (text[textIndex] !== "\n" && !(text[textIndex] !== " " && text[textIndex + 1] === " ")) {
        ++textIndex
    }
    return textIndex
}
*/
