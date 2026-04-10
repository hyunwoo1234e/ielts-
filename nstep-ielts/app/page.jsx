"use client";
import { useState, useCallback, useEffect } from "react";
import { loadStudents, saveStudent, deleteStudent as dbDel, signIn, signUp, signOut, getUser, onAuthChange } from "../lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

/* ═══ BAND ═══ */
var LB=[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[20,5.5],[16,5],[13,4.5],[10,4],[7,3.5],[5,3],[3,2.5],[2,2]];
var AB=[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[7,3.5],[5,3],[3,2.5],[2,2]];
var GB=[[40,9],[39,8.5],[38,8],[36,7.5],[34,7],[32,6.5],[30,6],[27,5.5],[23,5],[19,4.5],[15,4],[12,3.5],[9,3],[6,2.5],[4,2]];
function r2b(r,t){if(r<=0)return 0;for(var i=0;i<t.length;i++)if(r>=t[i][0])return t[i][1];return 1;}
function ovBand(l,r,w,s){var a=(l+r+w+s)/4;var d=a-Math.floor(a);if(d>=.75)return Math.ceil(a);if(d>=.25)return Math.floor(a)+.5;return Math.floor(a);}
function crA(o,ks){var s=0;for(var i=0;i<ks.length;i++)s+=(o[ks[i]]||0);return Math.round(s/ks.length*2)/2;}

/* ═══ STRUCTURE ═══ */
var LT=[{id:"s1",lb:"Section 1",d:"일상 대화",ty:[{n:"Form Comp",t:5},{n:"MC",t:5}]},{id:"s2",lb:"Section 2",d:"모놀로그",ty:[{n:"MC",t:4},{n:"Map/Plan",t:3},{n:"Sent Comp",t:3}]},{id:"s3",lb:"Section 3",d:"학술 토론",ty:[{n:"MC",t:4},{n:"Matching",t:3},{n:"Summary",t:3}]},{id:"s4",lb:"Section 4",d:"학술 강의",ty:[{n:"Sent Comp",t:5},{n:"Note Comp",t:5}]}];
var RA=[{id:"p1",lb:"Passage 1",d:"사실적",ty:[{n:"T/F/NG",t:5},{n:"Sent Comp",t:4},{n:"Summary",t:4}]},{id:"p2",lb:"Passage 2",d:"서술적",ty:[{n:"Heading",t:5},{n:"Info Match",t:4},{n:"MC",t:4}]},{id:"p3",lb:"Passage 3",d:"논증",ty:[{n:"MC",t:4},{n:"Y/N/NG",t:5},{n:"Sent End",t:5}]}];
var RG=[{id:"s1",lb:"Section 1",d:"생존영어",ty:[{n:"T/F/NG",t:5},{n:"Matching",t:4},{n:"Short",t:5}]},{id:"s2",lb:"Section 2",d:"직장관련",ty:[{n:"Heading",t:5},{n:"MC",t:4},{n:"T/F/NG",t:4}]},{id:"s3",lb:"Section 3",d:"긴 지문",ty:[{n:"MC",t:4},{n:"Y/N/NG",t:5},{n:"Summary",t:4}]}];

var WK=["ta","cc","lr","gra"],WL=["Task Ach.","Coherence","Lexical","Grammar"];
var SK=["fc","lr","gra","pron"],SL=["Fluency","Lexical","Grammar","Pronun."];

/* Speaking Parts - 각 파트별 중점 기준 */
var SP=[
  {id:"p1",lb:"Part 1",d:"Introduction (4-5분)",focus:"일상 질문 — Fluency & Pronunciation 중점",keys:SK},
  {id:"p2",lb:"Part 2",d:"Cue Card (3-4분)",focus:"2분 발표 — Fluency & Coherence, Lexical 중점",keys:SK},
  {id:"p3",lb:"Part 3",d:"Discussion (4-5분)",focus:"심화 토론 — Grammar & Lexical 중점",keys:SK}
];

var ET={
  listening:["Spelling오류","숫자실수","Distractor","Map혼동","Prediction부족","S3-4집중력","복수답누락","동의어실패","Paraphrase부족","받아쓰기약함"],
  reading:["시간배분실패","Skimming부족","NG vs F혼동","Heading현혹","MC부분정답","Paraphrase부족","어휘부족","P3시간부족"],
  writing:["관사오류","시제혼동","수일치","전치사","반복단어","Paraphrase부족","Collocation","어휘낮음","Konglish","서론Hook부족","Thesis불명확","근거부족","논리비약","T1Overview누락","Off-topic","글자수미달"],
  speaking:["침묵3초+","Filler과다","답변짧음","P2시간부족","P3깊이부족","발음불명확","강세오류","억양단조","아이디어부족","문법반복","어휘반복","Discourse부족"]
};
var HWL=[{id:"wt1",lb:"W-T1"},{id:"wt2",lb:"W-T2"},{id:"rd",lb:"Reading"},{id:"ls",lb:"Listening"},{id:"sh",lb:"쉐도잉"},{id:"di",lb:"받아쓰기"},{id:"vc",lb:"어휘"},{id:"gr",lb:"문법"},{id:"sp",lb:"Speaking"},{id:"mk",lb:"모의고사"},{id:"cr",lb:"오답정리"},{id:"ot",lb:"기타"}];
var STS=[{id:"active",lb:"수강중",c:"#22c55e"},{id:"paused",lb:"휴강",c:"#eab308"},{id:"completed",lb:"수료",c:"#8b8fa3"}];
var OCS=[{id:"none",lb:"미정",c:"#8b8fa3"},{id:"achieved",lb:"달성",c:"#22c55e"},{id:"not_achieved",lb:"미달성",c:"#f97316"},{id:"refund",lb:"환불",c:"#ef4444"}];
var BDS=[0,.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9];
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function bc(b){return b>=7?"#22c55e":b>=6?"#84cc16":b>=5?"#eab308":b>=4?"#f97316":"#ef4444";}
function dd(d){if(!d)return"—";var x=Math.ceil((new Date(d)-new Date())/864e5);return x>0?"D-"+x:x===0?"D-Day":"D+"+Math.abs(x);}
function qR(ss,d){var t=0;ss.forEach(function(s){s.ty.forEach(function(tp,ti){t+=(d&&d[s.id]&&d[s.id][ti])||0;});});return t;}

function calcAll(a,tt){
  if(!a)return{lr:0,lb:0,rr:0,rb:0,wb:0,sb:0,ov:0};
  var lr=qR(LT,a.lQt||{}),lb=r2b(lr,LB);
  var rt=tt==="general"?RG:RA;
  var rr=qR(rt,a.rQt||{}),rb=r2b(rr,tt==="general"?GB:AB);
  var w=a.w||{t1:{},t2:{}};var wt1=w.t1||{};var wt2=w.t2||{};
  var w1=WK.reduce(function(s,k){return s+(wt1[k]||0);},0)/4;
  var w2=WK.reduce(function(s,k){return s+(wt2[k]||0);},0)/4;
  var wb=Math.round((w1/3+w2*2/3)*2)/2;
  var sTotal=0,sCount=0;var sp=a.s||{};
  SP.forEach(function(p){var pd=sp[p.id]||{};SK.forEach(function(k){var v=pd[k]||0;if(v>0){sTotal+=v;sCount++;}});});
  var sb=sCount>0?Math.round((sTotal/sCount)*2)/2:0;
  return{lr:lr,lb:lb,rr:rr,rb:rb,wb:wb,sb:sb,ov:ovBand(lb,rb,wb,sb)};
}

/* ═══ THEME (NstepIELTS) ═══ */
var X={bg:"#070d1e",s1:"#0c1529",s2:"#111d35",s3:"#1a2d52",bd:"#1e3a6e",tx:"#e8ecf4",txm:"#7b8fad",ac:"#2979ff",acS:"rgba(41,121,255,0.1)",g:"#22c55e",y:"#eab308",o:"#f97316",r:"#ef4444",p:"#7c8cf8"};
var FT="'Outfit','Pretendard',sans-serif",MO="'JetBrains Mono',monospace";

function is(x){return Object.assign({width:"100%",padding:"10px 14px",background:X.bg,border:"1px solid "+X.bd,borderRadius:8,color:X.tx,fontSize:15,fontFamily:FT,outline:"none",boxSizing:"border-box"},x||{});}
var cs={background:X.s1,border:"1px solid "+X.bd,borderRadius:12};
var bP={background:X.ac,color:"#fff",border:"none",padding:"10px 20px",borderRadius:9,fontFamily:FT,fontSize:14,fontWeight:600,cursor:"pointer"};
var bG={background:"none",color:X.txm,border:"1px solid "+X.bd,padding:"10px 16px",borderRadius:9,fontFamily:FT,fontSize:14,cursor:"pointer"};

/* ═══ COMPONENTS ═══ */
function Chip(p){var c=p.color||X.ac;return(<button onClick={p.onClick} style={{background:p.active?c+"20":"none",color:p.active?c:X.txm,border:"1px solid "+(p.active?c+"40":X.bd),padding:"6px 14px",borderRadius:8,cursor:"pointer",fontFamily:FT,fontSize:13,fontWeight:p.active?600:400}}>{p.children}</button>);}
function LI(p){return(<div style={Object.assign({marginBottom:8},p.style||{})}><div style={{fontSize:12,color:X.txm,marginBottom:3,fontWeight:500}}>{p.label}</div>{p.children}</div>);}
function BS(p){return(<select value={p.value} onChange={p.onChange} style={is(Object.assign({fontFamily:MO,textAlign:"center",color:bc(p.value),fontWeight:700,fontSize:16},p.style||{}))}>{BDS.map(function(b){return(<option key={b} value={b}>{b}</option>);})}</select>);}
function ECloud(p){var f={};p.sessions.forEach(function(s){if(s.eTags)s.eTags.forEach(function(t){f[t]=(f[t]||0)+1;});});var sorted=Object.entries(f).sort(function(a,b){return b[1]-a[1];}).slice(0,15);if(!sorted.length)return(<span style={{fontSize:13,color:X.txm}}>데이터 없음</span>);var mx=sorted[0][1];return(<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{sorted.map(function(i){return(<span key={i[0]} style={{display:"inline-block",padding:"4px 10px",borderRadius:6,fontSize:12,fontWeight:500,background:"rgba(239,68,68,"+(0.08+i[1]/mx*0.2)+")",color:X.r}}>{i[0]} ({i[1]})</span>);})}</div>);}

function QtScore(p){
  var ss=p.sections,d=p.data||{},onChange=p.onChange;
  var tC=0,tQ=0;
  ss.forEach(function(s){s.ty.forEach(function(t,i){tQ+=t.t;tC+=(d[s.id]&&d[s.id][i])||0;});});

  function setVal(secId,ti,val,max){
    var n=Object.assign({},d);
    n[secId]=Object.assign({},n[secId]||{});
    n[secId][ti]=Math.max(0,Math.min(val,max));
    onChange(n);
  }

  return(<div>{ss.map(function(sec){
    var sC=0;sec.ty.forEach(function(t,i){sC+=(d[sec.id]&&d[sec.id][i])||0;});
    var secTotal=sec.ty.reduce(function(a,t){return a+t.t;},0);
    return(<div key={sec.id} style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:15,fontWeight:600}}>{sec.lb} <span style={{fontSize:13,color:X.txm,fontWeight:400}}>{sec.d}</span></span>
        <span style={{fontFamily:MO,fontSize:15,fontWeight:700,color:sC===secTotal?X.g:sC>0?X.ac:X.txm}}>{sC}/{secTotal}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
        {sec.ty.map(function(tp,ti){
          var v=(d[sec.id]&&d[sec.id][ti])||0;
          var pct=tp.t>0?Math.round(v/tp.t*100):0;
          var clr=pct>=80?X.g:pct>=60?X.y:pct>0?X.o:X.txm;
          return(<div key={ti} style={{background:X.bg,borderRadius:9,padding:"10px 14px",border:"1px solid "+X.bd}}>
            <div style={{fontSize:13,color:X.txm,marginBottom:6}}>{tp.n}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={function(){setVal(sec.id,ti,v-1,tp.t);}} style={{background:X.s3,border:"none",color:X.tx,width:32,height:32,borderRadius:7,cursor:"pointer",fontSize:18,fontWeight:700}}>−</button>
              <div style={{flex:1,textAlign:"center"}}>
                <input value={v} onChange={function(e){var nv=e.target.value===""?0:parseInt(e.target.value)||0;setVal(sec.id,ti,nv,tp.t);}}
                  style={{background:"transparent",border:"none",color:clr,fontFamily:MO,fontSize:22,fontWeight:700,textAlign:"center",width:40,outline:"none"}}/>
                <span style={{fontSize:14,color:X.txm}}>/{tp.t}</span>
              </div>
              <button onClick={function(){setVal(sec.id,ti,v+1,tp.t);}} style={{background:X.s3,border:"none",color:X.tx,width:32,height:32,borderRadius:7,cursor:"pointer",fontSize:18,fontWeight:700}}>+</button>
            </div>
            {v>0&&(<div style={{marginTop:6,height:4,background:X.s3,borderRadius:2,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:clr,borderRadius:2}}/></div>)}
          </div>);
        })}
      </div>
    </div>);
  })}<div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10,marginTop:6,paddingTop:8,borderTop:"1px solid "+X.bd}}>
    <span style={{fontSize:14,color:X.txm}}>전체</span>
    <span style={{fontFamily:MO,fontSize:18,fontWeight:700,color:tC>0?X.ac:X.txm}}>{tC}<span style={{color:X.txm}}>/{tQ}</span></span>
  </div></div>);
}

/* ═══ DEFAULTS ═══ */
function mkA(){return{testUsed:"Cambridge IELTS 19 Ac Test 1",lQt:{},rQt:{},w:{t1:{ta:0,cc:0,lr:0,gra:0},t2:{ta:0,cc:0,lr:0,gra:0},cm:""},s:{p1:{fc:0,lr:0,gra:0,pron:0},p2:{fc:0,lr:0,gra:0,pron:0},p3:{fc:0,lr:0,gra:0,pron:0},cm:""},sum:""};}
function mkS(n){return{id:uid(),dt:new Date().toISOString().split("T")[0],num:n,mock:false,durH:1,durM:0,foc:[],att:true,lQt:{},rQt:{},wCr:{t1:{ta:0,cc:0,lr:0,gra:0},t2:{ta:0,cc:0,lr:0,gra:0}},sCr:{p1:{fc:0,lr:0,gra:0,pron:0},p2:{fc:0,lr:0,gra:0,pron:0},p3:{fc:0,lr:0,gra:0,pron:0}},eTags:[],eNotes:"",str:"",weak:"",hw:[],wCont:"",wFeed:"",sExpr:"",sPron:"",notes:"",qtSel:{},qtNt:{}};}
function mkG(){return{
  lTgt:"",lStr:"",rTgt:"",rStr:"",wTgt:"",wStr:"",sTgt:"",sStr:"",ovNote:"",
  m1:"",m2:"",m3:"",sFocus:"",sHw:"",
  w1:"",w2:"",w3:"",w4:""
};}function mkI(){return{name:"",email:"",phone:"",tt:"academic",tgt:7,tDate:"",bg:"",req:"",gender:"",age:"",mbti:"",personality:"",targetSchool:"",purpose:"",schedule:"",lifeNote:"",learnStyle:""};}



