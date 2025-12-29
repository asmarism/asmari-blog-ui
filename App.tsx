import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
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
  ArrowUp,
  Share2,
  BrainCircuit
} from 'lucide-react';
import { Category, Post } from './types';
import { fetchWordPressPosts } from './wpService';
import { searchWithAI, AISearchResult } from './geminiService';

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// مكون البطاقة محمي بـ memo لمنع إعادة الرندرة عند كل حرف بحث
const PostCard = memo(({ post, onClick, aiMatch, index }: { post: Post, onClick: (p: Post) => void, aiMatch?: AISearchResult, index: number }) => {
  return (
    <div 
      onClick={() => onClick(post)} 
      className={`block group liquid-glass rounded-[2rem] overflow-hidden no-flicker active:scale-[0.98] transition-transform duration-200 ${aiMatch ? 'border-[#FFA042]/40 bg-[#FFA042]/5' : ''} entry-anim`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="img-aspect">
        <img 
          src={post.imageUrl} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          alt={post.title}
          loading={index < 3 ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="absolute top-3 right-3 px-2 py-1 liquid-glass bg-black/40 rounded-lg text-[8px] font-black text-white">{post.category}</div>
        {aiMatch && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-[#FFA042] text-black rounded-lg text-[8px] font-black flex items-center gap-1">
            <Sparkles size={10} /> اقتراح ذكي
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="text-[10px] text-slate-400 font-bold mb-2">{post.date}</div>
        <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#FFA042] transition-colors">{post.title}</h3>
        
        {aiMatch ? (
          <p className="text-[11px] text-[#FFA042] font-medium bg-[#FFA042]/10 p-2 rounded-xl mb-4 border border-[#FFA042]/20">
            {aiMatch.relevanceReason}
          </p>
        ) : (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-1.5 text-[#FFA042] pt-4 border-t border-white/5 font-bold text-[12px]">اقرأ التدوينة <ChevronLeft size={14} /></div>
      </div>
    </div>
  );
});

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<AISearchResult[]>([]);
  const [showAiResults, setShowAiResults] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const postsRef = useRef<Post[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMetaData = useCallback((post: Post | null) => {
    const defaultTitle = "مسودّة للنشر - سلمان الأسمري";
    const defaultDesc = "مدونة شخصية عن الإعلانات والأفلام والتأملات الشخصية.";
    const defaultImg = "https://asmari.me/wp-content/uploads/2023/12/cropped-Fav-192x192.png";
    document.title = post ? post.title : defaultTitle;
    
    const tags: Record<string, string> = {
      'og:title': post ? post.title : defaultTitle,
      'og:description': post ? post.excerpt : defaultDesc,
      'og:image': post ? post.imageUrl : defaultImg,
      'og:url': window.location.href,
    };

    Object.entries(tags).forEach(([prop, content]) => {
      let meta = document.querySelector(`meta[property="${prop}"]`);
      if (meta) meta.setAttribute('content', content);
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const wpPosts = await fetchWordPressPosts();
      setPosts(wpPosts);
      postsRef.current = wpPosts;
      
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('p');
      if (postId) {
        const post = wpPosts.find(p => p.id === postId);
        if (post) { setSelectedPost(post); updateMetaData(post); }
      }
      setIsLoading(false);
    };
    loadData();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      if (selectedPost && !isExiting) {
        const scrollBottom = window.scrollY + window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight;
        if (scrollBottom >= totalHeight + 100) handleSmoothExit();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedPost, isExiting, updateMetaData]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        setIsAiSearching(true);
        const results = await searchWithAI(searchQuery, postsRef.current);
        setAiResults(results);
        setIsAiSearching(false);
        setShowAiResults(results.length > 0);
      }, 1000);
    } else {
      setShowAiResults(false);
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  const filteredPosts = useMemo(() => {
    if (showAiResults && aiResults.length > 0) {
      const aiIds = aiResults.map(r => r.id);
      return postsRef.current.filter(post => aiIds.includes(post.id));
    }
    let result = posts;
    if (activeCategory !== 'الكل') {
      result = result.filter(post => post.category === activeCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, posts, searchQuery, showAiResults, aiResults]);

  const handlePostClick = useCallback((post: Post) => {
    setIsExiting(false);
    setSelectedPost(post);
    updateMetaData(post);
    setIsSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const newUrl = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    window.history.pushState({ postId: post.id }, '', newUrl);
  }, [updateMetaData]);

  const handleSmoothExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      setSelectedPost(null);
      updateMetaData(null);
      setIsExiting(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.history.pushState({}, '', window.location.pathname);
    }, 300);
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, text: post.excerpt, url: shareUrl }); } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('تم نسخ الرابط!');
    }
  };

  const categories: {name: Category | 'الكل', icon: React.ReactNode}[] = [
    { name: 'الكل', icon: <LayoutGrid size={15} /> },
    { name: 'إعلانات', icon: <Megaphone size={15} /> },
    { name: 'أفلام', icon: <Film size={15} /> },
    { name: 'تأملات', icon: <Sparkles size={15} /> },
    { name: 'منوعات', icon: <MessageSquare size={15} /> },
  ];

  const FooterContent = () => (
    <div className="py-10 border-t border-white/5 no-flicker">
      <div className="flex justify-between items-center">
        <a href="https://asmari.me/" target="_blank" rel="noopener noreferrer" className="text-[24px] font-bold text-white hover:text-[#FFA042]">عنّي</a>
        <div className="flex items-center gap-2.5">
          {[
            { href: "https://x.com/asmaridotme", icon: <XIcon /> },
            { href: "https://www.instagram.com/asmari_sm/", icon: <Instagram size={16} /> },
            { href: `https://wa.me/966560004428?text=${encodeURIComponent('أسعد الله أوقاتك بكل خير ومسرة أبوريان، شفت مدونتك وقلت اسلم عليك .. فالسلام عليكم ورحمة الله وبركاته')}`, icon: <MessageCircle size={16} /> }
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl liquid-glass text-slate-300 hover:text-[#FFA042] active:scale-90 transition-transform">
              {s.icon}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest opacity-60">جميع الحقوق محفوظة {new Date().getFullYear()} © سلمان الأسمري</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-right bg-[#07090D] selection:bg-[#FFA042]/30" dir="rtl">
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 safe-top ${isScrolled || selectedPost ? 'glass-dark py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-md mx-auto px-6 relative flex justify-between items-center min-h-[44px]">
          <div className={`flex items-center gap-3 ${isSearchOpen ? 'opacity-0' : 'opacity-100'}`}>
            {selectedPost && <button onClick={handleSmoothExit} className="p-2 liquid-glass rounded-xl text-[#94A3B8] active:scale-90"><ArrowRight size={18} /></button>}
            <button onClick={() => { if(selectedPost) handleSmoothExit(); setActiveCategory('الكل'); }} className="flex items-baseline gap-2">
              <h1 className="font-extrabold text-white text-xl">مسودّة للنشر</h1>
            </button>
          </div>
          <div className={`absolute left-6 h-[40px] flex items-center gap-2 transition-all duration-300 z-20 ${isSearchOpen ? 'w-[calc(100%-48px)]' : 'w-[40px]'}`}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowAiResults(false); }}
              placeholder={isSearchOpen ? "ابحث بذكاء..." : ""}
              className={`w-full h-full bg-white/5 border rounded-[15px] pr-10 pl-4 text-sm text-white focus:outline-none ${isSearchOpen ? 'opacity-100 border-[#FFA042]/40' : 'opacity-0'}`}
            />
            <button onClick={() => { setIsSearchOpen(true); if(selectedPost) handleSmoothExit(); setTimeout(() => searchInputRef.current?.focus(), 100); }} className={`absolute right-0 top-0 w-[40px] h-[40px] flex items-center justify-center rounded-xl ${isSearchOpen ? 'text-slate-400' : 'liquid-glass text-slate-400'}`} disabled={isSearchOpen}><Search size={18} /></button>
            {isSearchOpen && <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setShowAiResults(false); }} className="text-xs font-bold text-[#FFA042] px-1">إلغاء</button>}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-16 pb-12 relative z-10">
        {selectedPost ? (
          <div className={`transition-all duration-300 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <article className="pt-8 no-flicker">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-[#94A3B8] block mb-1 uppercase tracking-widest">{selectedPost.date}</span>
                <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">{selectedPost.title}</h2>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 liquid-glass rounded-full text-[10px] font-bold text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-[#1B19A8]"></span>{selectedPost.category}</div>
                  <button onClick={() => handleShare(selectedPost)} className="p-2 liquid-glass rounded-xl text-slate-400 active:scale-90"><Share2 size={16} /></button>
                </div>
              </div>
              <div className="wp-content text-slate-200 text-[16px] leading-[1.8] space-y-4" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              <div className="mt-12 mb-8">
                <button onClick={() => handleShare(selectedPost)} className="w-full flex items-center justify-center gap-2 py-4 liquid-glass rounded-[1.5rem] border-[#FFA042]/20 text-white font-bold active:scale-95 transition-transform"><Share2 size={18} className="text-[#FFA042]" />شارك التدوينة</button>
              </div>
            </article>
            <FooterContent />
            <div className="mt-8 flex flex-col items-center gap-4 opacity-30 pb-40 text-center animate-bounce">
              <ArrowUp size={20} className="text-[#FFA042]" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">اسحب للعودة</span>
            </div>
          </div>
        ) : (
          <div className="no-flicker">
            <section className={`mb-6 transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
              <h3 className="text-[18px] font-bold text-white mb-1">نوّرت المسودّة ..</h3>
              <p className="text-[13px] leading-[1.7] text-slate-300/90">هنا مساحة اكتب فيها أنا <span className="text-white font-bold">سلمان الأسمري</span> عن الإعلانات، الأفلام، وتأملات شخصية تشغل البال.</p>
            </section>
            
            <section className="mb-6 sticky top-[54px] z-40 no-flicker">
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button key={cat.name} onClick={() => { setActiveCategory(cat.name); setIsSearchOpen(false); setSearchQuery(''); }} className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl transition-all duration-200 border ${activeCategory === cat.name ? 'bg-[#1B19A8] text-white border-[#1B19A8]/50 shadow-lg' : 'liquid-glass text-slate-400 border-white/5'}`}>
                    <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
                    <span className="font-bold text-[11px]">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {isAiSearching && (
              <div className="flex items-center justify-center gap-3 py-6 text-[#FFA042] animate-pulse">
                <BrainCircuit size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">الذكاء الاصطناعي يحلل طلبك...</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20"><Loader2 size={30} className="animate-spin text-[#1B19A8] opacity-50 mb-4" /></div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.length > 0 ? filteredPosts.map((post, idx) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    index={idx} 
                    onClick={handlePostClick} 
                    aiMatch={aiResults.find(r => r.id === post.id)} 
                  />
                )) : <div className="py-20 text-center text-slate-500 text-sm">{isAiSearching ? "لحظات..." : "لا توجد نتائج بحث"}</div>}
              </div>
            )}
            <FooterContent />
          </div>
        )}
      </main>

      <style>{`
        .wp-content p { margin-bottom: 1.5rem; line-height: 1.8; font-size: 1.05rem; }
        .wp-content h1, .wp-content h2, .wp-content h3 { color: #fff; font-weight: 800; margin: 2rem 0 1rem; line-height: 1.3; }
        .wp-content a { color: #FFA042; text-decoration: underline; font-weight: 600; }
        .wp-content blockquote { font-size: 1.3rem; color: #FFA042; border-right: 4px solid #1B19A8; padding: 1.5rem; margin: 2rem 0; font-style: italic; background: rgba(255,160,66,0.05); border-radius: 1rem; }
        .wp-content img { border-radius: 1.2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
};

export default App;