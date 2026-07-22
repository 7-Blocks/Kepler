type MetricCardProps = {
  title: string;
  value: string;
  status: string;
  footer: string;
  icon: string;
};

const MetricCard = ({
  title,
  value,
  status,
  footer,
  icon,
}: MetricCardProps) => {
    return (
<div className="min-h-[260px] rounded-xl border border-cyan-500/20 bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]">    <div className="flex items-center justify-between">
  <p className="text-sm uppercase tracking-wider text-gray-400">
    {title}
  </p>

  <span className="text-3xl">
    {icon}
  </span>
 </div>
 <h2 className="mt-5 text-5xl font-extrabold tracking-tight text-cyan-400">
  {value}
</h2>

<span className="mt-4 inline-block rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
  {status}
</span>

<p className="mt-5 text-sm text-gray-500">
  {footer}
</p>
</div>
);
};   

export default MetricCard; 