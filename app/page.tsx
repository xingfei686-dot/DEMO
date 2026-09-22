"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, Compass, ExternalLink, Heart, LogOut, Map, MapPin, Minus, Navigation, Plus, Search, Send, Sparkles, Trash2, Users, WalletCards, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Activity = { id: number; time: string; title: string; detail: string; cost: number; place?: string };
type Day = { day: number; title: string; activities: Activity[] };
type Coordinates = { lat: number; lng: number };
type ChatMessage = { role: "assistant" | "user"; text: string };
type Trip = { id: string; destination: string; city: string; days: Day[]; budget: string; style: string; startDate: string; endDate: string; travelers: number; query: string; nightlyStayCost?: number; transportCost?: number; updatedAt: number };
const TRIPS_KEY = "wander-trips-v2";
const DRAFT_KEY = "wander-draft-v2";
const cloneDays = (value: Day[]) => value.map((day) => ({ ...day, activities: day.activities.map((activity) => ({ ...activity })) }));
const styleLabel = (value: string) => ({ relaxed: "松弛慢游", balanced: "张弛有度", packed: "充实探索" })[value as "relaxed" | "balanced" | "packed"] || value;
const fitDays = (template: Day[], length: number): Day[] => Array.from({ length }, (_, index) => template[index] ? cloneDays([template[index]])[0] : { day: index + 1, title: "自由探索", activities: [] });
const destinationDetails: Record<string, { mood: string; bestFor: string; highlights: string[]; days: string }> = {
  tokyo: { mood: "城市漫游 · 美食与设计", bestFor: "适合初次到访、喜欢街区探索的旅行者", highlights: ["清澄白河", "根津美术馆", "涩谷天空"], days: "建议 3–5 天" },
  lisbon: { mood: "海风山城 · 老街与日落", bestFor: "适合喜欢慢步调、历史街区和海岸线的旅行者", highlights: ["阿尔法玛", "贝伦", "辛特拉"], days: "建议 3–4 天" },
  bali: { mood: "海岛疗愈 · 山林与海岸", bestFor: "适合想放慢节奏、结合自然与度假的旅行者", highlights: ["乌布", "巴杜尔火山", "乌鲁瓦图"], days: "建议 4–6 天" },
};

const featuredPlaces: Record<number, { name: string; wiki: string; area: string }> = {
  11: { name: "银座", wiki: "银座", area: "东京 · 中央区" },
  12: { name: "清澄白河", wiki: "清澄白河站", area: "东京 · 江东区" },
  13: { name: "东京湾", wiki: "东京湾", area: "东京 · 海湾地区" },
  21: { name: "筑地场外市场", wiki: "筑地市场", area: "东京 · 中央区" },
  22: { name: "根津美术馆", wiki: "根津美术馆", area: "东京 · 南青山" },
  23: { name: "SHIBUYA SKY", wiki: "涩谷", area: "东京 · 涩谷区" },
  31: { name: "代官山", wiki: "代官山", area: "东京 · 涩谷区" },
  32: { name: "代代木公园", wiki: "代代木公園", area: "东京 · 涩谷区" },
  33: { name: "新宿", wiki: "新宿", area: "东京 · 新宿区" },
  41: { name: "阿尔法玛", wiki: "阿爾法瑪", area: "里斯本 · 老城区" },
  42: { name: "28 路电车", wiki: "里斯本電車", area: "里斯本 · 老城区" },
  43: { name: "阿尔法玛", wiki: "阿爾法瑪", area: "里斯本 · 老城区" },
  51: { name: "热罗尼莫斯修道院", wiki: "哲罗姆派修道院", area: "里斯本 · 贝伦" },
  52: { name: "LX Factory", wiki: "里斯本", area: "里斯本 · 阿尔坎塔拉" },
  53: { name: "塔霍河畔", wiki: "塔霍河", area: "里斯本 · 河岸" },
  61: { name: "辛特拉", wiki: "辛特拉", area: "葡萄牙 · 辛特拉" },
  62: { name: "佩纳宫", wiki: "佩納宮", area: "葡萄牙 · 辛特拉" },
  63: { name: "罗卡角", wiki: "罗卡角", area: "葡萄牙 · 辛特拉" },
  71: { name: "乌布", wiki: "乌布", area: "巴厘岛 · 乌布" },
  72: { name: "Campuhan Ridge Walk", wiki: "烏布", area: "巴厘岛 · 乌布" },
  73: { name: "乌布", wiki: "乌布", area: "巴厘岛 · 乌布" },
  81: { name: "巴杜尔火山", wiki: "巴杜尔火山", area: "巴厘岛 · 邦利" },
  82: { name: "巴杜尔湖", wiki: "巴杜尔湖", area: "巴厘岛 · 金塔马尼" },
  83: { name: "乌布", wiki: "乌布", area: "巴厘岛 · 乌布" },
  91: { name: "乌鲁瓦图", wiki: "烏魯瓦圖", area: "巴厘岛 · 南部海岸" },
  92: { name: "乌鲁瓦图海滩", wiki: "烏魯瓦圖", area: "巴厘岛 · 南部海岸" },
  93: { name: "乌鲁瓦图寺", wiki: "烏魯瓦圖寺", area: "巴厘岛 · 南部海岸" },
};

const activityPlace = (item: Activity) => item.place !== undefined ? item.place.trim() : featuredPlaces[item.id]?.name || item.title.trim();

