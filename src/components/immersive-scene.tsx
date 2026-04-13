"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

type ControlsState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createPersianRugTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#7f1f24";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#0f2744";
  context.fillRect(28, 28, canvas.width - 56, canvas.height - 56);

  context.fillStyle = "#c1944f";
  context.fillRect(54, 54, canvas.width - 108, canvas.height - 108);

  context.fillStyle = "#8e2a31";
  context.fillRect(92, 92, canvas.width - 184, canvas.height - 184);

  context.strokeStyle = "#f2dcb7";
  context.lineWidth = 8;
  context.strokeRect(118, 118, canvas.width - 236, canvas.height - 236);

  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.fillStyle = "#0f2744";
  context.beginPath();
  context.moveTo(0, -168);
  context.bezierCurveTo(124, -118, 124, 118, 0, 168);
  context.bezierCurveTo(-124, 118, -124, -118, 0, -168);
  context.fill();

  context.fillStyle = "#d1a25d";
  context.beginPath();
  context.moveTo(0, -118);
  context.bezierCurveTo(88, -80, 88, 80, 0, 118);
  context.bezierCurveTo(-88, 80, -88, -80, 0, -118);
  context.fill();

  context.fillStyle = "#7f1f24";
  context.beginPath();
  context.arc(0, 0, 52, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.strokeStyle = "#f2dcb7";
  context.lineWidth = 6;

  for (let index = 0; index < 8; index += 1) {
    const x = 150 + index * 92;

    context.beginPath();
    context.moveTo(x, 124);
    context.lineTo(x + 24, 152);
    context.lineTo(x, 180);
    context.lineTo(x - 24, 152);
    context.closePath();
    context.stroke();

    context.beginPath();
    context.moveTo(x, canvas.height - 124);
    context.lineTo(x + 24, canvas.height - 152);
    context.lineTo(x, canvas.height - 180);
    context.lineTo(x - 24, canvas.height - 152);
    context.closePath();
    context.stroke();
  }

  for (let index = 0; index < 5; index += 1) {
    const y = 176 + index * 104;

    context.beginPath();
    context.moveTo(124, y);
    context.lineTo(152, y + 24);
    context.lineTo(180, y);
    context.lineTo(152, y - 24);
    context.closePath();
    context.stroke();

    context.beginPath();
    context.moveTo(canvas.width - 124, y);
    context.lineTo(canvas.width - 152, y + 24);
    context.lineTo(canvas.width - 180, y);
    context.lineTo(canvas.width - 152, y - 24);
    context.closePath();
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createLinkPanelTexture(
  title: string,
  accent: string,
  subtitle: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#1b1714";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = accent;
  context.fillRect(18, 18, 24, canvas.height - 36);

  context.fillStyle = "#f4ede3";
  context.font = "700 54px 'Plus Jakarta Sans', sans-serif";
  context.fillText(title, 72, 108);

  context.fillStyle = "#cabfb2";
  context.font = "500 28px 'Plus Jakarta Sans', sans-serif";
  context.fillText(subtitle, 72, 158);

  context.strokeStyle = "rgba(244, 237, 227, 0.18)";
  context.lineWidth = 4;
  context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addMesh<TGeometry extends THREE.BufferGeometry, TMaterial extends THREE.Material>(
  parent: THREE.Object3D,
  geometry: TGeometry,
  material: TMaterial,
  position: [number, number, number],
  rotation?: [number, number, number],
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);

  if (rotation) {
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  }

  parent.add(mesh);
  return mesh;
}

export default function ImmersiveScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickPointerIdRef = useRef<number | null>(null);
  const joystickInputRef = useRef({ x: 0, y: 0 });
  const controlsRef = useRef<ControlsState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const [joystickState, setJoystickState] = useState({
    active: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const isMobile = window.innerWidth < 900;
    const roomWidth = 12;
    const roomDepth = 16;
    const playerRadius = 0.42;
    const textureLoader = new THREE.TextureLoader();
    const rugTexture = createPersianRugTexture();
    const logoTexture = textureLoader.load("/acrtech.png");
    const socialLinks = [
      {
        title: "GitHub",
        subtitle: "github.com/okanacer332",
        url: "https://github.com/okanacer332",
        accent: "#b7bec8",
      },
      {
        title: "LinkedIn",
        subtitle: "linkedin.com/in/okanacer332",
        url: "https://www.linkedin.com/in/okanacer332/",
        accent: "#5ea3ff",
      },
      {
        title: "Instagram",
        subtitle: "instagram.com/okanacer332",
        url: "https://www.instagram.com/okanacer332/",
        accent: "#ff8f63",
      },
    ] as const;
    const socialTextures = socialLinks
      .map((link) =>
        createLinkPanelTexture(link.title, link.accent, link.subtitle),
      )
      .filter((texture): texture is THREE.CanvasTexture => texture !== null);
    const clickableMeshes: THREE.Mesh[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerDown = { x: 0, y: 0 };
    let pointerMoved = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ece3d7");

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 72 : 58,
      container.clientWidth / container.clientHeight,
      0.1,
      60,
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    logoTexture.colorSpace = THREE.SRGBColorSpace;
    logoTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const ambientLight = new THREE.AmbientLight("#ffffff", 1.15);
    const hemiLight = new THREE.HemisphereLight("#fff8f0", "#b89f87", 1.05);
    const sunLight = new THREE.DirectionalLight("#fff7ef", 1.25);
    const windowLight = new THREE.PointLight("#b7d8ff", 2.1, 12);
    const lampLight = new THREE.PointLight("#ffd8ab", 1.2, 8);

    sunLight.position.set(5, 8, 4);
    windowLight.position.set(4.2, 2.4, -5.2);
    lampLight.position.set(3.8, 2.05, 5.2);

    scene.add(ambientLight, hemiLight, sunLight, windowLight, lampLight);

    const room = new THREE.Group();
    scene.add(room);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#f7f1ea",
      roughness: 0.95,
    });
    const sideWallMaterial = new THREE.MeshStandardMaterial({
      color: "#efe5d9",
      roughness: 0.95,
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: "#9d7a5f",
      roughness: 0.92,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: "#d3c4b2",
      roughness: 0.88,
    });
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: "#6f4f3c",
      roughness: 0.82,
    });
    const darkWoodMaterial = new THREE.MeshStandardMaterial({
      color: "#4f392d",
      roughness: 0.84,
    });
    const chairMaterial = new THREE.MeshStandardMaterial({
      color: "#667381",
      roughness: 0.92,
    });
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: "#1f2730",
      roughness: 0.42,
      metalness: 0.1,
    });
    const screenGlowMaterial = new THREE.MeshStandardMaterial({
      color: "#11161d",
      roughness: 0.28,
      emissive: "#306cff",
      emissiveIntensity: 0.08,
    });
    const silverMaterial = new THREE.MeshStandardMaterial({
      color: "#d3d4d6",
      roughness: 0.42,
      metalness: 0.58,
    });
    const rugMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.98,
      map: rugTexture ?? undefined,
    });
    const plantMaterial = new THREE.MeshStandardMaterial({
      color: "#638a58",
      roughness: 0.92,
    });

    addMesh(
      room,
      new THREE.PlaneGeometry(roomWidth, roomDepth),
      floorMaterial,
      [0, 0, 0],
      [-Math.PI / 2, 0, 0],
    );

    addMesh(
      room,
      new THREE.PlaneGeometry(roomWidth, 6.2),
      wallMaterial,
      [0, 3.1, -roomDepth / 2],
    );
    addMesh(
      room,
      new THREE.PlaneGeometry(roomWidth, 6.2),
      wallMaterial,
      [0, 3.1, roomDepth / 2],
      [0, Math.PI, 0],
    );
    addMesh(
      room,
      new THREE.PlaneGeometry(roomDepth, 6.2),
      sideWallMaterial,
      [-roomWidth / 2, 3.1, 0],
      [0, Math.PI / 2, 0],
    );
    addMesh(
      room,
      new THREE.PlaneGeometry(roomDepth, 6.2),
      sideWallMaterial,
      [roomWidth / 2, 3.1, 0],
      [0, -Math.PI / 2, 0],
    );

    [
      [0, 0.09, -roomDepth / 2 + 0.02, roomWidth, 0.18, 0.18],
      [0, 0.09, roomDepth / 2 - 0.02, roomWidth, 0.18, 0.18],
      [-roomWidth / 2 + 0.09, 3.1, -roomDepth / 2 + 0.02, 0.18, 6.2, 0.18],
      [roomWidth / 2 - 0.09, 3.1, -roomDepth / 2 + 0.02, 0.18, 6.2, 0.18],
      [-roomWidth / 2 + 0.09, 3.1, roomDepth / 2 - 0.02, 0.18, 6.2, 0.18],
      [roomWidth / 2 - 0.09, 3.1, roomDepth / 2 - 0.02, 0.18, 6.2, 0.18],
    ].forEach(([x, y, z, width, height, depth]) => {
      addMesh(
        room,
        new THREE.BoxGeometry(width as number, height as number, depth as number),
        trimMaterial,
        [x as number, y as number, z as number],
      );
    });

    addMesh(
      room,
      new THREE.PlaneGeometry(2.6, 1.8),
      new THREE.MeshStandardMaterial({
        color: "#cfe2f7",
        roughness: 0.2,
      }),
      [4.25, 3.25, -roomDepth / 2 + 0.03],
    );
    addMesh(
      room,
      new THREE.BoxGeometry(2.75, 1.95, 0.08),
      trimMaterial,
      [4.25, 3.25, -roomDepth / 2 + 0.02],
    );

    const logoGeometry = new THREE.PlaneGeometry(2.7, 1.35);

    [
      { position: [0, 3.15, -roomDepth / 2 + 0.04], rotation: [0, 0, 0] },
      { position: [-roomWidth / 2 + 0.04, 3.15, 0], rotation: [0, Math.PI / 2, 0] },
      { position: [roomWidth / 2 - 0.04, 3.15, 0], rotation: [0, -Math.PI / 2, 0] },
    ].forEach(({ position, rotation }) => {
      addMesh(
        room,
        logoGeometry,
        new THREE.MeshBasicMaterial({
          map: logoTexture,
          transparent: true,
        }),
        position as [number, number, number],
        rotation as [number, number, number],
      );
    });

    socialLinks.forEach((link, index) => {
      const panel = addMesh(
        room,
        new THREE.PlaneGeometry(1.65, 0.78),
        new THREE.MeshBasicMaterial({
          map: socialTextures[index],
          transparent: true,
        }),
        [-2.1 + index * 2.1, 3.1, roomDepth / 2 - 0.04],
        [0, Math.PI, 0],
      );
      panel.userData.url = link.url;
      clickableMeshes.push(panel);
    });

    addMesh(
      room,
      new THREE.PlaneGeometry(5.8, 4.2),
      rugMaterial,
      [0, 0.02, 2.2],
      [-Math.PI / 2, 0, 0],
    );

    const desk = new THREE.Group();
    room.add(desk);

    addMesh(
      desk,
      new THREE.BoxGeometry(3.2, 0.18, 1.4),
      woodMaterial,
      [0, 0.92, -5.2],
    );

    [
      [-1.35, 0.45, -5.8],
      [1.35, 0.45, -5.8],
      [-1.35, 0.45, -4.6],
      [1.35, 0.45, -4.6],
    ].forEach((position) => {
      addMesh(
        desk,
        new THREE.BoxGeometry(0.12, 0.9, 0.12),
        darkWoodMaterial,
        position as [number, number, number],
      );
    });

    addMesh(
      desk,
      new THREE.BoxGeometry(1.14, 0.06, 0.78),
      silverMaterial,
      [0, 1.02, -5.2],
    );
    addMesh(
      desk,
      new THREE.BoxGeometry(1.14, 0.72, 0.05),
      screenMaterial,
      [0, 1.4, -5.58],
    );
    addMesh(
      desk,
      new THREE.PlaneGeometry(1.03, 0.61),
      screenGlowMaterial,
      [0, 1.4, -5.54],
    );
    addMesh(
      desk,
      new THREE.BoxGeometry(0.14, 0.34, 0.14),
      silverMaterial,
      [0, 1.16, -5.36],
    );
    addMesh(
      desk,
      new THREE.BoxGeometry(0.54, 0.03, 0.22),
      silverMaterial,
      [0, 1.01, -4.62],
    );

    addMesh(
      desk,
      new THREE.BoxGeometry(0.33, 0.04, 0.62),
      silverMaterial,
      [0.98, 1.02, -5.08],
      [0, -0.38, 0],
    );
    addMesh(
      desk,
      new THREE.PlaneGeometry(0.28, 0.48),
      screenGlowMaterial,
      [0.98, 1.05, -5.07],
      [-1.16, -0.38, 0],
    );

    addMesh(
      desk,
      new THREE.BoxGeometry(0.16, 0.025, 0.33),
      silverMaterial,
      [-1.02, 1.02, -4.96],
      [0, 0.22, 0],
    );
    addMesh(
      desk,
      new THREE.PlaneGeometry(0.135, 0.28),
      screenGlowMaterial,
      [-1.02, 1.035, -4.96],
      [-1.57, 0.22, 0],
    );

    const chair = new THREE.Group();
    room.add(chair);

    addMesh(
      chair,
      new THREE.BoxGeometry(0.85, 0.12, 0.85),
      chairMaterial,
      [0, 0.6, -3.9],
    );
    addMesh(
      chair,
      new THREE.BoxGeometry(0.85, 0.95, 0.12),
      chairMaterial,
      [0, 1.05, -4.25],
    );
    addMesh(
      chair,
      new THREE.CylinderGeometry(0.06, 0.08, 0.58, 16),
      new THREE.MeshStandardMaterial({
        color: "#4f5661",
        roughness: 0.7,
        metalness: 0.35,
      }),
      [0, 0.28, -3.9],
    );

    const seatedPerson = new THREE.Group();
    room.add(seatedPerson);

    const seatedSkinMaterial = new THREE.MeshStandardMaterial({
      color: "#efcfbc",
      roughness: 0.92,
    });
    const seatedHairMaterial = new THREE.MeshStandardMaterial({
      color: "#2f241d",
      roughness: 0.88,
    });
    const seatedTopMaterial = new THREE.MeshStandardMaterial({
      color: "#3a4758",
      roughness: 0.94,
    });
    const seatedPantsMaterial = new THREE.MeshStandardMaterial({
      color: "#6f7f90",
      roughness: 0.92,
    });
    const seatedShoeMaterial = new THREE.MeshStandardMaterial({
      color: "#41352e",
      roughness: 0.88,
    });

    const seatedTorso = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.3, 0.86, 6, 10),
      seatedTopMaterial,
      [0, 1.12, -4.08],
      [-0.16, 0, 0],
    );
    const seatedHead = addMesh(
      seatedPerson,
      new THREE.SphereGeometry(0.29, 20, 20),
      seatedSkinMaterial,
      [0, 1.88, -4.24],
    );
    const seatedHair = addMesh(
      seatedPerson,
      new THREE.SphereGeometry(0.3, 20, 20),
      seatedHairMaterial,
      [0, 1.98, -4.2],
    );
    seatedHair.scale.set(1.02, 0.72, 1.02);

    const seatedUpperArmLeft = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.08, 0.34, 4, 8),
      seatedSkinMaterial,
      [-0.34, 1.22, -4.34],
      [-1.1, 0.08, -0.16],
    );
    const seatedUpperArmRight = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.08, 0.34, 4, 8),
      seatedSkinMaterial,
      [0.34, 1.22, -4.34],
      [-1.1, -0.08, 0.16],
    );
    const seatedForearmLeft = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.07, 0.3, 4, 8),
      seatedSkinMaterial,
      [-0.42, 1.04, -4.74],
      [-0.64, 0.04, -0.08],
    );
    const seatedForearmRight = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.07, 0.3, 4, 8),
      seatedSkinMaterial,
      [0.42, 1.04, -4.74],
      [-0.64, -0.04, 0.08],
    );

    const seatedThighLeft = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.1, 0.42, 4, 8),
      seatedPantsMaterial,
      [-0.18, 0.68, -4.08],
      [Math.PI / 2 - 0.12, 0, 0],
    );
    const seatedThighRight = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.1, 0.42, 4, 8),
      seatedPantsMaterial,
      [0.18, 0.68, -4.08],
      [Math.PI / 2 - 0.12, 0, 0],
    );
    const seatedCalfLeft = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.09, 0.52, 4, 8),
      seatedPantsMaterial,
      [-0.18, 0.38, -4.42],
      [0.06, 0, 0],
    );
    const seatedCalfRight = addMesh(
      seatedPerson,
      new THREE.CapsuleGeometry(0.09, 0.52, 4, 8),
      seatedPantsMaterial,
      [0.18, 0.38, -4.42],
      [0.06, 0, 0],
    );
    const seatedFootLeft = addMesh(
      seatedPerson,
      new THREE.BoxGeometry(0.22, 0.1, 0.42),
      seatedShoeMaterial,
      [-0.18, 0.06, -4.3],
      [0, 0, 0],
    );
    const seatedFootRight = addMesh(
      seatedPerson,
      new THREE.BoxGeometry(0.22, 0.1, 0.42),
      seatedShoeMaterial,
      [0.18, 0.06, -4.3],
      [0, 0, 0],
    );

    const shelf = new THREE.Group();
    room.add(shelf);

    addMesh(
      shelf,
      new THREE.BoxGeometry(1.24, 3.8, 0.46),
      darkWoodMaterial,
      [-4.9, 1.9, -1.4],
    );

    [-1.4, -0.55, 0.3, 1.15].forEach((y) => {
      addMesh(
        shelf,
        new THREE.BoxGeometry(1.28, 0.08, 0.5),
        woodMaterial,
        [-4.9, 1.9 + y, -1.4],
      );
    });

    const bookColors = [
      "#c68d68",
      "#7a8ca8",
      "#b2a860",
      "#cf7476",
      "#8f745c",
      "#6e8f74",
      "#9b7fb5",
      "#688db4",
      "#a8865b",
    ];
    const shelfRows = [0.34, 1.2, 2.05, 2.9];

    shelfRows.forEach((rowY, rowIndex) => {
      for (let index = 0; index < 8; index += 1) {
        const width = 0.08 + (index % 3) * 0.025;
        const height = 0.48 + ((index + rowIndex) % 4) * 0.08;
        const x = -5.26 + index * 0.16;
        const color = bookColors[(index + rowIndex) % bookColors.length];

        addMesh(
          shelf,
          new THREE.BoxGeometry(width, height, 0.22),
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.88,
          }),
          [x, rowY + height / 2, -1.45],
          [0, 0, ((index + rowIndex) % 2 === 0 ? -1 : 1) * 0.05],
        );
      }
    });

    addMesh(
      shelf,
      new THREE.BoxGeometry(0.34, 0.1, 0.42),
      woodMaterial,
      [-4.62, 3.42, -1.4],
    );
    addMesh(
      shelf,
      new THREE.BoxGeometry(0.3, 0.14, 0.22),
      new THREE.MeshStandardMaterial({
        color: "#ded7cd",
        roughness: 0.92,
      }),
      [-5.12, 3.42, -1.4],
    );

    const sideUnit = new THREE.Group();
    room.add(sideUnit);

    addMesh(
      sideUnit,
      new THREE.BoxGeometry(1.4, 0.86, 0.6),
      woodMaterial,
      [4.85, 0.43, 1.2],
    );
    addMesh(
      sideUnit,
      new THREE.BoxGeometry(0.7, 0.52, 0.04),
      trimMaterial,
      [4.85, 1.2, 1.2],
    );

    const plant = new THREE.Group();
    room.add(plant);

    addMesh(
      plant,
      new THREE.CylinderGeometry(0.22, 0.26, 0.34, 18),
      new THREE.MeshStandardMaterial({
        color: "#a97558",
        roughness: 0.95,
      }),
      [4.4, 0.17, 4.8],
    );
    addMesh(
      plant,
      new THREE.SphereGeometry(0.46, 18, 18),
      plantMaterial,
      [4.4, 0.72, 4.8],
    );
    addMesh(
      plant,
      new THREE.SphereGeometry(0.28, 18, 18),
      plantMaterial,
      [4.68, 1.02, 4.68],
    );

    const lamp = new THREE.Group();
    room.add(lamp);

    addMesh(
      lamp,
      new THREE.CylinderGeometry(0.05, 0.05, 2.2, 14),
      new THREE.MeshStandardMaterial({
        color: "#56514c",
        roughness: 0.8,
      }),
      [3.8, 1.1, 5.2],
    );
    addMesh(
      lamp,
      new THREE.CylinderGeometry(0.38, 0.26, 0.42, 18),
      new THREE.MeshStandardMaterial({
        color: "#f0d7b7",
        roughness: 0.9,
        emissive: "#ffe9c8",
        emissiveIntensity: 0.12,
      }),
      [3.8, 2.28, 5.2],
    );

    const character = new THREE.Group();
    room.add(character);

    const skinMaterial = new THREE.MeshStandardMaterial({
      color: "#f1d4bf",
      roughness: 0.95,
    });
    const outfitMaterial = new THREE.MeshStandardMaterial({
      color: "#4d6273",
      roughness: 0.92,
    });
    const shoeMaterial = new THREE.MeshStandardMaterial({
      color: "#3a3028",
      roughness: 0.9,
    });

    const body = addMesh(
      character,
      new THREE.CapsuleGeometry(0.32, 0.82, 6, 10),
      outfitMaterial,
      [0, 1.18, 0],
    );
    const head = addMesh(
      character,
      new THREE.SphereGeometry(0.28, 20, 20),
      skinMaterial,
      [0, 2.02, 0],
    );
    const leftArm = addMesh(
      character,
      new THREE.BoxGeometry(0.16, 0.72, 0.16),
      skinMaterial,
      [-0.42, 1.22, 0],
    );
    const rightArm = addMesh(
      character,
      new THREE.BoxGeometry(0.16, 0.72, 0.16),
      skinMaterial,
      [0.42, 1.22, 0],
    );
    const leftLeg = addMesh(
      character,
      new THREE.BoxGeometry(0.18, 0.86, 0.18),
      outfitMaterial,
      [-0.16, 0.46, 0],
    );
    const rightLeg = addMesh(
      character,
      new THREE.BoxGeometry(0.18, 0.86, 0.18),
      outfitMaterial,
      [0.16, 0.46, 0],
    );
    const leftFoot = addMesh(
      character,
      new THREE.BoxGeometry(0.22, 0.1, 0.4),
      shoeMaterial,
      [-0.16, 0.05, 0.08],
    );
    const rightFoot = addMesh(
      character,
      new THREE.BoxGeometry(0.22, 0.1, 0.4),
      shoeMaterial,
      [0.16, 0.05, 0.08],
    );

    character.position.set(0, 0, 4.6);
    character.rotation.y = 0;

    const obstacles = [
      { minX: -1.9, maxX: 1.9, minZ: -6.25, maxZ: -4.15 },
      { minX: -5.7, maxX: -4.1, minZ: -3.4, maxZ: 0.4 },
      { minX: 4.0, maxX: 5.7, minZ: 0.6, maxZ: 1.8 },
      { minX: 3.95, maxX: 5.0, minZ: 4.25, maxZ: 5.35 },
      { minX: 3.2, maxX: 4.45, minZ: 4.65, maxZ: 5.85 },
      { minX: -0.9, maxX: 0.9, minZ: -4.45, maxZ: -3.15 },
    ];

    const canMoveTo = (x: number, z: number) => {
      const halfWidth = roomWidth / 2 - playerRadius - 0.35;
      const halfDepth = roomDepth / 2 - playerRadius - 0.35;

      if (x < -halfWidth || x > halfWidth || z < -halfDepth || z > halfDepth) {
        return false;
      }

      return !obstacles.some(
        (obstacle) =>
          x > obstacle.minX - playerRadius &&
          x < obstacle.maxX + playerRadius &&
          z > obstacle.minZ - playerRadius &&
          z < obstacle.maxZ + playerRadius,
      );
    };

    const cameraTarget = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    const velocity = new THREE.Vector3();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyW" || event.code === "ArrowUp") {
        controlsRef.current.forward = true;
      }
      if (event.code === "KeyS" || event.code === "ArrowDown") {
        controlsRef.current.backward = true;
      }
      if (event.code === "KeyA" || event.code === "ArrowLeft") {
        controlsRef.current.left = true;
      }
      if (event.code === "KeyD" || event.code === "ArrowRight") {
        controlsRef.current.right = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "KeyW" || event.code === "ArrowUp") {
        controlsRef.current.forward = false;
      }
      if (event.code === "KeyS" || event.code === "ArrowDown") {
        controlsRef.current.backward = false;
      }
      if (event.code === "KeyA" || event.code === "ArrowLeft") {
        controlsRef.current.left = false;
      }
      if (event.code === "KeyD" || event.code === "ArrowRight") {
        controlsRef.current.right = false;
      }
    };

    const getClickableHit = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      return raycaster.intersectObjects(clickableMeshes, false)[0];
    };

    const onCanvasPointerDown = (event: PointerEvent) => {
      pointerDown.x = event.clientX;
      pointerDown.y = event.clientY;
      pointerMoved = false;
    };

    const onCanvasPointerMove = (event: PointerEvent) => {
      if (
        Math.abs(event.clientX - pointerDown.x) > 8 ||
        Math.abs(event.clientY - pointerDown.y) > 8
      ) {
        pointerMoved = true;
      }

      const hit = getClickableHit(event);
      renderer.domElement.style.cursor = hit ? "pointer" : isMobile ? "default" : "grab";
    };

    const onCanvasPointerUp = (event: PointerEvent) => {
      if (pointerMoved) {
        return;
      }

      const hit = getClickableHit(event);
      const url = hit?.object.userData.url as string | undefined;

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.fov = width < 900 ? 72 : 58;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
      renderer.setSize(width, height);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", resize);
    renderer.domElement.addEventListener("pointerdown", onCanvasPointerDown);
    renderer.domElement.addEventListener("pointermove", onCanvasPointerMove);
    renderer.domElement.addEventListener("pointerup", onCanvasPointerUp);
    renderer.domElement.style.cursor = isMobile ? "default" : "grab";

    resize();

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.032);
      const elapsed = clock.getElapsedTime();
      const controls = controlsRef.current;
      const joystickX =
        Math.abs(joystickInputRef.current.x) > 0.08 ? joystickInputRef.current.x : 0;
      const joystickY =
        Math.abs(joystickInputRef.current.y) > 0.08 ? joystickInputRef.current.y : 0;
      const turnInput =
        (controls.left ? 1 : 0) - (controls.right ? 1 : 0) - joystickX;
      const inputZ =
        (controls.forward ? 1 : 0) -
        (controls.backward ? 1 : 0) -
        joystickY;

      if (turnInput !== 0) {
        character.rotation.y += delta * 2.2 * turnInput;
      }

      const speed = isMobile ? 2.25 : 2.75;
      const facing = character.rotation.y;
      const forwardX = -Math.sin(facing);
      const forwardZ = -Math.cos(facing);

      velocity.set(forwardX * inputZ * speed, 0, forwardZ * inputZ * speed);

      const nextX = character.position.x + velocity.x * delta;
      const nextZ = character.position.z + velocity.z * delta;

      if (canMoveTo(nextX, character.position.z)) {
        character.position.x = nextX;
      }
      if (canMoveTo(character.position.x, nextZ)) {
        character.position.z = nextZ;
      }

      const walking = inputZ !== 0;
      const swing = walking ? Math.sin(elapsed * 11) * 0.55 : 0;
      const bounce = walking ? Math.abs(Math.sin(elapsed * 11)) * 0.06 : 0;
      const seatedBreath = Math.sin(elapsed * 1.4) * 0.018;
      const typing = Math.sin(elapsed * 2.8) * 0.05;

      body.position.y = 1.18 + bounce;
      head.position.y = 2.02 + bounce * 0.4;
      leftArm.rotation.x = -swing;
      rightArm.rotation.x = swing;
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftFoot.position.y = 0.05 + bounce * 0.25;
      rightFoot.position.y = 0.05 + bounce * 0.25;

      seatedTorso.position.y = 1.12 + seatedBreath;
      seatedTorso.rotation.x = -0.16 + seatedBreath * 0.6;
      seatedHead.position.y = 1.88 + seatedBreath * 1.2;
      seatedHead.rotation.y = Math.sin(elapsed * 0.45) * 0.18;
      seatedHair.position.y = 1.98 + seatedBreath * 1.2;
      seatedUpperArmLeft.rotation.x = -1.08 + typing * 0.35;
      seatedUpperArmRight.rotation.x = -1.08 - typing * 0.35;
      seatedForearmLeft.rotation.x = -0.64 - typing * 0.55;
      seatedForearmRight.rotation.x = -0.64 + typing * 0.55;
      seatedForearmLeft.position.y = 1.04 + typing * 0.03;
      seatedForearmRight.position.y = 1.04 - typing * 0.03;
      seatedThighLeft.rotation.x = Math.PI / 2 - 0.12 + seatedBreath * 0.2;
      seatedThighRight.rotation.x = Math.PI / 2 - 0.12 + seatedBreath * 0.2;
      seatedCalfLeft.rotation.x = 0.06 - seatedBreath * 0.5;
      seatedCalfRight.rotation.x = 0.06 - seatedBreath * 0.5;
      seatedFootLeft.rotation.x = typing * 0.08;
      seatedFootRight.rotation.x = -typing * 0.08;

      cameraTarget.set(
        character.position.x + Math.sin(facing) * 3.4,
        isMobile ? 2.4 : 2.7,
        character.position.z + Math.cos(facing) * 3.4,
      );
      cameraTarget.x = clamp(
        cameraTarget.x,
        -roomWidth / 2 + 0.8,
        roomWidth / 2 - 0.8,
      );
      cameraTarget.z = clamp(
        cameraTarget.z,
        -roomDepth / 2 + 0.8,
        roomDepth / 2 - 0.8,
      );
      camera.position.lerp(cameraTarget, 0.08);

      lookTarget.set(character.position.x, 1.25, character.position.z);
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onCanvasPointerDown);
      renderer.domElement.removeEventListener("pointermove", onCanvasPointerMove);
      renderer.domElement.removeEventListener("pointerup", onCanvasPointerUp);

      renderer.setAnimationLoop(null);

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;

        if ("geometry" in mesh && mesh.geometry) {
          mesh.geometry.dispose();
        }

        if ("material" in mesh && mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });

      logoTexture.dispose();
      rugTexture?.dispose();
      socialTextures.forEach((texture) => texture.dispose());
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const updateJoystick = (clientX: number, clientY: number) => {
    const joystick = joystickRef.current;

    if (!joystick) {
      return;
    }

    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const limit = rect.width * 0.28;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > limit) {
      dx = (dx / distance) * limit;
      dy = (dy / distance) * limit;
    }

    joystickInputRef.current.x = dx / limit;
    joystickInputRef.current.y = dy / limit;

    setJoystickState({
      active: true,
      x: dx,
      y: dy,
    });
  };

  const resetJoystick = () => {
    joystickPointerIdRef.current = null;
    joystickInputRef.current.x = 0;
    joystickInputRef.current.y = 0;
    setJoystickState({
      active: false,
      x: 0,
      y: 0,
    });
  };

  const handleJoystickPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    joystickPointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateJoystick(event.clientX, event.clientY);
  };

  const handleJoystickPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (joystickPointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateJoystick(event.clientX, event.clientY);
  };

  const handleJoystickPointerEnd = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (joystickPointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetJoystick();
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/70 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-black/55 backdrop-blur sm:left-6 sm:top-6 sm:text-[11px]">
        Okan Acer
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 hidden rounded-full bg-white/70 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-black/55 backdrop-blur md:block">
        WASD
      </div>

      <div className="absolute bottom-4 left-4 md:hidden">
        <div
          ref={joystickRef}
          className="relative flex h-32 w-32 select-none items-center justify-center rounded-full border border-white/50 bg-white/28 shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur-xl touch-none"
          onPointerDown={handleJoystickPointerDown}
          onPointerMove={handleJoystickPointerMove}
          onPointerUp={handleJoystickPointerEnd}
          onPointerCancel={handleJoystickPointerEnd}
        >
          <div className="absolute h-20 w-20 rounded-full border border-white/35" />
          <div className="absolute h-2 w-2 rounded-full bg-black/30" />
          <div
            className={`absolute flex h-12 w-12 items-center justify-center rounded-full border border-white/65 bg-white/88 text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55 shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-transform ${
              joystickState.active ? "duration-75" : "duration-200"
            }`}
            style={{
              transform: `translate(${joystickState.x}px, ${joystickState.y}px)`,
            }}
          >
            Go
          </div>
        </div>
      </div>
    </div>
  );
}
