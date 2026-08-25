import React, { useEffect, useState } from "react";
import MetricCard from "@/components/space-weather/MetricCard";
import DragEstimatorWidget from "@/components/space-weather/DragEstimatorWidget";

interface WeatherStatus {
  overall_severity: string;
  kp_index: number;
  active_cme_count: number;
  active_flare_count: number;
  active_storm_count: number;
  active_radiation_count: number;
  source: string;
}

const defaultMetrics = [
  {
    title: "KP Index",
    value: "3.0",
    status: "Nominal",
    footer: "Real-time Geomagnetic Scale",
    icon: "🌍",
  },
  {
    title: "Solar Wind",
    value: "450 km/s",
    status: "Normal",
    footer: "Updated live",
    icon: "💨",
  },
  {
    title: "Geomagnetic Storm",
    value: "G1",
    status: "Active",
    footer: "NOAA Scale",
    icon: "🛰️",
  },
  {
    title: "Radiation Alert",
    value: "Low",
    status: "Safe",
    footer: "Operational",
    icon: "☢️",
  },
  {
    title: "Solar Flares",
    value: "M1.2",
    status: "Moderate",
    footer: "NASA DONKI API",
    icon: "☀️",
  },
];

const SpaceWeather: React.FC = () => {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/weather/status");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const data: WeatherStatus = json.data;
            setWeatherStatus(data);

            setMetrics([
              {
                title: "KP Index",
                value: data.kp_index ? data.kp_index.toString() : "3.0",
                status: data.kp_index > 5 ? "Elevated" : "Nominal",
                footer: `Source: ${data.source}`,
                icon: "🌍",
              },
              {
                title: "Active CMEs",
                value: data.active_cme_count.toString(),
                status: data.active_cme_count > 0 ? "Alert" : "Nominal",
                footer: "Coronal Mass Ejections (3d)",
                icon: "☄️",
              },
              {
                title: "Active Flares",
                value: data.active_flare_count.toString(),
                status: data.active_flare_count > 0 ? "Active" : "Quiet",
                footer: "Solar Flares (3d)",
                icon: "☀️",
              },
              {
                title: "Geomagnetic Storms",
                value: data.active_storm_count.toString(),
                status: data.overall_severity,
                footer: "Storm Index",
                icon: "🛰️",
              },
              {
                title: "Radiation Events",
                value: data.active_radiation_count.toString(),
                status: data.active_radiation_count > 0 ? "Elevated" : "Low",
                footer: "Particle Events",
                icon: "☢️",
              },
            ]);
          }
        }
      } catch (err) {
        console.warn("Could not connect to live backend weather API, using defaults:", err);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>🌞</span> Live Space Weather Intelligence
          </h1>
          <p className="mt-2 text-slate-400 max-w-3xl">
            Monitor real-time solar activity, coronal mass ejections (CMEs), NOAA geomagnetic storms, and estimate orbital drag perturbations for satellites in Low Earth Orbit.
          </p>
        </div>

        {weatherStatus && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-right">
            <span className="text-xs text-slate-400 block uppercase font-mono">Live Telemetry Provider</span>
            <span className="text-sm font-semibold text-cyan-400">{weatherStatus.source}</span>
          </div>
        )}
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            status={metric.status}
            footer={metric.footer}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* NEW FEATURE: Atmospheric Drag & Orbital Decay Estimator Widget */}
      <DragEstimatorWidget />

      {/* Solar Activity & CME Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="rounded-xl border border-cyan-500/20 bg-slate-900/80 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <span>🔥</span> Solar Activity & Flare Trends
          </h2>

          <div className="mt-6 rounded-lg border border-cyan-500/20 bg-slate-950 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Solar Flare Intensity Trend</h3>
                <p className="text-sm text-slate-400">Class M / X X-Ray Flux Detections</p>
              </div>

              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                ACTIVE CYCLE 25
              </span>
            </div>

            <div className="mt-8 flex h-32 items-end justify-between gap-2">
              {[35, 55, 45, 70, 60, 85, 65].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-300 hover:from-amber-500 hover:to-yellow-300"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Peak flare recorded: <span className="text-white font-medium">M1.2 Class</span>
            </p>
          </div>
        </section>

        {/* CME Section */}
        <section className="rounded-xl border border-cyan-500/20 bg-slate-900/80 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <span>☄️</span> Coronal Mass Ejections (CMEs)
          </h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-slate-950 p-4 flex justify-between items-center border border-slate-800">
              <span className="text-slate-300 font-medium">Latest CME Velocity</span>
              <span className="text-cyan-400 font-mono font-bold">~650 km/s</span>
            </div>

            <div className="rounded-lg bg-slate-950 p-4 flex justify-between items-center border border-slate-800">
              <span className="text-slate-300 font-medium">Earth Facing Propagation</span>
              <span className="text-emerald-400 font-semibold">Low Impact Vector</span>
            </div>

            <div className="rounded-lg bg-slate-950 p-4 flex justify-between items-center border border-slate-800">
              <span className="text-slate-300 font-medium">Thermospheric Density Impact</span>
              <span className="text-amber-400 font-semibold">+15% Density Boost</span>
            </div>
          </div>
        </section>
      </div>

      {/* Satellite Operational Impact */}
      <section className="rounded-xl border border-cyan-500/20 bg-slate-900/80 p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          <span>🛡️</span> Satellite Operations & Telemetry Risk Impact
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase tracking-wider">GNSS / GPS Accuracy</p>
            <p className="mt-2 text-emerald-400 font-bold text-lg">Stable (&lt; 2.5m)</p>
          </div>

          <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Radio Comms (HF/VHF)</p>
            <p className="mt-2 text-amber-400 font-bold text-lg">Minor Disturbance</p>
          </div>

          <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Thermospheric Drag</p>
            <p className="mt-2 text-cyan-400 font-bold text-lg">Active Monitoring</p>
          </div>

          <div className="rounded-lg bg-slate-950 p-4 border border-slate-800">
            <p className="text-slate-400 text-xs uppercase tracking-wider">Navigation Systems</p>
            <p className="mt-2 text-emerald-400 font-bold text-lg">Operational</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpaceWeather;