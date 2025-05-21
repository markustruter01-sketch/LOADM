import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Simple Controls class to handle camera rotation and zoom
class SimpleOrbitControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private isMouseDown = false;
  private mousePosition = { x: 0, y: 0 };
  private distance = 15;
  private rotationSpeed = 0.01;
  private zoomSpeed = 0.1;
  private dampingFactor = 0.05;
  private minDistance = 5;
  private maxDistance = 50;
  private phi = 0; // vertical rotation
  private theta = 0; // horizontal rotation
  private target = new THREE.Vector3(0, 0, 0);
  private enabled = true;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Mouse controls
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    
    // Wheel for zoom
    this.domElement.addEventListener('wheel', this.onMouseWheel);
  }

  private onMouseDown = (event: MouseEvent) => {
    if (!this.enabled) return;
    this.isMouseDown = true;
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.enabled || !this.isMouseDown) return;

    const deltaX = event.clientX - this.mousePosition.x;
    const deltaY = event.clientY - this.mousePosition.y;

    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;

    this.theta -= deltaX * this.rotationSpeed;
    this.phi -= deltaY * this.rotationSpeed;

    // Limit vertical rotation
    this.phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.phi));

    this.updateCamera();
  };

  private onMouseUp = () => {
    this.isMouseDown = false;
  };

  private onMouseWheel = (event: WheelEvent) => {
    if (!this.enabled) return;
    event.preventDefault();

    this.distance += event.deltaY * this.zoomSpeed * 0.01;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    
    this.updateCamera();
  };

  private updateCamera() {
    const x = this.distance * Math.sin(this.theta) * Math.cos(this.phi);
    const y = this.distance * Math.sin(this.phi);
    const z = this.distance * Math.cos(this.theta) * Math.cos(this.phi);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  public update() {
    // Apply damping if needed in future versions
  }

  public dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onMouseWheel);
  }
}

interface ThreeDCargoModelProps {
  palletPositions: { 
    id: string;
    x: number;
    y: number;
    z: number;
    weight: number;
    cargo: string;
  }[];
  aircraftType: string;
}

const ThreeDCargoModel: React.FC<ThreeDCargoModelProps> = ({ palletPositions, aircraftType }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<SimpleOrbitControls | null>(null);
  const palletMeshesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Setup the scene once component mounts
  useEffect(() => {
    if (!mountRef.current) return;
    
    setIsLoading(true);

    try {
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

      // Add custom orbit controls
      const controls = new SimpleOrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // Helper function to convert aircraft ID to the format used in our component
      const convertedType = aircraftType === 'c17' ? 'C-17' :
                           aircraftType === 'c130' ? 'C-130' :
                           aircraftType === 'c27j' ? 'C-27J' :
                           aircraftType === 'kc30a' ? 'KC30A' : 'C-17';
      
      // Create aircraft body based on type
      createAircraftModel(convertedType, scene);

      // Add coordinate grid
      const gridHelper = new THREE.GridHelper(30, 30);
      scene.add(gridHelper);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        if (controlsRef.current) controlsRef.current.update();
        if (rendererRef.current && cameraRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
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
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error setting up 3D scene:", error);
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
    };
  }, [aircraftType]);

  // Update pallets whenever palletPositions change
  useEffect(() => {
    if (!sceneRef.current) return;

    try {
      // Clear existing pallets
      Object.values(palletMeshesRef.current).forEach(mesh => {
        if (sceneRef.current) {
          sceneRef.current.remove(mesh);
        }
      });
      palletMeshesRef.current = {};

      // Helper function to convert aircraft ID to the format used in our component
      const convertedType = aircraftType === 'c17' ? 'C-17' :
                           aircraftType === 'c130' ? 'C-130' :
                           aircraftType === 'c27j' ? 'C-27J' :
                           aircraftType === 'kc30a' ? 'KC30A' : 'C-17';

      // Add new pallets
      palletPositions.forEach(pallet => {
        // Adjust position based on aircraft type to match 2D grid
        const adjustedPosition = adjustPalletPosition(pallet, convertedType);
        
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
        if (sceneRef.current) {
          sceneRef.current.add(mesh);
          palletMeshesRef.current[pallet.id] = mesh;
          
          // Add weight text above pallet
          addPalletLabel(
            pallet.id,
            `${pallet.weight} ${aircraftType === 'kc30a' ? 'kg' : 'lbs'}`,
            adjustedPosition,
            sceneRef.current
          );
        }
      });
    } catch (error) {
      console.error("Error updating pallets:", error);
    }
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