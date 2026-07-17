import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0C1220] flex items-center justify-center p-6 text-[#E7EBF3] selection:bg-[#4FE0C8]/30 pt-[calc(var(--header-height,80px)+2rem)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(79,224,200,0.1), transparent 70%)",
        }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/5 border border-white/10 mb-8 shadow-[0_0_40px_rgba(79,224,200,0.1)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4FE0C8]">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        
        <h1 className="font-display-lg text-4xl sm:text-5xl font-bold mb-4 tracking-tight text-white">
          {title}
        </h1>
        
        <p className="font-body-ui text-lg text-[#8892A6] mb-12 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
        
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all hover:gap-3 focus:outline-none focus:ring-2 focus:ring-[#4FE0C8] focus:ring-offset-2 focus:ring-offset-[#0C1220]"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>
      </motion.div>
    </div>
  );
};

export const ProductPage = () => <PlaceholderPage title="Product" description="Explore our orbital intelligence platform features and capabilities." />;
export const SolutionsPage = () => <PlaceholderPage title="Solutions" description="Tailored solutions for satellite operators and space traffic management." />;
export const DevelopersPage = () => <PlaceholderPage title="Developers" description="API documentation, SDKs, and resources for developers building with Kepler." />;
export const DocsPage = () => <PlaceholderPage title="Documentation" description="Comprehensive guides and references for the Kepler platform." />;
export const SignInPage = () => <PlaceholderPage title="Sign In" description="Sign in to your Kepler account to access the dashboard." />;
