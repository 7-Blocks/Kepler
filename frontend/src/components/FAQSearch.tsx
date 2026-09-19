import React from "react";
import { Search } from "lucide-react";

interface FAQSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const FAQSearch: React.FC<FAQSearchProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto mb-10">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[#8892A6]" aria-hidden="true" />
      </div>
      <input
        type="text"
        className="w-full bg-[#0C1220] border border-[#1B2436] focus:border-[#4FE0C8] text-[#E7EBF3] rounded-2xl py-4 pl-12 pr-4 outline-none transition-colors duration-200 shadow-sm placeholder-[#8892A6]"
        placeholder="Search for questions or answers..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search FAQs"
      />
    </div>
  );
};
