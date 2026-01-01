
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Footer = () => (
  <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-10">
    <a href="https://asmari.me" target="_blank" rel="noreferrer" className="block" aria-label="العودة لموقع سلمان الأسمري الرئيسي">
       <img 
         src="https://asmari.me/files/footer.svg" 
         alt="سلمان الأسمري - سلمان محمد الأسمري" 
         className="h-12 w-auto object-contain transition-all duration-300 footer-logo-hover" 
       />
    </a>
    <div className="flex gap-8 items-center">
      <a href="https://x.com/asmaridotme" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors" aria-label="X (تويتر سابقاً)"><XIcon /></a>
      <a href="https://instagram.com/asmari_sm/" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors" aria-label="إنستغرام"><Instagram size={22} /></a>
      <a href="https://wa.me/966560004428" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors" aria-label="واتساب"><MessageCircle size={22} /></a>
    </div>
    <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest pb-12 opacity-50 text-center">
      جميع الحقوق محفوظة {new Date().getFullYear()} © سلمان محمد حومان الأسمري
    </p>
  </footer>
);

const PostPage = ({ post, onBack, onShare }: { post: Post, onBack: () => void, onShare: (p: Post) => void }) => {
  useEffect(() => {
    document.title = `${post.title.replace(/<[^>]*>?/gm, '')} | سلمان الأسمري`;
    window.scrollTo(0, 0);
  }, [post]);

  return (
    <article className="entry-anim pb-10">
      <header className="fixed top-0 left-0 right-0 z-[110] glass-dark py-3 safe-top">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold text-sm active:scale-95 transition-transform">
            <ArrowRight size={20} />
            <span>الرئيسية</span>
          </button>
          <button onClick={() => onShare(post)} className="p-2 liquid-glass rounded-xl text-[#FFA042] active:scale-90"><Share2 size={18} /></button>
        </div>
      </header>

      <div className="pt-24 px-6 max-w-3xl mx-auto overflow-x-hidden">
        <section className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-[10px] font-bold border border-white/10">{post.category}</span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{post.date}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.3] mb-4 pb-1" dangerouslySetInnerHTML={{ __html: post.title }} />
          <div className="w-16 h-1 bg-[#1B19A8] rounded-full"></div>
        </section>
        
        <div className="wp-content text-slate-200 text-[17px] md:text-[19px] leading-[1.8] space-y-6 overflow-hidden mb-12" dangerouslySetInnerHTML={{ __html: post.content }} />

        <section className="mt-12 py-8 border-t border-white/5">
          <button onClick={() => onShare(post)} className="w-full md:max-w-sm mx-auto flex items-center justify-center gap-2 py-4 liquid-glass rounded-2xl border-white/10 text-white font-bold active:scale-95 transition-transform">
            <Share2 size={18} className="text-[#FFA042]" /> مشاركة هذه التدوينة
          </button>
        </section>
        
        <Footer />
      </div>
    </article>
  );
};

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [sortOrder, setSortOrder] = useState<'newest' | 'recommended'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiResults, setAiResults] = useState<AISearchResult[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  const parseUrl = useCallback((allPosts: Post[]) => {
    const path = window.location.pathname;
    if (path.startsWith('/post/')) {
      const slug = path.replace('/post/', '');
      const post = allPosts.find(p => p.slug === slug);
      if (post) {
        setCurrentPost(post);
        return;
      }
    }
    setCurrentPost(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      const result = await fetchWordPressPosts();
      setPosts(result.posts);
      setIsLoading(false);
      parseUrl(result.posts);
    };
    init();
    
    const handlePopState = () => {
      fetchWordPressPosts().then(res => parseUrl(res.posts));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseUrl]);

  const navigateToPost = (post: Post | null) => {
    const newUrl = post ? `/post/${post.slug}` : '/';
    window.history.pushState({}, '', newUrl);
    setCurrentPost(post);
    window.scrollTo(0, 0);
  };

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
    else result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const shareUrl = `https://blog.asmari.me/post/${post.slug}`;
    if (navigator.share) {
      try { 
        await navigator.share({ title: post.title, text: post.title, url: shareUrl }); 
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('تم نسخ رابط التدوينة');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090D]">
        <Loader2 className="animate-spin text-[#1B19A8]" size={32} />
      </div>
    );
  }

  if (currentPost) {
    return <PostPage post={currentPost} onBack={() => navigateToPost(null)} onShare={handleShare} />;
  }

  return (
    <div className="min-h-screen bg-[#07090D] pb-10" dir="rtl">
      <header className="fixed top-0 left-0 right-0 z-[120] glass-dark py-4 safe-top">
        <nav className="max-w-6xl mx-auto px-6 flex justify-between items-center h-10">
          {!isSearchOpen ? (
            <>
              <button onClick={() => navigateToPost(null)} className="hover:opacity-80 active:scale-95 transition-all outline-none">
                <img src="https://asmari.me/files/header.svg" alt="سلمان الأسمري" className="h-6 md:h-8" />
              </button>
              <button onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} className="p-2 liquid-glass rounded-xl text-slate-400">
                <Search size={20} />
              </button>
            </>
          ) : (
            <div className="flex w-full max-w-2xl mx-auto gap-3 items-center animate-fadeIn">
              <input 
                ref={searchInputRef}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white focus:border-[#FFA042]/40 outline-none"
                placeholder="ابحث في المسوّدة..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setAiResults([]); }} className="text-[#FFA042] text-sm font-bold">إلغاء</button>
            </div>
          )}
        </nav>
      </header>

      <nav className="fixed top-[74px] md:top-[88px] left-0 right-0 z-[110] glass-dark/90 backdrop-blur-xl border-b border-white/5 py-3">
        <div className="max-w-6xl mx-auto px-6 overflow-x-auto no-scrollbar flex items-center md:justify-center gap-2">
          {([
            { name: 'الكل', icon: <LayoutGrid size={14}/> },
            { name: 'إعلانات', icon: <Megaphone size={14}/> },
            { name: 'أفلام', icon: <Film size={14}/> },
            { name: 'تأملات', icon: <Sparkles size={14}/> },
            { name: 'منوعات', icon: <MessageSquare size={14}/> }
          ] as any[]).map(cat => (
            <button 
              key={cat.name}
              onClick={() => { setActiveCategory(cat.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] md:text-[13px] font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat.name ? 'bg-[#1B19A8] border-[#1B19A8] text-white shadow-lg shadow-[#1B19A8]/20' : 'bg-white/5 border-transparent text-slate-400'
              }`}
            >
              <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-48 md:pt-56">
        {!searchQuery && (
          <section className="mb-12 md:mb-16 md:text-center max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">نوّرت المسودّة ..</h1>
            <p className="text-sm md:text-lg text-slate-500 leading-relaxed font-medium">
              هذي مساحة شخصية اكتب فيها أنا <span className="text-slate-300">سلمان محمد الأسمري</span> عن الإعلانات .. الأفلام .. وتأملات ومنوعات تطرأ على البال
            </p>
          </section>
        )}

        <section className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2 text-slate-500 opacity-80">
            <ListFilter size={14} />
            <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest">فرز المحتوى:</span>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-44 md:w-56">
            <button onClick={() => setSortOrder('newest')} className={`flex-1 py-1.5 rounded-lg text-[9px] md:text-[11px] font-extrabold transition-all ${sortOrder === 'newest' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>عطنا الجديد</button>
            <button onClick={() => setSortOrder('recommended')} className={`flex-1 py-1.5 rounded-lg text-[9px] md:text-[11px] font-extrabold transition-all ${sortOrder === 'recommended' ? 'bg-white/10 text-[#FFA042]' : 'text-slate-500'}`}>توصياتي</button>
          </div>
        </section>

        {isAiSearching && (
          <div className="flex items-center justify-center gap-2 py-8 text-[#FFA042] text-sm animate-pulse">
            <BrainCircuit size={20} /> جاري البحث في المسوّدة بذكاء...
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredPosts.map((post, idx) => {
            const aiMatch = aiResults.find(r => r.id === post.id);
            return (
              <article 
                key={post.id} 
                onClick={() => navigateToPost(post)} 
                className={`group cursor-pointer active:scale-[0.98] md:hover:scale-[1.02] transition-all duration-500 entry-anim flex flex-col h-full bg-white/[0.02] rounded-[1.5rem] p-4 border border-white/5 hover:border-white/10 ${aiMatch ? 'ring-1 ring-[#FFA042]/30' : ''}`} 
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="relative aspect-video rounded-[1.1rem] overflow-hidden mb-5 shadow-xl bg-white/5">
                  <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={`${post.title} - سلمان الأسمري`} loading="lazy" />
                  <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] md:text-[9px] font-bold text-white border border-white/10">{post.category}</div>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] text-slate-600 font-bold block mb-2">{post.date}</span>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-3 leading-[1.4] line-clamp-2 group-hover:text-[#FFA042] transition-colors" dangerouslySetInnerHTML={{ __html: post.title }} />
                  
                  {aiMatch ? (
                    <div className="flex items-start gap-2 bg-[#FFA042]/5 p-3 rounded-xl border border-[#FFA042]/10 mb-4">
                      <BrainCircuit size={14} className="text-[#FFA042] mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-[#FFA042] leading-relaxed">{aiMatch.relevanceReason}</p>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-slate-500 line-clamp-3 leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-1 text-[#FFA042] text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                    اقرأ التدوينة <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {filteredPosts.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-slate-500 font-medium">ما لقينا شي يطابق بحثك في المسودة..</p>
          </div>
        )}

        <Footer />
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .wp-content { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; }
        .wp-content * { max-width: 100% !important; box-sizing: border-box !important; }
        .wp-content p { margin-bottom: 1.5rem; }
        .wp-content img { border-radius: 1.5rem; margin: 2rem 0; height: auto !important; display: block; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .wp-content iframe, .wp-content video { width: 100% !important; aspect-ratio: 16 / 9; height: auto !important; border-radius: 1.5rem; margin: 2rem 0; }
        .footer-logo-hover:hover { filter: brightness(0) saturate(100%) invert(73%) sepia(45%) saturate(1525%) hue-rotate(331deg) brightness(101%) contrast(101%); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .entry-anim { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