function makeDemo(){
  var a={testUsed:"Cambridge IELTS 19 Academic Test 1",
    lQt:{s1:{0:3,1:3},s2:{0:2,1:1,2:2},s3:{0:2,1:1,2:1},s4:{0:2,1:1}},
    rQt:{p1:{0:3,1:2,2:2},p2:{0:2,1:2,2:1},p3:{0:1,1:1,2:1}},
    w:{t1:{ta:5,cc:4.5,lr:4.5,gra:4},t2:{ta:4.5,cc:4.5,lr:4,gra:4},cm:"T2 논리구조 약함, 어휘 반복 심함"},
    s:{p1:{fc:5,lr:4.5,gra:4,pron:5},p2:{fc:4,lr:4,gra:4,pron:4.5},p3:{fc:3.5,lr:4,gra:3.5,pron:4},cm:"Part2 1분도 못 채움, Part3 아이디어 부족"},
    sum:"전체적으로 기초 부족. L S3-4 집중력, R 시간관리, W 논리+어휘, S 유창성 급선무"};

  var ss=[];var n=1;
  /* W criteria progression: 3 months of gradual growth */
  var wProg=[
    {t1:{ta:5,cc:4.5,lr:4.5,gra:4},t2:{ta:4.5,cc:4.5,lr:4,gra:4}},
    {t1:{ta:5,cc:5,lr:4.5,gra:4.5},t2:{ta:5,cc:4.5,lr:4.5,gra:4}},
    {t1:{ta:5,cc:5,lr:5,gra:4.5},t2:{ta:5,cc:5,lr:4.5,gra:4.5}},
    {t1:{ta:5.5,cc:5,lr:5,gra:4.5},t2:{ta:5,cc:5,lr:5,gra:4.5}},
    {t1:{ta:5.5,cc:5.5,lr:5,gra:5},t2:{ta:5,cc:5,lr:5,gra:5}},
    {t1:{ta:5.5,cc:5.5,lr:5,gra:5},t2:{ta:5.5,cc:5.5,lr:5,gra:5}},
    {t1:{ta:5.5,cc:5.5,lr:5.5,gra:5},t2:{ta:5.5,cc:5.5,lr:5,gra:5}},
    {t1:{ta:6,cc:5.5,lr:5.5,gra:5},t2:{ta:5.5,cc:5.5,lr:5.5,gra:5}},
    {t1:{ta:6,cc:6,lr:5.5,gra:5.5},t2:{ta:5.5,cc:5.5,lr:5.5,gra:5}},
    {t1:{ta:6,cc:6,lr:5.5,gra:5.5},t2:{ta:6,cc:5.5,lr:5.5,gra:5.5}},
    {t1:{ta:6,cc:6,lr:6,gra:5.5},t2:{ta:6,cc:6,lr:5.5,gra:5.5}},
    {t1:{ta:6,cc:6,lr:6,gra:5.5},t2:{ta:6,cc:6,lr:6,gra:5.5}},
    {t1:{ta:6.5,cc:6,lr:6,gra:5.5},t2:{ta:6,cc:6,lr:6,gra:5.5}},
    {t1:{ta:6.5,cc:6,lr:6,gra:6},t2:{ta:6,cc:6,lr:6,gra:5.5}},
    {t1:{ta:6.5,cc:6.5,lr:6,gra:6},t2:{ta:6,cc:6,lr:6,gra:6}},
    {t1:{ta:6.5,cc:6.5,lr:6,gra:6},t2:{ta:6.5,cc:6,lr:6,gra:6}},
    {t1:{ta:6.5,cc:6.5,lr:6.5,gra:6},t2:{ta:6.5,cc:6.5,lr:6,gra:6}},
    {t1:{ta:7,cc:6.5,lr:6.5,gra:6},t2:{ta:6.5,cc:6.5,lr:6.5,gra:6}},
    {t1:{ta:7,cc:6.5,lr:6.5,gra:6.5},t2:{ta:6.5,cc:6.5,lr:6.5,gra:6}},
    {t1:{ta:7,cc:7,lr:6.5,gra:6.5},t2:{ta:7,cc:6.5,lr:6.5,gra:6}},
    {t1:{ta:7,cc:7,lr:6.5,gra:6.5},t2:{ta:7,cc:6.5,lr:6.5,gra:6.5}},
    {t1:{ta:7,cc:7,lr:7,gra:6.5},t2:{ta:7,cc:7,lr:6.5,gra:6.5}},
    {t1:{ta:7,cc:7,lr:7,gra:6.5},t2:{ta:7,cc:7,lr:6.5,gra:6.5}},
    {t1:{ta:7,cc:7,lr:7,gra:7},t2:{ta:7,cc:7,lr:7,gra:6.5}}
  ];
  var sProg=[
    {p1:{fc:5,lr:4.5,gra:4,pron:5},p2:{fc:4,lr:4,gra:4,pron:4.5},p3:{fc:3.5,lr:4,gra:3.5,pron:4}},
    {p1:{fc:5,lr:5,gra:4.5,pron:5},p2:{fc:4.5,lr:4.5,gra:4,pron:4.5},p3:{fc:4,lr:4,gra:4,pron:4.5}},
    {p1:{fc:5.5,lr:5,gra:4.5,pron:5},p2:{fc:4.5,lr:4.5,gra:4.5,pron:5},p3:{fc:4.5,lr:4.5,gra:4,pron:4.5}},
    {p1:{fc:5.5,lr:5,gra:5,pron:5.5},p2:{fc:5,lr:5,gra:4.5,pron:5},p3:{fc:4.5,lr:4.5,gra:4.5,pron:5}},
    {p1:{fc:5.5,lr:5.5,gra:5,pron:5.5},p2:{fc:5,lr:5,gra:5,pron:5},p3:{fc:5,lr:5,gra:4.5,pron:5}},
    {p1:{fc:6,lr:5.5,gra:5,pron:5.5},p2:{fc:5,lr:5,gra:5,pron:5.5},p3:{fc:5,lr:5,gra:5,pron:5}},
    {p1:{fc:6,lr:5.5,gra:5.5,pron:5.5},p2:{fc:5.5,lr:5.5,gra:5,pron:5.5},p3:{fc:5,lr:5,gra:5,pron:5.5}},
    {p1:{fc:6,lr:6,gra:5.5,pron:6},p2:{fc:5.5,lr:5.5,gra:5,pron:5.5},p3:{fc:5.5,lr:5.5,gra:5,pron:5.5}},
    {p1:{fc:6,lr:6,gra:5.5,pron:6},p2:{fc:5.5,lr:5.5,gra:5.5,pron:5.5},p3:{fc:5.5,lr:5.5,gra:5.5,pron:5.5}},
    {p1:{fc:6,lr:6,gra:6,pron:6},p2:{fc:6,lr:5.5,gra:5.5,pron:6},p3:{fc:5.5,lr:5.5,gra:5.5,pron:5.5}},
    {p1:{fc:6.5,lr:6,gra:6,pron:6},p2:{fc:6,lr:6,gra:5.5,pron:6},p3:{fc:5.5,lr:5.5,gra:5.5,pron:6}},
    {p1:{fc:6.5,lr:6,gra:6,pron:6},p2:{fc:6,lr:6,gra:6,pron:6},p3:{fc:6,lr:6,gra:5.5,pron:6}},
    {p1:{fc:6.5,lr:6.5,gra:6,pron:6},p2:{fc:6,lr:6,gra:6,pron:6},p3:{fc:6,lr:6,gra:6,pron:6}},
    {p1:{fc:6.5,lr:6.5,gra:6,pron:6.5},p2:{fc:6,lr:6,gra:6,pron:6},p3:{fc:6,lr:6,gra:6,pron:6}},
    {p1:{fc:6.5,lr:6.5,gra:6.5,pron:6.5},p2:{fc:6.5,lr:6,gra:6,pron:6},p3:{fc:6,lr:6,gra:6,pron:6}},
    {p1:{fc:7,lr:6.5,gra:6.5,pron:6.5},p2:{fc:6.5,lr:6.5,gra:6,pron:6},p3:{fc:6,lr:6,gra:6,pron:6.5}},
    {p1:{fc:7,lr:6.5,gra:6.5,pron:6.5},p2:{fc:6.5,lr:6.5,gra:6,pron:6.5},p3:{fc:6.5,lr:6,gra:6,pron:6.5}},
    {p1:{fc:7,lr:7,gra:6.5,pron:6.5},p2:{fc:6.5,lr:6.5,gra:6.5,pron:6.5},p3:{fc:6.5,lr:6.5,gra:6,pron:6.5}},
    {p1:{fc:7,lr:7,gra:6.5,pron:7},p2:{fc:6.5,lr:6.5,gra:6.5,pron:6.5},p3:{fc:6.5,lr:6.5,gra:6.5,pron:6.5}},
    {p1:{fc:7,lr:7,gra:7,pron:7},p2:{fc:7,lr:6.5,gra:6.5,pron:6.5},p3:{fc:6.5,lr:6.5,gra:6.5,pron:6.5}},
    {p1:{fc:7,lr:7,gra:7,pron:7},p2:{fc:7,lr:7,gra:6.5,pron:6.5},p3:{fc:6.5,lr:6.5,gra:6.5,pron:7}},
    {p1:{fc:7,lr:7,gra:7,pron:7},p2:{fc:7,lr:7,gra:6.5,pron:7},p3:{fc:7,lr:6.5,gra:6.5,pron:7}},
    {p1:{fc:7,lr:7,gra:7,pron:7},p2:{fc:7,lr:7,gra:7,pron:7},p3:{fc:7,lr:7,gra:6.5,pron:7}},
    {p1:{fc:7,lr:7,gra:7,pron:7},p2:{fc:7,lr:7,gra:7,pron:7},p3:{fc:7,lr:7,gra:7,pron:7}}
  ];
  var tags=[["Spelling오류","Distractor","T1Overview누락"],["시간배분실패","NG vs F혼동"],["S3-4집중력","Paraphrase부족"],["Thesis불명확","근거부족"],["Spelling오류","동의어실패"],["Heading현혹","답변짧음"],["접속사과다","어휘반복"],["Paraphrase부족","P3깊이부족"],["MC부분정답","강세오류"],["어휘부족","문법반복"],["Spelling오류"],["시간배분실패"],["Paraphrase부족"],["강세오류"],["근거부족"],["Spelling오류"],["P3깊이부족"],["어휘부족"],["접속사과다"],["Paraphrase부족"],["MC부분정답"],["강세오류"],["Spelling오류"],["시간배분실패"]];
  var foci=[["listening","writing"],["reading","speaking"],["listening","speaking"],["writing","reading"],["listening","writing"],["reading","speaking"],["writing","speaking"],["listening","reading"],["listening","writing"],["reading","speaking"],["writing","speaking"],["listening","reading"],["listening","writing"],["reading","speaking"],["listening","speaking"],["writing","reading"],["listening","writing"],["reading","speaking"],["writing","speaking"],["listening","reading"],["listening","writing"],["reading","speaking"],["writing","speaking"],["listening","reading"]];
  var dates=["2026-01-06","2026-01-08","2026-01-10","2026-01-13","2026-01-15","2026-01-17","2026-01-20","2026-01-22","2026-01-27","2026-01-29","2026-01-31","2026-02-03","2026-02-05","2026-02-07","2026-02-10","2026-02-12","2026-02-14","2026-02-17","2026-02-19","2026-02-21","2026-02-24","2026-02-26","2026-02-28","2026-03-03"];
  var absent=[7,15];

  for(var i=0;i<24;i++){
    var hwDone=i<8?3:i<16?2:i<20?2:3;
    ss.push({id:"d"+i,dt:dates[i],num:n++,mock:false,durH:1,durM:30,foc:foci[i],att:absent.indexOf(i)===-1,
      lQt:{},rQt:{},wCr:wProg[i],sCr:sProg[i],eTags:tags[i]||[],eNotes:"",str:"",weak:"",
      hw:[{id:"dh"+i+"a",type:"sh",lb:"쉐도잉",detail:"15분",done:hwDone>=1},{id:"dh"+i+"b",type:"vc",lb:"어휘",detail:"20단어",done:hwDone>=2},{id:"dh"+i+"c",type:"wt2",lb:"W-T2",detail:"에세이 1편",done:hwDone>=3}],
      wCont:"",wFeed:"",sExpr:"",sPron:"",notes:"",qtSel:{},qtNt:{}});
  }

  /* 모의고사 4회 (월 1회) */
  var mDates=["2026-01-11","2026-02-01","2026-02-22","2026-03-08"];
  var mL=[
    {s1:{0:3,1:3},s2:{0:2,1:1,2:2},s3:{0:2,1:1,2:1},s4:{0:2,1:2}},
    {s1:{0:4,1:4},s2:{0:3,1:2,2:2},s3:{0:3,1:2,2:2},s4:{0:3,1:2}},
    {s1:{0:5,1:4},s2:{0:4,1:2,2:3},s3:{0:3,1:2,2:2},s4:{0:3,1:3}},
    {s1:{0:5,1:5},s2:{0:4,1:3,2:3},s3:{0:3,1:3,2:2},s4:{0:4,1:3}}
  ];
  var mR=[
    {p1:{0:3,1:2,2:2},p2:{0:2,1:2,2:1},p3:{0:1,1:1,2:1}},
    {p1:{0:4,1:3,2:3},p2:{0:3,1:2,2:2},p3:{0:2,1:2,2:1}},
    {p1:{0:4,1:3,2:3},p2:{0:4,1:3,2:2},p3:{0:2,1:3,2:2}},
    {p1:{0:5,1:4,2:3},p2:{0:4,1:3,2:3},p3:{0:3,1:3,2:2}}
  ];
  var mW=[
    {t1:{ta:5,cc:4.5,lr:4.5,gra:4},t2:{ta:4.5,cc:4.5,lr:4,gra:4}},
    {t1:{ta:5.5,cc:5.5,lr:5,gra:5},t2:{ta:5.5,cc:5,lr:5,gra:5}},
    {t1:{ta:6,cc:6,lr:5.5,gra:5.5},t2:{ta:6,cc:6,lr:5.5,gra:5.5}},
    {t1:{ta:6.5,cc:6.5,lr:6,gra:6},t2:{ta:6.5,cc:6.5,lr:6,gra:6}}
  ];
  var mS=[
    {p1:{fc:5,lr:4.5,gra:4,pron:5},p2:{fc:4,lr:4,gra:4,pron:4.5},p3:{fc:3.5,lr:4,gra:3.5,pron:4}},
    {p1:{fc:5.5,lr:5.5,gra:5,pron:5.5},p2:{fc:5,lr:5,gra:5,pron:5},p3:{fc:5,lr:5,gra:4.5,pron:5}},
    {p1:{fc:6,lr:6,gra:5.5,pron:6},p2:{fc:6,lr:5.5,gra:5.5,pron:5.5},p3:{fc:5.5,lr:5.5,gra:5.5,pron:5.5}},
    {p1:{fc:7,lr:6.5,gra:6.5,pron:6.5},p2:{fc:6.5,lr:6.5,gra:6,pron:6.5},p3:{fc:6.5,lr:6.5,gra:6.5,pron:6.5}}
  ];
  for(var j=0;j<4;j++){
    ss.push({id:"dm"+j,dt:mDates[j],num:n++,mock:true,durH:2,durM:45,foc:["listening","reading","writing","speaking"],att:true,
      lQt:mL[j],rQt:mR[j],wCr:mW[j],sCr:mS[j],eTags:["시간배분실패","Spelling오류"],eNotes:"",str:"",weak:"",
      hw:[],wCont:"",wFeed:"",sExpr:"",sPron:"",notes:"",qtSel:{},qtNt:{}});
  }
  ss.sort(function(a,b){return a.dt.localeCompare(b.dt);});
  for(var k=0;k<ss.length;k++)ss[k].num=k+1;

  return{id:"demo_hong",name:"홍길동",email:"",phone:"010-0000-0000",tt:"academic",tgt:7,tDate:"2026-06-01",
    bg:"대학 졸업, 유학 경험 없음, 독학 3개월 후 과외 시작",req:"",gender:"남",age:"26세",mbti:"ENFP",
    personality:"외향적, 말 많음, 긍정적이나 집중력 짧음",
    targetSchool:"University of Manchester 석사\nIELTS Overall 6.5 (각 6.0+)\n원서 마감: 2026년 7월",
    purpose:"영국 유학 준비",schedule:"직장인, 퇴근 후 저녁 8시 수업\n주말 오전 가능",
    learnStyle:"말하기 좋아함, 문법 설명 지루해함\n실전 연습 위주 선호\n숙제 밀리는 경향",lifeNote:"",
    status:"active",outcome:"none",finalS:null,assess:a,sess:ss,goals:mkG()};
}

