import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';

interface WebXRState {
  isSupported: boolean;
  isSessionActive: boolean;
  sessionMode: XRSessionMode | null;
}

type XRSessionMode = 'immersive-vr' | 'immersive-ar' | 'inline';

interface XRSystem {
  isSessionSupported(mode: XRSessionMode): Promise<boolean>;
  requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
}

interface XRSession extends EventTarget {
  end(): Promise<void>;
  requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  inputSources: XRInputSourceArray;
}

interface XRInputSourceArray extends Iterable<XRInputSource> {
  length: number;
  [index: number]: XRInputSource;
}

interface XRInputSource {
  handedness: 'none' | 'left' | 'right';
  targetRayMode: 'gaze' | 'tracked-pointer' | 'screen';
  targetRaySpace: XRSpace;
  gripSpace?: XRSpace;
  gamepad?: Gamepad;
  hand?: XRHand;
}

interface XRSpace {}
interface XRHand {}
interface XRReferenceSpace {}

interface XRSessionInit {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
}

type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';

declare global {
  interface Navigator {
    xr?: XRSystem;
  }
}

interface UseWebXROptions {
  onSelect?: (controller: THREE.Object3D) => void;
}

export function useWebXR(renderer: THREE.WebGLRenderer | null, options?: UseWebXROptions) {
  const [state, setState] = useState<WebXRState>({
    isSupported: false,
    isSessionActive: false,
    sessionMode: null,
  });
  
  const sessionRef = useRef<XRSession | null>(null);
  const onSelectRef = useRef(options?.onSelect);
  
  // Keep onSelect callback ref updated
  useEffect(() => {
    onSelectRef.current = options?.onSelect;
  }, [options?.onSelect]);

  // Check WebXR support on mount
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.xr) {
        console.log('WebXR not available in this browser');
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      try {
        // Check for immersive-vr support (Vision Pro, Quest, etc.)
        const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        console.log('Immersive VR supported:', vrSupported);
        
        setState(prev => ({ ...prev, isSupported: vrSupported }));
      } catch (error) {
        console.error('Error checking WebXR support:', error);
        setState(prev => ({ ...prev, isSupported: false }));
      }
    };

    checkSupport();
  }, []);

  // Set up XR controllers when renderer is available
  useEffect(() => {
    if (!renderer) return;

    // Create controllers
    const controller0 = renderer.xr.getController(0);
    const controller1 = renderer.xr.getController(1);

    // Handle select event (tap/click in VR)
    const handleSelect = (event: { target: THREE.Object3D }) => {
      console.log('XR Select event triggered', event.target);
      if (onSelectRef.current) {
        onSelectRef.current(event.target);
      }
    };

    controller0.addEventListener('select', handleSelect as EventListener);
    controller1.addEventListener('select', handleSelect as EventListener);

    // Add visual ray for controllers (helps with aiming)
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5)
    ]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffb6c1,
      linewidth: 2,
      transparent: true,
      opacity: 0.6
    });
    
    const line0 = new THREE.Line(geometry, material);
    const line1 = new THREE.Line(geometry.clone(), material);
    
    controller0.add(line0);
    controller1.add(line1);

    return () => {
      controller0.removeEventListener('select', handleSelect as EventListener);
      controller1.removeEventListener('select', handleSelect as EventListener);
      controller0.remove(line0);
      controller1.remove(line1);
    };
  }, [renderer]);

  // Enter immersive VR mode
  const enterVR = useCallback(async () => {
    if (!navigator.xr || !renderer) {
      console.error('WebXR or renderer not available');
      return false;
    }

    try {
      // Enable XR on the renderer
      renderer.xr.enabled = true;

      // Request immersive VR session
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });

      sessionRef.current = session;
      
      // Set the XR session on the renderer
      await renderer.xr.setSession(session as unknown as XRSession & { renderState: unknown });

      // Handle session end
      session.addEventListener('end', () => {
        console.log('XR Session ended');
        sessionRef.current = null;
        renderer.xr.enabled = false;
        setState(prev => ({ ...prev, isSessionActive: false, sessionMode: null }));
      });

      setState(prev => ({ 
        ...prev, 
        isSessionActive: true, 
        sessionMode: 'immersive-vr' 
      }));

      console.log('Entered immersive VR mode');
      return true;
    } catch (error) {
      console.error('Failed to enter VR mode:', error);
      return false;
    }
  }, [renderer]);

  // Exit VR mode
  const exitVR = useCallback(async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.end();
        sessionRef.current = null;
        setState(prev => ({ ...prev, isSessionActive: false, sessionMode: null }));
        console.log('Exited VR mode');
      } catch (error) {
        console.error('Failed to exit VR mode:', error);
      }
    }
  }, []);

  // Toggle VR mode
  const toggleVR = useCallback(async () => {
    if (state.isSessionActive) {
      await exitVR();
    } else {
      await enterVR();
    }
  }, [state.isSessionActive, enterVR, exitVR]);

  // Get controllers for adding to scene
  const getControllers = useCallback(() => {
    if (!renderer) return { controller0: null, controller1: null };
    return {
      controller0: renderer.xr.getController(0),
      controller1: renderer.xr.getController(1),
    };
  }, [renderer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.end().catch(console.error);
      }
    };
  }, []);

  return {
    ...state,
    enterVR,
    exitVR,
    toggleVR,
    getControllers,
  };
}
