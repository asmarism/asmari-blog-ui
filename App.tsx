
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
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Category, Post } from './types';
import { getSmartIntroduction } from './geminiService';
import { fetchWordPressPosts } from './wpService';

// بيانات تجريبية تظهر فقط في حال فشل الـ API (للحفاظ على جمالية التطبيق)
const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    title: 'تأملات في الفن والجمال الرقمي',
    excerpt: 'هذا المحتوى يظهر لأن الاتصال بمدونتك لا يزال قيد الإعداد. تأكد من تفعيل الـ API في ووردبريس.',
    category: 'تأملات',
    date: '١٥ رمضان',
    imageUrl: 'https://images.unsplash.com/photo-1518005020450-eba95a04ff17?q=80&w=800',
    readTime: '٤ دقائق قراءة'
  },
  {
    id: 'mock-2',
    title: 'أفضل أفلام السينما العالمية في ٢٠٢٤',
    excerpt: 'نظرة عميقة على الأفلام التي غيرت مفاهيم الإخراج هذا العام، من هوليوود إلى السينما المستقلة.',
    category: 'أفلام',
    date: '١٠ رمضان',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800',
    readTime: '٧ دقائق قراءة'
  }
];

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'الكل'>('الكل');
  const [greeting, setGreeting] = useState("أهلاً بك في فضاء أسمري الخاص...");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const wpPosts = await fetchWordPressPosts();
      if (wpPosts.length > 0) {
        setPosts(wpPosts);
        setIsError(false);
      } else {
        // إذا لم نجد بيانات، نعرض البيانات التجريبية وننبه المستخدم
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
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 safe-top ${
        isScrolled ? 'glass-dark py-3' : 'bg-transparent py-10'
      }`}>
        <div className="max-w-md mx-auto px-6 flex justify-between items-center">
          <h1 className={`font-black tracking-tight transition-all duration-500 heading-font ${
            isScrolled ? 'text-xl text-[#5350FF]' : 'text-5xl text-white'
          }`}>
            asmari.me
          </h1>
          <button className="p-3 bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-all">
            <Search size={20} className="text-[#FFA042]" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-40">
        {/* Error Alert (Only shows if connection failed) */}
        {isError && !isLoading && (
          <div className="mb-8 p-4 bg-[#FFA042]/10 border border-[#FFA042]/20 rounded-2xl flex gap-3 items-center">
            <AlertCircle className="text-[#FFA042] flex-shrink-0" size={20} />
            <p className="text-[11px] text-[#FFA042] font-bold leading-relaxed">
              تنبيه: لم نتمكن من سحب المقالات من blog.asmari.me. تأكد من ضبط "الروابط الدائمة" في ووردبريس على خيار "عنوان المقالة".
            </p>
          </div>
        )}

        {/* AI Greeting */}
        <section className="mb-12">
          <div className="relative p-8 bg-[#121820] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B19A8]/10 blur-[60px] rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Zap size={14} className="text-[#FFA042] fill-[#FFA042]" />
                <span className="text-[10px] uppercase font-black text-[#FFA042] tracking-[0.2em]">إلهام اليوم</span>
              </div>
              <p className="text-2xl font-bold text-white leading-relaxed body-font italic italic opacity-95">
                "{greeting}"
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] whitespace-nowrap transition-all duration-500 border ${
                  activeCategory === cat.name 
                  ? 'bg-[#1B19A8] text-white shadow-2xl shadow-[#1B19A8]/40 border-[#5350FF]/50' 
                  : 'bg-[#121820] text-slate-400 border-white/5'
                }`}
              >
                <span className={activeCategory === cat.name ? 'text-[#FFA042]' : 'text-[#5350FF]'}>{cat.icon}</span>
                <span className="font-bold text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={40} className="animate-spin text-[#5350FF] mb-4 opacity-50" />
            <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">جاري الاتصال بمدونتك...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-700">
            {filteredPosts.map((post, idx) => (
              <article 
                key={post.id} 
                className="group bg-[#121820] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#5350FF]/30 transition-all duration-500 shadow-xl"
                style={{ animation: `fadeInUp 0.8s ease-out ${idx * 0.1}s both` }}
              >
                <div className="aspect-video overflow-hidden relative">
                  <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" alt={post.title} />
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-wider">
                    {post.category}
                  </div>
                </div>
                <div className="p-7">
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold mb-3">
                    <span>{post.date}</span>
                    <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                    <span className="text-[#FFA042]">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 leading-snug group-hover:text-[#FFA042] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed opacity-90 mb-6">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1B19A8] flex items-center justify-center text-[10px] font-bold text-white">A</div>
                      <span className="text-[11px] font-bold text-white/70">أسمري</span>
                    </div>
                    <ChevronLeft size={18} className="text-[#FFA042] group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Nav Emulation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 glass-dark rounded-t-[2.5rem] border-t border-white/5">
        <div className="max-w-md mx-auto flex justify-between items-center px-4">
          <button className="text-[#5350FF] flex flex-col items-center gap-1">
            <Home size={22} fill="currentColor" className="opacity-20" />
            <span className="text-[9px] font-black uppercase">الرئيسية</span>
          </button>
          <button className="text-slate-500 flex flex-col items-center gap-1">
            <Bookmark size={22} />
            <span className="text-[9px] font-black uppercase">المحفوظات</span>
          </button>
          <button className="text-slate-500 flex flex-col items-center gap-1">
            <User size={22} />
            <span className="text-[9px] font-black uppercase">عني</span>
          </button>
        </div>
      </nav>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .safe-top { padding-top: env(safe-area-inset-top); }
      `}</style>
    </div>
  );
};

export default App;