/* ═══ LOGIN ═══ */
function LoginScreen(){
  var _m=useState("login");var mode=_m[0],setMode=_m[1];
  var _e=useState("");var email=_e[0],setEmail=_e[1];
  var _p=useState("");var pw=_p[0],setPw=_p[1];
  var _er=useState("");var err=_er[0],setErr=_er[1];
  var _ld=useState(false);var ld=_ld[0],setLd=_ld[1];
  function go(){if(!email||!pw){setErr("이메일과 비밀번호를 입력하세요");return;}setLd(true);setErr("");var fn=mode==="login"?signIn:signUp;fn(email,pw).then(function(r){if(r.error)setErr(r.error.message);else if(mode==="signup")setErr("✅ 가입 완료! 이메일 확인 후 로그인하세요.");setLd(false);});}
  return(<div style={{fontFamily:FT,background:X.bg,color:X.tx,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/><div style={Object.assign({},cs,{padding:44,width:420,maxWidth:"90vw"})}><div style={{textAlign:"center",marginBottom:32}}><h1 style={{margin:0,fontSize:30,fontWeight:700}}><span style={{color:"#1a3f8b"}}>N</span><span style={{color:"#4a6fa5"}}>step</span><span style={{color:"#fff"}}>IELTS</span></h1><p style={{color:X.txm,fontSize:15,margin:"8px 0 0"}}>학생관리 시스템</p></div><div style={{display:"flex",gap:8,marginBottom:24}}><Chip active={mode==="login"} onClick={function(){setMode("login");}}>로그인</Chip><Chip active={mode==="signup"} onClick={function(){setMode("signup");}}>회원가입</Chip></div><LI label="이메일"><input type="email" value={email} onChange={function(e){setEmail(e.target.value);}} placeholder="email@example.com" style={is({fontSize:16})}/></LI><LI label="비밀번호"><input type="password" value={pw} onChange={function(e){setPw(e.target.value);}} placeholder="6자 이상" style={is({fontSize:16})} onKeyDown={function(e){if(e.key==="Enter")go();}}/></LI>{err&&(<div style={{color:err.includes("✅")?X.g:X.r,fontSize:14,marginBottom:10}}>{err}</div>)}<button onClick={go} disabled={ld} style={Object.assign({},bP,{width:"100%",fontSize:16,padding:"14px",marginTop:10,opacity:ld?.6:1})}>{ld?"처리 중...":mode==="login"?"로그인":"회원가입"}</button></div></div>);
}

/* ═══ APP ═══ */
export default function App(){
  var _u=useState(null);var user=_u[0],setUser=_u[1];
  var _ck=useState(true);var checking=_ck[0],setChecking=_ck[1];
  var _st=useState([]);var students=_st[0],setStudents=_st[1];
  useEffect(function(){getUser().then(function(u){setUser(u);setChecking(false);});var sub=onAuthChange(function(ev,sess){setUser(sess?sess.user:null);});return function(){if(sub&&sub.data&&sub.data.subscription)sub.data.subscription.unsubscribe();};},[]);
  useEffect(function(){if(user)loadStudents().then(function(d){if(d&&d.length>0)setStudents(d.map(function(s){return Object.assign({assess:mkA(),sess:[],goals:mkG(),status:"active",outcome:"none",finalS:null},s);}));else{var demo=makeDemo();setStudents([demo]);saveStudent(demo);}});},[user]);
  var _v=useState("list");var view=_v[0],setView=_v[1];
  var _si=useState(null);var selId=_si[0],setSelId=_si[1];
  var _tb=useState("overview");var tab=_tb[0],setTab=_tb[1];
  var _ei=useState(null);var editId=_ei[0],setEditId=_ei[1];
  var _sh=useState(false);var showI=_sh[0],setShowI=_sh[1];
  var _in=useState(mkI);var intake=_in[0],setIntake=_in[1];
  var _sr=useState("");var search=_sr[0],setSearch=_sr[1];
  var _sf=useState("all");var stF=_sf[0],setStF=_sf[1];

  var student=students.find(function(s){return s.id===selId;});
  var upd=useCallback(function(id,fn){
    setStudents(function(prev){return prev.map(function(s){
      if(s.id!==id)return s;
      var r=typeof fn==="function"?fn(s):Object.assign({},s,fn);
      setTimeout(function(){saveStudent(r);},300);return r;
    });});
  },[]);

  function addSt(){
    if(!intake.name.trim())return;
    var ns=Object.assign({id:uid(),status:"active",outcome:"none",finalS:null,assess:mkA(),sess:[],goals:mkG()},intake);
    setStudents(function(p){return p.concat([ns]);});saveStudent(ns);
    setIntake(mkI());setShowI(false);
  }
  function delSt(id){if(!confirm("삭제?"))return;setStudents(function(p){return p.filter(function(s){return s.id!==id;});});dbDel(id);if(selId===id){setView("list");setSelId(null);}}
  function openSt(id){setSelId(id);setView("student");setTab("overview");setEditId(null);}


  if(checking)return(<div style={{fontFamily:FT,background:X.bg,color:X.txm,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>로딩 중...</div>);
  if(!user)return(<LoginScreen/>);

  var filtered=students.filter(function(s){if(stF!=="all"&&s.status!==stF)return false;return s.name.toLowerCase().includes(search.toLowerCase());});

  /* ─── LIST ─── */
  if(view==="list"){
    return(
      <div style={{fontFamily:FT,background:X.bg,color:X.tx,minHeight:"100vh",maxWidth:"100%",margin:"0 auto",padding:"20px 32px"}}>
        <style dangerouslySetInnerHTML={{__html:"\n*::-webkit-scrollbar{width:8px;height:8px}\n*::-webkit-scrollbar-track{background:#0c1529;border-radius:8px}\n*::-webkit-scrollbar-thumb{background:#1e3a6e;border-radius:8px}\n*::-webkit-scrollbar-thumb:hover{background:#2979ff}\n*{scrollbar-width:thin;scrollbar-color:#1e3a6e #0c1529}\n"}}/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{margin:0,fontSize:28,fontWeight:700}}><span style={{color:"#1a3f8b"}}>N</span><span style={{color:"#4a6fa5"}}>step</span><span style={{color:"#fff"}}>IELTS</span><span style={{color:X.txm,fontSize:16,fontWeight:400,marginLeft:10}}>학생관리</span></h1>
            <p style={{margin:"4px 0 0",color:X.txm,fontSize:14}}>문제유형별 진단 · 공식 채점 · AI 커리큘럼</p>
          </div>
          <button onClick={function(){signOut();}} style={Object.assign({},bG,{fontSize:13,padding:"8px 16px"})}>로그아웃</button>

        </div>

        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
          <input placeholder="학생 검색..." value={search} onChange={function(e){setSearch(e.target.value);}} style={is({flex:1,minWidth:200,fontSize:15})}/>
          <div style={{display:"flex",gap:5}}><Chip active={stF==="all"} onClick={function(){setStF("all");}}>전체</Chip>{STS.map(function(s){return(<Chip key={s.id} active={stF===s.id} onClick={function(){setStF(s.id);}} color={s.c}>{s.lb}</Chip>);})}</div>
          <button onClick={function(){setShowI(true);}} style={bP}>+ 새 학생</button>
        </div>

        {showI&&(<div style={Object.assign({},cs,{padding:24,marginBottom:18})}>
          <h3 style={{margin:"0 0 16px",fontSize:18}}>📋 새 학생 등록</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <LI label="이름 *"><input value={intake.name} onChange={function(e){setIntake(Object.assign({},intake,{name:e.target.value}));}} style={is()}/></LI>
            <LI label="시험유형"><select value={intake.tt} onChange={function(e){setIntake(Object.assign({},intake,{tt:e.target.value}));}} style={is()}><option value="academic">Academic</option><option value="general">General Training</option></select></LI>
            <LI label="목표밴드"><BS value={intake.tgt} onChange={function(e){setIntake(Object.assign({},intake,{tgt:+e.target.value}));}}/></LI>
            <LI label="시험일"><input type="date" value={intake.tDate} onChange={function(e){setIntake(Object.assign({},intake,{tDate:e.target.value}));}} style={is({colorScheme:"dark"})}/></LI>
            <LI label="이메일"><input value={intake.email} onChange={function(e){setIntake(Object.assign({},intake,{email:e.target.value}));}} style={is()}/></LI>
            <LI label="전화"><input value={intake.phone} onChange={function(e){setIntake(Object.assign({},intake,{phone:e.target.value}));}} style={is()}/></LI>
          </div>
          <LI label="배경/요청"><textarea value={intake.bg} onChange={function(e){setIntake(Object.assign({},intake,{bg:e.target.value}));}} style={Object.assign({},is(),{height:50,resize:"vertical"})}/></LI>
          <div style={{display:"flex",gap:10,marginTop:14,justifyContent:"flex-end"}}><button onClick={function(){setShowI(false);setIntake(mkI());}} style={bG}>취소</button><button onClick={addSt} style={bP}>등록</button></div>
        </div>)}

        {filtered.length===0?(<div style={{textAlign:"center",padding:50,color:X.txm,fontSize:16}}>학생 없음</div>):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:14}}>
            {filtered.map(function(s){var sc=calcAll(s.assess,s.tt);var so=STS.find(function(x){return x.id===s.status;});return(
              <div key={s.id} onClick={function(){openSt(s.id);}} style={Object.assign({},cs,{padding:20,cursor:"pointer",position:"relative"})}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><h3 style={{margin:0,fontSize:18,fontWeight:600}}>{s.name}</h3><span style={{fontSize:12,padding:"3px 10px",borderRadius:10,background:so.c+"18",color:so.c,fontWeight:600}}>{so.lb}</span><span style={{fontSize:12,padding:"3px 10px",borderRadius:10,background:X.s3,color:X.txm}}>{s.tt==="academic"?"Ac":"GT"}</span></div>
                    <p style={{margin:"4px 0 0",fontSize:13,color:X.txm}}>목표 {s.tgt} · {s.sess.length}회{s.tDate?" · "+dd(s.tDate):""}</p>
                  </div>
                  {sc.ov>0&&(<div style={{background:bc(sc.ov)+"20",color:bc(sc.ov),padding:"4px 12px",borderRadius:9,fontFamily:MO,fontWeight:700,fontSize:18}}>{sc.ov}</div>)}
                </div>
                <button onClick={function(e){e.stopPropagation();delSt(s.id);}} style={{position:"absolute",top:8,right:10,background:"none",border:"none",color:X.txm,cursor:"pointer",fontSize:14,opacity:.3}}>✕</button>
              </div>);
            })}
          </div>
        )}
      </div>
    );
  }

  /* ─── STUDENT ─── */
  if(!student)return null;
  var tabs=[["overview","📊 종합"],["profile","👤 프로필"],["assess","🎯 진단"],["sess","📝 수업"],["curr","📐 커리큘럼"],["prog","📈 성장"],["outc","🏆 결과"],["info","📖 IELTS 정보"]];
  return(
    <div style={{fontFamily:FT,background:X.bg,color:X.tx,minHeight:"100vh",maxWidth:"100%",margin:"0 auto",padding:"20px 32px"}}>
      <style dangerouslySetInnerHTML={{__html:"\n*::-webkit-scrollbar{width:8px;height:8px}\n*::-webkit-scrollbar-track{background:#0c1529;border-radius:8px}\n*::-webkit-scrollbar-thumb{background:#1e3a6e;border-radius:8px}\n*::-webkit-scrollbar-thumb:hover{background:#2979ff}\n*{scrollbar-width:thin;scrollbar-color:#1e3a6e #0c1529}\n"}}/>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={function(){setView("list");setEditId(null);}} style={Object.assign({},bG,{padding:"8px 16px",fontSize:15})}>← 목록</button>
        <h1 style={{margin:0,fontSize:24,fontWeight:700}}>{student.name}</h1>
        <select value={student.status} onChange={function(e){upd(student.id,{status:e.target.value});}} style={is({width:110,fontSize:13,padding:"6px 10px"})}>{STS.map(function(s){return(<option key={s.id} value={s.id}>{s.lb}</option>);})}</select>
      </div>
      <p style={{margin:"0 0 16px",fontSize:14,color:X.txm}}>{student.tt==="academic"?"Academic":"GT"} · 목표 {student.tgt}{student.tDate?" · "+dd(student.tDate):""}</p>
      <div style={{display:"flex",gap:4,marginBottom:20,overflowX:"auto",borderBottom:"1px solid "+X.bd,paddingBottom:2}}>
        {tabs.map(function(t){return(<button key={t[0]} onClick={function(){setTab(t[0]);setEditId(null);}} style={{background:tab===t[0]?X.acS:"none",color:tab===t[0]?X.ac:X.txm,border:"none",padding:"10px 16px",borderRadius:"9px 9px 0 0",cursor:"pointer",fontFamily:FT,fontSize:14,fontWeight:tab===t[0]?600:400,whiteSpace:"nowrap"}}>{t[1]}</button>);})}
      </div>
      {tab==="overview"&&(<OvTab st={student} upd={upd}/>)}
      {tab==="profile"&&(<PfTab st={student} upd={upd}/>)}
      {tab==="assess"&&(<AsTab st={student} upd={upd}/>)}
      {tab==="sess"&&(<SeTab st={student} upd={upd} editId={editId} setEditId={setEditId}/>)}
      {tab==="curr"&&(<CuTab st={student} upd={upd}/>)}
      {tab==="prog"&&(<PrTab st={student}/>)}
      {tab==="outc"&&(<OuTab st={student} upd={upd}/>)}
      {tab==="info"&&(<InfoTab/>)}
    </div>
  );
}

/* ═══ OVERVIEW ═══ */
function OvTab(p){var st=p.st,upd=p.upd;var sc=calcAll(st.assess,st.tt);var ss=st.sess;
  return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
      {[["🎧 L",sc.lb],["📖 R",sc.rb],["✍️ W",sc.wb],["🗣️ S",sc.sb],["Overall",sc.ov]].map(function(a,i){return(<div key={i} style={{background:X.s2,borderRadius:10,padding:"14px 8px",textAlign:"center",border:"1px solid "+X.bd}}><div style={{fontSize:13,color:X.txm}}>{a[0]}</div><div style={{fontSize:a[0]==="Overall"?28:22,fontWeight:700,fontFamily:MO,color:a[0]==="Overall"?X.ac:bc(a[1])}}>{a[1]||"—"}</div></div>);})}
    </div>
    {/* Quick profile summary */}
    {(st.targetSchool||st.personality||st.schedule)&&(
      <div style={Object.assign({gridColumn:"1/-1"},cs,{padding:16,display:"flex",gap:20,flexWrap:"wrap",fontSize:14})}>
        {st.personality&&(<span><span style={{color:X.txm}}>성향:</span> {st.personality}{st.mbti?" ("+st.mbti+")":""}</span>)}
        {st.targetSchool&&(<span><span style={{color:X.txm}}>목표:</span> {st.targetSchool}</span>)}
        {st.schedule&&(<span><span style={{color:X.txm}}>특이사항:</span> {st.schedule}</span>)}
      </div>
    )}
    <div style={Object.assign({},cs,{padding:18})}>
      <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:600}}>초기 vs 목표</h4>
      <ResponsiveContainer width="100%" height={240}><RadarChart data={[{s:"L","초기":sc.lb,"목표":st.tgt},{s:"R","초기":sc.rb,"목표":st.tgt},{s:"W","초기":sc.wb,"목표":st.tgt},{s:"S","초기":sc.sb,"목표":st.tgt}]}><PolarGrid stroke={X.bd}/><PolarAngleAxis dataKey="s" tick={{fill:X.txm,fontSize:13}}/><PolarRadiusAxis domain={[0,9]} tick={{fill:X.txm,fontSize:11}}/><Radar name="초기" dataKey="초기" stroke={X.o} fill={X.o} fillOpacity={.1}/><Radar name="목표" dataKey="목표" stroke={X.g} fill="none" strokeDasharray="4 4"/><Legend wrapperStyle={{fontSize:12}}/></RadarChart></ResponsiveContainer>
    </div>
    <div style={Object.assign({},cs,{padding:18})}>
      <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:600}}>진단 결과</h4>
      <div style={{fontSize:15,lineHeight:2.2}}>
        <div>🎧 <span style={{fontFamily:MO,color:bc(sc.lb)}}>{sc.lr}/40 → Band {sc.lb}</span></div>
        <div>📖 <span style={{fontFamily:MO,color:bc(sc.rb)}}>{sc.rr}/40 → Band {sc.rb}</span></div>
        <div>✍️ <span style={{fontFamily:MO,color:bc(sc.wb)}}>Band {sc.wb}</span></div>
        <div>🗣️ <span style={{fontFamily:MO,color:bc(sc.sb)}}>Band {sc.sb}</span></div>
      </div>
      <h4 style={{margin:"16px 0 10px",fontSize:15,fontWeight:600}}>문제 패턴</h4>
      <ECloud sessions={ss}/>
    </div>
  </div>);
}

/* ═══ PROFILE ═══ */
function PfTab(p){
  var st=p.st,upd=p.upd;
  function setP(k,v){upd(st.id,Object.fromEntries([[k,v]]));}
  var fld=is({fontSize:15});
  var ta=function(h){return Object.assign({},is(),{height:h||90,resize:"vertical",fontSize:14,lineHeight:"1.7"});};

  return(<div style={{display:"grid",gap:16}}>
    {/* 기본 정보 */}
    <div style={Object.assign({},cs,{padding:24})}>
      <h4 style={{margin:"0 0 18px",fontSize:18,fontWeight:600}}>🪪 기본 정보</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14}}>
        <LI label="이름"><input value={st.name||""} onChange={function(e){setP("name",e.target.value);}} style={fld}/></LI>
        <LI label="성별"><select value={st.gender||""} onChange={function(e){setP("gender",e.target.value);}} style={fld}><option value="">선택</option><option value="남">남</option><option value="여">여</option><option value="기타">기타</option></select></LI>
        <LI label="나이"><input value={st.age||""} onChange={function(e){setP("age",e.target.value);}} placeholder="예: 24세" style={fld}/></LI>
        <LI label="MBTI / 성격유형"><input value={st.mbti||""} onChange={function(e){setP("mbti",e.target.value);}} placeholder="예: INFJ" style={fld}/></LI>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginTop:10}}>
        <LI label="이메일"><input value={st.email||""} onChange={function(e){setP("email",e.target.value);}} style={fld}/></LI>
        <LI label="전화번호"><input value={st.phone||""} onChange={function(e){setP("phone",e.target.value);}} style={fld}/></LI>
        <LI label="시험유형"><select value={st.tt} onChange={function(e){setP("tt",e.target.value);}} style={fld}><option value="academic">Academic</option><option value="general">General Training</option></select></LI>
      </div>
    </div>

    {/* 성향 & 학습 스타일 */}
    <div style={Object.assign({},cs,{padding:24})}>
      <h4 style={{margin:"0 0 18px",fontSize:18,fontWeight:600}}>🧠 성향 & 학습 스타일</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <LI label="성격/성향">
          <textarea value={st.personality||""} onChange={function(e){setP("personality",e.target.value);}}
            placeholder={"예:\n• 내향적, 조용하지만 집중력 좋음\n• 완벽주의 성향, 실수에 예민\n• 칭찬에 동기부여됨\n• 자기주도 학습 가능"} style={ta(120)}/>
        </LI>
        <LI label="학습 스타일 & 선호도">
          <textarea value={st.learnStyle||""} onChange={function(e){setP("learnStyle",e.target.value);}}
            placeholder={"예:\n• 시각적 학습 선호 (표/차트 좋아함)\n• 문법 설명 이해 빠름\n• 반복 연습보다 새로운 문제 선호\n• 숙제 성실히 해옴 / 안 해옴\n• 영어 사용 환경 제한적"} style={ta(120)}/>
        </LI>
      </div>
    </div>

    {/* 목표 & 동기 */}
    <div style={Object.assign({},cs,{padding:24})}>
      <h4 style={{margin:"0 0 18px",fontSize:18,fontWeight:600}}>🎯 목표 & 동기</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <LI label="수업 목적">
          <textarea value={st.purpose||""} onChange={function(e){setP("purpose",e.target.value);}}
            placeholder={"예:\n• 유학 준비 (석사/박사)\n• 이민 서류 (호주/캐나다)\n• 취업 자격 (외국계)\n• 자기개발 / 편입"} style={ta(100)}/>
        </LI>
        <LI label="목표 학교/직장/이민">
          <textarea value={st.targetSchool||""} onChange={function(e){setP("targetSchool",e.target.value);}}
            placeholder={"예:\n• UCL 석사 지원 — IELTS 7.0 필요\n• 원서 마감: 2026년 1월\n• 조건부 입학 중 — Band 6.5 필요\n• 간호사 이민 — Overall 7.0 + 각 7.0"} style={ta(100)}/>
        </LI>
      </div>
    </div>

    {/* 일정 & 생활 */}
    <div style={Object.assign({},cs,{padding:24})}>
      <h4 style={{margin:"0 0 18px",fontSize:18,fontWeight:600}}>📅 일정 & 생활 환경</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <LI label="수업 일정 / 변동 사항">
          <textarea value={st.schedule||""} onChange={function(e){setP("schedule",e.target.value);}}
            placeholder={"예:\n• 육아 중 — 수업 변동 잦음 (사전 연락)\n• 직장인 — 평일 저녁/주말만 가능\n• 7-8월 해외 출장 예정\n• 시험 1달 전 주 3회로 변경 요청"} style={ta(120)}/>
        </LI>
        <LI label="영어 배경 & 환경">
          <textarea value={st.bg||""} onChange={function(e){setP("bg",e.target.value);}}
            placeholder={"예:\n• 유학 경험: 없음 / 미국 1년\n• 현재 영어 사용 환경: 거의 없음\n• 이전 시험 점수: 2024년 Overall 5.5\n• 독학 기간: 6개월\n• 학원/과외 경험: 해커스 3개월"} style={ta(120)}/>
        </LI>
      </div>
    </div>

    {/* 기타 메모 */}
    <div style={Object.assign({},cs,{padding:24})}>
      <h4 style={{margin:"0 0 18px",fontSize:18,fontWeight:600}}>📝 강사 메모</h4>
      <textarea value={st.req||""} onChange={function(e){setP("req",e.target.value);}}
        placeholder={"학생에 대한 자유 메모\n\n예:\n• 첫 수업 인상: 영어 기초는 있으나 시험 전략 부족\n• 부모님이 결제, 학생 동기 부족 주의\n• 수업 중 한국어 사용 줄이기 목표\n• 다음 상담 시 부모님 포함 예정"} style={ta(150)}/>
    </div>
  </div>);
}

