/* eslint-disable react/no-unknown-property */
import React from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import {
  applyGlyphBuilder,
  Bounds,
  getPropertyChanges,
  GlyphProperties,
  GlyphStructureBuilder,
  InstancedGlypthMaterial,
  InstancedGlypthMesh,
  updateGlyphMesh,
  loadFont,
  NowrapWrapper,
  BreakallWrapper,
  WordWrapper,
} from "@coconut-xr/glyph";
import { useMemo, useState, Suspense, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Color, DoubleSide, InstancedMesh, Matrix4, MeshBasicMaterial, PlaneGeometry } from "three";

import { useThree } from "@react-three/fiber";
import { suspend } from "suspend-react";
import { TextureLoader } from "three";

const textureLoader = new TextureLoader();
const loadFontTexture = textureLoader.loadAsync.bind(textureLoader);

function useFont(baseUrl: string, url: string) {
  const renderer = useThree(({ gl }) => gl);
  return suspend(
    async (baseUrl, url) => {
      const font = await loadFont(baseUrl, url, loadFontTexture);
      font.page.flipY = false;
      font.page.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return font;
    },
    [baseUrl, url],
  );
}

const fontUrlMap = {
  Roboto: "roboto.json",
  SourceSerifPro: "sourceserifpro.json",
  OpenSans: "opensans.json",
  Montserrat: "montserrat.json",
  Quicksand: "quicksand.json"
};
const fontKeys = Object.keys(fontUrlMap);

const wrapperMap = {
  //space: SpaceWrapper,
  //overflow: OverflowWrapper,
  breakall: BreakallWrapper,
  nowrap: NowrapWrapper,
  word: WordWrapper
};

const wrapperKeys = Object.keys(wrapperMap);

const horizontalAlignKeys: Array<GlyphProperties["horizontalAlign"]> = [
  "left",
  "block",
  "center",
  "right",
];
const verticalAlignKeys: Array<GlyphProperties["verticalAlign"]> = ["top", "center", "bottom"];

//TODO: display amount of updates (structural, positional, positionalLine)

export default function Text() {
  const [text, setText] = useState("Hello World!");
  const [fontName, setFontName] = useState(fontKeys[0]);
  const [availableWidth, setAvailableWidth] = useState(4);
  const [availableHeight, setAvailableHeight] = useState(4);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeightMultiplier, setLineHeightMultiplier] = useState(1.2);
  const [fontSize, setFontSize] = useState(1);
  const [wrapperName, setWrapperName] = useState(wrapperKeys[0]);
  const [horizontalAlign, setHorizontalAlign] = useState<string>(horizontalAlignKeys[0]);
  const [verticalAlign, setVerticalAlign] = useState<string>(verticalAlignKeys[0]);

  return (
    <div className="w-full bg-black h-screen flex flex-row">
      {
        <Canvas
          camera={{ position: [0, 0, 10] }}
          dpr={global.window != null ? window.devicePixelRatio : 1}
          className="flex-grow"
        >
          <color attach="background" args={[0, 0, 0]} />
          <OrbitControls panSpeed={0} target={[0, 0, 0]} />
          <group position={[-availableWidth * 0.5, availableHeight * 0.5, 0]}>
            <Suspense fallback={null}>
              <TextObject
                availableHeight={availableHeight}
                availableWidth={availableWidth}
                fontName={fontName}
                fontSize={fontSize}
                horizontalAlign={horizontalAlign as any}
                verticalAlign={verticalAlign as any}
                letterSpacing={letterSpacing}
                lineHeightMultiplier={lineHeightMultiplier}
                value={text}
                wrapperName={wrapperName}
              />
            </Suspense>
          </group>
        </Canvas>
      }
      <div className="w-72 p-4 m-4 prose bg-base-100 shadow-md overflow-y-auto">
        <h2 className="mb-2">Settings</h2>
        <Textarea title="Text" setValue={setText} value={text} />
        <Select title="Font" options={fontKeys} setValue={setFontName} value={fontName} />
        <NumberInput title="Available Width" setValue={setAvailableWidth} value={availableWidth} />
        <NumberInput
          title="Available Height"
          setValue={setAvailableHeight}
          value={availableHeight}
        />
        <NumberInput title="Letter Spacing" setValue={setLetterSpacing} value={letterSpacing} />
        <NumberInput
          title="Line Height Multiplier"
          setValue={setLineHeightMultiplier}
          value={lineHeightMultiplier}
        />
        <NumberInput title="Font Size" setValue={setFontSize} value={fontSize} />
        <Select
          title="Wrapper"
          options={wrapperKeys}
          setValue={setWrapperName}
          value={wrapperName}
        />
        <Select
          title="Horizontal Align"
          options={horizontalAlignKeys}
          setValue={setHorizontalAlign}
          value={horizontalAlign}
        />
        <Select
          title="Vertical Align"
          options={verticalAlignKeys}
          setValue={setVerticalAlign}
          value={verticalAlign}
        />
      </div>
    </div>
  );
}

function Textarea({
  title,
  setValue,
  value,
}: {
  title: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <div className="form-control mb-1">
      <label className="label">
        <span className="label-text">{title}</span>
      </label>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="textarea textarea-bordered"
        placeholder="Text"
      ></textarea>
    </div>
  );
}

