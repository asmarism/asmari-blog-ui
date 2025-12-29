import React, { useState, useEffect, useMemo } from 'react';
import { 
  Megaphone, 
  Film, 
  MessageSquare, 
  Sparkles, 
  LayoutGrid, 
  ChevronLeft, 
  Search, 
  Loader2,
  AlertCircle,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { Category, Post } from './types';
import { fetchWordPressPosts } from './wpService';

const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    title: 'تأملات في الفن والجمال الرقمي',
    excerpt: 'هذا المحتوى يظهر لأن الاتصال بمدونتك لا يزال قيد الإعداد. تأكد من تفعيل الـ API في ووردبريس.',
    category: 'تأملات',
    date: '١٥ رمضان',
    imageUrl: 'https://images.unsplash.com/photo-1518005020450-eba95a04ff17?q=80&w=800'
  }
];

// أيقونة X (تويتر سابقاً) مخصصة بصيغة SVG لضمان الدقة
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const wpPosts = await fetchWordPressPosts();
      if (wpPosts.length > 0) {
        setPosts(wpPosts);
        setIsError(false);
      } else {
        setPosts(MOCK_POSTS);
        setIsError(true);
      }
      setIsLoading(false);
    };
    loadData();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'الكل') return posts;
    return posts.filter(post => post.category === activeCategory);
  }, [activeCategory, posts]);

  const categories: {name: Category | 'الكل', icon: React.ReactNode}[] = [
    { name: 'الكل', icon: <LayoutGrid size={15} /> },
    { name: 'إعلانات', icon: <Megaphone size={15} /> },
    { name: 'أفلام', icon: <Film size={15} /> },
    { name: 'تأملات', icon: <Sparkles size={15} /> },
    { name: 'منوعات', icon: <MessageSquare size={15} /> },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen text-right" dir="rtl">
      {/* Header - Reduced padding from py-6 to py-4 */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 safe-top ${
        isScrolled ? 'glass-dark py-2' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className={`myriad-font font-bold tracking-tight transition-all duration-500 ${
              isScrolled ? 'text-2xl text-[#1B19A8]' : 'text-3xl text-white'
            }`}>
              مسودّة للنشر
            </h1>
            <p className={`myriad-font font-normal transition-all duration-500 text-slate-400 ${
              isScrolled ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-10 text-[16px] mt-0.5 opacity-100'
            }`}>
              بقلم سلمان الأسمري
            </p>
          </div>
          <button className="p-2 liquid-glass rounded-xl active:scale-90 transition-all self-center">
            <Search size={16} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main - Reduced pt-32 to pt-24 */}
      <main className="max-w-md mx-auto px-6 pt-24 pb-12 relative z-10">
        {isError && !isLoading && (
          <div className="mb-4 p-4 liquid-glass bg-[#FFA042]/10 border-[#FFA042]/20 rounded-2xl flex gap-3 items-center">
            <AlertCircle className="text-[#FFA042] flex-shrink-0" size={20} />
            <p className="text-[11px] text-[#FFA042] font-bold leading-relaxed">
              تنبيه: لم نتمكن من سحب المقالات من cms.asmari.me.
            </p>
          </div>
        )}

        {/* Categories Grid - Reduced mb-10 to mb-6 */}
        <section className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 border ${
                  activeCategory === cat.name 
                  ? 'bg-[#1B19A8] text-white shadow-lg shadow-[#1B19A8]/30 border-[#1B19A8]/50 scale-[1.02]' 
                  : 'liquid-glass text-slate-400'
                }`}
              >
                <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
                <span className="font-bold text-[11px] myriad-font">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={40} className="animate-spin text-[#1B19A8] mb-4 opacity-50" />
            <span className="text-xs font-bold text-slate-500 tracking-widest uppercase myriad-font">جاري التحميل...</span>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-700">
            {filteredPosts.map((post, idx) => (
              <article 
                key={post.id} 
                className="group liquid-glass rounded-[2rem] overflow-hidden hover:border-[#1B19A8]/50 transition-all duration-500 cursor-pointer"
                style={{ animation: `fadeInUp 0.8s ease-out ${idx * 0.1}s both` }}
              >
                <div className="aspect-video overflow-hidden relative">
                  <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt={post.title} />
                  <div className="absolute top-3 right-3 px-2.5 py-1 liquid-glass bg-black/40 rounded-lg text-[8px] font-black text-white uppercase tracking-wider myriad-font">
                    {post.category}
                  </div>
                </div>
                {/* Reduced padding from p-7 to p-5 */}
                <div className="p-5">
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mb-2 myriad-font">
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#FFA042] transition-colors myriad-font">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed opacity-90 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-start pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[#FFA042] transition-all duration-300 group-hover:gap-2.5">
                      <span className="text-[12px] font-bold myriad-font">اقرأ التدوينة</span>
                      <ChevronLeft size={14} className="mt-0.5" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer Section - Reduced padding */}
      <footer className="max-w-md mx-auto px-6 pb-10 pt-6 border-t border-white/5 relative z-10">
        <div className="flex justify-between items-center">
          <a 
            href="https://asmari.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="myriad-font text-[24px] font-normal text-white opacity-100 hover:text-[#FFA042] transition-all"
          >
            عنّي
          </a>

          <div className="flex items-center gap-2.5">
            {[
              { href: "https://x.com/asmaridotme", icon: <XIcon />, title: "X" },
              { href: "https://www.instagram.com/asmari_sm/", icon: <Instagram size={16} />, title: "Instagram" },
              { href: "https://wa.me/966560004428", icon: <MessageCircle size={16} />, title: "WhatsApp" }
            ].map((social, i) => (
              <a 
                key={i}
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg liquid-glass text-slate-300 hover:text-[#FFA042] hover:border-[#FFA042]/30 transition-all active:scale-90"
                title={social.title}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest opacity-60 myriad-font">
            جميع الحقوق محفوظة {currentYear} © سلمان الأسمري
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .safe-top { padding-top: env(safe-area-inset-top); }
      `}</style>
    </div>
  );
};

export default App;