/* ═══ ASSESSMENT ═══ */
function AsTab(p){
  var st=p.st,upd=p.upd,a=st.assess;var sc=calcAll(a,st.tt);
  var rT=st.tt==="general"?RG:RA;
  var _at=useState("listening");var aT=_at[0],setAT=_at[1];
  function setA(path,val){upd(st.id,function(prev){var n=Object.assign({},prev,{assess:JSON.parse(JSON.stringify(prev.assess))});var ps=path.split(".");var o=n.assess;for(var i=0;i<ps.length-1;i++)o=o[ps[i]];o[ps[ps.length-1]]=val;return n;});}

  return(<div>
    <div style={Object.assign({},cs,{padding:"16px 20px",marginBottom:14})}><LI label="사용 테스트"><input value={a.testUsed} onChange={function(e){setA("testUsed",e.target.value);}} style={is()}/></LI></div>

    {/* Score cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
      {[["🎧 L",sc.lr+"/40",sc.lb,"listening"],["📖 R",sc.rr+"/40",sc.rb,"reading"],["✍️ W","—",sc.wb,"writing"],["🗣️ S","—",sc.sb,"speaking"],["Overall","",sc.ov,null]].map(function(a){var act=a[3]&&aT===a[3];return(
        <div key={a[0]} onClick={a[3]?function(){setAT(a[3]);}:undefined} style={{background:act?X.ac+"15":X.s2,border:act?"2px solid "+X.ac:"1px solid "+X.bd,borderRadius:12,padding:"12px 8px",textAlign:"center",cursor:a[3]?"pointer":"default"}}>
          <div style={{fontSize:13,color:X.txm}}>{a[0]}</div>
          {a[1]&&(<div style={{fontSize:13,color:X.txm,fontFamily:MO}}>{a[1]}</div>)}
          <div style={{fontSize:a[0]==="Overall"?28:22,fontWeight:700,fontFamily:MO,color:a[0]==="Overall"?X.ac:bc(a[2])}}>{a[2]||"—"}</div>
        </div>);})}
    </div>

    <div style={Object.assign({},cs,{padding:20})}>
      {aT==="listening"&&(<div><h4 style={{margin:"0 0 14px",fontSize:16}}>🎧 Listening — 섹션별 채점</h4><QtScore sections={LT} data={a.lQt} onChange={function(v){setA("lQt",v);}}/></div>)}
      {aT==="reading"&&(<div><h4 style={{margin:"0 0 14px",fontSize:16}}>📖 Reading — 지문별 채점</h4><QtScore sections={rT} data={a.rQt} onChange={function(v){setA("rQt",v);}}/></div>)}
      {aT==="writing"&&(<div>
        <h4 style={{margin:"0 0 14px",fontSize:16}}>✍️ Writing — Task별 채점 <span style={{fontFamily:MO,color:bc(sc.wb)}}>Band {sc.wb}</span></h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {["t1","t2"].map(function(tid){var tA=WK.reduce(function(s,k){return s+(a.w[tid][k]||0);},0)/4;var tB=Math.round(tA*2)/2;return(
            <div key={tid} style={{background:X.bg,borderRadius:10,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:15,fontWeight:600}}>{tid==="t1"?"Task 1 (1/3)":"Task 2 (2/3)"}</span><span style={{fontFamily:MO,fontWeight:700,color:bc(tB),fontSize:16}}>{tB}</span></div>
              {WL.map(function(lb,i){var ck=WK[i];return(<div key={ck} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:14,flex:1}}>{lb}</span><BS value={a.w[tid][ck]||0} onChange={function(e){setA("w."+tid+"."+ck,+e.target.value);}} style={{width:70,fontSize:14}}/></div>);})}
            </div>);})}
        </div>
        <LI label="Writing 코멘트" style={{marginTop:12}}><textarea value={a.w.cm||""} onChange={function(e){setA("w.cm",e.target.value);}} style={Object.assign({},is(),{height:70,resize:"vertical"})}/></LI>
      </div>)}
      {aT==="speaking"&&(<div>
        <h4 style={{margin:"0 0 14px",fontSize:16}}>🗣️ Speaking — 파트별 채점 <span style={{fontFamily:MO,color:bc(sc.sb)}}>Band {sc.sb}</span></h4>
        {SP.map(function(part){
          var pData=a.s[part.id]||{fc:0,lr:0,gra:0,pron:0};
          var pB=crA(pData,SK);
          return(<div key={part.id} style={{background:X.bg,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div><span style={{fontSize:15,fontWeight:600}}>{part.lb}</span> <span style={{fontSize:13,color:X.txm}}>{part.d}</span></div>
              <span style={{fontFamily:MO,fontWeight:700,color:bc(pB),fontSize:16}}>Band {pB}</span>
            </div>
            <div style={{fontSize:12,color:X.ac,marginBottom:8}}>{part.focus}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {SL.map(function(lb,i){var ck=SK[i];return(<div key={ck}><div style={{fontSize:12,color:X.txm,marginBottom:3}}>{lb}</div><BS value={pData[ck]||0} onChange={function(e){setA("s."+part.id+"."+ck,+e.target.value);}} style={{fontSize:14}}/></div>);})}
            </div>
          </div>);
        })}
        <LI label="Speaking 코멘트"><textarea value={a.s.cm||""} onChange={function(e){setA("s.cm",e.target.value);}} style={Object.assign({},is(),{height:70,resize:"vertical"})}/></LI>
      </div>)}
    </div>
    <LI label="종합 소견" style={{marginTop:14}}><textarea value={a.sum||""} onChange={function(e){setA("sum",e.target.value);}} style={Object.assign({},is(),{height:70,resize:"vertical"})}/></LI>
  </div>);
}

/* ═══ SESSIONS ═══ */
function SeTab(p){
  var st=p.st,upd=p.upd,editId=p.editId,setEditId=p.setEditId;var ss=st.sess;
  var _mf=useState(false);var mf=_mf[0],setMf=_mf[1];
  function addS(mock){var ns=mkS(ss.length+1);ns.mock=mock;if(mock)ns.foc=["listening","reading","writing","speaking"];upd(st.id,function(p){return Object.assign({},p,{sess:p.sess.concat([ns])});});setEditId(ns.id);}
  function updS(sid,u){upd(st.id,function(p){return Object.assign({},p,{sess:p.sess.map(function(s){return s.id===sid?Object.assign({},s,u):s;})});});}
  function delS(sid){if(!confirm("삭제?"))return;upd(st.id,function(p){return Object.assign({},p,{sess:p.sess.filter(function(s){return s.id!==sid;}).map(function(s,i){return Object.assign({},s,{num:i+1});})});});if(editId===sid)setEditId(null);}
  var editing=ss.find(function(s){return s.id===editId;});var displayed=mf?ss.filter(function(s){return s.mock;}):ss;
  var prevS=editing?ss.find(function(s){return s.num===editing.num-1;}):null;
  if(editing)return(<SEdit s={editing} updS={updS} close={function(){setEditId(null);}} tt={st.tt} prev={prevS}/>);
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}><h3 style={{margin:0,fontSize:16}}>수업 ({ss.length})</h3><Chip active={!mf} onClick={function(){setMf(false);}}>전체</Chip><Chip active={mf} onClick={function(){setMf(true);}} color={X.p}>모의고사</Chip></div>
      <div style={{display:"flex",gap:8}}><button onClick={function(){addS(false);}} style={bP}>+ 수업</button><button onClick={function(){addS(true);}} style={Object.assign({},bP,{background:X.p})}>+ 모의고사</button></div>
    </div>
    {displayed.length===0?(<div style={{textAlign:"center",padding:40,color:X.txm,fontSize:15}}>수업 없음</div>):(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {displayed.slice().reverse().map(function(s){return(
          <div key={s.id} onClick={function(){setEditId(s.id);}} style={Object.assign({},cs,{padding:16,cursor:"pointer"})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontWeight:700,fontFamily:MO,color:X.ac,fontSize:15}}>#{s.num}</span>
                <span style={{fontSize:14,color:X.txm}}>{s.dt}</span>
                {s.mock&&(<span style={{padding:"3px 10px",borderRadius:6,fontSize:12,background:X.p+"20",color:X.p}}>모의고사</span>)}
                {!s.att&&(<span style={{padding:"3px 10px",borderRadius:6,fontSize:12,background:X.r+"20",color:X.r}}>결석</span>)}
              </div>
              <button onClick={function(e){e.stopPropagation();delS(s.id);}} style={{background:"none",border:"none",color:X.txm,cursor:"pointer",fontSize:14}}>🗑</button>
            </div>
          </div>);})}
      </div>)}
  </div>);
}

