import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import './LandingPage.css';

export function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    frameId: number;
  } | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [bookHovered, setBookHovered] = useState(false);
  
  // Create closed leather journal
  const createClosedJournal = () => {
    const bookGroup = new THREE.Group();
    
    // Journal dimensions - BASE SIZE (open journal will be 2x width)
    const width = 2.4;
    const height = 3.2;
    const thickness = 0.35;
    
    // Pastel colors - pink/blue theme
    const coverColor = 0xf8c8dc; // Pastel pink
    const spineColor = 0xb0e0e6; // Pastel blue
    const strapColor = 0xe6e6fa; // Lavender
    const buttonColor = 0xd4af37; // Gold accent
    
    const coverMat = new THREE.MeshStandardMaterial({
      color: coverColor,
      roughness: 0.4,
      metalness: 0.05
    });
    
    // Main book body
    const bookGeo = new THREE.BoxGeometry(width, height, thickness);
    const book = new THREE.Mesh(bookGeo, coverMat);
    book.castShadow = true;
    bookGroup.add(book);
    
    // Spine (left edge, pastel blue)
    const spineMat = new THREE.MeshStandardMaterial({
      color: spineColor,
      roughness: 0.4,
      metalness: 0.05
    });
    const spineGeo = new THREE.BoxGeometry(0.08, height, thickness + 0.02);
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(-width / 2 - 0.03, 0, 0);
    bookGroup.add(spine);
    
    // Pages visible at edges (cream color)
    const pagesMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e8,
      roughness: 0.95
    });
    
    // Right edge pages
    const rightPagesGeo = new THREE.BoxGeometry(0.02, height - 0.1, thickness - 0.08);
    const rightPages = new THREE.Mesh(rightPagesGeo, pagesMat);
    rightPages.position.set(width / 2 - 0.01, 0, 0);
    bookGroup.add(rightPages);
    
    // Bottom edge pages
    const bottomPagesGeo = new THREE.BoxGeometry(width - 0.1, 0.02, thickness - 0.08);
    const bottomPages = new THREE.Mesh(bottomPagesGeo, pagesMat);
    bottomPages.position.set(0, -height / 2 + 0.01, 0);
    bookGroup.add(bottomPages);
    
    // Vertical stitch line on cover (pastel blue accent)
    const stitchMat = new THREE.MeshStandardMaterial({
      color: 0xb0e0e6,
      roughness: 0.5
    });
    const stitchGeo = new THREE.BoxGeometry(0.015, height - 0.3, 0.01);
    const stitch = new THREE.Mesh(stitchGeo, stitchMat);
    stitch.position.set(-width / 2 + 0.2, 0, thickness / 2 + 0.005);
    bookGroup.add(stitch);
    
    // Leather strap with button
    const strapMat = new THREE.MeshStandardMaterial({
      color: strapColor,
      roughness: 0.8,
      metalness: 0.02
    });
    
    // Strap tab
    const strapGeo = new THREE.BoxGeometry(0.3, 0.6, 0.05);
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(width / 2 + 0.1, -0.1, thickness / 2 - 0.02);
    bookGroup.add(strap);
    
    // Button
    const buttonGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24);
    const buttonMat = new THREE.MeshStandardMaterial({
      color: buttonColor,
      roughness: 0.25,
      metalness: 0.6
    });
    const button = new THREE.Mesh(buttonGeo, buttonMat);
    button.rotation.x = Math.PI / 2;
    button.position.set(width / 2 + 0.1, -0.1, thickness / 2 + 0.02);
    bookGroup.add(button);
    
    // "soulspace" title embossed on cover - BIGGER
    const titleCanvas = document.createElement('canvas');
    titleCanvas.width = 512;
    titleCanvas.height = 128;
    const ctx = titleCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 128);
    
    // Elegant text with subtle shadow
    ctx.font = 'bold 76px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow for depth
    ctx.shadowColor = 'rgba(70, 130, 150, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Pastel blue color for visibility on pastel pink cover
    ctx.fillStyle = '#5ba3b8';
    ctx.fillText('soulspace', 256, 64);
    
    const titleTexture = new THREE.CanvasTexture(titleCanvas);
    titleTexture.anisotropy = 16;
    
    const titleMat = new THREE.MeshStandardMaterial({
      map: titleTexture,
      transparent: true,
      roughness: 0.4,
      metalness: 0.3
    });
    
    // Title sized to fit within journal cover - 90% of width
    const titleGeo = new THREE.PlaneGeometry(width * 0.9, height * 0.18);
    const titleMesh = new THREE.Mesh(titleGeo, titleMat);
    titleMesh.position.set(0, 0.7, thickness / 2 + 0.003);
    bookGroup.add(titleMesh);
    
    return bookGroup;
  };
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up any existing canvas first (handles StrictMode double-render)
    const existingCanvas = containerRef.current.querySelector('canvas');
    if (existingCanvas) {
      containerRef.current.removeChild(existingCanvas);
    }
    
    const scene = new THREE.Scene();
    scene.background = null;
    
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    containerRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);
    
    const topLight = new THREE.DirectionalLight(0xfff5e6, 0.5);
    topLight.position.set(0, 3, 3);
    scene.add(topLight);
    
    // Create journal
    const journal = createClosedJournal();
    scene.add(journal);
    
    // Load and add logo to journal cover using Image
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      const logoTexture = new THREE.Texture(logoImg);
      logoTexture.needsUpdate = true;
      logoTexture.colorSpace = THREE.SRGBColorSpace;
      logoTexture.premultiplyAlpha = true;
      
      const logoMat = new THREE.MeshBasicMaterial({
        map: logoTexture,
        transparent: true,
        alphaTest: 0.1, // Helps cut out near-transparent pixels
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      // Logo sized to fit nicely under the title
      const logoWidth = 1.6;
      const logoHeight = logoWidth * (448 / 656); // Maintain aspect ratio
      const logoGeo = new THREE.PlaneGeometry(logoWidth, logoHeight);
      const logoMesh = new THREE.Mesh(logoGeo, logoMat);
      logoMesh.position.set(0, 0.05, 0.178); // Position on front of journal cover, closer to title
      journal.add(logoMesh);
      
      console.log('Logo loaded successfully!');
    };
    logoImg.onerror = (e) => {
      console.error('Failed to load logo image:', e);
    };
    // Add cache buster to force reload new image
    logoImg.src = `/soulspace-logo.png?v=${Date.now()}`;
    
    sceneRef.current = { renderer, frameId: 0 };
    
    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      renderer.render(scene, camera);
      sceneRef.current.frameId = requestAnimationFrame(animate);
    };
    animate();
    
    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(journal, true);
      
      if (intersects.length > 0) {
        navigate('/open-journal');
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(journal, true);
      setBookHovered(intersects.length > 0);
    };
    
    const handleTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(journal, true);
      
      if (intersects.length > 0) {
        navigate('/open-journal');
      }
    };
    
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouch);
    
    setTimeout(() => setIsReady(true), 300);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouch);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        renderer.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      }
    };
  }, [navigate]);
  
  return (
    <div className={`landing-page ${bookHovered ? 'book-hover' : ''}`}>
      <div ref={containerRef} className="three-container" />
      
      {/* Hint text */}
      {isReady && (
        <div className="tap-hint">
          <span className={bookHovered ? 'hovered' : ''}>
            {bookHovered ? 'click to open' : 'tap the journal'}
          </span>
        </div>
      )}
    </div>
  );
}
