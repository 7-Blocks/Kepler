import React, { useState, useMemo, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { FAQSearch } from "@/components/FAQSearch";
import { FAQAccordion } from "@/components/FAQAccordion";
import { TroubleshootingCard } from "@/components/TroubleshootingCard";
import { SupportCard } from "@/components/SupportCard";
import { faqs, troubleshootingScenarios } from "@/data/faqData";

export const SupportPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!searchTerm.trim()) return faqs;
    const lowerSearch = searchTerm.trim().toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lowerSearch) ||
        faq.answer.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  return (
    <div className="bg-[#0C1220] min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-[1180px] mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="font-technical-data text-xs text-[#4FE0C8] tracking-[0.22em] mb-4">
            SUPPORT & FAQS
          </div>
          <h1 className="font-necosmic font-bold text-4xl sm:text-5xl md:text-6xl text-[#E7EBF3] m-0 mb-6 tracking-tight">
            How can we help?
          </h1>
          <p className="font-body-ui text-[1.1rem] text-[#8892A6] max-w-2xl mx-auto mb-10">
            Search our knowledge base for quick answers or browse the common troubleshooting steps below.
          </p>
          
          <FAQSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>

        {/* FAQs Section */}
        <section className="mb-20">
          <div className="mb-8 text-center">
            <h2 className="font-necosmic font-semibold text-2xl sm:text-3xl text-[#E7EBF3]">
              Frequently Asked Questions
            </h2>
          </div>
          <FAQAccordion items={filteredFaqs} reduceMotion={reduce} />
        </section>

        {/* Troubleshooting Section */}
        <section className="mb-20">
          <div className="mb-8 max-w-3xl mx-auto">
            <h2 className="font-necosmic font-semibold text-2xl sm:text-3xl text-[#E7EBF3] mb-3">
              Common Troubleshooting
            </h2>
            <p className="font-body-ui text-[#8892A6]">
              Quick fixes for the most frequently encountered issues.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {troubleshootingScenarios.map((scenario) => (
              <TroubleshootingCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        </section>

        {/* Resource Links Section */}
        <section className="mb-20">
          <div className="mb-8 max-w-3xl mx-auto">
            <h2 className="font-necosmic font-semibold text-2xl sm:text-3xl text-[#E7EBF3] mb-3">
              Resources & Documentation
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            <SupportCard
              title="Documentation"
              description="Comprehensive guides on using the Kepler dashboard and API."
              linkText="Read Docs"
              href="/docs"
            />
            <SupportCard
              title="GitHub Issues"
              description="Report bugs or request new features on our public tracker."
              linkText="View Issues"
              href="https://github.com/7-Blocks/Kepler/issues"
            />
            <SupportCard
              title="Discussions"
              description="Join the community to discuss space traffic management."
              linkText="Join Discussion"
              href="https://github.com/7-Blocks/Kepler/discussions"
            />
            <SupportCard
              title="Contribution Guide"
              description="Learn how to contribute to the Kepler open-source project."
              linkText="Start Contributing"
              href="https://github.com/7-Blocks/Kepler/blob/main/CONTRIBUTING.md"
            />
            <SupportCard
              title="Changelog"
              description="See what's new and track recent updates to the platform."
              linkText="View Changelog"
              href="https://github.com/7-Blocks/Kepler/releases"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center relative overflow-hidden rounded-3xl border border-[#1B2436] bg-[#0C1220]/80 p-12 max-w-4xl mx-auto">
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(circle at 50% 120%, rgba(79,224,200,0.15), transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <h2 className="font-necosmic font-semibold text-3xl text-[#E7EBF3] mb-4">
              Can't find what you need?
            </h2>
            <p className="font-body-ui text-[#8892A6] mb-8">
              Reach out to the community or open an issue and we'll get back to you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/7-Blocks/Kepler/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body-ui font-semibold text-[15px] text-[#060A14] bg-[#4FE0C8] hover:bg-[#3bc4b0] rounded-lg px-7 py-3.5 transition-colors no-underline inline-block shadow-[0_0_15px_rgba(79,224,200,0.2)] hover:shadow-[0_0_20px_rgba(79,224,200,0.4)]"
              >
                Open Issue
              </a>
              <a
                href="https://github.com/7-Blocks/Kepler/discussions/new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body-ui font-semibold text-[15px] text-[#E7EBF3] bg-transparent border border-[#1B2436] hover:border-[#4FE0C8]/50 hover:bg-[#1B2436]/50 rounded-lg px-7 py-3.5 transition-colors no-underline inline-block"
              >
                Start Discussion
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupportPage;
