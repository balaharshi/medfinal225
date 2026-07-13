import { Globe, Stethoscope, Shield, MapPin, Phone, Mail, Home, Activity, Beaker, HeartPulse, UserCircle, ShoppingCart, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-left">
      <div className="border-b border-slate-100 pb-5 mb-8">
        <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">About Us</span>
        <h1 className="text-3xl font-black text-blue-950">MedZiva International Healthcare L.L.C</h1>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
          <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-medical-green" />
            Who We Are
          </h2>
          <p className="text-sm text-slate-600 leading-7">
            MedZiva is a premium healthcare marketplace based in Dubai, United Arab Emirates. We connect patients with DHA compliant healthcare providers, enabling seamless booking of home healthcare services, lab tests at home, IV therapy, physiotherapy, and medical equipment rental.
          </p>
          <p className="text-sm text-slate-600 leading-7 mt-3">
            As an aggregator and booking facilitation platform, MedZiva does not directly provide medical services. All healthcare services are delivered by independent, licensed third-party providers who meet Dubai Health Authority (DHA) standards.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
          <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-medical-green" />
            Our Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <Home className="w-4 h-4" />, title: 'Home Healthcare', desc: 'Nursing care, doctor on call, long-term care, and specialized medical support at your doorstep.' },
              { icon: <Beaker className="w-4 h-4" />, title: 'Lab Tests at Home', desc: 'Routine blood tests, preventive health packages, STD screening, and genetic testing with home sample collection.' },
              { icon: <Activity className="w-4 h-4" />, title: 'Physiotherapy', desc: 'At-home physiotherapy sessions for recovery, rehab, and chronic pain management.' },
              { icon: <HeartPulse className="w-4 h-4" />, title: 'IV Therapy', desc: 'Nurse-administered IV nutrient drips, energy infusions, and premium NAD+ therapy.' },
              { icon: <UserCircle className="w-4 h-4" />, title: 'Speech & Occupational Therapy', desc: 'Specialized therapy sessions for children and adults at home.' },
              { icon: <ShoppingCart className="w-4 h-4" />, title: 'Medical Equipment', desc: 'Rent certified medical equipment including hospital beds, oxygen concentrators, and monitoring devices.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 bg-medical-green/10 rounded-lg flex items-center justify-center text-medical-green shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-blue-950 mb-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
          <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-medical-green" />
            Our Commitment
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Licensed Providers', desc: 'Healthcare providers on our platform hold valid DHA and relevant authority licenses where applicable.' },
              { label: 'Data Privacy', desc: 'We implement strict data protection standards to safeguard your personal and health information.' },
              { label: 'Transparent Pricing', desc: 'All service prices are displayed upfront. No hidden charges or surprise fees.' },
              { label: 'Quality Assurance', desc: 'We vet all providers through a rigorous onboarding process to ensure consistent care quality.' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-medical-green shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-extrabold text-blue-950">{item.label}: </span>
                  <span className="text-xs text-slate-600">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
          <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-medical-green" />
            Contact Us
          </h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-medical-green shrink-0" />
              <span>Al Gaizi Plaza, Al Garhoud, Dubai, UAE</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-medical-green shrink-0" />
              <a href="tel:+971559510794" className="hover:text-medical-green transition-colors">+971 55 951 0794</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-medical-green shrink-0" />
              <a href="mailto:info@medzivahealthcare.com" className="hover:text-medical-green transition-colors">info@medzivahealthcare.com</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
