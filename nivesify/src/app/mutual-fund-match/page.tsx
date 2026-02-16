
import Link from "next/link";
import AnalysisTabs from "@/components/AnalysisTabs";
import { FaRegLightbulb } from "react-icons/fa";

export default function MutualFundMatchPage() {
	return (
		<div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">
			<section className="relative overflow-hidden px-5 pt-14 pb-14" style={{background: "linear-gradient(135deg, #2F5D7C 0%, #9BB4D6 100%)"}}>
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
					<div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
				</div>
				<div className="relative max-w-6xl mx-auto">
					<AnalysisTabs />
					<div className="mt-12 flex flex-col items-center justify-center text-center">
						<span className="text-4xl md:text-5xl mb-4 text-white"><FaRegLightbulb className="inline-block mr-2 align-middle" />Find My Fund</span>
						<h1 className="mt-4 text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
							Stop guessing. Start investing smart.
						</h1>
						<p className="mt-4 text-lg md:text-2xl font-serif text-[#E6E8E1] max-w-2xl">
							We help you build a smart investment plan, analyze thousands of funds, and customize everything for your dreams.
						</p>
						<Link href="#get-started" className="mt-8 px-8 py-4 rounded-full bg-white text-[#2F5D7C] font-bold text-lg shadow-lg hover:bg-[#E6E8E1] transition-all">
							Get Started
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
