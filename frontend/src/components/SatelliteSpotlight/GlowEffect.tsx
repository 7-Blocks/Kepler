import * as Cesium from 'cesium';

export type SpotlightVisualState = 'baseline' | 'dimmed' | 'highlighted';

export interface PointBaseline {
  color: Cesium.Color;
  pixelSize: number;
  outlineColor: Cesium.Color;
  outlineWidth: number;
}

const DIM_ALPHA = 0.22;
const DIM_LABEL_ALPHA = 0.35;
const HIGHLIGHT_SCALE = 1.7;
const HIGHLIGHT_RISK_SCALE = 2.1;
const TRANSITION_MS = 220;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tiny, dependency-free tween used only during spotlight transitions
 * (~200ms), never as continuous per-frame work. Cancelled automatically if
 * a newer tween starts on the same entity via the provided token ref.
 */
function animate(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  tokenRef: { current: number },
  myToken: number
) {
  if (prefersReducedMotion() || durationMs <= 0) {
    onUpdate(to);
    return;
  }

  const start = performance.now();
  const step = (now: number) => {
    if (tokenRef.current !== myToken) return; // superseded by a newer transition
    const elapsed = now - start;
    const t = Math.min(1, elapsed / durationMs);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    onUpdate(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Per-entity animation token so rapid hover changes don't race each other. */
const animationTokens = new WeakMap<Cesium.Entity, { current: number }>();
let tokenCounter = 0;

function getTokenRef(entity: Cesium.Entity): { current: number } {
  let ref = animationTokens.get(entity);
  if (!ref) {
    ref = { current: 0 };
    animationTokens.set(entity, ref);
  }
  return ref;
}

/** Restores an entity's point/label styling to its normal, non-spotlighted state. */
export function applyBaseline(entity: Cesium.Entity, baseline: PointBaseline) {
  if (!entity.point) return;
  const tokenRef = getTokenRef(entity);
  const myToken = ++tokenCounter;
  tokenRef.current = myToken;

  const point = entity.point;
  point.color = new Cesium.ConstantProperty(baseline.color.withAlpha(0.85));
  point.outlineColor = new Cesium.ConstantProperty(baseline.outlineColor.withAlpha(0.4));
  point.outlineWidth = new Cesium.ConstantProperty(baseline.outlineWidth);

  const currentSize = (point.pixelSize?.getValue(Cesium.JulianDate.now()) as number) ?? baseline.pixelSize;
  animate(
    currentSize,
    baseline.pixelSize,
    TRANSITION_MS,
    (v) => {
      point.pixelSize = new Cesium.ConstantProperty(v);
    },
    tokenRef,
    myToken
  );

  if (entity.label) {
    entity.label.show = new Cesium.ConstantProperty(false);
  }
}

/** Fades a non-active entity into the background so the spotlighted one stands out. */
export function applyDim(entity: Cesium.Entity, baseline: PointBaseline) {
  if (!entity.point) return;
  const tokenRef = getTokenRef(entity);
  const myToken = ++tokenCounter;
  tokenRef.current = myToken;

  const point = entity.point;
  point.color = new Cesium.ConstantProperty(baseline.color.withAlpha(DIM_ALPHA));
  point.outlineColor = new Cesium.ConstantProperty(baseline.outlineColor.withAlpha(DIM_ALPHA * 0.6));

  const currentSize = (point.pixelSize?.getValue(Cesium.JulianDate.now()) as number) ?? baseline.pixelSize;
  animate(
    currentSize,
    Math.max(baseline.pixelSize * 0.85, 1.5),
    TRANSITION_MS,
    (v) => {
      point.pixelSize = new Cesium.ConstantProperty(v);
    },
    tokenRef,
    myToken
  );

  if (entity.label) {
    entity.label.show = new Cesium.ConstantProperty(false);
  }

  void DIM_LABEL_ALPHA; // reserved for label-opacity theming if labels are enabled later
}

/** Makes an entity the visual focal point: brighter, larger, glowing outline. */
export function applyHighlight(
  entity: Cesium.Entity,
  baseline: PointBaseline,
  options: { isCollisionRisk?: boolean; labelText?: string } = {}
) {
  if (!entity.point) return;
  const tokenRef = getTokenRef(entity);
  const myToken = ++tokenCounter;
  tokenRef.current = myToken;

  const point = entity.point;
  const glowColor = options.isCollisionRisk ? Cesium.Color.fromCssColorString('#FF3B30') : baseline.color;

  point.color = new Cesium.ConstantProperty(glowColor.brighten(0.3, new Cesium.Color()).withAlpha(1));
  point.outlineColor = new Cesium.ConstantProperty(glowColor.withAlpha(0.95));
  point.outlineWidth = new Cesium.ConstantProperty(baseline.outlineWidth + (options.isCollisionRisk ? 3 : 2));

  const targetSize = baseline.pixelSize * (options.isCollisionRisk ? HIGHLIGHT_RISK_SCALE : HIGHLIGHT_SCALE);
  const currentSize = (point.pixelSize?.getValue(Cesium.JulianDate.now()) as number) ?? baseline.pixelSize;
  animate(
    currentSize,
    targetSize,
    TRANSITION_MS,
    (v) => {
      point.pixelSize = new Cesium.ConstantProperty(v);
    },
    tokenRef,
    myToken
  );

  if (entity.label && options.labelText !== undefined) {
    entity.label.text = new Cesium.ConstantProperty(options.labelText);
    entity.label.show = new Cesium.ConstantProperty(true);
    entity.label.font = new Cesium.ConstantProperty('600 13px "IBM Plex Sans", monospace');
    entity.label.fillColor = new Cesium.ConstantProperty(Cesium.Color.WHITE);
    entity.label.outlineColor = new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.8));
    entity.label.outlineWidth = new Cesium.ConstantProperty(2);
    entity.label.style = new Cesium.ConstantProperty(Cesium.LabelStyle.FILL_AND_OUTLINE);
    entity.label.pixelOffset = new Cesium.ConstantProperty(new Cesium.Cartesian2(0, -16));
    entity.label.disableDepthTestDistance = new Cesium.ConstantProperty(Number.POSITIVE_INFINITY);
  }
}
