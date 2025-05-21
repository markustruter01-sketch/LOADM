import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

interface Pallet {
  id: number;
  position: { x: number; y: number };
  location: "cargo" | "configure";
  weight: number | null;
  size?: { width: number; height: number };
  cargoType?: "C" | "DG";
  positionLabel?: string;
}

interface CargoThreeDViewProps {
  pallets: Pallet[];
  aircraftType: string;
}

const CargoThreeDView: React.FC<CargoThreeDViewProps> = ({ pallets, aircraftType }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // THREE.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get dimensions for the aircraft
  const getAircraftDimensions = () => {
    switch (aircraftType) {
      case 'c17':
        return { length: 25, width: 5.5, height: 4 };
      case 'c130':
        return { length: 15, width: 4, height: 3 };
      case 'c27j':
        return { length: 10, width: 3, height: 2.5 };
      case 'kc30a':
        return { length: 28, width: 6, height: 6 };
      default:
        return { length: 20, width: 5, height: 4 };
    }
  };

  // Initialize 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        70,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 15, 15);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      scene.add(directionalLight);

      // Create aircraft model
      createAircraftModel(scene);

      // Add grid for reference
      const gridHelper = new THREE.GridHelper(30, 30);
      scene.add(gridHelper);

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current || !camera || !renderer) return;
        
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };
      
      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        
        if (camera && scene && renderer) {
          // Auto-rotate camera
          const time = Date.now() * 0.0002;
          camera.position.x = 15 * Math.sin(time);
          camera.position.z = 15 * Math.cos(time);
          camera.lookAt(0, 0, 0);
          
          renderer.render(scene, camera);
        }
      };
      
      animate();
      setIsLoading(false);

      // Cleanup
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        window.removeEventListener('resize', handleResize);
        
        if (containerRef.current && rendererRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
      };
    } catch (error) {
      console.error('Error setting up 3D scene:', error);
      setIsLoading(false);
    }
  }, [aircraftType]);

  // Update pallets when they change
  useEffect(() => {
    if (!sceneRef.current) return;

    try {
      // Remove existing pallets
      const existingPallets = sceneRef.current.children.filter(
        child => child.userData?.isPallet
      );
      
      existingPallets.forEach(pallet => {
        sceneRef.current?.remove(pallet);
      });

      // Add pallets to scene
      pallets.forEach((pallet) => {
        if (pallet.weight === null) return;
        
        // Create pallet mesh
        const geometry = new THREE.BoxGeometry(1, 0.3, 1);
        
        // Color based on cargo type and weight
        const maxWeight = aircraftType === 'kc30a' ? 6800 : 10000;
        const weightFactor = Math.min((pallet.weight || 0) / maxWeight, 1);
        
        let color;
        if (pallet.cargoType === 'DG') {
          // Dangerous goods - red with darkness based on weight
          color = new THREE.Color(
            0.8, 
            0.2 - weightFactor * 0.2,
            0.2 - weightFactor * 0.2
          );
        } else {
          // Normal cargo - blue with darkness based on weight
          color = new THREE.Color(
            0.2 - weightFactor * 0.2,
            0.5 - weightFactor * 0.3,
            0.8 - weightFactor * 0.6
          );
        }
        
        const material = new THREE.MeshPhongMaterial({ color });
        const palletMesh = new THREE.Mesh(geometry, material);
        
        // Position based on pallet data
        const position = convertToThreeDPosition(pallet);
        palletMesh.position.set(position.x, position.y, position.z);
        
        // Mark as pallet for future reference
        palletMesh.userData = { isPallet: true };
        
        // Add to scene
        sceneRef.current?.add(palletMesh);
        
        // Add weight label
        addWeightLabel(
          pallet.weight.toString() + (aircraftType === 'kc30a' ? ' kg' : ' lbs'),
          { x: position.x, y: position.y + 0.5, z: position.z },
          sceneRef.current
        );
      });
    } catch (error) {
      console.error('Error updating pallets:', error);
    }
  }, [pallets, aircraftType]);

  // Create aircraft model
  const createAircraftModel = (scene: THREE.Scene) => {
    const { length, width, height } = getAircraftDimensions();
    
    // Create fuselage (main body)
    const bodyGeometry = new THREE.CylinderGeometry(
      width / 2,
      width / 2,
      length,
      32
    );
    
    // Rotate to horizontal position
    bodyGeometry.rotateZ(Math.PI / 2);
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    scene.add(body);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(width * 2, 0.1, width / 2);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = -height / 4;
    scene.add(wings);
    
    // Create floor
    const floorGeometry = new THREE.BoxGeometry(length - 2, 0.1, width - 0.5);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -height / 2 + 0.4;
    scene.add(floor);
    
    // Add cargo positions
    addCargoPositions(scene);
  };

  // Add markers for cargo positions
  const addCargoPositions = (scene: THREE.Scene) => {
    // Get grid config based on aircraft type
    let rows = 1;
    let cols = 3;
    
    switch (aircraftType) {
      case 'c17':
        rows = 2;
        cols = 9;
        break;
      case 'c130':
        rows = 2;
        cols = 4;
        break;
      case 'c27j':
        rows = 1;
        cols = 3;
        break;
      case 'kc30a':
        rows = 2;
        cols = 13;
        break;
    }
    
    const { length, width } = getAircraftDimensions();
    
    // Calculate spacing
    const xSpacing = (length - 4) / cols;
    const zSpacing = (width - 1) / Math.max(1, rows);
    
    // Start positions 
    const startX = -(length / 2) + 2;
    const startZ = -((width - 1) / 2);
    
    // Create position markers
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Position on the grid
        const x = startX + col * xSpacing + xSpacing / 2;
        const z = startZ + row * zSpacing + zSpacing / 2;
        
        // Create marker
        const markerGeometry = new THREE.PlaneGeometry(xSpacing * 0.9, zSpacing * 0.9);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: 0x444444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.2
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, -0.35, z);
        marker.rotation.x = -Math.PI / 2; // Lay flat
        scene.add(marker);
        
        // Add position label
        let label;
        if (aircraftType === 'c17') {
          label = `${col+1}${row === 0 ? 'A' : 'B'}`;
        } else if (aircraftType === 'c130') {
          label = `${col+1}${row === 0 ? 'A' : 'B'}`;
        } else if (aircraftType === 'c27j') {
          label = `P${col+1}`;
        } else {
          label = `${col+1}${row === 0 ? 'L' : 'R'}`;
        }
        
        addPositionLabel(label, { x, y: -0.33, z }, scene);
      }
    }
  };

  // Convert 2D pallet position to 3D position
  const convertToThreeDPosition = (pallet: Pallet) => {
    const { length, width } = getAircraftDimensions();
    let x = 0, y = 0, z = 0;
    
    if (pallet.positionLabel) {
      // Extract grid position from label
      let row = 0;
      let col = 0;
      
      if (aircraftType === 'c17') {
        // C-17 pallets are labeled 1A, 2A, etc. for the first row, 1B, 2B, etc. for the second
        const match = pallet.positionLabel.match(/(\d+)([AB])/);
        if (match) {
          col = parseInt(match[1]) - 1;
          row = match[2] === 'B' ? 1 : 0;
        }
      } else if (aircraftType === 'c130') {
        // C-130 pallets are labeled P1, P2, etc. for the first row, P5, P6, etc. for the second
        const num = parseInt(pallet.positionLabel.replace('P', ''));
        if (num > 4) {
          col = (num - 5) % 4;
          row = 1;
        } else {
          col = (num - 1) % 4;
          row = 0;
        }
      } else if (aircraftType === 'c27j') {
        // C-27J pallets are labeled P1, P2, P3
        const num = parseInt(pallet.positionLabel.replace('P', ''));
        col = num - 1;
        row = 0;
      } else if (aircraftType === 'kc30a') {
        // KC30A positions depend on cargo type (pallets vs LD3s)
        if (pallet.positionLabel.startsWith('P')) {
          // Pallet positions P1-P8
          const num = parseInt(pallet.positionLabel.replace('P', ''));
          col = num - 1;
          row = 0;
        } else {
          // LD3 positions like 1L, 2L, 1R, 2R, etc.
          const match = pallet.positionLabel.match(/(\d+)([LR])/);
          if (match) {
            col = parseInt(match[1]) - 1;
            row = match[2] === 'R' ? 1 : 0;
          }
        }
      }
      
      // Calculate 3D position based on grid coords
      const rows = aircraftType === 'c27j' ? 1 : 2;
      const cols = aircraftType === 'c17' ? 9 : 
                  aircraftType === 'c130' ? 4 : 
                  aircraftType === 'kc30a' ? 13 : 3;
      
      const xSpacing = (length - 4) / cols;
      const zSpacing = (width - 1) / Math.max(1, rows);
      
      const startX = -(length / 2) + 2;
      const startZ = -((width - 1) / 2);
      
      x = startX + col * xSpacing + xSpacing / 2;
      z = startZ + row * zSpacing + zSpacing / 2;
      y = -0.2; // Slightly above the floor
    } else {
      // If no position label, use normalized x/y position
      const normX = pallet.position.x / 700; // Normalize based on original workspace width
      const normY = pallet.position.y / 200; // Normalize based on original workspace height
      
      x = (normX - 0.5) * (length - 4);
      z = (normY - 0.5) * (width - 1);
      y = -0.2;
    }
    
    return { x, y, z };
  };

  // Create position label in 3D space
  const addPositionLabel = (
    text: string,
    position: { x: number, y: number, z: number },
    scene: THREE.Scene
  ) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 64;
    canvas.height = 32;
    
    // Background
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text
    context.font = 'bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Create a dark background for better visibility
    const textWidth = context.measureText(text).width;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(
      canvas.width / 2 - textWidth / 2 - 4,
      canvas.height / 2 - 12,
      textWidth + 8,
      24
    );
    
    context.fillStyle = 'white';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create a sprite for this label
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(0.5, 0.25, 1);
    
    scene.add(sprite);
  };

  // Add weight label above pallet
  const addWeightLabel = (
    text: string,
    position: { x: number, y: number, z: number },
    scene: THREE.Scene
  ) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 128;
    canvas.height = 32;
    
    // Background
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text
    context.font = 'bold 18px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Create a dark background for better visibility
    const textWidth = context.measureText(text).width;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(
      canvas.width / 2 - textWidth / 2 - 4,
      canvas.height / 2 - 10,
      textWidth + 8,
      20
    );
    
    context.fillStyle = 'white';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create a sprite for this label
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(1, 0.25, 1);
    
    scene.add(sprite);
  };

  return (
    <div className="relative w-full h-96 border rounded-md overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading 3D view...</span>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="w-full h-full" />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
            <p>3D View - Rotation is automatic</p>
          </div>
        </>
      )}
    </div>
  );
};

export default CargoThreeDView;