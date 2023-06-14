import React, { useEffect, useRef } from "react";
import {
  AmbientLight,
  Color,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import {
  applyGlyphBuilder,
  Bounds,
  GlyphProperties,
  GlyphStructureBuilder,
  InstancedGlypthMaterial,
  InstancedGlypthMesh,
  loadFont,
  updateGlyphMesh,
  BreakallWrapper,
} from "@coconut-xr/glyph";

export default function Three() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    init(canvasRef.current!).then(animate);
  }, []);
  return <canvas className="h-screen w-screen" ref={canvasRef}></canvas>;
}

let camera: PerspectiveCamera;
let scene: Scene;
let renderer: WebGLRenderer;

let mesh: InstancedGlypthMesh;

const matrix = new Matrix4();
const bounds = new Bounds(0, 0, 0, 0);

const raycaster = new Raycaster();
const pointer = new Vector2();

const geometry = new PlaneGeometry();
geometry.translate(0.5, -0.5, 0);

const rectangles = new InstancedMesh(geometry, new MeshBasicMaterial({ side: DoubleSide }), 4);
rectangles.position.z = -0.001

let glyphIndex: number | undefined = 0;
let lineIndex = 0;

async function init(canvas: HTMLCanvasElement) {
  const textureLoader = new TextureLoader();

  const font = await loadFont(
    "https://coconut-xr.github.io/msdf-fonts/",
    "roboto.json",
    textureLoader.loadAsync.bind(textureLoader),
  );
  font.page.flipY = false;

  const availableWidth = 10;
  const availableHeight = 10;

  const glyphBuilder = new GlyphStructureBuilder();

  const properties: GlyphProperties = {
    font,
    availableHeight,
    availableWidth,
    fontSize: 0.5,
    horizontalAlign: "left",
    verticalAlign: "bottom",
    letterSpacing: 0,
    lineHeightMultiplier: 1,
    wrapper: BreakallWrapper,
  };

  const text =
    "Thik";

  applyGlyphBuilder(glyphBuilder, text, properties);

  scene = new Scene();

  const material = new InstancedGlypthMaterial(font, { transparent: true });
  material.color.setRGB(1, 0, 1);

  mesh = updateGlyphMesh(undefined, glyphBuilder, material, properties);

  scene.add(mesh);

  // load a texture
  camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(availableWidth * 0.5, availableHeight * -0.5, 10);
  camera.lookAt(availableWidth * 0.5, availableHeight * -0.5, 0);

  // check overdraw
  // let material = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.1, transparent: true } );

  rectangles.setColorAt(0, new Color(1, 0, 1));
  rectangles.setColorAt(1, new Color(1, 1, 0));
  rectangles.setColorAt(2, new Color(0, 1, 1));
  rectangles.setColorAt(3, new Color(0, 0, 1));

  matrix.identity();
  mesh.bounds.toMatrix(matrix);
  rectangles.setMatrixAt(1, matrix);

  matrix.identity();
  matrix.makeScale(availableWidth, availableHeight, 1);
  rectangles.setMatrixAt(0, matrix);

  scene.add(rectangles);

  scene.add(new AmbientLight(new Color(1, 1, 1)));

  renderer = new WebGLRenderer({ antialias: true, canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("pointermove", onPointerMove);
}

function onPointerMove(event: PointerEvent) {
  pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  // See if the ray from the camera into the world hits one of our meshes
  const intersects = raycaster.intersectObject(mesh);

  // Toggle rotation bool for meshes that we clicked
  if (intersects.length > 0) {
    const intersection = intersects[0];
    if (intersection.object instanceof InstancedGlypthMesh) {
      glyphIndex = intersection.instanceId;
      lineIndex = intersection.faceIndex!;
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (glyphIndex != null) {
    mesh.getGlyphBounds(glyphIndex, bounds);
    bounds.toMatrix(matrix);
    rectangles.setMatrixAt(3, matrix);
  }

  mesh.getLineBounds(lineIndex, bounds);
  bounds.toMatrix(matrix);
  rectangles.setMatrixAt(2, matrix);

  rectangles.instanceMatrix.needsUpdate = true;

  render();
}

function render() {
  renderer.render(scene, camera);
}
