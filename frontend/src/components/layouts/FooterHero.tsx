import { Link } from "react-router-dom";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Particles } from "@/components/ui/particles";

export default function FooterHero() {
    return (
        <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-b from-[#0A1020] via-[#091425] to-[#050811] backdrop-blur-xl px-8 py-24 text-center">
            <div className="absolute inset-0 overflow-hidden rounded-[40px]">
                <Particles
                    className="absolute inset-0"
                    color="#4FE0C8"
                    quantity={180}
                    refresh={false}
                />
            </div>
            {/* Background Glow */}
            <div className="absolute inset-0">
                <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />
                <div className="absolute left-1/2 top-16 h-[700px] w-[700px] -translate-x-1/2 rounded-full border border-cyan-400/5" />
                <div className="absolute left-1/2 top-28 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-cyan-400/5" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">

                {/* Badge */}

                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    AI-Powered Autonomous Space Traffic
                </div>

                {/* Heading */}

                <h2 className="mt-8 text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
                    Ready to Shape the
                    <br />

                    <span className="bg-gradient-to-r from-cyan-300 via-[#5EE7FF] to-[#8B5CF6] bg-clip-text text-transparent">
                        Future of Space Traffic?
                    </span>
                </h2>
                <div
                    className="absolute left-1/2 top-44 -translate-x-1/2 h-56 w-[36rem] rounded-full blur-[130px] bg-cyan-500/10"
                />
                {/* Description */}

                <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-400">
                    Discover how Kepler is building the next generation of
                    AI-powered autonomous space traffic management for safer,
                    smarter, and more efficient orbital operations.
                </p>

                {/* Buttons */}

                <div className="mt-14 flex flex-wrap justify-center gap-6">

                    <Link to="/dashboard">
                        <ShimmerButton className="rounded-full px-8 py-3 text-base font-semibold">
                            Get Started
                        </ShimmerButton>
                    </Link>

                    <Link
                        to="/#contact"
                        className="rounded-full border border-white/15 bg-white/5 px-8 py-3 font-medium text-white backdrop-blur transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
                    >
                        Contact Us
                    </Link>

                </div>

                <div className="mt-16 flex flex-wrap justify-center gap-10 text-center">

                    <div>
                        <h3 className="text-3xl font-bold text-cyan-300">12,400+</h3>
                        <p className="text-slate-500 text-sm">Objects Tracked</p>
                    </div>

                    <div>
                        <h3 className="text-3xl font-bold text-cyan-300">99.982%</h3>
                        <p className="text-slate-500 text-sm">Conjunction Recall</p>
                    </div>

                    <div>
                        <h3 className="text-3xl font-bold text-cyan-300">&lt;40ms</h3>
                        <p className="text-slate-500 text-sm">Decision Latency</p>
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-cyan-300">0</h3>
                        <p className="text-slate-500 text-sm">Unresolved Conflicts, to date</p>
                    </div>

                </div>

            </div>
        </section>
    );
}