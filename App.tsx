
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Film, 
  MessageSquare, 
  Sparkles, 
  LayoutGrid, 
  ChevronLeft, 
  Search, 
  User, 
  Home,
  Bookmark,
  Zap,
  Loader2
} from 'lucide-react';
import { Category, Post } from './types';
import { getSmartIntroduction } from './geminiService';
import { fetchWordPressPosts } from './wpService';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [greeting, setGreeting] = useState("أهلاً بك في مدونتي...");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const wpPosts = await fetchWordPressPosts();
      setPosts(wpPosts);
      setIsLoading(false);
    };
    loadData();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchGreeting = async () => {
      const cat = activeCategory === 'الكل' ? 'تأملات' : activeCategory;
      const msg = await getSmartIntroduction(cat);
      setGreeting(msg);
    };
    fetchGreeting();
  }, [activeCategory]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'الكل') return posts;
    return posts.filter(post => post.category === activeCategory);
  }, [activeCategory, posts]);

  const categories: {name: Category | 'الكل', icon: React.ReactNode}[] = [
    { name: 'الكل', icon: <LayoutGrid size={18} /> },
    { name: 'إعلانات', icon: <Bell size={18} /> },
    { name: 'أفلام', icon: <Film size={18} /> },
    { name: 'تأملات', icon: <Sparkles size={18} /> },
    { name: 'منوعات', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] pb-24">
      {/* Dynamic Header - iPhone Optimized */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 safe-top ${
        isScrolled ? 'glass-dark py-3 translate-y-0' : 'bg-transparent py-10'
      }`}>
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className={`font-black tracking-tight transition-all duration-500 heading-font ${
              isScrolled ? 'text-xl text-[#5350FF]' : 'text-5xl text-white'
            }`}>
              asmari.me
            </h1>
            {!isScrolled && (
              <p className="text-[10px] text-[#FFA042] font-black uppercase tracking-[0.3em] mt-2 opacity-80">
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/20 active:scale-90 transition-all">
              <Search size={20} className="text-[#FFA042]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-40">
        {/* AI Greeting Card */}
        <section className="mb-12">
          <div className="relative p-8 bg-gradient-to-br from-[#121820] to-[#07090D] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#1B19A8]/10 blur-[80px] rounded-full group-hover:bg-[#1B19A8]/20 transition-colors"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-7 h-7 bg-[#FFA042]/20 rounded-full">
                  <Zap size={14} className="text-[#FFA042] fill-[#FFA042]" />
                </div>
                <span className="text-[10px] uppercase font-black text-[#FFA042] tracking-widest">إلهام اليوم</span>
              </div>
              <p className="text-2xl font-bold text-white leading-relaxed body-font italic opacity-95">
                "{greeting}"
              </p>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] heading-font">استكشف الأقسام</h2>
            <div className="h-[1px] bg-gradient-to-r from-white/10 to-transparent flex-grow mx-4"></div>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-3 px-7 py-5 rounded-[2rem] whitespace-nowrap transition-all duration-500 border ${
                  activeCategory === cat.name 
                  ? 'bg-[#1B19A8] text-white shadow-2xl shadow-[#1B19A8]/40 border-[#5350FF]/50 scale-105' 
                  : 'bg-[#121820] text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#5350FF]'}>{cat.icon}</span>
                <span className="font-bold text-sm tracking-wide">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#5350FF]">
            <Loader2 size={48} className="animate-spin mb-6 opacity-50" />
            <span className="heading-font font-bold tracking-widest text-xs uppercase opacity-70">جاري تحميل أفكاري...</span>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Posts Grid */}
            <div className="grid gap-8">
              {filteredPosts.length > 0 ? filteredPosts.map((post, idx) => (
                <div 
                  key={post.id} 
                  className="group relative bg-[#121820] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#5350FF]/30 transition-all duration-700 shadow-xl"
                  style={{ animation: `fadeInUp 0.8s ease-out ${idx * 0.15}s both` }}
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img 
                      src={post.imageUrl} 
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                      alt={post.title} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121820] via-transparent to-transparent opacity-60"></div>
                    <div className="absolute top-5 right-5">
                      <span className="px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-[9px] font-black text-white uppercase tracking-widest shadow-2xl">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-7">
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold mb-4 opacity-80">
                      <span>{post.date}</span>
                      <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                      <span className="text-[#FFA042]">{post.readTime}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-4 leading-snug heading-font group-hover:text-[#FFA042] transition-colors duration-300">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6 opacity-90 body-font">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1B19A8] to-[#5350FF] flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                          A
                        </div>
                        <span className="text-[11px] font-bold text-white/70">أسمري</span>
                      </div>
                      <button className="flex items-center gap-2 text-[11px] font-black text-[#FFA042] group-hover:translate-x-[-4px] transition-transform">
                        اقرأ المزيد <ChevronLeft size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-[#121820] rounded-[3rem] border border-dashed border-white/10">
                  <p className="text-slate-500 heading-font font-bold">عذراً، لا توجد مقالات في هذا القسم حالياً.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* iPhone Navigation Bar Emulation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 glass-dark rounded-t-[2.5rem] border-t border-white/5">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button className="flex flex-col items-center gap-1.5 text-[#5350FF]">
            <Home size={22} fill="currentColor" className="opacity-20" />
            <span className="text-[9px] font-black uppercase tracking-tighter">الرئيسية</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors">
            <Bookmark size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">المحفوظات</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors">
            <User size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">عني</span>
          </button>
        </div>
      </nav>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .safe-top {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </div>
  );
};

export default App;
