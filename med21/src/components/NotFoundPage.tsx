import { motion } from 'motion/react';
import { Home, ArrowLeft, Search } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export default function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 bg-medical-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-black text-medical-green">404</span>
        </div>
        <h1 className="text-2xl font-black text-blue-950 mb-3">Page Not Found</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to our healthcare services.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGoHome}
            className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-sm py-3 px-6 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm py-3 px-6 rounded-xl cursor-pointer transition-all border border-slate-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
