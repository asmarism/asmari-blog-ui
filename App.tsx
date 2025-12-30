
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Megaphone, 
  Film, 
  MessageSquare, 
  Sparkles, 
  LayoutGrid, 
  ChevronLeft, 
  Search, 
  Loader2, 
  Instagram,
  MessageCircle,
  ArrowRight,
  Share2,
  BrainCircuit,
  ListFilter
} from 'lucide-react';
import { Category, Post } from './types';
import { fetchWordPressPosts } from './wpService';
import { searchWithAI, AISearchResult } from './geminiService';

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// --- مكون صفحة المقال الكاملة (منفصل تماماً) ---
const PostPage = ({ post, onBack, onShare }: { post: Post, onBack: () => void, onShare: (p: Post) => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = post.title;
  }, [post]);

  return (
    <div className="entry-anim pb-20">
      <header className="fixed top-0 left-0 right-0 z-[100] glass-dark py-3 safe-top">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-[#94A3B8] font-bold text-sm active:scale-95 transition-transform">
            <ArrowRight size={20} />
            <span>الرئيسية</span>
          </button>
          <button onClick={() => onShare(post)} className="p-2 liquid-glass rounded-xl text-[#FFA042] active:scale-90"><Share2 size={18} /></button>
        </div>
      </header>

      <div className="pt-24 px-6 max-w-md mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-[#1B19A8]/20 text-[#1B19A8] rounded-full text-[10px] font-bold border border-[#1B19A8]/30">{post.category}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{post.date}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-6">{post.title}</h1>
          <div className="rounded-[2rem] overflow-hidden mb-8 shadow-2xl">
            <img src={post.imageUrl} alt={post.title} className="w-full aspect-video object-cover" />
          </div>
        </div>
        
        <div 
          className="wp-content text-slate-200 text-[17px] leading-[1.8] space-y-6" 
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        <div className="mt-12 py-8 border-t border-white/5">
          <button onClick={() => onShare(post)} className="w-full flex items-center justify-center gap-2 py-4 liquid-glass rounded-2xl border-[#FFA042]/20 text-white font-bold active:scale-95 transition-transform">
            <Share2 size={18} className="text-[#FFA042]" /> مشاركة هذه التدوينة
          </button>
        </div>
      </div>
    </div>
  );
};

