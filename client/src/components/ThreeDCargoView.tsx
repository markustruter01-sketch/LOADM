import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

interface ThreeDCargoViewProps {
  pallets: {
    id: number;
    position: { x: number; y: number };
    weight: number | null;
    cargoType?: "C" | "DG";
    positionLabel?: string;
  }[];
  aircraftType: string;
}

// Simple mapping for aircraft configurations
const AIRCRAFT_CONFIG = {
  c17: {
    rows: 2,
    cols: 9,
    name: 'C-17 Globemaster',
    length: 25,
    width: 5.5,
    height: 4
  },
  c130: {
    rows: 2,
    cols: 4,
    name: 'C-130 Hercules',
    length: 15,
    width: 4,
    height: 3
  },
  c27j: {
    rows: 1,
    cols: 3,
    name: 'C-27J Spartan',
    length: 10,
    width: 3,
    height: 2.5
  },
  kc30a: {
    rows: 2,
    cols: 13, 
    name: 'KC30-A Airbus',
    length: 28,
    width: 6,
    height: 6
  }
};

const ThreeDCargoView: React.FC<ThreeDCargoViewProps> = ({ pallets, aircraftType }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // References to THREE.js objects
  const scene = useRef<THREE.Scene | null>(null);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const frameId = useRef<number | null>(null);

  // Setup the scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    setIsLoading(true);
    
    // Create scene
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0xf0f0f0);
    scene.current = newScene;

    // Create camera
    const newCamera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    newCamera.position.set(0, 15, 15);
    newCamera.lookAt(0, 0, 0);
    camera.current = newCamera;

    // Create renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(newRenderer.domElement);
    renderer.current = newRenderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    newScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    newScene.add(directionalLight);

    // Add a grid helper
    const gridHelper = new THREE.GridHelper(30, 30);
    newScene.add(gridHelper);

    // Create aircraft model
    createAircraftModel(aircraftType, newScene);
    
    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera.current || !renderer.current) return;
      
      camera.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.current.updateProjectionMatrix();
      renderer.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);
      
      if (camera.current && scene.current && renderer.current) {
        // Slowly rotate the camera around the scene
        camera.current.position.x = 15 * Math.sin(Date.now() * 0.0002);
        camera.current.position.z = 15 * Math.cos(Date.now() * 0.0002);
        camera.current.lookAt(0, 0, 0);
        
        renderer.current.render(scene.current, camera.current);
      }
    };
    
    animate();
    setIsLoading(false);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frameId.current as number);
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.current) {
        mountRef.current.removeChild(renderer.current.domElement);
      }
      
      if (renderer.current) {
        renderer.current.dispose();
      }
    };
  }, [aircraftType]);
  
  // Update pallets when they change
  useEffect(() => {
    if (!scene.current) return;
    
    // Clear existing pallets
    scene.current.children = scene.current.children.filter(
      child => !child.userData.isPallet
    );
    
    // Add pallets to the scene
    pallets.forEach(pallet => {
      if (pallet.weight === null) return;
      
      // Get the aircraft config for positioning
      const config = AIRCRAFT_CONFIG[aircraftType as keyof typeof AIRCRAFT_CONFIG];
      if (!config) return;
      
      // Create a box for the pallet
      const geometry = new THREE.BoxGeometry(1, 0.4, 1);
      
      // Color based on weight (heavier = darker)
      const maxWeight = aircraftType === 'kc30a' ? 6800 : 4536; // kg or lbs
      const weightFactor = Math.min((pallet.weight || 0) / maxWeight, 1);
      
      const color = pallet.cargoType === 'DG' 
        ? new THREE.Color(0.8 - weightFactor * 0.5, 0.2, 0.2) // Red for DG
        : new THREE.Color(0.2, 0.6 - weightFactor * 0.4, 0.8 - weightFactor * 0.6); // Blue for regular
        
      const material = new THREE.MeshPhongMaterial({ color });
      const box = new THREE.Mesh(geometry, material);
      
      // Position based on aircraft and grid
      const xOffset = getXPositionInAircraft(pallet, config);
      const zOffset = getZPositionInAircraft(pallet, config);
      
      box.position.set(xOffset, 0, zOffset);
      box.userData.isPallet = true;
      
      scene.current.add(box);
      
      // Add text for weight
      addTextLabel(
        `${pallet.weight} ${aircraftType === 'kc30a' ? 'kg' : 'lbs'}`, 
        { x: xOffset, y: 0.5, z: zOffset }, 
        scene.current
      );
    });
  }, [pallets, aircraftType]);
  
  // Create aircraft model based on type
  const createAircraftModel = (type: string, scene: THREE.Scene) => {
    const config = AIRCRAFT_CONFIG[type as keyof typeof AIRCRAFT_CONFIG];
    if (!config) return;
    
    const { length, width, height } = config;
    
    // Create the fuselage (main body)
    const bodyGeometry = new THREE.CylinderGeometry(
      width / 2, 
      width / 2, 
      length, 
      32
    );
    bodyGeometry.rotateZ(Math.PI / 2); // Rotate to be horizontal
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    scene.add(body);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(width * 1.8, 0.1, width / 2);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = -height / 4;
    scene.add(wings);
    
    // Create floor for cargo
    const floorGeometry = new THREE.BoxGeometry(length - 2, 0.1, width - 0.5);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -height / 2 + 0.4; // Slightly above center
    scene.add(floor);
    
    // Add cargo grid markings
    addCargoGrid(type, scene);
  };
  
  // Add cargo grid markings
  const addCargoGrid = (type: string, scene: THREE.Scene) => {
    const config = AIRCRAFT_CONFIG[type as keyof typeof AIRCRAFT_CONFIG];
    if (!config) return;
    
    const { rows, cols, length, width } = config;
    
    // Calculate cell dimensions
    const cellWidth = (length - 4) / cols;
    const cellDepth = width * 0.7 / rows;
    
    // Start positions
    const startX = -(length / 2) + 2;
    const startZ = -(width / 2) * 0.6;
    
    // Create grid cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Position
        const x = startX + col * cellWidth + cellWidth / 2;
        const z = startZ + row * cellDepth + cellDepth / 2;
        
        // Create a thin box for the cell
        const cellGeometry = new THREE.BoxGeometry(cellWidth * 0.9, 0.02, cellDepth * 0.9);
        const cellMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x333333,
          transparent: true,
          opacity: 0.2
        });
        
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.set(x, -0.4, z);
        scene.add(cell);
        
        // Add cell label
        let label = '';
        if (type === 'c17') {
          label = `${col+1}${row === 0 ? 'A' : 'B'}`;
        } else if (type === 'c130') {
          label = `${col+1}${row === 0 ? 'A' : 'B'}`;
        } else if (type === 'c27j') {
          label = `${col+1}`;
        } else if (type === 'kc30a') {
          label = `${col+1}${row === 0 ? 'L' : 'R'}`;
        }
        
        addTextLabel(label, { x, y: -0.38, z }, scene);
      }
    }
  };
  
  // Add a text label
  const addTextLabel = (
    text: string, 
    position: { x: number, y: number, z: number },
    scene: THREE.Scene
  ) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 128;
    canvas.height = 64;
    
    // Clear background
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = 'bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Create a black background for better readability
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
    
    // Create a sprite with the text
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(0.8, 0.4, 1);
    
    scene.add(sprite);
  };
  
  // Get X position in 3D space based on aircraft type and pallet position
  const getXPositionInAircraft = (
    pallet: { position: { x: number, y: number }, positionLabel?: string },
    config: { cols: number, length: number }
  ) => {
    const { cols, length } = config;
    
    // Default calculation based on grid position
    if (pallet.positionLabel) {
      // Extract position from label (e.g. "1A", "2B", "3L", "4R")
      const posNum = parseInt(pallet.positionLabel.match(/\d+/)?.[0] || "1") - 1;
      return (posNum / cols) * (length - 4) - (length / 2) + 2 + ((length - 4) / cols / 2);
    }
    
    // Fallback to position.x as normalized value
    return (pallet.position.x / 700) * (length - 4) - (length / 2) + 2;
  };
  
  // Get Z position in 3D space based on aircraft type and pallet position
  const getZPositionInAircraft = (
    pallet: { position: { x: number, y: number }, positionLabel?: string },
    config: { rows: number, width: number }
  ) => {
    const { rows, width } = config;
    
    if (pallet.positionLabel) {
      // Check the last character for row
      const lastChar = pallet.positionLabel.slice(-1);
      
      if (rows === 1) return 0; // Single row (C-27J)
      
      if (lastChar === 'A' || lastChar === 'L') {
        return -width / 5; // First row
      } else if (lastChar === 'B' || lastChar === 'R') {
        return width / 5; // Second row
      }
    }
    
    // Fallback to position.y
    return (pallet.position.y / 150) * (width / 2) - (width / 5);
  };
  
  return (
    <div className="relative h-96 rounded-md overflow-hidden border">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading 3D view...</span>
        </div>
      ) : (
        <>
          <div ref={mountRef} className="w-full h-full" />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
            <p>3D View - Camera rotates automatically</p>
          </div>
        </>
      )}
    </div>
  );
};

export default ThreeDCargoView;