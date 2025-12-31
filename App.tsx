
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
         alt="شعار سلمان الأسمري" 
         className="h-12 w-auto object-contain transition-all duration-300 footer-logo-hover" 
       />
    </a>
    <div className="flex gap-8 items-center">
      <a href="https://x.com/asmaridotme" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors" aria-label="X (تويتر سابقاً)"><XIcon /></a>
      <a href="https://instagram.com/asmari_sm/" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors" aria-label="إنستغرام"><Instagram size={22} /></a>
      <a href="https://wa.me/966560004428" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors" aria-label="واتساب"><MessageCircle size={22} /></a>
    </div>
    <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest pb-12 opacity-50 text-center">
      جميع الحقوق محفوظة {new Date().getFullYear()} © سلمان الأسمري
    </p>
  </footer>
);

const PostPage = ({ post, onBack, onShare }: { post: Post, onBack: () => void, onShare: (p: Post) => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${post.title} | مسودّة سلمان الأسمري`;

    const updateMeta = (property: string, content: string, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attr}="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('og:title', post.title);
    updateMeta('og:description', post.excerpt);
    updateMeta('og:image', post.imageUrl);
    updateMeta('og:url', window.location.href);
    updateMeta('og:type', 'article');
    updateMeta('twitter:title', post.title);
    updateMeta('twitter:description', post.excerpt);
    updateMeta('twitter:image', post.imageUrl);
    updateMeta('description', post.excerpt, true);

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.imageUrl,
      "author": { "@type": "Person", "name": "سلمان الأسمري", "url": "https://asmari.me" },
      "datePublished": post.date
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'structured-data-script';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const oldScript = document.getElementById('structured-data-script');
      if (oldScript) oldScript.remove();
    };
  }, [post]);

  return (
    <article className="entry-anim pb-10">
      <header className="fixed top-0 left-0 right-0 z-[110] glass-dark py-3 safe-top">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold text-sm active:scale-95 transition-transform">
            <ArrowRight size={20} />
            <span>الرئيسية</span>
          </button>
          <button onClick={() => onShare(post)} className="p-2 liquid-glass rounded-xl text-[#FFA042] active:scale-90"><Share2 size={18} /></button>
        </div>
      </header>

      <div className="pt-24 px-6 max-w-md mx-auto">
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-[10px] font-bold border border-white/10">{post.category}</span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{post.date}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-[1.4] mb-4 pb-1">{post.title}</h1>
          <div className="w-12 h-1 bg-[#1B19A8] rounded-full"></div>
        </section>
        
        <div className="wp-content text-slate-200 text-[17px] leading-[1.8] space-y-6" dangerouslySetInnerHTML={{ __html: post.content }} />

        <section className="mt-12 py-8 border-t border-white/5">
          <button onClick={() => onShare(post)} className="w-full flex items-center justify-center gap-2 py-4 liquid-glass rounded-2xl border-white/10 text-white font-bold active:scale-95 transition-transform">
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
    const params = new URLSearchParams(window.location.search);
    
    // 1. دعم الروابط القصيرة /p/84 (للمشاركة النظيفة)
    if (path.startsWith('/p/')) {
      const id = path.replace('/p/', '');
      const post = allPosts.find(p => p.id === id);
      if (post) {
        // تحويل الرابط في المتصفح للرابط الطويل (SEO) مع بقاء المحتوى
        window.history.replaceState({}, '', `/post/${post.slug}`);
        setCurrentPost(post);
        return;
      }
    }

    // 2. دعم الروابط القديمة ?p=84
    const oldId = params.get('p');
    if (oldId) {
      const post = allPosts.find(p => p.id === oldId);
      if (post) {
        window.history.replaceState({}, '', `/post/${post.slug}`);
        setCurrentPost(post);
        return;
      }
    }

    // 3. دعم الروابط الطويلة /post/slug
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
      const data = await fetchWordPressPosts();
      setPosts(data);
      setIsLoading(false);
      parseUrl(data);
    };
    init();
    
    const handlePopState = () => {
      // نحتاج لتحميل البيانات مرة أخرى أو استخدام المرجع الحالي
      fetchWordPressPosts().then(data => parseUrl(data));
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
    // استخدام الرابط القصير /p/ID لضمان مظهر نظيف وبدون رموز %d9%..
    const shortUrl = `${window.location.origin}/p/${post.id}`;
    const shareText = `${post.title}\n\n${shortUrl}`;
    
    if (navigator.share) {
      try { 
        await navigator.share({ 
          title: post.title,
          text: post.title, // العنوان يظهر كنص مرافق
          url: shortUrl 
        }); 
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('تم نسخ الرابط المختصر للتدوينة');
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
    <div className="min-h-screen bg-[#07090D] pb-6" dir="rtl">
      <header className="fixed top-0 left-0 right-0 z-[120] glass-dark py-4 safe-top">
        <nav className="max-w-md mx-auto px-6 flex justify-between items-center h-10">
          {!isSearchOpen ? (
            <>
              <button onClick={() => navigateToPost(null)} className="hover:opacity-80 active:scale-95 transition-all outline-none">
                <img src="https://asmari.me/files/header.svg" alt="Logo" className="h-6" />
              </button>
              <button onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} className="p-2 liquid-glass rounded-xl text-slate-400">
                <Search size={20} />
              </button>
            </>
          ) : (
            <div className="flex w-full gap-3 items-center animate-fadeIn">
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

      <nav className="fixed top-[74px] left-0 right-0 z-[110] glass-dark/90 backdrop-blur-xl border-b border-white/5 py-3">
        <div className="max-w-md mx-auto px-4 overflow-x-auto no-scrollbar flex items-center gap-2">
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
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat.name ? 'bg-[#1B19A8] border-[#1B19A8] text-white' : 'bg-white/5 border-transparent text-slate-400'
              }`}
            >
              <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 pt-44">
        {!searchQuery && (
          <section className="mb-10">
            <h1 className="text-xl font-bold text-white mb-2">نوّرت المسودّة ..</h1>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              هذي مساحة شخصية اكتب فيها أنا سلمان الأسمري عن الإعلانات .. الأفلام .. وتأملات ومنوعات تطرأ على البال
            </p>
          </section>
        )}

        <section className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2 text-slate-500 opacity-80">
            <ListFilter size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">فرز المحتوى:</span>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-44">
            <button onClick={() => setSortOrder('newest')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-extrabold transition-all ${sortOrder === 'newest' ? 'bg-white/10 text-white' : 'text-slate-500'}`}>عطنا الجديد</button>
            <button onClick={() => setSortOrder('recommended')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-extrabold transition-all ${sortOrder === 'recommended' ? 'bg-white/10 text-[#FFA042]' : 'text-slate-500'}`}>توصياتي</button>
          </div>
        </section>

        {isAiSearching && (
          <div className="flex items-center justify-center gap-2 py-4 text-[#FFA042] text-xs animate-pulse">
            <BrainCircuit size={16} /> جاري البحث في المسوّدة بذكاء...
          </div>
        )}

        <section className="space-y-12">
          {filteredPosts.map((post, idx) => {
            const aiMatch = aiResults.find(r => r.id === post.id);
            return (
              <article key={post.id} onClick={() => navigateToPost(post)} className={`group cursor-pointer active:scale-[0.99] transition-all duration-300 entry-anim ${aiMatch ? 'border-r-2 border-[#FFA042] pr-4' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="relative aspect-video rounded-[1.2rem] overflow-hidden mb-5 shadow-2xl border border-white/5 bg-white/5">
                  <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={post.title} loading="lazy" />
                  <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-bold text-white border border-white/10">{post.category}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">{post.date}</span>
                  <h2 className="text-xl font-bold text-white mb-2 leading-[1.4] line-clamp-2 group-hover:text-[#FFA042] transition-colors">{post.title}</h2>
                  {aiMatch ? (
                    <div className="flex items-start gap-2 bg-[#FFA042]/5 p-3 rounded-xl border border-[#FFA042]/10 mb-2">
                      <BrainCircuit size={14} className="text-[#FFA042] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#FFA042] leading-relaxed">{aiMatch.relevanceReason}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-1 text-[#FFA042] text-[10px] font-black uppercase tracking-widest">
                    اقرأ التدوينة <ChevronLeft size={14} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <Footer />
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .wp-content p { margin-bottom: 1.5rem; font-size: 1.05rem; color: #CBD5E1; }
        .wp-content img { border-radius: 1rem; margin: 1.5rem 0; width: 100% !important; height: auto !important; }
        .footer-logo-hover:hover { filter: brightness(0) saturate(100%) invert(73%) sepia(45%) saturate(1525%) hue-rotate(331deg) brightness(101%) contrast(101%); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .entry-anim { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