function dayRouteUrl(day: Day, city: string) {
  const places = day.activities.map(activityPlace).filter(Boolean).map((place) => `${place} ${city}`);
  const root = "https://www.google.com/maps/dir/?api=1";
  if (!places.length) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`;
  if (places.length === 1) return `${root}&destination=${encodeURIComponent(places[0])}`;
  const via = places.slice(1, -1);
  return `${root}&origin=${encodeURIComponent(places[0])}&destination=${encodeURIComponent(places.at(-1) || places[0])}${via.length ? `&waypoints=${encodeURIComponent(via.join("|"))}` : ""}`;
}

const assetPath = (file: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${file}`;
const doubaoApiUrl = "https://gotrip-doubao-api.xingfei686.workers.dev/api/chat";

function formatTripDate(value: string) {
  if (!value) return "选择日期";
  const [, month, day] = value.split("-").map(Number);
  return `${month} 月 ${day} 日`;
}

const plans: Record<string, { city: string; country: string; image: string; coordinates: Coordinates; days: Day[] }> = {
  tokyo: { city: "东京", country: "日本", image: assetPath("tokyo.webp"), coordinates: { lat: 35.6762, lng: 139.6503 }, days: [
    { day: 1, title: "城市初见", activities: [{ id: 11, time: "10:30", title: "抵达与入住", detail: "入住银座设计酒店，稍作休息", cost: 0 }, { id: 12, time: "15:00", title: "清澄白河散步", detail: "咖啡店、画廊与庭园的轻松路线", cost: 120 }, { id: 13, time: "19:00", title: "东京湾晚餐", detail: "预约临窗席，品尝当季会席料理", cost: 680 }] },
    { day: 2, title: "古老与当代", activities: [{ id: 21, time: "08:00", title: "筑地早餐", detail: "海鲜饭与玉子烧，避开午间人潮", cost: 180 }, { id: 22, time: "11:00", title: "根津美术馆", detail: "建筑、庭园与东亚艺术收藏", cost: 65 }, { id: 23, time: "17:30", title: "涩谷天空", detail: "在日落前 40 分钟抵达观景台", cost: 145 }] },
    { day: 3, title: "留给偶然", activities: [{ id: 31, time: "09:30", title: "代官山慢逛", detail: "书店、选物店与安静的社区街道", cost: 100 }, { id: 32, time: "14:00", title: "自由探索", detail: "根据天气和体力现场决定", cost: 0 }, { id: 33, time: "20:00", title: "新宿夜食", detail: "小巷居酒屋，体验东京夜生活", cost: 260 }] },
  ]},
  lisbon: { city: "里斯本", country: "葡萄牙", image: assetPath("hero.webp"), coordinates: { lat: 38.7223, lng: -9.1393 }, days: [
    { day: 1, title: "沿着海风抵达", activities: [{ id: 41, time: "11:00", title: "入住阿尔法玛", detail: "老城景观公寓与欢迎咖啡", cost: 0 }, { id: 42, time: "15:00", title: "28 路电车", detail: "穿过山城街巷，在观景台停留", cost: 35 }, { id: 43, time: "19:30", title: "法朵晚餐", detail: "传统音乐与葡式家常菜", cost: 420 }] },
    { day: 2, title: "贝伦与日落", activities: [{ id: 51, time: "09:00", title: "贝伦漫步", detail: "修道院、海岸和百年蛋挞店", cost: 90 }, { id: 52, time: "15:30", title: "LX Factory", detail: "独立书店与本地设计品牌", cost: 80 }, { id: 53, time: "18:30", title: "河岸日落", detail: "在四月二十五日大桥旁看日落", cost: 0 }] },
    { day: 3, title: "辛特拉一日", activities: [{ id: 61, time: "08:30", title: "前往辛特拉", detail: "搭乘火车，避开旅行团高峰", cost: 45 }, { id: 62, time: "10:30", title: "佩纳宫", detail: "彩色宫殿与山林步道", cost: 160 }, { id: 63, time: "17:00", title: "海角晚风", detail: "罗卡角短途徒步后返程", cost: 180 }] },
  ]},
  bali: { city: "巴厘岛", country: "印度尼西亚", image: assetPath("bali.webp"), coordinates: { lat: -8.5069, lng: 115.2625 }, days: [
    { day: 1, title: "进入慢节奏", activities: [{ id: 71, time: "12:00", title: "乌布入住", detail: "稻田景观度假村与欢迎午餐", cost: 0 }, { id: 72, time: "16:00", title: "稻田散步", detail: "沿 Campuhan 山脊轻徒步", cost: 0 }, { id: 73, time: "19:00", title: "庭院晚餐", detail: "现代印尼料理品鉴菜单", cost: 280 }] },
    { day: 2, title: "火山与温泉", activities: [{ id: 81, time: "04:00", title: "巴杜尔火山", detail: "向导陪同登顶观看日出", cost: 360 }, { id: 82, time: "10:00", title: "天然温泉", detail: "早餐后在湖畔温泉恢复体力", cost: 130 }, { id: 83, time: "16:00", title: "自由下午", detail: "按摩、泳池或咖啡馆任选", cost: 150 }] },
    { day: 3, title: "南部海岸", activities: [{ id: 91, time: "10:00", title: "前往乌鲁瓦图", detail: "沿海公路前往悬崖地区", cost: 120 }, { id: 92, time: "15:00", title: "隐秘海滩", detail: "在安静海湾游泳与休息", cost: 40 }, { id: 93, time: "18:00", title: "悬崖日落", detail: "观看传统舞蹈和印度洋日落", cost: 110 }] },
  ]},
};

function ActivityCard({ item, dayNumber, city, fallbackImage, onUpdate, onRemove }: {
  item: Activity;
  dayNumber: number;
  city: string;
  fallbackImage: string;
  onUpdate: (day: number, id: number, patch: Partial<Activity>) => void;
  onRemove: (day: number, id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<{ key: string; url: string | null; article: string | null } | null>(null);
  const featured = featuredPlaces[item.id];
  const place = item.place !== undefined ? item.place.trim() : featured?.name || item.title.trim();
  const wikiTitle = item.place !== undefined ? place : featured?.wiki || place;
  const photoReady = photo?.key === wikiTitle;
  const photoUrl = photoReady ? photo?.url : null;
  const mapQuery = encodeURIComponent(`${place} ${city}`);
  const googleRoute = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;
  const appleRoute = `https://maps.apple.com/?daddr=${mapQuery}`;
  const amapRoute = `https://uri.amap.com/search?keyword=${mapQuery}&callnative=1`;

  useEffect(() => {
    if (!open || !wikiTitle) return;
    const controller = new AbortController();
    type PhotoPage = { thumbnail?: { source: string }; canonicalurl?: string };
    const request = async (params: string): Promise<PhotoPage[]> => {
      const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&prop=pageimages%7Cinfo&inprop=url&piprop=thumbnail&pithumbsize=960&format=json&formatversion=2&origin=*&${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error("photo unavailable");
      const data = await response.json() as { query?: { pages?: PhotoPage[] } };
      return data.query?.pages || [];
    };
    void (async () => {
      try {
        const exact = await request(`redirects=1&titles=${encodeURIComponent(wikiTitle)}`);
        let page = exact.find((entry) => entry.thumbnail?.source);
        if (!page) {
          const nearby = await request(`generator=search&gsrsearch=${encodeURIComponent(`${place} ${city}`)}&gsrlimit=5`);
          page = nearby.find((entry) => entry.thumbnail?.source);
        }
        if (!controller.signal.aborted) setPhoto({ key: wikiTitle, url: page?.thumbnail?.source || null, article: page?.canonicalurl || null });
      } catch { if (!controller.signal.aborted) setPhoto({ key: wikiTitle, url: null, article: null }); }
    })();
    return () => controller.abort();
  }, [open, wikiTitle, place, city]);

  return <article className={`overflow-hidden rounded-[24px] border bg-white transition-all ${open ? "border-[#91a994] shadow-[0_16px_36px_rgba(23,60,50,.1)]" : "border-[#dce2dc] hover:border-[#aabdae] hover:shadow-[0_8px_24px_rgba(23,60,50,.06)]"}`}>
    <div className="flex gap-3 p-4 sm:gap-5 sm:p-5">
      <div className="w-16 shrink-0 pt-1 sm:w-[76px]"><span className="text-xs font-medium tracking-wide text-[#718078]">时间</span><input type="time" value={item.time} onChange={(event) => onUpdate(dayNumber, item.id, { time: event.target.value })} aria-label={`${item.title}时间`} className="mt-1 w-full bg-transparent text-sm font-semibold text-[#173c32] outline-none" /></div>
      <div className="min-w-0 flex-1"><div className="flex items-start gap-2"><label className="min-w-0 flex-1 text-xs text-[#718078]">活动名称<input value={item.title} onChange={(event) => onUpdate(dayNumber, item.id, { title: event.target.value })} className="mt-1 w-full bg-transparent text-base font-semibold text-[#15231e] outline-none sm:text-lg" placeholder="输入活动名称" /></label><button type="button" onClick={() => onRemove(dayNumber, item.id)} className="rounded-full p-2 text-[#8b9992] hover:bg-[#f2e6e2] hover:text-[#b74a38]" aria-label={`删除${item.title}`}><Trash2 className="size-4" /></button></div>
        <p className="mt-1 line-clamp-1 text-sm text-[#63766b]">{item.detail || "可添加地点和行程备注"}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f0f4ec] px-3 py-1.5 text-xs font-medium text-[#36594a]">{item.cost > 0 ? `约 ¥${item.cost}` : "免费体验"}</span><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={`place-${dayNumber}-${item.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#cbd9cd] bg-white px-3 py-1.5 text-xs font-semibold text-[#173c32] hover:border-[#173c32]">{place ? <MapPin className="size-3.5" /> : <Plus className="size-3.5" />}{open ? "收起地点" : place ? `查看 ${place}` : "添加地点"}<ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></button></div>
      </div>
    </div>
    {open && <div id={`place-${dayNumber}-${item.id}`} className="grid gap-5 border-t border-[#e5ebe5] bg-[#f8faf6] p-4 sm:p-5 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <div className="relative h-48 overflow-hidden rounded-2xl bg-[#dce6db] sm:h-56"><img src={photoUrl || fallbackImage} alt={photoUrl ? `${place}及周边的照片` : `${city}目的地参考图`} onError={() => { if (photoUrl) setPhoto({ key: wikiTitle, url: null, article: null }); }} className="h-full w-full object-cover" /><span className="absolute bottom-3 left-3 rounded-full bg-[#10291f]/75 px-3 py-1.5 text-xs text-white backdrop-blur">{photoUrl ? "地点及周边 · 维基百科" : photoReady ? "目的地参考图" : "正在查找地点照片"}</span></div>
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#688071]">Place details</p><div className="mt-2 flex items-center gap-2"><MapPin className="size-4 shrink-0 text-[#387257]" />{place ? <a href={googleRoute} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-lg font-semibold text-[#173c32] underline decoration-[#a3c5a6] underline-offset-4 hover:decoration-[#173c32]" title={`导航到${place}`}>{place}<ExternalLink className="ml-1 inline size-3.5" /></a> : <span className="text-sm text-[#718078]">填写地点后可直接导航</span>}</div><p className="mt-1 text-sm text-[#718078]">{featured && item.place === undefined ? featured.area : city}</p>
        <label className="mt-4 block text-xs font-medium text-[#60746b]">具体地点<input value={item.place ?? featured?.name ?? item.title} onChange={(event) => onUpdate(dayNumber, item.id, { place: event.target.value })} placeholder="例如：根津美术馆" className="mt-1.5 h-10 w-full rounded-xl border border-[#d4dfd4] bg-white px-3 text-sm text-[#15231e] outline-none focus:border-[#387257]" /></label>
        <label className="mt-3 block text-xs font-medium text-[#60746b]">地点与行程备注<input value={item.detail} onChange={(event) => onUpdate(dayNumber, item.id, { detail: event.target.value })} placeholder="交通、预约或其他提醒" className="mt-1.5 h-10 w-full rounded-xl border border-[#d4dfd4] bg-white px-3 text-sm text-[#15231e] outline-none focus:border-[#387257]" /></label>
        <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[#60746b]">预估费用 ¥<input type="number" min="0" value={item.cost} onChange={(event) => onUpdate(dayNumber, item.id, { cost: Math.max(0, Number(event.target.value) || 0) })} className="w-28 rounded-xl border border-[#d4dfd4] bg-white px-3 py-2 text-sm text-[#15231e] outline-none focus:border-[#387257]" /></label>
        {place && <div className="mt-4 flex flex-wrap gap-2"><a href={googleRoute} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#173c32] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#285a49]"><Navigation className="size-3.5" /> Google 路线</a><a href={appleRoute} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#cbd9cd] bg-white px-4 py-2.5 text-xs font-semibold text-[#173c32] hover:border-[#173c32]">Apple 地图</a><a href={amapRoute} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#cbd9cd] bg-white px-4 py-2.5 text-xs font-semibold text-[#173c32] hover:border-[#173c32]">高德地图</a></div>}
        {photoUrl && photo?.article && <a href={photo.article} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-xs text-[#718078] underline underline-offset-2">查看照片来源</a>}
      </div>
    </div>}
  </article>;
}

function RouteBudgetPanel({ city, image, dateSummary, days, travelers, budget, total, hotelCost, transportCost, activityTotal, nightlyStayCost, activeDay, onSelectDay, onBudgetChange, onNightlyStayChange, onTransportChange, appleMapsUrl, googleMapsUrl, amapUrl }: {
  city: string;
  image: string;
  dateSummary: string;
  days: Day[];
  travelers: number;
  budget: string;
  total: number;
  hotelCost: number;
  transportCost: number;
  activityTotal: number;
  nightlyStayCost: number;
  activeDay: string;
  onSelectDay: (value: string) => void;
  onBudgetChange: (value: string) => void;
  onNightlyStayChange: (value: number) => void;
  onTransportChange: (value: number) => void;
  appleMapsUrl: string;
  googleMapsUrl: string;
  amapUrl: string;
}) {
  const budgetNumber = Number(budget) || 0;
  const remaining = budgetNumber - total;
  const usage = budgetNumber > 0 ? Math.round(total / budgetNumber * 100) : 0;
  const activityCount = days.reduce((count, day) => count + day.activities.length, 0);
  const reserve = Math.round(budgetNumber * .1);

  return <aside aria-label="路线与预算总览" className="min-w-0 overflow-hidden rounded-[30px] border border-[#dbe3da] bg-white shadow-[0_20px_60px_rgba(20,45,37,.08)]">
    <div className="relative min-h-56 overflow-hidden bg-[#173c32] text-white"><img src={image} alt={`${city}旅行风景`} className="absolute inset-0 h-full w-full object-cover opacity-65" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,35,26,.88),rgba(7,35,26,.42)),linear-gradient(0deg,rgba(7,35,26,.6),transparent)]" /><div className="relative flex min-h-56 flex-col justify-between p-6 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#d8ff64]">Journey overview</p><h3 className="mt-3 text-3xl font-semibold tracking-tight">{city}旅行路线</h3><p className="mt-2 text-sm text-white/80">{dateSummary}</p></div><div className="flex flex-wrap gap-2 text-xs font-medium"><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur">{days.length} 天 {Math.max(0, days.length - 1)} 夜</span><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur">{activityCount} 个活动</span><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur">{travelers} 位旅客</span></div></div></div>

    <div className="bg-[#fbfcf8] p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#789082]">Daily route</p><h4 className="mt-1 text-xl font-semibold text-[#173c32]">每日路线</h4></div><Map className="size-5 text-[#638473]" /></div><p className="mt-2 text-sm leading-6 text-[#687a6f]">按当天顺序串起地点。点击某一天，可回到左侧继续编辑。</p>
      <ol className="mt-5 space-y-3">{days.map((day) => {
        const places = day.activities.map(activityPlace).filter(Boolean);
        return <li key={day.day} className={`rounded-2xl border p-4 transition ${activeDay === String(day.day) ? "border-[#9ebda5] bg-[#edf5e9]" : "border-[#e1e8df] bg-white"}`}><div className="flex items-start gap-3"><button type="button" onClick={() => onSelectDay(String(day.day))} className="flex min-w-0 flex-1 items-start gap-3 text-left"><span className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold ${activeDay === String(day.day) ? "bg-[#173c32] text-[#d8ff64]" : "bg-[#e8eee5] text-[#315845]"}`}>{String(day.day).padStart(2, "0")}</span><span className="min-w-0"><strong className="block truncate text-sm text-[#1b3529]">{day.title}</strong><small className="mt-1 block text-xs text-[#728579]">{day.activities.length} 个安排 · 约 ¥{day.activities.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}</small></span></button>{places.length > 0 && <a href={dayRouteUrl(day, city)} target="_blank" rel="noopener noreferrer" aria-label={`查看第${day.day}天路线`} title={`查看第${day.day}天路线`} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#cbd9cd] bg-white px-3 py-2 text-xs font-semibold text-[#245541] hover:border-[#245541] hover:bg-[#e7f3e4]"><Navigation className="size-3.5" /> 路线</a>}</div><div className="mt-3 flex flex-wrap items-center gap-1.5 pl-12">{places.length ? <>{places.slice(0, 3).map((place, index) => <span key={`${place}-${index}`} className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-[#486251]">{place}</span>)}{places.length > 3 && <span className="text-xs text-[#688071]">+{places.length - 3} 站</span>}</> : <span className="text-xs text-[#728579]">还没有地点，添加活动后会显示路线</span>}</div></li>;
      })}</ol>
      <div className="mt-5 rounded-[24px] border border-[#a9c5af] bg-[linear-gradient(135deg,#e7f3e4,#f5faf0)] p-4 shadow-[0_10px_26px_rgba(36,85,65,.08)] sm:p-5"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#173c32] text-[#d8ff64] shadow-[0_8px_18px_rgba(23,60,50,.18)]"><Map className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#5d826a]">Map & navigation</p><h5 className="mt-1 text-lg font-semibold text-[#173c32]">查看{city}地图</h5><p className="mt-1 text-sm leading-5 text-[#5d7564]">按天路线可从上方直接导航；这里可打开完整目的地地图。</p></div></div><a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173c32] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(23,60,50,.18)] hover:bg-[#285a49]"><Navigation className="size-4" />在 Google 地图查看<ArrowRight className="ml-auto size-4" /></a><div className="mt-2 grid grid-cols-2 gap-2"><a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#bfd3c1] bg-white/85 px-3 py-2.5 text-center text-sm font-medium text-[#275342] hover:border-[#245541]">Apple 地图</a><a href={amapUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#bfd3c1] bg-white/85 px-3 py-2.5 text-center text-sm font-medium text-[#275342] hover:border-[#245541]">高德地图</a></div></div>
    </div>

    <section className="border-t border-[#d6e4d5] bg-[#edf3e9] p-5 text-[#173c32] sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#668772]">Budget overview</p><h4 className="mt-1 text-2xl font-semibold tracking-tight">预算概览</h4></div><span className="grid size-11 place-items-center rounded-2xl bg-[#173c32] text-[#d8ff64]"><WalletCards className="size-5" /></span></div>
      <div className="mt-5 rounded-[24px] border border-[#dbe7d8] bg-white p-5 shadow-[0_10px_30px_rgba(23,60,50,.06)]"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#5e7868]">当前行程预估总额</p><p className="mt-1 text-[2.6rem] font-semibold leading-none tracking-[-.05em] text-[#173c32] sm:text-5xl">¥{total.toLocaleString()}</p></div><div className="rounded-2xl bg-[#edf5e8] px-4 py-2.5 text-right"><p className="text-xs text-[#65816a]">人均参考</p><p className="mt-1 text-lg font-semibold text-[#173c32]">¥{Math.round(total / Math.max(1, travelers)).toLocaleString()}</p></div></div><div className="mt-6 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-[#526c5b]">预算使用</span><strong className={remaining < 0 ? "text-[#b75c43]" : "text-[#285e43]"}>{usage}%</strong></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e3eae0]"><div className={`h-full rounded-full transition-all ${remaining < 0 ? "bg-[#db785a]" : "bg-[#7fcf73]"}`} style={{ width: `${Math.min(100, usage)}%` }} /></div><p className={`mt-2 text-sm font-semibold ${remaining < 0 ? "text-[#b75c43]" : "text-[#326449]"}`}>{remaining < 0 ? `超出预算 ¥${Math.abs(remaining).toLocaleString()}` : `预算剩余 ¥${remaining.toLocaleString()}`}{remaining >= 0 && remaining < reserve && budgetNumber > 0 ? " · 建议多留一些机动费用" : ""}</p></div>
      <div className="mt-4 rounded-[24px] border border-[#dbe7d8] bg-white p-5 shadow-[0_10px_30px_rgba(23,60,50,.04)]"><div className="flex items-center justify-between"><h5 className="text-base font-semibold">费用构成</h5><span className="text-xs text-[#68816e]">随行程实时更新</span></div><div className="mt-4 flex h-2 overflow-hidden rounded-full bg-[#e7eee3]"><span className="bg-[#265a49]" style={{ width: `${total > 0 ? hotelCost / total * 100 : 0}%` }} /><span className="bg-[#79ad8d]" style={{ width: `${total > 0 ? transportCost / total * 100 : 0}%` }} /><span className="bg-[#d1e984]" style={{ width: `${total > 0 ? activityTotal / total * 100 : 0}%` }} /></div><div className="mt-5 space-y-4">
        <label className="flex items-center justify-between gap-3 border-b border-[#ebf0e8] pb-4 text-sm"><span className="font-medium text-[#415d4c]">旅行总预算<small className="mt-0.5 block text-xs font-normal text-[#7b9180]">整趟旅行的目标金额</small></span><span className="flex items-center gap-1 rounded-xl border border-[#dae6d8] bg-[#f6f9f4] px-3 py-2 font-semibold text-[#173c32]">¥ <input type="number" min="0" value={budget} onChange={(event) => onBudgetChange(event.target.value.replace(/\D/g, ""))} aria-label="旅行总预算" className="w-24 bg-transparent text-right text-[#173c32] outline-none" /></span></label>
        <label className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-[#415d4c]"><span className="mr-2 inline-block size-2 rounded-full bg-[#265a49]" />住宿 · {Math.max(0, days.length - 1)} 晚<small className="mt-0.5 block text-xs font-normal text-[#7b9180]">每晚单价 · 小计 ¥{hotelCost.toLocaleString()}</small></span><span className="flex items-center gap-1 rounded-xl border border-[#dae6d8] bg-[#f6f9f4] px-3 py-2 font-semibold text-[#173c32]">¥ <input type="number" min="0" value={nightlyStayCost} onChange={(event) => onNightlyStayChange(Math.max(0, Number(event.target.value) || 0))} aria-label="每晚住宿预估" className="w-20 bg-transparent text-right text-[#173c32] outline-none" /></span></label>
        <label className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-[#415d4c]"><span className="mr-2 inline-block size-2 rounded-full bg-[#79ad8d]" />交通预估<small className="mt-0.5 block text-xs font-normal text-[#7b9180]">往返与市内交通</small></span><span className="flex items-center gap-1 rounded-xl border border-[#dae6d8] bg-[#f6f9f4] px-3 py-2 font-semibold text-[#173c32]">¥ <input type="number" min="0" value={transportCost} onChange={(event) => onTransportChange(Math.max(0, Number(event.target.value) || 0))} aria-label="交通预估" className="w-20 bg-transparent text-right text-[#173c32] outline-none" /></span></label>
        <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-[#415d4c]"><span className="mr-2 inline-block size-2 rounded-full bg-[#d1e984]" />活动与餐饮<small className="mt-0.5 block text-xs font-normal text-[#7b9180]">由每日活动费用汇总</small></span><strong className="text-base">¥{activityTotal.toLocaleString()}</strong></div></div></div>
      <p className="mt-4 rounded-2xl border border-[#d6e3d1] bg-[#f8fbf5] p-4 text-sm leading-6 text-[#58705e]">建议预留约 ¥{reserve.toLocaleString()}（总预算的 10%）应对临时交通与价格变化。金额为规划参考，实际价格请在预订前确认。</p>
    </section>
  </aside>;
}

function AssistantMark({ compact = false }: { compact?: boolean }) {
  return <span aria-hidden="true" className={`relative isolate grid shrink-0 place-items-center overflow-hidden border border-white/40 bg-[linear-gradient(145deg,#e8ffbf_0%,#87dbb0_26%,#248d79_62%,#123d38_100%)] shadow-[0_8px_18px_rgba(2,27,22,.28),inset_0_2px_2px_rgba(255,255,255,.8),inset_0_-4px_8px_rgba(3,38,32,.4)] ${compact ? "size-9 rounded-[13px]" : "size-11 rounded-[17px]"}`}>
    <span className="absolute -left-2 -top-4 h-7 w-11 rotate-[-20deg] rounded-full bg-white/55 blur-sm" />
    <span className={`relative grid place-items-center rounded-full border border-white/55 bg-[radial-gradient(circle_at_30%_25%,#edffe6,#b7f28a_42%,#397f61_100%)] shadow-[0_3px_8px_rgba(0,34,27,.3),inset_0_1px_2px_rgba(255,255,255,.9)] ${compact ? "size-6" : "size-7"}`}><Sparkles className={`${compact ? "size-3.5" : "size-4"} text-[#174335] drop-shadow-[0_1px_0_rgba(255,255,255,.7)]`} /></span>
    <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-[#e8ff99] shadow-[0_0_8px_#e8ff99]" />
  </span>;
}

export default function Home() {
  const [destination, setDestination] = useState("tokyo");
  const [destinationText, setDestinationText] = useState("东京");
  const [budget, setBudget] = useState("8000");
  const [style, setStyle] = useState("balanced");
  const [query, setQuery] = useState("");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState("1");
  const [days, setDays] = useState<Day[]>(plans.tokyo.days);
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [bookingDone, setBookingDone] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [startDate, setStartDate] = useState("2026-10-12");
  const [endDate, setEndDate] = useState("2026-10-14");
  const [travelers, setTravelers] = useState(2);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "你好，我是 GoTrip。可以问我目的地亮点、行程安排、预算或出行建议。" }]);
  const [hydrated, setHydrated] = useState(false);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState("");
  const [planCity, setPlanCity] = useState("东京");
  const [planDestination, setPlanDestination] = useState("tokyo");
  const [nightlyStayCost, setNightlyStayCost] = useState(1800);
  const [transportCost, setTransportCost] = useState(1080);
  const [notice, setNotice] = useState("");
  const collectedTrip = savedTrips.find((trip) => trip.id === tripId);
  const hasUnsavedChanges = Boolean(collectedTrip && (
    collectedTrip.city !== planCity || collectedTrip.destination !== planDestination ||
    JSON.stringify(collectedTrip.days) !== JSON.stringify(days) ||
    collectedTrip.budget !== budget || styleLabel(collectedTrip.style) !== styleLabel(style) ||
    collectedTrip.startDate !== startDate || collectedTrip.endDate !== endDate ||
    collectedTrip.travelers !== travelers || collectedTrip.query !== query ||
    (collectedTrip.nightlyStayCost ?? 1800) !== nightlyStayCost ||
    (collectedTrip.transportCost ?? 1080) !== transportCost
  ));

  useEffect(() => {
    queueMicrotask(() => {
      setUser(localStorage.getItem("wander-user") || "");
      try {
        const stored = JSON.parse(localStorage.getItem(TRIPS_KEY) || "[]") as Trip[];
        setSavedTrips(Array.isArray(stored) ? stored.filter((trip) => trip?.id && Array.isArray(trip.days)) : []);
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Trip | null;
        if (draft?.id && Array.isArray(draft.days)) restoreTrip(draft, false);
      } catch { /* Ignore damaged local data and keep the starter trip. */ }
      setHydrated(true);
    });
  }, []);
  const baseSelected = plans[destination];
  const selected = { ...baseSelected, city: destinationText.trim() || baseSelected.city };
  const plannerSelected = plans[planDestination] || plans.tokyo;
  const hotelCost = nightlyStayCost * Math.max(0, days.length - 1);
  const total = useMemo(() => days.flatMap((day) => day.activities).reduce((sum, item) => sum + item.cost, 0) + hotelCost + transportCost, [days, hotelCost, transportCost]);
  const tripCity = destinationText.trim() || selected.city;
  const isPlanPreset = planCity === plannerSelected.city;
  const destinationName = encodeURIComponent(isPlanPreset ? `${planCity} ${plannerSelected.country}` : planCity);
  const appleMapsUrl = isPlanPreset ? `https://maps.apple.com/?daddr=${plannerSelected.coordinates.lat},${plannerSelected.coordinates.lng}&q=${destinationName}` : `https://maps.apple.com/?q=${destinationName}`;
  const googleMapsUrl = isPlanPreset ? `https://www.google.com/maps/dir/?api=1&destination=${plannerSelected.coordinates.lat},${plannerSelected.coordinates.lng}` : `https://www.google.com/maps/search/?api=1&query=${destinationName}`;
  const amapUrl = isPlanPreset ? `https://uri.amap.com/marker?position=${plannerSelected.coordinates.lng},${plannerSelected.coordinates.lat}&name=${destinationName}&callnative=1` : `https://uri.amap.com/search?keyword=${destinationName}&callnative=1`;
  const tripLength = startDate && endDate ? Math.round((Date.parse(`${endDate}T00:00:00`) - Date.parse(`${startDate}T00:00:00`)) / 86400000) + 1 : 0;
  const validDates = tripLength >= 1 && tripLength <= 7;
  const dateSummary = validDates ? `${formatTripDate(startDate)} – ${formatTripDate(endDate)} · ${travelers} 人` : "请选择有效日期";
  const activityTotal = total - hotelCost - transportCost;

  useEffect(() => {
    if (!hydrated || !generated || !tripId) return;
    const draft: Trip = { id: tripId, destination: planDestination, city: planCity, days, budget, style, startDate, endDate, travelers, query, nightlyStayCost, transportCost, updatedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [hydrated, generated, tripId, planDestination, planCity, days, budget, style, startDate, endDate, travelers, query, nightlyStayCost, transportCost]);

  function restoreTrip(trip: Trip, scroll = true) {
    setDestination(plans[trip.destination] ? trip.destination : "tokyo");
    setDestinationText(trip.city);
    setPlanDestination(plans[trip.destination] ? trip.destination : "tokyo");
    setPlanCity(trip.city);
    setDays(cloneDays(trip.days));
    setTripId(trip.id);
    setBudget(trip.budget);
    setStyle(trip.style);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setTravelers(trip.travelers);
    setQuery(trip.query || "");
    setNightlyStayCost(trip.nightlyStayCost ?? 1800);
    setTransportCost(trip.transportCost ?? 1080);
    setActiveDay("1");
    setGenerated(true);
    if (scroll) window.setTimeout(() => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  const saveTrip = useCallback(() => {
    if (!generated) return;
    const trip: Trip = { id: tripId || crypto.randomUUID(), destination: planDestination, city: planCity, days: cloneDays(days), budget, style, startDate, endDate, travelers, query, nightlyStayCost, transportCost, updatedAt: Date.now() };
    const next = [trip, ...savedTrips.filter((item) => item.id !== trip.id)].slice(0, 12);
    setTripId(trip.id); setSavedTrips(next); setNotice("行程已保存到当前设备");
    localStorage.setItem(TRIPS_KEY, JSON.stringify(next));
  }, [generated, tripId, planDestination, planCity, days, budget, style, startDate, endDate, travelers, query, nightlyStayCost, transportCost, savedTrips]);

  function removeSavedTrip(id: string) {
    const next = savedTrips.filter((trip) => trip.id !== id);
    setSavedTrips(next); localStorage.setItem(TRIPS_KEY, JSON.stringify(next));
    setNotice(id === tripId ? "已取消收藏，当前草稿仍保留" : "已删除收藏");
  }

  function exportTrip() {
    const lines = [`${planCity} · ${days.length} 天行程`, `${startDate} 至 ${endDate} · ${travelers} 人`, `预算 ¥${Number(budget || 0).toLocaleString()} / 当前预估 ¥${total.toLocaleString()}`, `住宿 ¥${hotelCost.toLocaleString()} / 交通 ¥${transportCost.toLocaleString()} / 活动与餐饮 ¥${activityTotal.toLocaleString()}`, ""];
    days.forEach((day) => { lines.push(`第 ${day.day} 天｜${day.title}`); day.activities.forEach((item) => lines.push(`${item.time}  ${item.title}｜${item.detail}｜约 ¥${item.cost}`)); lines.push(""); });
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${planCity}-旅行行程.txt`; link.click(); URL.revokeObjectURL(url);
  }

  async function searchDestination(topic: string) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&utf8=1&format=json&origin=*&srlimit=8`);
    if (!response.ok) throw new Error("目的地资料暂时不可用");
    const data = await response.json() as { query?: { search?: Array<{ title: string; snippet: string }> } };
    return data.query?.search ?? [];
  }
  async function generatePlan() {
    if (!tripCity.trim() || !validDates || !Number(budget)) { setNotice("请填写目的地、有效日期和旅行预算"); return; }
    setGenerating(true);
    try {
      if (tripCity === baseSelected.city) {
        setDays(fitDays(baseSelected.days, tripLength)); setActiveDay("1"); setGenerated(true); setPlanCity(tripCity); setPlanDestination(destination); setTripId(crypto.randomUUID()); setBookingDone(false); setNotice("已载入精选路线，可按喜好继续调整");
        window.setTimeout(() => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" }), 80);
        return;
      }
      const results = await searchDestination(`${tripCity} 旅游 景点`);
      const names = results.map((item) => item.title).filter((name) => name.length < 18 && !/列表|電影|电影|節目|节目|电视剧|電視劇|歌曲|人物|攻略/.test(name)).slice(0, 6);
      const fallback = ["城市地标与老城区", "当地市场与特色美食", "博物馆与文化街区", "自然景观与观景台", "社区漫步与咖啡时间", "夜景与在地晚餐"];
      const spots = [...names, ...fallback].slice(0, 6);
      const dailyCost = Math.max(200, Math.round(Number(budget || 0) / Math.max(travelers, 1) / tripLength));
      const customDays: Day[] = [
        { day: 1, title: "抵达与城市初见", activities: [{ id: 101, time: "10:00", title: spots[0], detail: `从 ${tripCity} 的代表性区域开始，熟悉城市节奏。`, cost: Math.round(dailyCost * .2) }, { id: 102, time: "14:30", title: spots[1], detail: query || "品尝当地风味，并留出自由探索时间。", cost: Math.round(dailyCost * .35) }, { id: 103, time: "19:00", title: "在地特色晚餐", detail: `根据当前 ¥${Number(budget || 0).toLocaleString()} 预算安排餐饮。`, cost: Math.round(dailyCost * .35) }] },
        { day: 2, title: "文化与经典体验", activities: [{ id: 201, time: "09:00", title: spots[2], detail: "联网检索到的目的地相关文化景点，可继续编辑替换。", cost: Math.round(dailyCost * .25) }, { id: 202, time: "13:30", title: spots[3], detail: styleLabel(style) === "松弛慢游" ? "安排充足休息，轻松游览。" : "串联周边景点，提高游览效率。", cost: Math.round(dailyCost * .3) }, { id: 203, time: "18:30", title: "日落与夜间体验", detail: `适合 ${travelers} 人共同体验的夜间安排。`, cost: Math.round(dailyCost * .3) }] },
        { day: 3, title: "深入当地生活", activities: [{ id: 301, time: "09:30", title: spots[4], detail: "避开高峰时段，感受当地社区与生活方式。", cost: Math.round(dailyCost * .15) }, { id: 302, time: "14:00", title: spots[5], detail: "根据天气和现场开放情况灵活调整。", cost: Math.round(dailyCost * .25) }, { id: 303, time: "17:30", title: "返程前自由活动", detail: "预留交通与行李整理时间。", cost: Math.round(dailyCost * .15) }] },
      ];
      setDays(fitDays(customDays, tripLength)); setActiveDay("1"); setGenerated(true); setPlanCity(tripCity); setPlanDestination(destination); setTripId(crypto.randomUUID()); setBookingDone(false); setNotice("行程已生成，可直接编辑并保存");
      window.setTimeout(() => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {
      if (tripCity === baseSelected.city) {
        setDays(fitDays(selected.days, tripLength));
        setNotice("当前网络不可用，已载入目的地精选路线");
      } else {
        setDays(fitDays([{ day: 1, title: "抵达与探索", activities: [{ id: Date.now(), time: "10:00", title: `${tripCity} 城市漫步`, detail: "可编辑时间、地点和预算，按需添加体验。", cost: 0 }] }, { day: 2, title: "深入当地", activities: [] }, { day: 3, title: "自由安排", activities: [] }], tripLength));
        setNotice("当前网络不可用，已创建可编辑的空白路线");
      }
      setActiveDay("1"); setGenerated(true); setPlanCity(tripCity); setPlanDestination(destination); setTripId(crypto.randomUUID()); setBookingDone(false);
    } finally { setGenerating(false); }
  }
  async function askAssistant() {
    const question = assistantInput.trim();
    if (!question || assistantBusy) return;
    setAssistantInput(""); setAssistantBusy(true);
    setChatMessages((items) => [...items, { role: "user", text: question }]);
    let answer = "";
    let doubaoUnavailable = false;
    if (doubaoApiUrl) {
      try {
        const response = await fetch(doubaoApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            context: {
              city: generated ? planCity : tripCity,
              dates: dateSummary,
              travelers,
              budget: Number(budget || 0),
              style: styleLabel(style),
              itinerary: generated ? days.map((day) => `第 ${day.day} 天 ${day.title}：${day.activities.map((item) => `${item.time} ${item.title}（${activityPlace(item)}，约 ¥${item.cost}）`).join("；")}`).join("\n") : "尚未生成行程",
            },
          }),
        });
        const data = await response.json() as { answer?: string };
        if (!response.ok || !data.answer?.trim()) throw new Error("豆包暂时不可用");
        answer = data.answer.trim();
      } catch { doubaoUnavailable = true; }
    }
    if (!answer && /预算|多少钱|费用/.test(question)) answer = `当前设置的总预算是 ¥${Number(budget || 0).toLocaleString()}，共 ${travelers} 人。建议预留约 15% 作为交通和临时支出。`;
    else if (!answer && /日期|几号|时间|人数/.test(question)) answer = `当前行程为 ${dateSummary}，目的地是 ${tripCity}。`;
    else if (!answer && /行程|安排|第.*天/.test(question) && generated) answer = days.map((day) => `第 ${day.day} 天：${day.activities.map((item) => item.title).join("、")}`).join("\n");
    else if (!answer) {
      try {
        const results = await searchDestination(`${tripCity} ${question}`);
        const clean = (value: string) => value.replace(/<[^>]+>/g, "").replace(/&quot;/g, "“").replace(/&amp;/g, "&");
        answer = results.length ? `关于“${question}”，我查到：${results.slice(0, 3).map((item) => `${item.title}：${clean(item.snippet)}`).join("；")}。建议出发前再确认开放时间和实时政策。` : `暂时没有查到足够资料。你可以换一种问法，例如“${tripCity}有哪些必去景点？”`;
      } catch { answer = "当前网络查询暂时不可用。我仍可以根据页面中的预算、日期和行程回答问题。"; }
    }
    setChatMessages((items) => [...items, { role: "assistant", text: doubaoUnavailable ? `豆包暂时不可用，以下是现有资料的回答：\n${answer}` : answer }]); setAssistantBusy(false);
  }
  function updateActivity(dayNumber: number, id: number, patch: Partial<Activity>) { setDays((current) => current.map((day) => day.day === dayNumber ? { ...day, activities: day.activities.map((item) => item.id === id ? { ...item, ...patch } : item) } : day)); }
  function removeActivity(dayNumber: number, id: number) { setDays((current) => current.map((day) => day.day === dayNumber ? { ...day, activities: day.activities.filter((item) => item.id !== id) } : day)); }
  function addActivity(dayNumber: number) { setDays((current) => current.map((day) => day.day === dayNumber ? { ...day, activities: [...day.activities, { id: Date.now(), time: "17:00", title: "新体验", detail: "", cost: 0, place: "" }] } : day)); }
  function signIn() { const name = email.trim().split("@")[0] || "旅行者"; localStorage.setItem("wander-user", name); setUser(name); setLoginOpen(false); }

  useEffect(() => {
    const context = (document as unknown as { modelContext?: { registerTool: (tool: unknown, options?: { signal: AbortSignal }) => unknown } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Unsupported preview context. */ } };
    register({
      name: "generate_trip_plan", title: "生成旅行行程", description: "为当前选择的目的地生成一份符合日期长度的旅行行程，并在页面中打开行程编辑器。",
      inputSchema: { type: "object", properties: { destination: { type: "string", enum: ["tokyo", "lisbon", "bali"] } }, required: ["destination"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = (input as { destination?: string })?.destination;
        if (!value || !plans[value]) throw new Error("不支持的目的地");
        setDestination(value); setDestinationText(plans[value].city); setPlanDestination(value); setPlanCity(plans[value].city); setDays(fitDays(plans[value].days, validDates ? tripLength : 3)); setGenerated(true); setActiveDay("1"); setTripId(crypto.randomUUID());
        return { destination: plans[value].city, days: validDates ? tripLength : 3, status: "generated" };
      },
    });
    register({
      name: "save_trip_plan", title: "收藏当前行程", description: "将当前已生成的旅行行程收藏到此设备。",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() { if (!generated) throw new Error("请先生成行程"); saveTrip(); return { destination: planCity, status: "saved" }; },
    });
    return () => lifecycle.abort();
  }, [generated, planCity, validDates, tripLength, saveTrip]);

  return <main className="min-h-screen overflow-x-clip bg-[#f4f2eb] text-[#15231e]">
    <header className="sticky top-0 z-50 w-full overflow-hidden border-b border-[#173c32]/10 bg-[#f4f2eb]/92 backdrop-blur-xl"><div className="mx-auto flex h-18 w-full min-w-0 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
      <a href="#" className="flex shrink-0 items-center gap-3 text-xl font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-full bg-[#173c32] text-[#d8ff64]"><Compass className="size-5" /></span> GoTrip</a>
      <nav className="hidden items-center gap-8 text-sm text-[#51635c] md:flex"><a href="#create">创建行程</a><a href="#discover">探索目的地</a><a href="#planner">我的行程</a></nav>
      {user ? <div className="flex items-center gap-2"><span className="hidden text-sm sm:inline">你好，{user}</span><Button variant="ghost" size="icon" className="rounded-full" onClick={() => { localStorage.removeItem("wander-user"); setUser(""); }} aria-label="退出登录"><LogOut className="size-4" /></Button></div> : <Dialog open={loginOpen} onOpenChange={setLoginOpen}><DialogTrigger asChild><Button className="rounded-full bg-[#173c32] px-4 text-sm text-white sm:px-5"><span className="sm:hidden">登录</span><span className="hidden sm:inline">登录 / 注册</span></Button></DialogTrigger><DialogContent className="w-[calc(100%-2rem)] rounded-[24px] sm:rounded-[28px]"><DialogHeader><DialogTitle className="text-2xl">保存你的每一次出发</DialogTitle><DialogDescription>输入邮箱即可体验 MVP 登录，行程将保存在当前设备。</DialogDescription></DialogHeader><label className="mt-4 text-sm font-medium">邮箱地址<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border bg-white px-4 text-base outline-none focus:border-[#173c32]" /></label><Button onClick={signIn} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} className="mt-2 h-12 rounded-xl bg-[#173c32] text-white">继续 <ArrowRight /></Button></DialogContent></Dialog>}
    </div></header>

    <section id="create" className="relative overflow-hidden bg-[#07120f] text-white"><img src={tripCity !== baseSelected.city ? assetPath("hero.webp") : destination === "tokyo" ? assetPath("hero-cinematic.webp") : selected.image} alt={tripCity === baseSelected.city ? `${selected.city}旅行风景` : "旅行风景"} className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-1000 max-lg:object-[58%_center]" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,14,11,.86),rgba(3,14,11,.48)_52%,rgba(3,14,11,.32))]" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(190,255,170,.20),transparent_32%),radial-gradient(circle_at_38%_88%,rgba(91,180,132,.18),transparent_38%),linear-gradient(180deg,rgba(2,10,8,.12),rgba(2,10,8,.5))]" /><div className="relative mx-auto grid min-w-0 max-w-[1440px] items-center gap-8 px-5 py-8 sm:px-8 sm:py-12 lg:min-h-[680px] lg:grid-cols-[.9fr_1.1fr] lg:gap-12 lg:px-12">
      <div className="min-w-0 max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,.18)] backdrop-blur-xl"><Sparkles className="size-4 text-[#d8ff64]" /> AI 行程工作台</span><h1 className="mt-6 text-[clamp(2.85rem,13vw,5.4rem)] font-bold leading-[.9] tracking-[-.07em] [text-shadow:0_8px_32px_rgba(0,0,0,.35)] sm:text-[clamp(3.2rem,8vw,5.4rem)] lg:text-[clamp(3.2rem,5.7vw,5.4rem)]">想去哪，<span className="block whitespace-nowrap font-serif font-semibold italic tracking-[-.055em] text-[#d8ff64]">现在就出发。</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-white/78 [text-shadow:0_2px_16px_rgba(0,0,0,.45)] sm:mt-7 sm:text-lg sm:leading-8">选择目的地，设定预算与节奏。把沿途想做的事，整理成一份真正能用的行程。</p><div className="mt-7 hidden flex-wrap gap-3 text-sm text-white/85 sm:flex"><span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur">3 个精选目的地</span><span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur">自由编辑路线</span><span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur">本机保存与导出</span></div></div>
      <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[26px] border border-white/25 bg-[linear-gradient(135deg,rgba(245,255,249,.23),rgba(221,244,232,.10))] p-5 text-white shadow-[0_32px_90px_rgba(0,18,12,.38),inset_0_1px_0_rgba(255,255,255,.32)] backdrop-blur-[28px] sm:rounded-[32px] sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#caff9d]/15 blur-3xl" /><div className="relative flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#d4e8dc]">Plan a trip</p><h2 className="mt-2 text-2xl font-bold tracking-[-.035em] sm:text-3xl">创建我的旅行</h2></div><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#d8ff64] text-[#10231c] shadow-[0_10px_30px_rgba(195,255,100,.2)] sm:size-12"><Sparkles className="size-5" /></span></div>
        <div className="relative mt-8 grid w-full min-w-0 gap-x-6 gap-y-7 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-medium text-white/72">目的地<input value={destinationText} list="destination-suggestions" onChange={(e) => { const value = e.target.value; setDestinationText(value); const preset = Object.entries(plans).find(([, item]) => value.trim() === item.city || value.trim() === `${item.city}，${item.country}`); if (preset) setDestination(preset[0]); }} placeholder="输入城市或地区" className="mt-1 h-12 w-full min-w-0 rounded-none border-x-0 border-t-0 border-b border-white/28 bg-transparent px-0 text-base text-white outline-none transition placeholder:text-white/40 focus:border-[#d8ff64]" /><datalist id="destination-suggestions"><option value="东京" /><option value="里斯本" /><option value="巴厘岛" /></datalist></label>
          <label className="min-w-0 text-sm font-medium text-white/72">旅行预算<div className="mt-1 flex h-12 items-center border-b border-white/28 text-base text-white focus-within:border-[#d8ff64]"><span className="mr-2 text-[#d8ff64]">¥</span><input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="输入总预算" className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-white/40" /></div></label>
          <label className="min-w-0 text-sm font-medium text-white/72">旅行节奏<input value={styleLabel(style)} list="travel-style-suggestions" onChange={(event) => { setStyle(event.target.value); }} placeholder="例如：慢游、摄影、亲子探索" className="mt-1 h-12 w-full min-w-0 border-x-0 border-t-0 border-b border-white/28 bg-transparent px-0 text-base text-white outline-none transition placeholder:text-white/40 focus:border-[#d8ff64]" /><datalist id="travel-style-suggestions"><option value="松弛慢游" /><option value="张弛有度" /><option value="充实探索" /><option value="城市漫步" /><option value="亲子探索" /></datalist></label>
          <div className="min-w-0 text-sm font-medium text-white/72">日期与人数<Dialog open={dateOpen} onOpenChange={setDateOpen}><DialogTrigger asChild><button type="button" className="mt-1 flex h-12 w-full min-w-0 items-center gap-3 border-b border-white/28 bg-transparent px-0 text-left text-base text-white transition hover:border-[#d8ff64]"><CalendarDays className="size-4 shrink-0 text-[#d8ff64]" /><span className="truncate">{dateSummary}</span></button></DialogTrigger><DialogContent className="w-[calc(100%-2rem)] rounded-[24px] sm:max-w-md sm:rounded-[28px]"><DialogHeader><DialogTitle className="text-2xl">日期与旅行人数</DialogTitle><DialogDescription>选择出发、返程日期，以及同行人数。</DialogDescription></DialogHeader><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">出发日期<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce2dc] bg-white px-3 text-base outline-none focus:border-[#173c32]" /></label><label className="text-sm font-medium">返程日期<input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce2dc] bg-white px-3 text-base outline-none focus:border-[#173c32]" /></label></div><div className="mt-2 flex items-center justify-between rounded-2xl bg-[#edf0e9] p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white"><Users className="size-5 text-[#173c32]" /></span><div><p className="font-medium">旅行人数</p><p className="text-sm text-[#61716a]">最多 8 位旅客</p></div></div><div className="flex items-center gap-3"><button type="button" onClick={() => setTravelers((value) => Math.max(1, value - 1))} disabled={travelers === 1} className="grid size-9 place-items-center rounded-full border border-[#cfd7d1] bg-white disabled:opacity-35" aria-label="减少人数"><Minus className="size-4" /></button><strong className="w-5 text-center text-lg">{travelers}</strong><button type="button" onClick={() => setTravelers((value) => Math.min(8, value + 1))} disabled={travelers === 8} className="grid size-9 place-items-center rounded-full border border-[#cfd7d1] bg-white disabled:opacity-35" aria-label="增加人数"><Plus className="size-4" /></button></div></div>{!validDates && <p className="text-sm text-[#b74a38]">请选择 1 至 7 天的有效日期。</p>}<Button type="button" disabled={!validDates} onClick={() => setDateOpen(false)} className="mt-2 h-12 w-full rounded-xl bg-[#173c32] text-white">应用选择</Button></DialogContent></Dialog></div>
        </div>
        <label className="relative mt-7 block text-sm font-medium text-white/72">特别想体验什么？<div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 shadow-[0_12px_30px_rgba(0,0,0,.12)] backdrop-blur-xl"><Search className="size-4 text-[#d8ff64]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="例如：当代建筑、在地美食、避开人群" className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/45" /></div></label><Button onClick={generatePlan} disabled={generating || !tripCity.trim() || !validDates || !Number(budget)} className="relative mt-6 h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#dfff79,#bdf08d)] text-base font-semibold text-[#10231c] shadow-[0_16px_36px_rgba(175,235,105,.22)] hover:brightness-105">{generating ? "正在组合路线…" : "生成专属行程"} <ArrowRight /></Button>
        <p className="mt-3 text-center text-sm text-white/70">生成后可调整每天的活动，草稿会自动保存在当前设备。</p>
      </div>
    </div></section>

    <section id="planner" className="mx-auto max-w-[1440px] scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12"><div className="mb-7 flex items-end justify-between gap-4"><div><span className="text-sm font-semibold uppercase tracking-[.18em] text-[#60746b]">My journeys</span><h2 className="mt-2 text-3xl font-semibold sm:text-4xl">我的行程</h2></div><span className="hidden text-sm text-[#60746b] sm:block">草稿会自动保存在当前设备</span></div>{notice && <div role="status" className="mb-6 flex items-center justify-between rounded-2xl border border-[#c8ddc6] bg-[#eef8e9] px-4 py-3 text-sm text-[#244b31]"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="关闭提示"><X className="size-4" /></button></div>}{savedTrips.length > 0 && <div className="mb-8 rounded-[26px] border border-[#dce2dc] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">已保存的行程</h3><span className="text-sm text-[#60746b]">{savedTrips.length} 份</span></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{savedTrips.map((trip) => <div key={trip.id} className="flex items-center gap-3 rounded-2xl border border-[#e0e7df] bg-[#fbfcf9] p-3"><img src={(plans[trip.destination] || plans.tokyo).image} alt="" className="size-14 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{trip.city} · {trip.days.length} 天</p><p className="mt-1 text-xs text-[#60746b]">{trip.startDate} · {trip.travelers} 人</p></div><button onClick={() => restoreTrip(trip)} className="rounded-full bg-[#173c32] px-3 py-2 text-xs font-semibold text-white" aria-label={`打开${trip.city}行程`}>打开</button><button onClick={() => removeSavedTrip(trip.id)} className="rounded-full p-2 text-[#788a7f] hover:bg-[#f2e6e2] hover:text-[#b74a38]" aria-label={`删除${trip.city}收藏`}><Trash2 className="size-4" /></button></div>)}</div></div>}{!generated ? <div className="grid min-h-[360px] place-items-center rounded-[32px] border border-dashed border-[#9faea6] bg-white/55 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e4eadf]"><Map className="size-7 text-[#426258]" /></span><h2 className="mt-5 text-2xl font-semibold">你的旅程将在这里展开</h2><p className="mt-2 text-[#61716a]">填写旅行信息，生成一份可以随时调整的路线。</p></div></div> : <>
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="min-w-0"><span className="text-sm font-semibold uppercase tracking-[.18em] text-[#60746b]">Your itinerary</span><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">{planCity}，{days.length} 天 {Math.max(0, days.length - 1)} 夜</h2><p className="mt-3 text-[#61716a]">{styleLabel(style) || "自由探索"} · {travelers} 位旅客 · 预算 ¥{Number(budget || 0).toLocaleString()}</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={collectedTrip ? () => removeSavedTrip(tripId) : saveTrip} aria-pressed={Boolean(collectedTrip)} className={`rounded-full ${collectedTrip ? "border-[#e6a795] bg-[#fff4ef] text-[#a74635]" : "bg-white"}`}><Heart className={`size-4 ${collectedTrip ? "fill-[#e96d54] text-[#e96d54]" : ""}`} /> {collectedTrip ? "已收藏 · 点击取消" : "收藏行程"}</Button>{hasUnsavedChanges && <Button variant="outline" onClick={saveTrip} className="rounded-full border-[#97b99e] bg-[#edf7e9] text-[#173c32]"><Check className="size-4" /> 保存修改</Button>}<Button variant="outline" onClick={exportTrip} className="rounded-full bg-white"><Download className="size-4" /> 导出</Button><Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}><DialogTrigger asChild><Button className="rounded-full bg-[#173c32] px-5 text-white sm:px-6">模拟下单 <ArrowRight /></Button></DialogTrigger><DialogContent className="w-[calc(100%-2rem)] rounded-[24px] sm:rounded-[28px]"><DialogHeader><DialogTitle className="text-2xl">确认旅行方案</DialogTitle><DialogDescription>{planCity} {days.length} 天 · {travelers} 位旅客 · {dateSummary}</DialogDescription></DialogHeader>{bookingDone ? <div className="py-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#d8ff64]"><Check className="size-7" /></span><h3 className="mt-5 text-2xl font-semibold">预订申请已创建</h3><p className="mt-2 text-[#61716a]">这是一份本地演示记录，未产生实际订单或付款。</p><Button className="mt-6 rounded-full bg-[#173c32] text-white" onClick={() => setCheckoutOpen(false)}>返回行程</Button></div> : <div className="space-y-4"><div className="rounded-2xl bg-[#edf0e9] p-5"><div className="flex justify-between"><span>行程总额预估</span><strong>¥{total.toLocaleString()}</strong></div><div className="mt-3 flex justify-between text-sm text-[#61716a]"><span>当前为模拟订单</span><span>无需付款</span></div></div><label className="block text-sm font-medium">联系人<input defaultValue={user || "旅行者"} className="mt-2 h-12 w-full rounded-xl border px-4 text-base" /></label><Button className="h-12 w-full rounded-xl bg-[#173c32] text-white" onClick={() => setBookingDone(true)}>确认提交</Button></div>}</DialogContent></Dialog></div></div>
      <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_.85fr]"><div id="trip-days" className="min-w-0 scroll-mt-24 rounded-[24px] bg-white p-4 shadow-[0_20px_60px_rgba(20,45,37,.08)] sm:rounded-[30px] sm:p-8"><Tabs value={activeDay} onValueChange={setActiveDay}><TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-[#edf0e9] p-1">{days.map((day) => <TabsTrigger key={day.day} value={String(day.day)} className="min-w-24 flex-1 rounded-xl px-2 py-3 data-[state=active]:bg-[#173c32] data-[state=active]:text-white">第 {day.day} 天</TabsTrigger>)}</TabsList>{days.map((day) => <TabsContent key={day.day} value={String(day.day)} className="mt-7"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm text-[#718078]">DAY {day.day} · {day.activities.length} 个安排 · 约 ¥{day.activities.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}</p><h3 className="text-xl font-semibold sm:text-2xl">{day.title}</h3></div><Button variant="outline" size="sm" className="rounded-full" onClick={() => addActivity(day.day)}><Plus className="size-4" /> 添加</Button></div><div className="space-y-3">{day.activities.length === 0 && <p className="rounded-2xl border border-dashed border-[#cbd8cc] p-6 text-center text-sm text-[#61716a]">这一天还没有安排，点击“添加”开始规划。</p>}{day.activities.map((item) => <ActivityCard key={item.id} item={item} dayNumber={day.day} city={planCity} fallbackImage={planCity === plannerSelected.city ? plannerSelected.image : assetPath("hero.webp")} onUpdate={updateActivity} onRemove={removeActivity} />)}</div></TabsContent>)}</Tabs></div>
        <RouteBudgetPanel city={planCity} image={planCity === plannerSelected.city ? plannerSelected.image : assetPath("hero.webp")} dateSummary={dateSummary} days={days} travelers={travelers} budget={budget} total={total} hotelCost={hotelCost} transportCost={transportCost} activityTotal={activityTotal} nightlyStayCost={nightlyStayCost} activeDay={activeDay} onSelectDay={(value) => { setActiveDay(value); document.getElementById("trip-days")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} onBudgetChange={(value) => { setBudget(value); }} onNightlyStayChange={(value) => { setNightlyStayCost(value); }} onTransportChange={(value) => { setTransportCost(value); }} appleMapsUrl={appleMapsUrl} googleMapsUrl={googleMapsUrl} amapUrl={amapUrl} /></div>
    </>}</section>

    <section id="discover" className="bg-[#e8ebe4] px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1440px]">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><span className="text-sm font-semibold uppercase tracking-[.18em] text-[#60746b]">Explore places</span><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">从喜欢的地方开始</h2><p className="mt-3 max-w-xl text-base text-[#60746b]">每个目的地都有可编辑的三日路线。选一个方向，再加入你自己的想法。</p></div><a href="#create" className="inline-flex w-fit items-center gap-2 rounded-full border border-[#b9c7bd] bg-white px-5 py-3 text-sm font-medium text-[#173c32] hover:border-[#173c32]">自己输入目的地 <ArrowRight className="size-4" /></a></div>
      <div className="grid gap-5 md:grid-cols-3">{Object.entries(plans).map(([key, item]) => <button key={key} onClick={() => { setDestination(key); setDestinationText(item.city); document.getElementById("create")?.scrollIntoView({ behavior: "smooth" }); }} className="group overflow-hidden rounded-[28px] border border-[#d2dcd3] bg-white text-left shadow-[0_16px_45px_rgba(23,60,50,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(23,60,50,.13)]">
        <div className="relative h-56 overflow-hidden"><img src={item.image} alt={`${item.city}旅行风景`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute left-4 top-4 rounded-full bg-[#f7faf3]/95 px-3 py-1.5 text-xs font-semibold text-[#173c32]">{destinationDetails[key].days}</span></div>
        <div className="p-5 sm:p-6"><p className="text-sm text-[#60746b]">{item.country} · {destinationDetails[key].mood}</p><div className="mt-2 flex items-center justify-between"><h3 className="text-3xl font-semibold">{item.city}</h3><span className="grid size-10 place-items-center rounded-full bg-[#d8ff64] text-[#173c32]"><ArrowRight className="size-5" /></span></div><p className="mt-3 min-h-12 text-sm leading-6 text-[#60746b]">{destinationDetails[key].bestFor}</p><div className="mt-5 flex flex-wrap gap-2">{destinationDetails[key].highlights.map((spot) => <span key={spot} className="rounded-full bg-[#eef2eb] px-3 py-1.5 text-xs font-medium text-[#3d5d50]">{spot}</span>)}</div></div>
      </button>)}</div>
    </div></section>

    <footer className="bg-[#08130f] px-5 py-10 text-white sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3 text-lg font-semibold"><Compass className="size-5 text-[#d8ff64]" /> GoTrip</div><p className="text-sm text-white/45">行程保存在当前设备 · 价格仅供规划参考</p></div></footer>
    <div className="fixed bottom-5 right-5 z-[70] sm:bottom-7 sm:right-7">{assistantOpen && <section className="mb-3 flex h-[min(620px,calc(100vh-120px))] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-[26px] border border-white/40 bg-[#f7f8f4]/95 shadow-[0_24px_80px_rgba(5,25,18,.28)] backdrop-blur-2xl"><header className="flex items-center justify-between bg-[#173c32] px-5 py-4 text-white"><div className="flex items-center gap-3"><AssistantMark /><div><h2 className="font-semibold">GoTrip 助手</h2><p className="text-xs text-white/60">联网旅行问答 · 当前：{tripCity}</p></div></div><button onClick={() => setAssistantOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="关闭助手"><X className="size-5" /></button></header><div className="flex-1 space-y-3 overflow-y-auto p-4">{chatMessages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><p className={`max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-[#173c32] text-white" : "rounded-bl-md bg-white text-[#31433c] shadow-sm"}`}>{message.text}</p></div>)}{assistantBusy && <div className="flex justify-start"><p className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#61716a] shadow-sm">正在联网查询…</p></div>}</div><div className="border-t border-[#dce2dc] bg-white/80 p-3"><div className="flex items-end gap-2 rounded-2xl border border-[#d4ddd6] bg-white p-2 pl-4"><textarea value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void askAssistant(); } }} rows={1} placeholder={`询问 ${tripCity} 的景点、美食、交通…`} className="max-h-24 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm outline-none" /><button onClick={() => void askAssistant()} disabled={!assistantInput.trim() || assistantBusy} className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d8ff64] text-[#173c32] disabled:opacity-40" aria-label="发送问题"><Send className="size-4" /></button></div></div></section>}<button onClick={() => setAssistantOpen((open) => !open)} aria-label={assistantOpen ? "收起 GoTrip 助手" : "打开 GoTrip 助手"} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-[#173c32] px-2.5 font-semibold text-white shadow-[0_16px_40px_rgba(5,35,25,.3)] hover:brightness-110 md:px-5"><AssistantMark compact /><span className="hidden md:inline">{assistantOpen ? "收起助手" : "问 GoTrip"}</span></button></div>
  </main>;
}
