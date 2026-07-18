import { Share2, MessageCircle, Facebook, Link } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  className?: string;
}

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://medzivahealthcare.com';

export default function ShareButtons({ title, description, url, className = '' }: ShareButtonsProps) {
  const shareUrl = url || window.location.href;
  const fullUrl = shareUrl.startsWith('http') ? shareUrl : `${SITE_URL}${shareUrl}`;
  const shareText = `🩺 ${title} — ${description || 'Book now at MedZiva Healthcare'}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + fullUrl)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank', 'width=600,height=400');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Could not copy link');
    });
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        onClick={shareWhatsApp}
        aria-label="Share on WhatsApp"
        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      <button
        onClick={shareFacebook}
        aria-label="Share on Facebook"
        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </button>
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Copy link"
      >
        <Link className="w-4 h-4" />
      </button>
    </div>
  );
}
