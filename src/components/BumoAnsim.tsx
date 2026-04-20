"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════
// 우리엄빠 - 심플 버전
// 등급판별 + 비용계산 + 체크리스트 + 상담연결
// ═══════════════════════════════════════════════════

const STEPS = {
  LANDING: 0, USER_INFO: 13, BASIC_INFO: 1, PHYSICAL: 2, SOCIAL: 3, COGNITION: 4, BEHAVIOR: 5, NURSING: 6,
  RESULT: 7, CONSULT: 8, COST_CALC: 9, COST_RESULT: 10, CHECKLIST: 11, FAMILY_CARE: 12,
};

// Google Sheets 연동 URL
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyHrpbPp5hCGwfCdpeC_zkZlu8Ks1G3gB_dQDkd3SL87E-D6QLumf1pGaCqt-F1WKaz/exec";

// ── 2026 수가 ──
const monthlyLimit = { "1": 1520700, "2": 1351700, "3": 1295400, "4": 1189800, "5": 1021300, "cogn": 573900 };
const visitCare = [
  { code: "가-1", label: "30분", fee: 14750 }, { code: "가-2", label: "60분", fee: 22640 },
  { code: "가-3", label: "90분", fee: 30370 }, { code: "가-4", label: "120분", fee: 39340 },
  { code: "가-5", label: "150분", fee: 43570 }, { code: "가-6", label: "180분", fee: 48170 },
  { code: "가-7", label: "210분", fee: 52400 }, { code: "가-8", label: "240분", fee: 56320 },
];
const dayCareFees = {
  "라-1": { label: "3~6시간", "1": 35480, "2": 32850, "3": 30330, "4": 28940, "5": 27560, "cogn": 27560 },
  "라-2": { label: "6~8시간", "1": 47570, "2": 44060, "3": 40670, "4": 39290, "5": 37890, "cogn": 37890 },
  "라-3": { label: "8~10시간", "1": 59160, "2": 54810, "3": 50600, "4": 49220, "5": 47820, "cogn": 47820 },
  "라-4": { label: "10~12시간", "1": 65180, "2": 60380, "3": 55780, "4": 54370, "5": 52990, "cogn": 47820 },
  "라-5": { label: "12시간+", "1": 69890, "2": 64750, "3": 59810, "4": 58430, "5": 57040, "cogn": 47820 },
};
const shortStayFees = { "1": 58070, "2": 53780, "3": 49680, "4": 48360, "5": 47050 };
const facilityFees = { "1": 93070, "2": 86340, "3": 81540, "4": 81540, "5": 81540 };
const facilitySelfs = { "1": 18614, "2": 17268, "3": 16308, "4": 16308, "5": 16308 };
const groupHomeFees = { "1": 74590, "2": 69210, "3": 63800, "4": 63800, "5": 63800 };
const groupHomeSelfs = { "1": 14918, "2": 13842, "3": 12760, "4": 12760, "5": 12760 };

// ── 평가 항목 ──
const physicalItems = [
  { key: "dressing", label: "옷 혼자 갈아입기" }, { key: "washFace", label: "세수하기" }, { key: "brushTeeth", label: "양치질하기" },
  { key: "bathing", label: "목욕하기" }, { key: "eating", label: "밥 혼자 드시기" }, { key: "posChange", label: "누워서 몸 돌리기" },
  { key: "sitStand", label: "혼자 일어나 앉기" }, { key: "transfer", label: "침대에서 의자로 옮기기" }, { key: "goOutRoom", label: "방 밖으로 나오기" },
  { key: "toiletUse", label: "화장실 혼자 가기" }, { key: "bowelCtrl", label: "대변 참기·조절" }, { key: "urineCtrl", label: "소변 참기·조절" },
  { key: "hairWash", label: "머리 감기" },
];
const socialItems = [
  { key: "housekeep", label: "집안일 하기 (청소 등)" }, { key: "mealPrep", label: "식사 준비하기" }, { key: "laundry", label: "빨래하기" },
  { key: "moneyMgmt", label: "돈 관리하기" }, { key: "shopping", label: "장보기·물건 사기" }, { key: "phoneUse", label: "전화 걸고 받기" },
  { key: "transport", label: "버스·지하철 타기" }, { key: "goingOut", label: "가까운 곳 외출" }, { key: "grooming", label: "옷 맵시·머리 단장" },
  { key: "medMgmt", label: "약 챙겨서 드시기" },
];
const cognitionItems = [
  { key: "forgetRecent", label: "방금 말한 것을 잊어버림" }, { key: "notKnowDate", label: "오늘이 며칠인지 모름" },
  { key: "notKnowPlace", label: "지금 있는 곳이 어딘지 모름" }, { key: "notKnowAge", label: "자기 나이·생일을 모름" },
  { key: "cantFollowInst", label: "시키는 말을 이해 못 함" }, { key: "poorJudge", label: "옳고 그름을 잘 모름" },
  { key: "commProblem", label: "말이 잘 안 통함" }, { key: "cantCalc", label: "간단한 계산도 못 함" },
  { key: "cantRoutine", label: "하루 일과를 이해 못 함" }, { key: "cantRecogFamily", label: "가족을 못 알아봄" },
];
const behaviorItems = [
  { key: "delusion", label: "없는 일을 사실이라고 믿음 (도둑 맞았다 등)" }, { key: "hallucin", label: "없는 것이 보이거나 들린다고 함" }, { key: "depression", label: "우울해하고 의욕이 없음" },
  { key: "sleepIssue", label: "밤에 잠을 잘 못 주무심" }, { key: "resistCare", label: "돌봐주는 것을 거부함" }, { key: "restless", label: "가만히 있지 못하고 초조해함" },
  { key: "wandering", label: "이유 없이 밖으로 나가 돌아다님" }, { key: "aggression", label: "욕하거나 때리려고 함" },
  { key: "triesGoOut", label: "집을 나가려고 함" }, { key: "inapprop", label: "상황에 안 맞는 행동을 함" },
];
const nursingItems = [
  { key: "suction", label: "가래 뽑기 (흡인)" }, { key: "oxygen", label: "산소 호흡기 사용" }, { key: "soreCare", label: "욕창(등·엉덩이 상처) 치료" },
  { key: "tubeFeeding", label: "콧줄·위장관으로 음식 넣기" }, { key: "catheter", label: "소변줄·장루 관리" },
  { key: "upperLimb", label: "팔 움직이기 (마비 있는지)" }, { key: "lowerLimb", label: "다리 움직이기 (마비 있는지)" }, { key: "jointLimit", label: "관절이 굳어서 잘 안 움직임" },
];

