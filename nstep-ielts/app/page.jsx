"use client";
import { useState, useCallback, useEffect } from "react";
import { loadStudents, saveStudent, deleteStudent as dbDelete } from "../lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

/* ═══ BAND CONVERSION ═══ */
const L_BAND = [[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[20,5.5],[16,5],[13,4.5],[10,4],[7,3.5],[5,3],[3,2.5],[2,2]];
const AR_BAND = [[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[7,3.5],[5,3],[3,2.5],[2,2]];
const GR_BAND = [[40,9],[39,8.5],[38,8],[36,7.5],[34,7],[32,6.5],[30,6],[27,5.5],[23,5],[19,4.5],[15,4],[12,3.5],[9,3],[6,2.5],[4,2]];

function rawToBand(raw, table) {
  if (raw <= 0) return 0;
  for (var i = 0; i < table.length; i++) {
    if (raw >= table[i][0]) return table[i][1];
  }
  return 1;
}

function overallBand(l, r, w, s) {
  var avg = (l + r + w + s) / 4;
  var d = avg - Math.floor(avg);
  if (d >= 0.75) return Math.ceil(avg);
  if (d >= 0.25) return Math.floor(avg) + 0.5;
  return Math.floor(avg);
}

function crAvg(obj, keys) {
  var sum = 0;
  for (var i = 0; i < keys.length; i++) sum += (obj[keys[i]] || 0);
  return Math.round((sum / keys.length) * 2) / 2;
}

/* ═══ TEST STRUCTURE ═══ */
var LISTEN_T = [
  { id: "s1", label: "S1", desc: "일상대화", types: [{ n: "Form Completion", t: 5 }, { n: "Multiple Choice", t: 5 }] },
  { id: "s2", label: "S2", desc: "모놀로그", types: [{ n: "MC", t: 4 }, { n: "Map/Plan", t: 3 }, { n: "Sentence Comp", t: 3 }] },
  { id: "s3", label: "S3", desc: "학술토론", types: [{ n: "MC", t: 4 }, { n: "Matching", t: 3 }, { n: "Summary", t: 3 }] },
  { id: "s4", label: "S4", desc: "학술강의", types: [{ n: "Sentence Comp", t: 5 }, { n: "Note Comp", t: 5 }] }
];

var READ_AC = [
  { id: "p1", label: "P1", desc: "사실적 지문", types: [{ n: "T/F/NG", t: 5 }, { n: "Sentence Comp", t: 4 }, { n: "Summary", t: 4 }] },
  { id: "p2", label: "P2", desc: "서술적 지문", types: [{ n: "Heading Match", t: 5 }, { n: "Info Match", t: 4 }, { n: "MC", t: 4 }] },
  { id: "p3", label: "P3", desc: "논증 지문", types: [{ n: "MC", t: 4 }, { n: "Y/N/NG", t: 5 }, { n: "Sent End Match", t: 5 }] }
];

var READ_GT = [
  { id: "s1", label: "S1", desc: "생존영어", types: [{ n: "T/F/NG", t: 5 }, { n: "Matching", t: 4 }, { n: "Short Ans", t: 5 }] },
  { id: "s2", label: "S2", desc: "직장관련", types: [{ n: "Heading", t: 5 }, { n: "MC", t: 4 }, { n: "T/F/NG", t: 4 }] },
  { id: "s3", label: "S3", desc: "일반 긴 지문", types: [{ n: "MC", t: 4 }, { n: "Y/N/NG", t: 5 }, { n: "Summary", t: 4 }] }
];

var WC_KEYS = ["ta", "cc", "lr", "gra"];
var SC_KEYS = ["fc", "lr", "gra", "pron"];
var W_LABELS = ["Task Ach.", "Coh. & Coh.", "Lexical", "Grammar"];
var S_LABELS = ["Fluency", "Lexical", "Grammar", "Pronun."];

var ETAGS = {
  listening: ["Spelling오류", "숫자실수", "Distractor", "Map혼동", "Prediction부족", "S3-4집중력", "복수답누락", "단복수혼동", "속도놓침", "Signpost놓침", "동의어실패", "대문자실수", "Paraphrase부족", "받아쓰기약함"],
  reading: ["시간배분실패", "Skimming부족", "Scanning부족", "NG vs F혼동", "지문외지식", "의견vs사실", "Heading현혹", "Matching키워드", "Summary문법", "MC부분정답", "Paraphrase부족", "순서혼동", "어휘부족", "P3시간부족"],
  writing: ["관사오류", "시제혼동", "시제일관성", "수일치", "전치사", "수동태", "반복단어", "Paraphrase부족", "Collocation", "어휘낮음", "철자", "Konglish", "접속사과다", "서론Hook부족", "Thesis불명확", "TopicSent부족", "근거부족", "논리비약", "T1Overview누락", "T1비교부족", "Off-topic", "글자수미달", "단락구분부족"],
  speaking: ["침묵3초+", "Filler과다", "Self-correction", "답변짧음", "구조없음", "P2시간부족", "P3깊이부족", "발음불명확", "강세오류", "억양단조", "th/r/l혼동", "아이디어부족", "주제이탈", "문법반복", "어휘반복", "한국어어순", "Discourse부족"]
};

var HW_LIST = [
  { id: "wt1", lb: "W-T1" }, { id: "wt2", lb: "W-T2" }, { id: "rd", lb: "Reading" },
  { id: "ls", lb: "Listening" }, { id: "sh", lb: "쉐도잉" }, { id: "di", lb: "받아쓰기" },
  { id: "vc", lb: "어휘" }, { id: "gr", lb: "문법" }, { id: "sp", lb: "Speaking" },
  { id: "mk", lb: "모의고사" }, { id: "cr", lb: "오답정리" }, { id: "ot", lb: "기타" }
];

var STAT = [{ id: "active", lb: "수강중", c: "#22c55e" }, { id: "paused", lb: "휴강", c: "#eab308" }, { id: "completed", lb: "수료", c: "#8b8fa3" }];
var OUTC = [{ id: "none", lb: "미정", c: "#8b8fa3" }, { id: "achieved", lb: "달성", c: "#22c55e" }, { id: "not_achieved", lb: "미달성", c: "#f97316" }, { id: "refund", lb: "환불", c: "#ef4444" }];
var BANDS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function bclr(b) { if (b >= 7) return "#22c55e"; if (b >= 6) return "#84cc16"; if (b >= 5) return "#eab308"; if (b >= 4) return "#f97316"; return "#ef4444"; }
function dday(d) { if (!d) return "—"; var x = Math.ceil((new Date(d) - new Date()) / 86400000); return x > 0 ? "D-" + x : x === 0 ? "D-Day" : "D+" + Math.abs(x); }

function qtRaw(secs, data) {
  var total = 0;
  secs.forEach(function (sec) { sec.types.forEach(function (tp, ti) { total += (data && data[sec.id] && data[sec.id][ti]) || 0; }); });
  return total;
}

function calcAll(a, tt) {
  var lr = qtRaw(LISTEN_T, a.lQt);
  var lb = rawToBand(lr, L_BAND);
  var rt = tt === "general" ? READ_GT : READ_AC;
  var rr = qtRaw(rt, a.rQt);
  var rb = rawToBand(rr, tt === "general" ? GR_BAND : AR_BAND);
  var wt1avg = WC_KEYS.reduce(function (s, k) { return s + (a.w.t1[k] || 0); }, 0) / 4;
  var wt2avg = WC_KEYS.reduce(function (s, k) { return s + (a.w.t2[k] || 0); }, 0) / 4;
  var wb = Math.round((wt1avg / 3 + wt2avg * 2 / 3) * 2) / 2;
  var sb = crAvg(a.s, SC_KEYS);
  var ov = overallBand(lb, rb, wb, sb);
  return { lr: lr, lb: lb, rr: rr, rb: rb, wb: wb, sb: sb, ov: ov };
}

/* ═══ THEME ═══ */
var X = { bg: "#070d1e", s1: "#0c1529", s2: "#111d35", s3: "#1a2d52", bd: "#1e3a6e", tx: "#e8ecf4", txm: "#7b8fad", ac: "#2979ff", acS: "rgba(41,121,255,0.1)", g: "#22c55e", y: "#eab308", o: "#f97316", r: "#ef4444", p: "#7c8cf8" };
var FT = "'Outfit','Pretendard',sans-serif";
var MO = "'JetBrains Mono',monospace";

function is(extra) { return Object.assign({ width: "100%", padding: "6px 9px", background: X.bg, border: "1px solid " + X.bd, borderRadius: 6, color: X.tx, fontSize: 13, fontFamily: FT, outline: "none", boxSizing: "border-box" }, extra || {}); }
var cs = { background: X.s1, border: "1px solid " + X.bd, borderRadius: 10 };
var bp = { background: X.ac, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 7, fontFamily: FT, fontSize: 12, fontWeight: 600, cursor: "pointer" };
var bg = { background: "none", color: X.txm, border: "1px solid " + X.bd, padding: "6px 12px", borderRadius: 7, fontFamily: FT, fontSize: 12, cursor: "pointer" };

/* ═══ SHARED ═══ */
function Chip(props) {
  var c = props.color || X.ac;
  var st = { background: props.active ? c + "18" : "none", color: props.active ? c : X.txm, border: "1px solid " + (props.active ? c + "35" : X.bd), padding: "3px 10px", borderRadius: 7, cursor: "pointer", fontFamily: FT, fontSize: 11, fontWeight: props.active ? 600 : 400 };
  return ( <button onClick={props.onClick} style={st}>{props.children}</button> );
}

function LI(props) {
  return (
    <div style={Object.assign({ marginBottom: 5 }, props.style || {})}>
      <div style={{ fontSize: 10, color: X.txm, marginBottom: 1, fontWeight: 500 }}>{props.label}</div>
      {props.children}
    </div>
  );
}

function BS(props) {
  return (
    <select value={props.value} onChange={props.onChange} style={is(Object.assign({ fontFamily: MO, textAlign: "center", color: bclr(props.value), fontWeight: 700 }, props.style || {}))}>
      {BANDS.map(function (b) { return ( <option key={b} value={b}>{b}</option> ); })}
    </select>
  );
}

function ECloud(props) {
  var f = {};
  props.sessions.forEach(function (s) { if (s.eTags) s.eTags.forEach(function (t) { f[t] = (f[t] || 0) + 1; }); });
  var sorted = Object.entries(f).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 15);
  if (!sorted.length) return ( <span style={{ fontSize: 11, color: X.txm }}>데이터 없음</span> );
  var mx = sorted[0][1];
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {sorted.map(function (item) { return ( <span key={item[0]} style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: "rgba(239,68,68," + (0.08 + item[1] / mx * 0.2) + ")", color: X.r }}>{item[0]} ({item[1]})</span> ); })}
    </div>
  );
}

