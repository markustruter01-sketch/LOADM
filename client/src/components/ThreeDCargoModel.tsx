import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ThreeDCargoModelProps {
  palletPositions: { 
    id: string;
    x: number;
    y: number;
    z: number;
    weight: number;
    cargo: string;
  }[];
  aircraftType: 'C-17' | 'C-130' | 'C-27J' | 'KC30A';
}

const ThreeDCargoModel: React.FC<ThreeDCargoModelProps> = ({ palletPositions, aircraftType }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const palletMeshesRef = useRef<{ [key: string]: THREE.Mesh }>({});

  // Setup the scene once component mounts
  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(15, 15, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Create aircraft body based on type
    createAircraftModel(aircraftType, scene);

    // Add coordinate grid
    const gridHelper = new THREE.GridHelper(30, 30);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [aircraftType]);

  // Update pallets whenever palletPositions change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing pallets
    Object.values(palletMeshesRef.current).forEach(mesh => {
      sceneRef.current?.remove(mesh);
    });
    palletMeshesRef.current = {};

    // Add new pallets
    palletPositions.forEach(pallet => {
      // Adjust position based on aircraft type to match 2D grid
      const adjustedPosition = adjustPalletPosition(pallet, aircraftType);
      
      // Create pallet mesh
      const geometry = new THREE.BoxGeometry(1, 0.3, 1);
      
      // Color based on weight (heavier = darker)
      const weightFactor = Math.min(pallet.weight / 10000, 1); // Normalize weight
      const color = new THREE.Color(
        1 - weightFactor * 0.5,
        1 - weightFactor * 0.7,
        1 - weightFactor * 0.9
      );
      
      const material = new THREE.MeshPhongMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position the pallet
      mesh.position.set(
        adjustedPosition.x,
        adjustedPosition.y,
        adjustedPosition.z
      );
      
      // Add pallet to scene
      sceneRef.current.add(mesh);
      palletMeshesRef.current[pallet.id] = mesh;
      
      // Add weight text above pallet
      addPalletLabel(
        pallet.id,
        `${pallet.weight} ${aircraftType === 'KC30A' ? 'kg' : 'lbs'}`,
        adjustedPosition,
        sceneRef.current
      );
    });
  }, [palletPositions, aircraftType]);

  // Create aircraft model based on type
  const createAircraftModel = (
    aircraftType: 'C-17' | 'C-130' | 'C-27J' | 'KC30A',
    scene: THREE.Scene
  ) => {
    // Aircraft dimensions based on type
    let length, width, height;
    
    switch (aircraftType) {
      case 'C-17':
        length = 25;
        width = 6;
        height = 4;
        break;
      case 'C-130':
        length = 15;
        width = 4;
        height = 3;
        break;
      case 'C-27J':
        length = 10;
        width = 3;
        height = 2.5;
        break;
      case 'KC30A':
        length = 28;
        width = 6;
        height = 6;
        break;
    }

    // Create aircraft fuselage (body)
    const bodyGeometry = new THREE.CylinderGeometry(
      width / 2,
      width / 2,
      length,
      32
    );
    bodyGeometry.rotateZ(Math.PI / 2);
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    scene.add(body);

    // Create wings
    const wingGeometry = new THREE.BoxGeometry(width * 2, 0.1, width / 2);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
    });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = -height / 4;
    scene.add(wings);

    // Create tail
    const tailGeometry = new THREE.BoxGeometry(width / 3, height * 1.5, width / 4);
    const tailMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
    });
    
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-length / 2 + width / 6, height / 2, 0);
    scene.add(tail);

    // Add floor to represent cargo area
    const floorGeometry = new THREE.BoxGeometry(length - 2, 0.1, width - 0.5);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -height / 2 + 0.15;
    scene.add(floor);

    // Add cargo bay markers for palette positions
    addCargoPositionMarkers(aircraftType, scene);
  };

  // Adjust pallet position to match 3D space
  const adjustPalletPosition = (
    pallet: { x: number; y: number; z: number; weight: number; cargo: string },
    aircraftType: 'C-17' | 'C-130' | 'C-27J' | 'KC30A'
  ) => {
    // Adjust position based on aircraft type
    let x = 0, y = 0, z = 0;
    
    // Position adjustments depend on the aircraft grid layout
    switch (aircraftType) {
      case 'C-17': // 9x2 grid
        x = pallet.x * 2 - 8;
        z = pallet.z * 2 - 1;
        y = -1.5;
        break;
      case 'C-130': // 4x2 grid
        x = pallet.x * 2 - 3;
        z = pallet.z * 2 - 1;
        y = -1.2;
        break;
      case 'C-27J': // 3x1 grid
        x = pallet.x * 2 - 2;
        z = 0;
        y = -1;
        break;
      case 'KC30A': // 13x2 grid or 8x1 grid
        x = pallet.x * 2 - 12;
        z = pallet.z * 2 - 1;
        y = -2.8;
        break;
    }
    
    return { x, y, z };
  };

  // Add markers for cargo positions in the aircraft
  const addCargoPositionMarkers = (
    aircraftType: 'C-17' | 'C-130' | 'C-27J' | 'KC30A',
    scene: THREE.Scene
  ) => {
    // Define grid positions based on aircraft type
    let positions = [];
    
    switch (aircraftType) {
      case 'C-17': // 9x2 grid
        for (let x = 0; x < 9; x++) {
          for (let z = 0; z < 2; z++) {
            positions.push({ 
              x: x * 2 - 8, 
              z: z * 2 - 1, 
              label: `${x+1}${z === 0 ? 'A' : 'B'}` 
            });
          }
        }
        break;
      case 'C-130': // 4x2 grid
        for (let x = 0; x < 4; x++) {
          for (let z = 0; z < 2; z++) {
            positions.push({ 
              x: x * 2 - 3, 
              z: z * 2 - 1, 
              label: `${x+1}${z === 0 ? 'A' : 'B'}` 
            });
          }
        }
        break;
      case 'C-27J': // 3x1 grid
        for (let x = 0; x < 3; x++) {
          positions.push({ 
            x: x * 2 - 2, 
            z: 0, 
            label: `${x+1}` 
          });
        }
        break;
      case 'KC30A': // 13x2 grid
        for (let x = 0; x < 13; x++) {
          for (let z = 0; z < 2; z++) {
            positions.push({ 
              x: x * 2 - 12, 
              z: z * 2 - 1, 
              label: `${x+1}${z === 0 ? 'L' : 'R'}` 
            });
          }
        }
        break;
    }
    
    // Add markers to the scene
    positions.forEach(pos => {
      const markerGeometry = new THREE.PlaneGeometry(1, 1);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(pos.x, -1.9, pos.z);
      marker.rotation.x = -Math.PI / 2;
      scene.add(marker);
      
      // Add position label
      addPositionLabel(pos.label, { x: pos.x, y: -1.89, z: pos.z }, scene);
    });
  };

  // Add text label for positions
  const addPositionLabel = (
    text: string,
    position: { x: number; y: number; z: number },
    scene: THREE.Scene
  ) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 64;
    canvas.height = 64;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = '48px Arial';
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(0.5, 0.5, 0.5);
    
    scene.add(sprite);
  };

  // Add text label above pallets
  const addPalletLabel = (
    id: string,
    text: string,
    position: { x: number; y: number; z: number },
    scene: THREE.Scene
  ) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 128;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add black background for better readability
    const textWidth = context.measureText(text).width;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(
      canvas.width / 2 - textWidth / 2 - 5,
      canvas.height / 2 - 15,
      textWidth + 10,
      30
    );
    
    context.fillStyle = 'white';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(position.x, position.y + 0.5, position.z);
    sprite.scale.set(1, 0.5, 1);
    
    scene.add(sprite);
  };

  return (
    <div className="relative w-full h-96 border rounded-md overflow-hidden">
      <div 
        ref={mountRef} 
        className="absolute top-0 left-0 w-full h-full"
      />
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
        <p>Mouse: Rotate | Scroll: Zoom | Shift+Mouse: Pan</p>
      </div>
    </div>
  );
};

export default ThreeDCargoModel;