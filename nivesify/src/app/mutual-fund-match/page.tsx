import AnalysisTabs from "@/components/AnalysisTabs";

export default function MutualFundMatchPage() {
	return (
		<div className="min-h-screen bg-[#F5F8FF] text-[#1F2937]">
			<section className="relative overflow-hidden px-5 pt-14 pb-14">
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
					<div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
				</div>
				<div className="relative max-w-6xl mx-auto">
					<AnalysisTabs />
				</div>
			</section>
		</div>
	);
}
