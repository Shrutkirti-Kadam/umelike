"use client";

import { useEffect, useRef } from "react";

type GlowPoint = {
  x: number;
  y: number;
  scale: number;
};

type GlowDefinition = {
  className: string;
  size: string;
};

const GLOWS: GlowDefinition[] = [
  {
    className: "glow-berry",
    size: "56vmax",
  },
  {
    className: "glow-gold",
    size: "58vmax",
  },
  {
    className: "glow-dusk",
    size: "50vmax",
  },
  {
    className: "glow-peach",
    size: "48vmax",
  },
];

export function GlowBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>(".ume-glow"),
    );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const animations: Animation[] = [];
    const timers: number[] = [];

    let stopped = false;

    const currentPoints: GlowPoint[] =
      elements.map(() => randomPoint());

    currentPoints.forEach((point, index) => {
      elements[index].style.transform =
        glowTransform(point);
    });

    const revealFrame =
      window.requestAnimationFrame(() => {
        elements.forEach((element) => {
          element.style.opacity = "1";
        });
      });

    if (reducedMotion.matches) {
      return () => {
        window.cancelAnimationFrame(
          revealFrame,
        );
      };
    }

    function moveGlow(index: number) {
      if (stopped) {
        return;
      }

      const element =
        elements[index];

      const current =
        currentPoints[index];

      const otherPoints =
        currentPoints.filter(
          (_, otherIndex) =>
            otherIndex !== index,
        );

      const next =
        chooseNextPoint(
          current,
          otherPoints,
        );

      const animation =
        element.animate(
          [
            {
              transform:
                glowTransform(current),
            },
            {
              transform:
                glowTransform(next),
            },
          ],
          {
            duration:
              9000 +
              Math.random() * 6000,
            easing:
              "cubic-bezier(0.42, 0.04, 0.58, 0.96)",
            fill: "forwards",
          },
        );

      animations[index] =
        animation;

      animation.onfinish = () => {
        currentPoints[index] =
          next;

        moveGlow(index);
      };
    }

    elements.forEach(
      (_, index) => {
        const timer =
          window.setTimeout(
            () => {
              moveGlow(index);
            },
            index * 500,
          );

        timers.push(timer);
      },
    );

    return () => {
      stopped = true;

      window.cancelAnimationFrame(
        revealFrame,
      );

      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });

      animations.forEach(
        (animation) => {
          animation?.cancel();
        },
      );
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="ume-glow-backdrop"
      aria-hidden="true"
    >
      {GLOWS.map(
        (glow, index) => (
          <div
            key={glow.className}
            className={`ume-glow ${glow.className}`}
            style={{
              width: glow.size,
              height: glow.size,
              opacity: 0,
              zIndex: index + 1,
            }}
          />
        ),
      )}

      <style jsx>{`
        .ume-glow-backdrop {
          position: absolute;
          inset: 0;

          overflow: hidden;

          background: #f4eadc;

          isolation: isolate;

          pointer-events: none;
        }

        .ume-glow {
          position: absolute;

          left: 50%;
          top: 50%;

          border-radius: 9999px;

          filter:
            blur(clamp(70px, 7vw, 125px))
            saturate(1.15);

          mix-blend-mode: multiply;

          transition:
            opacity 1000ms ease;

          will-change: transform;

          transform-origin: center;

          backface-visibility: hidden;
        }

        .glow-berry {
          background:
            radial-gradient(
              circle,
              rgba(132, 50, 78, 0.72) 0%,
              rgba(132, 50, 78, 0.48) 31%,
              rgba(132, 50, 78, 0.20) 51%,
              transparent 72%
            );
        }

        .glow-gold {
          background:
            radial-gradient(
              circle,
              rgba(203, 126, 40, 0.82) 0%,
              rgba(203, 126, 40, 0.54) 32%,
              rgba(203, 126, 40, 0.21) 52%,
              transparent 72%
            );
        }

        .glow-dusk {
          background:
            radial-gradient(
              circle,
              rgba(111, 83, 121, 0.65) 0%,
              rgba(111, 83, 121, 0.42) 32%,
              rgba(111, 83, 121, 0.18) 52%,
              transparent 72%
            );
        }

        .glow-peach {
          background:
            radial-gradient(
              circle,
              rgba(211, 139, 82, 0.72) 0%,
              rgba(211, 139, 82, 0.47) 32%,
              rgba(211, 139, 82, 0.18) 52%,
              transparent 72%
            );
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .ume-glow {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

function chooseNextPoint(
  current: GlowPoint,
  others: GlowPoint[],
): GlowPoint {
  let best =
    randomPoint();

  let bestScore =
    Number.NEGATIVE_INFINITY;

  for (
    let attempt = 0;
    attempt < 28;
    attempt += 1
  ) {
    const candidate =
      randomPoint();

    const nearest =
      others.length === 0
        ? 100
        : Math.min(
            ...others.map(
              (other) =>
                distance(
                  candidate,
                  other,
                ),
            ),
          );

    const travel =
      distance(
        candidate,
        current,
      );

    /*
     * We want the glows to normally
     * have breathing room, but also
     * allow them to naturally cross
     * each other sometimes.
     */
    const overlapBonus =
      nearest >= 12 &&
      nearest <= 29
        ? 15
        : 0;

    const stackedPenalty =
      nearest < 8
        ? 28
        : 0;

    const smallMovementPenalty =
      travel < 18
        ? 35
        : 0;

    const score =
      nearest * 0.48 +
      travel * 0.31 +
      overlapBonus -
      stackedPenalty -
      smallMovementPenalty;

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function randomPoint(): GlowPoint {
  return {
    x: randomBetween(
      -42,
      42,
    ),

    y: randomBetween(
      -39,
      39,
    ),

    scale:
      randomBetween(
        0.94,
        1.17,
      ),
  };
}

function glowTransform(
  point: GlowPoint,
) {
  return `
    translate3d(
      calc(-50% + ${point.x}vw),
      calc(-50% + ${point.y}vh),
      0
    )
    scale(${point.scale})
  `;
}

function distance(
  a: GlowPoint,
  b: GlowPoint,
) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y,
  );
}

function randomBetween(
  min: number,
  max: number,
) {
  return (
    min +
    Math.random() *
      (max - min)
  );
}