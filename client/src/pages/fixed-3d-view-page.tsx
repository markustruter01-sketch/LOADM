import React, { useEffect, useRef } from 'react';
import { useLocation, useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { ArrowLeft, Cube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as THREE from 'three';

const Fixed3DViewPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const [match, params] = useRoute("/cargo-3d-view/:aircraftId");
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  
  const aircraftId = match ? params.aircraftId : 'c17';
  
  // Aircraft display names
  const aircraftNames: Record<string, string> = {
    'c17': 'C-17 Globemaster',
    'c130': 'C-130 Hercules',
    'c27j': 'C-27J Spartan',
    'kc30a': 'KC30-A Airbus'
  };
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a simple scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 15);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    // Create a simple aircraft model based on type
    const aircraft = createSimpleAircraftModel();
    scene.add(aircraft);
    
    // Add grid for reference
    const gridHelper = new THREE.GridHelper(30, 30);
    scene.add(gridHelper);
    
    // Add a few sample cargo pallets
    for (let i = 0; i < 5; i++) {
      const pallet = createSamplePallet(Math.random() > 0.7);
      pallet.position.set((i - 2) * 2, 0.2, (Math.random() - 0.5) * 4);
      scene.add(pallet);
    }
    
    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Rotate camera around center
      const time = Date.now() * 0.0003;
      camera.position.x = Math.sin(time) * 15;
      camera.position.z = Math.cos(time) * 15;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
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
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);
  
  // Create a simple aircraft model
  const createSimpleAircraftModel = () => {
    // Get dimensions based on aircraft type
    let length, width, height;
    
    switch (aircraftId) {
      case 'c17':
        length = 25;
        width = 6;
        height = 4;
        break;
      case 'c130':
        length = 15;
        width = 4;
        height = 3;
        break;
      case 'c27j':
        length = 10;
        width = 3;
        height = 2.5;
        break;
      case 'kc30a':
        length = 28;
        width = 6;
        height = 6;
        break;
      default:
        length = 25;
        width = 6;
        height = 4;
    }
    
    const aircraft = new THREE.Group();
    
    // Create fuselage (body)
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
    
    // Create cargo floor
    const floorGeometry = new THREE.BoxGeometry(length - 2, 0.1, width - 0.5);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -height / 2 + 0.15;
    aircraft.add(floor);
    
    return aircraft;
  };
  
  // Create a simple pallet
  const createSamplePallet = (isDangerous = false) => {
    const palletGeometry = new THREE.BoxGeometry(1, 0.3, 1);
    
    // Color based on type
    const palletColor = isDangerous ? 0xcc3333 : 0x3366cc;
    const palletMaterial = new THREE.MeshPhongMaterial({ color: palletColor });
    
    return new THREE.Mesh(palletGeometry, palletMaterial);
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
              <Cube className="h-5 w-5 mr-2 text-primary" />
              {aircraftNames[aircraftId] || 'Aircraft'} 3D Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[600px]">
              <div ref={containerRef} className="w-full h-full" />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
                <p>Interactive 3D View - Camera rotates automatically</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">About This Visualization</h3>
              <p className="text-sm mb-2">
                This 3D model shows a sample cargo configuration for the {aircraftNames[aircraftId]}.
                The blue boxes represent standard cargo, while red boxes indicate dangerous goods.
              </p>
              <p className="text-sm mb-4">
                Weight values are shown in {aircraftId === 'kc30a' ? 'kilograms (kg)' : 'pounds (lbs)'}.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-md">
                  <div className="h-4 w-4 bg-blue-500 rounded-sm mb-1"></div>
                  <p>Standard cargo (boxes, equipment, supplies)</p>
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

export default Fixed3DViewPage;