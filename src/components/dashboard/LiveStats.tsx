"use client";

import { useEffect, useMemo, useState } from "react";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  launched: boolean;
};

export function LiveStats({
  initialRegisteredUsers,
  launchDateIso,
  initialNowIso,
}: {
  initialRegisteredUsers: number;
  launchDateIso: string;
  initialNowIso: string;
}) {
  const [registeredUsers, setRegisteredUsers] = useState(initialRegisteredUsers);
  const [countdown, setCountdown] = useState(() =>
    getCountdown(launchDateIso, initialNowIso)
  );
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [counterAvailable, setCounterAvailable] = useState(true);

  const launchDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(launchDateIso)),
    [launchDateIso]
  );

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setCountdown(getCountdown(launchDateIso, new Date().toISOString()));
    }, 1000);

    async function refreshRegistrations() {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        if (!response.ok) throw new Error("Stats are unavailable");
        const data = (await response.json()) as { registeredUsers: number };
        setRegisteredUsers(data.registeredUsers);
        setLastUpdated(
          new Intl.DateTimeFormat("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          }).format(new Date())
        );
        setCounterAvailable(true);
      } catch {
        setCounterAvailable(false);
      }
    }

    void refreshRegistrations();
    const registrationTimer = window.setInterval(refreshRegistrations, 15000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearInterval(registrationTimer);
    };
  }, [launchDateIso]);

  return (
    <section className="live-stat-grid" aria-label="UmeLike live statistics">
      <article className="live-stat-card live-stat-card--members">
        <div className="live-stat-card__header">
          <div>
            <p>Registered members</p>
            <span>Everyone who has created an UmeLike account</span>
          </div>
          <div className={`live-indicator ${counterAvailable ? "" : "is-paused"}`}>
            <i aria-hidden="true" />
            {counterAvailable ? "Live" : "Paused"}
          </div>
        </div>

        <div className="member-counter" aria-live="polite">
          {registeredUsers.toLocaleString("en-IN")}
        </div>

        <div className="live-stat-card__footer">
          <span>Updates automatically every 15 seconds</span>
          <span>Last checked: {lastUpdated}</span>
        </div>
      </article>

      <article className="live-stat-card live-stat-card--countdown">
        <div className="live-stat-card__header">
          <div>
            <p>Launch countdown</p>
            <span>Target launch date: {launchDateLabel}</span>
          </div>
          <div className="calendar-mark" aria-hidden="true">01</div>
        </div>

        {countdown.launched ? (
          <div className="launch-complete" role="status">
            UmeLike is ready to launch.
          </div>
        ) : (
          <div className="countdown-units" aria-label={`${countdown.days} days until launch`}>
            <CountdownUnit value={countdown.days} label="Days" primary />
            <CountdownUnit value={countdown.hours} label="Hours" />
            <CountdownUnit value={countdown.minutes} label="Minutes" />
            <CountdownUnit value={countdown.seconds} label="Seconds" />
          </div>
        )}

        <div className="live-stat-card__footer">
          <span>Countdown updates every second</span>
          <span>India Standard Time</span>
        </div>
      </article>
    </section>
  );
}

function CountdownUnit({
  value,
  label,
  primary = false,
}: {
  value: number;
  label: string;
  primary?: boolean;
}) {
  return (
    <div className={primary ? "is-primary" : ""}>
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{label}</span>
    </div>
  );
}

function getCountdown(launchDateIso: string, nowIso: string): Countdown {
  const remaining = Math.max(
    0,
    new Date(launchDateIso).getTime() - new Date(nowIso).getTime()
  );
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const minute = 60 * 1000;

  return {
    days: Math.floor(remaining / day),
    hours: Math.floor((remaining % day) / hour),
    minutes: Math.floor((remaining % hour) / minute),
    seconds: Math.floor((remaining % minute) / 1000),
    launched: remaining === 0,
  };
}
