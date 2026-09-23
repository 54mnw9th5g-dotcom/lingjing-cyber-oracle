import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Solar } from 'lunar-javascript'
import { ArrowRight, CalendarDays, ChevronDown, CircleHelp, Clock3, Compass, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react'
import './styles.css'

type ElementName = '木' | '火' | '土' | '金' | '水'
type FocusKey = 'overview' | 'career' | 'wealth' | 'love' | 'health'
type TimeKey = 'now' | '2026' | '2027' | 'decade'
type ChartResult = {
  pillars: string[]
  lunarText: string
  zodiac: string
  dayMaster: string
  dayElement: ElementName
  counts: Record<ElementName, number>
  strongest: ElementName
  weakest: ElementName
  profile: string
  keywords: string[]
  reading: string
  advice: string
  timeKnown: boolean
  timeWarning: string
  cycles: { age: string; label: string; score: number; note: string }[]
}

const elements: ElementName[] = ['木', '火', '土', '金', '水']
const elementMap: Record<string, ElementName> = {
  甲: '木', 乙: '木', 寅: '木', 卯: '木', 丙: '火', 丁: '火', 巳: '火', 午: '火',
  戊: '土', 己: '土', 辰: '土', 戌: '土', 丑: '土', 未: '土', 庚: '金', 辛: '金', 申: '金', 酉: '金',
  壬: '水', 癸: '水', 子: '水', 亥: '水'
}

const elementLore: Record<ElementName, { profile: string; keywords: string[]; reading: string; advice: string }> = {
  木: { profile: '青木拓境', keywords: ['成长型选手', '会照顾人', '点子多'], reading: '说人话：你像一棵会自己找阳光的树，学习快、点子多，也挺会照顾团队气氛。适合从 0 到 1、内容创意、产品策划这类需要不断生长的事。', advice: '你容易同时开太多坑。每周只保一个头号任务，先长成一根主干，别急着把自己活成一片森林。' },
  火: { profile: '明火照野', keywords: ['表达力强', '行动派', '带气氛'], reading: '说人话：你在人群里比较容易被看见，适合表达、推动、演示和快速拍板。遇到有反馈的环境会越做越来劲，长期没人回应则容易掉电。', advice: '热情是外挂，续航才是本事。答应新事情前先看日历，不然很可能嘴上“没问题”，身体“你礼貌吗”。' },
  土: { profile: '厚土载物', keywords: ['靠谱', '能收残局', '重稳定'], reading: '说人话：你是那种项目乱成一锅粥时，能默默把表格、流程和人都重新摆整齐的人。适合运营、项目管理、长期经营和需要耐心的工作。', advice: '靠谱不等于什么都该你扛。把“我来吧”换成“谁负责、何时交付”，你的肩膀会感谢你。' },
  金: { profile: '白金裁光', keywords: ['判断快', '有边界', '重品质'], reading: '说人话：你对“不对劲”很敏锐，擅长找问题、定标准、做取舍。适合策略、研究、专业判断和对质量要求高的工作。', advice: '你的标准很有用，但别拿满分尺天天量自己。先交 80 分版本，再决定那 20 分值不值得卷。' },
  水: { profile: '玄水观澜', keywords: ['洞察强', '会变通', '想得深'], reading: '说人话：你很会看空气，也能快速理解复杂信息。适合研究、咨询、沟通协调和需要随机应变的环境，但想太多时容易在脑内开十场会。', advice: '直觉负责提案，行动负责验收。给纠结设个截止时间，过点就选一个成本可控的方案先试。' }
}

const fortunes = [
  { level: '上上签', title: '云开见月', poem: '云散长空月自明，轻舟已过旧潮声。\n不须催问花开日，风到庭前自有情。', story: '行路人夜渡迷津，原以为前路无光；待云一散，才发现月亮从未离开。', reading: '今天适合把复杂的事说简单，把迟疑已久的第一步迈出去。阻力正在退潮，你要做的是保持清醒，而不是继续等待完美时机。', lucky: '幸运色 · 松石青', action: '宜：发出邀约 / 定下方向', avoid: '忌：反复揣测' },
  { level: '上签', title: '竹影入窗', poem: '风来竹影扫闲阶，心有清音不用猜。\n留得三分容转圜，一枝新绿入窗来。', story: '庭前竹子随风俯仰，却从不折断；它提醒人，柔韧不是退缩。', reading: '今天的好运藏在“留白”里。给对话多一点余地，给计划多一条路径，原本卡住的关系会自然松动。', lucky: '幸运物 · 一杯温茶', action: '宜：倾听 / 调整节奏', avoid: '忌：急于证明' },
  { level: '中上签', title: '灯火可亲', poem: '万里归心一盏灯，寻常小事最堪凭。\n莫嫌此刻无惊喜，暖意层层自会增。', story: '远行者追逐天边盛景，回首才发现，真正照亮归途的是窗前那盏小灯。', reading: '今日不必追求戏剧性的突破。完成一件小事、回应一个关心、整理一处角落，都在悄悄为你积攒确定感。', lucky: '幸运数字 · 3', action: '宜：收尾 / 联系老友', avoid: '忌：轻视日常' },
  { level: '中签', title: '潮来有信', poem: '潮来潮去各依时，岸上行人莫自疑。\n手把微光安静坐，下一程风已可期。', story: '渔者懂得潮汐不能催促，只在等待时修补船网，于是风来便能启程。', reading: '你暂时感到的停顿，不等于没有进展。今天更适合检查装备、积累筹码，而不是强行推动尚未成熟的答案。', lucky: '幸运方位 · 东南', action: '宜：复盘 / 做准备', avoid: '忌：情绪化决定' },
  { level: '上签', title: '星落掌心', poem: '昨夜星河落浅湾，一枚微亮在心间。\n若将所愿轻轻护，来日回看已成山。', story: '少年捡到一粒星光，没有拿去炫耀，而是日日照料，后来它长成了指路的灯塔。', reading: '一个看似微小的念头值得被认真对待。今天请保护你的创意，不必急着获得所有人的理解。', lucky: '幸运时刻 · 17:20', action: '宜：记录灵感 / 独处', avoid: '忌：过早否定' },
  { level: '中上签', title: '山门初启', poem: '石阶苔浅露华新，山门半启待来人。\n一步不求千里远，只须今日胜昨日。', story: '访道者问抵达山顶的捷径，守门人只指了指脚下第一阶。', reading: '宏大的愿望要从一个可完成的动作开始。今天适合开局、试水、提交第一版，行动会替你消除焦虑。', lucky: '幸运色 · 朱砂红', action: '宜：开新局 / 先做再说', avoid: '忌：空想全局' },
  { level: '小吉', title: '雨过生苔', poem: '一场新雨洗尘埃，石上青青不待栽。\n旧事若能轻放下，眼前自有好风来。', story: '古寺石阶经雨后生出青苔，旧痕未消，却因此有了新的颜色。', reading: '今天的关键词是“更新”。允许旧计划退场，允许自己改变主意，你会腾出空间接住新的可能。', lucky: '幸运物 · 绿色植物', action: '宜：清理 / 删除待办', avoid: '忌：沉溺旧账' },
  { level: '中签', title: '雁过留声', poem: '长空雁字不成书，一声遥应已相扶。\n言语若存真意在，隔山隔水亦非疏。', story: '两队飞雁隔着云层互相鸣叫，虽不相见，却知道彼此都在前行。', reading: '别低估一句真诚回应的力量。今天的人际好运来自主动表达，尤其适合澄清误会与送出鼓励。', lucky: '幸运数字 · 8', action: '宜：表达感谢 / 对齐信息', avoid: '忌：沉默试探' }
]

const focusLabels: { key: FocusKey; label: string; glyph: string }[] = [
  { key: 'overview', label: '命格总览', glyph: '命' },
  { key: 'career', label: '事业', glyph: '业' },
  { key: 'wealth', label: '财运', glyph: '财' },
  { key: 'love', label: '爱情', glyph: '缘' },
  { key: 'health', label: '健康', glyph: '养' }
]

const timeLabels: { key: TimeKey; label: string }[] = [
  { key: 'now', label: '当下' },
  { key: '2026', label: '2026' },
  { key: '2027', label: '2027' },
  { key: 'decade', label: '未来十年' }
]

function getFocusReading(focus: FocusKey, chart: ChartResult) {
  const readings = {
    overview: { title: chart.profile, score: 82, summary: chart.reading, signal: `以${chart.dayElement}为核心能量，${chart.strongest}势最显`, actions: ['放大天赋，而非补齐所有短板', `在日常中有意识地涵养“${chart.weakest}”`, '重要选择同时听直觉与事实'] },
    career: { title: '事业 · 在擅长处建立主场', score: 86, summary: `${chart.dayElement}日主更适合在能持续积累判断力与作品的环境中发展。你不是靠短时爆发取胜，而是靠形成独特的方法论，让别人逐渐离不开你的视角。`, signal: '主线清晰度正在上升', actions: ['优先选择有成长复利的项目', '把隐性经验整理成可展示的成果', '避免同时承接过多模糊责任'] },
    wealth: { title: '财运 · 先聚势，再放大', score: 74, summary: `你的财富节律更偏向“能力变现”而非偶然投机。${chart.strongest}势明显，说明现阶段应把资源集中在最有优势的路径，减少情绪化切换。`, signal: '正财稳，机会财需筛选', actions: ['建立可量化的长期积累', '大额决定留出冷静期', '为新机会设置止损边界'] },
    love: { title: '爱情 · 真诚比猜测有效', score: 79, summary: `${chart.dayElement}的情感表达带着自己的节奏。你真正需要的不是表面的热闹，而是能尊重边界、理解沉默，也愿意共同成长的关系。`, signal: '关系里的表达窗口正在打开', actions: ['用清晰请求代替情绪试探', '观察行动的一致性', '保留各自独处与成长空间'] },
    health: { title: '健康 · 节律就是底气', score: 76, summary: `从五行象征看，${chart.weakest}气偏轻，提醒你关注生活节奏的平衡。这里不作医学判断，更适合把它理解为对睡眠、运动与压力管理的日常提示。`, signal: '身心恢复力需要被优先照顾', actions: ['固定一段无屏幕休息时间', '选择能长期坚持的轻运动', '不适时及时寻求专业医疗帮助'] }
  }
  return readings[focus]
}

function getTimeReading(time: TimeKey, chart: ChartResult) {
  const seed = hashText(`${chart.pillars.join('')}-${time}`)
  const scores = [68 + seed % 24, 63 + (seed >> 2) % 29, 65 + (seed >> 4) % 27]
  const content = {
    now: { title: '当下 · 整理信号', range: '未来 90 天', text: '你正处在重新排序优先级的阶段。先收束分散注意力，再推进一个最有确定性的动作，局面会比想象中更快变清楚。' },
    '2026': { title: '2026 · 破界生长', range: '丙午流年', text: '变化与表达欲同步增强，适合把能力推到台前。越主动定义目标，越不容易被外界节奏带走。重要决定宜分阶段验证。' },
    '2027': { title: '2027 · 聚势成形', range: '丁未流年', text: '前一阶段的尝试开始沉淀为结构。适合建立稳定合作、打磨长期作品，也要为关系与身体留出可持续的空间。' },
    decade: { title: '未来十年 · 从开拓到成局', range: '趋势导航', text: '前段重在探索与试错，中段进入资源聚合，后段更看重筛选和质量。最重要的不是每年都冲刺，而是让每一步彼此相连。' }
  }[time]
  return { ...content, scores }
}

function hashText(value: string) {
  return Array.from(value).reduce((sum, char) => ((sum * 31 + char.charCodeAt(0)) >>> 0), 7)
}

function buildChart(date: string, time: string, gender: string, location: string): ChartResult {
  const [year, month, day] = date.split('-').map(Number)
  const timeKnown = Boolean(time)
  const [hour, minute] = (time || '12:00').split(':').map(Number)
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar()
  const eightChar = lunar.getEightChar()
  const calculatedPillars = [eightChar.getYear(), eightChar.getMonth(), eightChar.getDay(), eightChar.getTime()]
  const pillars = timeKnown ? calculatedPillars : [...calculatedPillars.slice(0, 3), '待定']
  const counts = Object.fromEntries(elements.map((item) => [item, 0])) as Record<ElementName, number>
  pillars.join('').split('').forEach((char) => { const element = elementMap[char]; if (element) counts[element] += 1 })
  const strongest = [...elements].sort((a, b) => counts[b] - counts[a])[0]
  const weakest = [...elements].sort((a, b) => counts[a] - counts[b])[0]
  const dayMaster = pillars[2][0]
  const dayElement = elementMap[dayMaster] || strongest
  const lore = elementLore[dayElement]
  const seed = hashText(`${date}-${time}-${gender}-${location}-${pillars.join('')}`)
  const labels = ['蓄势校准', '破界生长', '聚势成局', '收束沉淀', '自在丰盈']
  const cycles = labels.map((label, index) => ({
    age: `${index * 10 + 8}—${index * 10 + 17} 岁`,
    label,
    score: 56 + ((seed >> (index * 3)) % 38),
    note: index === 1 ? '变化增多，主动选择比被动等待更有利。' : index === 2 ? '资源与能力开始相互咬合，适合建立长期作品。' : index === 3 ? '重心从扩张转向筛选，边界感带来更高质量。' : '顺势积累，把能量放在真正重要的事上。'
  }))
  return {
    pillars,
    lunarText: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    zodiac: lunar.getYearShengXiao(),
    dayMaster,
    dayElement,
    counts,
    strongest,
    weakest,
    profile: lore.profile,
    keywords: lore.keywords,
    reading: lore.reading,
    advice: `${lore.advice} 盘里${strongest}比较抢镜，${weakest}相对安静；不用急着“补五行”，把它当作一个提醒清单就好。`,
    timeKnown,
    timeWarning: timeKnown ? '出生时间已填写，四柱信息相对完整。' : '没有出生时间，时柱暂时缺席。性格大方向还能看，但感情细节、晚年趋势和起运时间可能跑偏——像导航少了一颗卫星，能走，但别太相信“前方 20 米右转”。',
    cycles
  }
}

function App() {
  const [page, setPage] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('page')
    return requested && ['home', 'chart', 'fortune', 'woodfish'].includes(requested) ? requested : 'home'
  })
  const [focus, setFocus] = useState<FocusKey>('overview')
  const [timeView, setTimeView] = useState<TimeKey>('now')
  const [date, setDate] = useState('1995-06-18')
  const [time, setTime] = useState('')
  const [gender, setGender] = useState('女')
  const [location, setLocation] = useState('')
  const [chart, setChart] = useState<ChartResult | null>(null)
  const [fortune, setFortune] = useState<(typeof fortunes)[number] | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [merit, setMerit] = useState(() => Number(localStorage.getItem('lingjing-merit') || 0))
  const [sound, setSound] = useState(true)
  const [sparks, setSparks] = useState<number[]>([])

  const today = useMemo(() => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()), [])

  useEffect(() => { localStorage.setItem('lingjing-merit', String(merit)) }, [merit])

  const navigate = (id: string) => {
    setPage(id)
    const nextUrl = id === 'home' ? window.location.pathname : `${window.location.pathname}?page=${id}`
    window.history.replaceState({}, '', nextUrl)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const calculate = (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setChart(buildChart(date, time, gender, location))
      window.setTimeout(() => document.getElementById('chart-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
    } catch (error) {
      console.error(error)
      alert('日期似乎穿越出了边界，请换一个有效时间再试。')
    }
  }

  const drawFortune = () => {
    if (drawing) return
    setDrawing(true)
    setFortune(null)
    window.setTimeout(() => {
      const key = `${new Date().toDateString()}-${Date.now()}`
      setFortune(fortunes[hashText(key) % fortunes.length])
      setDrawing(false)
    }, 1250)
  }

  const knock = () => {
    setMerit((value) => value + 1)
    const id = Date.now()
    setSparks((value) => [...value.slice(-6), id])
    window.setTimeout(() => setSparks((value) => value.filter((item) => item !== id)), 900)
    if (sound) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(185, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(92, context.currentTime + 0.22)
      gain.gain.setValueAtTime(0.22, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.36)
    }
  }

  const focusReading = chart ? getFocusReading(focus, chart) : null
  const timeReading = chart ? getTimeReading(timeView, chart) : null

  return <main>
    <header className="topbar">
      <button className="brand" onClick={() => navigate('home')}>
        <span className="brand-seal">灵</span>
        <span><strong>灵境</strong><small>CYBER ORACLE</small></span>
      </button>
      <nav>
        {[['chart', '命格演算'], ['fortune', '今日灵签'], ['woodfish', '电子木鱼']].map(([id, label]) => (
          <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)}>{label}</button>
        ))}
      </nav>
      <button className="about" title="关于灵境"><CircleHelp size={19} /></button>
    </header>

    {page === 'home' && <section className="hero">
      <div className="hero-grid" />
      <div className="orbit orbit-one"><i>金</i><i>木</i><i>水</i><i>火</i><i>土</i></div>
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={15} /> 东方玄学 × 数字灵感实验</div>
        <h1>问天地一瞬<br /><em>见自己万千</em></h1>
        <p>输入你的出生时空，让古老的干支系统在数字世界重新排列。<br />不替你决定未来，只帮你看见另一种可能。</p>
        <button className="primary-cta" onClick={() => navigate('chart')}>开启演算 <ArrowRight size={18} /></button>
      </div>
      <div className="hero-symbol" aria-hidden="true">
        <div className="symbol-ring"><span>乾</span><span>坎</span><span>艮</span><span>震</span><b>☯</b><span>巽</span><span>离</span><span>坤</span><span>兑</span></div>
      </div>
      <div className="scroll-cue"><span>点击开启</span><ChevronDown size={16} /></div>
    </section>}

    {page === 'chart' && <section id="chart" className="module chart-module page-view">
      <div className="section-heading">
        <span className="index">壹</span>
        <div><small>DESTINY MATRIX</small><h2>命格演算</h2><p>四柱为坐标，五行为能量，读取你的先天倾向与人生节律。</p></div>
      </div>
      <div className="chart-layout">
        <form className="birth-card" onSubmit={calculate}>
          <div className="card-label"><span>出生坐标录入</span><Compass size={18} /></div>
          <label>出生日期<div className="input-shell"><CalendarDays size={18} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div></label>
          <label>出生时间 <span className="optional">选填，但强烈建议填</span><div className="input-shell"><Clock3 size={18} /><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div>{!time && <span className="time-risk">⚠ 不填也能算，但会少一柱：细节准确度会打折，尤其是感情、晚运和具体年份。</span>}</label>
          <div className="form-row">
            <label>性别<select value={gender} onChange={(event) => setGender(event.target.value)}><option>女</option><option>男</option><option>不设限</option></select></label>
            <label>出生地（选填）<input placeholder="例如：杭州" value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          </div>
          <button className="submit-btn" type="submit"><span>生成我的命格图谱</span><ArrowRight size={18} /></button>
          <p className="microcopy">日期必填 · 时间选填 · 资料只留在当前设备，不拿你的八字去加班</p>
        </form>

        <div className={`result-card ${chart ? 'revealed' : ''}`} id="chart-result">
          {!chart ? <div className="result-empty"><div className="mini-oracle">命</div><h3>你的图谱尚未显形</h3><p>填写出生信息后，四柱、五行与阶段运势将在这里展开。</p><div className="scan-line" /></div> : <>
            <div className="result-top"><div><small>{chart.lunarText} · 属{chart.zodiac}</small><h3>{chart.profile}</h3></div><span className="day-master">日主<br /><b>{chart.dayMaster}</b></span></div>
            <div className={`accuracy-note ${chart.timeKnown ? 'complete' : 'risk'}`}><strong>{chart.timeKnown ? '四柱已齐' : '时间未填 · 三柱体验版'}</strong><span>{chart.timeWarning}</span></div>
            <div className="pillars">{['年柱', '月柱', '日柱', '时柱'].map((label, index) => <div key={label} className={index === 2 ? 'focus' : ''}><small>{label}</small><strong>{chart.pillars[index][0]}</strong><strong>{chart.pillars[index][1]}</strong></div>)}</div>
            <div className="keywords">{chart.keywords.map((item) => <span key={item}>#{item}</span>)}</div>
            <p className="reading">{chart.reading}</p>
            <div className="elements"><div className="elements-title"><span>五行能量分布</span><small>显势 {chart.strongest} · 待养 {chart.weakest}</small></div>{elements.map((item) => <div className="element-row" key={item}><span>{item}</span><div><i style={{ width: `${Math.max(12, chart.counts[item] * 12.5)}%` }} /></div><b>{chart.counts[item]}</b></div>)}</div>
            <div className="advice"><Sparkles size={18} /><p>{chart.advice}</p></div>
            <div className="reading-switcher">
              <div className="switcher-label"><span>选择你想看的方向</span><small>点击切换专题解读</small></div>
              <div className="focus-tabs">{focusLabels.map((item) => <button key={item.key} className={focus === item.key ? 'active' : ''} onClick={() => setFocus(item.key)}><i>{item.glyph}</i>{item.label}</button>)}</div>
              {focusReading && <div className="focus-panel" key={focus}>
                <div className="focus-score"><strong>{focusReading.score}</strong><small>参考指数</small></div>
                <div className="focus-body"><span>{focusReading.signal}</span><h4>{focusReading.title}</h4><p>{focusReading.summary}</p><ul>{focusReading.actions.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>}
            </div>
            <div className="time-switcher">
              <div className="switcher-label"><span>按时间查看</span><small>切换不同时间尺度</small></div>
              <div className="time-tabs">{timeLabels.map((item) => <button key={item.key} className={timeView === item.key ? 'active' : ''} onClick={() => setTimeView(item.key)}>{item.label}</button>)}</div>
              {timeReading && <div className="time-panel" key={timeView}><div><small>{timeReading.range}</small><h4>{timeReading.title}</h4><p>{timeReading.text}</p></div><div className="signal-bars">{['事业', '关系', '身心'].map((label, index) => <div key={label}><span>{label}</span><i><b style={{ width: `${timeReading.scores[index]}%` }} /></i><strong>{timeReading.scores[index]}</strong></div>)}</div></div>}
            </div>
            <div className="cycle-title"><span>阶段能量走势</span><small>趋势提示，不作确定预测</small></div>
            <div className="cycles">{chart.cycles.map((cycle) => <div className="cycle" key={cycle.age}><span className="cycle-score">{cycle.score}</span><div><small>{cycle.age}</small><b>{cycle.label}</b><p>{cycle.note}</p></div></div>)}</div>
          </>}
        </div>
      </div>
    </section>}

    {page === 'fortune' && <section id="fortune" className="module fortune-module page-view">
      <div className="section-heading light">
        <span className="index">贰</span><div><small>DAILY ORACLE</small><h2>今日灵签</h2><p>{today}，为此刻的你留一句话。</p></div>
      </div>
      <div className="fortune-stage">
        <div className={`fortune-tube ${drawing ? 'shaking' : ''}`}><div className="sticks">{[1,2,3,4,5,6].map((item) => <i key={item} />)}</div><span>灵境</span></div>
        {!fortune ? <div className="fortune-intro"><span className="fortune-number">今日 · 一签</span><h3>{drawing ? '听见签筒里的回声…' : '闭眼，想一个此刻最在意的问题'}</h3><p>答案不在签里，签只是帮你听见心里的声音。</p><button className="fortune-btn" onClick={drawFortune} disabled={drawing}>{drawing ? '正在感应' : '轻触抽签'}<Sparkles size={17} /></button></div> : <div className="fortune-paper">
          <div className="paper-head"><span>{fortune.level}</span><button onClick={drawFortune}><RotateCcw size={16} /> 再问一次</button></div>
          <h3>{fortune.title}</h3><p className="poem">{fortune.poem}</p><p className="story">{fortune.story}</p><div className="interpretation"><small>灵境解读</small><p>{fortune.reading}</p></div>
          <div className="fortune-meta"><span>{fortune.lucky}</span><span>{fortune.action}</span><span>{fortune.avoid}</span></div>
        </div>}
      </div>
    </section>}

    {page === 'woodfish' && <section id="woodfish" className="module woodfish-module page-view">
      <div className="section-heading">
        <span className="index">叁</span><div><small>MINDFUL RITUAL</small><h2>电子木鱼</h2><p>敲一下，放下一个杂念。声音很短，心可以慢一点。</p></div>
      </div>
      <div className="woodfish-stage">
        <button className="sound-toggle" onClick={() => setSound((value) => !value)}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}{sound ? '声音开启' : '声音关闭'}</button>
        <div className="merit-count"><small>今日功德</small><strong>{String(merit).padStart(4, '0')}</strong><span>次专注</span></div>
        <div className="fish-wrap">{sparks.map((id) => <span className="merit-spark" key={id}>功德 +1</span>)}<button className="woodfish" onClick={knock} aria-label="敲击电子木鱼"><span className="fish-slot" /><span className="fish-mark">静</span></button><div className="mallet"><i /><b /></div></div>
        <p className="knock-hint">轻触木鱼 · 呼吸一次 · 再继续</p>
        <button className="reset-btn" onClick={() => setMerit(0)}>清零今日计数</button>
      </div>
    </section>}

    <footer><div className="footer-seal">灵</div><p><strong>灵境 CYBER ORACLE</strong><br />命由心造，境随念转。</p><span>命理解读与灵签仅供文化娱乐及自我探索，不替代医疗、法律或财务建议。</span></footer>
  </main>
}

createRoot(document.getElementById('root')!).render(<App />)