function NumberInput({
  title,
  setValue,
  value,
}: {
  title: string;
  value: number;
  setValue: (value: number) => void;
}) {
  const [input, setInput] = useState(value.toString());
  return (
    <div className="form-control mb-1">
      <label className="label">
        <span className="label-text">{title}</span>
      </label>
      <input
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          const value = parseFloat(event.target.value);
          if (!isNaN(value)) {
            setValue(value);
          }
        }}
        type="number"
        className="input input-bordered w-full max-w-xs"
      />
    </div>
  );
}

function Select({
  title,
  options,
  setValue,
  value,
}: {
  title: string;
  value: string;
  setValue: (value: string) => void;
  options: Array<string>;
}) {
  return (
    <div className="form-control mb-1">
      <label className="label">
        <span className="label-text">{title}</span>
      </label>
      <select
        onChange={(event) => setValue(event.target.value)}
        value={value}
        className="select select-bordered w-full max-w-xs"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function TextObject({
  value,
  fontName,
  wrapperName,
  ...partialUpdate
}: {
  value: string;
  fontName: string;
  availableWidth: number | undefined;
  availableHeight: number | undefined;
  letterSpacing: number;
  lineHeightMultiplier: number;
  fontSize: number;
  wrapperName: string;
  horizontalAlign: "left" | "center" | "right" | "block";
  verticalAlign: "top" | "center" | "bottom";
}) {
  const fontUrl = fontUrlMap[fontName as keyof typeof fontUrlMap];
  const font = useFont("https://coconut-xr.github.io/msdf-fonts/", fontUrl);

  const wrapper = wrapperMap[wrapperName as keyof typeof wrapperMap];

  const update = Object.assign(partialUpdate, {
    font,
    wrapper,
  });

  const partialProperties = useRef<GlyphProperties | undefined>(undefined);
  const textRef = useRef<string | undefined>();

  let { hasStructuralChanges, hasTransformationChanges } = getPropertyChanges(
    partialProperties.current,
    update,
  );
  if (textRef.current != value) {
    textRef.current = value;
    hasStructuralChanges = true;
  }

  const properties = Object.assign(partialProperties.current ?? {}, update);

  const meshRef = useRef<InstancedGlypthMesh | undefined>(undefined);
  const material = useMemo(() => new InstancedGlypthMaterial(font, { transparent: true }), []);
  material.updateFont(font);
  material.side = DoubleSide;
  material.color.setRGB(1, 1, 1);

  const structureBuilder = useMemo(() => new GlyphStructureBuilder(), []);

  if (hasStructuralChanges) {
    applyGlyphBuilder(structureBuilder, value, properties);
    //TODO: this should be solved by saving number of changes in the glyphbuilder
    hasTransformationChanges = true;
  }

  meshRef.current = updateGlyphMesh(meshRef.current, structureBuilder, material, properties);

  const rectangles = useMemo(() => {
    const geometry = new PlaneGeometry();
    geometry.translate(0.5, -0.5, 0);
    const mesh = new InstancedMesh(
      geometry,
      new MeshBasicMaterial({ transparent: true, opacity: 0.15, side: DoubleSide }),
      4,
    );
    mesh.setColorAt(0, new Color(1, 1, 1));
    mesh.setColorAt(1, new Color(1, 1, 1));
    mesh.setColorAt(2, new Color(1, 1, 1));
    mesh.setColorAt(3, new Color(1, 1, 1));
    return mesh;
  }, []);

  const highlightIndicies = useMemo<{ glyphIndex: number; lineIndex: number }>(
    () => ({ glyphIndex: 0, lineIndex: 0 }),
    [],
  );

  updateHighlight(
    meshRef.current,
    rectangles,
    highlightIndicies.glyphIndex,
    highlightIndicies.lineIndex,
    properties.availableWidth,
    properties.availableHeight,
  );

  return (
    <group>
      <primitive
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          highlightIndicies.glyphIndex = e.instanceId ?? highlightIndicies.glyphIndex;
          highlightIndicies.lineIndex = e.faceIndex ?? highlightIndicies.lineIndex;
          updateHighlight(
            meshRef.current!,
            rectangles,
            highlightIndicies.glyphIndex,
            highlightIndicies.lineIndex,
            properties.availableWidth,
            properties.availableHeight,
          );
        }}
        object={meshRef.current}
      />
      <primitive object={rectangles} />
    </group>
  );
}

const bounds = new Bounds();
const matrix = new Matrix4();

function updateHighlight(
  mesh: InstancedGlypthMesh,
  rectangles: InstancedMesh,
  glyphIndex: number,
  lineIndex: number,
  availableWidth: number | undefined,
  availableHeight: number | undefined,
): void {
  mesh.getGlyphBounds(glyphIndex, bounds);
  bounds.toMatrix(matrix);
  matrix.elements[14] = -0.01;
  rectangles.setMatrixAt(3, matrix);

  mesh.getLineBounds(lineIndex, bounds);
  bounds.toMatrix(matrix);
  matrix.elements[14] = -0.02;
  rectangles.setMatrixAt(2, matrix);

  matrix.identity();
  mesh.bounds.toMatrix(matrix);
  matrix.elements[14] = -0.03;
  rectangles.setMatrixAt(1, matrix);

  matrix.identity();
  matrix.makeScale(availableWidth ?? 0, availableHeight ?? 0, 1);
  matrix.elements[14] = -0.04;
  rectangles.setMatrixAt(0, matrix);

  rectangles.instanceMatrix.needsUpdate = true;
}
