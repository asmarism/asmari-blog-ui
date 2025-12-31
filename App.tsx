
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// --- مكون الفوتر المشترك (Shared Footer) ---
const Footer = () => (
  <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-10">
    <a href="https://asmari.me" target="_blank" rel="noreferrer" className="block">
       <img 
         src="https://asmari.me/files/footer.svg" 
         alt="Footer" 
         className="h-12 w-auto object-contain transition-all duration-300 footer-logo-hover" 
       />
    </a>
    <div className="flex gap-8 items-center">
      <a href="https://x.com/asmaridotme" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors"><XIcon /></a>
      <a href="https://instagram.com/asmari_sm/" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors"><Instagram size={22} /></a>
      <a href="https://wa.me/966560004428?text=%D8%A3%D8%B3%D8%B9%D8%AF%20%D8%A7%D9%84%D9%84%D9%87%20%D8%A3%D9%88%D9%82%D8%A7%D8%AA%D9%83%20%D8%A8%D9%83%D9%84%20%D8%AE%D9%8A%D8%B1%20%D9%88%D9%85%D8%B3%D8%B1%D8%A9%20%D8%A3%D8%A8%D9%88%D8%B1%D9%8A%D8%A7%D9%86%D8%8C%20%D8%B4%D9%81%D8%AA%20%D9%85%D8%AF%D9%88%D9%86%D8%AA%D9%83%20%D9%88%D9%82%D9%84%D8%AA%20%D8%A7%D8%B3%D9%84%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%20..%20%D9%81%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D8%A8%D8%B1%D9%83%D8%A7%D8%AA%D9%87" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-[#FFA042] transition-colors"><MessageCircle size={22} /></a>
    </div>
    <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest pb-12 opacity-50 text-center">
      جميع الحقوق محفوظة {new Date().getFullYear()} © سلمان الأسمري
    </p>
  </footer>
);

// --- صفحة المقال المنفصلة (Classic View) ---
const PostPage = ({ post, onBack, onShare }: { post: Post, onBack: () => void, onShare: (p: Post) => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = post.title;

    // تحديث الميتا تاج ديناميكياً لتحسين المعاينة عند الشير
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
    updateMeta('twitter:title', post.title);
    updateMeta('twitter:description', post.excerpt);
    updateMeta('twitter:image', post.imageUrl);
    updateMeta('description', post.excerpt, true);

  }, [post]);

  return (
    <div className="entry-anim pb-10">
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
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-[10px] font-bold border border-white/10">{post.category}</span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{post.date}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-[1.4] mb-4 pb-1">{post.title}</h1>
          <div className="w-12 h-1 bg-[#1B19A8] rounded-full"></div>
        </div>
        
        <div 
          className="wp-content text-slate-200 text-[17px] leading-[1.8] space-y-6 overflow-x-hidden" 
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        <div className="mt-12 py-8 border-t border-white/5">
          <button onClick={() => onShare(post)} className="w-full flex items-center justify-center gap-2 py-4 liquid-glass rounded-2xl border-white/10 text-white font-bold active:scale-95 transition-transform">
            <Share2 size={18} className="text-[#FFA042]" /> مشاركة هذه التدوينة
          </button>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [sortOrder, setSortOrder] = useState<'newest' | 'recommended'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiResults, setAiResults] = useState<AISearchResult[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const navigateToPost = (id: string | null) => {
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
    const url = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    const shareText = `${post.title}\n\n${url}`;

    if (navigator.share) {
      try { 
        await navigator.share({ 
          title: post.title,
          text: post.title,
          url: url 
        }); 
      } catch (err) {
        console.error('Sharing failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('تم نسخ عنوان التدوينة والرابط لمشاركتها');
      } catch (err) {
        console.error('Clipboard failed', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090D]">
        <Loader2 className="animate-spin text-[#1B19A8]" size={32} />
      </div>
    );
  }

  if (selectedPost) {
    return <PostPage post={selectedPost} onBack={() => navigateToPost(null)} onShare={handleShare} />;
  }

  return (
    <div className="min-h-screen bg-[#07090D] pb-6" dir="rtl">
      {/* Header Fixed */}
      <header className="fixed top-0 left-0 right-0 z-[120] glass-dark py-4 safe-top">
        <div className="max-w-md mx-auto px-6 flex justify-between items-center h-10">
          {!isSearchOpen ? (
            <>
              <img src="https://asmari.me/files/header.svg" alt="Logo" className="h-6" />
              <button 
                onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} 
                className="p-2 liquid-glass rounded-xl text-slate-400"
              >
                <Search size={20} />
              </button>
            </>
          ) : (
            <div className="flex w-full gap-3 items-center animate-fadeIn">
              <div className="relative flex-1">
                <input 
                  ref={searchInputRef}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white focus:border-[#FFA042]/40 outline-none transition-all"
                  placeholder="ابحث في المسوّدة..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setAiResults([]); }} className="text-[#FFA042] text-sm font-bold">إلغاء</button>
            </div>
          )}
        </div>
      </header>

      {/* Floating Sticky Categories */}
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
                activeCategory === cat.name 
                ? 'bg-[#1B19A8] border-[#1B19A8] text-white' 
                : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 pt-44">
        {/* Intro */}
        {!searchQuery && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-white mb-2">نوّرت المسودّة ..</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              هذي مساحة شخصية اكتب فيها أنا سلمان الأسمري عن الإعلانات .. الأفلام .. الكيميديا .. وتأملات ومنوعات تطرأ على البال
            </p>
          </section>
        )}

        {/* Simplified Sorting Section */}
        <section className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2 text-slate-500 opacity-80">
            <ListFilter size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">فرز المحتوى:</span>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-44">
            <button 
              onClick={() => setSortOrder('newest')} 
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-extrabold transition-all duration-300 ${sortOrder === 'newest' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
              عطنا الجديد
            </button>
            <button 
              onClick={() => setSortOrder('recommended')} 
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-extrabold transition-all duration-300 ${sortOrder === 'recommended' ? 'bg-white/10 text-[#FFA042] shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
              توصياتي
            </button>
          </div>
        </section>

        {isAiSearching && (
          <div className="flex items-center justify-center gap-2 py-4 text-[#FFA042] text-xs animate-pulse">
            <BrainCircuit size={16} /> جاري البحث في المسوّدة بذكاء...
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-12">
          {filteredPosts.map((post, idx) => {
            const aiMatch = aiResults.find(r => r.id === post.id);
            return (
              <div 
                key={post.id} 
                onClick={() => navigateToPost(post.id)}
                className={`group cursor-pointer active:scale-[0.99] transition-all duration-300 entry-anim ${aiMatch ? 'border-r-2 border-[#FFA042] pr-4' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="relative aspect-video rounded-[1.2rem] overflow-hidden mb-5 shadow-2xl border border-white/5 bg-white/5">
                  <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={post.title} loading="lazy" />
                  <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-bold text-white border border-white/10 uppercase tracking-tighter">{post.category}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">{post.date}</span>
                  <h3 className="text-xl font-bold text-white mb-2 leading-[1.4] pb-1 group-hover:text-[#FFA042] transition-colors line-clamp-2">{post.title}</h3>
                  {aiMatch ? (
                    <div className="flex items-start gap-2 bg-[#FFA042]/5 p-3 rounded-xl border border-[#FFA042]/10 mb-2">
                      <BrainCircuit size={14} className="text-[#FFA042] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#FFA042] leading-relaxed">{aiMatch.relevanceReason}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-1 text-[#FFA042] text-[10px] font-black uppercase tracking-widest transition-colors">
                    اقرأ التدوينة <ChevronLeft size={14} />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPosts.length === 0 && !isLoading && (
            <div className="py-24 text-center flex flex-col items-center gap-4 opacity-30">
              <Search size={40} />
              <p className="text-sm font-bold">لا يوجد نتائج في المسوّدة</p>
            </div>
          )}
        </div>

        <Footer />
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .wp-content p { margin-bottom: 1.5rem; font-size: 1.05rem; color: #CBD5E1; }
        .wp-content img { border-radius: 1rem; margin: 1.5rem 0; width: 100% !important; height: auto !important; }
        .wp-content a { color: #FFA042; text-decoration: none; border-bottom: 1px solid rgba(255,160,66,0.2); }
        .wp-content h2, .wp-content h3 { color: #fff; font-weight: 800; margin-top: 2.5rem; margin-bottom: 1rem; line-height: 1.3; }
        
        .footer-logo-hover:hover {
          filter: brightness(0) saturate(100%) invert(73%) sepia(45%) saturate(1525%) hue-rotate(331deg) brightness(101%) contrast(101%);
        }

        .wp-content {
          overflow-wrap: break-word;
          word-wrap: break-word;
          hyphens: auto;
        }

        .wp-content iframe,
        .wp-content video,
        .wp-content object,
        .wp-content embed,
        .wp-content .wp-block-embed,
        .wp-content .wp-block-embed__wrapper {
          max-width: 100% !important;
          width: 100% !important;
          height: auto !important;
          aspect-ratio: 16 / 9;
          border-radius: 1rem;
          border: none;
          margin: 1.5rem 0;
          display: block;
          position: relative;
        }

        .wp-content figure,
        .wp-content div[style*="width"] {
          max-width: 100% !important;
          width: 100% !important;
          height: auto !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .entry-anim { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
