"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════
// 우리엄빠 - 우리 엄마 아빠 괜찮을까?
// ═══════════════════════════════════════════════════

// ⚠️ 카카오 개발자센터(developers.kakao.com)에서 발급받은 JavaScript 키를 입력하세요
const KAKAO_JS_KEY = "YOUR_KAKAO_JS_KEY";
// ⚠️ 배포 후 실제 도메인으로 변경하세요
const SITE_URL = "https://uri-umbba.com";

const TABS = { HOME: "home", DAILY: "daily", COMMUNITY: "community" };

const STEPS = {
  LANDING: 0, BASIC_INFO: 1, PHYSICAL: 2, SOCIAL: 3, COGNITION: 4, BEHAVIOR: 5, NURSING: 6,
  RESULT: 7, CONSULT: 8, INTERSTITIAL: 9, COST_CALC: 10, COST_RESULT: 11,
  CHECKLIST: 12, AREA_CHECK: 13, AREA_RESULT: 14,
};

// ── 2026 수가 ──
const monthlyLimit = { "1": 1520700, "2": 1351700, "3": 1295400, "4": 1189800, "5": 1021300, "cogn": 573900 };
const visitCare = [
  { code: "가-1", label: "30분", minutes: 30, fee: 14750 }, { code: "가-2", label: "60분", minutes: 60, fee: 22640 },
  { code: "가-3", label: "90분", minutes: 90, fee: 30370 }, { code: "가-4", label: "120분", minutes: 120, fee: 39340 },
  { code: "가-5", label: "150분", minutes: 150, fee: 43570 }, { code: "가-6", label: "180분", minutes: 180, fee: 48170 },
  { code: "가-7", label: "210분", minutes: 210, fee: 52400 }, { code: "가-8", label: "240분", minutes: 240, fee: 56320 },
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

// ── Assessment Items ──
const physicalItems = [
  { key: "dressing", label: "옷 벗고 입기" }, { key: "washFace", label: "세수하기" }, { key: "brushTeeth", label: "양치질" },
  { key: "bathing", label: "목욕하기" }, { key: "eating", label: "식사하기" }, { key: "posChange", label: "체위변경" },
  { key: "sitStand", label: "일어나 앉기" }, { key: "transfer", label: "옮겨 앉기" }, { key: "goOutRoom", label: "방 밖으로 나오기" },
  { key: "toiletUse", label: "화장실 사용" }, { key: "bowelCtrl", label: "대변 조절" }, { key: "urineCtrl", label: "소변 조절" },
  { key: "hairWash", label: "머리 감기" },
];
const socialItems = [
  { key: "housekeep", label: "집안일" }, { key: "mealPrep", label: "식사 준비" }, { key: "laundry", label: "빨래" },
  { key: "moneyMgmt", label: "금전 관리" }, { key: "shopping", label: "물건 사기" }, { key: "phoneUse", label: "전화 사용" },
  { key: "transport", label: "교통수단 이용" }, { key: "goingOut", label: "근거리 외출" }, { key: "grooming", label: "몸단장" },
  { key: "medMgmt", label: "약 챙겨 먹기" },
];
const cognitionItems = [
  { key: "forgetRecent", label: "방금 들은 이야기를 잊음" }, { key: "notKnowDate", label: "오늘 날짜를 모름" },
  { key: "notKnowPlace", label: "장소를 모름" }, { key: "notKnowAge", label: "나이/생일 모름" },
  { key: "cantFollowInst", label: "지시 이해 어려움" }, { key: "poorJudge", label: "판단력 저하" },
  { key: "commProblem", label: "의사소통 어려움" }, { key: "cantCalc", label: "계산 불가" },
  { key: "cantRoutine", label: "일과 이해 어려움" }, { key: "cantRecogFamily", label: "가족 못 알아봄" },
];
const behaviorItems = [
  { key: "delusion", label: "망상" }, { key: "hallucin", label: "환각" }, { key: "depression", label: "우울" },
  { key: "sleepIssue", label: "수면 문제" }, { key: "resistCare", label: "간병 거부" }, { key: "restless", label: "안절부절" },
  { key: "wandering", label: "배회" }, { key: "aggression", label: "폭언·폭행" },
  { key: "triesGoOut", label: "밖으로 나가려 함" }, { key: "inapprop", label: "부적절 행동" },
];
const nursingItems = [
  { key: "suction", label: "흡인" }, { key: "oxygen", label: "산소요법" }, { key: "soreCare", label: "욕창간호" },
  { key: "tubeFeeding", label: "경관영양" }, { key: "catheter", label: "도뇨/장루" },
  { key: "upperLimb", label: "상지 운동장애" }, { key: "lowerLimb", label: "하지 운동장애" }, { key: "jointLimit", label: "관절 제한" },
];

// ── Daily Content: AI 추천 명언 (60개+ 풀, 매일 셔플) ──
const dailyQuotes = [
  { emoji: "🌅", text: "삶이 있는 한 희망은 있다.", author: "키케로", category: "희망" },
  { emoji: "🌿", text: "가장 큰 영광은 한 번도 넘어지지 않는 것이\n아니라, 넘어질 때마다 일어서는 것이다.", author: "공자", category: "용기" },
  { emoji: "💛", text: "사랑하는 것은 천국을 살짝\n엿보는 것이다.", author: "카렌 선드", category: "사랑" },
  { emoji: "🌸", text: "인생에서 가장 행복한 것은\n누군가를 사랑하고 있다는 확신이다.", author: "빅토르 위고", category: "사랑" },
  { emoji: "☀️", text: "오늘 할 수 있는 일에\n최선을 다하라.\n그러면 내일은 한 걸음 더\n나아갈 수 있다.", author: "아이작 뉴턴", category: "노력" },
  { emoji: "🍀", text: "행복은 습관이다.\n그것을 몸에 지니라.", author: "허버트", category: "행복" },
  { emoji: "🌻", text: "세상에서 가장 아름다운 것은\n보이지도 만져지지도 않는다.\n다만 가슴으로 느끼는 것이다.", author: "헬렌 켈러", category: "감동" },
  { emoji: "🌙", text: "천 리 길도 한 걸음부터.", author: "노자", category: "지혜" },
  { emoji: "🔥", text: "고통이 남기고 간 뒤를 보라.\n고통이 지나면 반드시 기쁨이 온다.", author: "괴테", category: "위로" },
  { emoji: "🌈", text: "부모를 공경하는 것은\n인간의 가장 아름다운 의무이다.", author: "소포클레스", category: "효도" },
  { emoji: "⭐", text: "작은 기회로부터 종종\n위대한 업적이 시작된다.", author: "데모스테네스", category: "기회" },
  { emoji: "🕊️", text: "사람의 됨됨이는 곤경에 처했을 때\n비로소 알 수 있다.", author: "에픽테토스", category: "인격" },
  { emoji: "🌊", text: "배움에는 왕도가 없다.", author: "유클리드", category: "배움" },
  { emoji: "💎", text: "가족은 자연이 준 걸작이다.", author: "조지 산타야나", category: "가족" },
  { emoji: "🎋", text: "효도는 백 가지 행실의 근본이다.", author: "효경", category: "효도" },
  { emoji: "🌤️", text: "웃으면 온 세상이 함께 웃고,\n울면 혼자 운다.", author: "엘라 휠러 윌콕스", category: "긍정" },
  { emoji: "🏔️", text: "나이는 단지 숫자일 뿐이다.\n인생은 크기가 아니라 깊이로\n측정해야 한다.", author: "테니슨", category: "지혜" },
  { emoji: "🌺", text: "사랑을 주는 것은\n그 자체로 받는 것이다.", author: "엘리자베스 비베스코", category: "사랑" },
  { emoji: "📖", text: "지금 이 순간을 살아라.\n어제는 역사이고 내일은 미스터리다.\n오늘은 선물이다.", author: "엘리너 루즈벨트", category: "현재" },
  { emoji: "🌱", text: "가장 어두운 밤도 끝나고\n태양은 반드시 떠오른다.", author: "빅토르 위고", category: "희망" },
  { emoji: "💐", text: "감사할 줄 아는 사람에게는\n더 많은 것이 주어진다.", author: "오프라 윈프리", category: "감사" },
  { emoji: "🦅", text: "실패는 성공의 어머니다.", author: "토마스 에디슨", category: "도전" },
  { emoji: "🌠", text: "꿈을 꿀 수 있다면\n이룰 수도 있다.", author: "월트 디즈니", category: "꿈" },
  { emoji: "🎯", text: "남을 아는 사람은 지혜롭고\n자기를 아는 사람은 현명하다.", author: "노자", category: "지혜" },
  { emoji: "🕯️", text: "어둠을 저주하기보다\n촛불 하나를 켜라.", author: "엘리너 루즈벨트", category: "실천" },
  { emoji: "🏠", text: "집이란 돌아갈 수 있는\n따뜻한 곳이 있다는 것이다.", author: "로버트 프로스트", category: "가족" },
  { emoji: "🍂", text: "삶은 가까이서 보면 비극이고\n멀리서 보면 희극이다.", author: "찰리 채플린", category: "인생" },
  { emoji: "💪", text: "강한 사람이 이기는 것이 아니라\n이기는 사람이 강한 것이다.", author: "프란츠 베켄바워", category: "강인" },
  { emoji: "🌳", text: "나무를 심기 가장 좋은 때는\n20년 전이었다.\n두 번째로 좋은 때는 바로 지금이다.", author: "중국 속담", category: "시작" },
  { emoji: "🎵", text: "음악은 영혼의 언어다.", author: "칼릴 지브란", category: "감성" },
  { emoji: "🧭", text: "목적지를 모르면\n어떤 바람도 순풍이 아니다.", author: "세네카", category: "목표" },
  { emoji: "🌞", text: "매일 아침은 새로운 시작이다.", author: "T.S. 엘리엇", category: "시작" },
  { emoji: "🦋", text: "변화 없이는 발전도 없다.\n자기 생각을 바꾸지 못하는 사람은\n아무것도 바꿀 수 없다.", author: "버나드 쇼", category: "변화" },
  { emoji: "📚", text: "아는 것이 힘이다.", author: "프랜시스 베이컨", category: "지식" },
  { emoji: "🤝", text: "혼자 가면 빨리 가고\n함께 가면 멀리 간다.", author: "아프리카 속담", category: "함께" },
  { emoji: "🌷", text: "인내는 쓰지만\n그 열매는 달다.", author: "장 자크 루소", category: "인내" },
  { emoji: "⛰️", text: "산이 높다 하되\n하늘 아래 뫼이로다.\n오르고 또 오르면\n못 오를 리 없건마는.", author: "양사언", category: "도전" },
  { emoji: "🌾", text: "씨를 뿌리지 않으면\n거둘 것도 없다.", author: "성경", category: "노력" },
  { emoji: "🎭", text: "인생은 짧고 예술은 길다.", author: "히포크라테스", category: "인생" },
  { emoji: "🔑", text: "성공의 비결은\n아직 자리에서 일어나지 못한 사람을\n일으켜 세우는 것이다.", author: "부커 T. 워싱턴", category: "봉사" },
  { emoji: "🧡", text: "세상에서 가장 좋은 치료법은\n누군가에게 사랑받고 있다는\n느낌을 주는 것이다.", author: "마더 테레사", category: "사랑" },
  { emoji: "🎪", text: "즐기면서 하는 일이\n최고의 결과를 만든다.", author: "마크 트웨인", category: "즐거움" },
  { emoji: "💫", text: "오늘 하루가 선물이라고\n생각하면 감사할 일이\n넘쳐난다.", author: "무명", category: "감사" },
  { emoji: "🌍", text: "세상을 바꾸고 싶다면\n먼저 자신이 변해야 한다.", author: "마하트마 간디", category: "변화" },
  { emoji: "🪴", text: "작은 친절이\n큰 차이를 만든다.", author: "이솝", category: "친절" },
  { emoji: "🌐", text: "교육은 세상을 바꿀 수 있는\n가장 강력한 무기다.", author: "넬슨 만델라", category: "교육" },
  { emoji: "🕰️", text: "시간은 가장 현명한\n상담자이다.", author: "페리클레스", category: "시간" },
  { emoji: "🎨", text: "상상력은 지식보다\n더 중요하다.", author: "알버트 아인슈타인", category: "상상" },
  { emoji: "🦢", text: "진정한 아름다움은\n마음에서 나온다.", author: "코코 샤넬", category: "아름다움" },
  { emoji: "🏆", text: "승리는 가장 끈기 있는 자에게\n돌아간다.", author: "나폴레옹", category: "끈기" },
  { emoji: "🌬️", text: "바람이 불지 않으면\n노를 저어라.", author: "라틴 속담", category: "실천" },
  { emoji: "🫶", text: "사랑하지 않는 삶은\n살아 있는 것이 아니다.", author: "몰리에르", category: "사랑" },
  { emoji: "🏡", text: "부모님의 은혜는\n하늘보다 높고\n바다보다 깊다.", author: "한국 속담", category: "효도" },
  { emoji: "🌝", text: "웃음은 마음의 조깅이다.", author: "윌리엄 프라이", category: "행복" },
  { emoji: "📝", text: "글을 쓰는 것은\n자기 영혼의 피를\n보는 것이다.", author: "막스 르레", category: "성찰" },
  { emoji: "🌄", text: "끝이라고 생각하는 곳이\n바로 새로운 시작점이다.", author: "윈스턴 처칠", category: "희망" },
  { emoji: "🍵", text: "잠깐 멈추는 것도\n용기이다.", author: "무명", category: "쉼" },
  { emoji: "🐢", text: "느리더라도 멈추지 않으면\n반드시 도착한다.", author: "이솝", category: "인내" },
  { emoji: "🌹", text: "가시 없는 장미는 없다.\n하지만 향기는 가시를 넘어선다.", author: "무명", category: "극복" },
  { emoji: "✈️", text: "모든 위대한 여행은\n한 걸음에서 시작된다.", author: "노자", category: "시작" },
];

const dailyHealthTips = [
  { emoji: "💊", title: "약 복용 시간 알림", tip: "정해진 시간에 약을 드시도록 알람을 설정해두세요. 식후 30분이 가장 효과적인 약이 많습니다." },
  { emoji: "🥗", title: "어르신 식사 가이드", tip: "단백질(두부, 달걀, 생선)을 매끼 포함하면 근감소 예방에 도움됩니다." },
  { emoji: "🚶", title: "낙상 예방 체크", tip: "실내 문턱 제거, 화장실 미끄럼 방지 매트, 야간 조명을 꼭 확인하세요." },
  { emoji: "🧠", title: "인지기능 유지", tip: "매일 10분 신문 읽기, 간단한 계산, 옛날 사진 보며 대화하기가 효과적입니다." },
  { emoji: "😴", title: "수면 건강", tip: "낮잠은 30분 이내, 저녁 카페인을 피하고 규칙적인 취침 시간을 유지하세요." },
  { emoji: "🦷", title: "구강 건강", tip: "틀니는 매일 세척하고 밤에 빼두세요. 구강 건강이 전신 건강과 직결됩니다." },
  { emoji: "💧", title: "수분 섭취", tip: "어르신은 갈증을 잘 못 느끼십니다. 하루 6~8잔 물을 시간별로 나눠 드세요." },
  { emoji: "🧘", title: "스트레칭", tip: "아침 기상 후 5분 스트레칭은 관절 유연성과 혈액순환에 큰 도움이 됩니다." },
  { emoji: "🫀", title: "혈압 관리", tip: "아침 기상 직후와 저녁 식사 전, 하루 2번 혈압 측정을 습관화하세요." },
  { emoji: "👁️", title: "눈 건강", tip: "TV 시청 시 1시간마다 10분 휴식. 밝은 곳에서 책을 읽도록 환경을 만들어주세요." },
  { emoji: "🦶", title: "발 건강 체크", tip: "당뇨가 있으시다면 매일 발을 확인하세요. 작은 상처도 빨리 치료하는 게 중요합니다." },
  { emoji: "🧴", title: "피부 관리", tip: "건조한 계절에는 보습제를 충분히 바르고, 욕실 온도는 미지근하게 유지하세요." },
  { emoji: "🏋️", title: "근력 운동", tip: "의자에 앉았다 일어서기 10회 × 3세트가 하지 근력 유지에 가장 좋습니다." },
  { emoji: "🥛", title: "칼슘 섭취", tip: "우유, 치즈, 멸치, 두부로 하루 칼슘 800mg을 채우면 골다공증 예방에 도움됩니다." },
  { emoji: "🌡️", title: "실내 온도", tip: "겨울철 실내 온도 22~24도, 습도 50~60%가 어르신에게 가장 쾌적합니다." },
  { emoji: "📱", title: "긴급 연락", tip: "어르신 폰에 긴급 연락처 단축번호를 설정하고, 위치 공유 기능을 켜두세요." },
  { emoji: "🧤", title: "한파 대비", tip: "외출 시 목도리·장갑·모자를 꼭 착용하세요. 체온이 1도만 떨어져도 면역력이 30% 감소합니다." },
  { emoji: "🍌", title: "변비 예방", tip: "식이섬유가 풍부한 바나나, 고구마, 채소를 매끼 포함하고 물을 충분히 드세요." },
  { emoji: "🎯", title: "보호자 건강", tip: "돌보는 사람도 건강해야 합니다. 주 1회 자신만의 휴식 시간을 꼭 확보하세요." },
  { emoji: "🧊", title: "열사병 예방", tip: "여름철 오전 11시~오후 3시 외출을 피하고, 외출 시 모자와 물을 꼭 챙기세요." },
  { emoji: "🫁", title: "호흡기 관리", tip: "미세먼지가 나쁜 날은 외출을 삼가고, 실내 환기는 오후 2~4시에 하세요." },
];

const dailyFortunes = [
  { fortune: "오늘은 가족과의 소통이 빛나는 날입니다. 안부 전화 한 통이 큰 힘이 됩니다.", lucky: "행운색: 초록 | 행운숫자: 3, 7" },
  { fortune: "건강에 좋은 소식이 있을 수 있습니다. 긍정적인 마음으로 시작하세요.", lucky: "행운색: 노랑 | 행운숫자: 5, 8" },
  { fortune: "오래 고민하던 문제에 실마리가 보입니다. 주변 조언에 귀 기울여보세요.", lucky: "행운색: 파랑 | 행운숫자: 2, 9" },
  { fortune: "작은 변화가 큰 차이를 만드는 날입니다. 산책을 함께해보세요.", lucky: "행운색: 분홍 | 행운숫자: 1, 6" },
  { fortune: "마음이 편안해지는 날입니다. 자신을 위한 작은 선물도 괜찮아요.", lucky: "행운색: 보라 | 행운숫자: 4, 7" },
  { fortune: "재정적으로 좋은 기회가 올 수 있습니다. 복지 혜택을 확인해보세요.", lucky: "행운색: 금색 | 행운숫자: 8, 3" },
  { fortune: "가까운 사람에게 감사를 전하세요. 작은 말 한마디가 큰 위로가 됩니다.", lucky: "행운색: 주황 | 행운숫자: 6, 2" },
  { fortune: "새로운 만남이 기다리고 있습니다. 열린 마음으로 대하세요.", lucky: "행운색: 하늘 | 행운숫자: 1, 4" },
  { fortune: "오늘은 결단을 내리기 좋은 날입니다. 미루지 마세요.", lucky: "행운색: 빨강 | 행운숫자: 9, 5" },
  { fortune: "지혜로운 선택이 빛나는 날입니다. 직감을 믿으세요.", lucky: "행운색: 은색 | 행운숫자: 7, 2" },
  { fortune: "오래된 친구에게서 좋은 소식이 올 수 있습니다.", lucky: "행운색: 연두 | 행운숫자: 3, 6" },
  { fortune: "건강을 챙기기 딱 좋은 날입니다. 가벼운 운동을 시작해보세요.", lucky: "행운색: 민트 | 행운숫자: 2, 8" },
  { fortune: "예상치 못한 행운이 찾아올 수 있습니다. 마음을 열어두세요.", lucky: "행운색: 금색 | 행운숫자: 5, 1" },
  { fortune: "가족과 함께하는 식사가 큰 행복을 줍니다. 오늘 같이 밥 한 끼 어떨까요?", lucky: "행운색: 주황 | 행운숫자: 4, 9" },
  { fortune: "마음속 걱정을 누군가와 나누면 반으로 줄어듭니다.", lucky: "행운색: 라벤더 | 행운숫자: 6, 3" },
  { fortune: "인내의 열매가 맺히는 날입니다. 포기하지 마세요.", lucky: "행운색: 갈색 | 행운숫자: 8, 1" },
  { fortune: "웃음이 가득한 하루가 됩니다. 좋은 일이 연달아 생길 수 있어요.", lucky: "행운색: 노랑 | 행운숫자: 7, 4" },
  { fortune: "조용한 시간이 필요한 날입니다. 혼자만의 여유를 즐기세요.", lucky: "행운색: 남색 | 행운숫자: 2, 5" },
  { fortune: "누군가를 도와주는 일이 나에게도 큰 기쁨이 되는 날입니다.", lucky: "행운색: 초록 | 행운숫자: 9, 6" },
  { fortune: "오래 묵혀둔 계획을 실행하기 좋은 타이밍입니다.", lucky: "행운색: 터키석 | 행운숫자: 3, 8" },
  { fortune: "부모님의 미소가 오늘 하루를 환하게 밝혀줍니다.", lucky: "행운색: 분홍 | 행운숫자: 1, 7" },
];

// Community mock data
const communityPosts = [
  { id: 1, user: "희망맘", isMine: false, time: "2시간 전", text: "아버지 요양등급 3등급 받았어요. 걱정 많았는데 여기 앱으로 미리 확인해봐서 마음의 준비가 됐습니다. 같은 상황이신 분들 힘내세요! 💪", likes: 24, comments: 8, liked: false },
  { id: 2, user: "효자아들", isMine: false, time: "5시간 전", text: "어머니 치매 진단 받고 1년... 매일 같은 말씀 반복하셔도 처음 듣는 것처럼 대답하려고 노력 중입니다. 오늘 글귀 보고 울컥했네요 😢", likes: 47, comments: 15, liked: false },
  { id: 3, user: "둘째딸", isMine: false, time: "어제", text: "데이케어센터 보내드리기 시작했는데 아버지가 좋아하세요! 처음엔 거부하셨는데 지금은 매일 가자고 하십니다 ㅎㅎ", likes: 31, comments: 12, liked: false },
  { id: 4, user: "간병18년차", isMine: false, time: "어제", text: "요양보호사 선생님 교체하고 나서 어머니 표정이 확 밝아지셨어요. 맞는 분 찾는 게 정말 중요하다는 걸 느꼈습니다.", likes: 19, comments: 6, liked: false },
  { id: 5, user: "막내아들", isMine: false, time: "2일 전", text: "형제들이랑 간병 분담 때문에 갈등이 심했는데, 비용 계산기로 투명하게 보여주니까 대화가 좀 풀렸습니다. 감사합니다.", likes: 38, comments: 11, liked: false },
];

const partnerAds = [
  { name: "행복한돌봄 방문요양", area: "성북·강북·노원", badge: "A등급", hl: "치매 전문 케어팀", phone: "02-900-1234", tag: "프리미엄" },
  { name: "하나케어 재가복지", area: "종로·동대문·성동", badge: "A등급", hl: "24시간 긴급출동", phone: "02-765-5678", tag: "추천" },
  { name: "참사랑 주야간보호", area: "도봉·강북·성북", badge: "A등급", hl: "무료 차량 픽업", phone: "02-955-9012", tag: "신규" },
  { name: "늘푸른 방문요양", area: "은평·서대문·마포", badge: "B등급", hl: "1:1 전담 배정", phone: "02-380-3456", tag: "추천" },
];
const checklistItems = [
  { t: "요양보호사 자격증", d: "국가공인 자격증 확인" }, { t: "경력·전문분야", d: "치매케어 등 전문성 확인" },
  { t: "센터 평가등급", d: "건보공단 A~E등급 확인" }, { t: "교체 가능 여부", d: "교체 자유로운지 확인" },
  { t: "추가 비용", d: "교통비·식대 등 확인" }, { t: "긴급 연락 체계", d: "야간·주말 연락체계" },
  { t: "케어 기록 공유", d: "일지 보호자 공유 여부" }, { t: "만족도·후기", d: "실이용자 후기 확인" },
];

// ── Score Logic ──
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
  if (physical.toiletUse === "indep" && physical.bowelCtrl === "indep" && physical.urineCtrl === "indep") ins.push({ type: "info", text: "화장실·대소변 자립 → 중증도 낮게 평가 가능" });
  const cog = Object.values(cognition).filter(Boolean).length;
  if (cog >= 5) ins.push({ type: "warn", text: `인지 저하 ${cog}개 → 치매 정밀검사 권장` });
  const beh = Object.values(behavior).filter(Boolean).length;
  if (beh >= 4) ins.push({ type: "warn", text: `행동변화 ${beh}개 → 등급 가산 요인` });
  if (basic.dementiaDx) ins.push({ type: "plus", text: "치매 진단 → 5등급/인지지원 가능성↑" });
  const full = Object.values(physical).filter((v) => v === "full").length;
  if (full >= 8) ins.push({ type: "warn", text: `신체 '완전도움' ${full}개 → 상위등급 가능` });
  return ins;
}

