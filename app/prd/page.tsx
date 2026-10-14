"use client";

import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Code2,
  Compass,
  Database,
  ExternalLink,
  Gauge,
  GitBranch,
  MapPinned,
  MessageSquareText,
  PencilRuler,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  TriangleAlert,
  UserRound,
  WalletCards,
} from "lucide-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const demoUrl = `${basePath}/?v=20261013-amap`;
const repoUrl = "https://github.com/xingfei686-dot/DEMO";
const docUrl = "https://github.com/xingfei686-dot/DEMO/blob/main/docs/PRD.md";

const navItems = [
  ["项目概览", "#overview"],
  ["产品方案", "#solution"],
  ["AI 设计", "#ai-design"],
  ["评测迭代", "#evaluation"],
  ["产品思考", "#decisions"],
];

const metrics = [
  { value: "96.7%", label: "JSON 解析成功率", note: "V1 83.3% → V3 96.7%" },
  { value: "93.3%", label: "结构化输出成功率", note: "V1 73.3% → V3 93.3%" },
  { value: "70.0%", label: "隐藏集可用行程率", note: "保守人工复核结果" },
  { value: "30 条", label: "分层离线评测集", note: "5 类关键旅行场景" },
];

const painPoints = [
  { icon: Database, title: "信息分散", text: "攻略、天气、地图和预算分布在多个产品中，用户需要反复检索与整理。" },
  { icon: MessageSquareText, title: "答案不可执行", text: "通用大模型善于生成长文本，却难以支持按天查看、局部修改和路线执行。" },
  { icon: TriangleAlert, title: "结果缺少约束", text: "地点可能失真，路线可能折返，预算、天气和特殊人群需求也容易被忽略。" },
];

const solutionSteps = [
  { number: "01", title: "结构化需求", text: "将目的地、日期、人数、预算、节奏拆成明确变量，同时保留自然语言偏好。" },
  { number: "02", title: "实时上下文", text: "获取天气和目的地候选资料，减少模型仅依赖参数知识做规划。" },
  { number: "03", title: "AI 生成", text: "要求豆包返回约定 JSON，将自然语言建议转成按天组织的活动数据。" },
  { number: "04", title: "人机共创", text: "用户既能直接编辑，也能用一句话调整整份方案，并保留未要求修改的内容。" },
  { number: "05", title: "执行与兜底", text: "聚合预算、地图与导出能力；模型失败时加载可编辑备用路线。" },
];

const architecture = [
  { icon: UserRound, label: "需求输入", detail: "目的地 · 日期 · 人数 · 预算 · 偏好" },
  { icon: CloudRain, label: "上下文增强", detail: "天气预报 · 目的地资料 · 当前行程" },
  { icon: BrainCircuit, label: "AI 规划", detail: "Prompt 约束 · JSON 输出 · 二次调整" },
  { icon: ShieldCheck, label: "确定性处理", detail: "解析校验 · 字段补全 · 数量限制 · 降级" },
  { icon: MapPinned, label: "可执行界面", detail: "逐日行程 · 地图 · 预算 · 编辑 · 导出" },
];

const cases = [
  {
    issue: "JSON 截断或格式错误",
    cause: "输出过长、结构约束不足",
    action: "限制字段长度，要求紧凑 JSON，并在生成前自检",
    result: "解析成功率提升至 96.7%",
    status: "已改善",
  },
  {
    issue: "预算超支",
    cause: "币种、人数与预算口径不统一",
    action: "统一人民币与同行人合计口径，低预算优先免费地点",
    result: "符合率提升，但仍需程序校验",
    status: "持续优化",
  },
  {
    issue: "地点幻觉",
    cause: "模型仅依赖参数知识生成地点",
    action: "优先使用候选地点，下一步接入高德 POI 做真实性验证",
    result: "Prompt 无法彻底解决事实问题",
    status: "待接入数据",
  },
  {
    issue: "路线绕行",
    cause: "语言模型不擅长精确空间计算",
    action: "要求同日区域聚类，计划引入真实通勤时间校验",
    result: "方向有效，稳定性仍不足",
    status: "待程序校验",
  },
];

