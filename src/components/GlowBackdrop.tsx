"use client";

import { useEffect, useRef } from "react";

type GlowPoint = { x: number; y: number; scale: number };

const GLOWS = [
  { className: "glow--gold h-[55vmax] w-[55vmax]" },
  { className: "glow--berry h-[50vmax] w-[50vmax]" },
  { className: "glow--dusk h-[45vmax] w-[45vmax]" },
  { className: "glow--peach h-[38vmax] w-[38vmax]" },
];

/**
 * Every visit begins with fresh random positions. Each field keeps choosing
 * random destinations, but favors open space whenever glows overlap.
 */
export function GlowBackdrop() {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    const elements = Array.from(backdrop.querySelectorAll<HTMLElement>(".glow"));
    const startingPoints = elements.map(() => randomPoint());
    startingPoints.forEach((point, index) => {
      elements[index].style.transform = glowTransform(point);
    });

    const revealFrame = window.requestAnimationFrame(() => {
      elements.forEach((element) => {
        element.style.opacity = "1";
      });
    });

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) {
      return () => window.cancelAnimationFrame(revealFrame);
    }

    const animations: Animation[] = [];
    const timers: number[] = [];
    let stopped = false;

    elements.forEach((element, index) => {
      let current = startingPoints[index];

      const move = () => {
        if (stopped) return;

        const next = chooseNextPoint(current, index, elements);
        const animation = element.animate(
          [
            { transform: glowTransform(current) },
            { transform: glowTransform(next) },
          ],
          {
            duration: 7000 + Math.random() * 5000,
            easing: "cubic-bezier(0.42, 0.04, 0.58, 0.96)",
            fill: "forwards",
          }
        );

        animations[index] = animation;
        animation.onfinish = () => {
          current = next;
          move();
        };
      };

      // A small stagger prevents four simultaneous direction changes.
      timers.push(window.setTimeout(move, index * 220));
    });

    const stopMotion = () => {
      if (!motionPreference.matches) return;
      stopped = true;
      window.cancelAnimationFrame(revealFrame);
      timers.forEach(window.clearTimeout);
      animations.forEach((animation) => animation?.cancel());
    };

    motionPreference.addEventListener("change", stopMotion);
    return () => {
      stopped = true;
      timers.forEach(window.clearTimeout);
      animations.forEach((animation) => animation?.cancel());
      motionPreference.removeEventListener("change", stopMotion);
    };
  }, []);

  return (
    <div
      ref={backdropRef}
      aria-hidden
      className="glow-backdrop absolute inset-0 overflow-hidden"
    >
      {GLOWS.map((glow, index) => (
        <div
          key={glow.className}
          className={`glow absolute left-1/2 top-1/2 ${glow.className}`}
          style={{ opacity: 0 }}
        />
      ))}
    </div>
  );
}

function chooseNextPoint(
  current: GlowPoint,
  index: number,
  elements: HTMLElement[]
): GlowPoint {
  const otherPositions = elements
    .filter((_, elementIndex) => elementIndex !== index)
    .map(readGlowPosition);
  const isOverlapping = otherPositions.some(
    (point) => distance(current, point) < 36
  );

  if (isOverlapping) {
    // Sample the screen and choose the destination with the most breathing
    // room. The added travel score stops a glow from merely shuffling in place.
    let best = randomPoint();
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const candidate = randomPoint();
      const separation = Math.min(
        ...otherPositions.map((point) => distance(candidate, point))
      );
      const travel = distance(current, candidate);
      const score = separation + travel * 0.22 - (travel < 24 ? 100 : 0);

      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    return best;
  }

  let candidate = randomPoint();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    candidate = randomPoint();

    if (
      distance(candidate, current) >= 28 &&
      otherPositions.every((point) => distance(candidate, point) >= 20)
    ) {
      break;
    }
  }

  return candidate;
}

function randomPoint(): GlowPoint {
  return {
    x: randomBetween(-44, 44),
    y: randomBetween(-40, 40),
    scale: randomBetween(0.96, 1.16),
  };
}

function readGlowPosition(element: HTMLElement): GlowPoint {
  const bounds = element.getBoundingClientRect();
  return {
    x: ((bounds.left + bounds.width / 2) / window.innerWidth - 0.5) * 100,
    y: ((bounds.top + bounds.height / 2) / window.innerHeight - 0.5) * 100,
    scale: 1,
  };
}

function distance(a: GlowPoint, b: GlowPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function glowTransform(point: GlowPoint) {
  return `translate3d(calc(-50% + ${point.x}vw), calc(-50% + ${point.y}vh), 0) scale(${point.scale})`;
}
