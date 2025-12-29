
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

  // تأثير لتحميل البيانات والتحقق من وجود ID في الرابط عند الفتح لأول مرة
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const wpPosts = await fetchWordPressPosts();
      const finalPosts = wpPosts.length > 0 ? wpPosts : MOCK_POSTS;
      setPosts(finalPosts);
      
      // التحقق من وجود المعرف p في الرابط
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('p');
      if (postId) {
        const post = finalPosts.find(p => p.id === postId);
        if (post) {
          setSelectedPost(post);
        }
      }
      setIsLoading(false);
    };
    loadData();

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('p');
      if (postId) {
        const post = posts.find(p => p.id === postId);
        if (post) setSelectedPost(post);
      } else {
        setSelectedPost(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      if (selectedPost && !isTransitioning.current && !isExiting) {
        const scrollBottom = window.scrollY + window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight;
        if (scrollBottom >= totalHeight - 2) {
          isTransitioning.current = true;
          handleSmoothExit(); 
          setTimeout(() => { isTransitioning.current = false; }, 1200);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedPost, isExiting, posts]);

  const handleContentInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.href) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  };

  useEffect(() => {
    if (selectedPost && detailRef.current) {
      const links = detailRef.current.querySelectorAll('.wp-content a');
      links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      });
    }
  }, [selectedPost]);

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

  const recommendedPosts = useMemo(() => {
    if (!selectedPost) return [];
    return posts
      .filter(p => p.id !== selectedPost.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
  }, [selectedPost, posts]);

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsSearchOpen(false);
    setIsExiting(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // تحديث الرابط في المتصفح
    const newUrl = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    window.history.pushState({ postId: post.id }, '', newUrl);
  };

  const handleSmoothExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      setSelectedPost(null);
      setIsExiting(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      // إزالة الـ ID من الرابط عند العودة للرئيسية
      window.history.pushState({}, '', window.location.pathname);
    }, 500);
  };

  const handleBack = () => {
    handleSmoothExit();
  };

  const handleTitleClick = () => {
    if (selectedPost) handleBack();
    setActiveCategory('الكل');
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleCategoryTagClick = (category: Category) => {
    setActiveCategory(category);
    handleBack();
  };

  const handleShare = async (post: Post) => {
    // الرابط "الجميل" هو رابط موقعك الحالي + معرف التدوينة
    const shareUrl = `${window.location.origin}${window.location.pathname}?p=${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          url: shareUrl,
        });
      } catch (err) {
        console.debug('Sharing dismissed');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('تم نسخ رابط التدوينة الخاص بالموقع!');
    }
  };

  const categories: {name: Category | 'الكل', icon: React.ReactNode}[] = [
    { name: 'الكل', icon: <LayoutGrid size={15} /> },
    { name: 'إعلانات', icon: <Megaphone size={15} /> },
    { name: 'أفلام', icon: <Film size={15} /> },
    { name: 'تأملات', icon: <Sparkles size={15} /> },
    { name: 'منوعات', icon: <MessageSquare size={15} /> },
  ];

  const currentYear = new Date().getFullYear();

  const FooterContent = () => (
    <div className="py-10 border-t border-white/5">
      <div className="flex justify-between items-center">
        <a 
          href="https://asmari.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="myriad-font text-[24px] font-normal text-white hover:text-[#FFA042] transition-all"
        >
          عنّي
        </a>
        <div className="flex items-center gap-2.5">
          {[
            { href: "https://x.com/asmaridotme", icon: <XIcon />, title: "X" },
            { href: "https://www.instagram.com/asmari_sm/", icon: <Instagram size={16} />, title: "Instagram" },
            { href: "https://wa.me/966560004428?text=%D8%A3%D8%B3%D8%B9%D8%AF%20%D8%A7%D9%84%D9%84%D9%87%20%D8%A3%D9%88%D9%82%D8%A7%D8%AA%D9%83%20%D8%A8%D9%83%D9%84%20%D8%AE%D9%8اي%D8%B1%20%D9%88%D9%85%D8%B3%D8%B1%D8%A9%20%D8%A3%D8%A8%D9%88%D8%B1%D9%8A%D8%A7%D9%86%D8%8C%20%D8%B4%D9%81%D8%AA%20%D9%85%D8%AF%D9%88%D9%86%D8%AA%D9%83%20%D9%88%D9%82%D9%84%D8%AA%20%D8%A7%D8%B3%D9%84%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%20..%20%D9%81%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D8%A8%D8%B1%D9%83%D8%A7%D8%AA%D9%87", icon: <MessageCircle size={16} />, title: "WhatsApp" }
          ].map((social, i) => (
            <a 
              key={i}
              href={social.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-xl liquid-glass text-slate-300 hover:text-[#FFA042] hover:border-[#FFA042]/30 transition-all active:scale-90"
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
    </div>
  );

  return (
    <div className="min-h-screen text-right myriad-font" dir="rtl">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 safe-top ${
        isScrolled || selectedPost ? 'glass-dark py-2' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-md mx-auto px-6 relative flex justify-between items-center min-h-[44px]">
          <div className={`flex items-center gap-3 transition-all duration-300 transform-gpu ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            {selectedPost && (
              <button onClick={handleBack} className="p-2 liquid-glass rounded-xl text-[#94A3B8] active:scale-90 transition-all">
                <ArrowRight size={18} />
              </button>
            )}
            <button onClick={handleTitleClick} className="flex items-baseline gap-2 text-right group">
              <h1 className={`myriad-font font-bold tracking-tight transition-all duration-500 text-white group-hover:text-[#FFA042] ${isScrolled || selectedPost ? 'text-xl' : 'text-2xl'}`}>
                مسودّة للنشر
              </h1>
              <p className={`myriad-font font-normal transition-all duration-500 text-slate-400 whitespace-nowrap ${isScrolled || selectedPost ? 'text-[10px]' : 'text-[12px]'}`}>
                بقلم سلمان الأسمري
              </p>
            </button>
          </div>
          <div className={`absolute left-6 h-[42px] flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] origin-left z-20 ${isSearchOpen ? 'w-[calc(100%-48px)]' : 'w-[42px]'}`}>
            <div className="relative w-full h-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSearchOpen ? "ابحث في المسودّة..." : ""}
                className={`w-full h-full bg-white/5 border rounded-[20px] transition-all duration-500 pr-11 pl-4 text-sm text-white focus:outline-none myriad-font ${isSearchOpen ? 'opacity-100 border-[#FFA042]/40 bg-white/10 shadow-[0_0_15px_rgba(255,160,66,0.1)]' : 'opacity-0 border-white/10 pointer-events-none'}`}
              />
              <button onClick={() => setIsSearchOpen(true)} className={`absolute right-0 top-0 w-[42px] h-[42px] flex items-center justify-center transition-all duration-500 rounded-xl ${isSearchOpen ? 'text-slate-400' : 'liquid-glass text-slate-400 hover:text-white'}`} disabled={isSearchOpen}>
                <Search size={18} />
              </button>
            </div>
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className={`whitespace-nowrap text-xs font-bold text-[#FFA042] px-1 transition-all duration-300 myriad-font ${isSearchOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>إلغاء</button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-12 pb-12 relative z-10">
        {selectedPost && (
          <div ref={detailRef} className={`transition-all duration-500 transform-gpu ${isExiting ? 'opacity-0 translate-y-[-40px] blur-lg' : 'opacity-100 translate-y-0 animate-in fade-in slide-in-from-left-4'}`} onMouseDown={handleContentInteraction} onTouchStart={handleContentInteraction}>
            <article className="pt-16">
              <div className="mb-6 text-right">
                <span className="text-[10px] font-bold text-[#94A3B8] block mb-1 opacity-80 uppercase tracking-widest myriad-font">{selectedPost.date}</span>
                <h2 className="text-3xl font-bold text-white leading-tight mb-4 myriad-font">{selectedPost.title}</h2>
                <div className="flex items-center justify-between">
                  <button onClick={() => handleCategoryTagClick(selectedPost.category)} className="inline-flex items-center gap-1.5 px-3 py-1 liquid-glass rounded-full text-[10px] font-bold text-slate-400 hover:text-[#FFA042] hover:border-[#FFA042]/30 transition-all myriad-font">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1B19A8]"></span>{selectedPost.category}
                  </button>
                  <button onClick={() => handleShare(selectedPost)} className="p-2 liquid-glass rounded-xl text-slate-400 hover:text-[#FFA042] transition-all active:scale-90">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              <div className="wp-content text-slate-200 text-[16px] leading-[1.8] space-y-4 text-right myriad-font" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              <div className="mt-12 mb-8">
                <button onClick={() => handleShare(selectedPost)} className="w-full flex items-center justify-center gap-2 py-4 liquid-glass rounded-[1.5rem] border-[#FFA042]/20 hover:border-[#FFA042]/50 hover:bg-[#FFA042]/5 transition-all group active:scale-[0.98]">
                  <Share2 size={18} className="text-[#FFA042] group-hover:scale-110 transition-transform" />
                  <span className="text-[14px] font-bold text-white group-hover:text-[#FFA042] transition-colors myriad-font">شارك رابط التدوينة</span>
                </button>
              </div>
              {recommendedPosts.length > 0 && (
                <section className="mt-10 pt-10 border-t border-white/10 text-right">
                  <h4 className="text-[#FFA042] text-sm font-bold mb-6 flex items-center gap-2 justify-start myriad-font"><Sparkles size={16} />تدوينات أخرى قد تعجبك:</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {recommendedPosts.map((rp) => (
                      <div key={rp.id} onClick={() => handlePostClick(rp)} className="liquid-glass p-4 rounded-2xl flex flex-row-reverse gap-4 items-center cursor-pointer hover:border-[#1B19A8]/30 transition-all active:scale-[0.98] text-right">
                        <img src={rp.imageUrl} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0 text-right">
                          <h5 className="text-[13px] font-bold text-white mb-1 line-clamp-1 myriad-font">{rp.title}</h5>
                          <div className="text-[9px] text-slate-500 font-bold uppercase myriad-font">{rp.category}</div>
                        </div>
                        <ChevronLeft size={16} className="text-slate-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>
            <div className="mt-12"><FooterContent /></div>
            <div className="mt-16 flex flex-col items-center gap-4 opacity-30 pb-40 text-center animate-bounce">
              <ArrowUp size={20} className="text-[#FFA042]" /><span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest myriad-font">اسحب للعودة للرئيسية</span>
            </div>
          </div>
        )}

        <div className={`transition-all duration-700 ${selectedPost ? 'hidden pointer-events-none' : 'block animate-in fade-in slide-in-from-bottom-4'}`}>
          <section className={`transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${isScrolled || isSearchOpen ? 'opacity-0 -translate-y-12 max-h-0 mb-0 blur-sm scale-95' : 'opacity-100 translate-y-0 max-h-48 mb-2'}`}>
            <div className="space-y-1.5 text-right">
              <h3 className="text-[18px] font-bold text-white myriad-font">نوّرت المسودّة ..</h3>
              <p className="text-[13px] leading-[1.7] text-slate-300/90 font-normal myriad-font">هنا مساحة اكتب فيها أنا <span className="text-white font-bold">سلمان الأسمري</span> عن الإعلانات، الأفلام، وتأملات شخصية تشغل البال.</p>
            </div>
          </section>
          <section className="mb-5 sticky top-[54px] z-40 pb-2.5 pt-0">
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button key={cat.name} onClick={() => { setActiveCategory(cat.name); setIsSearchOpen(false); }} className={`flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl transition-all duration-300 border ${activeCategory === cat.name ? 'bg-[#1B19A8] text-white shadow-lg shadow-[#1B19A8]/30 border-[#1B19A8]/50 scale-[1.02]' : 'liquid-glass text-slate-400'}`}>
                  <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#1B19A8]'}>{cat.icon}</span>
                  <span className="font-bold text-[11px] myriad-font">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-[#1B19A8] mb-4 opacity-50" />
              <span className="text-xs font-bold text-slate-500 tracking-widest uppercase myriad-font">جاري التحميل...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post, idx) => (
                <div key={post.id} onClick={() => handlePostClick(post)} className="block group liquid-glass rounded-[2rem] overflow-hidden hover:border-[#1B19A8]/50 transition-all duration-500 cursor-pointer text-right" style={{ animation: `fadeInUp 0.8s ease-out ${idx * 0.1}s both` }}>
                  <article>
                    <div className="aspect-video overflow-hidden relative">
                      <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt={post.title} />
                      <div className="absolute top-3 right-3 px-2.5 py-1 liquid-glass bg-black/40 rounded-lg text-[8px] font-black text-white uppercase tracking-wider myriad-font">{post.category}</div>
                    </div>
                    <div className="p-5 text-right">
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mb-2 myriad-font"><span>{post.date}</span></div>
                      <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-[#FFA042] transition-colors myriad-font">{post.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed opacity-90 mb-4 myriad-font">{post.excerpt}</p>
                      <div className="flex items-center justify-start pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-[#FFA042] transition-all duration-300 group-hover:gap-2.5">
                          <span className="text-[12px] font-bold myriad-font">اقرأ التدوينة</span><ChevronLeft size={14} className="mt-0.5" />
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {!selectedPost && <footer className="max-w-md mx-auto px-6 pb-10 pt-6 relative z-10"><FooterContent /></footer>}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .wp-content p { margin-bottom: 1.5rem; text-align: right; line-height: 1.8; font-family: 'Myriad Arabic-mob', 'Geeza Pro', 'Noto Sans Arabic', -apple-system, sans-serif !important; }
        .wp-content h1, .wp-content h2, .wp-content h3 { font-family: 'Myriad Arabic-mob', 'Geeza Pro', 'Noto Sans Arabic', -apple-system, sans-serif !important; color: #fff; font-weight: 800; margin: 2.5rem 0 1.2rem; text-align: right; }
        .wp-content a { color: #FFA042; text-decoration: underline; text-underline-offset: 4px; font-weight: 600; cursor: pointer; }
        .wp-content blockquote { font-family: 'Myriad Arabic-mob', 'Geeza Pro', 'Noto Sans Arabic', -apple-system, sans-serif !important; text-align: right; font-size: 1.8rem; color: #FFA042; margin: 3.5rem 0; padding: 1rem 1rem 1rem 0; line-height: 1.3; }
        .wp-content iframe, .wp-content video, .wp-content img { width: 100% !important; max-width: 100% !important; height: auto !important; border-radius: 1.5rem; margin: 2rem 0; }
        .wp-content * { max-width: 100% !important; overflow-wrap: break-word; }
      `}</style>
    </div>
  );
};

export default App;
