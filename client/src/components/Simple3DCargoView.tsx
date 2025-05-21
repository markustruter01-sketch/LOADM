import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

interface Simple3DCargoViewProps {
  aircraftType: string;
}

const Simple3DCargoView: React.FC<Simple3DCargoViewProps> = ({ aircraftType }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const isLoadingRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    
    // Create aircraft model
    const { model, positions } = createAircraftModel(aircraftType);
    scene.add(model);
    
    // Add some sample cargo pallets
    positions.forEach((position, index) => {
      if (index % 2 === 0) { // Only add pallets to some positions
        const pallet = createPallet(index % 3 === 0);
        pallet.position.set(position.x, position.y + 0.2, position.z);
        scene.add(pallet);
      }
    });
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(30, 30);
    scene.add(gridHelper);
    
    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate camera around the scene
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 15;
      camera.position.z = Math.cos(time) * 15;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      isLoadingRef.current = false;
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [aircraftType]);
  
  // Create aircraft model based on type
  const createAircraftModel = (type: string) => {
    // Get dimensions based on aircraft type
    let length = 20, width = 5, height = 4;
    let rows = 1, cols = 3;
    
    switch (type) {
      case 'c17':
        length = 25;
        width = 5.5;
        height = 4;
        rows = 2;
        cols = 9;
        break;
      case 'c130':
        length = 15;
        width = 4;
        height = 3;
        rows = 2;
        cols = 4;
        break;
      case 'c27j':
        length = 10;
        width = 3;
        height = 2.5;
        rows = 1;
        cols = 3;
        break;
      case 'kc30a':
        length = 28;
        width = 6;
        height = 6;
        rows = 2;
        cols = 13;
        break;
    }
    
    // Create aircraft group
    const aircraft = new THREE.Group();
    
    // Create fuselage
    const fuselageGeometry = new THREE.CylinderGeometry(
      width / 2,
      width / 2,
      length,
      32
    );
    fuselageGeometry.rotateZ(Math.PI / 2);
    
    const fuselageMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    aircraft.add(fuselage);
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(width * 2, 0.1, width / 2);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = -height / 4;
    aircraft.add(wings);
    
    // Create cargo floor
    const floorGeometry = new THREE.BoxGeometry(length - 2, 0.1, width - 0.5);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -height / 2 + 0.1;
    aircraft.add(floor);
    
    // Add cargo position markers
    const positions: { x: number, y: number, z: number }[] = [];
    
    // Calculate cargo positions
    const xSpacing = (length - 4) / cols;
    const zSpacing = width / Math.max(1, rows);
    
    const startX = -(length / 2) + 2;
    const startZ = -(width / 2) + width / (rows * 2);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * xSpacing + xSpacing / 2;
        const z = startZ + row * zSpacing;
        const y = -height / 2 + 0.15; // Just above the floor
        
        // Add position marker
        const markerGeometry = new THREE.PlaneGeometry(0.9, 0.9);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: 0x333333,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.2
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y, z);
        marker.rotation.x = -Math.PI / 2; // Lay flat on the floor
        aircraft.add(marker);
        
        // Store position for potential pallets
        positions.push({ x, y, z });
      }
    }
    
    return { model: aircraft, positions };
  };
  
  // Create a pallet with random weight (indicated by color darkness)
  const createPallet = (isDangerous = false) => {
    const palletGeometry = new THREE.BoxGeometry(0.9, 0.3, 0.9);
    
    // Random weight factor (darker = heavier)
    const weightFactor = Math.random();
    
    // Color based on cargo type (dangerous = red, normal = blue)
    const palletColor = isDangerous
      ? new THREE.Color(0.9, 0.2 + weightFactor * 0.2, 0.2 + weightFactor * 0.2)
      : new THREE.Color(0.2 + weightFactor * 0.2, 0.5 + weightFactor * 0.2, 0.8);
    
    const palletMaterial = new THREE.MeshPhongMaterial({ color: palletColor });
    const pallet = new THREE.Mesh(palletGeometry, palletMaterial);
    
    return pallet;
  };
  
  return (
    <div className="w-full h-96 relative">
      {isLoadingRef.current && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading 3D view...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
        <p>Interactive 3D Cargo Model - Automatic rotation</p>
      </div>
    </div>
  );
};

export default Simple3DCargoView;