const decisions = [
  {
    q: "为什么不只做聊天机器人？",
    a: "旅行计划最终需要按天查看、比较费用、修改并导航。对话适合表达需求，结构化界面才适合承载结果。",
  },
  {
    q: "为什么保留手动编辑？",
    a: "明确的小修改用表单更快，也能让用户掌握最终决定权；AI 主要处理模糊目标和全局调整。",
  },
  {
    q: "为什么优先设计降级策略？",
    a: "大模型和外部接口都可能失败。核心任务中，“失败后仍可继续”比增加低频功能更重要。",
  },
  {
    q: "为什么 Prompt 优化之后还需要工程校验？",
    a: "Prompt 能改善表达与格式，却不能稳定解决地点事实、空间距离和抵离时间等硬约束。",
  },
];

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#567067]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#10251e] sm:text-5xl">{title}</h2>
      {description && <p className="mt-5 text-base leading-8 text-[#60726b] sm:text-lg">{description}</p>}
    </div>
  );
}

export default function GoTripPrdPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f3ed] text-[#10251e]">
      <header className="sticky top-0 z-50 border-b border-[#cdd7cf]/80 bg-[#f5f3ed]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href={demoUrl} className="flex items-center gap-2.5 font-semibold">
            <span className="grid size-9 place-items-center rounded-full bg-[#173c32] text-[#d8ff64]"><Compass className="size-5" /></span>
            <span>GoTrip <span className="font-normal text-[#6a7a73]">· 产品作品集</span></span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-[#53675f] lg:flex">
            {navItems.map(([label, href]) => <a key={href} href={href} className="transition hover:text-[#10251e]">{label}</a>)}
          </nav>
          <a href={demoUrl} className="inline-flex items-center gap-2 rounded-full bg-[#173c32] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            在线体验 <ExternalLink className="size-4" />
          </a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#0d2c24] text-white">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_26%,rgba(216,255,100,.19),transparent_28%),radial-gradient(circle_at_15%_82%,rgba(105,181,147,.22),transparent_32%)]" />
        <div className="absolute -right-20 top-24 -z-10 size-[430px] rounded-full border border-white/10" />
        <div className="absolute -right-4 top-40 -z-10 size-[300px] rounded-full border border-[#d8ff64]/20" />
        <div className="mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/78">
              <Sparkles className="size-4 text-[#d8ff64]" /> AI Product Case Study · MVP 已上线
            </div>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.03] tracking-[-.055em] sm:text-7xl">
              让 AI 生成的旅行建议，
              <span className="mt-2 block text-[#d8ff64]">真正成为可执行行程。</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/68 sm:text-xl">
              GoTrip 是一款 AI 个性化旅行规划产品。它把模型的一次性回答转化为可以编辑、调整、导航和管理预算的结构化方案。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={demoUrl} className="inline-flex items-center gap-2 rounded-full bg-[#d8ff64] px-6 py-3.5 font-semibold text-[#10251e] transition hover:-translate-y-0.5">
                体验产品 <ArrowRight className="size-4" />
              </a>
              <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-6 py-3.5 font-medium text-white transition hover:bg-white/12">
                查看完整 PRD <ExternalLink className="size-4" />
              </a>
            </div>
            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 border-t border-white/12 pt-8 text-sm sm:grid-cols-4">
              <div><dt className="text-white/42">项目角色</dt><dd className="mt-1 font-medium">独立产品设计</dd></div>
              <div><dt className="text-white/42">产品阶段</dt><dd className="mt-1 font-medium">MVP / V1.1</dd></div>
              <div><dt className="text-white/42">核心模型</dt><dd className="mt-1 font-medium">豆包大模型</dd></div>
              <div><dt className="text-white/42">交付形态</dt><dd className="mt-1 font-medium">Web 产品原型</dd></div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -inset-8 rounded-full bg-[#d8ff64]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-[#f8faf5] p-4 text-[#10251e] shadow-[0_40px_110px_rgba(0,0,0,.34)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#dce3dc] pb-4">
                <div><p className="text-xs uppercase tracking-[.18em] text-[#6c7b74]">Your itinerary</p><h3 className="mt-1 text-2xl font-semibold">东京，3 天 2 夜</h3></div>
                <span className="rounded-full bg-[#e9f5df] px-3 py-1.5 text-xs font-semibold text-[#31523e]">预算内</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_170px]">
                <div className="space-y-3">
                  {[
                    ["08:00", "筑地早餐", "¥180"],
                    ["11:00", "根津美术馆", "¥65"],
                    ["17:30", "涩谷天空", "¥145"],
                  ].map(([time, title, cost], index) => (
                    <div key={title} className="flex items-center gap-3 rounded-2xl border border-[#dde5dc] bg-white p-3.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#173c32] text-xs font-semibold text-white">{index + 1}</span>
                      <div className="min-w-0 flex-1"><p className="font-semibold">{title}</p><p className="text-xs text-[#718078]">{time} · 可继续编辑</p></div>
                      <span className="text-sm font-medium">{cost}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-[#173c32] p-4 text-white">
                  <Route className="size-5 text-[#d8ff64]" />
                  <p className="mt-12 text-xs text-white/55">今日路线</p>
                  <p className="mt-1 text-lg font-semibold">中央区 → 南青山 → 涩谷</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/12"><div className="h-full w-3/4 rounded-full bg-[#d8ff64]" /></div>
                  <p className="mt-2 text-xs text-white/55">活动预算 ¥390 / ¥800</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#cfe0c7] bg-[#eff8e9] p-4">
                <Bot className="size-5 text-[#315c45]" />
                <p className="text-sm text-[#365947]"><strong>AI 调整：</strong>第二天轻松一点，并把雨天活动换到室内。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <SectionTitle
            eyebrow="01 · Problem framing"
            title="不是再做一个聊天框，而是解决“建议无法执行”。"
            description="自由行规划并不缺信息，真正缺的是把分散信息转化为满足多重约束、可以持续修改的行动方案。"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {painPoints.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[28px] border border-[#d5ddd6] bg-white p-7 shadow-[0_18px_60px_rgba(21,54,43,.05)]">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#edf2e9] text-[#173c32]"><Icon className="size-5" /></span>
                <h3 className="mt-7 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-[#65766f]">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-5 rounded-[30px] bg-[#173c32] p-6 text-white sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
            {metrics.map((metric) => (
              <div key={metric.label} className="border-white/12 p-3 lg:not-last:border-r">
                <p className="text-4xl font-semibold tracking-[-.04em] text-[#d8ff64]">{metric.value}</p>
                <p className="mt-3 font-semibold">{metric.label}</p>
                <p className="mt-1 text-sm text-white/48">{metric.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#72827a]">数据来自单次离线评测；地点与路线尚未完成地图 API 全量事实校验，不代表线上稳定性结论。</p>
        </div>
      </section>

      <section id="solution" className="scroll-mt-24 bg-[#e8ece5] px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <SectionTitle
            eyebrow="02 · Product solution"
            title="把开放式需求，收敛为可控的人机协作流程。"
            description="产品不追求一次生成即完美，而是让 AI、外部信息、确定性规则和用户决策各自做擅长的事。"
          />
          <div className="mt-14 grid gap-4 lg:grid-cols-5">
            {solutionSteps.map((step, index) => (
              <div key={step.number} className="relative rounded-[26px] border border-[#cfd9d0] bg-[#f8faf5] p-6">
                <span className="text-sm font-semibold text-[#6b7f75]">{step.number}</span>
                <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#61736b]">{step.text}</p>
                {index < solutionSteps.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden size-6 rounded-full bg-[#173c32] p-1 text-[#d8ff64] lg:block" />}
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-[30px] bg-white p-7 sm:p-9">
              <div className="flex items-center gap-3"><PencilRuler className="size-5 text-[#48695c]" /><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#667a71]">核心交互</p></div>
              <h3 className="mt-5 text-3xl font-semibold">两种修改方式，对应两类任务。</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f0f3ed] p-5"><p className="font-semibold">直接编辑</p><p className="mt-2 text-sm leading-6 text-[#61736b]">适合修改确定的时间、地点、费用，反馈直接且可控。</p></div>
                <div className="rounded-2xl bg-[#e8f3df] p-5"><p className="font-semibold">自然语言调整</p><p className="mt-2 text-sm leading-6 text-[#55705f]">适合“更轻松”“减少预算”等模糊或全局性目标。</p></div>
              </div>
            </article>
            <article className="overflow-hidden rounded-[30px] bg-[#10251e] p-7 text-white sm:p-9">
              <div className="flex items-center gap-3"><Target className="size-5 text-[#d8ff64]" /><p className="text-sm font-semibold uppercase tracking-[.16em] text-white/50">MVP 边界</p></div>
              <h3 className="mt-5 text-3xl font-semibold">先验证规划闭环，不伪装成交易平台。</h3>
              <ul className="mt-7 space-y-3 text-sm text-white/68">
                {["不查询真实库存与实时价格", "不产生真实订单或付款", "不承诺全局最优路线", "费用仅作为规划参考"].map((item) => (
                  <li key={item} className="flex items-center gap-3"><CheckCircle2 className="size-4 text-[#d8ff64]" />{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="ai-design" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <SectionTitle
            eyebrow="03 · AI product design"
            title="模型只是能力层，产品负责把不确定性变得可管理。"
            description="从上下文注入、结构化输出到异常兜底，每一层都围绕可执行性和可恢复性设计。"
          />
          <div className="mt-14 overflow-hidden rounded-[32px] border border-[#d2dbd3] bg-white p-6 sm:p-9">
            <div className="grid gap-4 lg:grid-cols-5">
              {architecture.map(({ icon: Icon, label, detail }, index) => (
                <div key={label} className="relative rounded-2xl bg-[#f3f5f0] p-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#173c32] text-[#d8ff64]"><Icon className="size-5" /></span>
                  <p className="mt-5 font-semibold">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-[#65766f]">{detail}</p>
                  {index < architecture.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-6 rounded-full bg-[#d8ff64] p-1 text-[#173c32] lg:block" />}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <article className="rounded-[26px] border border-[#d3dcd4] bg-white p-7">
              <Code2 className="size-6 text-[#315d49]" /><h3 className="mt-5 text-xl font-semibold">结构化输出</h3>
              <p className="mt-3 leading-7 text-[#65766f]">要求返回 JSON，并限制天数、活动数和字段长度，前端统一做解析和规范化。</p>
            </article>
            <article className="rounded-[26px] border border-[#d3dcd4] bg-white p-7">
              <GitBranch className="size-6 text-[#315d49]" /><h3 className="mt-5 text-xl font-semibold">局部重写</h3>
              <p className="mt-3 leading-7 text-[#65766f]">二次调整携带当前行程，要求保留未被用户点名修改的安排，降低“全盘重写”。</p>
            </article>
            <article className="rounded-[26px] border border-[#d3dcd4] bg-white p-7">
              <ShieldCheck className="size-6 text-[#315d49]" /><h3 className="mt-5 text-xl font-semibold">多级降级</h3>
              <p className="mt-3 leading-7 text-[#65766f]">外部数据失败不阻塞生成；模型失败时提供可编辑备用路线，保证核心任务可继续。</p>
            </article>
          </div>
        </div>
      </section>

      <section id="evaluation" className="scroll-mt-24 bg-[#10251e] px-5 py-24 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#d8ff64]">04 · Evaluation & iteration</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-.04em] sm:text-5xl">用评测集驱动迭代，而不是凭“感觉不错”判断 AI 效果。</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/58">30 条固定测试用例按开发集与隐藏集划分，覆盖基础规划、预算、天气、特殊需求与边界场景。</p>
          <div className="mt-12 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
            <div className="rounded-[28px] border border-white/12 bg-white/6 p-7">
              <div className="flex items-center gap-3"><TestTube2 className="size-5 text-[#d8ff64]" /><h3 className="text-xl font-semibold">五维评测 Rubric</h3></div>
              <div className="mt-7 space-y-5">
                {[
                  ["结构完整性", "JSON 可解析、天数与字段正确"],
                  ["预算符合度", "费用口径统一且不超过预算"],
                  ["地点真实性", "地点真实、可检索、属于目标城市"],
                  ["路线合理性", "同日相对集中，避免明显折返"],
                  ["天气适配度", "逐日匹配天气并提供备选"],
                ].map(([label, text], i) => (
                  <div key={label} className="flex gap-4">
                    <span className="mt-1 text-sm font-semibold text-[#d8ff64]">0{i + 1}</span>
                    <div><p className="font-semibold">{label}</p><p className="mt-1 text-sm leading-6 text-white/48">{text}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-white/12">
              <div className="grid grid-cols-[1.1fr_1fr_1.2fr] bg-white/8 px-5 py-4 text-xs font-semibold uppercase tracking-[.12em] text-white/45 sm:grid-cols-[1.1fr_1fr_1.2fr_1fr]">
                <span>Bad Case</span><span>原因</span><span>迭代动作</span><span className="hidden sm:block">状态</span>
              </div>
              {cases.map((item) => (
                <div key={item.issue} className="grid grid-cols-[1.1fr_1fr_1.2fr] gap-3 border-t border-white/10 px-5 py-5 text-sm sm:grid-cols-[1.1fr_1fr_1.2fr_1fr]">
                  <div><p className="font-semibold">{item.issue}</p><p className="mt-1 text-xs text-[#d8ff64]">{item.result}</p></div>
                  <p className="leading-6 text-white/48">{item.cause}</p>
                  <p className="leading-6 text-white/68">{item.action}</p>
                  <span className="hidden h-fit w-fit rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-xs text-white/65 sm:block">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-7 rounded-[26px] bg-[#d8ff64] p-6 text-[#10251e] sm:flex sm:items-center sm:justify-between sm:p-8">
            <div><p className="text-sm font-semibold uppercase tracking-[.16em]">关键结论</p><p className="mt-2 max-w-4xl text-xl font-semibold leading-8">Prompt 能显著改善格式和表达；地点事实、空间距离与时间冲突等硬约束，必须交给外部数据和确定性程序。</p></div>
            <Gauge className="mt-6 size-10 shrink-0 sm:ml-8 sm:mt-0" />
          </div>
        </div>
      </section>

      <section id="decisions" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <SectionTitle
            eyebrow="05 · Product decisions"
            title="产品取舍比功能数量更能说明判断力。"
            description="每个选择都围绕同一个目标：让用户更快获得可用方案，同时不掩盖 AI 的能力边界。"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {decisions.map((item, index) => (
              <article key={item.q} className="rounded-[28px] border border-[#d3dcd4] bg-white p-7 sm:p-8">
                <span className="text-sm font-semibold text-[#6b7d75]">0{index + 1}</span>
                <h3 className="mt-6 text-2xl font-semibold">{item.q}</h3>
                <p className="mt-4 leading-7 text-[#62746c]">{item.a}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-[30px] bg-[#e8ece5] p-7 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#61756c]">Next iteration</p>
              <h3 className="mt-4 text-3xl font-semibold">下一步：从“会生成”走向“可验证”。</h3>
              <ol className="mt-7 space-y-4 text-sm leading-6 text-[#52685e]">
                {[
                  "使用 JSON Schema 做结构校验，并补齐预算、抵离时间等后置规则",
                  "接入高德 POI 与路径规划，验证地点存在性、城市归属和通勤时间",
                  "失败时只重写受影响日期，减少用户已确认内容的丢失",
                  "开展 5–10 位真实用户可用性测试，记录保留率和任务完成率",
                ].map((item, index) => <li key={item} className="flex gap-4"><span className="font-semibold text-[#173c32]">{index + 1}</span><span>{item}</span></li>)}
              </ol>
            </article>
            <article className="flex flex-col justify-between rounded-[30px] bg-[#173c32] p-7 text-white sm:p-9">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d8ff64]">Try the product</p>
                <h3 className="mt-4 text-3xl font-semibold">建议用 3 分钟体验完整闭环。</h3>
                <p className="mt-4 max-w-lg leading-7 text-white/58">生成一份非预设目的地行程，用一句话调整第二天，再手动修改活动并查看预算和路线。</p>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href={demoUrl} className="inline-flex items-center gap-2 rounded-full bg-[#d8ff64] px-6 py-3.5 font-semibold text-[#10251e]">打开 GoTrip <ArrowRight className="size-4" /></a>
                <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/16 px-6 py-3.5 font-medium">查看 GitHub <ExternalLink className="size-4" /></a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d3dbd3] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 text-sm text-[#687a72] sm:flex-row sm:items-center">
          <p>GoTrip · AI 个性化旅行规划产品作品集</p>
          <div className="flex gap-5"><a href={demoUrl} className="hover:text-[#10251e]">在线体验</a><a href={docUrl} target="_blank" rel="noreferrer" className="hover:text-[#10251e]">完整 PRD</a><a href={repoUrl} target="_blank" rel="noreferrer" className="hover:text-[#10251e]">GitHub</a></div>
        </div>
      </footer>
    </main>
  );
}
