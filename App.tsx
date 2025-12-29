import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Share2
} from 'lucide-react';
import { Category, Post } from './types';
import { fetchWordPressPosts } from './wpService';

const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    title: 'تأملات في الفن والجمال الرقمي',
    excerpt: 'هذا المحتوى يظهر لأن الاتصال بمدونتك لا يزال قيد الإعداد. تأكد من تفعيل الـ API في ووردبريس.',
    content: '<p>محتوى تجريبي لشرح طريقة العرض والروابط <a href="https://google.com">رابط تجريبي يفتح في نافذة جديدة</a>.</p>',
    category: 'تأملات',
    date: '20 أكتوبر 2025م',
    imageUrl: 'https://images.unsplash.com/photo-1518005020450-eba95a04ff17?q=80&w=800',
    link: '#'
  }
];

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  
  const detailRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const postsRef = useRef<Post[]>([]);

  // تحديث الميتا تاقات (Open Graph) بشكل فعّال
  const updateMetaData = (post: Post | null) => {
    const defaultTitle = "مسودّة للنشر - سلمان الأسمري";
    const defaultDesc = "مدونة شخصية عن الإعلانات والأفلام والتأملات الشخصية.";
    const defaultImg = "https://asmari.me/wp-content/uploads/2023/12/cropped-Fav-192x192.png";

    document.title = post ? post.title : defaultTitle;
    
    const tags = {
      'og:title': post ? post.title : defaultTitle,
      'og:description': post ? post.excerpt : defaultDesc,
      'og:image': post ? post.imageUrl : defaultImg,
      'og:url': window.location.href,
      'twitter:title': post ? post.title : defaultTitle,
      'twitter:description': post ? post.excerpt : defaultDesc,
      'twitter:image': post ? post.imageUrl : defaultImg,
    };

    Object.entries(tags).forEach(([prop, content]) => {
      let meta = document.querySelector(`meta[property="${prop}"]`) || 
                 document.querySelector(`meta[name="${prop}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        const newMeta = document.createElement('meta');
        if (prop.startsWith('og:')) newMeta.setAttribute('property', prop);
        else newMeta.setAttribute('name', prop);
        newMeta.setAttribute('content', content);
        document.head.appendChild(newMeta);
      }
    });
  };

  useEffect(() => {
    const loadData = async () => {
      const wpPosts = await fetchWordPressPosts();
      const finalPosts = wpPosts.length > 0 ? wpPosts : MOCK_POSTS;
      setPosts(finalPosts);
      postsRef.current = finalPosts;
      
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('p');
      if (postId) {
        const post = finalPosts.find(p => p.id === postId);
        if (post) {
          setSelectedPost(post);
          updateMetaData(post);
        }
      } else {
        updateMetaData(null);
      }
      setIsLoading(false);
    };
    loadData();

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('p');
      if (postId) {
        const post = postsRef.current.find(p => p.id === postId);
        if (post) {
          setSelectedPost(post);
          updateMetaData(post);
        }
      } else {
        setSelectedPost(null);
        updateMetaData(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      if (selectedPost && !isTransitioning.current && !isExiting) {
        const scrollPos = window.scrollY + window.innerHeight;
        const totalH = document.documentElement.scrollHeight;
        if (scrollPos >= totalH + 60) {
          isTransitioning.current = true;
          handleSmoothExit(); 
          setTimeout(() => { isTransitioning.current = false; }, 800);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedPost, isExiting]);

  const handleGlobalLinkClick = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor && anchor.href) {
      e.preventDefault();
      window.open(anchor.href, '_blank', 'noopener,noreferrer');
    }
  };

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCategory !== 'الكل') {
      result = result.filter(post => post.category === activeCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(q) || 
        post.excerpt.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, posts, searchQuery]);

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    updateMetaData(post);
    setIsSearchOpen(false);
    setIsExiting(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const newUrl = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    window.history.pushState({ postId: post.id }, '', newUrl);
  };

  const handleSmoothExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      setSelectedPost(null);
      updateMetaData(null);
      setIsExiting(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.history.pushState({}, '', window.location.pathname);
    }, 400);
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.excerpt, url: shareUrl });
      } catch (err) {}
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
    <div className="py-10 border-t border-white/5">
      <div className="flex justify-between items-center">
        <a href="https://asmari.me/" target="_blank" rel="noopener noreferrer" className="text-[24px] font-bold text-white hover:text-[#FFA042] transition-all">عنّي</a>
        <div className="flex items-center gap-2.5">
          {[
            { href: "https://x.com/asmaridotme", icon: <XIcon /> },
            { href: "https://www.instagram.com/asmari_sm/", icon: <Instagram size={16} /> },
            { href: "https://wa.me/966560004428?text=%D8%A3%D8%B3%D8%B9%D8%AF%20%D8%A7%D9%84%D9%84%D9%87%20%D8%A3%D9%88%D9%82%D8%A7%D8%AA%D9%83%20%D8%A8%D9%83%D9%84%20%D8%AE%D9%8A%D8%B1%20%D9%88%D9%85%D8%B3%D8%B1%D8%A9%20%D8%A3%D8%A8%D9%88%D8%B1%D9%8A%D8%A7%D9%86%D8%8C%20%D8%B4%D9%81%D8%AA%20%D9%85%D8%AF%D9%88%D9%86%D8%AA%D9%83%20%D9%88%D9%82%D9%84%D8%AA%20%D8%A7%D8%B3%D9%84%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%20..%20%D9%81%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D8%A8%D8%B1%D9%83%D8%A7%D8%AA%D9%87", icon: <MessageCircle size={16} /> }
          ].map((s, i) => (
            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl liquid-glass text-slate-300 hover:text-[#FFA042] transition-all active:scale-90">
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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 safe-top ${isScrolled || selectedPost ? 'glass-dark py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-md mx-auto px-6 relative flex justify-between items-center min-h-[44px]">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {selectedPost && <button onClick={handleSmoothExit} className="p-2 liquid-glass rounded-xl text-[#94A3B8] active:scale-90"><ArrowRight size={18} /></button>}
            <button onClick={() => { if(selectedPost) handleSmoothExit(); setActiveCategory('الكل'); }} className="flex items-baseline gap-2 text-right">
              <h1 className={`font-extrabold transition-all duration-500 text-white ${isScrolled || selectedPost ? 'text-xl' : 'text-2xl'}`}>مسودّة للنشر</h1>
              <p className={`font-medium transition-all duration-500 text-slate-400 ${isScrolled || selectedPost ? 'text-[10px]' : 'text-[12px]'}`}>بقلم سلمان الأسمري</p>
            </button>
          </div>
          <div className={`absolute left-6 h-[42px] flex items-center gap-2 transition-all duration-500 z-20 ${isSearchOpen ? 'w-[calc(100%-48px)]' : 'w-[42px]'}`}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if(selectedPost) handleSmoothExit(); }}
              placeholder={isSearchOpen ? "ابحث في المسودّة..." : ""}
              className={`w-full h-full bg-white/5 border rounded-[20px] transition-all duration-500 pr-11 pl-4 text-sm text-white focus:outline-none ${isSearchOpen ? 'opacity-100 border-[#FFA042]/40 bg-white/10' : 'opacity-0 border-white/10 pointer-events-none'}`}
            />
            <button onClick={() => { setIsSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }} className={`absolute right-0 top-0 w-[42px] h-[42px] flex items-center justify-center transition-all duration-500 rounded-xl ${isSearchOpen ? 'text-slate-400' : 'liquid-glass text-slate-400'}`} disabled={isSearchOpen}><Search size={18} /></button>
            {isSearchOpen && <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-xs font-bold text-[#FFA042] px-1">إلغاء</button>}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-12 pb-12 relative z-10">
        {selectedPost ? (
          <div ref={detailRef} className={`transition-all duration-500 ${isExiting ? 'opacity-0 translate-y-[-20px] blur-md' : 'opacity-100'}`} onClick={handleGlobalLinkClick}>
            <article className="pt-16">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-[#94A3B8] block mb-1 uppercase tracking-widest">{selectedPost.date}</span>
                <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">{selectedPost.title}</h2>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setActiveCategory(selectedPost.category); handleSmoothExit(); }} className="inline-flex items-center gap-1.5 px-3 py-1 liquid-glass rounded-full text-[10px] font-bold text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-[#1B19A8]"></span>{selectedPost.category}</button>
                  <button onClick={() => handleShare(selectedPost)} className="p-2 liquid-glass rounded-xl text-slate-400"><Share2 size={16} /></button>
                </div>
              </div>
              <div className="wp-content text-slate-200 text-[16px] leading-[1.8] space-y-4" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              <div className="mt-12 mb-8">
                <button onClick={() => handleShare(selectedPost)} className="w-full flex items-center justify-center gap-2 py-4 liquid-glass rounded-[1.5rem] border-[#FFA042]/20 text-white font-bold transition-all hover:bg-[#FFA042]/5"><Share2 size={18} className="text-[#FFA042]" />شارك التدوينة</button>
              </div>
            </article>
            <FooterContent />
            <div className="mt-8 flex flex-col items-center gap-4 opacity-30 pb-40 text-center animate-bounce">
              <ArrowUp size={20} className="text-[#FFA042]" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">تجاوز الهامش للعودة</span>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            <section className={`transition-all duration-700 overflow-hidden ${isScrolled || isSearchOpen ? 'opacity-0 -translate-y-4 max-h-0' : 'opacity-100 max-h-48 mb-6'}`}>
              <h3 className="text-[18px] font-bold text-white mb-1">نوّرت المسودّة ..</h3>
              <p className="text-[13px] leading-[1.7] text-slate-300/90">هنا مساحة اكتب فيها أنا <span className="text-white font-bold">سلمان الأسمري</span> عن الإعلانات، الأفلام، وتأملات شخصية تشغل البال.</p>
            </section>
            
            <section className="mb-6 sticky top-[54px] z-40">
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button key={cat.name} onClick={() => { setActiveCategory(cat.name); setIsSearchOpen(false); }} className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl transition-all duration-300 border ${activeCategory === cat.name ? 'bg-[#1B19A8] text-white shadow-lg border-[#1B19A8]/50' : 'liquid-glass text-slate-400'}`}>
                    <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
                    <span className="font-bold text-[11px]">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20"><Loader2 size={40} className="animate-spin text-[#1B19A8] opacity-50 mb-4" /><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">تحميل...</span></div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.length > 0 ? filteredPosts.map((post, idx) => (
                  <div key={post.id} onClick={() => handlePostClick(post)} className="block group liquid-glass rounded-[2rem] overflow-hidden transition-all duration-500 cursor-pointer" style={{ animation: `fadeInUp 0.6s ease-out ${idx * 0.05}s both` }}>
                    <div className="aspect-[16/9] overflow-hidden relative bg-[#121820]">
                      <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" alt={post.title} loading="lazy" />
                      <div className="absolute top-3 right-3 px-2 py-1 liquid-glass bg-black/40 rounded-lg text-[8px] font-black text-white">{post.category}</div>
                    </div>
                    <div className="p-5">
                      <div className="text-[10px] text-slate-400 font-bold mb-2">{post.date}</div>
                      <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#FFA042] transition-colors">{post.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{post.excerpt}</p>
                      <div className="flex items-center gap-1.5 text-[#FFA042] pt-4 border-t border-white/5 font-bold text-[12px]">اقرأ التدوينة <ChevronLeft size={14} /></div>
                    </div>
                  </div>
                )) : <div className="py-20 text-center text-slate-500 text-sm">لا توجد نتائج بحث</div>}
              </div>
            )}
            <FooterContent />
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .wp-content p { margin-bottom: 1.5rem; line-height: 1.8; font-size: 1.05rem; }
        .wp-content h1, .wp-content h2, .wp-content h3 { color: #fff; font-weight: 800; margin: 2rem 0 1rem; line-height: 1.3; }
        .wp-content a { color: #FFA042; text-decoration: underline; font-weight: 600; }
        .wp-content blockquote { font-size: 1.5rem; color: #FFA042; border-right: 4px solid #1B19A8; padding-right: 1.5rem; margin: 2rem 0; font-style: italic; }
        .wp-content img, .wp-content iframe { border-radius: 1.5rem; margin: 2rem 0; width: 100% !important; height: auto !important; }
      `}</style>
    </div>
  );
};

export default App;