import {
  DynamicDrawUsage,
  InstancedBufferAttribute,
  Intersection,
  Material,
  Matrix4,
  Mesh,
  Plane,
  PlaneGeometry,
  Raycaster,
  Usage,
  Vector2,
  Vector3,
} from "three";
import { GlyphProperties } from "./apply-glyph-builder.js";
import { calculateGlyphTransformation } from "./calculate-glyph-transformation.js";
import { GlyphStructureBuilder } from "./glyph-builder.js";
import { Bounds, calculateSpaceConversionRatio } from "./utils.js";

const localVectorHelper = new Vector3();
const globalVectorHelper = new Vector3();

const helperPlane = new Plane();

const _helper = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function updateGlyphMesh(
  mesh: InstancedGlypthMesh | undefined,
  structureBuilder: GlyphStructureBuilder,
  material: Material,
  properties: GlyphProperties,
  usage: Usage = DynamicDrawUsage,
): InstancedGlypthMesh {
  const spaceConversionRatio = calculateSpaceConversionRatio(properties.font, properties.fontSize);

  const count = structureBuilder.glyphs.length;
  if (
    mesh == null ||
    count >= mesh.instanceMatrix.count ||
    count * 3 <= mesh.instanceMatrix.count
  ) {
    const size = Math.ceil(count * 1.5);
    //count more then size (increase) or count smaller then 1/3 of the size (decrease)
    const instanceMatrix = new InstancedBufferAttribute(new Float32Array(size * 16), 16);
    instanceMatrix.setUsage(usage);
    const instanceUV = new InstancedBufferAttribute(new Float32Array(size * 4), 4);
    instanceUV.setUsage(usage);
    mesh = new InstancedGlypthMesh(instanceMatrix, instanceUV);
  }

  mesh.material = material;
  mesh.count = count;
  mesh.lineHeight =
    properties.font.lineHeight * properties.lineHeightMultiplier * spaceConversionRatio;

  const lines = structureBuilder.lines;
  for (let i = 0; i < lines.length; i++) {
    mesh.lineLastGlyphIndex[i] = lines[i].lastGlyphIndex;
  }
  mesh.lineLastGlyphIndex.length = lines.length;

  calculateGlyphTransformation(
    structureBuilder,
    mesh.bounds,
    mesh.setGlyphTransformation.bind(mesh),
    mesh.setGlyphUV.bind(mesh),
    spaceConversionRatio,
    properties,
  );

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceUV.needsUpdate = true;

  return mesh;
}

export class InstancedGlypthMesh extends Mesh {
  public readonly isInstancedMesh = true;

  public readonly instanceColor = null;

  public count = 0;
  public lineHeight = 0;
  public readonly lineLastGlyphIndex: Array<number> = [];
  public readonly bounds = new Bounds();

  constructor(
    public readonly instanceMatrix: InstancedBufferAttribute,
    public readonly instanceUV: InstancedBufferAttribute,
  ) {
    const planeGeometry = new PlaneGeometry();
    planeGeometry.translate(0.5, -0.5, 0);
    super(planeGeometry);

    planeGeometry.attributes.instanceUVOffset = instanceUV;

    this.frustumCulled = false;
  }

  copy(source: this, recursive?: boolean) {
    super.copy(source, recursive);

    this.instanceMatrix.copy(source.instanceMatrix);
    this.instanceUV.copy(source.instanceUV);
    this.count = source.count;
    this.lineHeight = source.lineHeight;
    this.bounds.copy(source.bounds);
    this.lineLastGlyphIndex.length = 0;
    this.lineLastGlyphIndex.push(...source.lineLastGlyphIndex);

    return this;
  }

  getGlyphBounds(index: number, target: Bounds): void {
    const offset = index * 16;
    const array = this.instanceMatrix.array;

    target.x = array[offset + 12];
    target.y = array[offset + 13];

    target.width = array[offset + 0];
    target.height = array[offset + 5];
  }

  getLineBounds(index: number, target: Bounds): void {
    const firstGlyphIndex = index === 0 ? 0 : this.lineLastGlyphIndex[index - 1] + 1;
    const lastGlyphIndex = this.lineLastGlyphIndex[index];

    target.height = this.lineHeight;
    target.y = this.bounds.y + -index * this.lineHeight;
    const xStart = this.getGlyphStartX(firstGlyphIndex);
    const xEnd = this.getGlyphEndX(lastGlyphIndex);
    target.x = xStart;
    target.width = xEnd - xStart;
  }

  getMatrixAt(index: number, matrix: Matrix4) {
    matrix.fromArray(this.instanceMatrix.array, index * 16);
  }

