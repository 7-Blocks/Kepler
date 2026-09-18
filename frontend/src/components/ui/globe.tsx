import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  earthVertexShader,
  earthFragmentShader,
  cloudFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from "./globe/shaders";

gsap.registerPlugin(ScrollTrigger);

// --- Config flag: swap between 'fade' (opacity→0 + hide) and 'dock' (shrink to corner) ---
const GLOBE_EXIT_MODE: "fade" | "dock" = "fade";

export interface GlobeProps {
  className?: string;
  config?: any;
}

export function Globe({ className }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // ─── Scene, Camera, Renderer ───────────────────────────────────────────────
    const scene = new THREE.Scene();

    // Camera is fixed on the Z axis — world-space X/Y drive screen position cleanly
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // ─── Textures ──────────────────────────────────────────────────────────────
    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const dayTexture = textureLoader.load(
      "/textures/earth/2k_earth_daymap.jpg",
      () => setIsLoaded(true)
    );
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    dayTexture.anisotropy = maxAnisotropy;

    const nightTexture = textureLoader.load("/textures/earth/night.jpg");
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    nightTexture.anisotropy = maxAnisotropy;

    const specularCloudsTexture = textureLoader.load(
      "/textures/earth/specularClouds.jpg"
    );
    specularCloudsTexture.anisotropy = maxAnisotropy;

    // ─── Lighting ──────────────────────────────────────────────────────────────
    const sunDirection = new THREE.Vector3(1.2, 0.5, 1.3).normalize();
    const atmosphereDayColor = new THREE.Color(0x9fd8ff);
    const atmosphereTwilightColor = new THREE.Color(0x0a1c38);

    // ─── Geometries ────────────────────────────────────────────────────────────
    const earthGeometry    = new THREE.SphereGeometry(1, 64, 64);
    const cloudGeometry    = new THREE.SphereGeometry(1.008, 64, 64);
    const atmosphereGeometry = new THREE.SphereGeometry(1.028, 64, 64);

    // ─── Earth Mesh ────────────────────────────────────────────────────────────
    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uDayTexture: new THREE.Uniform(dayTexture),
        uNightTexture: new THREE.Uniform(nightTexture),
        uSpecularCloudsTexture: new THREE.Uniform(specularCloudsTexture),
        uSunDirection: new THREE.Uniform(sunDirection),
        uAtmosphereDayColor: new THREE.Uniform(atmosphereDayColor),
        uAtmosphereTwilightColor: new THREE.Uniform(atmosphereTwilightColor),
      },
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);

    // ─── Cloud Mesh (3D Parallax, reduced density — see cloudFragmentShader) ──
    const cloudMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: cloudFragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uCloudTexture: new THREE.Uniform(specularCloudsTexture),
        uSunDirection: new THREE.Uniform(sunDirection),
      },
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);

    // ─── Atmosphere Glow ───────────────────────────────────────────────────────
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uSunDirection: new THREE.Uniform(sunDirection),
        uAtmosphereDayColor: new THREE.Uniform(atmosphereDayColor),
        uAtmosphereTwilightColor: new THREE.Uniform(atmosphereTwilightColor),
      },
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);

    const earthGroup = new THREE.Group();
    earthGroup.add(earthMesh);
    earthGroup.add(cloudMesh);
    earthGroup.add(atmosphereMesh);
    scene.add(earthGroup);

    // ─── Resize (debounced) ────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      ScrollTrigger.refresh();
    };
    handleResize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onDebouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    };
    window.addEventListener("resize", onDebouncedResize);

    // ─── Reduced Motion ────────────────────────────────────────────────────────
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ─── GSAP Proxy ───────────────────────────────────────────────────────────
    // India longitude 78.9°E → rotY = -(78.9 * π/180) ≈ -1.38 rad
    // This places India front-and-center at scroll position 0.
    const INDIA_ROT_Y = -(190 * Math.PI / 180); // -1.377 rad

    const proxy = {
      posX: 1.0,
      posY: 0.0,
      scale: 0.72,
      camZ: 3.2,
      tiltX: THREE.MathUtils.degToRad(23.5),
      rotY: INDIA_ROT_Y,
      opacity: 1,
    };

    // Flag: is the intro sequence currently within view?
    let isSequenceActive = true;
    let mm: gsap.MatchMedia | null = null;

    if (prefersReducedMotion) {
      proxy.posX = 1.0;
      proxy.posY = 0.0;
      proxy.scale = 0.72;
      proxy.camZ = 3.2;
      proxy.tiltX = THREE.MathUtils.degToRad(23.5);
      proxy.rotY = INDIA_ROT_Y;
      proxy.opacity = 1;
    } else {
      const heroElement = document.getElementById("hero") || document.body;
      mm = gsap.matchMedia();

      // ── Shared timeline builder ─────────────────────────────────────────────
      const setupTimeline = (config: {
        w0: { x: number; y: number; scale: number; tiltX: number };
        w1: { x: number; y: number; scale: number; tiltX: number };
        w2: { x: number; y: number; scale: number; tiltX: number };
      }) => {
        proxy.posX  = config.w0.x;
        proxy.posY  = config.w0.y;
        proxy.scale = config.w0.scale;
        proxy.camZ  = 3.2;
        proxy.tiltX = config.w0.tiltX;
        proxy.rotY  = INDIA_ROT_Y;
        proxy.opacity = 1;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroElement,
            start: "top top",
            end: "+=80%",
            scrub: 1,
            onToggle: (self) => {
              isSequenceActive = self.isActive;
            },
            onUpdate: (self) => {
              // Hide only after opacity has fully reached 0 — no premature snap
              if (GLOBE_EXIT_MODE === "fade") {
                if (proxy.opacity <= 0.01 && self.progress >= 0.99) {
                  container.style.visibility = "hidden";
                } else {
                  container.style.visibility = "visible";
                }
              }
            },
            onEnterBack: () => {
              container.style.visibility = "visible";
              container.style.pointerEvents = "none";
            },
          },
        });

        // ── WAYPOINT 0 → 1 (0–50% of scroll range) ─────────────────────────
        tl.fromTo(
          proxy,
          {
            posX: config.w0.x,
            posY: config.w0.y,
            scale: config.w0.scale,
            camZ: 3.2,
            tiltX: config.w0.tiltX,
            rotY: INDIA_ROT_Y,
          },
          {
            posX: config.w1.x,
            posY: config.w1.y,
            scale: config.w1.scale,
            camZ: 3.0,
            tiltX: config.w1.tiltX,
            rotY: INDIA_ROT_Y + 0.45,
            ease: "power1.inOut",
            duration: 0.5,
          },
          0
        );

        const satellitesEl = document.getElementById("orbit-satellites-wrapper");
        if (satellitesEl) {
          tl.to(satellitesEl, { opacity: 0.9, ease: "power2.out", duration: 0.35 }, 0.1);
        }

        // ── WAYPOINT 1 → 2 (50–72% of scroll range) ────────────────────────
        tl.to(
          proxy,
          {
            posX: config.w2.x,
            posY: config.w2.y,
            scale: config.w2.scale,
            camZ: 2.7,
            tiltX: config.w2.tiltX,
            rotY: INDIA_ROT_Y + 1.75,
            ease: "power1.inOut",
            duration: 0.22,
          },
          0.5
        );

        // ── EXIT FADE (72–100% of scroll range) ────────────────────────────
        // Smooth dissolve: opacity 1→0 + slight scale pull-back over 28% of range
        tl.to(
          proxy,
          {
            opacity: 0,
            scale: config.w2.scale * 0.85,
            ease: "power1.inOut",
            duration: 0.28,
          },
          0.72
        );
        if (satellitesEl) {
          tl.to(satellitesEl, { opacity: 0, ease: "power1.inOut", duration: 0.28 }, 0.72);
        }
      };

      // ── Desktop (≥ 1024px) ────────────────────────────────────────────────
      mm.add("(min-width: 1024px)", () => {
        setupTimeline({
          w0: { x: 1.20,  y: -0.2,   scale: 0.85, tiltX: THREE.MathUtils.degToRad(23.5) },
          w1: { x: 1.2,  y: 0.15,  scale: 1.20, tiltX: THREE.MathUtils.degToRad(18) },
          w2: { x: 1.55, y: -0.2,  scale: 2.80, tiltX: THREE.MathUtils.degToRad(26) },
        });
      });

      // ── Tablet (640–1023px) ───────────────────────────────────────────────
      mm.add("(min-width: 640px) and (max-width: 1023px)", () => {
        setupTimeline({
          w0: { x: 0.65, y: -0.15,   scale: 0.55, tiltX: THREE.MathUtils.degToRad(23.5) },
          w1: { x: 0.85, y: 0.08,  scale: 0.80, tiltX: THREE.MathUtils.degToRad(18) },
          w2: { x: 1.15, y: -0.15, scale: 1.05, tiltX: THREE.MathUtils.degToRad(25) },
        });
      });

      // ── Mobile (< 640px) ──────────────────────────────────────────────────
      mm.add("(max-width: 639px)", () => {
        setupTimeline({
          w0: { x: 0.0,  y: -0.45, scale: 0.45, tiltX: THREE.MathUtils.degToRad(23.5) },
          w1: { x: 0.3,  y: -0.25, scale: 0.65, tiltX: THREE.MathUtils.degToRad(15) },
          w2: { x: 0.45, y: -0.35, scale: 0.80, tiltX: THREE.MathUtils.degToRad(22) },
        });
      });
    }

    // ─── Pointer Drag Interaction ──────────────────────────────────────────────
    let isDragging = false;
    let dragStartX = 0;
    let targetDragRotation = 0;
    let currentDragRotation = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      isDragging = true;
      dragStartX = e.clientX;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      targetDragRotation += (e.clientX - dragStartX) * 0.005;
      dragStartX = e.clientX;
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      canvas.style.cursor = "grab";
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    // ─── Animation Loop ────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let idleRotation = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Skip GPU work when the globe is fully faded and off-screen
      if (!isSequenceActive && proxy.opacity <= 0.01) return;

      const delta = Math.min(clock.getDelta(), 0.1);

      // Damped pointer drag
      currentDragRotation = THREE.MathUtils.lerp(currentDragRotation, targetDragRotation, 0.08);

      // Additive idle rotation (independent of scroll — keeps globe alive when paused)
      idleRotation += delta * 0.04;

      // Apply group transforms
      earthGroup.position.set(proxy.posX, proxy.posY, 0);
      earthGroup.scale.setScalar(proxy.scale);

      // Earth: scroll rotation + idle + drag
      earthMesh.rotation.x = proxy.tiltX;
      earthMesh.rotation.y = proxy.rotY + idleRotation + currentDragRotation;

      // Clouds: 1.25× faster than earth for 3D parallax depth
      cloudMesh.rotation.x = proxy.tiltX;
      // Cloud rotY offset from INDIA_ROT_Y base — keep proportional to earth
      cloudMesh.rotation.y = proxy.rotY * 1.15 + idleRotation * 1.25 + currentDragRotation * 1.05;

      atmosphereMesh.rotation.x = proxy.tiltX;

      // Camera dolly
      camera.position.z = proxy.camZ;

      // Opacity fade applied to CSS container (not Three.js material)
      container.style.opacity = String(proxy.opacity);

      renderer.render(scene, camera);
    };

    animate();

    // ─── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onDebouncedResize);
      clearTimeout(resizeTimer);
      if (mm) mm.revert();

      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);

      earthGeometry.dispose();
      cloudGeometry.dispose();
      atmosphereGeometry.dispose();
      earthMaterial.dispose();
      cloudMaterial.dispose();
      atmosphereMaterial.dispose();
      dayTexture.dispose();
      nightTexture.dispose();
      specularCloudsTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none h-full w-full will-change-transform",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "h-full w-full select-none touch-none pointer-events-auto transition-opacity duration-700",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

export default Globe;
