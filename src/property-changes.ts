import type { GlyphProperties } from "./apply-glyph-builder.js";

const propertyKeys = [
  "availableHeight",
  "availableWidth",
  "font",
  "fontSize",
  "horizontalAlign",
  "letterSpacing",
  "lineHeightMultiplier",
  "verticalAlign",
  "wrapper",
] as const;

/**
 * @returns true iff the updates result in structural changes
 */
export function getPropertyChanges(
  properties: GlyphProperties | undefined,
  update: GlyphProperties,
): {
  hasStructuralChanges: boolean;
  hasTransformationChanges: boolean;
} {
  if (properties == null) {
    return { hasStructuralChanges: true, hasTransformationChanges: true };
  }

  let hasStructuralChanges = false;
  let hasTransformationChanges = false;
  const currentWrapper = update.wrapper;

  let i = 0;
  while ((!hasStructuralChanges || !hasTransformationChanges) && i < propertyKeys.length) {
    const key = propertyKeys[i];
    const newValue = update[key];
    const currentValue = properties[key];
    if (newValue === currentValue) {
      ++i;
      continue;
    }
    if (currentWrapper.keys.includes(key) || glyphStructuralPropertyKeys.includes(key)) {
      hasStructuralChanges = true;
    }
    if (glpyhTransformationPropertyKeys.includes(key)) {
      hasTransformationChanges = true;
    }
    ++i;
  }

  return { hasStructuralChanges, hasTransformationChanges };
}

export const glyphStructuralPropertyKeys: ReadonlyArray<keyof GlyphProperties> = [
  "fontSize",
  "font",
  "letterSpacing",
  "wrapper",
];

export const glpyhTransformationPropertyKeys: ReadonlyArray<keyof GlyphProperties> = [
  "fontSize",
  "font",
  "letterSpacing",
  "availableWidth",
  "availableHeight",
  "lineHeightMultiplier",
  "horizontalAlign",
  "verticalAlign",
];

export function measureGlyphDependencies(value: string, properties: GlyphProperties): Array<any> {
  return [
    value,
    properties.lineHeightMultiplier,
    ...glyphStructuralPropertyKeys.map((key) => properties[key]),
    JSON.stringify(
      properties.wrapper.keys.map((key) => [key, properties[key as keyof GlyphProperties]]),
    ),
  ];
}