/* ═══ SESSION EDITOR ═══ */
function SEdit(p){
  var init=p.s,updS=p.updS,close=p.close,tt=p.tt,prev=p.prev;
  var _s=useState(init);var s=_s[0],setS=_s[1];
  var _as=useState(init.foc[0]||null);var actS=_as[0],setActS=_as[1];
  var rT=tt==="general"?RG:RA;var prevHW=prev?prev.hw:[];
  function save(){updS(s.id,s);close();}
  function set(k,v){setS(function(p){return Object.assign({},p,Object.fromEntries([[k,v]]));});}
  function togFoc(k){setS(function(p){var f=p.foc.includes(k)?p.foc.filter(function(x){return x!==k;}):p.foc.concat([k]);return Object.assign({},p,{foc:f});});}
  function togTag(t){setS(function(p){var tags=p.eTags.includes(t)?p.eTags.filter(function(x){return x!==t;}):p.eTags.concat([t]);return Object.assign({},p,{eTags:tags});});}
  function addHW(type){var hw=HWL.find(function(h){return h.id===type;});setS(function(p){return Object.assign({},p,{hw:p.hw.concat([{id:uid(),type:type,lb:hw.lb,detail:"",done:false}])});});}

  var ic={listening:"🎧",reading:"📖",writing:"✍️",speaking:"🗣️"};
  var lb={listening:"Listening",reading:"Reading",writing:"Writing",speaking:"Speaking"};

  /* W/S auto band for this session */
  var wt1a=WK.reduce(function(sum,k){return sum+((s.wCr.t1&&s.wCr.t1[k])||0);},0)/4;
  var wt2a=WK.reduce(function(sum,k){return sum+((s.wCr.t2&&s.wCr.t2[k])||0);},0)/4;
  var wB=Math.round((wt1a/3+wt2a*2/3)*2)/2;
  var sTotal=0,sCount=0;SP.forEach(function(pt){SK.forEach(function(k){var v=(s.sCr[pt.id]&&s.sCr[pt.id][k])||0;if(v>0){sTotal+=v;sCount++;}});});
  var sB=sCount>0?Math.round((sTotal/sCount)*2)/2:0;

  return(<div style={Object.assign({},cs,{padding:24})}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <h3 style={{margin:0,fontSize:18}}>{s.mock?"📋 모의고사":"수업"} #{s.num}</h3>
      <div style={{display:"flex",gap:8}}><button onClick={close} style={bG}>취소</button><button onClick={save} style={bP}>💾 저장</button></div>
    </div>

    {/* Prev HW */}
    {prevHW.length>0&&(<div style={{background:X.y+"08",border:"1px solid "+X.y+"20",borderRadius:10,padding:14,marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:600,color:X.y,marginBottom:8}}>📋 전 수업 숙제 (#{s.num-1})</div>
      {prevHW.map(function(h){return(<div key={h.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
        <button onClick={function(){if(prev){var nw=prev.hw.map(function(x){return x.id===h.id?Object.assign({},x,{done:!x.done}):x;});updS(prev.id,{hw:nw});}}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>{h.done?"✅":"⬜"}</button>
        <span style={{fontSize:14,color:h.done?X.g:X.txm}}>{h.lb}{h.detail?" — "+h.detail:""}</span>
      </div>);})}
    </div>)}

    {/* Basic info */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
      <LI label="날짜"><input type="date" value={s.dt} onChange={function(e){set("dt",e.target.value);}} style={is({colorScheme:"dark"})}/></LI>
      <LI label="수업 시간">
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <select value={s.durH||1} onChange={function(e){set("durH",+e.target.value);}} style={is({width:70,fontSize:15})}>
            {[0,1,2,3,4].map(function(h){return(<option key={h} value={h}>{h}시간</option>);})}
          </select>
          <select value={s.durM||0} onChange={function(e){set("durM",+e.target.value);}} style={is({width:70,fontSize:15})}>
            {[0,10,20,30,40,50].map(function(m){return(<option key={m} value={m}>{m}분</option>);})}
          </select>
        </div>
      </LI>
      <LI label="출석"><div style={{display:"flex",gap:6,marginTop:4}}><Chip active={s.att} onClick={function(){set("att",true);}} color={X.g}>출석</Chip><Chip active={!s.att} onClick={function(){set("att",false);}} color={X.r}>결석</Chip></div></LI>
    </div>

    {/* Focus */}
    <LI label="수업 포커스"><div style={{display:"flex",gap:6}}>
      {["listening","reading","writing","speaking"].map(function(k){return(<Chip key={k} active={s.foc.includes(k)} onClick={function(){togFoc(k);setActS(k);}}>{ic[k]} {lb[k]}</Chip>);})}
    </div></LI>

    {s.foc.length>0&&(<div style={{marginTop:16}}>
      <div style={{display:"flex",gap:6,marginBottom:12}}>{s.foc.map(function(k){return(<button key={k} onClick={function(){setActS(k);}} style={{background:actS===k?X.acS:"none",color:actS===k?X.ac:X.txm,border:"1px solid "+(actS===k?X.ac+"40":X.bd),padding:"8px 18px",borderRadius:9,cursor:"pointer",fontFamily:FT,fontSize:14}}>{ic[k]} {lb[k]}</button>);})}</div>

      {actS&&(<div style={{background:X.bg,borderRadius:10,padding:16}}>
        {/* LISTENING */}
        {actS==="listening"&&(s.mock?(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:15,fontWeight:600}}>모의고사 채점</span><span style={{fontFamily:MO,fontSize:15}}>Raw: <span style={{color:X.ac}}>{qR(LT,s.lQt)}/40</span> → Band <span style={{color:bc(r2b(qR(LT,s.lQt),LB))}}>{r2b(qR(LT,s.lQt),LB)}</span></span></div>
            <QtScore sections={LT} data={s.lQt} onChange={function(v){setS(function(p){return Object.assign({},p,{lQt:v});});}}/>
          </div>
        ):(
          <div>
            <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>📝 오늘 수업 내용</div>
            {LT.map(function(sec){return(
              <div key={sec.id} style={{marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{sec.lb} <span style={{color:X.txm,fontWeight:400}}>{sec.d}</span></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                  {sec.ty.map(function(tp,ti){
                    var key=sec.id+"-"+ti;var sel=s.qtSel[key];
                    return(<button key={ti} onClick={function(){setS(function(p){var ns=Object.assign({},p.qtSel);ns[key]=!ns[key];return Object.assign({},p,{qtSel:ns});});}}
                      style={{padding:"7px 16px",borderRadius:8,fontSize:14,background:sel?X.ac+"20":X.s3,color:sel?X.ac:X.txm,border:sel?"1px solid "+X.ac+"50":"1px solid transparent",cursor:"pointer",fontWeight:sel?600:400}}>{tp.n}</button>);
                  })}
                </div>
                {sec.ty.map(function(tp,ti){
                  var key=sec.id+"-"+ti;
                  if(!s.qtSel[key])return null;
                  return(<div key={ti} style={{background:X.s1,borderRadius:8,padding:12,marginBottom:6,borderLeft:"3px solid "+X.ac}}>
                    <div style={{fontSize:13,fontWeight:600,color:X.ac,marginBottom:6}}>{tp.n}</div>
                    <textarea value={(s.qtNt[key])||""} onChange={function(e){setS(function(p){var nn=Object.assign({},p.qtNt);nn[key]=e.target.value;return Object.assign({},p,{qtNt:nn});});}}
                      placeholder={"오늘 "+tp.n+" 수업 내용, 학생 반응, 진도 등..."} style={Object.assign({},is(),{height:60,resize:"vertical",fontSize:14})}/>
                  </div>);
                })}
              </div>);
            })}
          </div>
        ))}

        {/* READING */}
        {actS==="reading"&&(s.mock?(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:15,fontWeight:600}}>모의고사 채점</span><span style={{fontFamily:MO,fontSize:15}}>Raw: <span style={{color:X.ac}}>{qR(rT,s.rQt)}/40</span> → Band <span style={{color:bc(r2b(qR(rT,s.rQt),tt==="general"?GB:AB))}}>{r2b(qR(rT,s.rQt),tt==="general"?GB:AB)}</span></span></div>
            <QtScore sections={rT} data={s.rQt} onChange={function(v){setS(function(p){return Object.assign({},p,{rQt:v});});}}/>
          </div>
        ):(
          <div>
            <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>📝 오늘 수업 내용</div>
            {rT.map(function(sec){return(
              <div key={sec.id} style={{marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{sec.lb} <span style={{color:X.txm,fontWeight:400}}>{sec.d}</span></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                  {sec.ty.map(function(tp,ti){
                    var key=sec.id+"-"+ti;var sel=s.qtSel[key];
                    return(<button key={ti} onClick={function(){setS(function(p){var ns=Object.assign({},p.qtSel);ns[key]=!ns[key];return Object.assign({},p,{qtSel:ns});});}}
                      style={{padding:"7px 16px",borderRadius:8,fontSize:14,background:sel?X.ac+"20":X.s3,color:sel?X.ac:X.txm,border:sel?"1px solid "+X.ac+"50":"1px solid transparent",cursor:"pointer",fontWeight:sel?600:400}}>{tp.n}</button>);
                  })}
                </div>
                {sec.ty.map(function(tp,ti){
                  var key=sec.id+"-"+ti;
                  if(!s.qtSel[key])return null;
                  return(<div key={ti} style={{background:X.s1,borderRadius:8,padding:12,marginBottom:6,borderLeft:"3px solid "+X.ac}}>
                    <div style={{fontSize:13,fontWeight:600,color:X.ac,marginBottom:6}}>{tp.n}</div>
                    <textarea value={(s.qtNt[key])||""} onChange={function(e){setS(function(p){var nn=Object.assign({},p.qtNt);nn[key]=e.target.value;return Object.assign({},p,{qtNt:nn});});}}
                      placeholder={"오늘 "+tp.n+" 수업 내용, 학생 반응, 진도 등..."} style={Object.assign({},is(),{height:60,resize:"vertical",fontSize:14})}/>
                  </div>);
                })}
              </div>);
            })}
          </div>
        ))}

        {/* Writing */}
        {actS==="writing"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:15,fontWeight:600}}>Writing 수업</span><span style={{fontFamily:MO,fontSize:16,fontWeight:700,color:bc(wB)}}>예상 Band {wB}</span></div>

          {/* Type selection + notes */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:13,color:X.txm,marginBottom:6}}>오늘 다룬 유형</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {["Task 1 — Graph/Chart","Task 1 — Process","Task 1 — Map","Task 2 — Agree/Disagree","Task 2 — Both Views","Task 2 — Problem/Solution","Task 2 — Advantage/Disadvantage","Task 2 — Two-part"].map(function(tp,ti){
                var key="w-"+ti;var sel=s.qtSel[key];
                return(<button key={ti} onClick={function(){setS(function(p){var ns=Object.assign({},p.qtSel);ns[key]=!ns[key];return Object.assign({},p,{qtSel:ns});});}}
                  style={{padding:"7px 16px",borderRadius:8,fontSize:13,background:sel?X.ac+"20":X.s3,color:sel?X.ac:X.txm,border:sel?"1px solid "+X.ac+"50":"1px solid transparent",cursor:"pointer",fontWeight:sel?600:400}}>{tp}</button>);
              })}
            </div>
            {["Task 1 — Graph/Chart","Task 1 — Process","Task 1 — Map","Task 2 — Agree/Disagree","Task 2 — Both Views","Task 2 — Problem/Solution","Task 2 — Advantage/Disadvantage","Task 2 — Two-part"].map(function(tp,ti){
              var key="w-"+ti;if(!s.qtSel[key])return null;
              return(<div key={ti} style={{background:X.s1,borderRadius:8,padding:12,marginBottom:6,borderLeft:"3px solid "+X.ac}}>
                <div style={{fontSize:13,fontWeight:600,color:X.ac,marginBottom:6}}>{tp}</div>
                <textarea value={(s.qtNt[key])||""} onChange={function(e){setS(function(p){var nn=Object.assign({},p.qtNt);nn[key]=e.target.value;return Object.assign({},p,{qtNt:nn});});}}
                  placeholder="수업 내용, 주제, 학생 에세이 분석, 피드백 등..." style={Object.assign({},is(),{height:60,resize:"vertical",fontSize:14})}/>
              </div>);
            })}
          </div>

          {/* Band scoring */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {["t1","t2"].map(function(tid){
              var tData=s.wCr[tid]||{ta:0,cc:0,lr:0,gra:0};
              var tB=Math.round(WK.reduce(function(sum,k){return sum+(tData[k]||0);},0)/4*2)/2;
              return(<div key={tid} style={{background:X.s1,borderRadius:10,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:15,fontWeight:600}}>{tid==="t1"?"Task 1 채점":"Task 2 채점"}</span><span style={{fontFamily:MO,color:bc(tB)}}>{tB}</span></div>
                {WL.map(function(l,i){var ck=WK[i];return(<div key={ck} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:13,flex:1}}>{l}</span><BS value={tData[ck]||0} onChange={function(e){setS(function(p){var n=Object.assign({},p.wCr);n[tid]=Object.assign({},n[tid]||{});n[tid][ck]=+e.target.value;return Object.assign({},p,{wCr:n});});}} style={{width:65,fontSize:14}}/></div>);})}
              </div>);})}
          </div>
          <LI label="에세이 원문/요약" style={{marginTop:10}}><textarea value={s.wCont} onChange={function(e){set("wCont",e.target.value);}} style={Object.assign({},is(),{height:70,resize:"vertical"})}/></LI>
          <LI label="첨삭 피드백"><textarea value={s.wFeed} onChange={function(e){set("wFeed",e.target.value);}} style={Object.assign({},is(),{height:60,resize:"vertical"})}/></LI>
        </div>)}

        {/* Speaking */}
        {actS==="speaking"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:15,fontWeight:600}}>Speaking 수업</span><span style={{fontFamily:MO,fontSize:16,fontWeight:700,color:bc(sB)}}>예상 Band {sB}</span></div>

          {/* Part selection + notes */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:13,color:X.txm,marginBottom:6}}>오늘 다룬 파트</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {SP.map(function(part,pi){
                var key="sp-"+pi;var sel=s.qtSel[key];
                return(<button key={pi} onClick={function(){setS(function(p){var ns=Object.assign({},p.qtSel);ns[key]=!ns[key];return Object.assign({},p,{qtSel:ns});});}}
                  style={{padding:"7px 16px",borderRadius:8,fontSize:14,background:sel?X.ac+"20":X.s3,color:sel?X.ac:X.txm,border:sel?"1px solid "+X.ac+"50":"1px solid transparent",cursor:"pointer",fontWeight:sel?600:400}}>{part.lb} {part.d}</button>);
              })}
            </div>
            {SP.map(function(part,pi){
              var key="sp-"+pi;if(!s.qtSel[key])return null;
              return(<div key={pi} style={{background:X.s1,borderRadius:8,padding:12,marginBottom:6,borderLeft:"3px solid "+X.ac}}>
                <div style={{fontSize:13,fontWeight:600,color:X.ac,marginBottom:4}}>{part.lb} — {part.focus}</div>
                <textarea value={(s.qtNt[key])||""} onChange={function(e){setS(function(p){var nn=Object.assign({},p.qtNt);nn[key]=e.target.value;return Object.assign({},p,{qtNt:nn});});}}
                  placeholder={"오늘 "+part.lb+" 수업 — 토픽, 학생 답변 분석, 피드백 등..."} style={Object.assign({},is(),{height:60,resize:"vertical",fontSize:14})}/>
              </div>);
            })}
          </div>

          {/* Band scoring per part */}
          {SP.map(function(part){
            var pd=s.sCr[part.id]||{fc:0,lr:0,gra:0,pron:0};
            var pB=crA(pd,SK);
            return(<div key={part.id} style={{background:X.s1,borderRadius:10,padding:14,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:14,fontWeight:600}}>{part.lb} 채점 <span style={{color:X.txm,fontWeight:400,fontSize:12}}>{part.d}</span></span><span style={{fontFamily:MO,color:bc(pB)}}>{pB}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {SL.map(function(l,i){var ck=SK[i];return(<div key={ck}><div style={{fontSize:11,color:X.txm,marginBottom:2}}>{l}</div><BS value={pd[ck]||0} onChange={function(e){setS(function(p){var n=Object.assign({},p.sCr);n[part.id]=Object.assign({},n[part.id]||{});n[part.id][ck]=+e.target.value;return Object.assign({},p,{sCr:n});});}} style={{fontSize:13}}/></div>);})}
              </div>
            </div>);
          })}
          <LI label="유용 표현 / 어휘"><textarea value={s.sExpr} onChange={function(e){set("sExpr",e.target.value);}} style={Object.assign({},is(),{height:50,resize:"vertical"})}/></LI>
          <LI label="발음 이슈 단어"><textarea value={s.sPron} onChange={function(e){set("sPron",e.target.value);}} style={Object.assign({},is(),{height:40,resize:"vertical"})}/></LI>
        </div>)}

        {/* Error tags + 기타 */}
        {actS&&(<div style={{marginTop:12}}>
          <div style={{fontSize:13,color:X.txm,marginBottom:6}}>⚠️ 문제 패턴</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {(ET[actS]||[]).map(function(t){return(<button key={t} onClick={function(){togTag(t);}} style={{padding:"5px 12px",borderRadius:7,fontSize:13,background:s.eTags.includes(t)?X.r+"20":X.s3,color:s.eTags.includes(t)?X.r:X.txm,cursor:"pointer",border:"none"}}>{t}</button>);})}
            <button onClick={function(){var custom=prompt("기타 문제 패턴 입력:");if(custom&&custom.trim()){togTag(custom.trim());}}} style={{padding:"5px 12px",borderRadius:7,fontSize:13,background:X.s3,color:X.ac,cursor:"pointer",border:"1px dashed "+X.ac+"50"}}>+ 기타</button>
          </div>
          {s.eTags.filter(function(t){var allPreset=[];Object.values(ET).forEach(function(arr){allPreset=allPreset.concat(arr);});return !allPreset.includes(t);}).length>0&&(
            <div style={{marginTop:6,display:"flex",gap:5,flexWrap:"wrap"}}>
              {s.eTags.filter(function(t){var allPreset=[];Object.values(ET).forEach(function(arr){allPreset=allPreset.concat(arr);});return !allPreset.includes(t);}).map(function(t){return(
                <span key={t} style={{padding:"5px 12px",borderRadius:7,fontSize:13,background:X.o+"20",color:X.o,display:"inline-flex",alignItems:"center",gap:6}}>{t}<button onClick={function(){togTag(t);}} style={{background:"none",border:"none",color:X.o,cursor:"pointer",fontSize:12}}>✕</button></span>
              );})}
            </div>
          )}
          <LI label="" style={{marginTop:8}}><textarea value={s.eNotes} onChange={function(e){set("eNotes",e.target.value);}} placeholder="추가 오류 메모..." style={Object.assign({},is(),{height:40,resize:"vertical"})}/></LI>
        </div>)}
      </div>)}
    </div>)}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"14px 0"}}>
      <LI label="💪 강점"><textarea value={s.str} onChange={function(e){set("str",e.target.value);}} style={Object.assign({},is(),{height:60,resize:"vertical"})}/></LI>
      <LI label="⚡ 보완점"><textarea value={s.weak} onChange={function(e){set("weak",e.target.value);}} style={Object.assign({},is(),{height:60,resize:"vertical"})}/></LI>
    </div>

    {/* HW */}
    <LI label="📌 이번 숙제">
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>{HWL.map(function(h){return(<button key={h.id} onClick={function(){addHW(h.id);}} style={{padding:"5px 12px",borderRadius:7,fontSize:13,cursor:"pointer",border:"none",background:X.s3,color:X.txm}}>{h.lb}</button>);})}</div>
      {s.hw.map(function(h){return(<div key={h.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:X.bg,borderRadius:7,padding:"6px 10px"}}>
        <button onClick={function(){setS(function(p){return Object.assign({},p,{hw:p.hw.map(function(x){return x.id===h.id?Object.assign({},x,{done:!x.done}):x;})});});}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18}}>{h.done?"✅":"⬜"}</button>
        <span style={{fontSize:13,fontWeight:500,minWidth:60}}>{h.lb}</span>
        <input value={h.detail} onChange={function(e){setS(function(p){return Object.assign({},p,{hw:p.hw.map(function(x){return x.id===h.id?Object.assign({},x,{detail:e.target.value}):x;})});});}} placeholder="상세" style={is({flex:1,fontSize:13,padding:"4px 8px"})}/>
        <button onClick={function(){setS(function(p){return Object.assign({},p,{hw:p.hw.filter(function(x){return x.id!==h.id;})});});}} style={{background:"none",border:"none",color:X.txm,cursor:"pointer",fontSize:13}}>✕</button>
      </div>);})}
    </LI>
    <LI label="메모" style={{marginTop:8}}><textarea value={s.notes} onChange={function(e){set("notes",e.target.value);}} style={Object.assign({},is(),{height:50,resize:"vertical"})}/></LI>
  </div>);
}

/* ═══ CURRICULUM ═══ */
function CuTab(p){
  var st=p.st,upd=p.upd,g=st.goals,a=st.assess;
  var _l=useState(false);var ld=_l[0],setLd=_l[1];
  var _ai=useState("");var aiR=_ai[0],setAiR=_ai[1];
  var sc=calcAll(a,st.tt);var rT=st.tt==="general"?RG:RA;
  function setG(k,v){upd(st.id,function(p){return Object.assign({},p,{goals:Object.assign({},p.goals,Object.fromEntries([[k,v]]))});});}

  function bW(ss,d){var r=[];ss.forEach(function(s){s.ty.forEach(function(t,i){var c=(d&&d[s.id]&&d[s.id][i])||0;if(t.t>0){var rate=Math.round(c/t.t*100);r.push(s.lb+" "+t.n+": "+c+"/"+t.t+" ("+rate+"%) "+(rate>=80?"강":rate>=60?"보통":"약"));}});});return r.join("\n");}
  function spInfo(){var r=[];SP.forEach(function(pt){var pd=a.s[pt.id]||{};SK.forEach(function(k,i){r.push(pt.lb+" "+SL[i]+": "+(pd[k]||0));});});return r.join(", ");}

  function gen(){
    setLd(true);setAiR("");
    var days=st.tDate?Math.ceil((new Date(st.tDate)-new Date())/864e5):0;
    var pr="NstepIELTS 전문 강사로서 맞춤 커리큘럼을 한국어로 작성하세요.\n\n학생: "+st.name+" | "+(st.tt==="academic"?"Academic":"GT")+" | 목표: "+st.tgt+" | 시험: "+(st.tDate||"미정")+(days>0?" (D-"+days+", "+Math.ceil(days/7)+"주)":"")+"\n배경: "+(st.bg||"없음")+"\n현재: L:"+sc.lb+" R:"+sc.rb+" W:"+sc.wb+" S:"+sc.sb+" = "+sc.ov+" → 목표 "+st.tgt+" (+"+((st.tgt-sc.ov).toFixed(1))+" 필요)\n\n=== Listening ===\n"+bW(LT,a.lQt)+"\n=== Reading ===\n"+bW(rT,a.rQt)+"\n=== Writing ===\nT1: TA="+a.w.t1.ta+" CC="+a.w.t1.cc+" LR="+a.w.t1.lr+" GRA="+a.w.t1.gra+"\nT2: TA="+a.w.t2.ta+" CC="+a.w.t2.cc+" LR="+a.w.t2.lr+" GRA="+a.w.t2.gra+"\n"+(a.w.cm||"")+"\n=== Speaking (파트별) ===\n"+spInfo()+"\n"+(a.s.cm||"")+"\n소견: "+(a.sum||"")+"\n\n작성할 것:\n1. 강약점 분석 (문제유형 수준)\n2. 섹션별 목표 밴드\n3. 4주 주간 커리큘럼 (구체적 문제유형, 교재, 숙제)\n4. Speaking 파트별 전략\n5. Writing Task별 전략\n6. 매일 숙제 패턴";

    function callApi(retries){
      fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,messages:[{role:"user",content:pr}]})}).then(function(res){
        if(res.status===529&&retries>0){setAiR("서버 혼잡 — 재시도 중...");setTimeout(function(){callApi(retries-1);},3000);return;}
        if(!res.ok){res.text().then(function(){setAiR("오류 ("+res.status+") — 잠시 후 다시 시도해주세요");setLd(false);});return;}
        res.json().then(function(d){
          if(d.content&&d.content.length>0)setAiR(d.content.map(function(c){return c.text||"";}).join("\n"));
          else setAiR("응답 없음");setLd(false);
        });
      }).catch(function(e){if(retries>0){setTimeout(function(){callApi(retries-1);},2000);}else{setAiR("네트워크 오류: "+e.message);setLd(false);}});
    }
    callApi(3);
  }

  return(<div style={{display:"grid",gap:14}}>
    <div style={Object.assign({},cs,{padding:20,border:"1px solid "+X.ac+"40"})}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <h4 style={{margin:0,fontSize:16}}>🤖 NstepIELTS AI 커리큘럼</h4>
        <button onClick={gen} disabled={ld} style={Object.assign({},bP,{fontSize:14,opacity:ld?.6:1})}>{ld?"AI 분석 중...":"🎯 맞춤 커리큘럼 생성"}</button>
      </div>
      <p style={{fontSize:13,color:X.txm,margin:0}}>L:{sc.lb} R:{sc.rb} W:{sc.wb} S:{sc.sb} = {sc.ov} → 목표 {st.tgt}</p>
      {aiR&&(<div style={{marginTop:12,background:X.bg,borderRadius:10,padding:18,fontSize:14,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:500,overflowY:"auto"}}>{aiR}</div>)}
    </div>
    {/* ① 주간 계획 (가장 자주 사용) */}
    <div style={Object.assign({},cs,{padding:20})}>
      <h4 style={{margin:"0 0 14px",fontSize:16,fontWeight:600}}>📋 이번 주 수업 계획</h4>
      {[["Week 1","w1"],["Week 2","w2"],["Week 3","w3"],["Week 4","w4"]].map(function(arr){return(
        <div key={arr[1]} style={{background:X.bg,borderRadius:10,padding:16,marginBottom:10}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:10,color:X.ac}}>{arr[0]}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <LI label="🎧 Listening 계획">
              <textarea value={g[arr[1]+"l"]||""} onChange={function(e){setG(arr[1]+"l",e.target.value);}}
                placeholder="Section / 문제유형 / 교재 페이지" style={Object.assign({},is(),{height:50,resize:"vertical",fontSize:13})}/>
            </LI>
            <LI label="📖 Reading 계획">
              <textarea value={g[arr[1]+"r"]||""} onChange={function(e){setG(arr[1]+"r",e.target.value);}}
                placeholder="Passage / 문제유형 / 교재 페이지" style={Object.assign({},is(),{height:50,resize:"vertical",fontSize:13})}/>
            </LI>
            <LI label="✍️ Writing 계획">
              <textarea value={g[arr[1]+"w"]||""} onChange={function(e){setG(arr[1]+"w",e.target.value);}}
                placeholder="Task 유형 / 집중 기준 (TA, CC 등) / 주제" style={Object.assign({},is(),{height:50,resize:"vertical",fontSize:13})}/>
            </LI>
            <LI label="🗣️ Speaking 계획">
              <textarea value={g[arr[1]+"s"]||""} onChange={function(e){setG(arr[1]+"s",e.target.value);}}
                placeholder="Part / 집중 기준 (FC, Pron 등) / 토픽" style={Object.assign({},is(),{height:50,resize:"vertical",fontSize:13})}/>
            </LI>
          </div>
          <LI label="📌 이번 주 숙제" style={{marginTop:6}}>
            <textarea value={g[arr[1]+"hw"]||""} onChange={function(e){setG(arr[1]+"hw",e.target.value);}}
              placeholder="쉐도잉 / 에세이 / 단어 / 리딩 / 모의고사 등" style={Object.assign({},is(),{height:40,resize:"vertical",fontSize:13})}/>
          </LI>
        </div>);})}
    </div>

    {/* ② 월간 목표 */}
    <div style={Object.assign({},cs,{padding:20})}>
      <h4 style={{margin:"0 0 14px",fontSize:16,fontWeight:600}}>📅 월간 목표</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[["1개월차","m1","첫 달: 약점 파악 + 기초 다지기"],["2개월차","m2","둘째 달: 집중 훈련 + 점수 끌어올리기"],["3개월차","m3","셋째 달: 실전 모의고사 + 마무리"]].map(function(arr){return(
          <div key={arr[1]} style={{background:X.bg,borderRadius:10,padding:14}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{arr[0]}</div>
            <div style={{fontSize:11,color:X.txm,marginBottom:8}}>{arr[2]}</div>
            <textarea value={g[arr[1]]||""} onChange={function(e){setG(arr[1],e.target.value);}}
              placeholder={"L: Band __  목표\nR: Band __  목표\nW: Band __  목표\nS: Band __  목표\n핵심: "} style={Object.assign({},is(),{height:100,resize:"vertical",fontSize:13,lineHeight:"1.7"})}/>
          </div>);})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
        <LI label="이번 달 최우선 과제"><textarea value={g.sFocus||""} onChange={function(e){setG("sFocus",e.target.value);}} placeholder="예: T/F/NG 정답률 80% 달성, Task 2 서론 구조 완성" style={Object.assign({},is(),{height:50,resize:"vertical"})}/></LI>
        <LI label="매일 루틴 숙제"><textarea value={g.sHw||""} onChange={function(e){setG("sHw",e.target.value);}} placeholder="예: 쉐도잉 15분 / 단어 20개 / 받아쓰기 10문장" style={Object.assign({},is(),{height:50,resize:"vertical"})}/></LI>
      </div>
    </div>

    {/* ③ 장기 목표 (시험일까지) */}
    <div style={Object.assign({},cs,{padding:20})}>
      <h4 style={{margin:"0 0 14px",fontSize:16,fontWeight:600}}>🎯 장기 목표 (시험일까지)</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {[["🎧 Listening","lTgt","lStr","목표: ","전략: S3-4 집중, Prediction 훈련 등"],
          ["📖 Reading","rTgt","rStr","목표: ","전략: Skimming 속도, T/F/NG 판단력 등"],
          ["✍️ Writing","wTgt","wStr","목표: ","전략: T2 구조, Paraphrasing, 어휘 확장 등"],
          ["🗣️ Speaking","sTgt","sStr","목표: ","전략: Part 2 시간 채우기, 발음 교정 등"]
        ].map(function(arr){return(
          <div key={arr[0]} style={{background:X.bg,borderRadius:10,padding:14}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{arr[0]}</div>
            <LI label="목표 밴드"><input value={g[arr[1]]||""} onChange={function(e){setG(arr[1],e.target.value);}} placeholder={arr[3]} style={is({fontSize:15})}/></LI>
            <LI label="달성 전략"><textarea value={g[arr[2]]||""} onChange={function(e){setG(arr[2],e.target.value);}} placeholder={arr[4]} style={Object.assign({},is(),{height:55,resize:"vertical"})}/></LI>
          </div>);})}
      </div>
      <LI label="전체 방향 / 특이사항" style={{marginTop:12}}><textarea value={g.ovNote||""} onChange={function(e){setG("ovNote",e.target.value);}} placeholder="수업 방향, 학생 성향, 시험 전략 등" style={Object.assign({},is(),{height:50,resize:"vertical"})}/></LI>
    </div>
  </div>);
}

