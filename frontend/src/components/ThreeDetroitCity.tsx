"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeDetroitCity: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 440;
    let height = container.clientHeight || 440;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1128, 0.08);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
    camera.position.set(0, 2.8, 6.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    // --- PROCEDURAL 3D DETROIT MEGACITY SKYSCRAPERS ---
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: 0x111d35,
      metalness: 0.85,
      roughness: 0.25
    });

    const buildingMatGlass = new THREE.MeshStandardMaterial({
      color: 0x0077b6,
      emissive: 0x001233,
      metalness: 0.9,
      roughness: 0.1
    });

    // Generate grid of futuristic towers
    const towerCount = 35;
    for (let i = 0; i < towerCount; i++) {
      const h = 1.2 + Math.random() * 3.8;
      const w = 0.25 + Math.random() * 0.45;
      const d = 0.25 + Math.random() * 0.45;
      const geo = new THREE.BoxGeometry(w, h, d);
      const isGlass = Math.random() > 0.4;
      const mesh = new THREE.Mesh(geo, isGlass ? buildingMatGlass : buildingMatDark);
      
      const angle = (i / towerCount) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 3.2;
      mesh.position.set(
        Math.cos(angle) * radius + (Math.random() - 0.5) * 0.4,
        h / 2,
        Math.sin(angle) * radius + (Math.random() - 0.5) * 0.4
      );
      cityGroup.add(mesh);

      // Add wireframe edge highlight to give tech HUD look
      const wireGeo = new THREE.WireframeGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({
        color: isGlass ? 0x00e5ff : 0x00b4d8,
        transparent: true,
        opacity: 0.35
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.position.copy(mesh.position);
      cityGroup.add(wire);
    }

    // Central Monolithic CyberLife Spire
    const spireGeo = new THREE.CylinderGeometry(0.08, 0.45, 5.5, 6);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      emissive: 0x0077b6,
      emissiveIntensity: 0.6,
      metalness: 0.95,
      roughness: 0.1
    });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.set(0, 2.75, -0.5);
    cityGroup.add(spire);

    // Spire beacon light
    const beaconLight = new THREE.PointLight(0x00e5ff, 4, 8);
    beaconLight.position.set(0, 5.5, -0.5);
    cityGroup.add(beaconLight);

    // Glowing ground grid (Lake Erie / City base)
    const gridHelper = new THREE.GridHelper(12, 24, 0x00e5ff, 0x0077b6);
    gridHelper.position.y = 0;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.4;
    scene.add(gridHelper);

    // Flying Automated Transit Traffic (Curved light trails)
    const trafficSplines = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3, 1.2, 1),
        new THREE.Vector3(-1, 1.5, 0),
        new THREE.Vector3(1, 1.8, -1),
        new THREE.Vector3(3, 2.2, 0)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2, 0.8, -2),
        new THREE.Vector3(0, 1.1, -1),
        new THREE.Vector3(2, 1.3, 1),
        new THREE.Vector3(3, 1.6, 2)
      ])
    ];

    trafficSplines.forEach((spline, idx) => {
      const tubeGeo = new THREE.TubeGeometry(spline, 64, 0.02, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x00e5ff : 0xffb703,
        transparent: true,
        opacity: 0.7
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
    });

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x00b4d8, 2.5);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.0);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Mouse Interaction
    let mouseX = 0;
    let targetX = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      targetX = (clientX / width) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Render loop
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      mouseX += (targetX - mouseX) * 0.04;
      cityGroup.rotation.y = elapsed * 0.08 + mouseX * 0.35;
      beaconLight.intensity = 3 + Math.sin(elapsed * 4) * 1.5;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || 440;
      height = container.clientHeight || 440;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden'
      }}
    />
  );
};