const checklistItems = [
  { cat: "센터 확인", t: "건보공단 평가등급 확인", d: "장기요양기관 평가 A~E등급을 확인하세요. C등급 이하는 피하는 게 좋습니다.", how: "장기요양기관 찾기 → longtermcare.or.kr에서 검색", flag: "평가등급을 알려주지 않거나 얼버무리면 주의" },
  { cat: "센터 확인", t: "센터 운영 기간 확인", d: "최소 3년 이상 운영된 센터가 안정적입니다. 신설 센터는 요양보호사 수급이 불안정할 수 있습니다.", how: "\"센터 언제 오픈하셨어요?\" 직접 물어보기", flag: "1년 미만 센터는 폐업 위험도 있음" },
  { cat: "요양보호사", t: "담당 요양보호사 경력 확인", d: "최소 1년 이상 경력자를 요청하세요. 치매 어르신이면 치매전문교육 이수 여부도 확인하세요.", how: "\"선생님 경력이 어떻게 되세요?\" \"치매교육 받으셨어요?\"", flag: "경력을 정확히 말 못하거나, 센터에서 알려주지 않으면 주의" },
  { cat: "요양보호사", t: "교체 가능 여부 미리 확인", d: "요양보호사와 어르신의 궁합이 안 맞을 수 있습니다. 교체가 자유로운지 반드시 사전에 확인하세요.", how: "\"만약 안 맞으면 교체 가능한가요? 비용은요?\"", flag: "\"교체가 어렵다\" 또는 위약금을 요구하면 다른 센터 알아보기" },
  { cat: "비용", t: "본인부담금 외 추가비용 확인", d: "교통비, 식대, 명절 수당 등 추가로 나가는 돈이 있는지 꼭 물어보세요. 센터마다 다릅니다.", how: "\"본인부담금 외에 따로 내야 하는 비용이 있나요?\"", flag: "계약서에 없는 비용을 나중에 청구하면 부당청구" },
  { cat: "비용", t: "본인부담금 감면 대상 확인", d: "기초수급자는 무료, 차상위는 본인부담 경감됩니다. 해당 여부를 꼭 확인하세요.", how: "\"저희 부모님이 기초수급자인데 감면 되나요?\"", flag: "감면 대상인데 일반 요금을 청구하면 부당" },
  { cat: "서비스", t: "케어 일지 공유 여부", d: "매일 어떤 서비스를 했는지 보호자에게 알려주는 센터가 좋습니다. 앱이나 문자로 일지를 공유하는지 확인하세요.", how: "\"케어 일지를 매일 받아볼 수 있나요?\"", flag: "\"그런 거 안 한다\"면 서비스 관리가 안 되는 센터" },
  { cat: "서비스", t: "서비스 시간 정확히 지키는지", d: "계약된 시간보다 일찍 가거나 늦게 오는 경우가 많습니다. 첫 달은 어르신에게 몇 시에 왔는지 확인하세요.", how: "어르신에게 \"선생님 몇 시에 오셨어?\" 물어보기", flag: "시간을 자주 어기면 센터에 바로 말하기" },
  { cat: "긴급상황", t: "야간·주말 긴급 연락 체계", d: "어르신 상태가 급변하면 밤이나 주말에도 연락이 되어야 합니다. 24시간 연락 가능한지 확인하세요.", how: "\"밤에 급한 일이 생기면 어디로 연락하나요?\"", flag: "대표번호만 있고 야간 연락처가 없으면 불안" },
  { cat: "긴급상황", t: "대체 인력 투입 기준", d: "담당 요양보호사가 아프거나 휴가일 때 대체 인력이 바로 오는지 확인하세요. 빈 날이 생기면 어르신이 위험합니다.", how: "\"담당 선생님이 못 오시면 다른 분이 오나요?\"", flag: "\"대체 인력이 없어서 쉬어야 한다\"면 센터 규모가 너무 작은 것" },
];

// ── 점수 계산 ──
function calcScore(basic, physical, social, cognition, behavior, nursing) {
  let s = 0;
  Object.values(physical).forEach((v) => { s += v === "full" ? 4 : v === "partial" ? 2 : 0; });
  Object.values(social).forEach((v) => { s += v === "full" ? 2 : v === "partial" ? 1 : 0; });
  Object.values(cognition).forEach((v) => { s += v ? 2 : 0; });
  Object.values(behavior).forEach((v) => { s += v ? 1.5 : 0; });
  ["suction","oxygen","soreCare","tubeFeeding","catheter"].forEach((k) => { if (nursing[k]) s += 3; });
  ["upperLimb","lowerLimb"].forEach((k) => { if (nursing[k] === "full") s += 3; else if (nursing[k] === "partial") s += 1.5; });
  if (nursing.jointLimit) s += 1.5;
  if (basic.dementiaDx) s += 8;
  if (basic.recentDementia) s += 3;
  if (physical.toiletUse === "indep" && physical.bowelCtrl === "indep" && physical.urineCtrl === "indep") s -= 6;
  return Math.round(s * 10) / 10;
}
function estimateGrade(score, basic) {
  const d = basic.dementiaDx || basic.recentDementia;
  if (d && score < 45) return { grade: "인지지원등급", gradeKey: "cogn", conf: "중간", color: "#6366F1", emoji: "🧠" };
  if (d && score >= 45 && score < 51) return { grade: "5등급", gradeKey: "5", conf: "중간~높음", color: "#8B5CF6", emoji: "🧠" };
  if (score >= 95) return { grade: "1등급", gradeKey: "1", conf: "중간", color: "#DC2626", emoji: "🚨" };
  if (score >= 75) return { grade: "2등급", gradeKey: "2", conf: "중간", color: "#EA580C", emoji: "⚠️" };
  if (score >= 60) return { grade: "3등급", gradeKey: "3", conf: "중간", color: "#D97706", emoji: "📋" };
  if (score >= 51) return { grade: "4등급", gradeKey: "4", conf: "중간", color: "#0D9488", emoji: "📋" };
  if (d) return { grade: "인지지원등급", gradeKey: "cogn", conf: "낮음~중간", color: "#6366F1", emoji: "🧠" };
  return { grade: "등급외", gradeKey: "none", conf: "중간", color: "#6B7280", emoji: "ℹ️" };
}
function getInsights(basic, physical, cognition, behavior) {
  const ins = [];
  if (physical.toiletUse === "indep" && physical.bowelCtrl === "indep" && physical.urineCtrl === "indep") ins.push({ type: "info", text: "화장실·대소변을 혼자 하심 → 상태가 괜찮은 편입니다" });
  const cog = Object.values(cognition).filter(Boolean).length;
  if (cog >= 5) ins.push({ type: "warn", text: `기억·판단력 문제가 ${cog}가지 → 병원에서 치매 검사 권장` });
  const beh = Object.values(behavior).filter(Boolean).length;
  if (beh >= 4) ins.push({ type: "warn", text: `이상 행동이 ${beh}가지 → 등급이 더 높게 나올 수 있습니다` });
  if (basic.dementiaDx) ins.push({ type: "plus", text: "치매 진단 있음 → 5등급·인지지원등급 가능성 높음" });
  const full = Object.values(physical).filter((v) => v === "full").length;
  if (full >= 8) ins.push({ type: "warn", text: `많은 도움이 필요한 항목이 ${full}가지 → 높은 등급 가능성` });
  return ins;
}

// ── 색상 ──
const C = {
  bg: "#F7F6F3", card: "#FFF", primary: "#1A6B4B", primaryLight: "#E6F4ED", primaryDark: "#12503A",
  accent: "#E05A2B", accentLight: "#FFF1EB", text: "#111827", textSub: "#6B7280", border: "#E5E7EB",
  danger: "#DC2626", dangerBg: "#FEF2F2", warn: "#D97706", warnBg: "#FFFBEB",
  safe: "#059669", safeBg: "#ECFDF5", gold: "#A16207", goldBg: "#FEFCE8",
};
const F = `'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif`;

