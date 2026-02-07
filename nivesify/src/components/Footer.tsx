import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#E9ECE8] border-t border-[#1F2937]/10">
      <div className="max-w-7xl mx-auto px-6 py-24">

        {/* TOP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 mb-24">

          {/* Brand */}
          <div>
            <h3 className="text-2xl font-serif lowercase text-[#1F2937] mb-4">
              nivesify
            </h3>
            <p className="text-sm font-serif text-[#1F2937]/70 leading-relaxed max-w-xs">
              A calm, non-transactional space for Indian investors
              to understand money, reach “enough,”
              and live better lives.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#6B7C70] font-serif">
              Explore
            </p>
            {[
              { name: 'Wealth Dashboard', href: '/dashboard' },
              { name: 'Mutual Fund Portfolio Analysis', href: '/mutual-fund-health-check' },
              { name: 'Active Funds', href: '/dashboard/active-funds' },
              { name: 'Index Funds', href: '/dashboard/index-funds' },
              { name: 'Life Calculators', href: '/dashboard/calculators' }
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-sm font-serif text-[#1F2937]/70 hover:text-[#1F2937] transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Philosophy */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6B7C70] font-serif mb-4">
              Philosophy
            </p>
            <p className="text-sm font-serif italic text-[#1F2937]/70 leading-relaxed">
              “Enough is not a number.
              It is the moment money
              stops interfering with life.”
            </p>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="pt-10 border-t border-[#1F2937]/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-serif text-[#1F2937]/50">
            © {new Date().getFullYear()} Nivesify. Built with restraint.
          </p>
          <p className="text-xs font-serif italic text-[#1F2937]/50">
            Thoughtful Money, Better Life
          </p>
        </div>

      </div>
    </footer>
  )
}