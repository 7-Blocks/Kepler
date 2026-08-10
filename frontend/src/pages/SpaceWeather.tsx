import MetricCard from "@/components/space-weather/MetricCard";
const metrics = [
  {
    title: "KP Index",
    value: "5.2",
    status: "Moderate",
    footer: "+0.4 from last hour",
    icon: "🌍",
  },
  {
    title: "Solar Wind",
    value: "520 km/s",
    status: "Normal",
    footer: "Updated 2 min ago",
    icon: "💨",
  },
 {
  title: "Geomagnetic Storm",
  value: "G2",
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
  footer: "Last detected 5 min ago",
  icon: "☀️",
},
];

const SpaceWeather = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">
          Live Space Weather Dashboard
        </h1>

        <p className="mt-2 text-gray-400 max-w-3xl">
          Monitor real-time solar activity and its impact on satellites,
          communication systems, and Earth's space environment.
        </p>
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

     {/* Solar Activity */}
<section className="rounded-xl border border-cyan-500/20 bg-slate-900 p-6">
  <h2 className="text-2xl font-semibold text-white">
    Solar Activity
  </h2>

  <div className="mt-6 rounded-lg border border-cyan-500/20 bg-slate-800 p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">
          Solar Flare Trend
        </h3>
        <p className="text-sm text-gray-400">
          Latest detected flare activity
        </p>
      </div>

      <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300">
        Moderate
      </span>
    </div>

    <div className="mt-8 flex h-32 items-end justify-between gap-2">
      {[35, 55, 45, 70, 60, 85, 65].map((height, index) => (
        <div
          key={index}
          className="flex-1 rounded-t bg-cyan-400"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>

    <p className="mt-4 text-sm text-gray-400">
      Peak flare: <span className="text-white font-medium">M1.2</span>
    </p>
  </div>
</section>

    {/* CME */}
<section className="rounded-xl border border-cyan-500/20 bg-slate-900 p-6">
  <h2 className="text-2xl font-semibold text-white">
    Coronal Mass Ejections
  </h2>

  <div className="mt-6 space-y-4">
    <div className="rounded-lg bg-slate-800 p-4 flex justify-between">
      <span className="text-gray-300">Latest CME Event</span>
      <span className="text-green-400">Low Impact</span>
    </div>

    <div className="rounded-lg bg-slate-800 p-4 flex justify-between">
      <span className="text-gray-300">Propagation Status</span>
      <span className="text-cyan-400">Earth Facing</span>
    </div>

    <div className="rounded-lg bg-slate-800 p-4 flex justify-between">
      <span className="text-gray-300">Expected Arrival</span>
      <span className="text-white">~18 Hours</span>
    </div>
  </div>
</section>

    {/* Satellite Impact */}
<section className="rounded-xl border border-cyan-500/20 bg-slate-900 p-6">
  <h2 className="text-2xl font-semibold text-white">
    Satellite Impact
  </h2>

  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-gray-400">GPS Accuracy</p>
      <p className="mt-2 text-green-400 font-semibold">Stable</p>
    </div>

    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-gray-400">Radio Communication</p>
      <p className="mt-2 text-yellow-400 font-semibold">Minor Disturbance</p>
    </div>

    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-gray-400">Satellite Operations</p>
      <p className="mt-2 text-green-400 font-semibold">Normal</p>
    </div>

    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-gray-400">Navigation Systems</p>
      <p className="mt-2 text-green-400 font-semibold">Operational</p>
    </div>
  </div>
</section>
</div>
);
};

export default SpaceWeather;