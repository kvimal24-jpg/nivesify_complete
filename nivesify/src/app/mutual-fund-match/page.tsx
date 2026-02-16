
import Link from "next/link";
import AnalysisTabs from "@/components/AnalysisTabs";
import { FaRegLightbulb } from "react-icons/fa";

export default function MutualFundMatchPage() {
	return (
		<div className="bg-[#F5F8FF] text-[#1F2937] min-h-screen">
			<section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden px-6 pt-14 pb-8">
				{/* Fog / Noise */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
					<div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
				</div>

				{/* Compass Graphic */}
				<div className="absolute left-1/2 top-1/2 w-[240px] h-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2F5D7C]/30 pointer-events-none opacity-60">
					<div className="absolute inset-6 rounded-full border border-[#2F5D7C]/20"></div>
					<div className="absolute left-1/2 top-0 h-full w-px bg-[#2F5D7C]/40"></div>
					<div className="absolute top-1/2 left-0 w-full h-px bg-[#2F5D7C]/40"></div>
					<div className="absolute left-1/2 top-1/2 w-3 h-3 bg-[#9BB4D6] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
				</div>

				{/* Hero Copy */}
				<div className="relative max-w-4xl text-center space-y-4 z-10">
					<p className="text-[11px] uppercase tracking-[0.32em] text-[#6B7C70] font-serif">
						your money has dreams. we help them come true.
					</p>
					<h1 className="text-3xl md:text-5xl font-serif tracking-tight leading-[1.05] lowercase text-[#1F2937]">
						find my fund
						<br />
						<span className="text-[#2F5D7C]">stop guessing. start investing smart.</span>
					</h1>
					<p className="text-sm md:text-lg font-serif italic text-[#6B7C70]">
						We analyze thousands of funds and build your plan around your goals.
					</p>
					<div className="max-w-2xl mx-auto">
						<p className="text-xs md:text-sm font-serif leading-relaxed text-[#1F2937]/90">
							Simple, personal, and always in your best interest.
						</p>
					</div>
					<Link href="#get-started" className="inline-block mt-6 px-8 py-4 rounded-full bg-[#2F5D7C] text-white font-bold text-lg shadow-lg hover:bg-[#1F2937] transition-all">
						Get Started
					</Link>
				</div>
				{/* Navigation Tabs */}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl z-20">
					<AnalysisTabs />
				</div>
			</section>
		</div>
	);
}
