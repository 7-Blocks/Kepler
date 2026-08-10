import React, { useEffect, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { MaterialIcon } from "@/components/MaterialIcon";
import { rocketLaunches } from "@/constants/rocketLaunches";

const getTimeRemaining = (launchTime: string) => {
  const diff = new Date(launchTime).getTime() - Date.now();

  if (diff <= 0) {
    return "LIFTOFF 🚀";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `T-${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const statusBadge = (status: string) => {
  switch (status) {
    case "Upcoming":
      return "bg-green-500/20 text-green-400";
    case "Delayed":
      return "bg-yellow-500/20 text-yellow-400";
    case "Scrubbed":
      return "bg-red-500/20 text-red-400";
    case "Completed":
      return "bg-blue-500/20 text-blue-400";
    default:
      return "bg-primary/20 text-primary";
  }
};

const RocketLaunchCountdown: React.FC = () => {
    const [, setTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((v) => v + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <MagicCard
      mode="orb"
      glowFrom="#FF6B35"
      glowTo="#FFD166"
      glowOpacity={0.25}
      className="rounded-xl border border-white/10"
      fillClassName="bg-[#0A0F1A]"
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <MaterialIcon
            name="rocket_launch"
            className="text-primary-container text-lg"
          />

          <h2 className="font-label-caps text-primary uppercase tracking-wider">
            Upcoming Rocket Launches
          </h2>
        </div>

        <div className="space-y-4">
          {rocketLaunches.map((launch) => (
            <div
              key={launch.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-4 last:border-none"
            >
              {/* Left */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{launch.missionPatch}</span>

                  <p className="font-semibold text-white">
                    {launch.mission}
                  </p>
                </div>

                <p className="text-xs text-primary/60">
                  {launch.provider} • {launch.vehicle}
                </p>

                <p className="text-xs text-primary/40">
                  {launch.launchSite}
                </p>

                <p className="text-xs text-primary/50">
                  Target Orbit: {launch.targetOrbit}
                </p>
              </div>

              {/* Right */}
              <div className="text-right space-y-2 md:min-w-[220px]">
                <p className="font-mono text-primary-container text-lg font-bold">
                  {getTimeRemaining(launch.launchTime)}
                </p>

                <p className="text-xs text-primary/50">
                  {new Date(launch.launchTime).toLocaleString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                    timeZoneName: "short",
                  })}
                </p>

                <span
                  className={`inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${statusBadge(
                    launch.status
                  )}`}
                >
                  {launch.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MagicCard>
  );
};

export default RocketLaunchCountdown;