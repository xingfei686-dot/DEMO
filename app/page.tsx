"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, CalendarDays, Check, ChevronRight, Compass, Heart, LogOut, Map, MessageCircle, Minus, Navigation, Pencil, Plus, Search, Send, Sparkles, Trash2, Users, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Activity = { id: number; time: string; title: string; detail: string; cost: number };
type Day = { day: number; title: string; activities: Activity[] };
type Coordinates = { lat: number; lng: number };
type ChatMessage = { role: "assistant" | "user"; text: string };

const assetPath = (file: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${file}`;

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
  const [saved, setSaved] = useState(false);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "你好，我是 Wander AI。可以问我目的地亮点、行程安排、预算或出行建议。" }]);

  useEffect(() => { setUser(localStorage.getItem("wander-user") || ""); setSaved(localStorage.getItem("wander-saved") === "true"); }, []);
  useEffect(() => { setDestinationText(plans[destination].city); }, [destination]);
  const baseSelected = plans[destination];
  const selected = { ...baseSelected, city: destinationText.trim() || baseSelected.city };
  const total = useMemo(() => days.flatMap((day) => day.activities).reduce((sum, item) => sum + item.cost, 0) + 4680, [days]);
  const tripCity = destinationText.trim() || selected.city;
  const isPresetDestination = tripCity === baseSelected.city;
  const destinationName = encodeURIComponent(isPresetDestination ? `${selected.city} ${selected.country}` : tripCity);
  const appleMapsUrl = isPresetDestination ? `https://maps.apple.com/?daddr=${selected.coordinates.lat},${selected.coordinates.lng}&q=${destinationName}` : `https://maps.apple.com/?q=${destinationName}`;
  const googleMapsUrl = isPresetDestination ? `https://www.google.com/maps/dir/?api=1&destination=${selected.coordinates.lat},${selected.coordinates.lng}` : `https://www.google.com/maps/search/?api=1&query=${destinationName}`;
  const amapUrl = isPresetDestination ? `https://uri.amap.com/marker?position=${selected.coordinates.lng},${selected.coordinates.lat}&name=${destinationName}&callnative=1` : `https://uri.amap.com/search?keyword=${destinationName}&callnative=1`;
  const validDates = Boolean(startDate && endDate && endDate >= startDate);
  const dateSummary = validDates ? `${formatTripDate(startDate)} – ${formatTripDate(endDate)} · ${travelers} 人` : "请选择有效日期";

  async function searchDestination(topic: string) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&utf8=1&format=json&origin=*&srlimit=8`);
    if (!response.ok) throw new Error("目的地资料暂时不可用");
    const data = await response.json() as { query?: { search?: Array<{ title: string; snippet: string }> } };
    return data.query?.search ?? [];
  }
  async function generatePlan() {
    if (!tripCity.trim()) return;
    setGenerating(true);
    try {
      const results = await searchDestination(`${tripCity} 旅游 景点`);
      const names = results.map((item) => item.title).filter((name) => !name.includes("列表")).slice(0, 6);
      const fallback = ["城市地标与老城区", "当地市场与特色美食", "博物馆与文化街区", "自然景观与观景台", "社区漫步与咖啡时间", "夜景与在地晚餐"];
      const spots = [...names, ...fallback].slice(0, 6);
      const dailyCost = Math.max(200, Math.round(Number(budget || 0) / Math.max(travelers, 1) / 3));
      const customDays: Day[] = [
        { day: 1, title: "抵达与城市初见", activities: [{ id: 101, time: "10:00", title: spots[0], detail: `从 ${tripCity} 的代表性区域开始，熟悉城市节奏。`, cost: Math.round(dailyCost * .2) }, { id: 102, time: "14:30", title: spots[1], detail: query || "品尝当地风味，并留出自由探索时间。", cost: Math.round(dailyCost * .35) }, { id: 103, time: "19:00", title: "在地特色晚餐", detail: `根据当前 ¥${Number(budget || 0).toLocaleString()} 预算安排餐饮。`, cost: Math.round(dailyCost * .35) }] },
        { day: 2, title: "文化与经典体验", activities: [{ id: 201, time: "09:00", title: spots[2], detail: "联网检索到的目的地相关文化景点，可继续编辑替换。", cost: Math.round(dailyCost * .25) }, { id: 202, time: "13:30", title: spots[3], detail: style === "relaxed" ? "安排充足休息，轻松游览。" : "串联周边景点，提高游览效率。", cost: Math.round(dailyCost * .3) }, { id: 203, time: "18:30", title: "日落与夜间体验", detail: `适合 ${travelers} 人共同体验的夜间安排。`, cost: Math.round(dailyCost * .3) }] },
        { day: 3, title: "深入当地生活", activities: [{ id: 301, time: "09:30", title: spots[4], detail: "避开高峰时段，感受当地社区与生活方式。", cost: Math.round(dailyCost * .15) }, { id: 302, time: "14:00", title: spots[5], detail: "根据天气和现场开放情况灵活调整。", cost: Math.round(dailyCost * .25) }, { id: 303, time: "17:30", title: "返程前自由活动", detail: "预留交通与行李整理时间。", cost: Math.round(dailyCost * .15) }] },
      ];
      setDays(customDays); setActiveDay("1"); setGenerated(true);
      window.setTimeout(() => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {
      setDays(selected.days.map((day) => ({ ...day, activities: day.activities.map((item) => ({ ...item, detail: `${tripCity}：${item.detail}` })) })));
      setGenerated(true);
    } finally { setGenerating(false); }
  }
  async function askAssistant() {
    const question = assistantInput.trim();
    if (!question || assistantBusy) return;
    setAssistantInput(""); setAssistantBusy(true);
    setChatMessages((items) => [...items, { role: "user", text: question }]);
    let answer = "";
    if (/预算|多少钱|费用/.test(question)) answer = `当前设置的总预算是 ¥${Number(budget || 0).toLocaleString()}，共 ${travelers} 人。建议预留约 15% 作为交通和临时支出。`;
    else if (/日期|几号|时间|人数/.test(question)) answer = `当前行程为 ${dateSummary}，目的地是 ${tripCity}。`;
    else if (/行程|安排|第.*天/.test(question) && generated) answer = days.map((day) => `第 ${day.day} 天：${day.activities.map((item) => item.title).join("、")}`).join("\n");
    else {
      try {
        const results = await searchDestination(`${tripCity} ${question}`);
        const clean = (value: string) => value.replace(/<[^>]+>/g, "").replace(/&quot;/g, "“").replace(/&amp;/g, "&");
        answer = results.length ? `关于“${question}”，我查到：${results.slice(0, 3).map((item) => `${item.title}：${clean(item.snippet)}`).join("；")}。建议出发前再确认开放时间和实时政策。` : `暂时没有查到足够资料。你可以换一种问法，例如“${tripCity}有哪些必去景点？”`;
      } catch { answer = "当前网络查询暂时不可用。我仍可以根据页面中的预算、日期和行程回答问题。"; }
    }
    setChatMessages((items) => [...items, { role: "assistant", text: answer }]); setAssistantBusy(false);
  }
  function updateActivity(dayNumber: number, id: number, value: string) { setDays((current) => current.map((day) => day.day === dayNumber ? { ...day, activities: day.activities.map((item) => item.id === id ? { ...item, title: value } : item) } : day)); }
  function removeActivity(dayNumber: number, id: number) { setDays((current) => current.map((day) => day.day === dayNumber ? { ...day, activities: day.activities.filter((item) => item.id !== id) } : day)); }
  function addActivity(dayNumber: number) { setDays((current) => current.map((day) => day.day === dayNumber ? { ...day, activities: [...day.activities, { id: Date.now(), time: "17:00", title: "添加一个新体验", detail: "点击标题即可修改", cost: 0 }] } : day)); }
  function toggleSaved() { const next = !saved; setSaved(next); localStorage.setItem("wander-saved", String(next)); }
  function signIn() { const name = email.split("@")[0] || "旅行者"; localStorage.setItem("wander-user", name); setUser(name); setLoginOpen(false); }

  useEffect(() => {
    const context = (document as unknown as { modelContext?: { registerTool: (tool: unknown, options?: { signal: AbortSignal }) => unknown } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Unsupported preview context. */ } };
    register({
      name: "generate_trip_plan", title: "生成旅行行程", description: "为当前选择的目的地生成一份三日旅行行程，并在页面中打开行程编辑器。",
      inputSchema: { type: "object", properties: { destination: { type: "string", enum: ["tokyo", "lisbon", "bali"] } }, required: ["destination"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = (input as { destination?: string })?.destination;
        if (!value || !plans[value]) throw new Error("不支持的目的地");
        setDestination(value); setDestinationText(plans[value].city); setDays(plans[value].days.map((day) => ({ ...day, activities: day.activities.map((item) => ({ ...item })) }))); setGenerated(true); setActiveDay("1");
        return { destination: plans[value].city, days: 3, status: "generated" };
      },
    });
    register({
      name: "save_trip_plan", title: "收藏当前行程", description: "将当前已生成的旅行行程收藏到此设备。",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() { if (!generated) throw new Error("请先生成行程"); localStorage.setItem("wander-saved", "true"); setSaved(true); return { destination: selected.city, status: "saved" }; },
    });
    return () => lifecycle.abort();
  }, [generated, selected.city]);

  return <main className="min-h-screen overflow-x-clip bg-[#f4f2eb] text-[#15231e]">
    <header className="sticky top-0 z-50 w-full overflow-hidden border-b border-[#173c32]/10 bg-[#f4f2eb]/92 backdrop-blur-xl"><div className="mx-auto flex h-18 w-full min-w-0 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
      <a href="#" className="flex shrink-0 items-center gap-3 text-xl font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-full bg-[#173c32] text-[#d8ff64]"><Compass className="size-5" /></span> Wander AI</a>
      <nav className="hidden items-center gap-8 text-sm text-[#51635c] md:flex"><a href="#create">创建行程</a><a href="#planner">我的行程</a><a href="#discover">目的地</a></nav>
      {user ? <div className="flex items-center gap-2"><span className="hidden text-sm sm:inline">你好，{user}</span><Button variant="ghost" size="icon" className="rounded-full" onClick={() => { localStorage.removeItem("wander-user"); setUser(""); }} aria-label="退出登录"><LogOut className="size-4" /></Button></div> : <Dialog open={loginOpen} onOpenChange={setLoginOpen}><DialogTrigger asChild><Button className="rounded-full bg-[#173c32] px-4 text-sm text-white sm:px-5"><span className="sm:hidden">登录</span><span className="hidden sm:inline">登录 / 注册</span></Button></DialogTrigger><DialogContent className="w-[calc(100%-2rem)] rounded-[24px] sm:rounded-[28px]"><DialogHeader><DialogTitle className="text-2xl">保存你的每一次出发</DialogTitle><DialogDescription>输入邮箱即可体验 MVP 登录，行程将保存在当前设备。</DialogDescription></DialogHeader><label className="mt-4 text-sm font-medium">邮箱地址<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border bg-white px-4 text-base outline-none focus:border-[#173c32]" /></label><Button onClick={signIn} disabled={!email.includes("@")} className="mt-2 h-12 rounded-xl bg-[#173c32] text-white">继续 <ArrowRight /></Button></DialogContent></Dialog>}
    </div></header>

    <section id="create" className="relative overflow-hidden bg-[#07120f] text-white"><img src={destination === "tokyo" ? assetPath("hero-cinematic.webp") : selected.image} alt={`${selected.city}旅行风景`} className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-1000 max-lg:object-[58%_center]" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,14,11,.86),rgba(3,14,11,.48)_52%,rgba(3,14,11,.32))]" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(190,255,170,.20),transparent_32%),radial-gradient(circle_at_38%_88%,rgba(91,180,132,.18),transparent_38%),linear-gradient(180deg,rgba(2,10,8,.12),rgba(2,10,8,.5))]" /><div className="relative mx-auto grid min-h-[680px] min-w-0 max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[.9fr_1.1fr] lg:gap-12 lg:px-12">
      <div className="min-w-0 max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm shadow-[0_10px_30px_rgba(0,0,0,.18)] backdrop-blur-xl"><Sparkles className="size-4 text-[#d8ff64]" /> AI 行程工作台</span><h1 className="mt-6 text-[clamp(2.85rem,13vw,5.4rem)] font-bold leading-[.9] tracking-[-.07em] [text-shadow:0_8px_32px_rgba(0,0,0,.35)] sm:text-[clamp(3.2rem,8vw,5.4rem)] lg:text-[clamp(3.2rem,5.7vw,5.4rem)]">想去哪，<span className="block whitespace-nowrap font-serif font-semibold italic tracking-[-.055em] text-[#d8ff64]">现在就出发。</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-white/78 [text-shadow:0_2px_16px_rgba(0,0,0,.45)] sm:mt-7 sm:text-lg sm:leading-8">告诉我们预算和旅行偏好，几秒钟得到一份可修改、可收藏、可下单的专属行程。</p></div>
      <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[26px] border border-white/25 bg-[linear-gradient(135deg,rgba(245,255,249,.23),rgba(221,244,232,.10))] p-5 text-white shadow-[0_32px_90px_rgba(0,18,12,.38),inset_0_1px_0_rgba(255,255,255,.32)] backdrop-blur-[28px] sm:rounded-[32px] sm:p-8"><div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#caff9d]/15 blur-3xl" /><div className="relative flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-sm font-semibold uppercase tracking-[.2em] text-[#d4e8dc]">Plan a trip</p><h2 className="mt-2 text-2xl font-bold tracking-[-.035em] sm:text-3xl">创建我的旅行</h2></div><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#d8ff64] text-[#10231c] shadow-[0_10px_30px_rgba(195,255,100,.2)] sm:size-12"><Sparkles className="size-5" /></span></div>
        <div className="relative mt-8 grid w-full min-w-0 gap-x-6 gap-y-7 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-medium text-white/72">目的地<input value={destinationText} list="destination-suggestions" onChange={(e) => { const value = e.target.value; setDestinationText(value); const preset = Object.entries(plans).find(([, item]) => value.trim() === item.city || value.trim() === `${item.city}，${item.country}`); if (preset) setDestination(preset[0]); }} placeholder="输入城市或地区" className="mt-1 h-12 w-full min-w-0 rounded-none border-x-0 border-t-0 border-b border-white/28 bg-transparent px-0 text-base text-white outline-none transition placeholder:text-white/40 focus:border-[#d8ff64]" /><datalist id="destination-suggestions"><option value="东京" /><option value="里斯本" /><option value="巴厘岛" /></datalist></label>
          <label className="min-w-0 text-sm font-medium text-white/72">旅行预算<div className="mt-1 flex h-12 items-center border-b border-white/28 text-base text-white focus-within:border-[#d8ff64]"><span className="mr-2 text-[#d8ff64]">¥</span><input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="输入总预算" className="h-full w-full min-w-0 bg-transparent outline-none placeholder:text-white/40" /></div></label>
          <label className="min-w-0 text-sm font-medium text-white/72">旅行节奏<Select value={style} onValueChange={setStyle}><SelectTrigger className="mt-1 h-12 w-full min-w-0 rounded-none border-x-0 border-t-0 border-b border-white/28 bg-transparent px-0 text-base text-white shadow-none focus-visible:ring-0"><span className="truncate">{style === "relaxed" ? "松弛慢游" : style === "packed" ? "充实探索" : "张弛有度"}</span></SelectTrigger><SelectContent><SelectItem value="relaxed">松弛慢游</SelectItem><SelectItem value="balanced">张弛有度</SelectItem><SelectItem value="packed">充实探索</SelectItem></SelectContent></Select></label>
          <div className="min-w-0 text-sm font-medium text-white/72">日期与人数<Dialog open={dateOpen} onOpenChange={setDateOpen}><DialogTrigger asChild><button type="button" className="mt-1 flex h-12 w-full min-w-0 items-center gap-3 border-b border-white/28 bg-transparent px-0 text-left text-base text-white transition hover:border-[#d8ff64]"><CalendarDays className="size-4 shrink-0 text-[#d8ff64]" /><span className="truncate">{dateSummary}</span></button></DialogTrigger><DialogContent className="w-[calc(100%-2rem)] rounded-[24px] sm:max-w-md sm:rounded-[28px]"><DialogHeader><DialogTitle className="text-2xl">日期与旅行人数</DialogTitle><DialogDescription>选择出发、返程日期，以及同行人数。</DialogDescription></DialogHeader><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">出发日期<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce2dc] bg-white px-3 text-base outline-none focus:border-[#173c32]" /></label><label className="text-sm font-medium">返程日期<input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#dce2dc] bg-white px-3 text-base outline-none focus:border-[#173c32]" /></label></div><div className="mt-2 flex items-center justify-between rounded-2xl bg-[#edf0e9] p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white"><Users className="size-5 text-[#173c32]" /></span><div><p className="font-medium">旅行人数</p><p className="text-sm text-[#61716a]">最多 8 位旅客</p></div></div><div className="flex items-center gap-3"><button type="button" onClick={() => setTravelers((value) => Math.max(1, value - 1))} disabled={travelers === 1} className="grid size-9 place-items-center rounded-full border border-[#cfd7d1] bg-white disabled:opacity-35" aria-label="减少人数"><Minus className="size-4" /></button><strong className="w-5 text-center text-lg">{travelers}</strong><button type="button" onClick={() => setTravelers((value) => Math.min(8, value + 1))} disabled={travelers === 8} className="grid size-9 place-items-center rounded-full border border-[#cfd7d1] bg-white disabled:opacity-35" aria-label="增加人数"><Plus className="size-4" /></button></div></div>{!validDates && <p className="text-sm text-[#b74a38]">返程日期不能早于出发日期。</p>}<Button type="button" disabled={!validDates} onClick={() => setDateOpen(false)} className="mt-2 h-12 w-full rounded-xl bg-[#173c32] text-white">应用选择</Button></DialogContent></Dialog></div>
        </div>
        <label className="relative mt-7 block text-sm font-medium text-white/72">特别想体验什么？<div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 shadow-[0_12px_30px_rgba(0,0,0,.12)] backdrop-blur-xl"><Search className="size-4 text-[#d8ff64]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="例如：当代建筑、在地美食、避开人群" className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/45" /></div></label><Button onClick={generatePlan} disabled={generating} className="relative mt-6 h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#dfff79,#bdf08d)] text-base font-semibold text-[#10231c] shadow-[0_16px_36px_rgba(175,235,105,.22)] hover:brightness-105">{generating ? "正在组合路线…" : "生成专属行程"} <ArrowRight /></Button>
      </div>
    </div></section>

    <section id="planner" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12">{!generated ? <div className="grid min-h-[360px] place-items-center rounded-[32px] border border-dashed border-[#9faea6] bg-white/55 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e4eadf]"><Map className="size-7 text-[#426258]" /></span><h2 className="mt-5 text-2xl font-semibold">你的旅程将在这里展开</h2><p className="mt-2 text-[#61716a]">完成上方信息，生成第一份可编辑的行程。</p></div></div> : <>
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="min-w-0"><span className="text-sm font-semibold uppercase tracking-[.18em] text-[#60746b]">Your itinerary</span><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">{selected.city}，3 天 2 夜</h2><p className="mt-3 text-[#61716a]">{style === "relaxed" ? "松弛慢游" : style === "packed" ? "充实探索" : "张弛有度"} · {travelers} 位旅客 · 预算 ¥{Number(budget || 0).toLocaleString()}</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={toggleSaved} className="rounded-full bg-white"><Heart className={`size-4 ${saved ? "fill-[#ef6a55] text-[#ef6a55]" : ""}`} /> {saved ? "已收藏" : "收藏行程"}</Button><Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}><DialogTrigger asChild><Button className="rounded-full bg-[#173c32] px-5 text-white sm:px-6">模拟下单 <ArrowRight /></Button></DialogTrigger><DialogContent className="w-[calc(100%-2rem)] rounded-[24px] sm:rounded-[28px]"><DialogHeader><DialogTitle className="text-2xl">确认旅行方案</DialogTitle><DialogDescription>{selected.city} 3 天 2 夜 · {travelers} 位旅客 · {dateSummary}</DialogDescription></DialogHeader>{bookingDone ? <div className="py-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#d8ff64]"><Check className="size-7" /></span><h3 className="mt-5 text-2xl font-semibold">预订申请已创建</h3><p className="mt-2 text-[#61716a]">演示订单 WA-20261012 已保存，你可以继续修改行程。</p><Button className="mt-6 rounded-full bg-[#173c32] text-white" onClick={() => setCheckoutOpen(false)}>返回行程</Button></div> : <div className="space-y-4"><div className="rounded-2xl bg-[#edf0e9] p-5"><div className="flex justify-between"><span>酒店与活动预估</span><strong>¥{total.toLocaleString()}</strong></div><div className="mt-3 flex justify-between text-sm text-[#61716a]"><span>当前为模拟订单</span><span>无需付款</span></div></div><label className="block text-sm font-medium">联系人<input defaultValue={user || "旅行者"} className="mt-2 h-12 w-full rounded-xl border px-4 text-base" /></label><Button className="h-12 w-full rounded-xl bg-[#173c32] text-white" onClick={() => setBookingDone(true)}>确认提交</Button></div>}</DialogContent></Dialog></div></div>
      <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_.85fr]"><div className="min-w-0 rounded-[24px] bg-white p-4 shadow-[0_20px_60px_rgba(20,45,37,.08)] sm:rounded-[30px] sm:p-8"><Tabs value={activeDay} onValueChange={setActiveDay}><TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-[#edf0e9] p-1">{days.map((day) => <TabsTrigger key={day.day} value={String(day.day)} className="rounded-xl px-2 py-3 data-[state=active]:bg-[#173c32] data-[state=active]:text-white">第 {day.day} 天</TabsTrigger>)}</TabsList>{days.map((day) => <TabsContent key={day.day} value={String(day.day)} className="mt-7"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm text-[#718078]">DAY {day.day}</p><h3 className="text-xl font-semibold sm:text-2xl">{day.title}</h3></div><Button variant="outline" size="sm" className="rounded-full" onClick={() => addActivity(day.day)}><Plus className="size-4" /> 添加</Button></div><div className="space-y-3">{day.activities.map((item) => <div key={item.id} className="group grid min-w-0 grid-cols-[46px_minmax(0,1fr)_auto] gap-2 rounded-2xl border border-[#dce2dc] p-3 transition hover:border-[#9daf9f] hover:bg-[#fafbf7] sm:grid-cols-[58px_minmax(0,1fr)_auto] sm:gap-3 sm:p-4"><span className="pt-1 text-sm font-medium text-[#527065] sm:text-base">{item.time}</span><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><input value={item.title} onChange={(e) => updateActivity(day.day, item.id, e.target.value)} className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none" aria-label={`修改${item.title}`} /><Pencil className="hidden size-3.5 shrink-0 text-[#8b9992] sm:block" /></div><p className="mt-1 text-sm leading-6 text-[#6b7973]">{item.detail}</p><p className="mt-2 text-sm font-medium">{item.cost ? `约 ¥${item.cost}` : "免费"}</p></div><button onClick={() => removeActivity(day.day, item.id)} className="self-start rounded-full p-1.5 text-[#8b9992] hover:bg-[#f2e6e2] hover:text-[#b74a38] sm:p-2" aria-label="删除活动"><Trash2 className="size-4" /></button></div>)}</div></TabsContent>)}</Tabs></div>
        <aside className="overflow-hidden rounded-[30px] bg-[#173c32] text-white"><div className="relative h-72"><img src={selected.image} alt="路线地图背景" className="h-full w-full object-cover opacity-35" /><div className="absolute inset-0 bg-[#173c32]/45" /><div className="absolute inset-0 p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-white/12 px-3 py-1.5 text-sm backdrop-blur">路线预览</span><Map className="size-5" /></div><div className="relative mt-8 h-28"><div className="absolute left-[18%] top-[20%] size-4 rounded-full border-4 border-[#d8ff64] bg-[#173c32]" /><div className="absolute left-[47%] top-[58%] size-4 rounded-full border-4 border-[#d8ff64] bg-[#173c32]" /><div className="absolute right-[16%] top-[28%] size-4 rounded-full border-4 border-[#d8ff64] bg-[#173c32]" /><div className="absolute left-[22%] top-[35%] h-px w-[58%] rotate-[12deg] border-t-2 border-dashed border-[#d8ff64]/75" /></div><div className="grid grid-cols-3 gap-2"><a href={appleMapsUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-white/14 px-2 py-2.5 text-xs font-medium backdrop-blur transition hover:bg-white/24" aria-label={`使用苹果地图导航到${selected.city}`}><Navigation className="size-3.5 shrink-0" /> Apple</a><a href={googleMapsUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-white/14 px-2 py-2.5 text-xs font-medium backdrop-blur transition hover:bg-white/24" aria-label={`使用 Google Maps 导航到${selected.city}`}><Navigation className="size-3.5 shrink-0" /> Google</a><a href={amapUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-[#d8ff64] px-2 py-2.5 text-xs font-semibold text-[#173c32] transition hover:brightness-105" aria-label={`使用高德地图导航到${selected.city}`}><Navigation className="size-3.5 shrink-0" /> 高德</a></div></div></div><div className="p-7"><div className="flex items-center justify-between"><div><p className="text-sm text-white/55">行程预算预估</p><p className="mt-1 text-3xl font-semibold">¥{total.toLocaleString()}</p></div><WalletCards className="size-7 text-[#d8ff64]" /></div><div className="mt-6 space-y-4 border-t border-white/12 pt-6 text-sm"><div className="flex justify-between"><span className="text-white/60">酒店（2 晚）</span><span>¥3,600</span></div><div className="flex justify-between"><span className="text-white/60">交通预估</span><span>¥1,080</span></div><div className="flex justify-between"><span className="text-white/60">活动与餐饮</span><span>¥{(total - 4680).toLocaleString()}</span></div></div><p className="mt-6 rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/62">路线使用目的地真实坐标；价格仍为 MVP 演示数据，正式预订前将确认实时库存与价格。</p></div></aside></div>
    </>}</section>

    <section id="discover" className="bg-[#e2e6dd] px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1440px]"><div className="mb-9"><span className="text-sm font-semibold uppercase tracking-[.18em] text-[#60746b]">Quick inspiration</span><h2 className="mt-2 text-4xl font-semibold tracking-tight">换个目的地试试</h2></div><div className="grid gap-5 md:grid-cols-3">{Object.entries(plans).map(([key, item]) => <button key={key} onClick={() => { setDestination(key); document.getElementById("create")?.scrollIntoView({ behavior: "smooth" }); }} className="group relative min-h-72 overflow-hidden rounded-[26px] text-left text-white"><img src={item.image} alt={item.city} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6"><div><p className="text-sm text-white/65">{item.country}</p><h3 className="mt-1 text-3xl font-semibold">{item.city}</h3></div><span className="grid size-11 place-items-center rounded-full bg-[#d8ff64] text-[#173c32]"><ChevronRight /></span></div></button>)}</div></div></section>
    <footer className="bg-[#08130f] px-5 py-10 text-white sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3 text-lg font-semibold"><Compass className="size-5 text-[#d8ff64]" /> Wander AI</div><p className="text-sm text-white/45">MVP 演示 · 行程数据保存在当前设备</p></div></footer>
    <div className="fixed bottom-5 right-5 z-[70] sm:bottom-7 sm:right-7">{assistantOpen && <section className="mb-3 flex h-[min(620px,calc(100vh-120px))] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-[26px] border border-white/40 bg-[#f7f8f4]/95 shadow-[0_24px_80px_rgba(5,25,18,.28)] backdrop-blur-2xl"><header className="flex items-center justify-between bg-[#173c32] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#d8ff64] text-[#173c32]"><Bot className="size-5" /></span><div><h2 className="font-semibold">Wander AI 助手</h2><p className="text-xs text-white/60">联网旅行问答 · 当前：{tripCity}</p></div></div><button onClick={() => setAssistantOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="关闭助手"><X className="size-5" /></button></header><div className="flex-1 space-y-3 overflow-y-auto p-4">{chatMessages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><p className={`max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-[#173c32] text-white" : "rounded-bl-md bg-white text-[#31433c] shadow-sm"}`}>{message.text}</p></div>)}{assistantBusy && <div className="flex justify-start"><p className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#61716a] shadow-sm">正在联网查询…</p></div>}</div><div className="border-t border-[#dce2dc] bg-white/80 p-3"><div className="flex items-end gap-2 rounded-2xl border border-[#d4ddd6] bg-white p-2 pl-4"><textarea value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void askAssistant(); } }} rows={1} placeholder={`询问 ${tripCity} 的景点、美食、交通…`} className="max-h-24 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm outline-none" /><button onClick={() => void askAssistant()} disabled={!assistantInput.trim() || assistantBusy} className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d8ff64] text-[#173c32] disabled:opacity-40" aria-label="发送问题"><Send className="size-4" /></button></div></div></section>}<button onClick={() => setAssistantOpen((open) => !open)} className="ml-auto flex h-14 items-center gap-2 rounded-full bg-[#173c32] px-5 font-semibold text-white shadow-[0_16px_40px_rgba(5,35,25,.3)] hover:brightness-110"><MessageCircle className="size-5 text-[#d8ff64]" /><span>{assistantOpen ? "收起助手" : "问 Wander AI"}</span></button></div>
  </main>;
}