// --- المكون الرئيسي للتطبيق ---
const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  
  // حالات الصفحة الرئيسية
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [sortOrder, setSortOrder] = useState<'newest' | 'recommended'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiResults, setAiResults] = useState<AISearchResult[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // تحديث المعرف بناءً على الرابط
  const parseUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrentPostId(params.get('p'));
  }, []);

  useEffect(() => {
    const init = async () => {
      const data = await fetchWordPressPosts();
      setPosts(data);
      setIsLoading(false);
      parseUrl();
    };
    init();

    window.addEventListener('popstate', parseUrl);
    return () => window.removeEventListener('popstate', parseUrl);
  }, [parseUrl]);

  const navigateToPost = (id: string) => {
    const newUrl = id ? `?p=${id}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setCurrentPostId(id);
    window.scrollTo(0, 0);
  };

  const selectedPost = useMemo(() => posts.find(p => p.id === currentPostId), [posts, currentPostId]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (aiResults.length > 0 && searchQuery) {
      const aiIds = aiResults.map(r => r.id);
      result = result.filter(p => aiIds.includes(p.id));
    } else {
      if (activeCategory !== 'الكل') result = result.filter(p => p.category === activeCategory);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
      }
    }
    if (sortOrder === 'recommended') result.sort((a, b) => b.title.length - a.title.length);
    return result;
  }, [posts, activeCategory, searchQuery, aiResults, sortOrder]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      setIsAiSearching(true);
      const results = await searchWithAI(val, posts);
      setAiResults(results);
      setIsAiSearching(false);
    } else {
      setAiResults([]);
    }
  };

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090D]">
        <Loader2 className="animate-spin text-[#1B19A8]" size={32} />
      </div>
    );
  }

  // إذا كان هناك مقال مختار، نعرض صفحة المقال فقط
  if (selectedPost) {
    return <PostPage post={selectedPost} onBack={() => navigateToPost(null as any)} onShare={handleShare} />;
  }

  // الصفحة الرئيسية الكلاسيكية
  return (
    <div className="min-h-screen bg-[#07090D] pb-12" dir="rtl">
      {/* Header الرئيسي */}
      <header className="fixed top-0 left-0 right-0 z-[100] glass-dark py-4 safe-top">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          {!isSearchOpen ? (
            <>
              <img src="https://asmari.me/files/header.svg" alt="Logo" className="h-6" />
              <button onClick={() => setIsSearchOpen(true)} className="p-2 liquid-glass rounded-xl text-slate-400"><Search size={20} /></button>
            </>
          ) : (
            <div className="flex w-full gap-3 items-center animate-fadeIn">
              <input 
                autoFocus
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-[#FFA042]/50 outline-none"
                placeholder="ابحث بذكاء..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setAiResults([]); }} className="text-[#FFA042] text-sm font-bold">إلغاء</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-24">
        {/* النص التعريفي */}
        <section className="mb-8">
          <h3 className="text-xl font-bold text-white mb-2">نوّرت المسودّة ..</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            هنا مساحة اكتب فيها أنا <span className="text-white font-bold">سلمان الأسمري</span> عن الإعلانات .. الأفلام .. وبعض من التأملات والمنوعات التي تشغل بالي.
          </p>
        </section>

        {/* التصنيفات */}
        <section className="grid grid-cols-3 gap-2 mb-8">
          {([
            { name: 'الكل', icon: <LayoutGrid size={14}/> },
            { name: 'إعلانات', icon: <Megaphone size={14}/> },
            { name: 'أفلام', icon: <Film size={14}/> },
            { name: 'تأملات', icon: <Sparkles size={14}/> },
            { name: 'منوعات', icon: <MessageSquare size={14}/> }
          ] as any[]).map(cat => (
            <button 
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-bold transition-all ${activeCategory === cat.name ? 'bg-[#1B19A8] border-[#1B19A8] text-white shadow-lg' : 'liquid-glass border-white/5 text-slate-400'}`}
            >
              <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </section>

        {/* الترتيب */}
        <section className="flex items-center gap-3 mb-8">
          <span className="text-[10px] font-bold text-slate-600 uppercase">رتبها حسب:</span>
          <div className="flex gap-2">
            <button onClick={() => setSortOrder('recommended')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${sortOrder === 'recommended' ? 'bg-[#FFA042] text-black border-[#FFA042]' : 'liquid-glass border-white/5 text-slate-400'}`}>توصياتي</button>
            <button onClick={() => setSortOrder('newest')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${sortOrder === 'newest' ? 'bg-[#FFA042] text-black border-[#FFA042]' : 'liquid-glass border-white/5 text-slate-400'}`}>عطنا الجديد</button>
          </div>
        </section>

        {isAiSearching && (
          <div className="flex items-center justify-center gap-2 py-4 text-[#FFA042] text-xs animate-pulse">
            <BrainCircuit size={16} /> جاري التحليل بذكاء...
          </div>
        )}

        {/* قائمة المقالات */}
        <div className="space-y-6">
          {filteredPosts.map((post, idx) => {
            const aiMatch = aiResults.find(r => r.id === post.id);
            return (
              <div 
                key={post.id} 
                onClick={() => navigateToPost(post.id)}
                className={`group liquid-glass rounded-[2rem] overflow-hidden border border-white/5 active:scale-[0.98] transition-all duration-300 entry-anim ${aiMatch ? 'border-[#FFA042]/30' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="relative aspect-video">
                  <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={post.title} />
                  <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[8px] font-bold text-white border border-white/10">{post.category}</div>
                </div>
                <div className="p-6">
                  <span className="text-[10px] text-slate-500 font-bold block mb-2">{post.date}</span>
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#FFA042] transition-colors">{post.title}</h3>
                  {aiMatch ? (
                    <p className="text-xs text-[#FFA042] bg-[#FFA042]/5 p-2 rounded-xl mb-3 border border-[#FFA042]/10">{aiMatch.relevanceReason}</p>
                  ) : (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-1 text-[#FFA042] text-xs font-bold pt-4 border-t border-white/5">
                    اقرأ التدوينة <ChevronLeft size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
          <a href="https://asmari.me" target="_blank" rel="noreferrer" className="group">
             <img src="https://asmari.me/files/footer.svg" alt="About" className="h-7 transition-all group-hover:logo-orange-filter" />
          </a>
          <div className="flex gap-4">
            <a href="https://x.com/asmaridotme" className="w-10 h-10 flex items-center justify-center rounded-xl liquid-glass text-slate-400 hover:text-[#FFA042]"><XIcon /></a>
            <a href="https://instagram.com/asmari_sm/" className="w-10 h-10 flex items-center justify-center rounded-xl liquid-glass text-slate-400 hover:text-[#FFA042]"><Instagram size={18} /></a>
            <a href="https://wa.me/966560004428" className="w-10 h-10 flex items-center justify-center rounded-xl liquid-glass text-slate-400 hover:text-[#FFA042]"><MessageCircle size={18} /></a>
          </div>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest pb-8 opacity-50 text-center">
            جميع الحقوق محفوظة {new Date().getFullYear()} © سلمان الأسمري
          </p>
        </footer>
      </main>

      <style>{`
        .wp-content p { margin-bottom: 1.5rem; font-size: 1.05rem; }
        .wp-content img { border-radius: 1.5rem; margin: 2rem 0; width: 100% !important; height: auto !important; }
        .wp-content iframe { border-radius: 1.5rem; width: 100% !important; aspect-ratio: 16/9; margin: 2rem 0; }
        .wp-content a { color: #FFA042; text-decoration: underline; font-weight: bold; }
        .wp-content h2, .wp-content h3 { color: #fff; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; }
        .logo-orange-filter { filter: invert(72%) sepia(85%) saturate(1469%) hue-rotate(334deg) brightness(101%) contrast(101%); }
      `}</style>
    </div>
  );
};

export default App;