/* ═══ PROGRESS ═══ */
function PrTab(p){
  var st=p.st,ss=st.sess;
  var _mode=useState("mock");var mode=_mode[0],setMode=_mode[1];
  if(ss.length<1)return(<div style={{textAlign:"center",padding:50,color:X.txm,fontSize:15}}>수업 기록 필요</div>);
  var rT=st.tt==="general"?RG:RA;var rBT=st.tt==="general"?GB:AB;
  var mocks=ss.filter(function(s){return s.mock;});
  var lessons=ss.filter(function(s){return!s.mock;});
  var att=ss.length?Math.round(ss.filter(function(s){return s.att;}).length/ss.length*100):0;
  var hwT=0,hwD=0;ss.forEach(function(s){hwT+=s.hw.length;s.hw.forEach(function(h){if(h.done)hwD++;});});
  var sc=calcAll(st.assess,st.tt);
  var yD=[function(v){return Math.max(0,Math.floor(v-1));},function(v){return Math.min(9,Math.ceil(v+1));}];
  var cols=["#f59e0b","#3b82f6","#ec4899","#22c55e"];
  var crd=Object.assign({},cs,{padding:20});
  var hd={fontSize:16,fontWeight:700,margin:"0 0 14px"};
  var shd={fontSize:14,fontWeight:600,margin:"16px 0 8px"};

  function mB(s){var lr=qR(LT,s.lQt||{});var rr=qR(rT,s.rQt||{});var w=s.wCr||{t1:{},t2:{}};var w1=WK.reduce(function(a,k){return a+((w.t1||{})[k]||0);},0)/4;var w2=WK.reduce(function(a,k){return a+((w.t2||{})[k]||0);},0)/4;var wb=Math.round((w1/3+w2*2/3)*2)/2;var sT=0,sC=0;var sp=s.sCr||{};SP.forEach(function(pt){var pd=sp[pt.id]||{};SK.forEach(function(k){var v=pd[k]||0;if(v>0){sT+=v;sC++;}});});var sb=sC>0?Math.round((sT/sC)*2)/2:0;return{L:lr>0?r2b(lr,LB):0,R:rr>0?r2b(rr,rBT):0,W:wb,S:sb,OA:ovBand(lr>0?r2b(lr,LB):0,rr>0?r2b(rr,rBT):0,wb,sb),lr:lr,rr:rr};}
  function sWS(s){var w=s.wCr||{t1:{},t2:{}};var w1=WK.reduce(function(a,k){return a+((w.t1||{})[k]||0);},0)/4;var w2=WK.reduce(function(a,k){return a+((w.t2||{})[k]||0);},0)/4;var wb=Math.round((w1/3+w2*2/3)*2)/2;var sT=0,sC=0;var sp=s.sCr||{};SP.forEach(function(pt){var pd=sp[pt.id]||{};SK.forEach(function(k){var v=pd[k]||0;if(v>0){sT+=v;sC++;}});});var sb=sC>0?Math.round((sT/sC)*2)/2:0;return{W:wb,S:sb};}
  function GBar(pr){var v1=pr.v1,v2=pr.v2,lb=pr.label,mx=pr.max||9,lw=pr.lw||130;var d=v2-v1;var p2=mx>0?v2/mx*100:0;return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:13,color:X.txm,minWidth:lw}}>{lb}</span><div style={{flex:1,height:8,background:X.s3,borderRadius:4,overflow:"hidden"}}><div style={{width:p2+"%",height:"100%",background:d>=0?X.g:X.r,borderRadius:4}}/></div><span style={{fontFamily:MO,fontSize:12,minWidth:35,textAlign:"right",color:bc(v1)}}>{v1}</span><span style={{color:X.txm,fontSize:10}}>→</span><span style={{fontFamily:MO,fontSize:12,minWidth:35,color:bc(v2)}}>{v2}</span>{d!==0&&(<span style={{fontFamily:MO,fontSize:12,minWidth:35,color:d>0?X.g:X.r}}>{d>0?"+":""}{typeof v1==="number"&&v1%1===0?d:d.toFixed(1)}</span>)}</div>);}

  return(<div style={{display:"grid",gap:14}}>
    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
      {[["수업",lessons.length+"회",X.ac],["모의",mocks.length+"회",X.p],["출석",att+"%",att>=80?X.g:X.r],["숙제",hwT?Math.round(hwD/hwT*100)+"%":"—",hwT&&hwD/hwT>=.7?X.g:X.o],["초기","OA "+sc.ov,bc(sc.ov)],["최근",mocks.length>0?"OA "+mB(mocks[mocks.length-1]).OA:"—",mocks.length>0?bc(mB(mocks[mocks.length-1]).OA):X.txm]].map(function(a,i){return(<div key={i} style={{background:X.s2,borderRadius:10,padding:"12px 6px",textAlign:"center",border:"1px solid "+X.bd}}><div style={{fontSize:11,color:X.txm}}>{a[0]}</div><div style={{fontSize:18,fontWeight:700,fontFamily:MO,color:a[2]}}>{a[1]}</div></div>);})}
    </div>

    {/* Main toggle */}
    <div style={{display:"flex",gap:6}}>
      <button onClick={function(){setMode("mock");}} style={{flex:1,padding:"14px",borderRadius:10,border:mode==="mock"?"2px solid "+X.p:"1px solid "+X.bd,background:mode==="mock"?X.p+"15":X.s1,color:mode==="mock"?X.p:X.txm,cursor:"pointer",fontFamily:FT,fontSize:16,fontWeight:mode==="mock"?700:400}}>🧪 모의고사 성과</button>
      <button onClick={function(){setMode("lesson");}} style={{flex:1,padding:"14px",borderRadius:10,border:mode==="lesson"?"2px solid "+X.ac:"1px solid "+X.bd,background:mode==="lesson"?X.ac+"15":X.s1,color:mode==="lesson"?X.ac:X.txm,cursor:"pointer",fontFamily:FT,fontSize:16,fontWeight:mode==="lesson"?700:400}}>📝 일반 수업 성과</button>
    </div>

    {/* ═══ 모의고사 ═══ */}
    {mode==="mock"&&(<div style={{display:"grid",gap:14}}>
      {mocks.length===0?(<div style={{textAlign:"center",padding:40,color:X.txm,fontSize:15}}>모의고사 기록 없음 — 수업 탭에서 "모의고사" 추가하세요</div>):(<div style={{display:"grid",gap:14}}>

        {/* 성적표 */}
        <div style={Object.assign({},crd,{overflowX:"auto"})}>
          <h4 style={hd}>📋 모의고사 성적표</h4>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{borderBottom:"2px solid "+X.bd}}>{["","🎧L","Raw","📖R","Raw","✍️W","🗣️S","OA"].map(function(h,i){return(<th key={i} style={{padding:"10px",textAlign:"center",color:X.txm,fontSize:13}}>{h}</th>);})}</tr></thead><tbody>
            <tr style={{borderBottom:"1px solid "+X.bd+"50"}}><td style={{padding:"10px",color:X.txm}}>초기 진단</td><td style={{textAlign:"center",fontFamily:MO,color:bc(sc.lb)}}>{sc.lb}</td><td style={{textAlign:"center",fontFamily:MO,color:X.txm,fontSize:12}}>{sc.lr}/40</td><td style={{textAlign:"center",fontFamily:MO,color:bc(sc.rb)}}>{sc.rb}</td><td style={{textAlign:"center",fontFamily:MO,color:X.txm,fontSize:12}}>{sc.rr}/40</td><td style={{textAlign:"center",fontFamily:MO,color:bc(sc.wb)}}>{sc.wb}</td><td style={{textAlign:"center",fontFamily:MO,color:bc(sc.sb)}}>{sc.sb}</td><td style={{textAlign:"center",fontFamily:MO,fontWeight:700,color:bc(sc.ov)}}>{sc.ov}</td></tr>
            {mocks.map(function(s,i){var b=mB(s);return(<tr key={s.id} style={{borderBottom:"1px solid "+X.bd+"50"}}><td style={{padding:"10px"}}>{s.dt} <span style={{color:X.p,fontSize:12}}>#{i+1}</span></td><td style={{textAlign:"center",fontFamily:MO,color:bc(b.L)}}>{b.L}</td><td style={{textAlign:"center",fontFamily:MO,color:X.txm,fontSize:12}}>{b.lr}/40</td><td style={{textAlign:"center",fontFamily:MO,color:bc(b.R)}}>{b.R}</td><td style={{textAlign:"center",fontFamily:MO,color:X.txm,fontSize:12}}>{b.rr}/40</td><td style={{textAlign:"center",fontFamily:MO,color:bc(b.W)}}>{b.W}</td><td style={{textAlign:"center",fontFamily:MO,color:bc(b.S)}}>{b.S}</td><td style={{textAlign:"center",fontFamily:MO,fontWeight:700,color:bc(b.OA)}}>{b.OA}</td></tr>);})}
            {mocks.length>0&&(<tr style={{background:X.acS}}><td style={{padding:"10px",fontWeight:700}}>성장폭</td>{["L","R"].map(function(k){var f=sc[k.toLowerCase()+"b"];var l=mB(mocks[mocks.length-1])[k];var d=l-f;return[<td key={k} style={{textAlign:"center",fontFamily:MO,fontWeight:700,color:d>0?X.g:d<0?X.r:X.txm}}>{d>0?"+":""}{d.toFixed(1)}</td>,<td key={k+"r"} style={{textAlign:"center",color:X.txm}}>—</td>];}).flat()}{["W","S","OA"].map(function(k){var f=k==="OA"?sc.ov:sc[k.toLowerCase()+"b"];var l=mB(mocks[mocks.length-1])[k];var d=l-f;return(<td key={k} style={{textAlign:"center",fontFamily:MO,fontWeight:700,color:d>0?X.g:d<0?X.r:X.txm}}>{d>0?"+":""}{d.toFixed(1)}</td>);})}</tr>)}
          </tbody></table>
        </div>

        {/* 밴드 추이 */}
        {mocks.length>=2&&(<div style={crd}><h4 style={hd}>📈 밴드 추이</h4>
          <ResponsiveContainer width="100%" height={240}><LineChart data={[{name:"초기",L:sc.lb,R:sc.rb,W:sc.wb,S:sc.sb}].concat(mocks.map(function(s,i){var b=mB(s);return{name:"#"+(i+1),L:b.L,R:b.R,W:b.W,S:b.S};}))}>
            <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:12}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:12}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:12}}/>
            {["L","R","W","S"].map(function(k,i){return(<Line key={k} type="monotone" dataKey={k} stroke={cols[i]} strokeWidth={2} dot={{r:4}} connectNulls/>);})}
          </LineChart></ResponsiveContainer>
        </div>)}

        {/* 🎧 Listening 상세 */}
        <div style={crd}>
          <h4 style={hd}>🎧 Listening — 섹션별 / 문제유형별</h4>
          {LT.map(function(sec){var iD=st.assess.lQt||{};var lD=mocks.length>0?(mocks[mocks.length-1].lQt||{}):{};var secT=sec.ty.reduce(function(a,t){return a+t.t;},0);var iC=0,lC=0;sec.ty.forEach(function(t,i){iC+=(iD[sec.id]&&iD[sec.id][i])||0;lC+=(lD[sec.id]&&lD[sec.id][i])||0;});return(<div key={sec.id} style={{background:X.bg,borderRadius:10,padding:14,marginBottom:10}}>
            <GBar label={sec.lb+" ("+sec.d+")"} v1={iC} v2={lC} max={secT} lw={180}/>
            {sec.ty.map(function(tp,ti){return(<GBar key={ti} label={"  └ "+tp.n} v1={(iD[sec.id]&&iD[sec.id][ti])||0} v2={(lD[sec.id]&&lD[sec.id][ti])||0} max={tp.t} lw={180}/>);})}
          </div>);})}
          {mocks.length>=2&&(<div><div style={shd}>섹션별 Raw Score 추이</div><ResponsiveContainer width="100%" height={200}><LineChart data={mocks.map(function(s,i){var d=s.lQt||{};var r={name:"#"+(i+1)};LT.forEach(function(sec){var c=0;sec.ty.forEach(function(t,ti){c+=(d[sec.id]&&d[sec.id][ti])||0;});r[sec.lb]=c;});return r;})}>
            <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:11}}/>
            {LT.map(function(s,i){return(<Line key={s.id} type="monotone" dataKey={s.lb} stroke={cols[i%4]} strokeWidth={2} dot={{r:3}}/>);})}
          </LineChart></ResponsiveContainer></div>)}
        </div>

        {/* 📖 Reading 상세 */}
        <div style={crd}>
          <h4 style={hd}>📖 Reading — 지문별 / 문제유형별</h4>
          {rT.map(function(sec){var iD=st.assess.rQt||{};var lD=mocks.length>0?(mocks[mocks.length-1].rQt||{}):{};var secT=sec.ty.reduce(function(a,t){return a+t.t;},0);var iC=0,lC=0;sec.ty.forEach(function(t,i){iC+=(iD[sec.id]&&iD[sec.id][i])||0;lC+=(lD[sec.id]&&lD[sec.id][i])||0;});return(<div key={sec.id} style={{background:X.bg,borderRadius:10,padding:14,marginBottom:10}}>
            <GBar label={sec.lb+" ("+sec.d+")"} v1={iC} v2={lC} max={secT} lw={180}/>
            {sec.ty.map(function(tp,ti){return(<GBar key={ti} label={"  └ "+tp.n} v1={(iD[sec.id]&&iD[sec.id][ti])||0} v2={(lD[sec.id]&&lD[sec.id][ti])||0} max={tp.t} lw={180}/>);})}
          </div>);})}
          {mocks.length>=2&&(<div><div style={shd}>지문별 Raw Score 추이</div><ResponsiveContainer width="100%" height={200}><LineChart data={mocks.map(function(s,i){var d=s.rQt||{};var r={name:"#"+(i+1)};rT.forEach(function(sec){var c=0;sec.ty.forEach(function(t,ti){c+=(d[sec.id]&&d[sec.id][ti])||0;});r[sec.lb]=c;});return r;})}>
            <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:11}}/>
            {rT.map(function(s,i){return(<Line key={s.id} type="monotone" dataKey={s.lb} stroke={cols[i%4]} strokeWidth={2} dot={{r:3}}/>);})}
          </LineChart></ResponsiveContainer></div>)}
        </div>

        {/* ✍️ Writing 상세 */}
        <div style={crd}>
          <h4 style={hd}>✍️ Writing — Task별 / 기준별</h4>
          {mocks.filter(function(s){var w=s.wCr||{};return w.t2&&w.t2.ta>0;}).length>=2&&(<div><div style={shd}>Task 2 기준 추이 (가중 2/3)</div><ResponsiveContainer width="100%" height={220}><LineChart data={mocks.filter(function(s){var w=s.wCr||{};return w.t2&&w.t2.ta>0;}).map(function(s,i){var t2=(s.wCr||{}).t2||{};return{name:"#"+(i+1),TA:t2.ta||0,CC:t2.cc||0,LR:t2.lr||0,GRA:t2.gra||0};})}>
            <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:12}}/>
            <Line type="monotone" dataKey="TA" stroke="#f59e0b" strokeWidth={2} dot={{r:4}} name="Task Ach."/><Line type="monotone" dataKey="CC" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} name="Coherence"/><Line type="monotone" dataKey="LR" stroke="#ec4899" strokeWidth={2} dot={{r:4}} name="Lexical"/><Line type="monotone" dataKey="GRA" stroke="#22c55e" strokeWidth={2} dot={{r:4}} name="Grammar"/>
          </LineChart></ResponsiveContainer></div>)}
          <div style={shd}>초기 → 최근 비교</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{["t1","t2"].map(function(tid){var iW=(st.assess.w||{})[tid]||{};var lM=mocks.filter(function(s){var w=s.wCr||{};return w[tid]&&w[tid].ta>0;});var lat=lM.length>0?(lM[lM.length-1].wCr||{})[tid]||{}:{};return(<div key={tid} style={{background:X.bg,borderRadius:10,padding:14}}><div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{tid==="t1"?"Task 1 (1/3)":"Task 2 (2/3)"}</div>{WL.map(function(lb,i){var ck=WK[i];return(<GBar key={ck} label={lb} v1={iW[ck]||0} v2={lat[ck]||0} lw={100}/>);})}</div>);})}</div>
        </div>

        {/* 🗣️ Speaking 상세 */}
        <div style={crd}>
          <h4 style={hd}>🗣️ Speaking — 파트별 / 기준별</h4>
          {mocks.filter(function(s){var sp=s.sCr||{};return sp.p1&&sp.p1.fc>0;}).length>=2&&(<div><div style={shd}>세부기준 추이 (전체 평균)</div><ResponsiveContainer width="100%" height={220}><LineChart data={mocks.filter(function(s){var sp=s.sCr||{};return sp.p1&&sp.p1.fc>0;}).map(function(s,i){var sp=s.sCr||{};var av=function(k){var t=0,c=0;SP.forEach(function(pt){var v=(sp[pt.id]&&sp[pt.id][k])||0;if(v>0){t+=v;c++;}});return c>0?Math.round(t/c*10)/10:0;};return{name:"#"+(i+1),FC:av("fc"),LR:av("lr"),GRA:av("gra"),Pron:av("pron")};})}>
            <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:12}}/>
            <Line type="monotone" dataKey="FC" stroke="#f59e0b" strokeWidth={2} dot={{r:4}} name="Fluency"/><Line type="monotone" dataKey="LR" stroke="#3b82f6" strokeWidth={2} dot={{r:4}} name="Lexical"/><Line type="monotone" dataKey="GRA" stroke="#ec4899" strokeWidth={2} dot={{r:4}} name="Grammar"/><Line type="monotone" dataKey="Pron" stroke="#22c55e" strokeWidth={2} dot={{r:4}} name="Pronun."/>
          </LineChart></ResponsiveContainer></div>)}
          <div style={shd}>파트별 초기 → 최근 비교</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{SP.map(function(part){var iS=(st.assess&&st.assess.s&&st.assess.s[part.id])||{};var lM=mocks.filter(function(s){var sp=s.sCr||{};return sp[part.id]&&sp[part.id].fc>0;});var lat=lM.length>0?(lM[lM.length-1].sCr||{})[part.id]||{}:{};var iB=crA(iS,SK);var lB=crA(lat,SK);var d=lB-iB;return(<div key={part.id} style={{background:X.bg,borderRadius:10,padding:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:14,fontWeight:600}}>{part.lb}</span><span style={{fontFamily:MO,fontSize:13,color:d>0?X.g:d<0?X.r:X.txm}}>{iB}→{lB} {d!==0?(d>0?"+":"")+d.toFixed(1):""}</span></div><div style={{fontSize:12,color:X.p,marginBottom:8}}>{part.focus}</div>{SL.map(function(lb,i){var ck=SK[i];return(<GBar key={ck} label={lb} v1={iS[ck]||0} v2={lat[ck]||0} lw={80}/>);})}</div>);})}</div>
          {SP.map(function(part){var data=mocks.filter(function(s){var sp=s.sCr||{};return sp[part.id]&&sp[part.id].fc>0;});if(data.length<2)return null;return(<div key={part.id}><div style={shd}>{part.lb} 추이 ({part.d})</div><ResponsiveContainer width="100%" height={160}><LineChart data={data.map(function(s,i){var pd=(s.sCr||{})[part.id]||{};return{name:"#"+(i+1),FC:pd.fc||0,LR:pd.lr||0,GRA:pd.gra||0,Pron:pd.pron||0};})}>
            <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:10}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:10}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:12}}/>
            <Line type="monotone" dataKey="FC" stroke="#f59e0b" strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="LR" stroke="#3b82f6" strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="GRA" stroke="#ec4899" strokeWidth={2} dot={{r:3}}/><Line type="monotone" dataKey="Pron" stroke="#22c55e" strokeWidth={2} dot={{r:3}}/>
          </LineChart></ResponsiveContainer></div>);})}
        </div>

        {/* 문제 패턴 */}
        <div style={crd}><h4 style={hd}>⚠️ 모의고사 문제 패턴</h4><ECloud sessions={mocks}/></div>
      </div>)}
    </div>)}

    {/* ═══ 일반 수업 ═══ */}
    {mode==="lesson"&&(<div style={{display:"grid",gap:14}}>
      {lessons.length===0?(<div style={{textAlign:"center",padding:40,color:X.txm,fontSize:15}}>수업 기록 없음</div>):(<div style={{display:"grid",gap:14}}>

        {/* ① 출석 & 숙제 */}
        <div style={crd}>
          <h4 style={hd}>📌 출석 & 숙제</h4>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[["출석률",att+"%",att>=80?X.g:X.r],["총 숙제",hwT+"개",X.ac],["완료",hwD+"개",X.g],["숙제 완료율",hwT?Math.round(hwD/hwT*100)+"%":"—",hwT&&hwD/hwT>=.7?X.g:X.o]].map(function(a,i){return(<div key={i} style={{background:X.bg,borderRadius:10,padding:14,textAlign:"center"}}><div style={{color:X.txm,fontSize:12}}>{a[0]}</div><div style={{fontSize:22,fontFamily:MO,fontWeight:700,color:a[2]}}>{a[1]}</div></div>);})}
          </div>
          {lessons.some(function(s){return s.hw&&s.hw.length>0;})&&(<div><div style={shd}>수업별 숙제 완료</div><ResponsiveContainer width="100%" height={180}><BarChart data={lessons.filter(function(s){return s.hw&&s.hw.length>0;}).map(function(s){return{name:"#"+s.num,done:s.hw.filter(function(h){return h.done;}).length,miss:s.hw.filter(function(h){return!h.done;}).length};})}>
            <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:12}}/>
            <Bar dataKey="done" fill={X.g} stackId="a" name="완료"/><Bar dataKey="miss" fill={X.r} stackId="a" radius={[3,3,0,0]} name="미완"/>
          </BarChart></ResponsiveContainer></div>)}
          {ss.filter(function(s){return!s.att;}).length>0&&(<div style={{marginTop:8,color:X.r,fontSize:14}}>결석일: {ss.filter(function(s){return!s.att;}).map(function(s){return s.dt;}).join(", ")}</div>)}
        </div>

        {/* ② 🎧 Listening 수업 현황 */}
        <div style={crd}>
          <h4 style={hd}>🎧 Listening — 수업에서 다룬 문제유형</h4>
          <div style={{fontSize:13,color:X.txm,marginBottom:10}}>일반 수업에서는 선택한 문제유형별 학습 빈도를 보여줍니다</div>
          {LT.map(function(sec){
            return(<div key={sec.id} style={{background:X.bg,borderRadius:10,padding:14,marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{sec.lb} <span style={{color:X.txm,fontWeight:400}}>{sec.d}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                {sec.ty.map(function(tp,ti){
                  var key=sec.id+"-"+ti;
                  var count=lessons.filter(function(s){return s.qtSel&&s.qtSel[key];}).length;
                  var pct=lessons.length>0?Math.round(count/lessons.length*100):0;
                  return(<div key={ti} style={{padding:"10px 14px",borderRadius:8,background:count>0?X.ac+"10":X.s3,border:"1px solid "+(count>0?X.ac+"30":X.bd)}}>
                    <div style={{fontSize:13,fontWeight:count>0?600:400,color:count>0?X.ac:X.txm}}>{tp.n}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                      <div style={{flex:1,height:6,background:X.s3,borderRadius:3,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:pct>=50?X.g:pct>0?X.ac:X.s3,borderRadius:3}}/></div>
                      <span style={{fontFamily:MO,fontSize:13,fontWeight:700,color:count>0?X.ac:X.txm}}>{count}회</span>
                      <span style={{fontSize:11,color:X.txm}}>({pct}%)</span>
                    </div>
                  </div>);
                })}
              </div>
            </div>);
          })}
        </div>

        {/* ③ 📖 Reading 수업 현황 */}
        <div style={crd}>
          <h4 style={hd}>📖 Reading — 수업에서 다룬 문제유형</h4>
          {rT.map(function(sec){
            return(<div key={sec.id} style={{background:X.bg,borderRadius:10,padding:14,marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>{sec.lb} <span style={{color:X.txm,fontWeight:400}}>{sec.d}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                {sec.ty.map(function(tp,ti){
                  var key=sec.id+"-"+ti;
                  var count=lessons.filter(function(s){return s.qtSel&&s.qtSel[key];}).length;
                  var pct=lessons.length>0?Math.round(count/lessons.length*100):0;
                  return(<div key={ti} style={{padding:"10px 14px",borderRadius:8,background:count>0?X.ac+"10":X.s3,border:"1px solid "+(count>0?X.ac+"30":X.bd)}}>
                    <div style={{fontSize:13,fontWeight:count>0?600:400,color:count>0?X.ac:X.txm}}>{tp.n}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
                      <div style={{flex:1,height:6,background:X.s3,borderRadius:3,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:pct>=50?X.g:pct>0?X.ac:X.s3,borderRadius:3}}/></div>
                      <span style={{fontFamily:MO,fontSize:13,fontWeight:700,color:count>0?X.ac:X.txm}}>{count}회</span>
                    </div>
                  </div>);
                })}
              </div>
            </div>);
          })}
        </div>

        {/* ④ ✍️ Writing 수업 상세 */}
        <div style={crd}>
          <h4 style={hd}>✍️ Writing — 수업별 기준 변화</h4>
          {lessons.filter(function(s){var w=s.wCr||{};return w.t2&&w.t2.ta>0;}).length>=2?(<div>
            <div style={shd}>Task 2 기준 추이 (가중 2/3)</div>
            <ResponsiveContainer width="100%" height={220}><LineChart data={lessons.filter(function(s){var w=s.wCr||{};return w.t2&&w.t2.ta>0;}).map(function(s){var t2=(s.wCr||{}).t2||{};return{name:s.dt.slice(5),TA:t2.ta||0,CC:t2.cc||0,LR:t2.lr||0,GRA:t2.gra||0};})}>
              <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:12}}/>
              <Line type="monotone" dataKey="TA" stroke="#f59e0b" strokeWidth={2} dot={{r:3}} name="Task Ach."/><Line type="monotone" dataKey="CC" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} name="Coherence"/><Line type="monotone" dataKey="LR" stroke="#ec4899" strokeWidth={2} dot={{r:3}} name="Lexical"/><Line type="monotone" dataKey="GRA" stroke="#22c55e" strokeWidth={2} dot={{r:3}} name="Grammar"/>
            </LineChart></ResponsiveContainer>
            {lessons.filter(function(s){var w=s.wCr||{};return w.t1&&w.t1.ta>0;}).length>=2&&(<div>
              <div style={shd}>Task 1 기준 추이 (가중 1/3)</div>
              <ResponsiveContainer width="100%" height={180}><LineChart data={lessons.filter(function(s){var w=s.wCr||{};return w.t1&&w.t1.ta>0;}).map(function(s){var t1=(s.wCr||{}).t1||{};return{name:s.dt.slice(5),TA:t1.ta||0,CC:t1.cc||0,LR:t1.lr||0,GRA:t1.gra||0};})}>
                <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/>
                <Line type="monotone" dataKey="TA" stroke="#f59e0b" strokeWidth={2} dot={{r:2}}/><Line type="monotone" dataKey="CC" stroke="#3b82f6" strokeWidth={2} dot={{r:2}}/><Line type="monotone" dataKey="LR" stroke="#ec4899" strokeWidth={2} dot={{r:2}}/><Line type="monotone" dataKey="GRA" stroke="#22c55e" strokeWidth={2} dot={{r:2}}/>
              </LineChart></ResponsiveContainer>
            </div>)}
          </div>):(<div style={{color:X.txm,textAlign:"center",padding:16}}>Writing 채점 데이터 2회 이상 필요</div>)}
        </div>

        {/* ⑤ 🗣️ Speaking 수업 상세 */}
        <div style={crd}>
          <h4 style={hd}>🗣️ Speaking — 수업별 기준 변화</h4>
          {lessons.filter(function(s){var sp=s.sCr||{};return sp.p1&&sp.p1.fc>0;}).length>=2?(<div>
            <div style={shd}>전체 평균 추이</div>
            <ResponsiveContainer width="100%" height={220}><LineChart data={lessons.filter(function(s){var sp=s.sCr||{};return sp.p1&&sp.p1.fc>0;}).map(function(s){var sp=s.sCr||{};var av=function(k){var t=0,c=0;SP.forEach(function(pt){var v=(sp[pt.id]&&sp[pt.id][k])||0;if(v>0){t+=v;c++;}});return c>0?Math.round(t/c*10)/10:0;};return{name:s.dt.slice(5),FC:av("fc"),LR:av("lr"),GRA:av("gra"),Pron:av("pron")};})}>
              <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:11}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:11}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:13}}/><Legend wrapperStyle={{fontSize:12}}/>
              <Line type="monotone" dataKey="FC" stroke="#f59e0b" strokeWidth={2} dot={{r:3}} name="Fluency"/><Line type="monotone" dataKey="LR" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} name="Lexical"/><Line type="monotone" dataKey="GRA" stroke="#ec4899" strokeWidth={2} dot={{r:3}} name="Grammar"/><Line type="monotone" dataKey="Pron" stroke="#22c55e" strokeWidth={2} dot={{r:3}} name="Pronun."/>
            </LineChart></ResponsiveContainer>
            {SP.map(function(part){var data=lessons.filter(function(s){var sp=s.sCr||{};return sp[part.id]&&sp[part.id].fc>0;});if(data.length<2)return null;return(<div key={part.id}><div style={shd}>{part.lb} 추이 ({part.d})</div><ResponsiveContainer width="100%" height={160}><LineChart data={data.map(function(s){var pd=(s.sCr||{})[part.id]||{};return{name:s.dt.slice(5),FC:pd.fc||0,LR:pd.lr||0,GRA:pd.gra||0,Pron:pd.pron||0};})}>
              <CartesianGrid stroke={X.bd} strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:X.txm,fontSize:10}}/><YAxis domain={yD} tick={{fill:X.txm,fontSize:10}}/><Tooltip contentStyle={{background:X.s1,border:"1px solid "+X.bd,borderRadius:9,fontSize:12}}/>
              <Line type="monotone" dataKey="FC" stroke="#f59e0b" strokeWidth={2} dot={{r:2}}/><Line type="monotone" dataKey="LR" stroke="#3b82f6" strokeWidth={2} dot={{r:2}}/><Line type="monotone" dataKey="GRA" stroke="#ec4899" strokeWidth={2} dot={{r:2}}/><Line type="monotone" dataKey="Pron" stroke="#22c55e" strokeWidth={2} dot={{r:2}}/>
            </LineChart></ResponsiveContainer></div>);})}
          </div>):(<div style={{color:X.txm,textAlign:"center",padding:16}}>Speaking 채점 데이터 2회 이상 필요</div>)}
        </div>

        {/* ⑥ 문제 패턴 */}
        <div style={crd}><h4 style={hd}>⚠️ 수업 중 문제 패턴</h4><ECloud sessions={lessons}/></div>
      </div>)}
    </div>)}
  </div>);
}