  setGlyphTransformation(index: number, x: number, y: number, width: number, height: number): void {
    //translate
    _helper[12] = x;
    _helper[13] = y;

    //scale
    _helper[0] = width;
    _helper[5] = height;

    this.instanceMatrix.set(_helper, 16 * index);
  }

  setGlyphUV(index: number, x: number, y: number, width: number, height: number): void {
    this.instanceUV.setXYZW(index, x, y + height, width, -height);
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    helperPlane.normal.set(0, 0, 1);
    helperPlane.constant = 0;
    helperPlane.applyMatrix4(this.matrixWorld);

    raycaster.ray.intersectPlane(helperPlane, globalVectorHelper);
    localVectorHelper.copy(globalVectorHelper);
    this.worldToLocal(localVectorHelper);

    if (
      localVectorHelper.x < this.bounds.x ||
      localVectorHelper.x > this.bounds.x + this.bounds.width ||
      localVectorHelper.y > this.bounds.y ||
      localVectorHelper.y < this.bounds.y - this.bounds.height
    ) {
      return;
    }

    const y = -localVectorHelper.y + this.bounds.y;

    let lineIndex = 0;
    while (
      lineIndex < this.lineLastGlyphIndex.length - 1 &&
      y > this.lineHeight * (lineIndex + 1)
    ) {
      ++lineIndex;
    }

    intersects.push({
      object: this,
      distance: raycaster.ray.distanceToPlane(helperPlane),
      point: globalVectorHelper.clone(),
      faceIndex: lineIndex,
      instanceId: this.computeGlyphIndexFromX(lineIndex, localVectorHelper.x),
      uv: new Vector2(
        (localVectorHelper.x - this.bounds.x) / this.bounds.width,
        (localVectorHelper.y - this.bounds.y) / this.bounds.height,
      ),
      uv2: this.computeGlyphUVFromXY(lineIndex, localVectorHelper.x, localVectorHelper.y),
    });
  }

  private computeGlyphIndexFromX(lineIndex: number, x: number): number | undefined {
    const firstGlyphIndex = lineIndex === 0 ? 0 : this.lineLastGlyphIndex[lineIndex - 1] + 1;
    const lastGlyphIndex = this.lineLastGlyphIndex[lineIndex];

    // If the point ist more left than the leftmost glyph, return idx 0
    // If it is more right than the rightmost glyph, return the last glyph in index;
    if (x < this.getGlyphStartX(firstGlyphIndex)) {
      return firstGlyphIndex;
    } else if (x > this.getGlyphEndX(lastGlyphIndex)) {
      return lastGlyphIndex;
    }

    let glyphIndex = firstGlyphIndex;
    while (glyphIndex < lastGlyphIndex && x >= this.getGlyphStartX(glyphIndex + 1)) {
      ++glyphIndex;
    }

    return glyphIndex;
  }

  private computeGlyphUVFromXY(lineIndex: number, x: number, y: number): Vector2 | undefined {
    const idx = this.computeGlyphIndexFromX(lineIndex, x);
    if (idx == null) {
      return undefined;
    }
    const glyphStartX = this.getGlyphStartX(idx);
    const width = this.getGlyphWidth(idx);
    const glyphStartY = this.getGlyphStartY(idx);
    const height = this.getGlyphHeight(idx);
    return new Vector2(
      Math.min(Math.max((x - glyphStartX) / width, 0), 1),
      Math.min(Math.max((y - glyphStartY) / height, 0), 1),
    );
  }

  public getGlyphStartX(glyphIndex: number): number {
    return this.instanceMatrix.array[glyphIndex * 16 + 12];
  }

  public getGlyphEndX(glyphIndex: number): number {
    const array = this.instanceMatrix.array;
    return array[glyphIndex * 16 + 12] + array[glyphIndex * 16 + 0];
  }

  public getGlyphStartY(glyphIndex: number): number {
    return this.instanceMatrix.array[glyphIndex * 16 + 13];
  }

  public getGlyphEndY(glyphIndex: number): number {
    const array = this.instanceMatrix.array;
    return array[glyphIndex * 16 + 13] + array[glyphIndex * 16 + 5];
  }

  public getGlyphWidth(glyphIndex: number): number {
    return this.instanceMatrix.array[glyphIndex * 16 + 0];
  }
  public getGlyphHeight(glyphIndex: number): number {
    return this.instanceMatrix.array[glyphIndex * 16 + 5];
  }

  updateMorphTargets() {
    //nothing to do here
  }

  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}
