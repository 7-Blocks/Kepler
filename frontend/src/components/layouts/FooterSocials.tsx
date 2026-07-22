import {
  Mail,
  Heart,
} from "lucide-react";

const socials = [
  {
    name: "Email",
    href: "mailto:contact@kepler.ai",
    icon: Mail,
  },
];

export default function FooterSocials() {
  return (
    <section className="relative">

      {/* Divider */}

      <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          {/* Copyright */}

          <div>

            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Kepler.
              All rights reserved.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              AI-Powered Autonomous Space Traffic Management Platform.
            </p>

          </div>

          {/* Social Icons */}

          <div className="flex items-center gap-4">

            {socials.map((social) => {
              const Icon = social.icon;

              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="
                    group
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.03]
                    backdrop-blur-lg
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-cyan-400/40
                    hover:bg-cyan-400/10
                    hover:shadow-[0_0_30px_rgba(94,231,255,.25)]
                  "
                >
                  <Icon
                    size={20}
                    className="
                      text-slate-400
                      transition-colors
                      duration-300
                      group-hover:text-cyan-300
                    "
                  />
                </a>
              );
            })}

          </div>

        </div>

        {/* Bottom Attribution */}

        <div className="mt-8 flex justify-center">

          <p className="flex items-center gap-2 text-sm text-slate-500">

            Built with

            <Heart
              size={14}
              className="fill-red-500 text-red-500"
            />

            by 7Blocks

          </p>

        </div>

      </div>
    </section>
  );
}