// ── Date-based index ──
// Seeded random for consistent daily shuffle
function seededRandom(seed) {
  let s = seed;
  return function() { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function getDaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function dayIndex(arr) {
  const rng = seededRandom(getDaySeed());
  return Math.floor(rng() * arr.length);
}

// Shuffle array with daily seed — returns different order every day
function dailyShuffle(arr) {
  const rng = seededRandom(getDaySeed());
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ── Colors ──
const C = {
  bg: "#F7F6F3", card: "#FFF", primary: "#1A6B4B", primaryLight: "#E6F4ED", primaryDark: "#12503A",
  accent: "#E05A2B", accentLight: "#FFF1EB", text: "#111827", textSub: "#6B7280", border: "#E5E7EB",
  danger: "#DC2626", dangerBg: "#FEF2F2", warn: "#D97706", warnBg: "#FFFBEB",
  safe: "#059669", safeBg: "#ECFDF5", gold: "#A16207", goldBg: "#FEFCE8", adBg: "#F3F4F6",
  heart: "#EF4444", purple: "#7C3AED", purpleLight: "#F3E8FF",
};
const F = `'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif`;

export default function BumoAnsim() {
  const [tab, setTab] = useState(TABS.HOME);
  const [step, setStep] = useState(STEPS.LANDING);
  const [nextStep, setNextStep] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [fade, setFade] = useState(true);
  const ref = useRef(null);
  const adIdx = useRef(0);
  const [kakaoReady, setKakaoReady] = useState(false);

  // ── 카카오 SDK 초기화 ──
  useEffect(() => {
    if (KAKAO_JS_KEY === "YOUR_KAKAO_JS_KEY") return; // 키 미설정 시 스킵
    if ((window as any).Kakao && (window as any).Kakao.isInitialized()) { setKakaoReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    script.integrity = "sha384-DKYJZ8NLiK8MN4/C5P2ezmFnkrysYfoB# placeholder";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if ((window as any).Kakao && !(window as any).Kakao.isInitialized()) {
        (window as any).Kakao.init(KAKAO_JS_KEY);
        setKakaoReady(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  // Assessment
  const [basic, setBasic] = useState({ age: "", livingAlone: null, dementiaDx: false, recentDementia: false, wandering: false });
  const [physical, setPhysical] = useState({}); const [social, setSocial] = useState({});
  const [cognition, setCognition] = useState({}); const [behavior, setBehavior] = useState({});
  const [nursing, setNursing] = useState({});

  // Cost
  const [costType, setCostType] = useState(null); const [costGrade, setCostGrade] = useState("3");
  const [visitIdx, setVisitIdx] = useState(3); const [visitDays, setVisitDays] = useState("22");
  const [daycareTime, setDaycareTime] = useState("라-3"); const [daycareDays, setDaycareDays] = useState("22");
  const [shortStayDays, setShortStayDays] = useState("15");
  const [checkedItems, setCheckedItems] = useState([]); const [areaInput, setAreaInput] = useState("");

  // Community
  const [posts, setPosts] = useState(communityPosts);
  const [newComment, setNewComment] = useState("");
  const [showShareToast, setShowShareToast] = useState(false);
  const [sharePopup, setSharePopup] = useState(null); // null or { text, author }
  const [toastMsg, setToastMsg] = useState("");

  const interstitialTargets = [STEPS.RESULT, STEPS.COST_RESULT, STEPS.AREA_RESULT];

  const go = useCallback((target) => {
    setFade(false);
    setTimeout(() => {
      if (interstitialTargets.includes(target)) { setNextStep(target); setStep(STEPS.INTERSTITIAL); setCountdown(4); }
      else { setStep(target); }
      setFade(true); ref.current?.scrollTo(0, 0);
    }, 180);
  }, []);

  useEffect(() => {
    if (step !== STEPS.INTERSTITIAL || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown]);

  const skipAd = () => { if (nextStep === null) return; setFade(false); setTimeout(() => { setStep(nextStep); setNextStep(null); setFade(true); adIdx.current = (adIdx.current + 1) % partnerAds.length; }, 150); };
  const resetAssess = () => { setBasic({ age: "", livingAlone: null, dementiaDx: false, recentDementia: false, wandering: false }); setPhysical({}); setSocial({}); setCognition({}); setBehavior({}); setNursing({}); go(STEPS.LANDING); };

  const showToast = (msg = "💌 공유 링크가 복사되었습니다") => { setToastMsg(msg); setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2000); };

  // ── Card Image Generator (Canvas API) ──
  const cardCanvasRef = useRef(null);

  const bgStyles = [
    // nature: deep blue-green gradient + mountain silhouette
    { type: "nature", grad1: [25,80,120], grad2: [70,150,200], mount: [40,90,70], sun: [255,200,100] },
    // floral: dark botanical
    { type: "floral", grad1: [45,60,45], grad2: [25,40,30], accent: [220,150,160], dot: [80,140,80] },
    // watercolor: light pastel
    { type: "watercolor", bg: [250,245,235], blobs: [[200,220,240],[180,200,180],[240,200,200]], textColor: [40,40,50] },
    // modern: green gradient
    { type: "modern", grad1: [26,107,75], grad2: [14,74,50], glow: [100,200,150] },
    // sunset: warm orange
    { type: "sunset", grad1: [180,100,60], grad2: [60,30,40], sun: [255,180,120] },
    // purple modern
    { type: "purple", grad1: [60,40,90], grad2: [30,20,60], glow: [150,120,200] },
  ];

  const generateCardImage = (text, author, category, styleIdx) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080; canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      const W = 1080, H = 1080;
      const style = bgStyles[styleIdx % bgStyles.length];

      // Background
      if (style.type === "watercolor") {
        ctx.fillStyle = `rgb(${style.bg.join(",")})`;
        ctx.fillRect(0, 0, W, H);
        // Soft blobs
        for (let i = 0; i < 12; i++) {
          const blob = style.blobs[i % style.blobs.length];
          const cx = Math.random() * W, cy = Math.random() * H, r = 100 + Math.random() * 200;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, `rgba(${blob.join(",")},0.15)`);
          grad.addColorStop(1, `rgba(${blob.join(",")},0)`);
          ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
        }
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, `rgb(${style.grad1.join(",")})`);
        grad.addColorStop(1, `rgb(${style.grad2.join(",")})`);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      }

      // Style-specific decorations
      if (style.type === "nature" || style.type === "sunset") {
        // Sun glow
        const sc = style.sun || [255,200,100];
        for (let r = 180; r > 0; r -= 4) {
          ctx.beginPath(); ctx.arc(W/2, H*0.3, r, 0, Math.PI*2);
          ctx.fillStyle = `rgba(${sc.join(",")},${0.03})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(W/2, H*0.3, 50, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${sc.join(",")},0.6)`; ctx.fill();
        // Mountains
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath(); ctx.moveTo(0, H);
          const mc = style.mount || [60,40,50];
          for (let x = 0; x <= W; x += 5) {
            const y = H - 180 + layer * 70 - Math.sin(x*0.005 + layer*2) * 70 - Math.sin(x*0.012+layer)*30;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, H); ctx.closePath();
          const d = 25 + layer * 20;
          ctx.fillStyle = `rgba(${Math.max(0,mc[0]-d)},${Math.max(0,mc[1]-d)},${Math.max(0,mc[2]-d)},${0.7+layer*0.1})`;
          ctx.fill();
        }
      } else if (style.type === "floral") {
        // Decorative circles
        for (let i = 0; i < 10; i++) {
          const cx = Math.random() < 0.5 ? Math.random()*250 : W - Math.random()*250;
          const cy = Math.random() < 0.5 ? Math.random()*250 : H - Math.random()*250;
          const r = 15 + Math.random()*40;
          const ac = style.accent;
          for (let a = 0; a < 6; a++) {
            const px = cx + r*0.8*Math.cos(a*Math.PI/3), py = cy + r*0.8*Math.sin(a*Math.PI/3);
            ctx.beginPath(); ctx.arc(px, py, r/2, 0, Math.PI*2);
            ctx.fillStyle = `rgba(${ac.join(",")},0.12)`; ctx.fill();
          }
        }
        // Bokeh
        for (let i = 0; i < 15; i++) {
          ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, 20+Math.random()*60, 0, Math.PI*2);
          ctx.fillStyle = `rgba(${style.accent.join(",")},0.05)`; ctx.fill();
        }
      } else if (style.type === "modern" || style.type === "purple") {
        // Glow
        const gc = style.glow;
        for (let r = 250; r > 0; r -= 5) {
          ctx.beginPath(); ctx.arc(W-180, 180, r, 0, Math.PI*2);
          ctx.fillStyle = `rgba(${gc.join(",")},${0.015})`; ctx.fill();
        }
        // Corner lines
        ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60,60); ctx.lineTo(60,100); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(60,60); ctx.lineTo(100,60); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W-60,H-60); ctx.lineTo(W-60,H-100); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W-60,H-60); ctx.lineTo(W-100,H-60); ctx.stroke();
        // Dot grid
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        for (let x = 80; x < W; x += 60) for (let y = 80; y < H; y += 60) {
          ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
        }
      }

      // Dark overlay for text (except watercolor)
      if (style.type !== "watercolor") {
        const ov = ctx.createLinearGradient(0, H*0.3, 0, H*0.75);
        ov.addColorStop(0, "rgba(0,0,0,0)"); ov.addColorStop(0.3, "rgba(0,0,0,0.25)");
        ov.addColorStop(0.7, "rgba(0,0,0,0.25)"); ov.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);
      }

      // Category badge
      const isLight = style.type === "watercolor";
      ctx.font = "500 26px 'Pretendard Variable', sans-serif";
      const catW = ctx.measureText(category).width + 36;
      ctx.fillStyle = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)";
      const bx = W/2 - catW/2, by = 80;
      ctx.beginPath(); ctx.roundRect(bx, by, catW, 40, 20); ctx.fill();
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.5)" : "rgba(255,255,255,0.7)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(category, W/2, by + 20);

      // Main quote text
      ctx.font = "600 54px 'Pretendard Variable', 'Noto Serif CJK KR', serif";
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.88)" : "rgba(255,255,255,0.92)";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      const lines = text.split("\n");
      const lineH = 78;
      const totalH = lines.length * lineH;
      let startY = (H - totalH) / 2 - 20;
      lines.forEach((line, i) => {
        ctx.fillText(line, W/2, startY + i * lineH);
      });

      // Author
      const authorY = startY + totalH + 40;
      ctx.font = "300 32px 'Pretendard Variable', sans-serif";
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.45)" : "rgba(255,255,255,0.55)";
      // Divider line
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(W/2-50, authorY); ctx.lineTo(W/2+50, authorY); ctx.stroke();
      ctx.fillText(`— ${author}`, W/2, authorY + 16);

      // Watermark
      ctx.font = "400 24px 'Pretendard Variable', sans-serif";
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.2)" : "rgba(255,255,255,0.25)";
      ctx.fillText("우리엄빠  uri-umbba.com", W/2, H - 48);

      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const openShare = (text, author, category, styleIdx) => {
    setSharePopup({ text: text.replace(/\n/g, " "), rawText: text, author, category: category || "", styleIdx: styleIdx || 0 });
  };

  const doShare = async (target) => {
    const { rawText, text, author, category, styleIdx } = sharePopup;
    const blob = await generateCardImage(rawText || text, author, category, styleIdx);
    const file = new File([blob as BlobPart], "uri-umbba-quote.png", { type: "image/png" });
    const msgText = `${text}\n— ${author}\n\n💚 우리엄빠 앱에서 매일 명언을 받아보세요`;

    if (target === "kakao") {
      // 1순위: 카카오 SDK로 직접 공유 (키 설정 시)
      if (kakaoReady && (window as any).Kakao) {
        try {
          (window as any).Kakao.Share.sendDefault({
            objectType: "feed",
            content: {
              title: "우리엄빠 오늘의 명언",
              description: `${text.replace(/\n/g, " ")}\n— ${author}`,
              imageUrl: `${SITE_URL}/og-image.png`,
              link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL },
            },
            buttons: [
              { title: "명언 더 보기", link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL } },
              { title: "요양 판별하기", link: { mobileWebUrl: `${SITE_URL}?tab=home`, webUrl: `${SITE_URL}?tab=home` } },
            ],
          });
          showToast("💬 카카오톡으로 공유합니다");
          setSharePopup(null);
          return;
        } catch(e) { console.log("Kakao SDK share failed, falling back", e); }
      }

      // 2순위: Web Share API (모바일 → 카카오톡 포함 앱 선택)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: "우리엄빠 오늘의 명언", text: msgText, files: [file] });
          showToast("💌 공유 완료!");
          setSharePopup(null);
          return;
        } catch(e) { /* user cancelled */ }
      }
      if (navigator.share) {
        try {
          await navigator.share({ title: "우리엄빠 오늘의 명언", text: msgText });
          showToast("💌 공유 완료!");
          setSharePopup(null);
          return;
        } catch(e) { /* fall through */ }
      }

      // 3순위: 이미지 저장 + 텍스트 복사 (PC 등)
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a"); a.href = url; a.download = "우리엄빠_명언.png"; a.click();
      URL.revokeObjectURL(url);
      if (navigator.clipboard) navigator.clipboard.writeText(msgText);
      showToast("📥 이미지 저장 + 텍스트 복사 완료!\n카카오톡에서 붙여넣기 해주세요");
    } else if (target === "copy") {
      if (navigator.clipboard) navigator.clipboard.writeText(msgText);
      showToast("📋 텍스트가 복사되었습니다");
    } else if (target === "save") {
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a"); a.href = url; a.download = "우리엄빠_명언.png"; a.click();
      URL.revokeObjectURL(url);
      showToast("📥 카드 이미지가 저장되었습니다");
    } else if (target === "sms") {
      if (navigator.clipboard) navigator.clipboard.writeText(msgText);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a"); a.href = url; a.download = "우리엄빠_명언.png"; a.click();
      URL.revokeObjectURL(url);
      window.open(`sms:?body=${encodeURIComponent(msgText)}`, "_self");
      showToast("📱 이미지 저장 + 문자 앱 열기");
    }
    setSharePopup(null);
  };

  const toggleLike = (id) => {
    setPosts(posts.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  // ── UI Components ──
  const Hdr = ({ title, onBack }) => (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, background: C.card, position: "sticky", top: 0, zIndex: 10 }}>
      {onBack && <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", marginRight: 8, padding: 4, color: C.text }}>←</button>}
      <span style={{ fontSize: 16, fontWeight: 700, color: C.text, flex: 1 }}>{title}</span>
      <span style={{ fontSize: 11, color: C.textSub, fontWeight: 600, background: C.primaryLight, padding: "3px 8px", borderRadius: 6 }}>우리엄빠</span>
    </div>
  );
  const Btn = ({ children, onClick, v = "primary", disabled = false, s = {} }: any) => {
    const base = { width: "100%", padding: "15px 24px", borderRadius: 14, border: "none", fontSize: 15, fontWeight: 700, cursor: disabled ? "default" : "pointer", fontFamily: F, opacity: disabled ? 0.35 : 1, transition: "all 0.2s" };
    const vs = { primary: { background: C.primary, color: "#fff" }, accent: { background: C.accent, color: "#fff" }, outline: { background: "transparent", color: C.primary, border: `2px solid ${C.primary}` }, ghost: { background: C.primaryLight, color: C.primary } };
    return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...vs[v], ...s }}>{children}</button>;
  };
  const Crd = ({ children, style: s = {}, onClick }: any) => (
    <div onClick={onClick} style={{ background: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.03)", cursor: onClick ? "pointer" : "default", ...s }}>{children}</div>
  );
  const Prog = ({ current, total, label }) => (
    <div style={{ margin: "16px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textSub, fontWeight: 600 }}>{label}</span><span style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>{current}/{total}</span></div>
      <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${(current / total) * 100}%`, background: `linear-gradient(90deg,${C.primary},${C.primaryDark})`, borderRadius: 3, transition: "width 0.4s" }} /></div>
    </div>
  );
  const chip = (sel, extra = {}) => ({ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: sel ? "none" : `1.5px solid ${C.border}`, background: sel ? C.primary : C.card, color: sel ? "#fff" : C.textSub, cursor: "pointer", fontFamily: F, transition: "all 0.15s", ...extra });
  const AdBanner = () => (
    <div style={{ margin: "14px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.adBg, padding: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#4285F4,#34A853,#FBBC05,#EA4335)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>Ad</span></div>
      <span style={{ fontSize: 12, color: C.textSub }}>Google AdMob 배너 (320×50)</span>
    </div>
  );
  const PartnerCard = ({ ad }) => (
    <div style={{ margin: "14px 0", borderRadius: 12, border: `1.5px solid ${C.gold}`, background: `linear-gradient(135deg,${C.goldBg},#FFFEF8)`, overflow: "hidden" }}>
      <div style={{ padding: "3px 12px", background: "linear-gradient(90deg,#A16207,#CA8A04)", display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>⭐ {ad.tag}</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>제휴</span></div>
      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div><div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{ad.name}</div><div style={{ fontSize: 12, color: C.textSub }}>{ad.area}</div></div><span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: C.primary, padding: "3px 8px", borderRadius: 6 }}>{ad.badge}</span></div>
        <div style={{ fontSize: 13, color: C.primaryDark, fontWeight: 600, padding: "7px 10px", background: C.primaryLight, borderRadius: 8, marginBottom: 10 }}>✨ {ad.hl}</div>
        <button style={{ width: "100%", padding: 11, borderRadius: 10, background: C.primary, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: F }}>📞 {ad.phone}</button>
      </div>
    </div>
  );

  const inner = { padding: "0 20px 120px", opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(10px)", transition: "all 0.25s ease" };

  // ═══════════════════════════════════════════════════
  // TAB: DAILY (오늘의 한마디)
  // ═══════════════════════════════════════════════════

  const DailyTab = () => {
    const shuffledQuotes = dailyShuffle(dailyQuotes);
    const shuffledTips = dailyShuffle(dailyHealthTips);
    const shuffledFortunes = dailyShuffle(dailyFortunes);
    const q = shuffledQuotes[0]; // 오늘의 메인 명언
    const h = shuffledTips[0];   // 오늘의 건강팁
    const f = shuffledFortunes[0]; // 오늘의 운세
    const extraQuotes = shuffledQuotes.slice(1, 4); // 추천 명언 3개 더
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    return (
      <div style={{ padding: "0 20px 120px" }}>
        <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <div style={{ fontSize: 13, color: C.textSub, fontWeight: 500 }}>{dateStr} {dayNames[today.getDay()]}요일</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: "4px 0 0" }}>오늘의 명언</h2>
          <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginTop: 4 }}>🤖 AI가 매일 추천하는 명언</div>
        </div>

        {/* 메인 명언 카드 */}
        <div style={{ margin: "16px 0", borderRadius: 18, padding: 28, background: `linear-gradient(145deg, #1A6B4B, #0E4A32)`, color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, fontSize: 100, opacity: 0.08 }}>{q.emoji}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>{q.emoji}</span>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "rgba(255,255,255,0.15)", fontWeight: 600 }}>{q.category}</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.7, margin: "0 0 12px", whiteSpace: "pre-line" }}>{q.text}</p>
          <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>— {q.author}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={() => openShare(q.text, q.author, q.category, 0)} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              💌 소중한 사람에게 보내기
            </button>
            <button onClick={() => openShare(q.text, q.author, q.category, 0)} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: F }}>
              🔗
            </button>
          </div>
        </div>

        {/* 더 많은 명언 */}
        <Crd style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>📚 오늘의 추천 명언 더보기</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {extraQuotes.map((eq, idx) => { return (
              <div key={idx} style={{ padding: "14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{eq.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: C.text, margin: "0 0 4px", lineHeight: 1.5, fontWeight: 500 }}>{eq.text.replace(/\n/g, " ")}</p>
                    <div style={{ fontSize: 12, color: C.textSub }}>— {eq.author} · <span style={{ color: C.primary, fontWeight: 600 }}>{eq.category}</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
                  <button onClick={() => openShare(eq.text, eq.author, eq.category, idx + 1)} style={{ padding: "6px 14px", borderRadius: 8, background: C.primaryLight, border: "none", color: C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>💌 보내기</button>
                  <button onClick={() => openShare(eq.text, eq.author, eq.category, idx + 1)} style={{ padding: "6px 14px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.textSub, fontSize: 12, cursor: "pointer", fontFamily: F }}>📋 복사</button>
                </div>
              </div>
            ); })}
          </div>
        </Crd>

        {/* 건강 팁 */}
        <Crd style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentLight, padding: "3px 8px", borderRadius: 6 }}>오늘의 건강 팁</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>{h.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{h.title}</div>
              <p style={{ fontSize: 13, color: C.textSub, margin: 0, lineHeight: 1.6 }}>{h.tip}</p>
            </div>
          </div>
          <button onClick={() => openShare(`${h.title}: ${h.tip}`, "우리엄빠 건강팁", "건강", 1)} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, background: C.primaryLight, border: "none", color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>💌 소중한 사람에게 보내기</button>
        </Crd>

        {/* 오늘의 운세 */}
        <Crd style={{ marginBottom: 14, background: `linear-gradient(135deg,${C.purpleLight},#FDF2F8)`, border: `1px solid #DDD6FE` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.purple, background: "#EDE9FE", padding: "3px 8px", borderRadius: 6 }}>🔮 오늘의 운세</span>
          </div>
          <p style={{ fontSize: 15, color: C.text, fontWeight: 600, margin: "0 0 10px", lineHeight: 1.6 }}>{f.fortune}</p>
          <div style={{ fontSize: 12, color: C.purple, fontWeight: 500, padding: "8px 12px", background: "rgba(124,58,237,0.08)", borderRadius: 8 }}>{f.lucky}</div>
          <button onClick={() => openShare(f.fortune, "오늘의 운세", "운세", 5)} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, background: "#EDE9FE", border: "none", color: C.purple, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>💌 소중한 사람에게 운세 보내기</button>
        </Crd>

        <AdBanner />

        {/* 보호자 응원 */}
        <Crd style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>💪 보호자 응원 한마디</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["오늘도 수고했어요, 우리 모두!", "부모님 곁에 있는 것만으로 효도입니다", "혼자가 아니에요. 여기 같은 마음 사람들이 있습니다"].map((msg, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: i === 0 ? C.safeBg : C.bg, border: `1px solid ${i === 0 ? "#BBF7D0" : C.border}`, fontSize: 14, color: C.text }}>
                {msg}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, gap: 12 }}>
                  <span style={{ fontSize: 12, color: C.textSub, cursor: "pointer" }}>❤️ {12 + i * 7}</span>
                  <span onClick={() => openShare(msg, "보호자 응원", "응원", 3)} style={{ fontSize: 12, color: C.primary, cursor: "pointer", fontWeight: 600 }}>공유</span>
                </div>
              </div>
            ))}
          </div>
          <input placeholder="응원 한마디를 남겨주세요..." style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", marginTop: 10 }} />
        </Crd>

        <PartnerCard ad={partnerAds[adIdx.current]} />
      </div>
    );
  };

  // ═══════════════════════════════════════════════════
  // TAB: COMMUNITY
  // ═══════════════════════════════════════════════════

  const [newPostText, setNewPostText] = useState("");
  const [myNickname] = useState(() => {
    const nicks = ["희망보호자", "효도하는딸", "든든한아들", "사랑이맘", "힘내는보호자", "따뜻한손길", "행복지킴이"];
    return nicks[Math.floor(Math.random() * nicks.length)];
  });

  const addPost = () => {
    if (!newPostText.trim()) return;
    const newPost = {
      id: Date.now(),
      user: myNickname,
      time: "방금 전",
      text: newPostText.trim(),
      likes: 0,
      comments: 0,
      liked: false,
      isMine: true,
    };
    setPosts([newPost, ...posts]);
    setNewPostText("");
    showToast("✅ 게시되었습니다!");
  };

  const deletePost = (id) => {
    setPosts(posts.filter(p => p.id !== id));
    showToast("🗑️ 삭제되었습니다");
  };

  const CommunityTab = () => (
    <div style={{ padding: "0 20px 120px" }}>
      <div style={{ padding: "20px 0 8px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: 0 }}>보호자 이야기</h2>
        <p style={{ fontSize: 13, color: C.textSub, margin: "4px 0 0" }}>같은 마음, 같은 고민을 나눠요</p>
      </div>

      {/* 내 닉네임 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{myNickname[0]}</div>
        <span style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>{myNickname}</span>
        <span style={{ fontSize: 11, color: C.textSub }}>으로 작성됩니다</span>
      </div>

      {/* 글쓰기 */}
      <Crd style={{ marginBottom: 16 }}>
        <textarea
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="부모님 돌봄 이야기를 나눠주세요...&#10;&#10;예) 오늘 아버지가 오랜만에 웃으셨어요 😊"
          rows={3}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", resize: "none" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 12, color: newPostText.length > 300 ? C.danger : C.textSub }}>{newPostText.length}/300</span>
          <button
            onClick={addPost}
            disabled={!newPostText.trim() || newPostText.length > 300}
            style={{
              padding: "8px 24px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: !newPostText.trim() ? "default" : "pointer", fontFamily: F,
              background: newPostText.trim() ? C.primary : C.border,
              color: newPostText.trim() ? "#fff" : C.textSub,
              opacity: newPostText.trim() ? 1 : 0.5,
              transition: "all 0.2s",
            }}
          >게시</button>
        </div>
      </Crd>

      <AdBanner />

      {/* 게시물 수 */}
      <div style={{ fontSize: 13, color: C.textSub, fontWeight: 600, margin: "8px 0 12px" }}>전체 {posts.length}개의 이야기</div>

      {/* Posts */}
      {posts.map((p) => (
        <Crd key={p.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.isMine ? C.primary : C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: p.isMine ? "#fff" : C.primary }}>{p.user[0]}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.user}</span>
                  {p.isMine && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: C.primaryLight, color: C.primary, fontWeight: 600 }}>나</span>}
                </div>
                <div style={{ fontSize: 11, color: C.textSub }}>{p.time}</div>
              </div>
            </div>
            {p.isMine && (
              <button onClick={() => deletePost(p.id)} style={{ background: "none", border: "none", fontSize: 12, color: C.textSub, cursor: "pointer", fontFamily: F, padding: "4px 8px" }}>삭제</button>
            )}
          </div>
          <p style={{ fontSize: 14, color: C.text, margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.text}</p>
          <div style={{ display: "flex", gap: 16, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            <button onClick={() => toggleLike(p.id)} style={{ background: "none", border: "none", fontSize: 13, color: p.liked ? C.heart : C.textSub, cursor: "pointer", fontFamily: F, fontWeight: p.liked ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}>
              {p.liked ? "❤️" : "🤍"} {p.likes}
            </button>
            <span style={{ fontSize: 13, color: C.textSub, display: "flex", alignItems: "center", gap: 4 }}>💬 {p.comments}</span>
            <button onClick={() => openShare(p.text, p.user, "보호자이야기", 3)} style={{ background: "none", border: "none", fontSize: 13, color: C.primary, cursor: "pointer", fontFamily: F, fontWeight: 600, marginLeft: "auto" }}>공유</button>
          </div>
        </Crd>
      ))}

      {posts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.textSub }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>아직 이야기가 없어요</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>첫 번째 이야기를 남겨주세요!</div>
        </div>
      )}

      <PartnerCard ad={partnerAds[1]} />
    </div>
  );

  // ═══════════════════════════════════════════════════
  // HOME TAB (기존 LANDING 등)
  // ═══════════════════════════════════════════════════

  const Landing = () => (
    <div style={inner}>
      <div style={{ textAlign: "center", paddingTop: 36 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: 20, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, marginBottom: 16, boxShadow: "0 10px 30px rgba(26,107,75,0.3)" }}><span style={{ fontSize: 34 }}>👨‍👩‍👧‍👦</span></div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: "0 0 4px", letterSpacing: -1 }}>우리엄빠</h1>
        <p style={{ fontSize: 15, color: C.primary, fontWeight: 700, margin: "0 0 2px" }}>우리 엄마 아빠 괜찮을까?</p>
        <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 28px" }}>요양 판별 · 오늘의 한마디 · 보호자 이야기</p>
      </div>
      {/* 오늘의 글귀 미리보기 */}
      {(() => { const q = dailyShuffle(dailyQuotes)[0]; return (
        <div onClick={() => setTab(TABS.DAILY)} style={{ margin: "0 0 16px", borderRadius: 14, padding: "16px 18px", background: `linear-gradient(145deg,${C.primary},${C.primaryDark})`, color: "#fff", cursor: "pointer" }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>✨ AI 추천 오늘의 명언</div>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.5, whiteSpace: "pre-line" }}>{q.text.split("\n")[0]}...</p>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>— {q.author}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>탭해서 전체 보기 →</div>
        </div>
      ); })()}

      {[
        { step: STEPS.BASIC_INFO, icon: "📋", bg: C.primaryLight, t: "등급 사전 판별", d: "65개 항목 · 3분", bd: `2px solid ${C.primary}` },
        { step: STEPS.COST_CALC, icon: "💰", bg: "#FFF7ED", t: "비용 계산기 (2026 수가)", d: "방문요양·데이케어·요양원·공동생활" },
        { step: STEPS.CHECKLIST, icon: "✅", bg: "#EFF6FF", t: "요양보호사 체크리스트", d: "8가지 필수 확인" },
        { step: STEPS.AREA_CHECK, icon: "📍", bg: "#F5F3FF", t: "동네 인력 확인", d: "가능인력·대기기간" },
      ].map((it, i) => (
        <Crd key={i} onClick={() => go(it.step)} style={{ cursor: "pointer", marginBottom: 10, border: it.bd || `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: it.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{it.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{it.t}</div><div style={{ fontSize: 12, color: C.textSub }}>{it.d}</div></div>
            <span style={{ color: C.textSub }}>→</span>
          </div>
        </Crd>
      ))}
      <PartnerCard ad={partnerAds[0]} /><AdBanner />
    </div>
  );

  // ── BasicInfo ──
  const BasicInfo = () => {
    const done = basic.age && basic.livingAlone !== null;
    return (<div><Hdr title="기본 정보" onBack={resetAssess} /><div style={inner}>
      <Prog current={1} total={6} label="STEP 1 · 기본정보" />
      <Crd style={{ marginBottom: 12, marginTop: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: C.text, display: "block", marginBottom: 8 }}>어르신 연세</label>
        <input value={basic.age} onChange={(e) => setBasic({ ...basic, age: e.target.value })} placeholder="예: 78" type="number" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 16, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
      </Crd>
      <Crd style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: C.text, display: "block", marginBottom: 10 }}>거주 형태</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[["혼자 거주", true], ["가족과 동거", false]].map(([l, v]) => (
            <button key={String(v)} onClick={() => setBasic({ ...basic, livingAlone: v })} style={{ ...chip(basic.livingAlone === v), flex: 1 }}>{l}</button>
          ))}
        </div>
      </Crd>
      <Crd style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: C.text, display: "block", marginBottom: 10 }}>치매 관련</label>
        {[["dementiaDx", "병원 치매 진단 이력"], ["recentDementia", "최근 2년 치매 진료/검사"], ["wandering", "배회·문제행동"]].map(([k, l]) => (
          <button key={k} onClick={() => setBasic({ ...basic, [k]: !basic[k] })} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 6, borderRadius: 10, border: basic[k] ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, background: basic[k] ? C.primaryLight : C.card, cursor: "pointer", fontFamily: F, fontSize: 14, color: C.text, fontWeight: basic[k] ? 600 : 400, textAlign: "left" }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, border: basic[k] ? "none" : `2px solid ${C.border}`, background: basic[k] ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{basic[k] && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}</div>{l}
          </button>
        ))}
      </Crd>
      <Btn disabled={!done} onClick={() => go(STEPS.PHYSICAL)}>다음: 신체기능 →</Btn>
    </div></div>);
  };

  // ── Reusable assessment pages (compact) ──
  const ThreeLevelPage = ({ title, stepNum, label, items, data, setData, prevStep, nextStepTarget, nextLabel }) => {
    const ok = items.every((it) => data[it.key] !== undefined);
    return (<div><Hdr title={title} onBack={() => go(prevStep)} /><div style={inner}><Prog current={stepNum} total={6} label={label} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {items.map((it) => (<Crd key={it.key} style={{ padding: 14 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>{it.label}</div><div style={{ display: "flex", gap: 6 }}>
          {[["indep","자립"],["partial","부분도움"],["full","완전도움"]].map(([val,lbl]) => (<button key={val} onClick={() => setData({...data,[it.key]:val})} style={{...chip(data[it.key]===val),flex:1,...(data[it.key]===val?{background:val==="full"?C.accent:val==="partial"?C.warn:C.primary}:{})}}>{lbl}</button>))}
        </div></Crd>))}
      </div><div style={{marginTop:20}}><Btn disabled={!ok} onClick={()=>go(nextStepTarget)}>다음: {nextLabel} →</Btn></div></div></div>);
  };
  const YesNoPage = ({ title, stepNum, label, items, data, setData, prevStep, nextStepTarget, nextLabel }) => {
    const ok = items.every((it) => data[it.key] !== undefined);
    return (<div><Hdr title={title} onBack={() => go(prevStep)} /><div style={inner}><Prog current={stepNum} total={6} label={label} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {items.map((it) => (<Crd key={it.key} style={{ padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><span style={{ fontSize: 14, color: C.text, flex: 1 }}>{it.label}</span><div style={{ display: "flex", gap: 5 }}>
          {[["예",true],["아니오",false]].map(([l,val]) => (<button key={String(l)} onClick={() => setData({...data,[it.key]:val})} style={{...chip(data[it.key]===val),...(data[it.key]===val?{background:val?C.danger:C.primary}:{})}}>{l}</button>))}
        </div></div></Crd>))}
      </div><div style={{marginTop:20}}><Btn disabled={!ok} onClick={()=>go(nextStepTarget)}>다음: {nextLabel} →</Btn></div></div></div>);
  };
  const NursingPage = () => {
    const bools = nursingItems.slice(0,5), rehab = nursingItems.slice(5);
    const ok = bools.every(it=>nursing[it.key]!==undefined)&&rehab.every(it=>nursing[it.key]!==undefined);
    return (<div><Hdr title="간호처치·재활" onBack={()=>go(STEPS.BEHAVIOR)} /><div style={inner}><Prog current={6} total={6} label="STEP 6" />
      <p style={{fontSize:13,fontWeight:700,color:C.text,margin:"14px 0 8px"}}>간호처치</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {bools.map(it=>(<Crd key={it.key} style={{padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><span style={{fontSize:14,color:C.text,flex:1}}>{it.label}</span><div style={{display:"flex",gap:5}}>
          {[["있음",true],["없음",false]].map(([l,val])=>(<button key={String(l)} onClick={()=>setNursing({...nursing,[it.key]:val})} style={{...chip(nursing[it.key]===val),...(nursing[it.key]===val?{background:val?C.accent:C.safe}:{})}}>{l}</button>))}
        </div></div></Crd>))}
      </div>
      <p style={{fontSize:13,fontWeight:700,color:C.text,margin:"20px 0 8px"}}>재활</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rehab.map(it=>(<Crd key={it.key} style={{padding:14}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:10}}>{it.label}</div>
          {it.key==="jointLimit"?<div style={{display:"flex",gap:6}}>{[["있음",true],["없음",false]].map(([l,val])=>(<button key={String(l)} onClick={()=>setNursing({...nursing,[it.key]:val})} style={{...chip(nursing[it.key]===val),flex:1,...(nursing[it.key]===val?{background:C.accent}:{})}}>{l}</button>))}</div>
          :<div style={{display:"flex",gap:6}}>{[["없음","none"],["부분","partial"],["완전","full"]].map(([l,val])=>(<button key={val} onClick={()=>setNursing({...nursing,[it.key]:val})} style={{...chip(nursing[it.key]===val),flex:1,...(nursing[it.key]===val?{background:val==="full"?C.accent:val==="partial"?C.warn:C.primary}:{})}}>{l}</button>))}</div>}
        </Crd>))}
      </div>
      <div style={{marginTop:20}}><Btn disabled={!ok} onClick={()=>go(STEPS.RESULT)} v="accent">결과 확인</Btn></div>
    </div></div>);
  };

  // ── Result/Consult/Cost/Checklist/Area (compact versions) ──
  const ResultPage = () => {
    const score=calcScore(basic,physical,social,cognition,behavior,nursing);const est=estimateGrade(score,basic);const ins=getInsights(basic,physical,cognition,behavior);
    const recs=[];if(basic.dementiaDx||basic.recentDementia){recs.push("의사소견서 확보");recs.push("치매 진료기록 정리");}if(est.grade!=="등급외"){recs.push("공단 인정 신청");recs.push("ADL 상태 정리");}else{recs.push("노인맞춤돌봄 확인");}recs.push("전문 상담 진행");
    return (<div><Hdr title="판별 결과" onBack={resetAssess} /><div style={inner}>
      <div style={{textAlign:"center",padding:"36px 0 20px"}}><div style={{fontSize:48,marginBottom:8}}>{est.emoji}</div><div style={{display:"inline-block",padding:"8px 20px",borderRadius:24,background:est.color,color:"#fff",fontSize:18,fontWeight:800}}>{est.grade} 가능성</div><div style={{fontSize:13,color:C.textSub,marginTop:4}}>신뢰도: {est.conf}</div><div style={{fontSize:32,fontWeight:900,color:est.color,marginTop:10}}>{score}점</div></div>
      <Crd style={{marginBottom:12}}><div style={{fontSize:14,fontWeight:700,marginBottom:12}}>📊 분석</div>{ins.map((i,idx)=>(<div key={idx} style={{padding:"10px 12px",borderRadius:10,background:i.type==="info"?"#F0F9FF":i.type==="warn"?C.warnBg:C.safeBg,fontSize:13,marginBottom:6,display:"flex",gap:8}}><span>{i.type==="info"?"ℹ️":i.type==="warn"?"⚠️":"✅"}</span><span>{i.text}</span></div>))}</Crd>
      <Crd style={{marginBottom:12}}><div style={{fontSize:14,fontWeight:700,marginBottom:10}}>✅ 권장</div>{recs.map((r,i)=>(<div key={i} style={{padding:"5px 0",fontSize:13}}><span style={{color:C.primary,fontWeight:700}}>{i+1}.</span> {r}</div>))}</Crd>
      <PartnerCard ad={partnerAds[adIdx.current]} /><AdBanner />
      <div style={{margin:"12px 0",padding:14,borderRadius:10,background:C.accentLight,border:`1.5px solid ${C.accent}`}}><p style={{fontSize:11,color:C.textSub,margin:0,lineHeight:1.6}}>⚠️ 사전 예측입니다. 실제 판정은 공단 조사·의사소견서·등급판정위원회에 따라 다릅니다.</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}><Btn v="accent" onClick={()=>go(STEPS.CONSULT)}>전문 상담</Btn><Btn v="outline" onClick={()=>go(STEPS.COST_CALC)}>비용 계산</Btn><Btn v="ghost" onClick={resetAssess}>처음으로</Btn></div>
    </div></div>);
  };
  const ConsultPage = () => (<div><Hdr title="상담 연결" onBack={()=>go(STEPS.LANDING)} /><div style={inner}>
    <div style={{textAlign:"center",padding:"36px 0 20px"}}><div style={{width:68,height:68,borderRadius:"50%",background:C.primaryLight,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><span style={{fontSize:32}}>👩‍⚕️</span></div><h2 style={{fontSize:20,fontWeight:800,margin:"0 0 6px"}}>전문 상담사</h2><p style={{fontSize:14,color:C.textSub,margin:0}}>등급~매칭 무료 안내</p></div>
    {[{icon:"📞",bg:C.primaryLight,t:"전화",s:"1588-0000",s2:"평일 09~18시",bd:`2px solid ${C.primary}`},{icon:"💬",bg:"#FEE500",t:"카카오톡",s:"실시간 1:1",s2:"24시간"},{icon:"📝",bg:"#EFF6FF",t:"방문 상담",s:"직접 방문",s2:"무료"}].map((it,i)=>(
      <Crd key={i} style={{cursor:"pointer",marginBottom:10,border:it.bd||`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:12,background:it.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{it.icon}</div><div><div style={{fontSize:15,fontWeight:700}}>{it.t}</div><div style={{fontSize:13,color:it.bd?C.primary:C.textSub}}>{it.s}</div><div style={{fontSize:11,color:C.textSub}}>{it.s2}</div></div></div></Crd>
    ))}<AdBanner /><Btn v="ghost" onClick={()=>go(STEPS.LANDING)}>처음으로</Btn></div></div>);

  // Cost calc/result (same as v4 but compact)
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
          <p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>월 일수</p><div style={{display:"flex",gap:6}}>{["15","18","20","22","25"].map(d=>(<button key={d} onClick={()=>setVisitDays(d)} style={chip(visitDays===d)}>{d}일</button>))}</div>
        </Crd>)}
        {costType==="daycare"&&(<Crd style={{marginBottom:16}}>
          <p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>1일 시간</p><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>{Object.entries(dayCareFees).map(([code,data])=>(<button key={code} onClick={()=>setDaycareTime(code)} style={{...chip(daycareTime===code),textAlign:"left",padding:"10px 14px"}}>{code} ({data.label}) — {(data[costGrade]||0).toLocaleString()}원</button>))}</div>
          <p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>월 일수</p><div style={{display:"flex",gap:6}}>{["15","18","20","22","25"].map(d=>(<button key={d} onClick={()=>setDaycareDays(d)} style={chip(daycareDays===d)}>{d}일</button>))}</div>
        </Crd>)}
        {costType==="shortStay"&&(<Crd style={{marginBottom:16}}><p style={{fontSize:13,fontWeight:700,margin:"0 0 10px"}}>일수</p><div style={{display:"flex",gap:6}}>{["7","10","15","20","30"].map(d=>(<button key={d} onClick={()=>setShortStayDays(d)} style={chip(shortStayDays===d)}>{d}일</button>))}</div></Crd>)}
        <Btn onClick={()=>go(STEPS.COST_RESULT)}>비용 계산하기</Btn>
      </>)}
    </div></div>);
  };
  const CostResultPage = () => {
    let total=0,selfRate=0.15,selfPay=0,govPay=0,perDay=0,days=0,limitAmt=monthlyLimit[costGrade]||0,typeLabel="",bd=[];
    if(costType==="visit"){const vc=visitCare[visitIdx];days=parseInt(visitDays);perDay=vc.fee;total=perDay*days;if(total>limitAmt&&limitAmt>0)total=limitAmt;selfPay=Math.round(total*selfRate);govPay=total-selfPay;typeLabel=`방문요양 (${vc.label})`;bd=[{l:`1회 ${vc.code}`,v:`${perDay.toLocaleString()}원`},{l:`${days}일`,v:`${(perDay*days).toLocaleString()}원`},...(perDay*days>limitAmt&&limitAmt>0?[{l:"한도액 적용",v:`${limitAmt.toLocaleString()}원`,a:true}]:[])];
    }else if(costType==="daycare"){const dc=dayCareFees[daycareTime];days=parseInt(daycareDays);perDay=dc[costGrade]||dc["5"]||0;total=perDay*days;if(total>limitAmt&&limitAmt>0)total=limitAmt;selfPay=Math.round(total*selfRate);govPay=total-selfPay;typeLabel=`주·야간보호 (${dc.label})`;bd=[{l:`1일 ${daycareTime}`,v:`${perDay.toLocaleString()}원`},{l:`${days}일`,v:`${(perDay*days).toLocaleString()}원`}];
    }else if(costType==="shortStay"){days=parseInt(shortStayDays);perDay=shortStayFees[costGrade]||shortStayFees["3"];total=perDay*days;if(total>limitAmt&&limitAmt>0)total=limitAmt;selfPay=Math.round(total*selfRate);govPay=total-selfPay;typeLabel="단기보호";bd=[{l:`1일 ${costGrade}등급`,v:`${perDay.toLocaleString()}원`},{l:`${days}일`,v:`${total.toLocaleString()}원`}];
    }else if(costType==="facility"){selfRate=0.20;perDay=facilityFees[costGrade]||facilityFees["3"];const ds=facilitySelfs[costGrade]||facilitySelfs["3"];days=30;total=perDay*days;selfPay=ds*days;govPay=total-selfPay;typeLabel="노인요양시설";bd=[{l:`1일 수가`,v:`${perDay.toLocaleString()}원`},{l:"1일 본인부담",v:`${ds.toLocaleString()}원`}];
    }else if(costType==="groupHome"){selfRate=0.20;perDay=groupHomeFees[costGrade]||groupHomeFees["3"];const ds=groupHomeSelfs[costGrade]||groupHomeSelfs["3"];days=30;total=perDay*days;selfPay=ds*days;govPay=total-selfPay;typeLabel="공동생활가정";bd=[{l:"1일 수가",v:`${perDay.toLocaleString()}원`},{l:"1일 본인부담",v:`${ds.toLocaleString()}원`}];}
    const isF=costType==="facility"||costType==="groupHome";
    return (<div><Hdr title="비용 결과" onBack={()=>go(STEPS.COST_CALC)} /><div style={inner}>
      <span style={{display:"inline-block",padding:"4px 10px",borderRadius:6,background:C.accentLight,fontSize:11,fontWeight:700,color:C.accent,marginTop:16,marginBottom:8}}>{typeLabel}</span>
      <div style={{textAlign:"center",padding:"16px 0 24px"}}><div style={{fontSize:12,color:C.textSub}}>월 본인부담금</div><div style={{fontSize:36,fontWeight:900,color:C.primary,margin:"4px 0"}}>{selfPay.toLocaleString()}원</div><div style={{fontSize:13,color:C.textSub}}>총 {total.toLocaleString()}원 · {isF?"20%":"15%"}</div></div>
      <Crd style={{marginBottom:12}}>{bd.map((b,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<bd.length-1?`1px solid ${C.border}`:"none",fontSize:14}}><span style={{color:b.a?C.accent:C.textSub}}>{b.l}</span><span style={{fontWeight:700,color:b.a?C.accent:C.text}}>{b.v}</span></div>))}
        <div style={{borderTop:`2px solid ${C.text}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:15}}><span style={{fontWeight:700}}>정부</span><span style={{color:C.primary,fontWeight:700}}>{govPay.toLocaleString()}원</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:15}}><span style={{fontWeight:800}}>본인</span><span style={{fontWeight:900,color:C.accent,fontSize:17}}>{selfPay.toLocaleString()}원</span></div>
      </Crd>
      <div style={{padding:12,borderRadius:8,background:C.primaryLight,marginBottom:12}}><p style={{fontSize:12,color:C.primaryDark,margin:0,lineHeight:1.5}}>{isF?<><strong>시설급여</strong> 본인부담 20%. 기초수급·차상위 감면/면제. 식대 등 별도.</>:<><strong>월 한도액:</strong> {limitAmt.toLocaleString()}원. 기초수급·차상위 감면.</>}</p></div>
      <PartnerCard ad={partnerAds[2]} /><AdBanner />
      <div style={{display:"flex",flexDirection:"column",gap:10}}><Btn v="accent" onClick={()=>go(STEPS.CONSULT)}>상담 받기</Btn><Btn v="outline" onClick={()=>go(STEPS.COST_CALC)}>다른 계산</Btn><Btn v="ghost" onClick={()=>go(STEPS.LANDING)}>처음으로</Btn></div>
    </div></div>);
  };

  const ChecklistPage = () => (<div><Hdr title="체크리스트" onBack={()=>go(STEPS.LANDING)} /><div style={inner}>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>{checklistItems.map((it,i)=>{const chk=checkedItems.includes(i);return(<Crd key={i} onClick={()=>setCheckedItems(chk?checkedItems.filter(x=>x!==i):[...checkedItems,i])} style={{padding:14,cursor:"pointer",border:chk?`2px solid ${C.primary}`:`1px solid ${C.border}`,background:chk?C.primaryLight:C.card}}><div style={{display:"flex",gap:10}}><div style={{width:22,height:22,borderRadius:6,border:chk?"none":`2px solid ${C.border}`,background:chk?C.primary:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{chk&&<span style={{color:"#fff",fontSize:12}}>✓</span>}</div><div><div style={{fontSize:14,fontWeight:700}}>{it.t}</div><div style={{fontSize:12,color:C.textSub}}>{it.d}</div></div></div></Crd>);})}</div>
    <AdBanner /><div style={{marginTop:10,display:"flex",flexDirection:"column",gap:10}}><Btn v="accent" onClick={()=>go(STEPS.CONSULT)}>상담</Btn><Btn v="ghost" onClick={()=>go(STEPS.LANDING)}>처음으로</Btn></div></div></div>);
  const AreaCheckPage = () => (<div><Hdr title="동네 인력" onBack={()=>go(STEPS.LANDING)} /><div style={inner}><Crd style={{marginTop:16}}><label style={{fontSize:13,fontWeight:600,display:"block",marginBottom:8}}>부모님 주소 (동 단위)</label><input value={areaInput} onChange={e=>setAreaInput(e.target.value)} placeholder="예: 성북구 길음동" style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:15,fontFamily:F,outline:"none",boxSizing:"border-box"}} /></Crd><div style={{marginTop:16}}><Btn disabled={!areaInput.trim()} onClick={()=>go(STEPS.AREA_RESULT)}>조회</Btn></div></div></div>);
  const AreaResultPage = () => {const d=useRef({a:Math.floor(Math.random()*6)+2,w:`${Math.floor(Math.random()*5)+1}~${Math.floor(Math.random()*7)+6}`,t:["오전 9~12시","오후 2~5시"][Math.round(Math.random())]}).current;return (<div><Hdr title="결과" onBack={()=>go(STEPS.AREA_CHECK)} /><div style={inner}>
    <div style={{textAlign:"center",padding:"28px 0 16px"}}><span style={{display:"inline-block",padding:"5px 12px",borderRadius:16,fontSize:12,fontWeight:700,color:C.primary,background:C.primaryLight}}>📍 {areaInput}</span><h2 style={{fontSize:20,fontWeight:800,margin:"12px 0 0"}}>매칭 가능</h2></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>{[{l:"인력",v:`${d.a}명`,c:C.primary},{l:"대기",v:d.w+"일",c:C.warn},{l:"추천",v:d.t,c:C.textSub}].map((x,i)=>(<Crd key={i} style={{textAlign:"center",padding:14}}><div style={{fontSize:20,fontWeight:800,color:x.c}}>{x.v}</div><div style={{fontSize:11,color:C.textSub}}>{x.l}</div></Crd>))}</div>
    <PartnerCard ad={partnerAds[1]} /><AdBanner /><div style={{display:"flex",flexDirection:"column",gap:10}}><Btn v="accent" onClick={()=>go(STEPS.CONSULT)}>상담</Btn><Btn v="ghost" onClick={()=>go(STEPS.LANDING)}>처음으로</Btn></div></div></div>);};

  const InterstitialPage = () => {const ad=partnerAds[adIdx.current];return (<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.card,borderRadius:20,maxWidth:400,width:"100%",overflow:"hidden"}}>
      <div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:11,color:C.textSub}}>광고</span><button onClick={countdown<=0?skipAd:undefined} style={{padding:"5px 14px",borderRadius:16,fontSize:12,fontWeight:700,border:"none",cursor:countdown<=0?"pointer":"default",fontFamily:F,background:countdown<=0?C.primary:C.border,color:countdown<=0?"#fff":C.textSub}}>{countdown>0?`${countdown}초`:"결과 보기 ✕"}</button></div>
      <div style={{padding:16,borderBottom:`1px solid ${C.border}`}}><div style={{borderRadius:10,border:`1px dashed ${C.border}`,background:C.adBg,padding:20,textAlign:"center"}}><div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#4285F4,#34A853,#FBBC05,#EA4335)",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:8}}><span style={{color:"#fff",fontSize:14,fontWeight:800}}>Ad</span></div><div style={{fontSize:13,color:C.textSub}}>Google AdMob 전면광고</div></div></div>
      <div style={{padding:"12px 16px 18px"}}><div style={{display:"inline-block",padding:"3px 8px",background:"linear-gradient(90deg,#A16207,#CA8A04)",borderRadius:5,marginBottom:8}}><span style={{fontSize:10,fontWeight:700,color:"#fff"}}>⭐ {ad.tag}</span></div><div style={{fontSize:16,fontWeight:800}}>{ad.name}</div><div style={{fontSize:12,color:C.textSub,marginBottom:8}}>{ad.area} · {ad.badge}</div><div style={{fontSize:13,color:C.primaryDark,fontWeight:600,padding:"8px 12px",background:C.primaryLight,borderRadius:8,marginBottom:10}}>✨ {ad.hl}</div><button style={{width:"100%",padding:12,borderRadius:10,background:C.accent,color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>📞 무료 상담</button></div>
    </div></div>);};

  // ── Card Preview (mini canvas in popup) ──
  const CardPreview = ({ text, author, category, styleIdx }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W = 540, H = 540;
      canvas.width = W; canvas.height = H;
      const style = bgStyles[styleIdx % bgStyles.length];

      // BG
      if (style.type === "watercolor") {
        ctx.fillStyle = `rgb(${style.bg.join(",")})`;
        ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 8; i++) {
          const blob = style.blobs[i % style.blobs.length];
          const cx = Math.random()*W, cy = Math.random()*H, r = 60+Math.random()*120;
          const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
          g.addColorStop(0,`rgba(${blob.join(",")},0.15)`); g.addColorStop(1,`rgba(${blob.join(",")},0)`);
          ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
        }
      } else {
        const g = ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,`rgb(${style.grad1.join(",")})`); g.addColorStop(1,`rgb(${style.grad2.join(",")})`);
        ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      }

      if (style.type === "nature" || style.type === "sunset") {
        const sc = style.sun || [255,200,100];
        for (let r = 90; r > 0; r -= 3) { ctx.beginPath(); ctx.arc(W/2,H*0.3,r,0,Math.PI*2); ctx.fillStyle=`rgba(${sc.join(",")},0.03)`; ctx.fill(); }
        ctx.beginPath(); ctx.arc(W/2,H*0.3,25,0,Math.PI*2); ctx.fillStyle=`rgba(${sc.join(",")},0.6)`; ctx.fill();
        for (let layer=0;layer<3;layer++){ctx.beginPath();ctx.moveTo(0,H);const mc=style.mount||[60,40,50];for(let x=0;x<=W;x+=5){const y=H-90+layer*35-Math.sin(x*0.01+layer*2)*35;ctx.lineTo(x,y);}ctx.lineTo(W,H);ctx.closePath();const d=25+layer*20;ctx.fillStyle=`rgba(${Math.max(0,mc[0]-d)},${Math.max(0,mc[1]-d)},${Math.max(0,mc[2]-d)},${0.7+layer*0.1})`;ctx.fill();}
      } else if (style.type === "modern" || style.type === "purple") {
        const gc = style.glow;
        for (let r=120;r>0;r-=4){ctx.beginPath();ctx.arc(W-90,90,r,0,Math.PI*2);ctx.fillStyle=`rgba(${gc.join(",")},0.015)`;ctx.fill();}
        ctx.strokeStyle="rgba(255,255,255,0.15)";ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(30,30);ctx.lineTo(30,50);ctx.stroke();ctx.beginPath();ctx.moveTo(30,30);ctx.lineTo(50,30);ctx.stroke();
        ctx.beginPath();ctx.moveTo(W-30,H-30);ctx.lineTo(W-30,H-50);ctx.stroke();ctx.beginPath();ctx.moveTo(W-30,H-30);ctx.lineTo(W-50,H-30);ctx.stroke();
      }

      // Overlay
      if (style.type !== "watercolor") {
        const ov = ctx.createLinearGradient(0,H*0.3,0,H*0.75);
        ov.addColorStop(0,"rgba(0,0,0,0)");ov.addColorStop(0.3,"rgba(0,0,0,0.2)");ov.addColorStop(0.7,"rgba(0,0,0,0.2)");ov.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=ov;ctx.fillRect(0,0,W,H);
      }

      const isLight = style.type === "watercolor";

      // Category
      ctx.font = "500 13px sans-serif";
      const catW = ctx.measureText(category||"").width + 20;
      ctx.fillStyle = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)";
      ctx.beginPath(); ctx.roundRect(W/2-catW/2,40,catW,22,11); ctx.fill();
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.5)" : "rgba(255,255,255,0.7)";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(category||"",W/2,51);

      // Text
      ctx.font = "600 27px sans-serif";
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.88)" : "rgba(255,255,255,0.92)";
      ctx.textAlign="center"; ctx.textBaseline="top";
      const lines = (text||"").split("\n");
      const lineH = 40;
      const totalH = lines.length * lineH;
      let startY = (H - totalH)/2 - 10;
      lines.forEach((line,i) => ctx.fillText(line, W/2, startY + i*lineH));

      // Author
      ctx.font = "300 16px sans-serif";
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.4)" : "rgba(255,255,255,0.5)";
      ctx.fillText(`— ${author}`, W/2, startY + totalH + 24);

      // Watermark
      ctx.font = "400 12px sans-serif";
      ctx.fillStyle = isLight ? "rgba(40,40,50,0.15)" : "rgba(255,255,255,0.2)";
      ctx.fillText("우리엄빠  uri-umbba.com", W/2, H-24);
    }, [text, author, category, styleIdx]);

    return <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block", borderRadius: 14 }} />;
  };

  // ═══════════════════════════════════════════════════
  // BOTTOM TAB BAR
  // ═══════════════════════════════════════════════════

  const TabBar = () => (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", maxWidth: 480, width: "100%", background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      {[
        { key: TABS.HOME, icon: "🏠", label: "홈" },
        { key: TABS.DAILY, icon: "✨", label: "오늘의 한마디" },
        { key: TABS.COMMUNITY, icon: "💬", label: "보호자 이야기" },
      ].map((t) => (
        <button key={t.key} onClick={() => { setTab(t.key); if (t.key === TABS.HOME) { setStep(STEPS.LANDING); } ref.current?.scrollTo(0, 0); }}
          style={{ flex: 1, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: F }}>
          <span style={{ fontSize: 22 }}>{t.icon}</span>
          <span style={{ fontSize: 11, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? C.primary : C.textSub }}>{t.label}</span>
          {tab === t.key && <div style={{ width: 20, height: 3, borderRadius: 2, background: C.primary, marginTop: 2 }} />}
        </button>
      ))}
    </div>
  );

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  const isSubPage = tab === TABS.HOME && step !== STEPS.LANDING;

  return (
    <div ref={ref} style={{ fontFamily: F, background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      {/* Toast */}
      {showShareToast && (
        <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "12px 24px", borderRadius: 12, background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "fadeIn 0.3s ease" }}>
          {toastMsg}
        </div>
      )}

      {/* Share Popup with Card Preview */}
      {sharePopup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSharePopup(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: "20px 20px 0 0", maxWidth: 480, width: "100%", padding: "20px 20px 32px", animation: "slideUp 0.3s ease", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>소중한 사람에게 보내기</div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>예쁜 카드 이미지로 공유됩니다</div>

            {/* 카드 미리보기 (mini canvas preview) */}
            <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              <CardPreview text={sharePopup.rawText || sharePopup.text} author={sharePopup.author} category={sharePopup.category} styleIdx={sharePopup.styleIdx} />
            </div>

            {/* 공유 대상 */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 16 }}>
              {[
                { emoji: "👨‍👩‍👦", label: "부모님" }, { emoji: "👫", label: "친구" },
                { emoji: "👶", label: "자녀" }, { emoji: "👨‍👧‍👦", label: "형제자매" }, { emoji: "💕", label: "배우자" },
              ].map((t, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 3 }}>{t.emoji}</div>
                  <div style={{ fontSize: 10, color: C.textSub }}>{t.label}</div>
                </div>
              ))}
            </div>

            {/* 공유 방법 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => doShare("kakao")} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#FEE500", border: "none", fontSize: 15, fontWeight: 700, color: "#3C1E1E", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                💬 카카오톡 · SNS로 보내기
              </button>
              <button onClick={() => doShare("save")} style={{ width: "100%", padding: "14px", borderRadius: 12, background: C.primaryLight, border: "none", fontSize: 15, fontWeight: 700, color: C.primary, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                📥 카드 이미지 저장
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => doShare("sms")} style={{ flex: 1, padding: "12px", borderRadius: 12, background: C.bg, border: `1.5px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: F }}>
                  📱 문자
                </button>
                <button onClick={() => doShare("copy")} style={{ flex: 1, padding: "12px", borderRadius: 12, background: C.bg, border: `1.5px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: F }}>
                  📋 텍스트 복사
                </button>
              </div>
              <div style={{ fontSize: 11, color: C.textSub, textAlign: "center", marginTop: 4, lineHeight: 1.5 }}>
                카카오톡·인스타·라인 등 원하는 앱으로<br />카드 이미지와 함께 바로 전송됩니다
              </div>
            </div>

            <button onClick={() => setSharePopup(null)} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "none", border: "none", fontSize: 14, color: C.textSub, cursor: "pointer", fontFamily: F, marginTop: 8 }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {step === STEPS.INTERSTITIAL && <InterstitialPage />}

      {tab === TABS.DAILY && <DailyTab />}
      {tab === TABS.COMMUNITY && <CommunityTab />}

      {tab === TABS.HOME && step === STEPS.LANDING && <Landing />}
      {tab === TABS.HOME && step === STEPS.BASIC_INFO && <BasicInfo />}
      {tab === TABS.HOME && step === STEPS.PHYSICAL && <ThreeLevelPage title="신체기능" stepNum={2} label="STEP 2 · 신체 (13)" items={physicalItems} data={physical} setData={setPhysical} prevStep={STEPS.BASIC_INFO} nextStepTarget={STEPS.SOCIAL} nextLabel="사회생활" />}
      {tab === TABS.HOME && step === STEPS.SOCIAL && <ThreeLevelPage title="사회생활" stepNum={3} label="STEP 3 · 사회 (10)" items={socialItems} data={social} setData={setSocial} prevStep={STEPS.PHYSICAL} nextStepTarget={STEPS.COGNITION} nextLabel="인지기능" />}
      {tab === TABS.HOME && step === STEPS.COGNITION && <YesNoPage title="인지기능" stepNum={4} label="STEP 4 · 인지 (10)" items={cognitionItems} data={cognition} setData={setCognition} prevStep={STEPS.SOCIAL} nextStepTarget={STEPS.BEHAVIOR} nextLabel="행동변화" />}
      {tab === TABS.HOME && step === STEPS.BEHAVIOR && <YesNoPage title="행동변화" stepNum={5} label="STEP 5 · 행동 (10)" items={behaviorItems} data={behavior} setData={setBehavior} prevStep={STEPS.COGNITION} nextStepTarget={STEPS.NURSING} nextLabel="간호처치" />}
      {tab === TABS.HOME && step === STEPS.NURSING && <NursingPage />}
      {tab === TABS.HOME && step === STEPS.RESULT && <ResultPage />}
      {tab === TABS.HOME && step === STEPS.CONSULT && <ConsultPage />}
      {tab === TABS.HOME && step === STEPS.COST_CALC && <CostCalcPage />}
      {tab === TABS.HOME && step === STEPS.COST_RESULT && <CostResultPage />}
      {tab === TABS.HOME && step === STEPS.CHECKLIST && <ChecklistPage />}
      {tab === TABS.HOME && step === STEPS.AREA_CHECK && <AreaCheckPage />}
      {tab === TABS.HOME && step === STEPS.AREA_RESULT && <AreaResultPage />}

      <TabBar />

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
