export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface TroubleshootingScenario {
  id: string;
  problem: string;
  likelyCause: string;
  suggestedFix: string;
}

export const faqs: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is Kepler?",
    answer:
      "Kepler is an AI-powered orbital intelligence platform designed to monitor satellites, track space debris, predict collisions, and resolve conflicts before they escalate into dangerous situations.",
  },
  {
    id: "faq-2",
    question: "How do I use the dashboard?",
    answer:
      "Once you log in, the dashboard acts as your operational command center. You can view satellite telemetries, access collision center predictions, and monitor space traffic in real-time.",
  },
  {
    id: "faq-3",
    question: "Why is satellite data missing?",
    answer:
      "Satellite data may occasionally be missing due to temporary telemetry drops, sensor recalibrations, or when a satellite passes through a blind spot. Check our Space Weather section to see if solar activity is interfering.",
  },
  {
    id: "faq-4",
    question: "How do I report a bug?",
    answer:
      "You can report a bug by opening an issue on our GitHub repository. Please provide as much context as possible, including steps to reproduce, expected behavior, and screenshots if applicable.",
  },
  {
    id: "faq-5",
    question: "How can I contribute?",
    answer:
      "We welcome contributions! Please review our Contribution Guide for details on our branching strategy, coding standards, and how to submit pull requests via GitHub.",
  },
];

export const troubleshootingScenarios: TroubleshootingScenario[] = [
  {
    id: "ts-1",
    problem: "Satellite data not loading",
    likelyCause: "Network interruption or API rate limiting.",
    suggestedFix: "Refresh the page. If the issue persists, check your API key usage or try again in a few minutes.",
  },
  {
    id: "ts-2",
    problem: "Login/API errors",
    likelyCause: "Expired session token or incorrect credentials.",
    suggestedFix: "Sign out and sign back in. Ensure your API keys are correctly configured in the settings.",
  },
  {
    id: "ts-3",
    problem: "Slow dashboard",
    likelyCause: "High volume of rendered elements (e.g., thousands of debris objects) overwhelming the browser.",
    suggestedFix: "Apply filters to limit the time range or object count, or enable reduced motion in your OS settings.",
  },
  {
    id: "ts-4",
    problem: "Empty data",
    likelyCause: "No objects match the current filters or query parameters.",
    suggestedFix: "Clear your active filters in the dashboard and verify that the date range spans an active period.",
  },
];
