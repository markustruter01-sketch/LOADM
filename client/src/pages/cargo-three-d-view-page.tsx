import React, { useRef, useEffect, useState } from 'react';
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as THREE from 'three';

const CargoThreeDViewPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute("/cargo-3d-view/:aircraftId");
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the current aircraft ID from URL params
  const aircraftId = match ? params.aircraftId : 'c17';
  
  // Aircraft display names
  const aircraftNames: Record<string, string> = {
    'c17': 'C-17 Globemaster',
    'c130': 'C-130 Hercules',
    'c27j': 'C-27J Spartan',
    'kc30a': 'KC30-A Airbus'
  };
  
  // Initialize 3D scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    // Create aircraft model
    const aircraft = createAircraftModel(aircraftId);
    scene.add(aircraft);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(30, 30);
    scene.add(gridHelper);
    
    // Add some sample pallets based on aircraft type
    const pallets = createSamplePallets(aircraftId);
    pallets.forEach(pallet => scene.add(pallet));
    
    // Animation loop with auto-rotation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Rotate camera around center
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 15;
      camera.position.z = Math.cos(time) * 15;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      setIsLoading(false);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [aircraftId]);
  
  // Create aircraft model based on type
  const createAircraftModel = (type: string) => {
    // Aircraft dimensions and grid layout
    let length, width, height, rows, cols;
    
    switch (type) {
      case 'c17':
        length = 25;
        width = 6;
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
      default:
        length = 25;
        width = 6;
        height = 4;
        rows = 2;
        cols = 9;
    }
    
    // Create aircraft group
    const aircraft = new THREE.Group();
    
    // Create fuselage (body)
    const bodyGeometry = new THREE.CylinderGeometry(
      width / 2,
      width / 2,
      length,
      32
    );
    bodyGeometry.rotateZ(Math.PI / 2); // Rotate to horizontal position
    
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    aircraft.add(body);
    
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
    
    // Create tail
    const tailGeometry = new THREE.BoxGeometry(width / 3, height * 1.5, width / 4);
    const tailMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-length / 2 + width / 6, height / 2, 0);
    aircraft.add(tail);
    
    // Create cargo floor
    const floorGeometry = new THREE.BoxGeometry(length - 2, 0.1, width - 0.5);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -height / 2 + 0.15;
    aircraft.add(floor);
    
    // Add cargo position markers
    addCargoPositionMarkers(aircraft, type, rows, cols, length, width, height);
    
    return aircraft;
  };
  
  // Add cargo position markers
  const addCargoPositionMarkers = (
    aircraft: THREE.Group,
    type: string,
    rows: number,
    cols: number,
    length: number,
    width: number,
    height: number
  ) => {
    // Calculate cell dimensions and spacing
    const xSpacing = (length - 4) / cols;
    const zSpacing = (width - 1) / Math.max(1, rows);
    
    // Starting positions
    const startX = -(length / 2) + 2;
    const startZ = -(width / 2) + zSpacing / 2;
    
    // Create markers for each position
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Position in 3D space
        const x = startX + col * xSpacing + xSpacing / 2;
        const z = startZ + row * zSpacing;
        const y = -height / 2 + 0.15; // Just above the floor
        
        // Create marker
        const markerGeometry = new THREE.PlaneGeometry(xSpacing * 0.9, zSpacing * 0.9);
        const markerMaterial = new THREE.MeshBasicMaterial({
          color: 0x333333,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.2
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y + 0.01, z); // Slightly above floor
        marker.rotation.x = -Math.PI / 2; // Lay flat
        aircraft.add(marker);
        
        // Create position label
        let label = '';
        if (type === 'c17') {
          label = `${col+1}${row === 0 ? 'A' : 'B'}`;
        } else if (type === 'c130') {
          label = `${col+1}${row === 0 ? 'A' : 'B'}`;
        } else if (type === 'c27j') {
          label = `P${col+1}`;
        } else if (type === 'kc30a') {
          label = `${col+1}${row === 0 ? 'L' : 'R'}`;
        }
        
        addTextLabel(aircraft, label, { x, y: y + 0.02, z });
      }
    }
  };
  
  // Add text label to scene
  const addTextLabel = (
    parent: THREE.Group,
    text: string,
    position: { x: number, y: number, z: number }
  ) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = 64;
    canvas.height = 32;
    
    // Clear canvas
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(
      canvas.width / 2 - 20,
      canvas.height / 2 - 10,
      40,
      20
    );
    
    // Draw text
    context.font = 'bold 16px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(0.5, 0.25, 1);
    
    parent.add(sprite);
  };
  
  // Create sample pallets
  const createSamplePallets = (type: string) => {
    const pallets: THREE.Mesh[] = [];
    const isKC30A = type === 'kc30a';
    
    // Set up dimensions and layout based on aircraft type
    let length, width, rows, cols;
    
    switch (type) {
      case 'c17':
        length = 25;
        width = 6;
        rows = 2;
        cols = 9;
        break;
      case 'c130':
        length = 15;
        width = 4;
        rows = 2;
        cols = 4;
        break;
      case 'c27j':
        length = 10;
        width = 3;
        rows = 1;
        cols = 3;
        break;
      case 'kc30a':
        length = 28;
        width = 6;
        rows = 2;
        cols = 13;
        break;
      default:
        length = 25;
        width = 6;
        rows = 2;
        cols = 9;
    }
    
    // Calculate spacing
    const xSpacing = (length - 4) / cols;
    const zSpacing = (width - 1) / Math.max(1, rows);
    
    // Starting positions
    const startX = -(length / 2) + 2;
    const startZ = -(width / 2) + zSpacing / 2;
    
    // Create a few sample pallets
    const maxPallets = Math.floor(cols * rows / 2); // Use about half the positions
    
    for (let i = 0; i < maxPallets; i++) {
      // Random position
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      // Calculate 3D position
      const x = startX + col * xSpacing + xSpacing / 2;
      const z = startZ + row * zSpacing;
      const y = -0.2; // Just above the floor
      
      // Create pallet
      const palletGeometry = new THREE.BoxGeometry(0.9, 0.3, 0.9);
      
      // Random pallet properties
      const isDG = Math.random() < 0.3; // 30% chance of dangerous goods
      const weight = Math.random() * (isKC30A ? 6000 : 8000) + 500; // Random weight
      
      // Determine color based on type and weight
      const maxWeight = isKC30A ? 6800 : 10000;
      const weightFactor = Math.min(weight / maxWeight, 1);
      
      const palletColor = isDG
        ? new THREE.Color(0.8, 0.2 - weightFactor * 0.2, 0.2 - weightFactor * 0.2) // Red for dangerous goods
        : new THREE.Color(0.2, 0.5 - weightFactor * 0.3, 0.8 - weightFactor * 0.5); // Blue for regular cargo
      
      const palletMaterial = new THREE.MeshPhongMaterial({ color: palletColor });
      const pallet = new THREE.Mesh(palletGeometry, palletMaterial);
      
      pallet.position.set(x, y, z);
      pallets.push(pallet);
      
      // Add weight label
      const weightLabel = new THREE.Group();
      const weightText = `${Math.round(weight)} ${isKC30A ? 'kg' : 'lbs'}`;
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 128;
        canvas.height = 32;
        
        // Background with transparency
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Text
        context.font = 'bold 16px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(weightText, canvas.width / 2, canvas.height / 2);
        
        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.set(x, y + 0.35, z);
        sprite.scale.set(1, 0.25, 1);
        
        pallets.push(sprite);
      }
    }
    
    return pallets;
  };
  
  return (
    <div className="container mx-auto px-4 py-6 mb-16">
      <Helmet>
        <title>Interactive 3D Cargo Model - {aircraftNames[aircraftId] || 'Aircraft'}</title>
      </Helmet>
      
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/load-planning/${aircraftId}`)}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Load Planning
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Interactive 3D Cargo Model</h1>
        <p className="text-muted-foreground mb-6">
          Visualize {aircraftNames[aircraftId] || 'Aircraft'} cargo layout in 3D space
        </p>
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              {aircraftNames[aircraftId] || 'Aircraft'} 3D Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[600px]">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mr-2"></div>
                  <span>Loading 3D model...</span>
                </div>
              )}
              <div ref={mountRef} className="w-full h-full" />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
                <p>Interactive 3D View - Camera rotates automatically to show all angles</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">About This Visualization</h3>
              <p className="text-sm mb-2">
                This 3D model shows a sample cargo configuration for the {aircraftNames[aircraftId]}.
                The blue boxes represent standard cargo, while red boxes indicate dangerous goods.
                Darker shades indicate heavier items.
              </p>
              <p className="text-sm mb-4">
                Weight values are shown in {aircraftId === 'kc30a' ? 'kilograms (kg)' : 'pounds (lbs)'}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-md">
                  <div className="h-4 w-4 bg-blue-500 rounded-sm mb-1"></div>
                  <p>Standard cargo (lighter weight)</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-md">
                  <div className="h-4 w-4 bg-blue-800 rounded-sm mb-1"></div>
                  <p>Standard cargo (heavier weight)</p>
                </div>
                <div className="bg-red-100 dark:bg-red-950 p-3 rounded-md">
                  <div className="h-4 w-4 bg-red-600 rounded-sm mb-1"></div>
                  <p>Dangerous Goods (DG)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CargoThreeDViewPage;