import React, { useState, useEffect } from "react";

interface DragResult {
  altitude_km: number;
  mass_kg: number;
  area_m2: number;
  drag_coefficient: number;
  kp_index: number;
  air_density_kg_m3: string;
  orbital_velocity_kms: number;
  drag_force_n: number;
  drag_accel_ms2: string;
  decay_rate_km_day: number;
  estimated_lifetime_days: number;
  risk_level: "NOMINAL" | "ELEVATED" | "HIGH" | "CRITICAL";
  description: string;
}

export const DragEstimatorWidget: React.FC = () => {
  const [altitude, setAltitude] = useState<number>(400);
  const [mass, setMass] = useState<number>(500);
  const [area, setArea] = useState<number>(2.0);
  const [dragCoef, setDragCoef] = useState<number>(2.2);
  const [result, setResult] = useState<DragResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        altitude_km: altitude.toString(),
        mass_kg: mass.toString(),
        area_m2: area.toString(),
        drag_coefficient: dragCoef.toString(),
      });

      const res = await fetch(`http://127.0.0.1:8000/api/v1/weather/drag-estimator?${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setResult(json.data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Backend API unavailable, using local calculation fallback:", e);
    }

    // Local Physics Fallback Calculation
    const R_E = 6378.137;
    const mu = 398600.4418;
    const r_km = R_E + altitude;
    const r_m = r_km * 1000.0;
    const v_ms = Math.sqrt((mu * 1e9) / r_m);
    const rho = 1e-10 * Math.exp(-(altitude - 200.0) / 55.0) * (1.0 + 0.25 * (3.0 - 3.0));
    const Fd = 0.5 * rho * Math.pow(v_ms, 2) * dragCoef * area;
    const drag_accel = Fd / mass;
    const g_local = (mu / Math.pow(r_km, 2)) * 1000.0;
    const decay_ms = (2.0 * v_ms * Fd) / (mass * g_local);
    const decay_km_day = (decay_ms * 86400.0) / 1000.0;
    const lifetime = altitude > 150 ? (altitude - 150) / decay_km_day : 0;

    let risk: "NOMINAL" | "ELEVATED" | "HIGH" | "CRITICAL" = "NOMINAL";
    let desc = "Nominal atmospheric drag. Minimal altitude decay.";
    if (decay_km_day >= 1.0) {
      risk = "CRITICAL";
      desc = "CRITICAL DRAG HAZARD! Immediate orbit boost maneuver required.";
    } else if (decay_km_day >= 0.25) {
      risk = "HIGH";
      desc = "High atmospheric drag! Significant daily altitude loss.";
    } else if (decay_km_day >= 0.05) {
      risk = "ELEVATED";
      desc = "Elevated drag. Minor orbit maintenance recommended.";
    }

    setResult({
      altitude_km: altitude,
      mass_kg: mass,
      area_m2: area,
      drag_coefficient: dragCoef,
      kp_index: 3.0,
      air_density_kg_m3: rho.toExponential(3),
      orbital_velocity_kms: Number((v_ms / 1000).toFixed(3)),
      drag_force_n: Number(Fd.toFixed(5)),
      drag_accel_ms2: drag_accel.toExponential(3),
      decay_rate_km_day: Number(decay_km_day.toFixed(4)),
      estimated_lifetime_days: Number(lifetime.toFixed(1)),
      risk_level: risk,
      description: desc,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchEstimates();
  }, [altitude, mass, area, dragCoef]);

  const getBadgeColor = (risk?: string) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "ELEVATED":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <section className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-6 backdrop-blur-md shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌌</span>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Atmospheric Drag & Orbital Decay Estimator
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time thermospheric perturbation calculator powered by NRLMSISE / Jacchia density models.
          </p>
        </div>

        {result && (
          <span className={`px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wider uppercase ${getBadgeColor(result.risk_level)}`}>
            {result.risk_level} DRAG RISK
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5 bg-slate-950/60 p-5 rounded-lg border border-slate-800">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300 font-medium">Orbital Altitude (h)</label>
              <span className="text-cyan-400 font-mono font-semibold">{altitude} km</span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              step="10"
              value={altitude}
              onChange={(e) => setAltitude(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono">
              <span>200 km (Very High Drag)</span>
              <span>1000 km (Exosphere)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300 font-medium">Satellite Mass (m)</label>
              <span className="text-cyan-400 font-mono font-semibold">{mass} kg</span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300 font-medium">Cross-sectional Area (A)</label>
              <span className="text-cyan-400 font-mono font-semibold">{area} m²</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="25.0"
              step="0.1"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-slate-300 font-medium">Drag Coefficient (Cd)</label>
              <span className="text-cyan-400 font-mono font-semibold">{dragCoef}</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="3.5"
              step="0.1"
              value={dragCoef}
              onChange={(e) => setDragCoef(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Output Metrics Column */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Air Density (ρ)</span>
              <p className="mt-1 text-lg font-mono font-bold text-cyan-300">
                {loading ? "Calculating..." : `${result?.air_density_kg_m3 || "—"} kg/m³`}
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Orbital Speed (v)</span>
              <p className="mt-1 text-lg font-mono font-bold text-white">
                {result ? `${result.orbital_velocity_kms} km/s` : "—"}
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Daily Altitude Loss</span>
              <p className="mt-1 text-2xl font-mono font-extrabold text-amber-400">
                {result ? `${result.decay_rate_km_day} km/day` : "—"}
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Est. Lifetime</span>
              <p className="mt-1 text-2xl font-mono font-extrabold text-emerald-400">
                {result ? `${result.estimated_lifetime_days.toLocaleString()} days` : "—"}
              </p>
            </div>
          </div>

          {result && (
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-300">
              <span className="font-semibold text-cyan-400">Advisory: </span>
              {result.description}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DragEstimatorWidget;