/* ═══ OUTCOME ═══ */
function OuTab(p){
  var st=p.st,upd=p.upd;var fs=st.finalS||{listening:0,reading:0,writing:0,speaking:0};
  var fov=ovBand(fs.listening,fs.reading,fs.writing,fs.speaking);var sc=calcAll(st.assess,st.tt);
  function setF(k,v){upd(st.id,function(p){return Object.assign({},p,{finalS:Object.assign({listening:0,reading:0,writing:0,speaking:0},p.finalS,Object.fromEntries([[k,+v]]))});});}
  return(<div style={Object.assign({},cs,{padding:24})}>
    <h3 style={{margin:"0 0 18px",fontSize:18}}>🏆 최종 결과</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:22}}>
      {OCS.map(function(o){return(<button key={o.id} onClick={function(){upd(st.id,{outcome:o.id});}} style={{padding:"16px 12px",borderRadius:12,border:"2px solid "+(st.outcome===o.id?o.c:X.bd),background:st.outcome===o.id?o.c+"15":X.bg,color:st.outcome===o.id?o.c:X.txm,cursor:"pointer",fontFamily:FT,fontSize:15,fontWeight:st.outcome===o.id?700:400}}>{o.lb}</button>);})}
    </div>
    {st.outcome==="achieved"&&(<div>
      <h4 style={{margin:"0 0 12px",fontSize:15}}>최종 점수</h4>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[["listening","🎧 L"],["reading","📖 R"],["writing","✍️ W"],["speaking","🗣️ S"]].map(function(a){return(<div key={a[0]} style={{textAlign:"center"}}><div style={{fontSize:14,color:X.txm,marginBottom:4}}>{a[1]}</div><BS value={fs[a[0]]||0} onChange={function(e){setF(a[0],e.target.value);}} style={{fontSize:16}}/></div>);})}
      </div>
      <div style={{textAlign:"center",padding:16,background:X.acS,borderRadius:12,marginTop:14}}>
        <div style={{fontSize:13,color:X.txm}}>Overall</div>
        <div style={{fontSize:34,fontWeight:700,fontFamily:MO,color:fov>=st.tgt?X.g:X.ac}}>{fov||"—"}</div>
        {fov>=st.tgt&&(<div style={{fontSize:14,color:X.g}}>🎉 목표 달성!</div>)}
      </div>
    </div>)}
    <div style={{marginTop:22,padding:18,background:X.bg,borderRadius:12}}>
      <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:600}}>수강 요약</h4>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,fontSize:15}}>
        <div><span style={{color:X.txm}}>수업:</span> {st.sess.length}회</div>
        <div><span style={{color:X.txm}}>출석:</span> {st.sess.length?Math.round(st.sess.filter(function(s){return s.att;}).length/st.sess.length*100):0}%</div>
        <div><span style={{color:X.txm}}>초기:</span> <span style={{fontFamily:MO,color:bc(sc.ov)}}>{sc.ov}</span></div>
        <div><span style={{color:X.txm}}>최종:</span> <span style={{fontFamily:MO,color:bc(fov)}}>{fov||"—"}</span></div>
        <div><span style={{color:X.txm}}>성장:</span> <span style={{fontFamily:MO,color:(fov-sc.ov)>0?X.g:X.r}}>{fov?(fov-sc.ov>0?"+":"")+(fov-sc.ov).toFixed(1):"—"}</span></div>
      </div>
    </div>
  </div>);
}

