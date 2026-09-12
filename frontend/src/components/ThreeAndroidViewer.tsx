"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeAndroidViewerProps {
  characterId: string;
  ledColor?: string;
}

export const ThreeAndroidViewer: React.FC<ThreeAndroidViewerProps> = ({
  characterId,
  ledColor = '#00e5ff'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 560;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 4.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Root Group
    const androidGroup = new THREE.Group();
    scene.add(androidGroup);

    // Color theme based on character
    let primaryColor = 0x00b4d8;
    let coreColor = 0x00e5ff;
    let wireColor = 0x0077b6;
    if (characterId === 'connor') {
      primaryColor = 0x0096c7;
      coreColor = 0x48cae4;
      wireColor = 0x03045e;
    } else if (characterId === 'markus') {
      primaryColor = 0xfb8500;
      coreColor = 0xffb703;
      wireColor = 0xd90429;
    } else if (characterId === 'kara') {
      primaryColor = 0x00b4d8;
      coreColor = 0x90e0ef;
      wireColor = 0x0077b6;
    }

    // --- 1. SKELETAL CERAMIC & GLASS CARAPACE ---
    // Torso Base
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.4, 1.4, 32, 16);
    const torsoMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.15,
      roughness: 0.1,
      transmission: 0.55,
      thickness: 0.8,
      transparent: true,
      opacity: 0.85,
      ior: 1.45,
      reflectivity: 0.9
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = -0.4;
    androidGroup.add(torso);

    // Wireframe Overlay (Image 1 Anatomy Wireframe)
    const torsoWireGeo = new THREE.WireframeGeometry(torsoGeo);
    const torsoWireMat = new THREE.LineBasicMaterial({
      color: wireColor,
      transparent: true,
      opacity: 0.35,
      linewidth: 1
    });
    const torsoWire = new THREE.LineSegments(torsoWireGeo, torsoWireMat);
    torsoWire.position.y = -0.4;
    androidGroup.add(torsoWire);

    // Shoulders
    const shoulderLGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const shoulderRGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.8,
      roughness: 0.2
    });
    const shoulderL = new THREE.Mesh(shoulderLGeo, shoulderMat);
    shoulderL.position.set(-0.75, 0.2, 0);
    const shoulderR = new THREE.Mesh(shoulderRGeo, shoulderMat);
    shoulderR.position.set(0.75, 0.2, 0);
    androidGroup.add(shoulderL, shoulderR);

    // Collar / Neck
    const neckGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.45, 24);
    const neckMat = new THREE.MeshStandardMaterial({
      color: 0xd9e2ec,
      metalness: 0.6,
      roughness: 0.3
    });
    const neck = new THREE.Mesh(neckGeo, neckMat);
    neck.position.y = 0.45;
    androidGroup.add(neck);

    // Head Group (for independent rotation toward mouse)
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.05;
    androidGroup.add(headGroup);

    // Stylized Android Head (Cybernetic Cranium)
    const headGeo = new THREE.SphereGeometry(0.52, 32, 32);
    headGeo.scale(0.85, 1.15, 1.0);
    const headMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.4,
      thickness: 0.6,
      transparent: true,
      opacity: 0.9,
      ior: 1.45
    });
    const head = new THREE.Mesh(headGeo, headMat);
    headGroup.add(head);

    // Head Wireframe Cage
    const headWireGeo = new THREE.WireframeGeometry(headGeo);
    const headWire = new THREE.LineSegments(
      headWireGeo,
      new THREE.LineBasicMaterial({ color: wireColor, transparent: true, opacity: 0.3 })
    );
    headGroup.add(headWire);

    // Detroit Temple LED Ring on Head Right Temple (Image 2)
    const templeRingGeo = new THREE.TorusGeometry(0.09, 0.02, 16, 32);
    const templeRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ledColor),
      wireframe: false
    });
    const templeRing = new THREE.Mesh(templeRingGeo, templeRingMat);
    templeRing.position.set(0.46, 0.15, 0.22);
    templeRing.rotation.y = Math.PI / 2.5;
    headGroup.add(templeRing);

    // Temple Ring Glow Light
    const templeLight = new THREE.PointLight(new THREE.Color(ledColor), 2.5, 2);
    templeLight.position.set(0.55, 0.15, 0.25);
    headGroup.add(templeLight);

    // --- 2. THIRIUM 310 INTERNAL QUANTUM CORE & TUBES ---
    const coreGeo = new THREE.OctahedronGeometry(0.18, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: coreColor,
      emissive: coreColor,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9
    });
    const thiriumCore = new THREE.Mesh(coreGeo, coreMat);
    thiriumCore.position.set(0, -0.2, 0.12);
    androidGroup.add(thiriumCore);

    // Core pulsing point light
    const coreLight = new THREE.PointLight(coreColor, 3, 3);
    coreLight.position.set(0, -0.2, 0.2);
    androidGroup.add(coreLight);

    // Thirium Flow Tubes (3D Spline Curves)
    const tubeCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.2, 0.12),
        new THREE.Vector3(-0.25, 0.1, 0.1),
        new THREE.Vector3(-0.15, 0.45, 0.05),
        new THREE.Vector3(0.2, 0.7, 0.1)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.2, 0.12),
        new THREE.Vector3(0.25, 0.1, 0.1),
        new THREE.Vector3(0.15, 0.45, 0.05),
        new THREE.Vector3(-0.2, 0.7, 0.1)
      ])
    ];

    const tubeMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      emissive: primaryColor,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });

    tubeCurves.forEach(curve => {
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.022, 12, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      androidGroup.add(tubeMesh);
    });

    // --- 3. AMBIENT DATA PARTICLES & HOLOGRAPHIC RETICLES ---
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 3.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 3.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: coreColor,
      size: 0.025,
      transparent: true,
      opacity: 0.6
    });
    const particleCloud = new THREE.Points(particleGeo, particleMat);
    scene.add(particleCloud);

    // 3D HUD Reticle Rings
    const hudRing1Geo = new THREE.RingGeometry(1.6, 1.62, 64);
    const hudRing1Mat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const hudRing1 = new THREE.Mesh(hudRing1Geo, hudRing1Mat);
    hudRing1.position.z = -0.3;
    scene.add(hudRing1);

    const hudRing2Geo = new THREE.RingGeometry(2.1, 2.11, 48);
    const hudRing2Mat = new THREE.MeshBasicMaterial({
      color: 0x00b4d8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15
    });
    const hudRing2 = new THREE.Mesh(hudRing2Geo, hudRing2Mat);
    hudRing2.position.z = -0.6;
    scene.add(hudRing2);

    // --- 4. LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(coreColor, 3.5);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // --- MOUSE TRACKING ---
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseRef.current.targetX = (clientX / width) * 2 - 1;
      mouseRef.current.targetY = -(clientY / height) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- ANIMATION LOOP ---
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Android breathing & gaze
      headGroup.rotation.y = mouseRef.current.x * 0.45;
      headGroup.rotation.x = -mouseRef.current.y * 0.3;
      androidGroup.rotation.y = mouseRef.current.x * 0.2;
      androidGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.03;

      // Core spinning & pulsing
      thiriumCore.rotation.x = elapsedTime * 0.8;
      thiriumCore.rotation.y = elapsedTime * 1.1;
      const pulseScale = 1 + Math.sin(elapsedTime * 3) * 0.12;
      thiriumCore.scale.set(pulseScale, pulseScale, pulseScale);
      coreLight.intensity = 2.2 + Math.sin(elapsedTime * 3) * 1.0;

      // Temple ring spinning
      templeRing.rotation.z = elapsedTime * 2;

      // HUD reticles slow counter-rotation
      hudRing1.rotation.z = elapsedTime * 0.1;
      hudRing2.rotation.z = -elapsedTime * 0.07;

      // Subtle particle float
      particleCloud.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 500;
      height = container.clientHeight || 560;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [characterId, ledColor]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '520px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}
    />
  );
};