export default function UriUmbba() {
  const [step, setStep] = useState(STEPS.LANDING);
  const [fade, setFade] = useState(true);
  const ref = useRef(null);

  const [basic, setBasic] = useState({ age: "", livingAlone: null, dementiaDx: false, recentDementia: false, wandering: false });
  const [physical, setPhysical] = useState({});
  const [social, setSocial] = useState({});
  const [cognition, setCognition] = useState({});
  const [behavior, setBehavior] = useState({});
  const [nursing, setNursing] = useState({});
  const [costType, setCostType] = useState(null);
  const [costGrade, setCostGrade] = useState("3");
  const [visitIdx, setVisitIdx] = useState(3);
  const [visitDays, setVisitDays] = useState("22");
  const [daycareTime, setDaycareTime] = useState("라-3");
  const [daycareDays, setDaycareDays] = useState("22");
  const [shortStayDays, setShortStayDays] = useState("15");
  const [checkedItems, setCheckedItems] = useState([]);
  const [userInfo, setUserInfo] = useState({ name: "", phone: "", area: "" });
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  const go = useCallback((target) => {
    setFade(false);
    setTimeout(() => { setStep(target); setFade(true); ref.current?.scrollTo(0, 0); }, 180);
  }, []);

  const resetAll = () => {
    setBasic({ age: "", livingAlone: null, dementiaDx: false, recentDementia: false, wandering: false });
    setPhysical({}); setSocial({}); setCognition({}); setBehavior({}); setNursing({});
    go(STEPS.LANDING);
  };

  // ── 공통 UI ──
  const Hdr = ({ title, onBack }: any) => (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.card, position: "sticky", top: 0, zIndex: 10 }}>
      {onBack && <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", marginRight: 8, padding: 4, color: C.text }}>←</button>}
      <span style={{ fontSize: 16, fontWeight: 700, color: C.text, flex: 1 }}>{title}</span>
      <span style={{ fontSize: 11, color: C.textSub, fontWeight: 600, background: C.primaryLight, padding: "3px 8px", borderRadius: 6 }}>우리엄빠</span>
    </div>
  );
  const Btn = ({ children, onClick, v = "primary", disabled = false, s = {} }) => {
    const base = { width: "100%", padding: "15px 24px", borderRadius: 14, border: "none", fontSize: 15, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: F, opacity: disabled ? 0.35 : 1, transition: "all 0.2s" };
    const vs = { primary: { background: C.primary, color: "#fff" }, accent: { background: C.accent, color: "#fff" }, outline: { background: "transparent", color: C.primary, border: `2px solid ${C.primary}` }, ghost: { background: C.primaryLight, color: C.primary } };
    return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...vs[v], ...s }}>{children}</button>;
  };
  const Crd = ({ children, style: s = {}, onClick }: any) => (
    <div onClick={onClick} style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.03)", cursor: onClick ? "pointer" : "default", ...s }}>{children}</div>
  );
  const Prog = ({ current, total, label }: any) => (
    <div style={{ margin: "16px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textSub, fontWeight: 600 }}>{label}</span><span style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>{current}/{total}</span></div>
      <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${(current / total) * 100}%`, background: `linear-gradient(90deg,${C.primary},${C.primaryDark})`, borderRadius: 3, transition: "width 0.4s" }} /></div>
    </div>
  );
  const chip = (sel, extra = {}) => ({ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: sel ? "none" : `1.5px solid ${C.border}`, background: sel ? C.primary : C.card, color: sel ? "#fff" : C.textSub, cursor: "pointer", fontFamily: F, transition: "all 0.15s", ...extra });


  const inner = { padding: "0 20px 40px", opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(10px)", transition: "all 0.25s ease" };

  // ═══ 랜딩 ═══
  const Landing = () => (
    <div style={inner}>
      <div style={{ textAlign: "center", paddingTop: 44 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, marginBottom: 16, boxShadow: "0 10px 30px rgba(26,107,75,0.3)" }}><span style={{ fontSize: 36 }}>👨‍👩‍👧‍👦</span></div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: "0 0 4px", letterSpacing: -1 }}>우리엄빠</h1>
        <p style={{ fontSize: 15, color: C.primary, fontWeight: 700, margin: "0 0 4px" }}>우리 엄마 아빠 괜찮을까?</p>
        <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 32px" }}>장기요양 사전 예측 · 비용 계산 · 센터 연결</p>
      </div>

      <Crd onClick={() => go(STEPS.BASIC_INFO)} style={{ cursor: "pointer", border: `2px solid ${C.primary}`, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>장기요양 등급 사전 판별</div><div style={{ fontSize: 12, color: C.textSub }}>인정조사표 기반 · 3분 소요</div></div>
          <span style={{ color: C.primary, fontWeight: 700 }}>→</span>
        </div>
      </Crd>

      <Crd onClick={() => go(STEPS.COST_CALC)} style={{ cursor: "pointer", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💰</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>요양 비용 계산기</div><div style={{ fontSize: 12, color: C.textSub }}>2026년 수가 기준 · 5가지 서비스</div></div>
          <span style={{ color: C.textSub }}>→</span>
        </div>
      </Crd>

      <Crd onClick={() => go(STEPS.CHECKLIST)} style={{ cursor: "pointer", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>✅</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>좋은 요양보호사 찾는 법</div><div style={{ fontSize: 12, color: C.textSub }}>전문가 체크리스트 8가지</div></div>
          <span style={{ color: C.textSub }}>→</span>
        </div>
      </Crd>

      <Crd onClick={() => go(STEPS.FAMILY_CARE)} style={{ cursor: "pointer", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFF1F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👨‍👩‍👧</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>가족요양 가이드</div><div style={{ fontSize: 12, color: C.textSub }}>2026년 기준 · 조건 · 급여 · 신청방법</div></div>
          <span style={{ color: C.textSub }}>→</span>
        </div>
      </Crd>


      <div style={{ textAlign: "center", marginTop: 8, padding: 14, borderRadius: 10, background: C.primaryLight }}>
        <p style={{ fontSize: 12, color: C.primaryDark, margin: 0 }}><strong>현장 전문가가 설계</strong> · 2026년 수가 기준 반영</p>
      </div>
    </div>
  );

  // ═══ 사용자 정보 입력 (Google Sheets 연동) ═══
  const UserInfoPage = () => {
    const canSubmit = userInfo.name.trim() && userInfo.phone.trim() && userInfo.area.trim() && privacyAgreed && !submitting;

    const handleSubmit = async () => {
      if (!canSubmit) return;
      setSubmitting(true);
      // 검사 결과 계산
      const score = calcScore(basic, physical, social, cognition, behavior, nursing);
      const est = estimateGrade(score, basic);
      try {
        await fetch(SHEET_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            name: userInfo.name.trim(),
            phone: userInfo.phone.trim(),
            area: userInfo.area.trim(),
            score: score,
            grade: est.grade,
            submitAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
          }),
        });
      } catch (e) { /* no-cors는 항상 오류처럼 보임 - 정상 */ }
      setSubmitting(false);
      setSubmitDone(true);
      go(STEPS.CONSULT);
    };

    const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.border}`, fontSize: 16, fontFamily: F, outline: "none", boxSizing: "border-box" as const, background: C.card };

    return (<div><Hdr title="상담 신청" onBack={() => go(STEPS.RESULT)} /><div style={inner}>
      <div style={{ textAlign: "center", padding: "28px 0 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📞</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>등급 판정 이후 상담을 받고 싶으신 분은</h2>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: C.primary }}>정보를 입력해주세요</h2>
        <p style={{ fontSize: 14, color: C.textSub, margin: 0, lineHeight: 1.6 }}>전문 상담사가 직접 연락드립니다</p>
      </div>

      <Crd style={{ marginBottom: 12, marginTop: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>이름</label>
        <input value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} placeholder="예: 홍길동" style={inputStyle} />
      </Crd>

      <Crd style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>전화번호</label>
        <input value={userInfo.phone} onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })} placeholder="예: 010-1234-5678" type="tel" style={inputStyle} />
      </Crd>

      <Crd style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>지역 (시·구)</label>
        <input value={userInfo.area} onChange={(e) => setUserInfo({ ...userInfo, area: e.target.value })} placeholder="예: 성북구, 강북구, 수원시 등" style={inputStyle} />
      </Crd>

      <button onClick={() => setPrivacyAgreed(!privacyAgreed)} style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", padding: "14px 16px", marginBottom: 20, borderRadius: 12, border: privacyAgreed ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, background: privacyAgreed ? C.primaryLight : C.card, cursor: "pointer", fontFamily: F, textAlign: "left" }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, border: privacyAgreed ? "none" : `2px solid ${C.border}`, background: privacyAgreed ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          {privacyAgreed && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>개인정보 수집에 동의합니다</div>
          <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>
            수집 항목: 이름, 전화번호, 지역<br />
            수집 목적: 상담 연결 안내<br />
            보관 기간: 상담 완료 후 1년 이내 파기
          </div>
        </div>
      </button>

      <Btn disabled={!canSubmit} onClick={handleSubmit} v="accent">
        {submitting ? "전송 중..." : "상담 신청하기"}
      </Btn>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button onClick={() => go(STEPS.CONSULT)} style={{ background: "none", border: "none", fontSize: 13, color: C.textSub, cursor: "pointer", fontFamily: F, textDecoration: "underline" }}>
          입력 없이 직접 전화하기
        </button>
      </div>
    </div></div>);
  };

  // ═══ 기본정보 ═══
  const BasicInfo = () => {
    const done = basic.age && basic.livingAlone !== null;
    return (<div><Hdr title="기본 정보" onBack={resetAll} /><div style={inner}>
      <Prog current={1} total={6} label="STEP 1 · 기본정보" />
      <Crd style={{ marginBottom: 12, marginTop: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>어르신 연세</label>
        <input value={basic.age} onChange={(e) => setBasic({ ...basic, age: e.target.value })} placeholder="예: 78" type="number" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 16, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
      </Crd>
      <Crd style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 10 }}>거주 형태</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[["혼자 거주", true], ["가족과 동거", false]].map(([l, v]) => (
            <button key={String(v)} onClick={() => setBasic({ ...basic, livingAlone: v })} style={{ ...chip(basic.livingAlone === v), flex: 1 }}>{l}</button>
          ))}
        </div>
      </Crd>
      <Crd style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 10 }}>치매 관련</label>
        {[["dementiaDx", "병원에서 치매 진단받은 적 있음"], ["recentDementia", "최근 2년 안에 치매 검사·진료 받음"], ["wandering", "이유 없이 돌아다니거나 이상 행동 있음"]].map(([k, l]) => (
          <button key={k} onClick={() => setBasic({ ...basic, [k]: !basic[k] })} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 6, borderRadius: 10, border: basic[k] ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, background: basic[k] ? C.primaryLight : C.card, cursor: "pointer", fontFamily: F, fontSize: 14, color: C.text, fontWeight: basic[k] ? 600 : 400, textAlign: "left" }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, border: basic[k] ? "none" : `2px solid ${C.border}`, background: basic[k] ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{basic[k] && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}</div>{l}
          </button>
        ))}
      </Crd>
      <Btn disabled={!done} onClick={() => go(STEPS.PHYSICAL)}>다음: 신체기능 →</Btn>
    </div></div>);
  };

  // ═══ 3단계 선택 페이지 ═══
  const ThreeLevelPage = ({ title, stepNum, label, items, data, setData, prevStep, nextStepTarget, nextLabel }) => {
    const ok = items.every((it) => data[it.key] !== undefined);
    return (<div><Hdr title={title} onBack={() => go(prevStep)} /><div style={inner}><Prog current={stepNum} total={6} label={label} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {items.map((it) => (<Crd key={it.key} style={{ padding: 14 }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{it.label}</div><div style={{ display: "flex", gap: 6 }}>
          {[["indep","혼자 가능"],["partial","조금 도움"],["full","많이 도움"]].map(([val,lbl]) => (<button key={val} onClick={() => setData({...data,[it.key]:val})} style={{...chip(data[it.key]===val),flex:1,...(data[it.key]===val?{background:val==="full"?C.accent:val==="partial"?C.warn:C.primary}:{})}}>{lbl}</button>))}
        </div></Crd>))}
      </div><div style={{marginTop:20}}><Btn disabled={!ok} onClick={()=>go(nextStepTarget)}>다음: {nextLabel} →</Btn></div></div></div>);
  };

  // ═══ 예/아니오 페이지 ═══
  const YesNoPage = ({ title, stepNum, label, items, data, setData, prevStep, nextStepTarget, nextLabel }) => {
    const ok = items.every((it) => data[it.key] !== undefined);
    return (<div><Hdr title={title} onBack={() => go(prevStep)} /><div style={inner}><Prog current={stepNum} total={6} label={label} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {items.map((it) => (<Crd key={it.key} style={{ padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><span style={{ fontSize: 14, flex: 1 }}>{it.label}</span><div style={{ display: "flex", gap: 5 }}>
          {[["예",true],["아니오",false]].map(([l,val]) => (<button key={String(l)} onClick={() => setData({...data,[it.key]:val})} style={{...chip(data[it.key]===val),...(data[it.key]===val?{background:val?C.danger:C.primary}:{})}}>{l}</button>))}
        </div></div></Crd>))}
      </div><div style={{marginTop:20}}><Btn disabled={!ok} onClick={()=>go(nextStepTarget)}>다음: {nextLabel} →</Btn></div></div></div>);
  };

  // ═══ 간호처치 ═══
  const NursingPage = () => {
    const bools = nursingItems.slice(0,5), rehab = nursingItems.slice(5);
    const ok = bools.every(it=>nursing[it.key]!==undefined)&&rehab.every(it=>nursing[it.key]!==undefined);
    return (<div><Hdr title="의료·재활" onBack={()=>go(STEPS.BEHAVIOR)} /><div style={inner}><Prog current={6} total={6} label="STEP 6 · 마지막" />
      <p style={{fontSize:13,fontWeight:700,margin:"14px 0 8px"}}>간호처치</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {bools.map(it=>(<Crd key={it.key} style={{padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span style={{fontSize:14,flex:1}}>{it.label}</span><div style={{display:"flex",gap:5}}>
          {[["있음",true],["없음",false]].map(([l,val])=>(<button key={String(l)} onClick={()=>setNursing({...nursing,[it.key]:val})} style={{...chip(nursing[it.key]===val),...(nursing[it.key]===val?{background:val?C.accent:C.safe}:{})}}>{l}</button>))}
        </div></div></Crd>))}
      </div>
      <p style={{fontSize:13,fontWeight:700,margin:"20px 0 8px"}}>재활</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rehab.map(it=>(<Crd key={it.key} style={{padding:14}}><div style={{fontSize:14,fontWeight:600,marginBottom:10}}>{it.label}</div>
          {it.key==="jointLimit"?<div style={{display:"flex",gap:6}}>{[["있음",true],["없음",false]].map(([l,val])=>(<button key={String(l)} onClick={()=>setNursing({...nursing,[it.key]:val})} style={{...chip(nursing[it.key]===val),flex:1,...(nursing[it.key]===val?{background:C.accent}:{})}}>{l}</button>))}</div>
          :<div style={{display:"flex",gap:6}}>{[["정상","none"],["조금 불편","partial"],["많이 불편","full"]].map(([l,val])=>(<button key={val} onClick={()=>setNursing({...nursing,[it.key]:val})} style={{...chip(nursing[it.key]===val),flex:1,...(nursing[it.key]===val?{background:val==="full"?C.accent:val==="partial"?C.warn:C.primary}:{})}}>{l}</button>))}</div>}
        </Crd>))}
      </div>
      <div style={{marginTop:20}}><Btn disabled={!ok} onClick={()=>go(STEPS.RESULT)} v="accent">결과 확인</Btn></div>
    </div></div>);
  };

  // ═══ 결과 ═══
  const ResultPage = () => {
    const score=calcScore(basic,physical,social,cognition,behavior,nursing);
    const est=estimateGrade(score,basic);
    const ins=getInsights(basic,physical,cognition,behavior);
    const recs=[];
    if(basic.dementiaDx||basic.recentDementia){recs.push("병원에서 의사 소견서 받기");recs.push("치매 진료 기록 미리 챙기기");}
    if(est.grade!=="등급외"){recs.push("건강보험공단에 등급 신청하기");recs.push("평소 생활 모습 메모해두기");}else{recs.push("주민센터에서 '노인맞춤돌봄' 문의하기");}
    recs.push("전문가와 상담 받기");
    const icoT={info:"ℹ️",warn:"⚠️",plus:"✅"};const bgT={info:"#F0F9FF",warn:C.warnBg,plus:C.safeBg};
    return (<div><Hdr title="판별 결과" onBack={resetAll} /><div style={inner}>
      <div style={{textAlign:"center",padding:"36px 0 20px"}}><div style={{fontSize:48,marginBottom:8}}>{est.emoji}</div><div style={{display:"inline-block",padding:"8px 20px",borderRadius:24,background:est.color,color:"#fff",fontSize:18,fontWeight:800}}>{est.grade} 가능성</div><div style={{fontSize:13,color:C.textSub,marginTop:4}}>신뢰도: {est.conf}</div><div style={{fontSize:32,fontWeight:900,color:est.color,marginTop:10}}>{score}점</div></div>
      <Crd style={{marginBottom:12}}><div style={{fontSize:14,fontWeight:700,marginBottom:12}}>📊 분석</div>{ins.map((i,idx)=>(<div key={idx} style={{padding:"10px 12px",borderRadius:10,background:bgT[i.type],fontSize:13,marginBottom:6,display:"flex",gap:8}}><span>{icoT[i.type]}</span><span>{i.text}</span></div>))}</Crd>
      <Crd style={{marginBottom:12}}><div style={{fontSize:14,fontWeight:700,marginBottom:10}}>✅ 권장</div>{recs.map((r,i)=>(<div key={i} style={{padding:"5px 0",fontSize:13}}><span style={{color:C.primary,fontWeight:700}}>{i+1}.</span> {r}</div>))}</Crd>
      <div style={{margin:"12px 0",padding:14,borderRadius:10,background:C.accentLight,border:`1.5px solid ${C.accent}`}}><p style={{fontSize:11,color:C.textSub,margin:0,lineHeight:1.6}}>⚠️ 사전 예측입니다. 실제 판정은 공단 조사·의사소견서·등급판정위원회에 따라 다릅니다.</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}><Btn v="accent" onClick={()=>go(STEPS.USER_INFO)}>상담 신청하기</Btn><Btn v="outline" onClick={()=>go(STEPS.COST_CALC)}>비용 계산</Btn><Btn v="ghost" onClick={resetAll}>처음으로</Btn></div>
    </div></div>);
  };

  // ═══ 상담 ═══
  const ConsultPage = () => (<div><Hdr title="상담 연결" onBack={()=>go(STEPS.LANDING)} /><div style={inner}>
    <div style={{textAlign:"center",padding:"36px 0 20px"}}>
      <div style={{width:68,height:68,borderRadius:"50%",background:C.primaryLight,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><span style={{fontSize:32}}>👩‍⚕️</span></div>
      <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 6px"}}>전문 상담사가 도와드립니다</h2>
      <p style={{fontSize:14,color:C.textSub,margin:0}}>등급 신청부터 센터 매칭까지 무료 안내</p>
    </div>

    <a href="tel:010-8674-9831" style={{textDecoration:"none"}}>
      <Crd style={{cursor:"pointer",marginBottom:16,border:`2px solid ${C.primary}`,background:C.primaryLight}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:14,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>📞</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:C.primaryDark,fontWeight:600}}>전화 상담 · 탭하면 바로 연결</div>
            <div style={{fontSize:22,fontWeight:900,color:C.primary,letterSpacing:-0.5,marginTop:2}}>010-8674-9831</div>
            <div style={{fontSize:12,color:C.textSub,marginTop:2}}>평일 09:00 ~ 18:00 · 무료 상담</div>
          </div>
        </div>
      </Crd>
    </a>

    <div style={{padding:14,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:8}}>📌 이런 분들이 많이 문의하세요</div>
      <div style={{fontSize:13,color:C.textSub,lineHeight:1.7}}>
        • 부모님이 요양등급을 받을 수 있는지 궁금한 분<br />
        • 등급 신청 절차가 복잡해서 도움이 필요한 분<br />
        • 우리 지역에 어떤 센터가 있는지 알고 싶은 분<br />
        • 비용이 얼마나 드는지 정확히 알고 싶은 분
      </div>
    </div>

    {/* 제휴 센터 광고 */}
    <div style={{margin:"14px 0",borderRadius:12,border:`1.5px solid ${C.gold}`,background:`linear-gradient(135deg,${C.goldBg},#FFFEF8)`,overflow:"hidden"}}>
      <div style={{padding:"3px 12px",background:"linear-gradient(90deg,#A16207,#CA8A04)",display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#fff"}}>⭐ 추천 센터</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.8)"}}>제휴</span>
      </div>
      <div style={{padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:C.text}}>경기방문요양센터</div>
            <div style={{fontSize:12,color:C.textSub}}>경기 지역 방문요양 전문</div>
          </div>
          <span style={{fontSize:11,fontWeight:700,color:"#fff",background:C.primary,padding:"3px 8px",borderRadius:6,height:"fit-content"}}>A등급</span>
        </div>
        <div style={{fontSize:13,color:C.primaryDark,fontWeight:600,padding:"7px 10px",background:C.primaryLight,borderRadius:8,marginBottom:10}}>
          ✨ 친절한 요양보호사 · 꼼꼼한 케어
        </div>
        <a href="tel:010-8674-9831" style={{textDecoration:"none"}}>
          <button style={{width:"100%",padding:12,borderRadius:10,background:C.primary,color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:F}}>
            📞 010-8674-9831
          </button>
        </a>
      </div>
    </div>

    <Btn v="ghost" onClick={()=>go(STEPS.LANDING)}>처음으로</Btn>
  </div></div>);

  // ═══ 비용계산 ═══
  const CostCalcPage = () => {
    const sts=[{key:"visit",icon:"🏠",l:"방문요양센터",d:"집 방문"},{key:"daycare",icon:"☀️",l:"데이케어(주·야간보호)",d:"낮 센터"},{key:"shortStay",icon:"🛏️",l:"단기보호",d:"일시 입소"},{key:"facility",icon:"🏥",l:"요양원",d:"24시간 시설"},{key:"groupHome",icon:"🏡",l:"공동생활가정",d:"소규모 공동"}];
    const gl={"1":"1등급","2":"2등급","3":"3등급","4":"4등급","5":"5등급","cogn":"인지지원"};
    return (<div><Hdr title="비용 계산기" onBack={()=>{setCostType(null);go(STEPS.LANDING);}} /><div style={inner}>
      <span style={{display:"inline-block",padding:"4px 10px",borderRadius:6,background:C.accentLight,fontSize:11,fontWeight:700,color:C.accent,marginTop:16,marginBottom:16}}>2026년 공식 수가</span>
      <p style={{fontSize:14,fontWeight:700,margin:"0 0 10px"}}>서비스 유형</p>
      {sts.map(st=>(<Crd key={st.key} onClick={()=>{setCostType(st.key);setCostGrade(st.key==="facility"||st.key==="groupHome"?"1":"3");}} style={{padding:14,cursor:"pointer",marginBottom:8,border:costType===st.key?`2px solid ${C.primary}`:`1px solid ${C.border}`,background:costType===st.key?C.primaryLight:C.card}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:24}}>{st.icon}</span><div><div style={{fontSize:14,fontWeight:700}}>{st.l}</div><div style={{fontSize:12,color:C.textSub}}>{st.d}</div></div></div></Crd>))}
      {costType&&(<>
        <p style={{fontSize:14,fontWeight:700,margin:"16px 0 10px"}}>등급</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{(costType==="shortStay"||costType==="facility"||costType==="groupHome"?["1","2","3","4","5"]:["1","2","3","4","5","cogn"]).map(g=>(<button key={g} onClick={()=>setCostGrade(g)} style={chip(costGrade===g)}>{gl[g]}</button>))}</div>
        {costType==="visit"&&(<Crd style={{marginBottom:16}}>
          <p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>1회 시간</p><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>{visitCare.map((vc,i)=>(<button key={i} onClick={()=>setVisitIdx(i)} style={{...chip(visitIdx===i),fontSize:12}}>{vc.label}<br/><span style={{fontSize:11,fontWeight:400}}>{vc.fee.toLocaleString()}원</span></button>))}</div>
          <p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>한 달에 며칠 이용하시나요?</p><input value={visitDays} onChange={(e)=>setVisitDays(e.target.value.replace(/[^0-9]/g,""))} placeholder="예: 22" type="tel" style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:16,fontFamily:F,outline:"none",boxSizing:"border-box"}} /><div style={{fontSize:12,color:C.textSub,marginTop:6}}>보통 주 5일이면 22일, 주 3일이면 13일</div>
        </Crd>)}
        {costType==="daycare"&&(<Crd style={{marginBottom:16}}>
          <p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>1일 시간</p><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>{Object.entries(dayCareFees).map(([code,data])=>(<button key={code} onClick={()=>setDaycareTime(code)} style={{...chip(daycareTime===code),textAlign:"left",padding:"10px 14px"}}>{code} ({data.label}) — {(data[costGrade]||0).toLocaleString()}원</button>))}</div>
          <p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>한 달에 며칠 이용하시나요?</p><input value={daycareDays} onChange={(e)=>setDaycareDays(e.target.value.replace(/[^0-9]/g,""))} placeholder="예: 22" type="tel" style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:16,fontFamily:F,outline:"none",boxSizing:"border-box"}} /><div style={{fontSize:12,color:C.textSub,marginTop:6}}>보통 주 5일이면 22일, 주 3일이면 13일</div>
        </Crd>)}
        {costType==="shortStay"&&(<Crd style={{marginBottom:16}}><p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>며칠 이용하시나요?</p><input value={shortStayDays} onChange={(e)=>setShortStayDays(e.target.value.replace(/[^0-9]/g,""))} placeholder="예: 15" type="tel" style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:16,fontFamily:F,outline:"none",boxSizing:"border-box"}} /><div style={{fontSize:12,color:C.textSub,marginTop:6}}>보통 1~2주(7~15일) 이용</div></Crd>)}
        <Btn onClick={()=>go(STEPS.COST_RESULT)}>비용 계산하기</Btn>
      </>)}
    </div></div>);
  };

  // ═══ 비용 결과 ═══
  const CostResultPage = () => {
    let total=0,selfRate=0.15,selfPay=0,govPay=0,perDay=0,days=0,limitAmt=monthlyLimit[costGrade]||0,typeLabel="",bd=[];
    if(costType==="visit"){const vc=visitCare[visitIdx];days=parseInt(visitDays);perDay=vc.fee;total=perDay*days;if(total>limitAmt&&limitAmt>0)total=limitAmt;selfPay=Math.round(total*selfRate);govPay=total-selfPay;typeLabel=`방문요양 (${vc.label})`;bd=[{l:`1회 ${vc.code}`,v:`${perDay.toLocaleString()}원`},{l:`${days}일`,v:`${(perDay*days).toLocaleString()}원`},...(perDay*days>limitAmt&&limitAmt>0?[{l:"한도액 적용",v:`${limitAmt.toLocaleString()}원`,a:true}]:[])];
    }else if(costType==="daycare"){const dc=dayCareFees[daycareTime];days=parseInt(daycareDays);perDay=dc[costGrade]||dc["5"]||0;total=perDay*days;if(total>limitAmt&&limitAmt>0)total=limitAmt;selfPay=Math.round(total*selfRate);govPay=total-selfPay;typeLabel=`주·야간보호 (${dc.label})`;bd=[{l:`1일 ${daycareTime}`,v:`${perDay.toLocaleString()}원`},{l:`${days}일`,v:`${(perDay*days).toLocaleString()}원`}];
    }else if(costType==="shortStay"){days=parseInt(shortStayDays);perDay=shortStayFees[costGrade]||shortStayFees["3"];total=perDay*days;if(total>limitAmt&&limitAmt>0)total=limitAmt;selfPay=Math.round(total*selfRate);govPay=total-selfPay;typeLabel="단기보호";bd=[{l:`1일 ${costGrade}등급`,v:`${perDay.toLocaleString()}원`},{l:`${days}일`,v:`${total.toLocaleString()}원`}];
    }else if(costType==="facility"){selfRate=0.20;perDay=facilityFees[costGrade]||facilityFees["3"];const ds=facilitySelfs[costGrade]||facilitySelfs["3"];days=30;total=perDay*days;selfPay=ds*days;govPay=total-selfPay;typeLabel="노인요양시설";bd=[{l:"1일 수가",v:`${perDay.toLocaleString()}원`},{l:"1일 본인부담",v:`${ds.toLocaleString()}원`}];
    }else if(costType==="groupHome"){selfRate=0.20;perDay=groupHomeFees[costGrade]||groupHomeFees["3"];const ds=groupHomeSelfs[costGrade]||groupHomeSelfs["3"];days=30;total=perDay*days;selfPay=ds*days;govPay=total-selfPay;typeLabel="공동생활가정";bd=[{l:"1일 수가",v:`${perDay.toLocaleString()}원`},{l:"1일 본인부담",v:`${ds.toLocaleString()}원`}];}
    const isF=costType==="facility"||costType==="groupHome";
    return (<div><Hdr title="비용 결과" onBack={()=>go(STEPS.COST_CALC)} /><div style={inner}>
      <span style={{display:"inline-block",padding:"4px 10px",borderRadius:6,background:C.accentLight,fontSize:11,fontWeight:700,color:C.accent,marginTop:16,marginBottom:8}}>{typeLabel}</span>
      <div style={{textAlign:"center",padding:"16px 0 24px"}}><div style={{fontSize:12,color:C.textSub}}>월 본인부담금</div><div style={{fontSize:36,fontWeight:900,color:C.primary,margin:"4px 0"}}>{selfPay.toLocaleString()}원</div><div style={{fontSize:13,color:C.textSub}}>총 {total.toLocaleString()}원 · {isF?"20%":"15%"}</div></div>
      <Crd style={{marginBottom:12}}>{bd.map((b,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<bd.length-1?`1px solid ${C.border}`:"none",fontSize:14}}><span style={{color:b.a?C.accent:C.textSub}}>{b.l}</span><span style={{fontWeight:700,color:b.a?C.accent:C.text}}>{b.v}</span></div>))}
        <div style={{borderTop:`2px solid ${C.text}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:15}}><span style={{fontWeight:700}}>정부</span><span style={{color:C.primary,fontWeight:700}}>{govPay.toLocaleString()}원</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:15}}><span style={{fontWeight:800}}>본인</span><span style={{fontWeight:900,color:C.accent,fontSize:17}}>{selfPay.toLocaleString()}원</span></div>
      </Crd>
      <div style={{padding:12,borderRadius:8,background:C.primaryLight,marginBottom:12}}><p style={{fontSize:12,color:C.primaryDark,margin:0,lineHeight:1.5}}>{isF?<><strong>시설급여</strong> 본인부담 20%. 기초수급·차상위 감면/면제.</>:<><strong>월 한도액:</strong> {limitAmt.toLocaleString()}원. 기초수급·차상위 감면.</>}</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}><Btn v="accent" onClick={()=>go(STEPS.CONSULT)}>상담 받기</Btn><Btn v="outline" onClick={()=>go(STEPS.COST_CALC)}>다른 계산</Btn><Btn v="ghost" onClick={()=>go(STEPS.LANDING)}>처음으로</Btn></div>
    </div></div>);
  };

  // ═══ 체크리스트 ═══
  const ChecklistPage = () => {
    const cats = ["센터 확인", "요양보호사", "비용", "서비스", "긴급상황"];
    return (<div><Hdr title="좋은 요양보호사 찾는 법" onBack={()=>go(STEPS.LANDING)} /><div style={inner}>
      <p style={{ fontSize: 14, color: C.textSub, margin: "16px 0 8px", lineHeight: 1.6 }}>
        센터에 전화하거나 방문할 때 아래 항목을 하나씩 확인하세요.<br />
        <strong style={{ color: C.text }}>체크 안 된 항목이 많을수록 주의가 필요합니다.</strong>
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: C.primaryLight, color: C.primary, fontWeight: 600 }}>✓ {checkedItems.length}/{checklistItems.length} 확인 완료</span>
        {checkedItems.length === checklistItems.length && <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: C.safeBg, color: C.safe, fontWeight: 600 }}>모두 확인 완료!</span>}
      </div>

      {cats.map(cat => {
        const items = checklistItems.map((it, i) => ({ ...it, idx: i })).filter(it => it.cat === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 8, padding: "4px 0", borderBottom: `2px solid ${C.primaryLight}` }}>{cat}</div>
            {items.map(it => {
              const chk = checkedItems.includes(it.idx);
              return (
                <Crd key={it.idx} onClick={() => setCheckedItems(chk ? checkedItems.filter(x => x !== it.idx) : [...checkedItems, it.idx])} style={{ padding: 14, cursor: "pointer", marginBottom: 8, border: chk ? `2px solid ${C.primary}` : `1px solid ${C.border}`, background: chk ? C.primaryLight : C.card }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: chk ? "none" : `2px solid ${C.border}`, background: chk ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{chk && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{it.t}</div>
                      <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 8 }}>{it.d}</div>
                      <div style={{ fontSize: 12, padding: "8px 10px", borderRadius: 8, background: "#F0F9FF", color: "#1E40AF", marginBottom: 6, lineHeight: 1.5 }}>
                        💬 이렇게 물어보세요: <strong>{it.how}</strong>
                      </div>
                      <div style={{ fontSize: 12, padding: "8px 10px", borderRadius: 8, background: C.dangerBg, color: C.danger, lineHeight: 1.5 }}>
                        🚨 위험 신호: {it.flag}
                      </div>
                    </div>
                  </div>
                </Crd>
              );
            })}
          </div>
        );
      })}

      <Crd style={{ background: C.warnBg, border: `1px solid ${C.warn}`, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.warn, marginBottom: 6 }}>⚠️ 이런 센터는 피하세요</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          계약서를 안 쓰려는 센터, 평가등급을 안 알려주는 센터, 요양보호사 정보를 미리 안 알려주는 센터, 본인부담금 외 현금을 요구하는 센터, 서비스 시간을 자주 어기는 센터
        </div>
      </Crd>

      <Crd style={{ background: C.primaryLight, border: "none", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.primaryDark, marginBottom: 6 }}>💡 꼭 기억하세요</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          첫 센터가 마음에 안 들면 언제든 바꿀 수 있습니다. 최소 2~3곳을 비교한 뒤 결정하세요. 어르신과 요양보호사의 궁합이 가장 중요합니다.
        </div>
      </Crd>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn v="accent" onClick={() => go(STEPS.CONSULT)}>전문가에게 직접 상담하기</Btn>
        <Btn v="ghost" onClick={() => go(STEPS.LANDING)}>처음으로</Btn>
      </div>
    </div></div>);
  };

  // ═══ 가족요양 가이드 ═══
  const FamilyCarePage = () => {
    const sections = [
      { title: "가족요양이란?", icon: "📖", content: "장기요양등급을 받은 가족을 요양보호사 자격증이 있는 가족이 직접 돌보면서 급여를 받는 제도입니다. 부모님을 직접 모시면서 정부에서 돈을 받을 수 있습니다." },
      { title: "신청 조건 3가지", icon: "📋", items: [
        { label: "1. 등급 인정", desc: "어르신이 장기요양 1~5등급 또는 인지지원등급을 받아야 합니다" },
        { label: "2. 자격증 보유", desc: "돌보는 가족이 요양보호사 자격증을 가지고 있어야 합니다" },
        { label: "3. 근무시간 제한", desc: "가족요양 외 다른 일의 근무시간이 월 160시간 미만이어야 합니다" },
      ]},
      { title: "가족의 범위", icon: "👨‍👩‍👧‍👦", content: "배우자, 직계혈족(부모·자녀), 형제자매, 직계혈족의 배우자(며느리·사위), 배우자의 직계혈족(시부모·장인장모), 배우자의 형제자매가 해당됩니다." },
      { title: "2026년 가족요양 급여", icon: "💰", items: [
        { label: "60분 가족요양", desc: "1일 21,000원 × 월 최대 20일 = 월 최대 420,000원" },
        { label: "90분 가족요양", desc: "1일 31,000원 × 월 최대 31일 = 월 최대 961,000원" },
      ]},
      { title: "90분 인정받는 조건", icon: "⭐", content: "아래 중 하나에 해당하면 60분이 아닌 90분으로 인정됩니다.", items: [
        { label: "조건 1", desc: "65세 이상 요양보호사가 배우자를 돌보는 경우" },
        { label: "조건 2+3 동시", desc: "치매 진단/진료 이력이 있고 + 폭력성향, 피해망상, 부적절한 성적 행동 중 하나 이상 해당" },
      ]},
      { title: "신청 절차", icon: "🔄", items: [
        { label: "① 자격증 취득", desc: "요양보호사 교육기관에서 자격증 취득 (가족 과정 약 40시간)" },
        { label: "② 센터 등록", desc: "재가방문요양센터에 요양보호사로 등록" },
        { label: "③ 서비스 제공", desc: "가족에게 방문요양 서비스 제공 시작" },
        { label: "④ 급여 수령", desc: "공단 → 센터 → 사회보험 공제 후 본인에게 지급" },
      ]},
      { title: "주의사항", icon: "⚠️", items: [
        { label: "직접 지급 아님", desc: "급여는 재가요양센터를 통해 지급됩니다. 공단에서 직접 받는 게 아닙니다." },
        { label: "초과 인정 안 됨", desc: "60분 기준일 때 더 오래 돌봐도 60분만 인정됩니다" },
        { label: "사회보험 공제", desc: "고용보험료 등이 공제되어 실수령액은 약간 줄어듭니다" },
        { label: "의료행위 불가", desc: "주사, 투약 등 의료행위는 가족요양에 포함되지 않습니다" },
      ]},
    ];

    return (<div><Hdr title="가족요양 가이드" onBack={() => go(STEPS.LANDING)} /><div style={inner}>
      <div style={{ padding: "4px 10px", borderRadius: 6, background: C.accentLight, display: "inline-block", marginTop: 16, marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>2026년 기준</span>
      </div>

      {sections.map((sec, si) => (
        <Crd key={si} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>{sec.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{sec.title}</span>
          </div>
          {sec.content && <p style={{ fontSize: 14, color: C.text, margin: "0 0 10px", lineHeight: 1.7 }}>{sec.content}</p>}
          {sec.items && sec.items.map((item, ii) => (
            <div key={ii} style={{ padding: "10px 12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </Crd>
      ))}

      <Crd style={{ background: C.primaryLight, border: "none", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.primaryDark, marginBottom: 6 }}>💡 이런 분께 추천합니다</div>
        <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.7 }}>
          부모님을 직접 모시고 있는 분, 요양보호사 자격증을 취득했거나 취득 예정인 분, 직장을 다니면서 부모님도 돌보고 싶은 분 (월 160시간 미만 근무 조건)
        </p>
      </Crd>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn v="accent" onClick={() => go(STEPS.CONSULT)}>가족요양 상담 받기</Btn>
        <Btn v="outline" onClick={() => go(STEPS.BASIC_INFO)}>우리 부모님 등급 확인하기</Btn>
        <Btn v="ghost" onClick={() => go(STEPS.LANDING)}>처음으로</Btn>
      </div>
    </div></div>);
  };

  // ═══ 렌더 ═══
  return (
    <div ref={ref} style={{ fontFamily: F, background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      {step === STEPS.LANDING && <Landing />}
      {step === STEPS.USER_INFO && <UserInfoPage />}
      {step === STEPS.BASIC_INFO && <BasicInfo />}
      {step === STEPS.PHYSICAL && <ThreeLevelPage title="몸 움직임" stepNum={2} label="STEP 2 · 몸 움직임 (13)" items={physicalItems} data={physical} setData={setPhysical} prevStep={STEPS.BASIC_INFO} nextStepTarget={STEPS.SOCIAL} nextLabel="집안·바깥 활동" />}
      {step === STEPS.SOCIAL && <ThreeLevelPage title="집안·바깥 활동" stepNum={3} label="STEP 3 · 집안·바깥 (10)" items={socialItems} data={social} setData={setSocial} prevStep={STEPS.PHYSICAL} nextStepTarget={STEPS.COGNITION} nextLabel="기억·판단력" />}
      {step === STEPS.COGNITION && <YesNoPage title="기억·판단력" stepNum={4} label="STEP 4 · 기억력 (10)" items={cognitionItems} data={cognition} setData={setCognition} prevStep={STEPS.SOCIAL} nextStepTarget={STEPS.BEHAVIOR} nextLabel="이상 행동" />}
      {step === STEPS.BEHAVIOR && <YesNoPage title="이상 행동" stepNum={5} label="STEP 5 · 이상 행동 (10)" items={behaviorItems} data={behavior} setData={setBehavior} prevStep={STEPS.COGNITION} nextStepTarget={STEPS.NURSING} nextLabel="의료·재활" />}
      {step === STEPS.NURSING && <NursingPage />}
      {step === STEPS.RESULT && <ResultPage />}
      {step === STEPS.CONSULT && <ConsultPage />}
      {step === STEPS.COST_CALC && <CostCalcPage />}
      {step === STEPS.COST_RESULT && <CostResultPage />}
      {step === STEPS.CHECKLIST && <ChecklistPage />}
      {step === STEPS.FAMILY_CARE && <FamilyCarePage />}
    </div>
  );
}
