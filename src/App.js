import { useState, useEffect, useCallback, useMemo } from "react";

// ── Config ────────────────────────────────────────────────────────────
var SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
var SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
var ADMIN_PASS   = process.env.REACT_APP_ADMIN_PASS || "";
var READY = Boolean(SUPABASE_URL && SUPABASE_KEY);

// ── Constants ─────────────────────────────────────────────────────────
var PROVINCES = ["بغداد","البصرة","نينوى","أربيل","السليمانية","كركوك","الأنبار","ديالى","بابل","كربلاء","النجف","واسط","ذي قار","ميسان","المثنى","القادسية","صلاح الدين","دهوك"];
var EMPLOY_OPTS = ["موظف","غير موظف","طالب دراسات عليا"];
var EMPLOY_COLORS = {"موظف":"#22c55e","غير موظف":"#ef4444","طالب دراسات عليا":"#6366f1"};
var CUR_YEAR = new Date().getFullYear();

var IRAQ_DISTRICTS = {
  "بغداد":      ["الكرخ","الرصافة","الكاظمية","الأعظمية","الكرادة","أبو غريب","المحمودية","المدائن","الطارمية","الصدر","الشعلة","العامرية","الدورة","الزعفرانية"],
  "البصرة":     ["البصرة المركز","أبو الخصيب","الزبير","القرنة","شط العرب","الفاو","المدينة","الدير","المطر"],
  "نينوى":      ["الموصل","الحمدانية","سنجار","تلعفر","تلكيف","الشيخان","بعشيقة","ربيعة","مخمور","الحضر","برطلة","النمرود"],
  "أربيل":      ["أربيل","كويسنجق","شقلاوة","صوران","سوران","مخمور","ديانا"],
  "السليمانية": ["السليمانية","حلبجة","رانية","دوكان","كفري","بنجوين","قلعة دزة","شهربازار","قره داغ"],
  "كركوك":      ["كركوك","داقوق","حويجة","دبس"],
  "الأنبار":    ["الرمادي","الفلوجة","القائم","حديثة","هيت","عانه","راوة","الرطبة","البغدادي","الكرمة","الخالدية"],
  "ديالى":      ["بعقوبة","المقدادية","خانقين","بلدروز","الخالص","كفري","قره تبة","الشهربان","الوجيهية"],
  "بابل":       ["الحلة","المسيب","الهاشمية","المحاويل","الكفل","الشوملي","قضاء النيل"],
  "كربلاء":     ["كربلاء","الهندية","عين التمر"],
  "النجف":      ["النجف","الكوفة","المناذرة","أبو صخير"],
  "واسط":       ["الكوت","النعمانية","الحي","بدرة","الصويرة","العزيزية","الأحمدي","الموفقية","الشحيمية"],
  "ذي قار":     ["الناصرية","الشطرة","قلعة سكر","الرفاعي","سوق الشيوخ","الجبايش","الفجر","الفهود","كرمة علي"],
  "ميسان":      ["العمارة","علي الغربي","قلعة صالح","الكحلاء","المجر الكبير","الأحمدي","سيد نور الدين"],
  "المثنى":     ["السماوة","الرميثة","السلمان","الخضر"],
  "القادسية":   ["الديوانية","الشامية","السنية","عفك","نفر"],
  "صلاح الدين": ["تكريت","بيجي","بلد","الدور","الشرقاط","سامراء","الطوز"],
  "دهوك":       ["دهوك","زاخو","عقرة","أمدية","العمادية","شيخان"]
};

// SVG icon paths (Heroicons)
var P = {
  users:      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  male:       "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  female:     "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  map:        "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  grad:       "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
  heart:      "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  person:     "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  search:     "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  news:       "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  plus:       "M12 4v16m8-8H4",
  trash:      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  lock:       "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  shield:     "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  chart:      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  info:       "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  privacy:    "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4",
  edit:       "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
};

function SvgIcon({d, size, color, sw}) {
  return (
    <svg width={size||20} height={size||20} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth={sw||2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

// ── API ───────────────────────────────────────────────────────────────
var H = function() {
  return {"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"};
};
var db = {
  getStats: async function() {
    var r = await fetch(SUPABASE_URL+"/rest/v1/rpc/get_dashboard_stats",{method:"POST",headers:H(),body:"{}"});
    if(!r.ok) throw new Error("stats");
    return r.json();
  },
  getMembers: async function(page) {
    var from=(page||0)*100, to=from+99;
    var r = await fetch(
      SUPABASE_URL+"/rest/v1/graduates?select=id,full_name,province,sub_district,specialization,department,graduation_year,gender,university,employment_status,marital_status,has_wife,has_children,children_count,created_at&order=created_at.desc",
      {headers:Object.assign({},H(),{"Range":from+"-"+to})}
    );
    if(!r.ok) throw new Error("members");
    return r.json();
  },
  getAll: async function() {
    var r = await fetch(SUPABASE_URL+"/rest/v1/graduates?select=*&order=created_at.desc&limit=10000",{headers:H()});
    if(!r.ok) throw new Error("all");
    return r.json();
  },
  insert: async function(data) {
    var r = await fetch(SUPABASE_URL+"/rest/v1/graduates",{
      method:"POST",
      headers:Object.assign({},H(),{"Prefer":"return=minimal"}),
      body:JSON.stringify(data)
    });
    if(!r.ok){var e=await r.json();throw new Error(e.code==="23505"?"phone_exists":"insert_failed");}
    return true;
  },
  deleteGraduate: async function(id) {
    var r = await fetch(SUPABASE_URL+"/rest/v1/graduates?id=eq."+encodeURIComponent(id),{method:"DELETE",headers:H()});
    if(!r.ok) throw new Error("delete_failed");
    return true;
  },
  searchByPhone: async function(phone, name) {
    var r = await fetch(
      SUPABASE_URL+"/rest/v1/graduates?select=full_name,province,sub_district,specialization,department,graduation_year,gender,university,employment_status,marital_status,birth_date,created_at&phone=eq."+encodeURIComponent(phone)+"&limit=1",
      {headers:H()}
    );
    if(!r.ok) throw new Error("search_failed");
    var data = await r.json();
    if(!data.length) return {found:false, reason:"phone"};
    var rec = data[0];
    var normalize = function(s){ return (s||"").trim().replace(/\s+/g," "); };
    var dbName = normalize(rec.full_name);
    var enteredWords = normalize(name).split(" ").filter(function(w){return w.length>1;});
    var nameMatch = enteredWords.length>0 && enteredWords.every(function(w){return dbName.includes(w);});
    if(!nameMatch) return {found:false, reason:"name"};
    return {found:true, data:rec};
  },
  getTickerMessages: async function() {
    var r = await fetch(SUPABASE_URL+"/rest/v1/ticker_messages?select=id,message&order=created_at.asc",{headers:H()});
    if(!r.ok) return [];
    return r.json();
  },
  addTickerMessage: async function(message) {
    var r = await fetch(SUPABASE_URL+"/rest/v1/ticker_messages",{
      method:"POST",headers:Object.assign({},H(),{"Prefer":"return=minimal"}),
      body:JSON.stringify({message})
    });
    if(!r.ok) throw new Error("add_ticker_failed");
    return true;
  },
  deleteTickerMessage: async function(id) {
    var r = await fetch(SUPABASE_URL+"/rest/v1/ticker_messages?id=eq."+id,{
      method:"DELETE",headers:H()
    });
    if(!r.ok) throw new Error("delete_ticker_failed");
    return true;
  }
};

// ── Style helpers ─────────────────────────────────────────────────────
function navBtn(a) {
  return {background:a?"rgba(255,255,255,.18)":"transparent",border:"none",color:"#fff",padding:"9px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:a?700:500,transition:"all .2s"};
}
function inp(err) {
  return {width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid "+(err?"#f87171":"#e2e8f0"),fontSize:14,outline:"none",background:"#f8fafc",boxSizing:"border-box"};
}
function btn(bg1,bg2) {
  return {background:"linear-gradient(135deg,"+(bg1||"#1d4ed8")+","+(bg2||"#1e40af")+")",color:"#fff",border:"none",padding:"11px 24px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"};
}
var card     = {background:"#fff",borderRadius:16,padding:"24px",boxShadow:"0 2px 16px rgba(0,0,0,.06)",marginBottom:20,border:"1px solid #f1f5f9"};
var pageWrap = {maxWidth:1000,margin:"0 auto",padding:"28px 16px"};
var grid2    = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:16};

// ── Shared Components ─────────────────────────────────────────────────
function Field({label,error,children,optional}) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"flex",alignItems:"center",gap:6,fontWeight:600,marginBottom:7,fontSize:13,color:"#374151"}}>
        {label}
        {optional && <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>(اختياري)</span>}
      </label>
      {children}
      {error && <div style={{color:"#ef4444",fontSize:12,marginTop:4}}>{error}</div>}
    </div>
  );
}