/* ═══ CALENDAR PICKER ═══ */
function CalPick(props) {
  var value = props.value;
  var onChange = props.onChange;
  var _o = useState(false);
  var open = _o[0]; var setOpen = _o[1];
  var today = new Date();
  var _vd = useState(value ? new Date(value) : today);
  var vd = _vd[0]; var setVd = _vd[1];
  var y = vd.getFullYear();
  var m = vd.getMonth();
  var fd = new Date(y, m, 1).getDay();
  var dim = new Date(y, m + 1, 0).getDate();
  var days = [];
  var i;
  for (i = 0; i < fd; i++) days.push(null);
  for (i = 1; i <= dim; i++) days.push(i);
  var todayStr = today.toISOString().split("T")[0];
  var MS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={function () { setOpen(!open); }} style={is({ cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6 })}>
        <span>📅</span><span>{value || "날짜 선택"}</span>
      </button>
      {open && (
        <div>
          <div onClick={function () { setOpen(false); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />
          <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 999, background: X.s1, border: "1px solid " + X.bd, borderRadius: 10, padding: 12, width: 260, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <button onClick={function () { setVd(new Date(y, m - 1, 1)); }} style={{ background: "none", border: "none", color: X.txm, cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{y}년 {MS[m]}</span>
              <button onClick={function () { setVd(new Date(y, m + 1, 1)); }} style={{ background: "none", border: "none", color: X.txm, cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {["일","월","화","수","목","금","토"].map(function (w) { return ( <div key={w} style={{ textAlign: "center", fontSize: 10, color: X.txm, padding: 2 }}>{w}</div> ); })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {days.map(function (d, idx) {
                if (!d) return ( <div key={idx} /> );
                var ds = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
                var isT = ds === todayStr;
                var isS = ds === value;
                return (
                  <button key={idx} onClick={function () { onChange(ds); setOpen(false); }} style={{
                    background: isS ? X.ac : isT ? X.ac + "20" : "none",
                    color: isS ? "#fff" : isT ? X.ac : X.tx,
                    border: isT && !isS ? "1px solid " + X.ac : "1px solid transparent",
                    borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 12, fontFamily: FT
                  }}>{d}</button>
                );
              })}
            </div>
            <button onClick={function () { var t = today.toISOString().split("T")[0]; setVd(today); onChange(t); setOpen(false); }} style={{ width: "100%", marginTop: 6, background: X.acS, color: X.ac, border: "none", padding: "4px 0", borderRadius: 5, cursor: "pointer", fontFamily: FT, fontSize: 11 }}>오늘</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ QT SCORING ═══ */
function QtScore(props) {
  var secs = props.sections;
  var data = props.data || {};
  var onChange = props.onChange;
  var totalC = 0;
  var totalQ = 0;
  secs.forEach(function (sec) { sec.types.forEach(function (tp, ti) { totalQ += tp.t; totalC += (data[sec.id] && data[sec.id][ti]) || 0; }); });

  return (
    <div>
      {secs.map(function (sec) {
        var secC = 0;
        sec.types.forEach(function (tp, ti) { secC += (data[sec.id] && data[sec.id][ti]) || 0; });
        return (
          <div key={sec.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{sec.label} <span style={{ fontSize: 10, color: X.txm }}>{sec.desc}</span></span>
              <span style={{ fontFamily: MO, fontSize: 12, color: X.ac }}>{secC}/{sec.types.reduce(function (a, t) { return a + t.t; }, 0)}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {sec.types.map(function (tp, ti) {
                var val = (data[sec.id] && data[sec.id][ti]) || 0;
                var clr = val === tp.t ? X.g : val === 0 ? X.r : X.y;
                return (
                  <div key={ti} style={{ display: "flex", alignItems: "center", gap: 4, background: X.bg, borderRadius: 5, padding: "3px 8px" }}>
                    <span style={{ fontSize: 10, color: X.txm }}>{tp.n}</span>
                    <input type="number" min={0} max={tp.t} value={val}
                      onChange={function (e) {
                        var next = Object.assign({}, data);
                        next[sec.id] = Object.assign({}, next[sec.id] || {});
                        next[sec.id][ti] = Math.min(Number(e.target.value), tp.t);
                        onChange(next);
                      }}
                      style={is({ width: 36, fontFamily: MO, textAlign: "center", fontSize: 12, fontWeight: 700, padding: "2px 4px", color: clr })} />
                    <span style={{ fontSize: 10, color: X.txm }}>/{tp.t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ textAlign: "right", fontFamily: MO, fontSize: 13, fontWeight: 700 }}>
        합계: <span style={{ color: X.ac }}>{totalC}/{totalQ}</span>
      </div>
    </div>
  );
}

/* ═══ DEFAULTS ═══ */
function mkA() { return { testUsed: "Cambridge IELTS 19 Ac Test 1", lQt: {}, rQt: {}, w: { t1: { ta: 0, cc: 0, lr: 0, gra: 0 }, t2: { ta: 0, cc: 0, lr: 0, gra: 0 }, cm: "" }, s: { fc: 0, lr: 0, gra: 0, pron: 0, cm: "" }, sum: "" }; }
function mkS(n) { return { id: uid(), dt: new Date().toISOString().split("T")[0], num: n, mock: false, dur: 60, foc: [], att: true, lQt: {}, rQt: {}, wCr: { ta: 0, cc: 0, lr: 0, gra: 0 }, sCr: { fc: 0, lr: 0, gra: 0, pron: 0 }, eTags: [], eNotes: "", str: "", weak: "", hw: [], wCont: "", wFeed: "", sExpr: "", sPron: "", notes: "", qtSel: {}, qtNt: {} }; }
function mkG() { return { long: "", short: "", weekly: "" }; }
function mkI() { return { name: "", email: "", phone: "", age: "20대", plat: "숨고", loc: "", tt: "academic", tgt: 7, tDate: "", bg: "", pref: "1:1", avail: "", purp: "유학", req: "" }; }

/* ═══ APP ═══ */
export default function App() {
  var _s = useState([]);
  var students = _s[0]; var setStudents = _s[1];
  var _loaded = useState(false);
  var loaded = _loaded[0]; var setLoaded = _loaded[1];

  // Load from Supabase on mount
  useEffect(function () {
    loadStudents().then(function (data) {
      if (data && data.length > 0) setStudents(data);
      setLoaded(true);
    });
  }, []);
  var _v = useState("list");
  var view = _v[0]; var setView = _v[1];
  var _si = useState(null);
  var selId = _si[0]; var setSelId = _si[1];
  var _t = useState("overview");
  var tab = _t[0]; var setTab = _t[1];
  var _e = useState(null);
  var editId = _e[0]; var setEditId = _e[1];
  var _sh = useState(false);
  var showI = _sh[0]; var setShowI = _sh[1];
  var _in = useState(mkI);
  var intake = _in[0]; var setIntake = _in[1];
  var _sr = useState("");
  var search = _sr[0]; var setSearch = _sr[1];
  var _sf = useState("all");
  var stFilt = _sf[0]; var setStFilt = _sf[1];

  var student = students.find(function (s) { return s.id === selId; });

  var _saveTimer = useState(null);
  var saveTimer = _saveTimer[0]; var setSaveTimer = _saveTimer[1];

  var upd = useCallback(function (id, fn) {
    setStudents(function (prev) {
      var updated = prev.map(function (s) {
        if (s.id !== id) return s;
        var result = typeof fn === "function" ? fn(s) : Object.assign({}, s, fn);
        // Debounced save to Supabase
        setTimeout(function () { saveStudent(result); }, 500);
        return result;
      });
      return updated;
    });
  }, []);

  function addSt() {
    if (!intake.name.trim()) return;
    var ns = Object.assign({ id: uid(), status: "active", outcome: "none", finalS: null, assess: mkA(), sess: [], goals: mkG() }, intake);
    setStudents(function (p) { return p.concat([ns]); });
    saveStudent(ns);
    setIntake(mkI()); setShowI(false);
  }

  function delSt(id) {
    if (!confirm("삭제?")) return;
    setStudents(function (p) { return p.filter(function (s) { return s.id !== id; }); });
    dbDelete(id);
    if (selId === id) { setView("list"); setSelId(null); }
  }

  function openSt(id) { setSelId(id); setView("student"); setTab("overview"); setEditId(null); }

  var filtered = students.filter(function (s) {
    if (stFilt !== "all" && s.status !== stFilt) return false;
    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  /* ─── LIST ─── */
  if (view === "list") {
    var comp = students.filter(function (s) { return s.status === "completed"; });
    var ach = comp.filter(function (s) { return s.outcome === "achieved"; });
    var ho = comp.filter(function (s) { return s.outcome !== "none"; });

    return (
      <div style={{ fontFamily: FT, background: X.bg, color: X.tx, minHeight: "100vh", maxWidth: 1200, margin: "0 auto", padding: "18px 16px" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <img src={"data:image/png;base64,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"} alt="N" style={{ width: 38, height: 38, borderRadius: 6 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>
              <span style={{ color: "#1a3f8b" }}>N</span><span style={{ color: "#4a6fa5" }}>step</span><span style={{ color: "#ffffff" }}>IELTS</span>
              <span style={{ color: X.txm, fontSize: 14, fontWeight: 400, marginLeft: 8 }}>학생관리</span>
            </h1>
            <p style={{ margin: "2px 0 0", color: X.txm, fontSize: 12 }}>문제유형별 진단 · 공식 채점 · AI 커리큘럼 · 성과 분석</p>
          </div>
        </div>

        {students.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 16 }}>
            {[["활성", students.filter(function (s) { return s.status === "active"; }).length + "명", X.ac], ["수료", comp.length + "명", X.txm], ["달성률", ho.length ? Math.round(ach.length / ho.length * 100) + "%" : "—", X.g], ["달성", ach.length + "명", X.g], ["미달성", comp.filter(function (s) { return s.outcome === "not_achieved"; }).length + "명", X.o], ["환불", comp.filter(function (s) { return s.outcome === "refund"; }).length + "명", X.r]].map(function (arr, i) {
              return (
                <div key={i} style={{ background: X.s2, borderRadius: 8, padding: "10px 8px", textAlign: "center", border: "1px solid " + X.bd }}>
                  <div style={{ fontSize: 10, color: X.txm }}>{arr[0]}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MO, color: arr[2] }}>{arr[1]}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="검색..." value={search} onChange={function (e) { setSearch(e.target.value); }} style={is({ flex: 1, minWidth: 180 })} />
          <div style={{ display: "flex", gap: 4 }}>
            <Chip active={stFilt === "all"} onClick={function () { setStFilt("all"); }}>전체</Chip>
            {STAT.map(function (st) {
              return ( <Chip key={st.id} active={stFilt === st.id} onClick={function () { setStFilt(st.id); }} color={st.c}>{st.lb}</Chip> );
            })}
          </div>
          <button onClick={function () { setShowI(true); }} style={bp}>+ 새 학생</button>
        </div>

        {showI && (
          <div style={Object.assign({}, cs, { padding: 20, marginBottom: 16 })}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>📋 새 학생</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <LI label="이름 *"><input value={intake.name} onChange={function (e) { setIntake(Object.assign({}, intake, { name: e.target.value })); }} style={is()} /></LI>
              <LI label="시험유형">
                <select value={intake.tt} onChange={function (e) { setIntake(Object.assign({}, intake, { tt: e.target.value })); }} style={is()}>
                  <option value="academic">Academic</option>
                  <option value="general">General Training</option>
                </select>
              </LI>
              <LI label="목표밴드"><BS value={intake.tgt} onChange={function (e) { setIntake(Object.assign({}, intake, { tgt: +e.target.value })); }} /></LI>
              <LI label="시험일"><CalPick value={intake.tDate} onChange={function (v) { setIntake(Object.assign({}, intake, { tDate: v })); }} /></LI>
              <LI label="이메일"><input value={intake.email} onChange={function (e) { setIntake(Object.assign({}, intake, { email: e.target.value })); }} style={is()} /></LI>
              <LI label="전화"><input value={intake.phone} onChange={function (e) { setIntake(Object.assign({}, intake, { phone: e.target.value })); }} style={is()} /></LI>
            </div>
            <LI label="영어배경/요청"><textarea value={intake.bg} onChange={function (e) { setIntake(Object.assign({}, intake, { bg: e.target.value })); }} style={Object.assign({}, is(), { height: 40, resize: "vertical" })} /></LI>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button onClick={function () { setShowI(false); setIntake(mkI()); }} style={bg}>취소</button>
              <button onClick={addSt} style={bp}>등록</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? ( <div style={{ textAlign: "center", padding: 36, color: X.txm }}>학생 없음</div> ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 12 }}>
            {filtered.map(function (s) {
              var sc = calcAll(s.assess, s.tt);
              var so = STAT.find(function (x) { return x.id === s.status; });
              return (
                <div key={s.id} onClick={function () { openSt(s.id); }} style={Object.assign({}, cs, { padding: 18, cursor: "pointer", position: "relative" })}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{s.name}</h3>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: so.c + "18", color: so.c, fontWeight: 600 }}>{so.lb}</span>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: X.s3, color: X.txm }}>{s.tt === "academic" ? "Ac" : "GT"}</span>
                      </div>
                      <p style={{ margin: "3px 0 0", fontSize: 11, color: X.txm }}>목표 {s.tgt} · {s.sess.length}회{s.tDate ? " · " + dday(s.tDate) : ""}</p>
                    </div>
                    {sc.ov > 0 && ( <div style={{ background: bclr(sc.ov) + "20", color: bclr(sc.ov), padding: "3px 9px", borderRadius: 8, fontFamily: MO, fontWeight: 700, fontSize: 15 }}>{sc.ov}</div> )}
                  </div>
                  <button onClick={function (e) { e.stopPropagation(); delSt(s.id); }} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: X.txm, cursor: "pointer", fontSize: 11, opacity: 0.3 }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ─── STUDENT ─── */
  if (!student) return null;
  var tabList = [["overview", "📊 종합"], ["assess", "🎯 진단"], ["sess", "📝 수업"], ["curr", "📐 커리큘럼"], ["prog", "📈 성장"], ["outc", "🏆 결과"]];

  return (
    <div style={{ fontFamily: FT, background: X.bg, color: X.tx, minHeight: "100vh", maxWidth: 1200, margin: "0 auto", padding: "18px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <button onClick={function () { setView("list"); setEditId(null); }} style={Object.assign({}, bg, { padding: "5px 12px", fontSize: 13 })}>← 목록</button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{student.name}</h1>
        <select value={student.status} onChange={function (e) { upd(student.id, { status: e.target.value }); }} style={is({ width: 100, fontSize: 11, padding: "3px 6px" })}>
          {STAT.map(function (st) { return ( <option key={st.id} value={st.id}>{st.lb}</option> ); })}
        </select>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: X.txm }}>{student.tt === "academic" ? "Academic" : "GT"} · 목표 {student.tgt}{student.tDate ? " · " + dday(student.tDate) : ""}</p>
      <div style={{ display: "flex", gap: 2, marginBottom: 18, overflowX: "auto", borderBottom: "1px solid " + X.bd, paddingBottom: 1 }}>
        {tabList.map(function (item) {
          return ( <button key={item[0]} onClick={function () { setTab(item[0]); setEditId(null); }} style={{ background: tab === item[0] ? X.acS : "none", color: tab === item[0] ? X.ac : X.txm, border: "none", padding: "8px 12px", borderRadius: "7px 7px 0 0", cursor: "pointer", fontFamily: FT, fontSize: 12, fontWeight: tab === item[0] ? 600 : 400, whiteSpace: "nowrap" }}>{item[1]}</button> );
        })}
      </div>
      {tab === "overview" && ( <Overview st={student} /> )}
      {tab === "assess" && ( <Assess st={student} upd={upd} /> )}
      {tab === "sess" && ( <Sess st={student} upd={upd} editId={editId} setEditId={setEditId} /> )}
      {tab === "curr" && ( <Curr st={student} upd={upd} /> )}
      {tab === "prog" && ( <Prog st={student} /> )}
      {tab === "outc" && ( <Outc st={student} upd={upd} /> )}
    </div>
  );
}

/* ═══ OVERVIEW ═══ */
function Overview(props) {
  var st = props.st;
  var sc = calcAll(st.assess, st.tt);
  var ss = st.sess;
  var hwT = 0; var hwD = 0;
  ss.forEach(function (s) { hwT += s.hw.length; s.hw.forEach(function (h) { if (h.done) hwD++; }); });
  var att = ss.length ? Math.round(ss.filter(function (s) { return s.att; }).length / ss.length * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
        {[["L", sc.lb, bclr(sc.lb)], ["R", sc.rb, bclr(sc.rb)], ["W", sc.wb, bclr(sc.wb)], ["S", sc.sb, bclr(sc.sb)], ["OA", sc.ov, bclr(sc.ov)], ["출석", att + "%", att >= 80 ? X.g : X.r], ["숙제", hwT ? Math.round(hwD / hwT * 100) + "%" : "—", X.g]].map(function (arr, i) {
          return (
            <div key={i} style={{ background: X.s2, borderRadius: 8, padding: "10px 6px", textAlign: "center", border: "1px solid " + X.bd }}>
              <div style={{ fontSize: 10, color: X.txm }}>{arr[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MO, color: arr[2] }}>{arr[1]}</div>
            </div>
          );
        })}
      </div>
      <div style={Object.assign({}, cs, { padding: 16 })}>
        <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>초기 vs 목표</h4>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={[
            { subject: "L", "초기": sc.lb, "목표": st.tgt },
            { subject: "R", "초기": sc.rb, "목표": st.tgt },
            { subject: "W", "초기": sc.wb, "목표": st.tgt },
            { subject: "S", "초기": sc.sb, "목표": st.tgt }
          ]}>
            <PolarGrid stroke={X.bd} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: X.txm, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 9]} tick={{ fill: X.txm, fontSize: 10 }} />
            <Radar name="초기" dataKey="초기" stroke={X.o} fill={X.o} fillOpacity={0.1} />
            <Radar name="목표" dataKey="목표" stroke={X.g} fill="none" strokeDasharray="4 4" />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div style={Object.assign({}, cs, { padding: 16 })}>
        <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>진단 결과</h4>
        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <div>🎧 <span style={{ fontFamily: MO, color: bclr(sc.lb) }}>{sc.lr}/40 → Band {sc.lb}</span></div>
          <div>📖 <span style={{ fontFamily: MO, color: bclr(sc.rb) }}>{sc.rr}/40 → Band {sc.rb}</span></div>
          <div>✍️ <span style={{ fontFamily: MO, color: bclr(sc.wb) }}>Band {sc.wb}</span></div>
          <div>🗣️ <span style={{ fontFamily: MO, color: bclr(sc.sb) }}>Band {sc.sb}</span></div>
        </div>
      </div>
      <div style={Object.assign({}, cs, { padding: 16 })}>
        <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>통계</h4>
        <div style={{ fontSize: 12, color: X.txm, lineHeight: 2 }}>
          <div>수업 {ss.length}회 · 모의고사 {ss.filter(function (s) { return s.mock; }).length}회</div>
          <div>결석 {ss.filter(function (s) { return !s.att; }).length}회 · 출석률 {att}%</div>
          <div>숙제 완료율 {hwT ? Math.round(hwD / hwT * 100) + "%" : "—"}</div>
        </div>
        <h4 style={{ margin: "14px 0 10px", fontSize: 13, fontWeight: 600 }}>문제 패턴</h4>
        <ECloud sessions={ss} />
      </div>
    </div>
  );
}

/* ═══ ASSESSMENT ═══ */
function Assess(props) {
  var st = props.st; var upd = props.upd;
  var a = st.assess;
  var sc = calcAll(a, st.tt);
  var rT = st.tt === "general" ? READ_GT : READ_AC;
  var _at = useState("listening");
  var aTab = _at[0]; var setATab = _at[1];

  function setA(path, val) {
    upd(st.id, function (prev) {
      var n = Object.assign({}, prev, { assess: JSON.parse(JSON.stringify(prev.assess)) });
      var parts = path.split(".");
      var obj = n.assess;
      for (var i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = val;
      return n;
    });
  }

  return (
    <div>
      {/* Test info */}
      <div style={Object.assign({}, cs, { padding: "14px 18px", marginBottom: 12 })}>
        <LI label="사용 테스트"><input value={a.testUsed} onChange={function (e) { setA("testUsed", e.target.value); }} style={is()} /></LI>
      </div>

      {/* Score banner - always visible */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 12 }}>
        {[
          ["🎧 L", sc.lr + "/40", sc.lb, "listening"],
          ["📖 R", sc.rr + "/40", sc.rb, "reading"],
          ["✍️ W", "—", sc.wb, "writing"],
          ["🗣️ S", "—", sc.sb, "speaking"],
          ["Overall", "", sc.ov, null]
        ].map(function (arr) {
          var isActive = arr[3] && aTab === arr[3];
          return (
            <div key={arr[0]}
              onClick={arr[3] ? function () { setATab(arr[3]); } : undefined}
              style={{
                background: isActive ? X.ac + "15" : X.s2,
                border: isActive ? "2px solid " + X.ac : "1px solid " + X.bd,
                borderRadius: 10, padding: "10px 6px", textAlign: "center",
                cursor: arr[3] ? "pointer" : "default", transition: "all .15s"
              }}>
              <div style={{ fontSize: 10, color: X.txm }}>{arr[0]}</div>
              {arr[1] && ( <div style={{ fontSize: 11, color: X.txm, fontFamily: MO }}>{arr[1]}</div> )}
              <div style={{ fontSize: arr[0] === "Overall" ? 26 : 20, fontWeight: 700, fontFamily: MO, color: arr[0] === "Overall" ? X.ac : bclr(arr[2]) }}>{arr[2] || "—"}</div>
            </div>
          );
        })}
      </div>

      {/* Section content */}
      <div style={Object.assign({}, cs, { padding: 18 })}>

        {/* LISTENING */}
        {aTab === "listening" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>🎧 Listening — 섹션별 문제유형 채점</h4>
              <div style={{ fontFamily: MO, fontWeight: 700, fontSize: 14 }}>
                <span style={{ color: X.ac }}>{sc.lr}/40</span>
                <span style={{ color: X.txm }}> = </span>
                <span style={{ color: bclr(sc.lb) }}>Band {sc.lb}</span>
              </div>
            </div>
            <QtScore sections={LISTEN_T} data={a.lQt} onChange={function (v) { setA("lQt", v); }} />
          </div>
        )}

        {/* READING */}
        {aTab === "reading" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>📖 Reading ({st.tt === "general" ? "GT" : "Academic"}) — 지문별 문제유형 채점</h4>
              <div style={{ fontFamily: MO, fontWeight: 700, fontSize: 14 }}>
                <span style={{ color: X.ac }}>{sc.rr}/40</span>
                <span style={{ color: X.txm }}> = </span>
                <span style={{ color: bclr(sc.rb) }}>Band {sc.rb}</span>
              </div>
            </div>
            <QtScore sections={rT} data={a.rQt} onChange={function (v) { setA("rQt", v); }} />
          </div>
        )}

        {/* WRITING */}
        {aTab === "writing" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>✍️ Writing — Task별 세부기준 채점</h4>
              <div style={{ fontFamily: MO, fontWeight: 700, fontSize: 14, color: bclr(sc.wb) }}>Band {sc.wb}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {["t1", "t2"].map(function (tid) {
                var taskAvg = WC_KEYS.reduce(function (s, k) { return s + (a.w[tid] ? a.w[tid][k] || 0 : 0); }, 0) / 4;
                var taskBand = Math.round(taskAvg * 2) / 2;
                return (
                  <div key={tid} style={{ background: X.bg, borderRadius: 8, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{tid === "t1" ? "Task 1" : "Task 2"} <span style={{ fontSize: 10, color: X.txm, fontWeight: 400 }}>{tid === "t1" ? "(1/3 가중)" : "(2/3 가중)"}</span></span>
                      <span style={{ fontFamily: MO, fontWeight: 700, color: bclr(taskBand) }}>{taskBand}</span>
                    </div>
                    {W_LABELS.map(function (lb, i) {
                      var ck = WC_KEYS[i];
                      var val = a.w[tid] ? a.w[tid][ck] || 0 : 0;
                      return (
                        <div key={ck} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, flex: 1 }}>{lb}</span>
                          <BS value={val} onChange={function (e) { setA("w." + tid + "." + ck, +e.target.value); }} style={{ width: 65, fontSize: 12 }} />
                          <div style={{ width: 50, height: 4, background: X.s3, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: (val / 9 * 100) + "%", height: "100%", background: bclr(val), borderRadius: 2 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <LI label="Writing 코멘트" style={{ marginTop: 10 }}>
              <textarea value={a.w.cm || ""} onChange={function (e) { setA("w.cm", e.target.value); }} placeholder="반복 오류, 구조 문제, 어휘 수준 등" style={Object.assign({}, is(), { height: 60, resize: "vertical", fontSize: 12 })} />
            </LI>
          </div>
        )}

        {/* SPEAKING */}
        {aTab === "speaking" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14 }}>🗣️ Speaking — 세부기준 채점</h4>
              <div style={{ fontFamily: MO, fontWeight: 700, fontSize: 14, color: bclr(sc.sb) }}>Band {sc.sb}</div>
            </div>
            <div style={{ background: X.bg, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, color: X.txm, marginBottom: 10 }}>Part 1: 일상 질문 (4-5분) · Part 2: Cue Card 발표 (3-4분) · Part 3: 심화 토론 (4-5분)</div>
              {S_LABELS.map(function (lb, i) {
                var ck = SC_KEYS[i];
                var val = a.s[ck] || 0;
                return (
                  <div key={ck} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, flex: 1, minWidth: 100 }}>{lb}</span>
                    <BS value={val} onChange={function (e) { setA("s." + ck, +e.target.value); }} style={{ width: 65, fontSize: 12 }} />
                    <div style={{ width: 80, height: 4, background: X.s3, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: (val / 9 * 100) + "%", height: "100%", background: bclr(val), borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: MO, fontSize: 11, color: bclr(val), minWidth: 20 }}>{val}</span>
                  </div>
                );
              })}
            </div>
            <LI label="Speaking 코멘트" style={{ marginTop: 10 }}>
              <textarea value={a.s.cm || ""} onChange={function (e) { setA("s.cm", e.target.value); }} placeholder="발음 문제, Part별 강약점, 표현력 등" style={Object.assign({}, is(), { height: 60, resize: "vertical", fontSize: 12 })} />
            </LI>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={Object.assign({}, cs, { padding: 14, marginTop: 12 })}>
        <LI label="종합 소견">
          <textarea value={a.sum || ""} onChange={function (e) { setA("sum", e.target.value); }} placeholder="전체 강약점 분석, 커리큘럼 방향 제안" style={Object.assign({}, is(), { height: 60, resize: "vertical" })} />
        </LI>
      </div>

      {/* Overall result */}
      <div style={{ textAlign: "center", fontSize: 9, color: X.txm, marginTop: 8 }}>
        L/R: 공식 Raw→Band 변환 · W: T1(1/3)+T2(2/3) 가중 · S: 4기준 평균 · Overall: IELTS 공식 반올림
      </div>
    </div>
  );
}

/* ═══ SESSIONS ═══ */
function Sess(props) {
  var st = props.st; var upd = props.upd; var editId = props.editId; var setEditId = props.setEditId;
  var ss = st.sess;
  var _mf = useState(false);
  var mf = _mf[0]; var setMf = _mf[1];

  function addS(mock) {
    var ns = mkS(ss.length + 1);
    ns.mock = mock;
    if (mock) ns.foc = ["listening", "reading", "writing", "speaking"];
    upd(st.id, function (p) { return Object.assign({}, p, { sess: p.sess.concat([ns]) }); });
    setEditId(ns.id);
  }

  function updS(sid, u) { upd(st.id, function (p) { return Object.assign({}, p, { sess: p.sess.map(function (s) { return s.id === sid ? Object.assign({}, s, u) : s; }) }); }); }
  function delS(sid) { if (!confirm("삭제?")) return; upd(st.id, function (p) { return Object.assign({}, p, { sess: p.sess.filter(function (s) { return s.id !== sid; }).map(function (s, i) { return Object.assign({}, s, { num: i + 1 }); }) }); }); if (editId === sid) setEditId(null); }

  var editing = ss.find(function (s) { return s.id === editId; });
  var displayed = mf ? ss.filter(function (s) { return s.mock; }) : ss;
  var prevSess = editing ? ss.find(function (s) { return s.num === editing.num - 1; }) : null;

  if (editing) return ( <SessEdit s={editing} updS={updS} close={function () { setEditId(null); }} tt={st.tt} prev={prevSess} /> );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>수업 ({ss.length})</h3>
          <Chip active={!mf} onClick={function () { setMf(false); }}>전체</Chip>
          <Chip active={mf} onClick={function () { setMf(true); }} color={X.p}>모의고사</Chip>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={function () { addS(false); }} style={bp}>+ 수업</button>
          <button onClick={function () { addS(true); }} style={Object.assign({}, bp, { background: X.p })}>+ 모의고사</button>
        </div>
      </div>
      {displayed.length === 0 ? ( <div style={{ textAlign: "center", padding: 36, color: X.txm }}>수업 없음</div> ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {displayed.slice().reverse().map(function (s) {
            return (
              <div key={s.id} onClick={function () { setEditId(s.id); }} style={Object.assign({}, cs, { padding: 12, cursor: "pointer" })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, fontFamily: MO, color: X.ac, fontSize: 13 }}>#{s.num}</span>
                    <span style={{ fontSize: 12, color: X.txm }}>{s.dt}</span>
                    {s.mock && ( <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 10, background: X.p + "20", color: X.p }}>모의고사</span> )}
                    {!s.att && ( <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 10, background: X.r + "20", color: X.r }}>결석</span> )}
                  </div>
                  <button onClick={function (e) { e.stopPropagation(); delS(s.id); }} style={{ background: "none", border: "none", color: X.txm, cursor: "pointer", fontSize: 11 }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══ SESSION EDITOR ═══ */
function SessEdit(props) {
  var init = props.s; var updS = props.updS; var close = props.close; var tt = props.tt; var prev = props.prev;
  var _s = useState(init);
  var s = _s[0]; var setS = _s[1];
  var _as = useState(init.foc[0] || null);
  var actSec = _as[0]; var setActSec = _as[1];

  var rT = tt === "general" ? READ_GT : READ_AC;
  var wBand = crAvg(s.wCr, WC_KEYS);
  var sBand = crAvg(s.sCr, SC_KEYS);
  var prevHW = prev ? prev.hw : [];

  function save() { updS(s.id, s); close(); }
  function set(k, v) { setS(function (p) { return Object.assign({}, p, Object.fromEntries([[k, v]])); }); }
  function toggleFoc(k) { setS(function (p) { var f = p.foc.includes(k) ? p.foc.filter(function (x) { return x !== k; }) : p.foc.concat([k]); return Object.assign({}, p, { foc: f }); }); }
  function toggleTag(t) { setS(function (p) { var tags = p.eTags.includes(t) ? p.eTags.filter(function (x) { return x !== t; }) : p.eTags.concat([t]); return Object.assign({}, p, { eTags: tags }); }); }
  function addHW(type) { var hw = HW_LIST.find(function (h) { return h.id === type; }); setS(function (p) { return Object.assign({}, p, { hw: p.hw.concat([{ id: uid(), type: type, lb: hw.lb, detail: "", done: false }]) }); }); }

  var icons = { listening: "🎧", reading: "📖", writing: "✍️", speaking: "🗣️" };
  var labels = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };

  return (
    <div style={Object.assign({}, cs, { padding: 20 })}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{s.mock ? "📋 모의고사" : "수업"} #{s.num}</h3>
        <div style={{ display: "flex", gap: 6 }}><button onClick={close} style={bg}>취소</button><button onClick={save} style={bp}>💾 저장</button></div>
      </div>

      {prevHW.length > 0 && (
        <div style={{ background: X.y + "08", border: "1px solid " + X.y + "20", borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: X.y, marginBottom: 6 }}>📋 전 수업 숙제 확인 (#{s.num - 1})</div>
          {prevHW.map(function (h) {
            return (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <button onClick={function () {
                  if (prev) {
                    var newHw = prev.hw.map(function (x) { return x.id === h.id ? Object.assign({}, x, { done: !x.done }) : x; });
                    updS(prev.id, { hw: newHw });
                  }
                }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>{h.done ? "✅" : "⬜"}</button>
                <span style={{ fontSize: 12, color: h.done ? X.g : X.txm }}>{h.lb}{h.detail ? " — " + h.detail : ""}</span>
              </div>
            );
          })}
          <div style={{ fontSize: 11, color: X.txm, marginTop: 4 }}>완료: {prevHW.filter(function (h) { return h.done; }).length}/{prevHW.length}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        <LI label="날짜"><CalPick value={s.dt} onChange={function (v) { set("dt", v); }} /></LI>
        <LI label="시간(분)"><input type="number" value={s.dur} onChange={function (e) { set("dur", +e.target.value); }} style={is()} /></LI>
        <LI label="출석">
          <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
            <Chip active={s.att} onClick={function () { set("att", true); }} color={X.g}>출석</Chip>
            <Chip active={!s.att} onClick={function () { set("att", false); }} color={X.r}>결석</Chip>
          </div>
        </LI>
      </div>

      <LI label="포커스">
        <div style={{ display: "flex", gap: 4 }}>
          {["listening", "reading", "writing", "speaking"].map(function (k) {
            return ( <Chip key={k} active={s.foc.includes(k)} onClick={function () { toggleFoc(k); setActSec(k); }}>{icons[k]} {labels[k]}</Chip> );
          })}
        </div>
      </LI>

      {s.foc.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {s.foc.map(function (k) {
              return ( <button key={k} onClick={function () { setActSec(k); }} style={{ background: actSec === k ? X.acS : "none", color: actSec === k ? X.ac : X.txm, border: "1px solid " + (actSec === k ? X.ac + "40" : X.bd), padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontFamily: FT, fontSize: 12 }}>{icons[k]} {labels[k]}</button> );
            })}
          </div>

          {actSec && (
            <div style={{ background: X.bg, borderRadius: 8, padding: 14 }}>
              {actSec === "listening" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>공부한 유형 선택 + 채점</span>
                    <span style={{ fontFamily: MO, fontSize: 12 }}>Raw: <span style={{ color: X.ac }}>{qtRaw(LISTEN_T, s.lQt)}/40</span> → Band <span style={{ color: bclr(rawToBand(qtRaw(LISTEN_T, s.lQt), L_BAND)) }}>{rawToBand(qtRaw(LISTEN_T, s.lQt), L_BAND)}</span></span>
                  </div>
                  {LISTEN_T.map(function (sec) {
                    return (
                      <div key={sec.id} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{sec.label} <span style={{ color: X.txm, fontWeight: 400 }}>{sec.desc}</span></div>
                        {sec.types.map(function (tp, ti) {
                          var key = sec.id + "-" + ti;
                          var selected = s.qtSel[key];
                          var val = (s.lQt[sec.id] && s.lQt[sec.id][ti]) || 0;
                          return (
                            <div key={ti} style={{ marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button onClick={function () { setS(function (p) { var ns = Object.assign({}, p.qtSel); ns[key] = !ns[key]; return Object.assign({}, p, { qtSel: ns }); }); }}
                                  style={{ background: selected ? X.ac + "20" : X.s3, color: selected ? X.ac : X.txm, border: "none", padding: "3px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: selected ? 600 : 400 }}>{tp.n}</button>
                                {selected && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <input type="number" min={0} max={tp.t} value={val}
                                      onChange={function (e) {
                                        setS(function (p) {
                                          var nq = Object.assign({}, p.lQt);
                                          nq[sec.id] = Object.assign({}, nq[sec.id] || {});
                                          nq[sec.id][ti] = Math.min(Number(e.target.value), tp.t);
                                          return Object.assign({}, p, { lQt: nq });
                                        });
                                      }}
                                      style={is({ width: 36, fontFamily: MO, textAlign: "center", fontSize: 12, fontWeight: 700, padding: "2px 4px", color: val === tp.t ? X.g : val === 0 ? X.r : X.y })} />
                                    <span style={{ fontSize: 10, color: X.txm }}>/{tp.t}</span>
                                  </div>
                                )}
                              </div>
                              {selected && (
                                <input value={(s.qtNt[key]) || ""} onChange={function (e) { setS(function (p) { var nn = Object.assign({}, p.qtNt); nn[key] = e.target.value; return Object.assign({}, p, { qtNt: nn }); }); }}
                                  placeholder="이 유형 메모..." style={is({ fontSize: 11, padding: "3px 6px", marginTop: 3, marginLeft: 0 })} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
              {actSec === "reading" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>공부한 유형 선택 + 채점</span>
                    <span style={{ fontFamily: MO, fontSize: 12 }}>Raw: <span style={{ color: X.ac }}>{qtRaw(rT, s.rQt)}/40</span> → Band <span style={{ color: bclr(rawToBand(qtRaw(rT, s.rQt), tt === "general" ? GR_BAND : AR_BAND)) }}>{rawToBand(qtRaw(rT, s.rQt), tt === "general" ? GR_BAND : AR_BAND)}</span></span>
                  </div>
                  {rT.map(function (sec) {
                    return (
                      <div key={sec.id} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{sec.label} <span style={{ color: X.txm, fontWeight: 400 }}>{sec.desc}</span></div>
                        {sec.types.map(function (tp, ti) {
                          var key = sec.id + "-" + ti;
                          var selected = s.qtSel[key];
                          var val = (s.rQt[sec.id] && s.rQt[sec.id][ti]) || 0;
                          return (
                            <div key={ti} style={{ marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <button onClick={function () { setS(function (p) { var ns = Object.assign({}, p.qtSel); ns[key] = !ns[key]; return Object.assign({}, p, { qtSel: ns }); }); }}
                                  style={{ background: selected ? X.ac + "20" : X.s3, color: selected ? X.ac : X.txm, border: "none", padding: "3px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: selected ? 600 : 400 }}>{tp.n}</button>
                                {selected && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <input type="number" min={0} max={tp.t} value={val}
                                      onChange={function (e) {
                                        setS(function (p) {
                                          var nq = Object.assign({}, p.rQt);
                                          nq[sec.id] = Object.assign({}, nq[sec.id] || {});
                                          nq[sec.id][ti] = Math.min(Number(e.target.value), tp.t);
                                          return Object.assign({}, p, { rQt: nq });
                                        });
                                      }}
                                      style={is({ width: 36, fontFamily: MO, textAlign: "center", fontSize: 12, fontWeight: 700, padding: "2px 4px", color: val === tp.t ? X.g : val === 0 ? X.r : X.y })} />
                                    <span style={{ fontSize: 10, color: X.txm }}>/{tp.t}</span>
                                  </div>
                                )}
                              </div>
                              {selected && (
                                <input value={(s.qtNt[key]) || ""} onChange={function (e) { setS(function (p) { var nn = Object.assign({}, p.qtNt); nn[key] = e.target.value; return Object.assign({}, p, { qtNt: nn }); }); }}
                                  placeholder="이 유형 메모..." style={is({ fontSize: 11, padding: "3px 6px", marginTop: 3 })} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
              {actSec === "writing" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>세부기준 → 예상 Band</span>
                    <span style={{ fontFamily: MO, fontSize: 14, fontWeight: 700, color: bclr(wBand) }}>Band {wBand}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                    {W_LABELS.map(function (lb, i) {
                      var ck = WC_KEYS[i];
                      return (
                        <div key={ck}>
                          <div style={{ fontSize: 9, color: X.txm, marginBottom: 2 }}>{lb}</div>
                          <BS value={s.wCr[ck]} onChange={function (e) { setS(function (p) { return Object.assign({}, p, { wCr: Object.assign({}, p.wCr, Object.fromEntries([[ck, +e.target.value]])) }); }); }} style={{ fontSize: 11 }} />
                        </div>
                      );
                    })}
                  </div>
                  <LI label="에세이" style={{ marginTop: 8 }}><textarea value={s.wCont} onChange={function (e) { set("wCont", e.target.value); }} style={Object.assign({}, is(), { height: 60, resize: "vertical", fontSize: 12 })} /></LI>
                  <LI label="첨삭"><textarea value={s.wFeed} onChange={function (e) { set("wFeed", e.target.value); }} style={Object.assign({}, is(), { height: 50, resize: "vertical", fontSize: 12 })} /></LI>
                </div>
              )}
              {actSec === "speaking" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>세부기준 → 예상 Band</span>
                    <span style={{ fontFamily: MO, fontSize: 14, fontWeight: 700, color: bclr(sBand) }}>Band {sBand}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                    {S_LABELS.map(function (lb, i) {
                      var ck = SC_KEYS[i];
                      return (
                        <div key={ck}>
                          <div style={{ fontSize: 9, color: X.txm, marginBottom: 2 }}>{lb}</div>
                          <BS value={s.sCr[ck]} onChange={function (e) { setS(function (p) { return Object.assign({}, p, { sCr: Object.assign({}, p.sCr, Object.fromEntries([[ck, +e.target.value]])) }); }); }} style={{ fontSize: 11 }} />
                        </div>
                      );
                    })}
                  </div>
                  <LI label="표현" style={{ marginTop: 8 }}><textarea value={s.sExpr} onChange={function (e) { set("sExpr", e.target.value); }} style={Object.assign({}, is(), { height: 50, resize: "vertical", fontSize: 12 })} /></LI>
                  <LI label="발음이슈"><textarea value={s.sPron} onChange={function (e) { set("sPron", e.target.value); }} style={Object.assign({}, is(), { height: 40, resize: "vertical", fontSize: 12 })} /></LI>
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: X.txm, marginBottom: 4 }}>⚠️ 문제 패턴</div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {(ETAGS[actSec] || []).map(function (t) {
                    return ( <button key={t} onClick={function () { toggleTag(t); }} style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: s.eTags.includes(t) ? X.r + "20" : X.s3, color: s.eTags.includes(t) ? X.r : X.txm, cursor: "pointer", border: "none" }}>{t}</button> );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <LI label="오류 메모" style={{ marginTop: 10 }}><textarea value={s.eNotes} onChange={function (e) { set("eNotes", e.target.value); }} style={Object.assign({}, is(), { height: 35, resize: "vertical", fontSize: 12 })} /></LI>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0" }}>
        <LI label="💪 강점"><textarea value={s.str} onChange={function (e) { set("str", e.target.value); }} style={Object.assign({}, is(), { height: 50, resize: "vertical", fontSize: 12 })} /></LI>
        <LI label="⚡ 보완점"><textarea value={s.weak} onChange={function (e) { set("weak", e.target.value); }} style={Object.assign({}, is(), { height: 50, resize: "vertical", fontSize: 12 })} /></LI>
      </div>

      <LI label="📌 이번 숙제">
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
          {HW_LIST.map(function (h) {
            return ( <button key={h.id} onClick={function () { addHW(h.id); }} style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 10, cursor: "pointer", border: "none", background: X.s3, color: X.txm }}>{h.lb}</button> );
          })}
        </div>
        {s.hw.map(function (h) {
          return (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, background: X.bg, borderRadius: 5, padding: "4px 8px" }}>
              <button onClick={function () { setS(function (p) { return Object.assign({}, p, { hw: p.hw.map(function (x) { return x.id === h.id ? Object.assign({}, x, { done: !x.done }) : x; }) }); }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>{h.done ? "✅" : "⬜"}</button>
              <span style={{ fontSize: 11, fontWeight: 500, minWidth: 55 }}>{h.lb}</span>
              <input value={h.detail} onChange={function (e) { setS(function (p) { return Object.assign({}, p, { hw: p.hw.map(function (x) { return x.id === h.id ? Object.assign({}, x, { detail: e.target.value }) : x; }) }); }); }} placeholder="상세" style={is({ flex: 1, fontSize: 11, padding: "3px 6px" })} />
              <button onClick={function () { setS(function (p) { return Object.assign({}, p, { hw: p.hw.filter(function (x) { return x.id !== h.id; }) }); }); }} style={{ background: "none", border: "none", color: X.txm, cursor: "pointer", fontSize: 10 }}>✕</button>
            </div>
          );
        })}
      </LI>
      <LI label="메모" style={{ marginTop: 6 }}><textarea value={s.notes} onChange={function (e) { set("notes", e.target.value); }} style={Object.assign({}, is(), { height: 40, resize: "vertical", fontSize: 12 })} /></LI>
    </div>
  );
}

/* ═══ CURRICULUM ═══ */
function Curr(props) {
  var st = props.st; var upd = props.upd;
  var g = st.goals;
  var _l = useState(false); var loading = _l[0]; var setLoading = _l[1];
  var _ai = useState(""); var aiR = _ai[0]; var setAiR = _ai[1];
  var sc = calcAll(st.assess, st.tt);
  var a = st.assess;
  var rT = st.tt === "general" ? READ_GT : READ_AC;

  function setG(k, v) { upd(st.id, function (p) { return Object.assign({}, p, { goals: Object.assign({}, p.goals, Object.fromEntries([[k, v]])) }); }); }

  function buildWeak(secs, data) {
    var results = [];
    secs.forEach(function (sec) {
      sec.types.forEach(function (tp, ti) {
        var correct = (data && data[sec.id] && data[sec.id][ti]) || 0;
        var total = tp.t;
        var hasData = data && data[sec.id] && data[sec.id][ti] !== undefined;
        if (!hasData && !correct) return;
        var rate = total > 0 ? Math.round(correct / total * 100) : 0;
        var status = rate >= 80 ? "강" : rate >= 60 ? "보통" : "약";
        results.push(sec.label + " " + tp.n + ": " + correct + "/" + total + " (" + rate + "%) [" + status + "]");
      });
    });
    return results.join("\n");
  }

  function buildStrength(secs, data) {
    var results = [];
    secs.forEach(function (sec) {
      sec.types.forEach(function (tp, ti) {
        var correct = (data && data[sec.id] && data[sec.id][ti]) || 0;
        var hasData = data && data[sec.id] && data[sec.id][ti] !== undefined;
        if (!hasData && !correct) return;
        var rate = tp.t > 0 ? Math.round(correct / tp.t * 100) : 0;
        if (rate >= 80) results.push(sec.label + " " + tp.n + " (" + rate + "%)");
      });
    });
    return results.join(", ");
  }

  function generate() {
    setLoading(true); setAiR("");
    var lAll = buildWeak(LISTEN_T, a.lQt);
    var rAll = buildWeak(rT, a.rQt);
    var lStr = buildStrength(LISTEN_T, a.lQt);
    var rStr = buildStrength(rT, a.rQt);
    var examDays = st.tDate ? Math.ceil((new Date(st.tDate) - new Date()) / 86400000) : 0;

    var prompt = "You are a top IELTS instructor at NstepIELTS academy. Create a HYPER-SPECIFIC, actionable curriculum plan entirely IN KOREAN.\n\n" +
      "=== 학생 정보 ===\n" +
      "이름: " + st.name + "\n" +
      "시험: " + (st.tt === "academic" ? "Academic" : "General Training") + "\n" +
      "목표: Overall " + st.tgt + "\n" +
      "시험일: " + (st.tDate || "미정") + (examDays > 0 ? " (D-" + examDays + ", 약 " + Math.ceil(examDays / 7) + "주)" : "") + "\n" +
      "배경: " + (st.bg || "정보 없음") + "\n" +
      "요청: " + (st.req || "없음") + "\n\n" +
      "=== 현재 점수 ===\n" +
      "Listening: " + sc.lr + "/40 = Band " + sc.lb + "\n" +
      "Reading: " + sc.rr + "/40 = Band " + sc.rb + "\n" +
      "Writing: Band " + sc.wb + "\n" +
      "Speaking: Band " + sc.sb + "\n" +
      "Overall: " + sc.ov + " → 목표 " + st.tgt + " (+" + (st.tgt - sc.ov).toFixed(1) + " 필요)\n\n" +
      "=== Listening 문제유형별 분석 ===\n" + (lAll || "데이터 미입력") + "\n강점: " + (lStr || "없음") + "\n\n" +
      "=== Reading 문제유형별 분석 ===\n" + (rAll || "데이터 미입력") + "\n강점: " + (rStr || "없음") + "\n\n" +
      "=== Writing 세부기준 ===\n" +
      "Task1: TA=" + a.w.t1.ta + " CC=" + a.w.t1.cc + " LR=" + a.w.t1.lr + " GRA=" + a.w.t1.gra + "\n" +
      "Task2: TA=" + a.w.t2.ta + " CC=" + a.w.t2.cc + " LR=" + a.w.t2.lr + " GRA=" + a.w.t2.gra + "\n" +
      (a.w.cm ? "코멘트: " + a.w.cm + "\n" : "") +
      "\n=== Speaking 세부기준 ===\n" +
      "FC=" + a.s.fc + " LR=" + a.s.lr + " GRA=" + a.s.gra + " Pron=" + a.s.pron + "\n" +
      (a.s.cm ? "코멘트: " + a.s.cm + "\n" : "") +
      "\n강사 종합소견: " + (a.sum || "없음") + "\n\n" +
      "=== 요청사항 ===\n" +
      "다음 항목을 모두 포함하여 작성:\n\n" +
      "1. **진단 요약** - 각 섹션별 강점/약점 (문제유형 수준까지)\n" +
      "2. **목표 설정** - 섹션별 목표 밴드 (현실적), 가장 점수 올리기 쉬운 섹션 분석\n" +
      "3. **장기 로드맵** - 시험일까지 단계별 계획\n" +
      "4. **4주 주간 커리큘럼** - 각 주에 구체적으로:\n" +
      "   - 어떤 섹션, 어떤 문제유형 연습\n" +
      "   - Writing: 어떤 Task, 어떤 기준 집중 (예: T2 TA 올리기 위해 논리구조 연습)\n" +
      "   - Speaking: 어떤 Part, 어떤 기준 집중 (예: Part2 시간 채우기, Pronunciation 쉐도잉)\n" +
      "   - 구체적 숙제 (예: Cambridge 19 Test 2 Listening S3 풀기, 에세이 1편 작성 등)\n" +
      "5. **숙제 패턴** - 매일/매주 반복할 것 (쉐도잉 분량, 받아쓰기, 단어, 에세이 빈도 등)\n\n" +
      "숫자와 구체적 지시를 최대한 포함해서 작성해주세요.";

    function callApi(retries) {
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: prompt }] })
      }).then(function (res) {
        if (res.status === 529 && retries > 0) {
          setAiR("서버 혼잡 — " + retries + "회 재시도 중...");
          setTimeout(function () { callApi(retries - 1); }, 3000);
          return;
        }
        if (!res.ok) {
          return res.text().then(function (txt) {
            setAiR("API 오류 (" + res.status + ")\n잠시 후 다시 시도해주세요.");
            setLoading(false);
          });
        }
        return res.json().then(function (d) {
          if (d.error) {
            setAiR("오류: " + (d.error.message || JSON.stringify(d.error)));
          } else if (d.content && d.content.length > 0) {
            var text = d.content.map(function (c) { return c.text || ""; }).join("\n");
            setAiR(text || "빈 응답");
          } else {
            setAiR("예상치 못한 응답");
          }
          setLoading(false);
        });
      }).catch(function (e) {
        if (retries > 0) {
          setAiR("연결 재시도 중...");
          setTimeout(function () { callApi(retries - 1); }, 2000);
        } else {
          setAiR("네트워크 오류: " + e.message);
          setLoading(false);
        }
      });
    }
    callApi(3);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={Object.assign({}, cs, { padding: 16, border: "1px solid " + X.p + "40" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h4 style={{ margin: 0, fontSize: 14 }}>🤖 NstepIELTS AI 커리큘럼</h4>
          <button onClick={generate} disabled={loading} style={Object.assign({}, bp, { background: X.ac, fontSize: 12, opacity: loading ? 0.6 : 1 })}>{loading ? "AI 분석 중..." : "🎯 맞춤 커리큘럼 생성"}</button>
        </div>
        <p style={{ fontSize: 11, color: X.txm, margin: 0 }}>L:{sc.lb} R:{sc.rb} W:{sc.wb} S:{sc.sb} = OA {sc.ov} → 목표 {st.tgt}</p>
        {aiR && ( <div style={{ marginTop: 10, background: X.bg, borderRadius: 8, padding: 14, fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>{aiR}</div> )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={Object.assign({}, cs, { padding: 16 })}><h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>🎯 장기 목표</h4><textarea value={g.long} onChange={function (e) { setG("long", e.target.value); }} style={Object.assign({}, is(), { height: 140, resize: "vertical", fontSize: 12 })} /></div>
        <div style={Object.assign({}, cs, { padding: 16 })}><h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>📅 단기 목표</h4><textarea value={g.short} onChange={function (e) { setG("short", e.target.value); }} style={Object.assign({}, is(), { height: 140, resize: "vertical", fontSize: 12 })} /></div>
      </div>
      <div style={Object.assign({}, cs, { padding: 16 })}><h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>📋 주간 계획</h4><textarea value={g.weekly} onChange={function (e) { setG("weekly", e.target.value); }} style={Object.assign({}, is(), { height: 200, resize: "vertical", fontFamily: MO, fontSize: 12 })} /></div>
    </div>
  );
}

/* ═══ PROGRESS ═══ */
function Prog(props) {
  var st = props.st;
  var ss = st.sess;
  var _pf = useState("listening");
  var pFocus = _pf[0]; var setPFocus = _pf[1];

  if (ss.length < 1) return ( <div style={{ textAlign: "center", padding: 36, color: X.txm }}>수업 기록 필요</div> );

  var rT = st.tt === "general" ? READ_GT : READ_AC;
  var rBT = st.tt === "general" ? GR_BAND : AR_BAND;

  var lineData = ss.map(function (s) {
    var lr = qtRaw(LISTEN_T, s.lQt);
    var rr = qtRaw(rT, s.rQt);
    return {
      name: "#" + s.num,
      L: lr > 0 ? rawToBand(lr, L_BAND) : null,
      R: rr > 0 ? rawToBand(rr, rBT) : null,
      W: crAvg(s.wCr, WC_KEYS) || null,
      S: crAvg(s.sCr, SC_KEYS) || null
    };
  });

  var att = ss.length ? Math.round(ss.filter(function (s) { return s.att; }).length / ss.length * 100) : 0;
  var hwT = 0; var hwD = 0;
  ss.forEach(function (s) { hwT += s.hw.length; s.hw.forEach(function (h) { if (h.done) hwD++; }); });

  // Build QT growth per focus
  function buildQtG(secTemplate, dataKey) {
    var results = [];
    if (ss.length >= 2) {
      var first = ss[0];
      var last = ss[ss.length - 1];
      secTemplate.forEach(function (sec) {
        sec.types.forEach(function (tp, ti) {
          var fv = (first[dataKey] && first[dataKey][sec.id] && first[dataKey][sec.id][ti]) || 0;
          var lv = (last[dataKey] && last[dataKey][sec.id] && last[dataKey][sec.id][ti]) || 0;
          if (fv > 0 || lv > 0) results.push({ nm: sec.label + " " + tp.n, f: Math.round(fv / tp.t * 100), l: Math.round(lv / tp.t * 100) });
        });
      });
    }
    return results;
  }

  var lQtG = buildQtG(LISTEN_T, "lQt");
  var rQtG = buildQtG(rT, "rQt");
  var wQtG = ss.length >= 2 ? WC_KEYS.map(function (k, i) {
    return { nm: W_LABELS[i], f: ss[0].wCr[k] || 0, l: ss[ss.length - 1].wCr[k] || 0 };
  }).filter(function (g) { return g.f > 0 || g.l > 0; }) : [];
  var sQtG = ss.length >= 2 ? SC_KEYS.map(function (k, i) {
    return { nm: S_LABELS[i], f: ss[0].sCr[k] || 0, l: ss[ss.length - 1].sCr[k] || 0 };
  }).filter(function (g) { return g.f > 0 || g.l > 0; }) : [];

  var focusMap = { listening: lQtG, reading: rQtG, writing: wQtG, speaking: sQtG };
  var currentQtG = focusMap[pFocus] || [];

  var colors = ["#f59e0b", "#3b82f6", "#ec4899", "#22c55e"];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[["수업", ss.length + "회", X.ac], ["출석률", att + "%", att >= 80 ? X.g : X.r], ["숙제", hwT ? Math.round(hwD / hwT * 100) + "%" : "—", X.g], ["모의고사", ss.filter(function (s) { return s.mock; }).length + "회", X.p]].map(function (arr, i) {
          return (
            <div key={i} style={{ background: X.s2, borderRadius: 8, padding: "10px 8px", textAlign: "center", border: "1px solid " + X.bd }}>
              <div style={{ fontSize: 10, color: X.txm }}>{arr[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MO, color: arr[2] }}>{arr[1]}</div>
            </div>
          );
        })}
      </div>

      {lineData.length >= 2 && (
        <div style={Object.assign({}, cs, { padding: 16 })}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>밴드 추이</h4>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lineData}>
              <CartesianGrid stroke={X.bd} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: X.txm, fontSize: 10 }} />
              <YAxis domain={[0, 9]} tick={{ fill: X.txm, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: X.s1, border: "1px solid " + X.bd, borderRadius: 7, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {["L", "R", "W", "S"].map(function (k, i) {
                return ( <Line key={k} type="monotone" dataKey={k} stroke={colors[i]} strokeWidth={2} dot={{ r: 2 }} connectNulls /> );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(lQtG.length > 0 || rQtG.length > 0 || wQtG.length > 0 || sQtG.length > 0) && (
        <div style={Object.assign({}, cs, { padding: 16 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>세부 성장 추이</h4>
            <div style={{ display: "flex", gap: 4 }}>
              <Chip active={pFocus === "listening"} onClick={function () { setPFocus("listening"); }}>🎧 L</Chip>
              <Chip active={pFocus === "reading"} onClick={function () { setPFocus("reading"); }}>📖 R</Chip>
              <Chip active={pFocus === "writing"} onClick={function () { setPFocus("writing"); }}>✍️ W</Chip>
              <Chip active={pFocus === "speaking"} onClick={function () { setPFocus("speaking"); }}>🗣️ S</Chip>
            </div>
          </div>
          {currentQtG.length === 0 ? (
            <div style={{ fontSize: 12, color: X.txm, textAlign: "center", padding: 16 }}>이 섹션의 데이터가 부족합니다</div>
          ) : (
            <div>
              <div style={{ fontSize: 10, color: X.txm, marginBottom: 6 }}>
                {pFocus === "writing" || pFocus === "speaking" ? "세부기준 점수 (Band)" : "정답률 (%)"}  ·  첫 수업 → 최근
              </div>
              {currentQtG.map(function (g, i) {
                var diff = g.l - g.f;
                var isRate = pFocus !== "writing" && pFocus !== "speaking";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: X.txm, minWidth: 100 }}>{g.nm}</span>
                    <div style={{ flex: 1, height: 6, background: X.bg, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: (isRate ? g.l : g.l / 9 * 100) + "%", height: "100%", background: diff > 0 ? X.g : diff < 0 ? X.r : X.y, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: MO, fontSize: 11, minWidth: 80, textAlign: "right" }}>
                      <span style={{ color: X.txm }}>{isRate ? g.f + "%" : g.f}</span> → <span style={{ color: diff > 0 ? X.g : diff < 0 ? X.r : X.txm }}>{isRate ? g.l + "%" : g.l}</span>
                      {diff !== 0 && ( <span style={{ color: diff > 0 ? X.g : X.r, marginLeft: 4 }}>{diff > 0 ? "+" : ""}{isRate ? diff + "%" : diff}</span> )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={Object.assign({}, cs, { padding: 16 })}>
        <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>문제 패턴</h4>
        <ECloud sessions={ss} />
      </div>

      {ss.some(function (s) { return s.hw.length > 0; }) && (
        <div style={Object.assign({}, cs, { padding: 16 })}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>숙제 완료 추이</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={ss.map(function (s) { return { name: "#" + s.num, done: s.hw.filter(function (h) { return h.done; }).length, miss: s.hw.filter(function (h) { return !h.done; }).length }; })}>
              <CartesianGrid stroke={X.bd} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: X.txm, fontSize: 10 }} />
              <YAxis tick={{ fill: X.txm, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: X.s1, border: "1px solid " + X.bd, borderRadius: 7, fontSize: 11 }} />
              <Bar dataKey="done" fill={X.g} stackId="a" name="완료" />
              <Bar dataKey="miss" fill={X.r} stackId="a" radius={[3, 3, 0, 0]} name="미완" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ═══ OUTCOME ═══ */
function Outc(props) {
  var st = props.st; var upd = props.upd;
  var fs = st.finalS || { listening: 0, reading: 0, writing: 0, speaking: 0 };
  var fov = overallBand(fs.listening, fs.reading, fs.writing, fs.speaking);
  var sc = calcAll(st.assess, st.tt);

  function setF(k, v) {
    upd(st.id, function (p) {
      return Object.assign({}, p, { finalS: Object.assign({ listening: 0, reading: 0, writing: 0, speaking: 0 }, p.finalS, Object.fromEntries([[k, +v]])) });
    });
  }

  var hwT = 0; var hwD = 0;
  st.sess.forEach(function (s) { hwT += s.hw.length; s.hw.forEach(function (h) { if (h.done) hwD++; }); });

  return (
    <div style={Object.assign({}, cs, { padding: 20 })}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>🏆 최종 결과</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
        {OUTC.map(function (o) {
          return ( <button key={o.id} onClick={function () { upd(st.id, { outcome: o.id }); }} style={{ padding: "14px 10px", borderRadius: 10, border: "2px solid " + (st.outcome === o.id ? o.c : X.bd), background: st.outcome === o.id ? o.c + "15" : X.bg, color: st.outcome === o.id ? o.c : X.txm, cursor: "pointer", fontFamily: FT, fontSize: 13, fontWeight: st.outcome === o.id ? 700 : 400 }}>{o.lb}</button> );
        })}
      </div>
      {st.outcome === "achieved" && (
        <div>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>최종 점수</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[["listening", "🎧L"], ["reading", "📖R"], ["writing", "✍️W"], ["speaking", "🗣️S"]].map(function (arr) {
              return (
                <div key={arr[0]} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: X.txm, marginBottom: 3 }}>{arr[1]}</div>
                  <BS value={fs[arr[0]] || 0} onChange={function (e) { setF(arr[0], e.target.value); }} />
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", padding: 12, background: X.acS, borderRadius: 10, marginTop: 12 }}>
            <div style={{ fontSize: 11, color: X.txm }}>Overall</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: MO, color: fov >= st.tgt ? X.g : X.ac }}>{fov || "—"}</div>
            {fov >= st.tgt && ( <div style={{ fontSize: 12, color: X.g }}>🎉 목표 달성!</div> )}
          </div>
        </div>
      )}
      <div style={{ marginTop: 20, padding: 16, background: X.bg, borderRadius: 10 }}>
        <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600 }}>수강 요약</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, fontSize: 13 }}>
          <div><span style={{ color: X.txm }}>수업:</span> {st.sess.length}회</div>
          <div><span style={{ color: X.txm }}>출석:</span> {st.sess.length ? Math.round(st.sess.filter(function (s) { return s.att; }).length / st.sess.length * 100) : 0}%</div>
          <div><span style={{ color: X.txm }}>초기:</span> <span style={{ fontFamily: MO, color: bclr(sc.ov) }}>{sc.ov}</span></div>
          <div><span style={{ color: X.txm }}>최종:</span> <span style={{ fontFamily: MO, color: bclr(fov) }}>{fov || "—"}</span></div>
          <div><span style={{ color: X.txm }}>성장:</span> <span style={{ fontFamily: MO, color: (fov - sc.ov) > 0 ? X.g : X.r }}>{fov ? (fov - sc.ov > 0 ? "+" : "") + (fov - sc.ov).toFixed(1) : "—"}</span></div>
          <div><span style={{ color: X.txm }}>숙제:</span> {hwT ? Math.round(hwD / hwT * 100) + "%" : "—"}</div>
        </div>
      </div>
    </div>
  );
}
