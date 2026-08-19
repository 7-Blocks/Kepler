import React from "react";
import { Link } from "react-router-dom";

interface SupportCardProps {
  title: string;
  description: string;
  linkText: string;
  href: string;
  external?: boolean;
}

export const SupportCard: React.FC<SupportCardProps> = ({
  title,
  description,
  linkText,
  href,
  external,
}) => {
  const isExternal = external !== undefined ? external : href.startsWith("http");
  const cardClasses = "group block relative overflow-hidden rounded-2xl border border-[#1B2436] bg-[#0C1220] p-6 min-h-[160px] no-underline hover:-translate-y-1 transition-all duration-300 hover:border-[#4FE0C8]/50 hover:shadow-[0_4px_20px_rgba(79,224,200,0.1)]";

  const content = (
    <div className="relative z-10 flex flex-col h-full">
      <h3 className="font-necosmic font-semibold text-lg text-[#E7EBF3] m-0 mb-2 group-hover:text-[#4FE0C8] transition-colors">
        {title}
      </h3>
      <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed m-0 mb-4 flex-1">
        {description}
      </p>
      <div className="font-technical-data text-xs text-[#4FE0C8] uppercase tracking-wider flex items-center gap-2 mt-auto">
        {linkText}
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className={cardClasses}>
      {content}
    </Link>
  );
};