/* ═══ IELTS INFO ═══ */
function InfoTab(){
  var _sec=useState("overview");var sec=_sec[0],setSec=_sec[1];
  var secs=[["overview","📋 시험 개요"],["acgt","🔀 Ac vs GT"],["format","📝 시험 구성"],["scoring","📊 채점 기준"],["band","🎯 변환표"],["osr","🔄 OSR/리테이크"],["tips","💡 상담 팁"]];
  var crd=Object.assign({},cs,{padding:22,marginBottom:14});
  var hd={fontSize:17,fontWeight:700,margin:"0 0 14px",color:X.ac};
  var shd={fontSize:15,fontWeight:600,margin:"16px 0 8px"};
  var tx={fontSize:14,lineHeight:"1.9",color:X.tx};
  var txm2={fontSize:13,color:X.txm,lineHeight:"1.8"};
  var hi=function(c){return{fontSize:14,lineHeight:"1.8",padding:"12px 16px",background:c+"10",borderLeft:"3px solid "+c,borderRadius:"0 8px 8px 0",marginBottom:10};};
  var tbl={width:"100%",borderCollapse:"collapse",fontSize:13};
  var th={padding:"8px 10px",textAlign:"center",background:X.s2,color:X.txm,borderBottom:"2px solid "+X.bd,fontSize:12,fontWeight:600};
  var td={padding:"6px 10px",textAlign:"center",borderBottom:"1px solid "+X.bd+"50",fontFamily:MO,fontSize:13};

  return(<div>
    <div style={{display:"flex",gap:4,marginBottom:18,flexWrap:"wrap"}}>{secs.map(function(s){return(<Chip key={s[0]} active={sec===s[0]} onClick={function(){setSec(s[0]);}}>{s[1]}</Chip>);})}</div>

    {sec==="overview"&&(<div style={crd}>
      <h3 style={hd}>IELTS란?</h3>
      <div style={tx}>
        <p><strong>International English Language Testing System</strong></p>
        <p>1989년 British Council, IDP, Cambridge Assessment English 공동 개발. 전 세계 11,500+ 기관 인정, 연 350만+ 응시.</p>
        <div style={shd}>시험 방식</div>
        <p><strong>Paper-based (PBT)</strong> — 종이시험, Speaking 별도 일정</p>
        <p><strong>Computer-delivered (CDT)</strong> — 컴퓨터, 결과 3-5일, 한국은 CDT 주류</p>
        <div style={shd}>비용 / 유효기간</div>
        <p>한국: <strong>₩283,000</strong> (2025-2026) · 유효기간: <strong>2년</strong></p>
      </div>
    </div>)}

    {sec==="acgt"&&(<div style={crd}>
      <h3 style={hd}>Academic vs General Training 비교</h3>
      <div style={hi(X.ac)}><strong>공통:</strong> Listening 과 Speaking은 Academic/GT 완전 동일합니다. 차이는 Reading과 Writing만 있습니다.</div>
      <table style={tbl}><thead><tr><th style={th}>구분</th><th style={Object.assign({},th,{color:"#3b82f6"})}>Academic</th><th style={Object.assign({},th,{color:"#22c55e"})}>General Training</th></tr></thead><tbody>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>용도</td><td style={Object.assign({},td,{fontFamily:FT})}>대학/대학원 입학, 전문직</td><td style={Object.assign({},td,{fontFamily:FT})}>이민, 취업, 직업훈련</td></tr>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>🎧 Listening</td><td colSpan={2} style={Object.assign({},td,{fontFamily:FT,color:X.txm})}>동일 — 4 Section, 40문항, 30분</td></tr>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>📖 Reading</td><td style={Object.assign({},td,{fontFamily:FT})}>학술 지문 3개 (800-900단어)</td><td style={Object.assign({},td,{fontFamily:FT})}>일상→직장→일반 3 Section</td></tr>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>R 난이도</td><td style={Object.assign({},td,{fontFamily:FT,color:"#f97316"})}>더 어려움</td><td style={Object.assign({},td,{fontFamily:FT,color:"#22c55e"})}>비교적 쉬움</td></tr>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>R 변환표</td><td style={Object.assign({},td,{fontFamily:FT})}>30/40 = Band 7.0</td><td style={Object.assign({},td,{fontFamily:FT})}>34/40 = Band 7.0 (더 높아야 함)</td></tr>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>✍️ Writing T1</td><td style={Object.assign({},td,{fontFamily:FT})}>그래프/차트/프로세스/지도 묘사</td><td style={Object.assign({},td,{fontFamily:FT})}>편지 쓰기 (격식/비격식)</td></tr>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>✍️ Writing T2</td><td colSpan={2} style={Object.assign({},td,{fontFamily:FT,color:X.txm})}>동일 — 에세이 250단어+ (유형도 동일)</td></tr>
        <tr><td style={Object.assign({},td,{color:X.txm,fontFamily:FT})}>🗣️ Speaking</td><td colSpan={2} style={Object.assign({},td,{fontFamily:FT,color:X.txm})}>동일 — Part 1/2/3, 11-14분</td></tr>
      </tbody></table>
      <div style={Object.assign({},hi(X.y),{marginTop:14})}><strong>핵심:</strong> GT Reading이 쉬운 대신 변환표가 더 까다로움. Academic 30/40=7.0이지만 GT는 34/40=7.0. 결국 같은 밴드를 받으려면 GT도 쉽지 않음.</div>
    </div>)}

    {sec==="format"&&(<div style={crd}>
      <h3 style={hd}>시험 구성 상세</h3>
      <div style={tx}>
        <div style={shd}>🎧 Listening (30분 + 전사 10분) — Ac/GT 동일</div>
        <p>40문항, 4 Section, 음원 1회 재생</p>
        <p><strong>S1:</strong> 일상 대화(2명) — Form/Note Comp, MC</p>
        <p><strong>S2:</strong> 일상 모놀로그(1명) — MC, Map/Plan, Sentence Comp</p>
        <p><strong>S3:</strong> 학술 토론(2-4명) — MC, Matching, Summary</p>
        <p><strong>S4:</strong> 학술 강의(1명) — Sentence/Note Completion</p>

        <div style={shd}>📖 Reading (60분)</div>
        <div style={hi("#3b82f6")}><strong>Academic:</strong> 학술 지문 3개 (Passage 1→3 난이도 상승), 총 40문항<br/>문제유형: T/F/NG, Matching Headings, MC, Summary, Sentence Completion 등</div>
        <div style={hi("#22c55e")}><strong>GT:</strong> 3 Section — S1(광고/안내), S2(직장문서), S3(일반 긴 지문), 총 40문항<br/>문제유형: T/F/NG, Y/N/NG, Matching, Short Answer, MC 등</div>

        <div style={shd}>✍️ Writing (60분)</div>
        <div style={hi("#3b82f6")}><strong>Academic Task 1 (20분):</strong> 그래프/차트/프로세스/지도 묘사, 150단어+</div>
        <div style={hi("#22c55e")}><strong>GT Task 1 (20분):</strong> 편지 쓰기 (Formal/Semi-formal/Informal), 150단어+</div>
        <p><strong>Task 2 (40분) — Ac/GT 동일:</strong> 에세이 250단어+</p>
        <p>유형: Agree/Disagree, Both Views, Problem/Solution, Advantage/Disadvantage, Two-part</p>
        <p style={txm2}>※ Task 2 가중치가 Task 1의 2배 (2/3 vs 1/3)</p>

        <div style={shd}>🗣️ Speaking (11-14분) — Ac/GT 동일</div>
        <p><strong>Part 1 (4-5분):</strong> 자기소개 + 일상 주제 → Fluency & Pron 중점</p>
        <p><strong>Part 2 (3-4분):</strong> 1분 준비, 2분 발표 (Cue Card) → FC & LR 중점</p>
        <p><strong>Part 3 (4-5분):</strong> Part 2 연계 심화 토론 → GRA & LR 중점</p>
      </div>
    </div>)}

    {sec==="scoring"&&(<div style={crd}>
      <h3 style={hd}>채점 기준</h3>
      <div style={tx}>
        <div style={shd}>🎧 Listening / 📖 Reading</div>
        <p>정답 수(/40) → 변환표로 Band 변환. <strong>스펠링 정확해야 함</strong>, 대소문자 무관</p>
        <div style={hi(X.y)}>Academic Reading과 GT Reading은 변환표가 다릅니다 (변환표 탭 참고)</div>

        <div style={shd}>✍️ Writing (4기준 × Band 0-9)</div>
        <p><strong>Task Achievement (TA):</strong> 질문 응답 완성도, 입장 명확, 아이디어 발전</p>
        <p><strong>Coherence & Cohesion (CC):</strong> 논리 구성, 문단 구조, 연결어</p>
        <p><strong>Lexical Resource (LR):</strong> 어휘 범위·정확성, 콜로케이션</p>
        <p><strong>Grammatical Range & Accuracy (GRA):</strong> 문법 다양성·정확도</p>
        <p style={txm2}>최종 = Task1(1/3) + Task2(2/3), 각 4기준 평균</p>

        <div style={shd}>🗣️ Speaking (4기준 × Band 0-9)</div>
        <p><strong>Fluency & Coherence (FC):</strong> 유창성, 속도, 자연스러운 연결</p>
        <p><strong>Lexical Resource (LR):</strong> 어휘 범위, 정확한 단어 선택</p>
        <p><strong>Grammatical Range & Accuracy (GRA):</strong> 문법 다양성·정확도</p>
        <p><strong>Pronunciation (Pron):</strong> 발음, 강세, 억양, 연음</p>
        <p style={txm2}>최종 = 4기준 평균, 0.5 반올림</p>

        <div style={shd}>Overall Band Score</div>
        <p>Overall = (L + R + W + S) ÷ 4</p>
        <p>.25↑ → 0.5 올림 · .75↑ → 1.0 올림</p>
        <p>예: (7+6.5+6+6.5)/4 = 6.5 → <strong>Overall 6.5</strong></p>
        <p>예: (7+7+6.5+7)/4 = 6.875 → <strong>Overall 7.0</strong></p>
      </div>
    </div>)}

    {sec==="band"&&(<div style={crd}>
      <h3 style={hd}>Raw Score → Band 변환표</h3>
      <div style={shd}>🎧 Listening (Ac/GT 동일)</div>
      <div style={{overflowX:"auto"}}><table style={tbl}><thead><tr>{["Raw","39-40","37-38","35-36","33-34","30-32","27-29","23-26","20-22","16-19","13-15","10-12"].map(function(h){return(<th key={h} style={th}>{h}</th>);})}</tr></thead><tbody><tr>{["Band","9","8.5","8","7.5","7","6.5","6","5.5","5","4.5","4"].map(function(v,i){return(<td key={i} style={Object.assign({},td,{color:i===0?X.txm:bc(parseFloat(v))})}>{v}</td>);})}</tr></tbody></table></div>
      <div style={shd}>📖 Reading — Academic</div>
      <div style={{overflowX:"auto"}}><table style={tbl}><thead><tr>{["Raw","39-40","37-38","35-36","33-34","30-32","27-29","23-26","19-22","15-18","13-14","10-12"].map(function(h){return(<th key={h} style={th}>{h}</th>);})}</tr></thead><tbody><tr>{["Band","9","8.5","8","7.5","7","6.5","6","5.5","5","4.5","4"].map(function(v,i){return(<td key={i} style={Object.assign({},td,{color:i===0?X.txm:bc(parseFloat(v))})}>{v}</td>);})}</tr></tbody></table></div>
      <div style={shd}>📖 Reading — General Training</div>
      <div style={{overflowX:"auto"}}><table style={tbl}><thead><tr>{["Raw","40","39","38","36-37","34-35","32-33","30-31","27-29","23-26","19-22","15-18"].map(function(h){return(<th key={h} style={th}>{h}</th>);})}</tr></thead><tbody><tr>{["Band","9","8.5","8","7.5","7","6.5","6","5.5","5","4.5","4"].map(function(v,i){return(<td key={i} style={Object.assign({},td,{color:i===0?X.txm:bc(parseFloat(v))})}>{v}</td>);})}</tr></tbody></table></div>
      <div style={hi(X.y)}>GT는 지문이 쉬운 대신 같은 밴드를 받으려면 더 높은 Raw Score 필요. 예: Band 7.0 → Ac: 30/40 vs GT: 34/40</div>
    </div>)}

    {sec==="osr"&&(<div style={crd}>
      <h3 style={hd}>One Skill Retake (OSR)</h3>
      <div style={tx}>
        <p>2023년 도입. <strong>4영역 중 1개만 재시험</strong> 가능.</p>
        <div style={shd}>조건</div>
        <p>• 원래 시험일로부터 <strong>60일 이내</strong></p>
        <p>• <strong>같은 센터</strong>에서만 가능 · <strong>CDT만</strong> 가능 (Paper 불가) · <strong>1회만</strong></p>
        <div style={shd}>비용</div>
        <p>약 <strong>₩180,000~200,000</strong> (전체의 ~70%)</p>
        <div style={shd}>결과</div>
        <p>OSR 결과와 원래 중 <strong>높은 점수</strong>로 새 성적표 발급. OSR 표시 없음.</p>
        <div style={shd}>전략</div>
        <div style={hi(X.g)}>Overall 0.5 부족할 때 가장 올리기 쉬운 영역 1개만 리테이크. 예: L:7 R:7 W:6 S:7 = OA 6.5 → W만 리테이크해서 6.5 받으면 OA 7.0</div>
        <div style={shd}>일반 재시험</div>
        <p>제한 없음, 매주 가능. 최소 2-4주 간격 권장.</p>
      </div>
    </div>)}

    {sec==="tips"&&(<div style={crd}>
      <h3 style={hd}>상담 가이드</h3>
      <div style={tx}>
        <div style={shd}>밴드별 수준</div>
        <p><span style={{color:bc(9)}}>■</span> 9.0 Expert — 원어민 수준</p>
        <p><span style={{color:bc(8)}}>■</span> 8.0-8.5 — 복잡한 논증, 간헐적 실수</p>
        <p><span style={{color:bc(7)}}>■</span> 7.0-7.5 — 대부분 상황 처리, 가끔 부정확</p>
        <p><span style={{color:bc(6)}}>■</span> 6.0-6.5 — 일상 소통, 복잡한 표현 제한</p>
        <p><span style={{color:bc(5)}}>■</span> 5.0-5.5 — 기본 소통, 실수 빈번</p>
        <p><span style={{color:bc(4)}}>■</span> 4.0-4.5 — 익숙한 상황만 가능</p>
        <div style={shd}>기관별 요구 점수</div>
        <p><strong>영국 대학원:</strong> OA 6.5-7.0 (각 6.0-6.5+)</p>
        <p><strong>호주 이민:</strong> OA 7.0+ (각 7.0+면 가산점)</p>
        <p><strong>캐나다 Express Entry:</strong> CLB 7 = 각 6.0+</p>
        <p><strong>간호사 (호주):</strong> OA 7.0 + 각 7.0</p>
        <p><strong>의사 (영국):</strong> OA 7.5 + 각 7.0</p>
        <div style={shd}>학습 기간 (주 3회 기준)</div>
        <p>Band <strong>0.5↑:</strong> 4-6주 · <strong>1.0↑:</strong> 8-12주 · <strong>1.5↑:</strong> 12-16주 · <strong>2.0↑:</strong> 16주+</p>
        <div style={shd}>섹션별 올리기 난이도</div>
        <p><span style={{color:X.g}}>●</span> <strong>L</strong> 가장 쉬움 — 전략+반복으로 빠른 향상</p>
        <p><span style={{color:X.y}}>●</span> <strong>R</strong> 보통 — 어휘+시간관리 필요</p>
        <p><span style={{color:X.o}}>●</span> <strong>S</strong> 어려움 — 발음/유창성 시간 필요, 구조화로 단기 가능</p>
        <p><span style={{color:X.r}}>●</span> <strong>W</strong> 가장 어려움 — 논리+어휘+문법 동시 필요</p>
      </div>
    </div>)}
  </div>);
}