function Check({value,label,color,onChange}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}} onClick={()=>onChange(!value)}>
      <div style={{width:20,height:20,borderRadius:5,border:"2px solid "+(value?(color||"#1d4ed8"):"#cbd5e1"),background:value?(color||"#1d4ed8"):"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {value && <SvgIcon d="M5 13l4 4L19 7" size={12} color="#fff" sw={2.5}/>}
      </div>
      <span style={{fontSize:14,color:"#374151",fontWeight:value?600:400}}>{label}</span>
    </div>
  );
}

function SectionHeader({icon,title,color}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
      <div style={{width:34,height:34,borderRadius:10,background:color||"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <SvgIcon d={icon} size={18} color="#fff"/>
      </div>
      <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{title}</span>
    </div>
  );
}

// ── Professional Stat Card ────────────────────────────────────────────
function StatCardPro({iconPath, label, val, pct, color, barPct}) {
  var bar = Math.min(barPct||pct||0, 100);
  return (
    <div style={{background:"#fff",borderRadius:16,padding:"20px 20px 14px",boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:"1px solid #f1f5f9",borderRight:"4px solid "+color,flex:"1 1 190px",minWidth:180}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:12,color:"#94a3b8",fontWeight:500,direction:"ltr"}}>{pct>0?pct.toFixed(1)+"%":""}</span>
        <div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,"+color+","+color+"cc)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px "+color+"44"}}>
          <SvgIcon d={iconPath} size={22} color="#fff"/>
        </div>
      </div>
      <div style={{fontSize:13,color:"#64748b",marginBottom:6,fontWeight:500,textAlign:"right"}}>{label}</div>
      <div style={{fontSize:32,fontWeight:800,color:"#0f172a",textAlign:"right",marginBottom:12,direction:"ltr",lineHeight:1}}>{val}</div>
      <div style={{height:4,background:"#f1f5f9",borderRadius:2}}>
        <div style={{height:"100%",width:Math.max(bar,2)+"%",background:"linear-gradient(90deg,"+color+"88,"+color+")",borderRadius:2}}/>
      </div>
    </div>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────
function Ticker() {
  var [text,setText] = useState("تنبيه: هذا الموقع لا يمثل أي جهة حكومية وغير تابع إلى أي جهة حكومية — رابطة الخريجين العراقيين القدماء");

  useEffect(function(){
    if(!document.getElementById("ticker-css")){
      var s=document.createElement("style");
      s.id="ticker-css";
      s.textContent="@keyframes ticker-ltr{from{transform:translateX(-100%)}to{transform:translateX(100vw)}}";
      document.head.appendChild(s);
    }
    db.getTickerMessages().then(function(msgs){
      if(msgs&&msgs.length) setText(msgs.map(function(m){return m.message;}).join("  •  "));
    });
  },[]);

  return (
    <div style={{background:"#0f2c54",borderBottom:"2px solid #fbbf24",overflow:"hidden",height:34,display:"flex",alignItems:"center"}}>
      <div style={{background:"#fbbf24",color:"#0f172a",padding:"0 14px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",height:"100%",display:"flex",alignItems:"center",flexShrink:0,gap:6}}>
        <SvgIcon d={P.news} size={13} color="#0f172a"/>
        إشعار
      </div>
      <div style={{overflow:"hidden",flex:1,height:"100%",display:"flex",alignItems:"center"}}>
        <span style={{display:"inline-block",whiteSpace:"nowrap",color:"#fef9c3",fontSize:12,fontWeight:400,animation:"ticker-ltr 40s linear infinite"}}>
          {text}
        </span>
      </div>
    </div>
  );
}

// ── Search Modal ──────────────────────────────────────────────────────
function SearchModal({onClose}) {
  var [phone,setPhone]   = useState("");
  var [name,setName]     = useState("");
  var [loading,setLoad]  = useState(false);
  var [result,setResult] = useState(null);
  var [status,setStatus] = useState("idle");

  function normalizePhone(v){
    return v.replace(/[\s\-+]/g,"").replace(/^00964/,"0").replace(/^964/,"0");
  }
  function reset(){ setResult(null); setStatus("idle"); }

  async function search() {
    var p = normalizePhone(phone.trim());
    if(!name.trim()||name.trim().split(/\s+/).length<3){setStatus("err_name");return;}
    if(!/^07[3-9]\d{8}$/.test(p)){setStatus("err_phone");return;}
    setLoad(true); reset();
    try {
      var res = await db.searchByPhone(p, name.trim());
      if(res.found){ setResult(res.data); setStatus("found"); }
      else setStatus(res.reason==="phone"?"no_phone":"no_name");
    } catch(e){ setStatus("err_api"); }
    setLoad(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,direction:"rtl"}} onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:500,boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#0f2c54,#1e40af)",padding:"22px 24px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,left:14,background:"rgba(239,68,68,.85)",border:"none",color:"#fff",borderRadius:8,padding:"5px 14px",fontSize:12,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
            <SvgIcon d="M6 18L18 6M6 6l12 12" size={13} color="#fff"/> إغلاق
          </button>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{background:"rgba(255,255,255,.15)",borderRadius:12,padding:"11px",display:"flex"}}>
              <SvgIcon d={P.search} size={24} color="#fff"/>
            </div>
            <div>
              <h3 style={{color:"#fff",margin:0,fontSize:18,fontWeight:700}}>البحث عن حالة التسجيل</h3>
              <p style={{color:"#93c5fd",margin:"4px 0 0",fontSize:13}}>أدخل اسمك الرباعي ورقم هاتفك للتحقق</p>
            </div>
          </div>
        </div>

        <div style={{padding:"24px"}}>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>الاسم الرباعي الكامل</label>
            <input value={name} onChange={function(e){setName(e.target.value);reset();}}
              onKeyDown={function(e){if(e.key==="Enter")search();}}
              placeholder="أدخل الاسم الرباعي كما هو مسجل..."
              style={{...inp(status==="err_name"||status==="no_name"),marginBottom:0}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>رقم الهاتف المسجل</label>
            <div style={{display:"flex",gap:10}}>
              <input value={phone} onChange={function(e){setPhone(e.target.value);reset();}}
                onKeyDown={function(e){if(e.key==="Enter")search();}}
                placeholder="07XXXXXXXXX"
                style={{...inp(status==="err_phone"||status==="no_phone"),flex:1,direction:"ltr",textAlign:"right",marginBottom:0}}/>
              <button onClick={search} disabled={loading} style={{...btn("#1e40af","#1d4ed8"),padding:"11px 22px",opacity:loading?0.7:1,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8}}>
                <SvgIcon d={P.search} size={16} color="#fff"/>
                {loading?"جاري البحث...":"بحث"}
              </button>
            </div>
          </div>

          {status==="err_name"  && <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>يرجى إدخال الاسم الرباعي (4 أجزاء على الأقل)</div>}
          {status==="err_phone" && <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>رقم الهاتف غير صحيح — يجب أن يبدأ بـ 07</div>}
          {status==="err_api"   && <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>حدث خطأ في الاتصال، حاول مرة أخرى</div>}

          {status==="no_phone" && (
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:14,padding:"22px",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"#fee2e2",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <SvgIcon d="M6 18L18 6M6 6l12 12" size={26} color="#dc2626"/>
              </div>
              <h4 style={{color:"#dc2626",margin:"0 0 8px",fontSize:16}}>رقم الهاتف غير مسجل</h4>
              <p style={{color:"#64748b",fontSize:13,margin:0}}>لا يوجد سجل بهذا الرقم في قاعدة بيانات الرابطة</p>
            </div>
          )}

          {status==="no_name" && (
            <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:14,padding:"22px",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"#fef3c7",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <SvgIcon d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" size={26} color="#d97706"/>
              </div>
              <h4 style={{color:"#92400e",margin:"0 0 8px",fontSize:16}}>الاسم لا يطابق السجل</h4>
              <p style={{color:"#64748b",fontSize:13,margin:0}}>رقم الهاتف موجود لكن الاسم المدخل لا يتطابق — تأكد من كتابة الاسم كما سجّلته</p>
            </div>
          )}

          {status==="found" && result && (
            <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid #86efac",borderRadius:14,padding:"22px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <div style={{width:48,height:48,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <SvgIcon d="M5 13l4 4L19 7" size={24} color="#fff" sw={2.5}/>
                </div>
                <div>
                  <h4 style={{color:"#15803d",margin:0,fontSize:17,fontWeight:700}}>أنت مسجل في الرابطة</h4>
                  <p style={{color:"#166534",margin:"3px 0 0",fontSize:12}}>تسجيل مؤكد في قاعدة البيانات</p>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {l:"الاسم الكامل",    v:result.full_name},
                  {l:"المحافظة",         v:result.province+(result.sub_district?" — "+result.sub_district:"")},
                  {l:"الجامعة",          v:result.university||"—"},
                  {l:"الكلية / القسم",   v:result.department||"—"},
                  {l:"التخصص",           v:result.specialization||"—"},
                  {l:"سنة التخرج",      v:result.graduation_year},
                  {l:"تاريخ التسجيل",   v:new Date(result.created_at).toLocaleDateString("en-GB")},
                ].map(function(item){return(
                  <div key={item.l} style={{background:"rgba(255,255,255,.8)",borderRadius:10,padding:"10px 14px"}}>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:3,fontWeight:600}}>{item.l}</div>
                    <div style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>{item.v}</div>
                  </div>
                );})}
              </div>
            </div>
          )}

          {status==="idle" && (
            <div style={{textAlign:"center",padding:"12px",color:"#94a3b8",fontSize:12,borderTop:"1px solid #f1f5f9",marginTop:4}}>
              يجب تطابق الاسم الرباعي ورقم الهاتف معاً للتحقق من التسجيل
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoEnvScreen() {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f1f5f9",direction:"rtl"}}>
      <div style={{background:"#fff",borderRadius:16,padding:40,maxWidth:480,textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,.1)"}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:"#e0f2fe",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <SvgIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" size={28} color="#0369a1"/>
        </div>
        <h2 style={{marginBottom:8}}>يلزم إعداد المتغيرات البيئية</h2>
      </div>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────
function RegisterPage() {
  var INIT = {full_name:"",province:"",sub_district:"",university:"",department:"",specialization:"",graduation_year:"",birth_date:"",phone:"",gender:"ذكر",employment_status:"غير موظف",marital_status:"أعزب",has_wife:false,has_children:false,children_count:0};
  var [f,setF]     = useState(INIT);
  var [er,setEr]   = useState({});
  var [st,setSt]   = useState("idle");
  var [msg,setMsg] = useState("");

  function up(k,v){ setF(p=>({...p,[k]:v})); setEr(p=>({...p,[k]:""})); }
  function setProvince(v){ setF(p=>({...p,province:v,sub_district:""})); setEr(p=>({...p,province:"",sub_district:""})); }
  function setMarital(v){ setF(p=>({...p,marital_status:v,has_wife:v!=="متزوج"?false:p.has_wife})); }
  function setHasChildren(v){ setF(p=>({...p,has_children:v,children_count:v?p.children_count:0})); }

  function validate() {
    var e={};
    if(!f.full_name.trim()||f.full_name.trim().length<4) e.full_name="الاسم مطلوب (4 أحرف على الأقل)";
    if(!f.province) e.province="يرجى اختيار المحافظة";
    if(f.province && !f.sub_district) e.sub_district="يرجى اختيار القضاء / الناحية";
    if(!f.university.trim()) e.university="اسم الجامعة مطلوب";
    if(!f.department.trim()) e.department="اسم الكلية / القسم مطلوب";
    var yr=parseInt(f.graduation_year);
    if(!yr||yr<1970||yr>CUR_YEAR) e.graduation_year="سنة التخرج غير صحيحة";
    else if(yr>CUR_YEAR-5) e.graduation_year="يجب أن تكون قد تخرجت قبل 5 سنوات على الأقل ("+(CUR_YEAR-5)+" أو أقل)";
    if(!f.birth_date) e.birth_date="تاريخ الميلاد مطلوب";
    else { var by=new Date(f.birth_date).getFullYear(); if(by<1940||by>2005) e.birth_date="تاريخ الميلاد غير صحيح"; }
    if(!/^07[3-9]\d{8}$/.test(f.phone)) e.phone="رقم الهاتف غير صحيح — يبدأ بـ 07";
    if(f.has_children&&f.children_count<1) e.children_count="أدخل عدد الأطفال";
    setEr(e);
    return Object.keys(e).length===0;
  }

  async function submit() {
    if(!validate()) return;
    var now=Date.now();
    var attempts=JSON.parse(localStorage.getItem("reg_attempts")||"[]").filter(t=>now-t<3600000);
    if(attempts.length>=5){setSt("err");setMsg("تجاوزت الحد المسموح. حاول بعد ساعة");return;}
    setSt("loading");
    try {
      await db.insert({
        full_name:f.full_name.trim(),province:f.province,sub_district:f.sub_district,
        university:f.university.trim(),department:f.department.trim(),
        specialization:f.specialization.trim(),
        graduation_year:parseInt(f.graduation_year),birth_date:f.birth_date,phone:f.phone.trim(),
        gender:f.gender,employment_status:f.employment_status,
        marital_status:f.marital_status,has_wife:f.has_wife,has_children:f.has_children,
        children_count:f.has_children?(parseInt(f.children_count)||0):0
      });
      localStorage.setItem("reg_attempts",JSON.stringify([...attempts,now]));
      setSt("success"); setF(INIT);
    } catch(err) {
      setSt("err");
      setMsg(err.message==="phone_exists"?"رقم الهاتف مسجل مسبقاً في قاعدة البيانات":"حدث خطأ أثناء التسجيل، حاول مجدداً");
    }
  }

  if(st==="success") return (
    <div style={pageWrap}>
      <div style={{...card,textAlign:"center",padding:"56px 24px"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"#dcfce7",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <SvgIcon d="M5 13l4 4L19 7" size={36} color="#16a34a" sw={2.5}/>
        </div>
        <h2 style={{color:"#16a34a",fontSize:24,marginBottom:8}}>تم التسجيل بنجاح</h2>
        <p style={{color:"#64748b",marginBottom:28}}>شكراً لانضمامك إلى رابطة الخريجين العراقيين القدماء</p>
        <button style={btn("#15803d","#16a34a")} onClick={()=>setSt("idle")}>تسجيل عضو آخر</button>
      </div>
    </div>
  );

  return (
    <div style={pageWrap}>
      <div style={card}>
        <h1 style={{fontSize:20,fontWeight:700,marginBottom:4,color:"#0f172a"}}>تسجيل عضو جديد</h1>
        <p style={{color:"#64748b",fontSize:13,marginBottom:24}}>رابطة الخريجين العراقيين القدماء</p>
        {st==="err" && <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"12px 16px",borderRadius:10,marginBottom:16,fontSize:13}}>{msg}</div>}

        {/* Academic Info */}
        <div style={{background:"#f8fafc",borderRadius:12,padding:"20px",marginBottom:16}}>
          <SectionHeader icon={P.grad} title="المعلومات الشخصية والأكاديمية" color="#1d4ed8"/>
          <div style={grid2}>
            <Field label="الاسم الرباعي الكامل" error={er.full_name}>
              <input value={f.full_name} onChange={e=>up("full_name",e.target.value)} placeholder="أدخل الاسم الرباعي" style={inp(er.full_name)}/>
            </Field>
            <Field label="المحافظة" error={er.province}>
              <select value={f.province} onChange={e=>setProvince(e.target.value)} style={{...inp(er.province),cursor:"pointer"}}>
                <option value="">— اختر المحافظة —</option>
                {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          {f.province && (
            <Field label="القضاء / الناحية" error={er.sub_district}>
              <select value={f.sub_district} onChange={e=>up("sub_district",e.target.value)} style={{...inp(er.sub_district),cursor:"pointer"}}>
                <option value="">— اختر القضاء أو الناحية —</option>
                {(IRAQ_DISTRICTS[f.province]||[]).map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          )}
          <div style={grid2}>
            <Field label="رقم الهاتف" error={er.phone}>
              <input value={f.phone} onChange={e=>up("phone",e.target.value)} placeholder="07901234567" style={{...inp(er.phone),direction:"ltr",textAlign:"right"}}/>
            </Field>
            <Field label="تاريخ الميلاد" error={er.birth_date}>
              <input type="date" value={f.birth_date} onChange={e=>up("birth_date",e.target.value)} style={inp(er.birth_date)} min="1940-01-01" max="2005-12-31"/>
            </Field>
          </div>
          <div style={{...grid2}}>
            <Field label="سنة التخرج" error={er.graduation_year}>
              <input type="number" value={f.graduation_year} onChange={e=>up("graduation_year",e.target.value)} placeholder="2020" style={inp(er.graduation_year)} min="1970" max={CUR_YEAR-5}/>
            </Field>
          </div>
        </div>

        {/* University Info */}
        <div style={{background:"#eff6ff",borderRadius:12,padding:"20px",marginBottom:16}}>
          <SectionHeader icon={P.grad} title="المعلومات الأكاديمية" color="#2563eb"/>
          <div style={grid2}>
            <Field label="الجامعة" error={er.university}>
              <input value={f.university} onChange={e=>up("university",e.target.value)} placeholder="مثال: جامعة بغداد" style={inp(er.university)}/>
            </Field>
            <Field label="الكلية / القسم" error={er.department}>
              <input value={f.department} onChange={e=>up("department",e.target.value)} placeholder="مثال: كلية الهندسة" style={inp(er.department)}/>
            </Field>
          </div>
          <Field label="التخصص الدقيق" optional>
            <input value={f.specialization} onChange={e=>up("specialization",e.target.value)} placeholder="مثال: هندسة الكهرباء والإلكترونيات" style={inp(false)}/>
          </Field>
        </div>

        {/* Gender + Employment */}
        <div style={{background:"#fefce8",borderRadius:12,padding:"20px",marginBottom:16}}>
          <SectionHeader icon={P.users} title="الجنس والوضع الوظيفي" color="#d97706"/>
          <div style={grid2}>
            <Field label="الجنس">
              <div style={{display:"flex",gap:10}}>
                {[{v:"ذكر",l:"ذكر"},{v:"أنثى",l:"أنثى"}].map(({v,l})=>{
                  var a=f.gender===v;
                  return <div key={v} onClick={()=>up("gender",v)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:14,border:"2px solid "+(a?"#1d4ed8":"#e2e8f0"),background:a?"#dbeafe":"#fff",color:a?"#1e40af":"#64748b"}}>{l}</div>;
                })}
              </div>
            </Field>
            <Field label="الوضع الوظيفي">
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{v:"موظف",c:"#22c55e"},{v:"غير موظف",c:"#ef4444"},{v:"طالب دراسات عليا",c:"#6366f1"}].map(({v,c})=>{
                  var a=f.employment_status===v;
                  return <div key={v} onClick={()=>up("employment_status",v)} style={{padding:"7px 12px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,border:"2px solid "+(a?c:"#e2e8f0"),background:a?(c+"22"):"#fff",color:a?c:"#64748b"}}>{v}</div>;
                })}
              </div>
            </Field>
          </div>
        </div>

        {/* Marital */}
        <div style={{background:"#f0fdf4",borderRadius:12,padding:"20px",marginBottom:20}}>
          <SectionHeader icon={P.heart} title="الحالة الاجتماعية" color="#16a34a"/>
          <Field label="الحالة الاجتماعية">
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {["أعزب","متزوج","مطلق","أرمل"].map(v=>{
                var a=f.marital_status===v;
                return <div key={v} onClick={()=>setMarital(v)} style={{padding:"9px 18px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600,border:"2px solid "+(a?"#16a34a":"#e2e8f0"),background:a?"#dcfce7":"#fff",color:a?"#15803d":"#64748b"}}>{v}</div>;
              })}
            </div>
          </Field>
          <div style={{display:"flex",gap:28,flexWrap:"wrap",marginTop:4}}>
            <Check value={f.has_wife} label="لديه زوجة حالياً" color="#22c55e" onChange={v=>up("has_wife",v)}/>
            <Check value={f.has_children} label="لديه أطفال" color="#6366f1" onChange={setHasChildren}/>
          </div>
          {f.has_children && (
            <div style={{marginTop:16,maxWidth:200}}>
              <Field label="عدد الأطفال" error={er.children_count}>
                <input type="number" min="1" max="20" value={f.children_count||""} onChange={e=>up("children_count",e.target.value)} placeholder="3" style={inp(er.children_count)}/>
              </Field>
            </div>
          )}
        </div>

        <button style={{...btn(),width:"100%",padding:"14px",fontSize:15,opacity:st==="loading"?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={submit} disabled={st==="loading"}>
          {st==="loading" ? (
            <>جاري التسجيل...</>
          ) : (
            <><SvgIcon d="M5 13l4 4L19 7" size={18} color="#fff"/> تسجيل الآن</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────
function DashboardPage() {
  var [stats,setStats] = useState(null);
  var [loading,setLoad] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  var load = useCallback(async function(){
    setLoad(true);
    try { setStats(await db.getStats()); }
    catch(e){ console.error(e); }
    setLoad(false);
  },[]);

  useEffect(()=>{load();},[load]);

  if(!stats&&loading) return (
    <div style={{textAlign:"center",padding:"80px 20px",color:"#94a3b8"}}>
      <div style={{width:48,height:48,margin:"0 auto 16px",opacity:.4}}>
        <SvgIcon d={P.chart} size={48} color="#94a3b8"/>
      </div>
      <div style={{fontSize:15}}>جاري تحميل الإحصائيات...</div>
    </div>
  );

  var total      = stats ? parseInt(stats.total)||0 : 0;
  var male       = stats ? parseInt(stats.male)||0 : 0;
  var female     = stats ? parseInt(stats.female)||0 : 0;
  var married    = stats ? parseInt(stats.married)||0 : 0;
  var notMarried = total - married;
  var provinces  = (stats?.by_province||[]).length;
  var specs      = (stats?.by_spec||[]).length;
  var pct = function(n){ return total>0 ? (n/total)*100 : 0; };

  var cards = [
    {iconPath:P.users,  label:"إجمالي المسجلين",  val:total,      pct:100,         barPct:100,       color:"#1d4ed8"},
    {iconPath:P.male,   label:"الذكور",             val:male,       pct:pct(male),   barPct:pct(male), color:"#0d9488"},
    {iconPath:P.female, label:"الإناث",             val:female,     pct:pct(female), barPct:pct(female),color:"#db2777"},
    {iconPath:P.map,    label:"المحافظات",          val:provinces,  pct:0,           barPct:(provinces/18)*100, color:"#059669"},
    {iconPath:P.grad,   label:"التخصصات",           val:specs,      pct:0,           barPct:Math.min(specs*5,100), color:"#7c3aed"},
    {iconPath:P.heart,  label:"متزوجون",            val:married,    pct:pct(married),barPct:pct(married),  color:"#d97706"},
    {iconPath:P.person, label:"غير متزوجين",        val:notMarried, pct:pct(notMarried),barPct:pct(notMarried),color:"#4f46e5"},
  ];

  return (
    <div style={{...pageWrap,maxWidth:1100}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <h2 style={{color:"#0f172a",fontSize:22,fontWeight:700,marginBottom:6}}>الإحصائيات العامة</h2>
        <p style={{color:"#64748b",fontSize:13}}>رابطة الخريجين العراقيين القدماء — بيانات محدّثة لحظياً</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:20}}>
        {cards.map(function(c){
          return <StatCardPro key={c.label} iconPath={c.iconPath} label={c.label}
            val={typeof c.val==="number"?c.val.toLocaleString("en-US"):c.val}
            pct={c.pct} barPct={c.barPct} color={c.color}/>;
        })}
      </div>
      <div style={{textAlign:"center",marginTop:24,color:"#94a3b8",fontSize:11}}>
        يتم تحديث الإحصائيات تلقائياً عند كل تسجيل جديد
      </div>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────
function AdminPage() {
  var [authed,setAuthed]         = useState(()=>sessionStorage.getItem("admin_ok")==="1");
  var [pwd,setPwd]               = useState("");
  var [pwdErr,setPwdErr]         = useState("");
  var [members,setMembers]       = useState([]);
  var [loading,setLoad]          = useState(false);
  var [search,setSearch]         = useState("");
  var [filterProv,setFilterProv] = useState("");
  var [filterEmp,setFilterEmp]   = useState("");
  var [filterGen,setFilterGen]   = useState("");
  var [tab,setTab]               = useState("list");
  var [tickerMsgs,setTickerMsgs] = useState([]);
  var [newMsg,setNewMsg]         = useState("");
  var [tickerLoading,setTL]      = useState(false);

  function login() {
    if(!ADMIN_PASS){setPwdErr("لم يتم تعيين كلمة مرور في إعدادات الموقع");return;}
    if(pwd===ADMIN_PASS){sessionStorage.setItem("admin_ok","1");setAuthed(true);}
    else setPwdErr("كلمة المرور غير صحيحة");
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  var loadAll = useCallback(async function(){
    if(!authed) return;
    setLoad(true);
    try{ setMembers(await db.getAll()); }catch(e){console.error(e);}
    setLoad(false);
  },[authed]);

  useEffect(()=>{loadAll();},[loadAll]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  var loadTicker = useCallback(async function(){
    if(!authed) return;
    setTL(true);
    try{ setTickerMsgs(await db.getTickerMessages()); }catch(e){console.error(e);}
    setTL(false);
  },[authed]);

  useEffect(()=>{ if(tab==="ticker") loadTicker(); },[tab,loadTicker]);

  // Hooks before conditional return
  // eslint-disable-next-line react-hooks/exhaustive-deps
  var filtered = useMemo(()=>members.filter(r=>{
    if(filterProv && r.province!==filterProv) return false;
    if(filterEmp  && r.employment_status!==filterEmp) return false;
    if(filterGen  && r.gender!==filterGen) return false;
    if(search.trim() && !(
      (r.full_name&&r.full_name.includes(search))||
      (r.phone&&r.phone.includes(search))||
      (r.specialization&&r.specialization.includes(search))||
      (r.university&&r.university.includes(search))||
      (r.department&&r.department.includes(search))
    )) return false;
    return true;
  }),[members,filterProv,filterEmp,filterGen,search]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  var dupIds = useMemo(()=>{
    var m={};
    members.forEach(r=>{var k=(r.full_name||"").trim().toLowerCase();if(!m[k])m[k]=[];m[k].push(r.id);});
    return new Set(Object.values(m).filter(a=>a.length>1).flat());
  },[members]);

  if(!authed) return (
    <div style={{...pageWrap,maxWidth:420}}>
      <div style={{...card,textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:"#dbeafe",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <SvgIcon d={P.lock} size={30} color="#1d4ed8"/>
        </div>
        <h2 style={{marginBottom:20,color:"#0f172a"}}>لوحة الإدارة</h2>
        {pwdErr && <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:8,marginBottom:14,fontSize:13}}>{pwdErr}</div>}
        <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr("");}}
          onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="كلمة المرور" style={{...inp(pwdErr),marginBottom:14,textAlign:"center"}}/>
        <button style={{...btn(),width:"100%",padding:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onClick={login}>
          <SvgIcon d={P.shield} size={18} color="#fff"/> دخول
        </button>
      </div>
    </div>
  );

  function exportCSV() {
    var hdr=["الاسم","المحافظة","القضاء","الجامعة","الكلية/القسم","التخصص","سنة التخرج","الجنس","التوظيف","الحالة","الهاتف","التسجيل"];
    var rows=filtered.map(r=>[r.full_name,r.province,r.sub_district||"",r.university||"",r.department||"",r.specialization||"",r.graduation_year,r.gender||"",r.employment_status||"",r.marital_status,r.phone,new Date(r.created_at).toLocaleDateString("en-GB")]);
    var csv=[hdr,...rows].map(r=>r.join(",")).join("\n");
    var a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"}));
    a.download="graduates_"+new Date().toISOString().slice(0,10)+".csv";
    a.click();
  }

  async function addTickerMsg() {
    if(!newMsg.trim()) return;
    setTL(true);
    try { await db.addTickerMessage(newMsg.trim()); setNewMsg(""); await loadTicker(); }
    catch(e){ alert("حدث خطأ أثناء الإضافة"); }
    setTL(false);
  }

  async function deleteTickerMsg(id) {
    if(!window.confirm("هل تريد حذف هذا الإشعار؟")) return;
    setTL(true);
    try { await db.deleteTickerMessage(id); await loadTicker(); }
    catch(e){ alert("حدث خطأ أثناء الحذف"); }
    setTL(false);
  }

  var adminTabs = [
    {k:"list",  l:"قائمة الأعضاء",    icon:P.users},
    {k:"dups",  l:"التكرارات ("+dupIds.size+")",icon:P.users},
    {k:"ticker",l:"شريط الأخبار",      icon:P.news},
  ];

  return (
    <div style={pageWrap}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={{margin:0,color:"#0f172a",display:"flex",alignItems:"center",gap:10}}>
          <SvgIcon d={P.shield} size={22} color="#1d4ed8"/> لوحة الإدارة
        </h2>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={btn("#6366f1","#4f46e5")} onClick={loadAll}>تحديث</button>
          <button style={btn("#15803d","#16a34a")} onClick={exportCSV}>تصدير CSV</button>
          <button style={btn("#dc2626","#b91c1c")} onClick={()=>{sessionStorage.removeItem("admin_ok");setAuthed(false);}}>خروج</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {l:"إجمالي الأعضاء",  v:members.length,  color:"#1d4ed8",icon:P.users},
          {l:"غير موظف",         v:members.filter(m=>m.employment_status==="غير موظف").length, color:"#dc2626",icon:P.person},
          {l:"موظف",             v:members.filter(m=>m.employment_status==="موظف").length,     color:"#16a34a",icon:P.users},
          {l:"تكرارات",          v:dupIds.size,     color:"#d97706",icon:P.users},
          {l:"النتائج",          v:filtered.length, color:"#7c3aed",icon:P.chart},
        ].map(function(c){
          return (
            <div key={c.l} style={{background:"#fff",borderRadius:14,padding:"16px 20px",flex:"1 1 130px",borderRight:"4px solid "+c.color,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:22,fontWeight:800,color:"#0f172a"}}>{c.v.toLocaleString("en-US")}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:4}}>{c.l}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16,borderBottom:"2px solid #f1f5f9",paddingBottom:0}}>
        {adminTabs.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"10px 18px",borderRadius:"10px 10px 0 0",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===t.k?"#1d4ed8":"#f8fafc",color:tab===t.k?"#fff":"#475569",display:"flex",alignItems:"center",gap:7,marginBottom:tab===t.k?"-2px":"0",borderBottom:tab===t.k?"2px solid #1d4ed8":"none"}}>
            <SvgIcon d={t.icon} size={15} color={tab===t.k?"#fff":"#475569"}/>{t.l}
          </button>
        ))}
      </div>

      {/* Member List Tab */}
      {tab==="list" && <>
        <div style={{...card,padding:"14px 18px",marginBottom:12}}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث (اسم / هاتف / تخصص / جامعة / قسم)..." style={{...inp(false),flex:"1 1 220px",marginBottom:0}}/>
            <select value={filterProv} onChange={e=>setFilterProv(e.target.value)} style={{...inp(false),flex:"0 0 150px",marginBottom:0}}>
              <option value="">كل المحافظات</option>
              {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)} style={{...inp(false),flex:"0 0 150px",marginBottom:0}}>
              <option value="">الوضع الوظيفي</option>
              {EMPLOY_OPTS.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filterGen} onChange={e=>setFilterGen(e.target.value)} style={{...inp(false),flex:"0 0 110px",marginBottom:0}}>
              <option value="">الجنسان</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
        </div>
        <div style={card}>
          {loading ? <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>جاري التحميل...</div> : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    {["#","الاسم","المحافظة","الجامعة","الكلية/القسم","التخصص","سنة","الجنس","التوظيف","الحالة","الهاتف","التسجيل","حذف"].map(h=>(
                      <th key={h} style={{padding:"9px",textAlign:"right",borderBottom:"2px solid #e2e8f0",fontWeight:700,color:"#374151",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r,i)=>{
                    var isDup=dupIds.has(r.id);
                    var ec=EMPLOY_COLORS[r.employment_status]||"#94a3b8";
                    return (
                      <tr key={r.id} style={{borderBottom:"1px solid #f1f5f9",background:isDup?"#fffbeb":i%2?"#fafafa":"#fff"}}>
                        <td style={{padding:"8px 9px",color:"#94a3b8"}}>{i+1}{isDup&&<span style={{color:"#f59e0b",marginRight:3}} title="مكرر">!</span>}</td>
                        <td style={{padding:"8px 9px",fontWeight:600,whiteSpace:"nowrap"}}>{r.full_name}</td>
                        <td style={{padding:"8px 9px"}}><span style={{background:"#e0f2fe",color:"#0369a1",padding:"2px 7px",borderRadius:20,fontSize:11}}>{r.province}</span></td>
                        <td style={{padding:"8px 9px",color:"#374151"}}>{r.university||"—"}</td>
                        <td style={{padding:"8px 9px",color:"#374151"}}>{r.department||"—"}</td>
                        <td style={{padding:"8px 9px",color:"#64748b"}}>{r.specialization||"—"}</td>
                        <td style={{padding:"8px 9px",textAlign:"center"}}>{r.graduation_year}</td>
                        <td style={{padding:"8px 9px",textAlign:"center"}}>{r.gender}</td>
                        <td style={{padding:"8px 9px"}}><span style={{background:ec+"22",color:ec,padding:"2px 7px",borderRadius:20,fontSize:11,fontWeight:600}}>{r.employment_status||"—"}</span></td>
                        <td style={{padding:"8px 9px"}}>{r.marital_status}</td>
                        <td style={{padding:"8px 9px",direction:"ltr",textAlign:"left",color:"#0369a1",fontFamily:"monospace",whiteSpace:"nowrap"}}>{r.phone}</td>
                        <td style={{padding:"8px 9px",color:"#94a3b8",fontSize:11,whiteSpace:"nowrap"}}>{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                        <td style={{padding:"8px 9px"}}>
                          <button onClick={async function(e){e.stopPropagation();if(!window.confirm("هل تريد حذف سجل "+r.full_name+"؟\nلا يمكن التراجع عن هذا الإجراء.")){return;}try{await db.deleteGraduate(r.id);setMembers(function(prev){return prev.filter(function(m){return m.id!==r.id;});});}catch(err){alert("حدث خطأ أثناء الحذف");}}}
                            style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                            <SvgIcon d={P.trash} size={12} color="#dc2626"/> حذف
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && <tr><td colSpan={12} style={{padding:36,textAlign:"center",color:"#94a3b8"}}>لا توجد نتائج</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>}

      {/* Duplicates Tab */}
      {tab==="dups" && (
        <div style={card}>
          <h3 style={{marginBottom:16,color:"#b45309",fontSize:16}}>التسجيلات المكررة (نفس الاسم)</h3>
          {dupIds.size===0 ? (
            <div style={{textAlign:"center",padding:40,color:"#22c55e",fontSize:15}}>لا توجد تسجيلات مكررة</div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#fffbeb"}}>
                    {["الاسم","المحافظة","الجامعة","الهاتف","تاريخ التسجيل"].map(h=>(
                      <th key={h} style={{padding:"10px",textAlign:"right",borderBottom:"2px solid #fde68a",fontWeight:700,color:"#92400e"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.filter(r=>dupIds.has(r.id)).map((r,i)=>(
                    <tr key={r.id} style={{borderBottom:"1px solid #fef9c3",background:i%2?"#fffbeb":"#fefce8"}}>
                      <td style={{padding:"8px 10px",fontWeight:600}}>{r.full_name}</td>
                      <td style={{padding:"8px 10px"}}>{r.province}</td>
                      <td style={{padding:"8px 10px"}}>{r.university||"—"}</td>
                      <td style={{padding:"8px 10px",direction:"ltr",fontFamily:"monospace"}}>{r.phone}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:"#92400e"}}>{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ticker Management Tab */}
      {tab==="ticker" && (
        <div>
          <div style={card}>
            <SectionHeader icon={P.plus} title="إضافة إشعار جديد" color="#1d4ed8"/>
            <div style={{display:"flex",gap:10}}>
              <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTickerMsg()}
                placeholder="اكتب نص الإشعار أو الخبر هنا..."
                style={{...inp(false),flex:1,marginBottom:0}}/>
              <button onClick={addTickerMsg} disabled={tickerLoading||!newMsg.trim()} style={{...btn(),padding:"11px 20px",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8,opacity:!newMsg.trim()?0.5:1}}>
                <SvgIcon d={P.plus} size={16} color="#fff"/> إضافة
              </button>
            </div>
            <p style={{color:"#94a3b8",fontSize:12,marginTop:8}}>سيظهر الإشعار على الفور في شريط الأخبار في أعلى الصفحة عند زيارة الموقع</p>
          </div>

          <div style={card}>
            <SectionHeader icon={P.news} title="الإشعارات الحالية" color="#0d9488"/>
            {tickerLoading ? (
              <div style={{textAlign:"center",padding:30,color:"#94a3b8"}}>جاري التحميل...</div>
            ) : tickerMsgs.length===0 ? (
              <div style={{textAlign:"center",padding:30,color:"#94a3b8"}}>لا توجد إشعارات حالياً</div>
            ) : (
              <div>
                {tickerMsgs.map(function(m){return(
                  <div key={m.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 0",borderBottom:"1px solid #f1f5f9"}}>
                    <div style={{flex:1,color:"#374151",fontSize:14,lineHeight:1.6}}>{m.message}</div>
                    <button onClick={()=>deleteTickerMsg(m.id)} style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      <SvgIcon d={P.trash} size={14} color="#dc2626"/> حذف
                    </button>
                  </div>
                );})}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── About Page ────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <div style={pageWrap}>
      <div style={{...card,textAlign:"center",background:"linear-gradient(135deg,#0f2c54,#0a1a35)",color:"#fff",marginBottom:20}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(255,255,255,.12)",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <SvgIcon d={P.grad} size={36} color="#fff"/>
        </div>
        <h1 style={{fontSize:26,marginBottom:12}}>رابطة الخريجين العراقيين القدماء</h1>
        <p style={{fontSize:15,opacity:.85,maxWidth:620,margin:"0 auto",lineHeight:1.9}}>
          منصة وطنية لتوثيق وإحصاء الخريجين العراقيين وخلق قاعدة بيانات موثوقة تخدم التخطيط الوطني وسوق العمل.
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginBottom:20}}>
        {[
          {icon:P.map,   title:"رسالتنا",     text:"توثيق بيانات الخريجين العراقيين من جميع المحافظات والتخصصات، لخلق قاعدة بيانات وطنية شاملة تخدم سوق العمل والتخطيط الحكومي.",color:"#1d4ed8"},
          {icon:P.users, title:"رؤيتنا",      text:"أن نكون المرجع الرقمي الأول للخريجين العراقيين، ونساهم في ربطهم بفرص العمل والتطوير المهني على المستوى الوطني.",color:"#0d9488"},
          {icon:P.chart, title:"أهدافنا",     text:"جمع وتحليل البيانات الديموغرافية للخريجين، ورصد نسب التوظيف والبطالة، وتقديم تقارير موثوقة للجهات المعنية والباحثين.",color:"#7c3aed"},
          {icon:P.lock,  title:"الخصوصية",    text:"نلتزم بحماية بيانات الأعضاء وسريتها التامة. لا تُشارك البيانات الشخصية مع أي جهة خارجية دون موافقة صريحة.",color:"#059669"},
        ].map(function({icon,title,text,color}){return(
          <div key={title} style={{...card,marginBottom:0}}>
            <div style={{width:44,height:44,borderRadius:12,background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
              <SvgIcon d={icon} size={22} color={color}/>
            </div>
            <h3 style={{marginBottom:10,color:"#0f172a",fontSize:16}}>{title}</h3>
            <p style={{color:"#64748b",lineHeight:1.9,fontSize:14,margin:0}}>{text}</p>
          </div>
        );})}
      </div>

      <div style={{...card,textAlign:"center"}}>
        <h3 style={{marginBottom:16,color:"#0f172a"}}>تواصل معنا</h3>
        <p style={{color:"#64748b",marginBottom:16,fontSize:14}}>للاستفسارات والتواصل مع إدارة الرابطة</p>
        <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap"}}>
          <span style={{background:"#e0f2fe",color:"#0369a1",padding:"10px 24px",borderRadius:30,fontSize:14,fontWeight:600}}>iraq-graduates.vercel.app</span>
        </div>
      </div>
    </div>
  );
}

// ── Privacy Page ──────────────────────────────────────────────────────
function PrivacyPage() {
  var sections = [
    {title:"1. جمع المعلومات",text:"نجمع المعلومات التي تقدمها طوعاً عند التسجيل، وتشمل: الاسم الكامل، المحافظة، القضاء، الجامعة، الكلية/القسم، التخصص، سنة التخرج، الجنس، الوضع الوظيفي، والحالة الاجتماعية. رقم الهاتف يُستخدم كمعرّف فريد لمنع التكرار."},
    {title:"2. استخدام المعلومات",text:"تُستخدم البيانات المجمعة لأغراض إحصائية وبحثية حصراً. نعرض إحصائيات مجمعة لا تكشف عن هويات الأفراد. رقم الهاتف لا يظهر في الواجهة العامة أبداً."},
    {title:"3. حماية البيانات",text:"يتم تخزين البيانات بأمان على خوادم Supabase المشفرة مع ضوابط وصول صارمة. نطبق أفضل معايير الأمان لضمان حماية بياناتكم من أي وصول غير مصرح به."},
    {title:"4. مشاركة البيانات",text:"لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة. قد نشارك إحصائيات مجمعة وغير شخصية مع جهات بحثية أو حكومية لأغراض التخطيط الوطني فقط."},
    {title:"5. حقوقك",text:"يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت. للتواصل حول بياناتك، يرجى مراسلتنا عبر صفحة عن الرابطة."},
    {title:"6. التعديلات",text:"قد نُحدّث هذه السياسة من وقت لآخر. سيتم إشعار الأعضاء بأي تغييرات جوهرية عبر الموقع الإلكتروني."},
  ];
  return (
    <div style={pageWrap}>
      <div style={{...card,background:"linear-gradient(135deg,#1e293b,#0f172a)",color:"#fff",textAlign:"center",marginBottom:20}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,.1)",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <SvgIcon d={P.privacy} size={28} color="#fff"/>
        </div>
        <h1 style={{fontSize:22,marginBottom:8}}>سياسة الخصوصية</h1>
        <p style={{opacity:.6,fontSize:12}}>آخر تحديث: {new Date().toLocaleDateString("en-GB")}</p>
      </div>
      <div style={card}>
        <p style={{color:"#64748b",lineHeight:2,marginBottom:24,fontSize:14,borderBottom:"1px solid #f1f5f9",paddingBottom:20}}>
          تصف سياسة الخصوصية هذه كيف تجمع رابطة الخريجين العراقيين القدماء بياناتكم وتستخدمها وتحميها. باستخدام هذا الموقع، فإنكم توافقون على الشروط المذكورة أدناه.
        </p>
        {sections.map(function({title,text},i){return(
          <div key={title} style={{marginBottom:20,paddingBottom:20,borderBottom:i<sections.length-1?"1px solid #f1f5f9":"none"}}>
            <h3 style={{color:"#0f172a",marginBottom:10,fontSize:15}}>{title}</h3>
            <p style={{color:"#64748b",lineHeight:2,margin:0,fontSize:14}}>{text}</p>
          </div>
        );})}
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────
export default function App() {
  var [page,setPage]         = useState("register");
  var [showSearch,setSearch] = useState(false);
  if(!READY) return <NoEnvScreen/>;

  var navItems = [
    {k:"register",  l:"تسجيل",   icon:P.edit},
    {k:"dashboard", l:"الإحصائيات", icon:P.chart},
    {k:"admin",     l:"الإدارة", icon:P.shield},
    {k:"about",     l:"عن الرابطة",icon:P.info},
    {k:"privacy",   l:"الخصوصية",  icon:P.privacy},
  ];

  return (
    <div style={{fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif",minHeight:"100vh",background:"#f1f5f9",color:"#1e293b",direction:"rtl"}}>
      <nav style={{background:"linear-gradient(135deg,#0f2c54,#0a1a35)",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 16px rgba(0,0,0,.35)",flexWrap:"wrap",gap:4,paddingTop:6,paddingBottom:6}}>
        <div style={{color:"#fff",fontSize:15,fontWeight:700,padding:"10px 0",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:8,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <SvgIcon d={P.grad} size={20} color="#fff"/>
          </div>
          رابطة الخريجين العراقيين
          <span style={{fontSize:10,background:"rgba(34,197,94,.2)",color:"#4ade80",padding:"2px 8px",borderRadius:20}}>LIVE</span>
        </div>
        <div style={{display:"flex",gap:2,flexWrap:"wrap",alignItems:"center"}}>
          {navItems.map(n=>(
            <button key={n.k} style={{...navBtn(page===n.k),display:"flex",alignItems:"center",gap:7}} onClick={()=>setPage(n.k)}>
              <SvgIcon d={n.icon} size={14} color={page===n.k?"#fff":"rgba(255,255,255,.7)"}/>{n.l}
            </button>
          ))}
          <button onClick={()=>setSearch(true)} style={{background:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.4)",color:"#fbbf24",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,marginRight:8,display:"flex",alignItems:"center",gap:7}}>
            <SvgIcon d={P.search} size={14} color="#fbbf24"/>
            ابحث عن اسمك
          </button>
        </div>
      </nav>

      <Ticker/>

      {page==="register"  && <RegisterPage/>}
      {page==="dashboard" && <DashboardPage/>}
      {page==="admin"     && <AdminPage/>}
      {page==="about"     && <AboutPage/>}
      {page==="privacy"   && <PrivacyPage/>}

      {showSearch && <SearchModal onClose={()=>setSearch(false)}/>}

      <footer style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:11,borderTop:"1px solid #e2e8f0",background:"#fff",marginTop:8}}>
        رابطة الخريجين العراقيين القدماء &copy; {CUR_YEAR} &nbsp;·&nbsp;
        <span style={{cursor:"pointer",color:"#0ea5e9"}} onClick={()=>setPage("privacy")}>سياسة الخصوصية</span> &nbsp;·&nbsp;
        <span style={{cursor:"pointer",color:"#0ea5e9"}} onClick={()=>setPage("about")}>عن الرابطة</span>
      </footer>
    </div>
  );
}
