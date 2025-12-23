import { useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { BackButton } from '../components/BackButton';
import './OpenJournalPage.css';

export function OpenJournalPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    frameId: number;
    startButton: THREE.Mesh;
    camera: THREE.PerspectiveCamera;
  } | null>(null);
  
  // Create already-opened journal with content ON the pages
  const createOpenJournal = () => {
    const bookGroup = new THREE.Group();
    
    // MUST match closed journal dimensions
    const closedWidth = 3.2;
    const closedHeight = 4.2;
    
    const pageWidth = closedWidth;
    const pageHeight = closedHeight;
    const coverThickness = 0.06;
    const spineWidth = 0.12;
    
    // Pastel colors
    const coverColor = 0xf8c8dc;
    const spineColor = 0xb0e0e6;
    
    const coverMat = new THREE.MeshStandardMaterial({
      color: coverColor,
      roughness: 0.4,
      metalness: 0.05
    });
    
    const spineMat = new THREE.MeshStandardMaterial({
      color: spineColor,
      roughness: 0.4,
      metalness: 0.05
    });
    
    // === SPINE ===
    const spineGeo = new THREE.BoxGeometry(spineWidth, pageHeight, coverThickness);
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, -coverThickness / 2);
    bookGroup.add(spine);
    
    // === LEFT COVER ===
    const coverGeo = new THREE.BoxGeometry(pageWidth, pageHeight, coverThickness);
    const leftCover = new THREE.Mesh(coverGeo, coverMat);
    leftCover.position.set(-spineWidth / 2 - pageWidth / 2, 0, 0);
    bookGroup.add(leftCover);
    
    // === RIGHT COVER ===
    const rightCover = new THREE.Mesh(coverGeo, coverMat);
    rightCover.position.set(spineWidth / 2 + pageWidth / 2, 0, 0);
    bookGroup.add(rightCover);
    
    // === LEFT PAGE with quote ===
    const leftPageCanvas = document.createElement('canvas');
    leftPageCanvas.width = 512;
    leftPageCanvas.height = 680;
    const leftCtx = leftPageCanvas.getContext('2d')!;
    leftCtx.fillStyle = '#fffdf8';
    leftCtx.fillRect(0, 0, 512, 680);
    
    // Subtle lines
    leftCtx.strokeStyle = '#ebe7df';
    leftCtx.lineWidth = 1;
    for (let y = 80; y < 640; y += 28) {
      leftCtx.beginPath();
      leftCtx.moveTo(45, y);
      leftCtx.lineTo(467, y);
      leftCtx.stroke();
    }
    
    // Quote text
    leftCtx.font = 'italic 30px Georgia, serif';
    leftCtx.fillStyle = '#5a4a3a';
    leftCtx.textAlign = 'center';
    leftCtx.fillText('your thoughts', 256, 310);
    leftCtx.fillText('deserve space.', 256, 355);
    
    leftCtx.font = '22px Georgia, serif';
    leftCtx.fillText('✦', 256, 420);
    
    const leftPageTexture = new THREE.CanvasTexture(leftPageCanvas);
    const leftPageMat = new THREE.MeshStandardMaterial({
      map: leftPageTexture,
      roughness: 0.95
    });
    
    const pageGeo = new THREE.PlaneGeometry(pageWidth - 0.12, pageHeight - 0.12);
    const leftPage = new THREE.Mesh(pageGeo, leftPageMat);
    leftPage.position.set(-spineWidth / 2 - pageWidth / 2, 0, coverThickness / 2 + 0.01);
    bookGroup.add(leftPage);
    
    // === RIGHT PAGE with Start button drawn on it ===
    const rightPageCanvas = document.createElement('canvas');
    rightPageCanvas.width = 512;
    rightPageCanvas.height = 680;
    const rightCtx = rightPageCanvas.getContext('2d')!;
    rightCtx.fillStyle = '#fffdf8';
    rightCtx.fillRect(0, 0, 512, 680);
    
    // Subtle lines
    rightCtx.strokeStyle = '#ebe7df';
    rightCtx.lineWidth = 1;
    for (let y = 80; y < 640; y += 28) {
      rightCtx.beginPath();
      rightCtx.moveTo(45, y);
      rightCtx.lineTo(467, y);
      rightCtx.stroke();
    }
    
    // Draw Start button on the canvas (matching feature box style)
    const btnX = 256;
    const btnY = 340;
    const btnWidth = 200;
    const btnHeight = 60;
    const btnRadius = 15;
    
    // Subtle gradient background (like feature boxes)
    const gradient = rightCtx.createLinearGradient(btnX - btnWidth/2, btnY, btnX + btnWidth/2, btnY);
    gradient.addColorStop(0, 'rgba(255, 182, 193, 0.3)');
    gradient.addColorStop(0.5, 'rgba(230, 230, 250, 0.3)');
    gradient.addColorStop(1, 'rgba(176, 224, 230, 0.3)');
    
    // Draw rounded rectangle with fill
    rightCtx.beginPath();
    rightCtx.roundRect(btnX - btnWidth/2, btnY - btnHeight/2, btnWidth, btnHeight, btnRadius);
    rightCtx.fillStyle = gradient;
    rightCtx.fill();
    
    // Brown outline
    rightCtx.strokeStyle = '#8B6914';
    rightCtx.lineWidth = 2;
    rightCtx.stroke();
    
    // Elegant brown text
    rightCtx.font = 'italic 24px Georgia, serif';
    rightCtx.fillStyle = '#5a4a3a';
    rightCtx.textAlign = 'center';
    rightCtx.textBaseline = 'middle';
    rightCtx.fillText('Start', btnX, btnY);
    
    const rightPageTexture = new THREE.CanvasTexture(rightPageCanvas);
    const rightPageMat = new THREE.MeshStandardMaterial({
      map: rightPageTexture,
      roughness: 0.95
    });
    
    const rightPage = new THREE.Mesh(pageGeo, rightPageMat);
    rightPage.position.set(spineWidth / 2 + pageWidth / 2, 0, coverThickness / 2 + 0.01);
    rightPage.userData.isStartButton = true;
    bookGroup.add(rightPage);
    
    return { bookGroup, rightPage };
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
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 9.5);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.7);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);
    
    const topLight = new THREE.DirectionalLight(0xfff8f0, 0.4);
    topLight.position.set(0, 3, 3);
    scene.add(topLight);
    
    // Create journal
    const { bookGroup, rightPage } = createOpenJournal();
    bookGroup.position.set(0, 0, 0);
    scene.add(bookGroup);
    
    sceneRef.current = { renderer, frameId: 0, startButton: rightPage, camera };
    
    renderer.render(scene, camera);
    
    const animate = () => {
      if (!sceneRef.current) return;
      renderer.render(scene, camera);
      sceneRef.current.frameId = requestAnimationFrame(animate);
    };
    animate();
    
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Click detection on the right page (Start button area)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      if (!sceneRef.current) return;
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(rightPage);
      
      if (intersects.length > 0) {
        // Check if click is in the button area (center of page)
        const uv = intersects[0].uv;
        if (uv) {
          const clickX = uv.x;
          const clickY = uv.y;
          // Button is roughly in center (x: 0.3-0.7, y: 0.4-0.6)
          if (clickX > 0.25 && clickX < 0.75 && clickY > 0.4 && clickY < 0.6) {
            navigate('/table-of-contents');
          }
        }
      }
    };
    
    const handleTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(rightPage);
      
      if (intersects.length > 0) {
        const uv = intersects[0].uv;
        if (uv && uv.x > 0.25 && uv.x < 0.75 && uv.y > 0.4 && uv.y < 0.6) {
          navigate('/table-of-contents');
        }
      }
    };
    
    window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleTouch);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouch);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        renderer.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      }
    };
  }, [navigate]);
  
  return (
    <div className="open-journal-page">
      <div ref={containerRef} className="three-container" />
      <BackButton onClick={() => navigate('/')} />
    </div>
  );
}
