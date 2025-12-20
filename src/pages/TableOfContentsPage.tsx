import { useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { BackButton } from '../components/BackButton';
import './TableOfContentsPage.css';

export function TableOfContentsPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    frameId: number;
    leftPage: THREE.Mesh;
    camera: THREE.PerspectiveCamera;
  } | null>(null);
  
  // Create opened journal with Table of Contents on left page
  const createOpenJournal = () => {
    const bookGroup = new THREE.Group();
    
    const closedWidth = 2.4;
    const closedHeight = 3.2;
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
    
    // === LEFT PAGE - Table of Contents ===
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
    
    // Heading
    leftCtx.font = 'italic 26px Georgia, serif';
    leftCtx.fillStyle = '#5a4a3a';
    leftCtx.textAlign = 'center';
    leftCtx.fillText('Choose Your Journey', 256, 130);
    
    // Decorative line
    leftCtx.strokeStyle = '#b0e0e6';
    leftCtx.lineWidth = 2;
    leftCtx.beginPath();
    leftCtx.moveTo(120, 155);
    leftCtx.lineTo(392, 155);
    leftCtx.stroke();
    
    // Feature items - draw as buttons
    const features = [
      { emoji: '📝', label: 'Journal', y: 260 },
      { emoji: '✨', label: 'Soul Summary', y: 370 },
      { emoji: '🫧', label: 'Emotion Sphere', y: 480 }
    ];
    
    features.forEach(({ emoji, label, y }) => {
      // Button background
      const btnWidth = 280;
      const btnHeight = 70;
      const btnX = 256;
      const btnRadius = 15;
      
      // Gradient
      const gradient = leftCtx.createLinearGradient(btnX - btnWidth/2, y, btnX + btnWidth/2, y);
      gradient.addColorStop(0, 'rgba(255, 182, 193, 0.3)');
      gradient.addColorStop(0.5, 'rgba(230, 230, 250, 0.3)');
      gradient.addColorStop(1, 'rgba(176, 224, 230, 0.3)');
      
      leftCtx.beginPath();
      leftCtx.roundRect(btnX - btnWidth/2, y - btnHeight/2, btnWidth, btnHeight, btnRadius);
      leftCtx.fillStyle = gradient;
      leftCtx.fill();
      leftCtx.strokeStyle = '#8B6914';
      leftCtx.lineWidth = 2;
      leftCtx.stroke();
      
      // Emoji
      leftCtx.font = '28px Arial, sans-serif';
      leftCtx.textAlign = 'left';
      leftCtx.fillText(emoji, btnX - btnWidth/2 + 25, y + 8);
      
      // Label
      leftCtx.font = '20px Georgia, serif';
      leftCtx.fillStyle = '#5a4a3a';
      leftCtx.textAlign = 'left';
      leftCtx.fillText(label, btnX - btnWidth/2 + 70, y + 6);
    });
    
    const leftPageTexture = new THREE.CanvasTexture(leftPageCanvas);
    const leftPageMat = new THREE.MeshStandardMaterial({
      map: leftPageTexture,
      roughness: 0.95
    });
    
    const pageGeo = new THREE.PlaneGeometry(pageWidth - 0.12, pageHeight - 0.12);
    const leftPage = new THREE.Mesh(pageGeo, leftPageMat);
    leftPage.position.set(-spineWidth / 2 - pageWidth / 2, 0, coverThickness / 2 + 0.01);
    bookGroup.add(leftPage);
    
    // === RIGHT PAGE (blank) ===
    const rightPageCanvas = document.createElement('canvas');
    rightPageCanvas.width = 512;
    rightPageCanvas.height = 680;
    const rightCtx = rightPageCanvas.getContext('2d')!;
    rightCtx.fillStyle = '#fffdf8';
    rightCtx.fillRect(0, 0, 512, 680);
    
    rightCtx.strokeStyle = '#ebe7df';
    rightCtx.lineWidth = 1;
    for (let y = 80; y < 640; y += 28) {
      rightCtx.beginPath();
      rightCtx.moveTo(45, y);
      rightCtx.lineTo(467, y);
      rightCtx.stroke();
    }
    
    rightCtx.font = '18px Georgia, serif';
    rightCtx.fillStyle = '#d4c4a0';
    rightCtx.textAlign = 'center';
    rightCtx.fillText('~', 256, 340);
    
    const rightPageTexture = new THREE.CanvasTexture(rightPageCanvas);
    const rightPageMat = new THREE.MeshStandardMaterial({
      map: rightPageTexture,
      roughness: 0.95
    });
    
    const rightPage = new THREE.Mesh(pageGeo, rightPageMat);
    rightPage.position.set(spineWidth / 2 + pageWidth / 2, 0, coverThickness / 2 + 0.01);
    bookGroup.add(rightPage);
    
    return { bookGroup, leftPage };
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
    camera.position.set(0, 0, 7.5);
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
    const { bookGroup, leftPage } = createOpenJournal();
    bookGroup.position.set(0, 0, 0);
    scene.add(bookGroup);
    
    sceneRef.current = { renderer, frameId: 0, leftPage, camera };
    
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
    
    // Click detection on left page features
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      if (!sceneRef.current) return;
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(leftPage);
      
      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        const clickY = 1 - uv.y; // Flip Y (canvas Y is inverted)
        
        // Check which button was clicked based on Y position
        // Journal: y ~260/680 = 0.38
        // Soul Summary: y ~370/680 = 0.54
        // Emotion Sphere: y ~480/680 = 0.71
        
        if (uv.x > 0.15 && uv.x < 0.85) { // Within button X range
          if (clickY > 0.33 && clickY < 0.45) {
            navigate('/journal');
          } else if (clickY > 0.50 && clickY < 0.60) {
            navigate('/mood-wrap');
          } else if (clickY > 0.66 && clickY < 0.76) {
            navigate('/emotion-bubble');
          }
        }
      }
    };
    
    const handleTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(leftPage);
      
      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        const clickY = 1 - uv.y;
        
        if (uv.x > 0.15 && uv.x < 0.85) {
          if (clickY > 0.33 && clickY < 0.45) {
            navigate('/journal');
          } else if (clickY > 0.50 && clickY < 0.60) {
            navigate('/mood-wrap');
          } else if (clickY > 0.66 && clickY < 0.76) {
            navigate('/emotion-bubble');
          }
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
    <div className="toc-page">
      <div ref={containerRef} className="three-container" />
      <BackButton onClick={() => navigate('/open-journal')} />
    </div>
  );
}
