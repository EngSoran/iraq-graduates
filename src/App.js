import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

// ── Config ────────────────────────────────────────────────────────────
var SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
var SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
var ADMIN_PASS   = process.env.REACT_APP_ADMIN_PASS || "";
var READY = Boolean(SUPABASE_URL && SUPABASE_KEY);

// ── Constants ─────────────────────────────────────────────────────────
var PROVINCES = ["بغداد","البصرة","نينوى","أربيل","السليمانية","كركوك","الأنبار","ديالى","بابل","كربلاء","النجف","واسط","ذي قار","ميسان","المثنى","القادسية","صلاح الدين","دهوك"];
var MARITAL    = ["أعزب","متزوج","مطلق","أرمل"];
var EMPLOY_OPTS = ["موظف","غير موظف","طالب دراسات عليا"];
var COLORS = ["#0ea5e9","#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#14b8a6","#f97316","#ec4899","#06b6d4","#84cc16","#a855f7","#10b981","#3b82f6","#fbbf24","#e11d48","#64748b","#d97706"];
var MARITAL_COLORS = {"أعزب":"#0ea5e9","متزوج":"#22c55e","مطلق":"#f59e0b","أرمل":"#ef4444"};
var EMPLOY_COLORS  = {"موظف":"#22c55e","غير موظف":"#ef4444","طالب دراسات عليا":"#6366f1"};
var CUR_YEAR = new Date().getFullYear();

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
      SUPABASE_URL+"/rest/v1/graduates?select=id,full_name,province,specialization,graduation_year,gender,university,employment_status,marital_status,has_wife,has_children,children_count,created_at&order=created_at.desc",
      {headers:Object.assign({},H(),{"Range":from+"-"+to})}
    );
    if(!r.ok) throw new Error("members");
    return r.json();
  },
  getAll: async function() {
    var r = await fetch(
      SUPABASE_URL+"/rest/v1/graduates?select=*&order=created_at.desc&limit=10000",
      {headers:H()}
    );
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
  }
};

// ── Style helpers ─────────────────────────────────────────────────────
function navBtn(a) {
  return {background:a?"rgba(255,255,255,.18)":"transparent",border:"none",color:"#fff",padding:"9px 18px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:a?700:400,transition:"all .2s"};
}
function inp(err) {
  return {width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid "+(err?"#f87171":"#e2e8f0"),fontSize:14,outline:"none",background:"#f8fafc",boxSizing:"border-box"};
}
function btn(bg1,bg2) {
  return {background:"linear-gradient(135deg,"+(bg1||"#0ea5e9")+","+(bg2||"#0284c7")+")",color:"#fff",border:"none",padding:"12px 28px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"};
}
var card     = {background:"#fff",borderRadius:16,padding:"28px",boxShadow:"0 2px 20px rgba(0,0,0,.07)",marginBottom:24};
var pageWrap = {maxWidth:1000,margin:"0 auto",padding:"32px 16px"};
var grid2    = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:18};

// ── Shared Components ─────────────────────────────────────────────────
function Field({label,error,children}) {
  return (
    <div style={{marginBottom:18}}>
      <label style={{display:"block",fontWeight:600,marginBottom:7,fontSize:13,color:"#374151"}}>{label}</label>
      {children}
      {error && <div style={{color:"#ef4444",fontSize:12,marginTop:4}}>{error}</div>}
    </div>
  );
}

function Check({value,label,color,onChange}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}} onClick={()=>onChange(!value)}>
      <div style={{width:20,height:20,borderRadius:6,border:"2px solid "+(value?(color||"#0ea5e9"):"#cbd5e1"),background:value?(color||"#0ea5e9"):"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {value && <span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
      </div>
      <span style={{fontSize:14,color:"#374151",fontWeight:value?600:400}}>{label}</span>
    </div>
  );
}

function Tip({active,payload,label}) {
  if(!active||!payload||!payload.length) return null;
  return (
    <div style={{background:"#1e293b",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:13}}>
      <div style={{fontWeight:700,marginBottom:2}}>{label}</div>
      <div>{payload[0].value}</div>
    </div>
  );
}

function StatCard({icon,label,val,bg,sub}) {
  return (
    <div style={{background:bg||"linear-gradient(135deg,#0ea5e9,#0369a1)",borderRadius:14,padding:"18px 20px",color:"#fff",flex:"1 1 140px",minWidth:130}}>
      <div style={{fontSize:26,marginBottom:4}}>{icon}</div>
      <div style={{fontSize:24,fontWeight:700}}>{val}</div>
      <div style={{fontSize:11,opacity:.85,marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:10,opacity:.7,marginTop:1}}>{sub}</div>}
    </div>
  );
}

function NoEnvScreen() {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f1f5f9",direction:"rtl"}}>
      <div style={{background:"#fff",borderRadius:16,padding:40,maxWidth:480,textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,.1)"}}>
        <div style={{fontSize:52,marginBottom:12}}>⚙️</div>
        <h2>يلزم إعداد المتغيرات البيئية</h2>
      </div>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────
function RegisterPage() {
  var INIT = {full_name:"",province:"",specialization:"",graduation_year:"",phone:"",gender:"ذكر",university:"",employment_status:"غير موظف",marital_status:"أعزب",has_wife:false,has_children:false,children_count:0};
  var [f,setF]     = useState(INIT);
  var [er,setEr]   = useState({});
  var [st,setSt]   = useState("idle");
  var [msg,setMsg] = useState("");

  function up(k,v){ setF(p=>({...p,[k]:v})); setEr(p=>({...p,[k]:""})); }
  function setMarital(v){ setF(p=>({...p,marital_status:v,has_wife:v!=="متزوج"?false:p.has_wife})); }
  function setHasChildren(v){ setF(p=>({...p,has_children:v,children_count:v?p.children_count:0})); }

  function validate() {
    var e={};
    if(!f.full_name.trim()||f.full_name.trim().length<4) e.full_name="الاسم مطلوب (4 أحرف على الأقل)";
    if(!f.province) e.province="يرجى اختيار المحافظة";
    if(!f.specialization.trim()) e.specialization="التخصص مطلوب";
    var yr=parseInt(f.graduation_year);
    if(!yr||yr<1970||yr>CUR_YEAR) e.graduation_year="سنة التخرج غير صحيحة";
    if(!/^07[3-9]\d{8}$/.test(f.phone)) e.phone="رقم الهاتف غير صحيح (يبدأ بـ 07)";
    if(f.has_children&&f.children_count<1) e.children_count="أدخل عدد الأطفال";
    setEr(e);
    return Object.keys(e).length===0;
  }

  async function submit() {
    if(!validate()) return;
    var now=Date.now();
    var attempts=JSON.parse(localStorage.getItem("reg_attempts")||"[]").filter(t=>now-t<3600000);
    if(attempts.length>=5){setSt("err");setMsg("⚠️ تجاوزت الحد المسموح. حاول بعد ساعة");return;}
    setSt("loading");
    try {
      await db.insert({
        full_name:f.full_name.trim(),province:f.province,specialization:f.specialization.trim(),
        graduation_year:parseInt(f.graduation_year),phone:f.phone.trim(),
        gender:f.gender,university:f.university.trim(),employment_status:f.employment_status,
        marital_status:f.marital_status,has_wife:f.has_wife,has_children:f.has_children,
        children_count:f.has_children?(parseInt(f.children_count)||0):0
      });
      localStorage.setItem("reg_attempts",JSON.stringify([...attempts,now]));
      setSt("success"); setF(INIT);
    } catch(err) {
      setSt("err");
      setMsg(err.message==="phone_exists"?"⚠️ رقم الهاتف مسجل مسبقاً":"⚠️ حدث خطأ، حاول مجدداً");
    }
  }

  if(st==="success") return (
    <div style={pageWrap}>
      <div style={{...card,textAlign:"center",padding:"56px 24px"}}>
        <div style={{fontSize:72,marginBottom:12}}>✅</div>
        <h2 style={{color:"#16a34a",fontSize:26,marginBottom:8}}>تم التسجيل بنجاح!</h2>
        <p style={{color:"#64748b",marginBottom:28}}>شكراً لانضمامك إلى رابطة الخريجين العراقيين القدماء</p>
        <button style={btn("#16a34a","#15803d")} onClick={()=>setSt("idle")}>✏️ تسجيل عضو آخر</button>
      </div>
    </div>
  );

  return (
    <div style={pageWrap}>
      <div style={card}>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:4,color:"#0f172a"}}>📝 تسجيل عضو جديد</h1>
        <p style={{color:"#64748b",fontSize:13,marginBottom:26}}>رابطة الخريجين العراقيين القدماء</p>
        {st==="err" && <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"12px 16px",borderRadius:10,marginBottom:16,fontSize:13}}>{msg}</div>}

        {/* Academic */}
        <div style={{background:"#f8fafc",borderRadius:12,padding:"18px 20px",marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:14}}>🎓 المعلومات الأكاديمية</div>
          <div style={grid2}>
            <Field label="الاسم الكامل *" error={er.full_name}>
              <input value={f.full_name} onChange={e=>up("full_name",e.target.value)} placeholder="أدخل الاسم الرباعي" style={inp(er.full_name)}/>
            </Field>
            <Field label="المحافظة *" error={er.province}>
              <select value={f.province} onChange={e=>up("province",e.target.value)} style={{...inp(er.province),cursor:"pointer"}}>
                <option value="">— اختر المحافظة —</option>
                {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="التخصص *" error={er.specialization}>
              <input value={f.specialization} onChange={e=>up("specialization",e.target.value)} placeholder="مثال: هندسة مدنية" style={inp(er.specialization)}/>
            </Field>
            <Field label="سنة التخرج *" error={er.graduation_year}>
              <input type="number" value={f.graduation_year} onChange={e=>up("graduation_year",e.target.value)} placeholder="2020" style={inp(er.graduation_year)} min="1970" max={CUR_YEAR}/>
            </Field>
          </div>
          <Field label="اسم الجامعة">
            <input value={f.university} onChange={e=>up("university",e.target.value)} placeholder="مثال: جامعة بغداد" style={inp(false)}/>
          </Field>
          <Field label="رقم الهاتف *" error={er.phone}>
            <input value={f.phone} onChange={e=>up("phone",e.target.value)} placeholder="07901234567" style={{...inp(er.phone),direction:"ltr",textAlign:"right"}}/>
          </Field>
        </div>

        {/* Gender + Employment */}
        <div style={{background:"#fefce8",borderRadius:12,padding:"18px 20px",marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,color:"#854d0e",marginBottom:16}}>👤 الجنس والوضع الوظيفي</div>
          <div style={grid2}>
            <Field label="الجنس *">
              <div style={{display:"flex",gap:10}}>
                {[{v:"ذكر",icon:"👨"},{v:"أنثى",icon:"👩"}].map(({v,icon})=>{
                  var a=f.gender===v;
                  return <div key={v} onClick={()=>up("gender",v)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:14,border:"2px solid "+(a?"#0ea5e9":"#e2e8f0"),background:a?"#e0f2fe":"#fff",color:a?"#0369a1":"#64748b"}}>{icon} {v}</div>;
                })}
              </div>
            </Field>
            <Field label="الوضع الوظيفي *">
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{v:"موظف",icon:"💼",c:"#22c55e"},{v:"غير موظف",icon:"🔍",c:"#ef4444"},{v:"طالب دراسات عليا",icon:"📚",c:"#6366f1"}].map(({v,icon,c})=>{
                  var a=f.employment_status===v;
                  return <div key={v} onClick={()=>up("employment_status",v)} style={{padding:"7px 12px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,border:"2px solid "+(a?c:"#e2e8f0"),background:a?(c+"22"):"#fff",color:a?c:"#64748b"}}>{icon} {v}</div>;
                })}
              </div>
            </Field>
          </div>
        </div>

        {/* Marital */}
        <div style={{background:"#f0fdf4",borderRadius:12,padding:"18px 20px",marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:13,color:"#15803d",marginBottom:16}}>👨‍👩‍👧 الحالة الاجتماعية</div>
          <Field label="الحالة الاجتماعية *">
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[{v:"أعزب",icon:"🧑"},{v:"متزوج",icon:"💑"},{v:"مطلق",icon:"📋"},{v:"أرمل",icon:"🕊️"}].map(({v,icon})=>{
                var a=f.marital_status===v;
                return <div key={v} onClick={()=>setMarital(v)} style={{padding:"9px 20px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600,border:"2px solid "+(a?"#22c55e":"#e2e8f0"),background:a?"#dcfce7":"#fff",color:a?"#15803d":"#64748b"}}>{icon} {v}</div>;
              })}
            </div>
          </Field>
          <div style={{display:"flex",gap:28,flexWrap:"wrap",marginTop:4}}>
            <Check value={f.has_wife} label="لديه زوجة حالياً" color="#22c55e" onChange={v=>up("has_wife",v)}/>
            <Check value={f.has_children} label="لديه أطفال" color="#6366f1" onChange={setHasChildren}/>
          </div>
          {f.has_children && (
            <div style={{marginTop:16,maxWidth:200}}>
              <Field label="عدد الأطفال *" error={er.children_count}>
                <input type="number" min="1" max="20" value={f.children_count||""} onChange={e=>up("children_count",e.target.value)} placeholder="3" style={inp(er.children_count)}/>
              </Field>
            </div>
          )}
        </div>

        <button style={{...btn(),width:"100%",padding:"14px",fontSize:15,opacity:st==="loading"?0.7:1}} onClick={submit} disabled={st==="loading"}>
          {st==="loading"?"⏳ جاري التسجيل...":"✅ تسجيل الآن"}
        </button>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────
function DashboardPage() {
  var [stats,setStats]     = useState(null);
  var [members,setMembers] = useState([]);
  var [loading,setLoad]    = useState(true);
  var [search,setSearch]   = useState("");
  var [chart,setChart]     = useState("province");
  var [expanded,setExpanded] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  var load = useCallback(async function(){
    setLoad(true);
    try { var [s,m]=await Promise.all([db.getStats(),db.getMembers(0)]); setStats(s); setMembers(m); }
    catch(e){ console.error(e); }
    setLoad(false);
  },[]);

  useEffect(()=>{load();},[load]);

  if(!stats&&loading) return <div style={{textAlign:"center",padding:"80px",color:"#94a3b8"}}>⏳ جاري تحميل البيانات…</div>;

  var total        = stats ? parseInt(stats.total)||0 : 0;
  var unemployed   = stats ? parseInt(stats.unemployed)||0 : 0;
  var employed     = stats ? parseInt(stats.employed)||0 : 0;
  var male         = stats ? parseInt(stats.male)||0 : 0;
  var female       = stats ? parseInt(stats.female)||0 : 0;
  var unemployedPct = total ? Math.round(unemployed/total*100) : 0;

  var byProvince = (stats?.by_province||[]).map((r,i)=>({name:r.province,count:parseInt(r.count),fill:COLORS[i%COLORS.length]}));
  var bySpec     = (stats?.by_spec||[]).map((r,i)=>({name:r.specialization,count:parseInt(r.count),fill:COLORS[i%COLORS.length]}));
  var byYear     = (stats?.by_year||[]).map(r=>({name:String(r.graduation_year),count:parseInt(r.count)}));
  var byMarital  = (stats?.by_marital||[]).map(r=>({name:r.marital_status,count:parseInt(r.count),fill:MARITAL_COLORS[r.marital_status]||"#94a3b8"}));
  var byGender   = (stats?.by_gender||[]).map(r=>({name:r.gender,count:parseInt(r.count),fill:r.gender==="ذكر"?"#0ea5e9":"#ec4899"}));
  var byEmploy   = (stats?.by_employment||[]).map(r=>({name:r.employment_status,count:parseInt(r.count),fill:EMPLOY_COLORS[r.employment_status]||"#94a3b8"}));
  var byUniv     = (stats?.by_university||[]).map((r,i)=>({name:r.university,count:parseInt(r.count),fill:COLORS[i%COLORS.length]}));

  var chartMap = {province:byProvince,spec:bySpec,year:byYear,marital:byMarital,gender:byGender,employ:byEmploy,univ:byUniv};
  var pieCharts = ["marital","gender","employ"];
  var chartTabs = [
    {k:"province",l:"📍 المحافظات"},{k:"spec",l:"🎓 التخصصات"},
    {k:"year",l:"📅 سنة التخرج"},{k:"marital",l:"💑 الحالة"},
    {k:"gender",l:"👥 الجنس"},{k:"employ",l:"💼 التوظيف"},
    {k:"univ",l:"🏛️ الجامعات"}
  ];

  var filtered = search.trim()
    ? members.filter(r=>(r.full_name&&r.full_name.includes(search))||(r.specialization&&r.specialization.includes(search))||(r.province&&r.province.includes(search))||(r.university&&r.university.includes(search)))
    : members;

  function exportCSV() {
    var hdr=["الاسم","المحافظة","التخصص","الجامعة","سنة التخرج","الجنس","التوظيف","الحالة","أطفال"];
    var rows=members.map(r=>[r.full_name,r.province,r.specialization,r.university||"",r.graduation_year,r.gender||"",r.employment_status||"",r.marital_status,r.children_count||0]);
    var csv=[hdr,...rows].map(r=>r.join(",")).join("\n");
    var a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"}));
    a.download="graduates_"+new Date().toISOString().slice(0,10)+".csv";
    a.click();
  }

  var statCards = [
    {icon:"👥",label:"إجمالي المسجلين",val:total.toLocaleString("ar-IQ"),bg:"linear-gradient(135deg,#0ea5e9,#0369a1)"},
    {icon:"🔍",label:"نسبة البطالة",val:unemployedPct+"%",sub:unemployed+" غير موظف",bg:"linear-gradient(135deg,#ef4444,#dc2626)"},
    {icon:"💼",label:"الموظفون",val:employed.toLocaleString("ar-IQ"),bg:"linear-gradient(135deg,#22c55e,#15803d)"},
    {icon:"👨",label:"الذكور",val:male.toLocaleString("ar-IQ"),bg:"linear-gradient(135deg,#0ea5e9,#0369a1)"},
    {icon:"👩",label:"الإناث",val:female.toLocaleString("ar-IQ"),bg:"linear-gradient(135deg,#ec4899,#be185d)"},
    {icon:"🗺️",label:"المحافظات",val:byProvince.length,bg:"linear-gradient(135deg,#14b8a6,#0f766e)"},
    {icon:"🎓",label:"التخصصات",val:bySpec.length,bg:"linear-gradient(135deg,#8b5cf6,#7c3aed)"},
  ];

  return (
    <div style={pageWrap}>
      {/* Stat cards */}
      <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
        {statCards.map(c=><StatCard key={c.label} {...c}/>)}
      </div>

      {/* Charts */}
      <div style={card}>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {chartTabs.map(t=>(
            <button key={t.k} onClick={()=>setChart(t.k)} style={{padding:"7px 13px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:chart===t.k?"#0ea5e9":"#f1f5f9",color:chart===t.k?"#fff":"#475569"}}>
              {t.l}
            </button>
          ))}
        </div>

        {loading ? <div style={{textAlign:"center",padding:48,color:"#94a3b8"}}>⏳</div> :
          chart==="year" ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byYear} margin={{top:5,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="name" tick={{fontSize:10}}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : pieCharts.includes(chart) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartMap[chart]||[]} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                  label={e=>e.name+" "+(e.percent*100).toFixed(0)+"%"} labelLine={false}>
                  {(chartMap[chart]||[]).map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip formatter={v=>[v,"العدد"]}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartMap[chart]||[]} margin={{top:5,right:10,left:0,bottom:85}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{fontSize:10}} interval={0}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {(chartMap[chart]||[]).map((e,i)=><Cell key={i} fill={e.fill||COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Member list */}
      <div style={{...card,padding:"14px 18px",display:"flex",gap:10,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث بالاسم أو التخصص أو المحافظة..." style={{...inp(false),flex:"1 1 200px",marginBottom:0}}/>
        <button style={{...btn("#0f766e","#0d9488"),whiteSpace:"nowrap"}} onClick={load}>🔄</button>
        <button style={{...btn("#16a34a","#15803d"),whiteSpace:"nowrap"}} onClick={exportCSV}>📥 CSV</button>
      </div>

      <div style={card}>
        {search && <span style={{background:"#e0f2fe",color:"#0369a1",padding:"2px 12px",borderRadius:20,fontSize:12,fontWeight:700,display:"inline-block",marginBottom:12}}>{filtered.length} نتيجة</span>}
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#f8fafc"}}>
                {["#","الاسم","المحافظة","التخصص","سنة التخرج","الجنس","التوظيف","الحالة","أطفال"].map(h=>(
                  <th key={h} style={{padding:"10px",textAlign:"right",borderBottom:"2px solid #e2e8f0",fontWeight:700,color:"#374151",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>{
                var isExp=expanded===r.id;
                var ec=EMPLOY_COLORS[r.employment_status]||"#94a3b8";
                return (
                  <tr key={r.id} onClick={()=>setExpanded(isExp?null:r.id)} style={{borderBottom:"1px solid #f1f5f9",background:isExp?"#f0f9ff":i%2?"#fafafa":"#fff",cursor:"pointer"}}>
                    <td style={{padding:"9px 10px",color:"#94a3b8"}}>{i+1}</td>
                    <td style={{padding:"9px 10px",fontWeight:600}}>
                      {r.full_name}
                      {isExp && <div style={{marginTop:4,fontSize:11,color:"#64748b"}}>
                        {r.university&&<span>🏛️ {r.university} · </span>}
                        <span>{new Date(r.created_at).toLocaleDateString("ar-IQ")}</span>
                      </div>}
                    </td>
                    <td style={{padding:"9px 10px"}}><span style={{background:"#e0f2fe",color:"#0369a1",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{r.province}</span></td>
                    <td style={{padding:"9px 10px"}}>{r.specialization}</td>
                    <td style={{padding:"9px 10px",textAlign:"center",fontWeight:600}}>{r.graduation_year}</td>
                    <td style={{padding:"9px 10px",textAlign:"center"}}>{r.gender==="ذكر"?"👨":"👩"} {r.gender}</td>
                    <td style={{padding:"9px 10px"}}><span style={{background:ec+"22",color:ec,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{r.employment_status||"—"}</span></td>
                    <td style={{padding:"9px 10px"}}>{r.marital_status}</td>
                    <td style={{padding:"9px 10px",textAlign:"center"}}>{r.has_children?`✅ (${r.children_count})`:"➖"}</td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={9} style={{padding:36,textAlign:"center",color:"#94a3b8"}}>لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
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

  // Hooks must be before any conditional return
  // eslint-disable-next-line react-hooks/exhaustive-deps
  var filtered = useMemo(()=>members.filter(r=>{
    if(filterProv && r.province!==filterProv) return false;
    if(filterEmp  && r.employment_status!==filterEmp) return false;
    if(filterGen  && r.gender!==filterGen) return false;
    if(search.trim() && !(
      (r.full_name&&r.full_name.includes(search))||
      (r.phone&&r.phone.includes(search))||
      (r.specialization&&r.specialization.includes(search))||
      (r.university&&r.university.includes(search))
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
        <div style={{fontSize:52,marginBottom:12}}>🔐</div>
        <h2 style={{marginBottom:20,color:"#0f172a"}}>لوحة الإدارة</h2>
        {pwdErr && <div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:8,marginBottom:14,fontSize:13}}>{pwdErr}</div>}
        <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr("");}}
          onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="كلمة المرور" style={{...inp(pwdErr),marginBottom:14,textAlign:"center"}}/>
        <button style={{...btn(),width:"100%",padding:14}} onClick={login}>🔓 دخول</button>
      </div>
    </div>
  );

  function exportCSV() {
    var hdr=["الاسم","المحافظة","التخصص","الجامعة","سنة التخرج","الجنس","التوظيف","الحالة","الهاتف","تاريخ التسجيل"];
    var rows=filtered.map(r=>[r.full_name,r.province,r.specialization,r.university||"",r.graduation_year,r.gender||"",r.employment_status||"",r.marital_status,r.phone,new Date(r.created_at).toLocaleDateString("ar-IQ")]);
    var csv=[hdr,...rows].map(r=>r.join(",")).join("\n");
    var a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"}));
    a.download="admin_graduates_"+new Date().toISOString().slice(0,10)+".csv";
    a.click();
  }

  var unemployed = members.filter(m=>m.employment_status==="غير موظف").length;
  var unemployedPct = members.length ? Math.round(unemployed/members.length*100):0;

  return (
    <div style={pageWrap}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={{margin:0,color:"#0f172a"}}>🛡️ لوحة الإدارة</h2>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={btn("#6366f1","#4f46e5")} onClick={loadAll}>🔄 تحديث</button>
          <button style={btn("#16a34a","#15803d")} onClick={exportCSV}>📥 تصدير CSV</button>
          <button style={btn("#ef4444","#dc2626")} onClick={()=>{sessionStorage.removeItem("admin_ok");setAuthed(false);}}>🔒 خروج</button>
        </div>
      </div>

      {/* Admin stat cards */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard icon="👥" label="إجمالي الأعضاء" val={members.length.toLocaleString("ar-IQ")} bg="linear-gradient(135deg,#0ea5e9,#0369a1)"/>
        <StatCard icon="🔍" label="غير موظف" val={unemployed.toLocaleString("ar-IQ")} sub={unemployedPct+"%"} bg="linear-gradient(135deg,#ef4444,#dc2626)"/>
        <StatCard icon="💼" label="موظف" val={members.filter(m=>m.employment_status==="موظف").length.toLocaleString("ar-IQ")} bg="linear-gradient(135deg,#22c55e,#15803d)"/>
        <StatCard icon="👨" label="ذكور" val={members.filter(m=>m.gender==="ذكر").length} bg="linear-gradient(135deg,#0ea5e9,#0369a1)"/>
        <StatCard icon="👩" label="إناث" val={members.filter(m=>m.gender==="أنثى").length} bg="linear-gradient(135deg,#ec4899,#be185d)"/>
        <StatCard icon="⚠️" label="تسجيلات مكررة" val={dupIds.size} bg="linear-gradient(135deg,#f59e0b,#d97706)"/>
        <StatCard icon="📊" label="النتائج المعروضة" val={filtered.length} bg="linear-gradient(135deg,#8b5cf6,#7c3aed)"/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{k:"list",l:"📋 قائمة الأعضاء"},{k:"dups",l:"⚠️ التكرارات ("+dupIds.size+")"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===t.k?"#0ea5e9":"#f1f5f9",color:tab===t.k?"#fff":"#475569"}}>{t.l}</button>
        ))}
      </div>

      {tab==="list" && <>
        {/* Filters */}
        <div style={{...card,padding:"14px 18px",marginBottom:12}}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 بحث (اسم / هاتف / تخصص / جامعة)..." style={{...inp(false),flex:"1 1 220px",marginBottom:0}}/>
            <select value={filterProv} onChange={e=>setFilterProv(e.target.value)} style={{...inp(false),flex:"0 0 150px",marginBottom:0}}>
              <option value="">كل المحافظات</option>
              {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)} style={{...inp(false),flex:"0 0 150px",marginBottom:0}}>
              <option value="">كل الوضع الوظيفي</option>
              {EMPLOY_OPTS.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filterGen} onChange={e=>setFilterGen(e.target.value)} style={{...inp(false),flex:"0 0 110px",marginBottom:0}}>
              <option value="">الجنسان</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
        </div>

        {/* Full table */}
        <div style={card}>
          {loading ? <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>⏳ جاري التحميل...</div> : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    {["#","الاسم","المحافظة","التخصص","الجامعة","سنة","الجنس","التوظيف","الحالة","الهاتف","التسجيل"].map(h=>(
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
                        <td style={{padding:"8px 9px",color:"#94a3b8"}}>{i+1}{isDup&&<span style={{color:"#f59e0b",marginRight:3}} title="مكرر">⚠️</span>}</td>
                        <td style={{padding:"8px 9px",fontWeight:600,whiteSpace:"nowrap"}}>{r.full_name}</td>
                        <td style={{padding:"8px 9px"}}><span style={{background:"#e0f2fe",color:"#0369a1",padding:"2px 7px",borderRadius:20,fontSize:11}}>{r.province}</span></td>
                        <td style={{padding:"8px 9px"}}>{r.specialization}</td>
                        <td style={{padding:"8px 9px",color:"#64748b"}}>{r.university||"—"}</td>
                        <td style={{padding:"8px 9px",textAlign:"center"}}>{r.graduation_year}</td>
                        <td style={{padding:"8px 9px",textAlign:"center"}}>{r.gender==="ذكر"?"👨":"👩"}</td>
                        <td style={{padding:"8px 9px"}}><span style={{background:ec+"22",color:ec,padding:"2px 7px",borderRadius:20,fontSize:11,fontWeight:600}}>{r.employment_status||"—"}</span></td>
                        <td style={{padding:"8px 9px"}}>{r.marital_status}</td>
                        <td style={{padding:"8px 9px",direction:"ltr",textAlign:"left",color:"#0369a1",fontFamily:"monospace",whiteSpace:"nowrap"}}>{r.phone}</td>
                        <td style={{padding:"8px 9px",color:"#94a3b8",fontSize:11,whiteSpace:"nowrap"}}>{new Date(r.created_at).toLocaleDateString("ar-IQ")}</td>
                      </tr>
                    );
                  })}
                  {!filtered.length && <tr><td colSpan={11} style={{padding:36,textAlign:"center",color:"#94a3b8"}}>لا توجد نتائج</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>}

      {tab==="dups" && (
        <div style={card}>
          <h3 style={{marginBottom:16,color:"#b45309"}}>⚠️ التسجيلات المكررة (نفس الاسم)</h3>
          {dupIds.size===0 ? (
            <div style={{textAlign:"center",padding:40,color:"#22c55e",fontSize:16}}>✅ لا توجد تسجيلات مكررة</div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#fffbeb"}}>
                    {["الاسم","المحافظة","التخصص","الهاتف","تاريخ التسجيل"].map(h=>(
                      <th key={h} style={{padding:"10px",textAlign:"right",borderBottom:"2px solid #fde68a",fontWeight:700,color:"#92400e"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.filter(r=>dupIds.has(r.id)).map((r,i)=>(
                    <tr key={r.id} style={{borderBottom:"1px solid #fef9c3",background:i%2?"#fffbeb":"#fefce8"}}>
                      <td style={{padding:"8px 10px",fontWeight:600}}>{r.full_name}</td>
                      <td style={{padding:"8px 10px"}}>{r.province}</td>
                      <td style={{padding:"8px 10px"}}>{r.specialization}</td>
                      <td style={{padding:"8px 10px",direction:"ltr",fontFamily:"monospace"}}>{r.phone}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:"#92400e"}}>{new Date(r.created_at).toLocaleDateString("ar-IQ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        <div style={{fontSize:64,marginBottom:16}}>🎓</div>
        <h1 style={{fontSize:28,marginBottom:12}}>رابطة الخريجين العراقيين القدماء</h1>
        <p style={{fontSize:15,opacity:.85,maxWidth:620,margin:"0 auto",lineHeight:1.9}}>
          منصة وطنية لتوثيق وإحصاء الخريجين العراقيين، وخلق قاعدة بيانات موثوقة تخدم التخطيط الوطني وسوق العمل.
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginBottom:20}}>
        {[
          {icon:"🎯",title:"رسالتنا",text:"توثيق بيانات الخريجين العراقيين من جميع المحافظات والتخصصات، لخلق قاعدة بيانات وطنية شاملة تخدم سوق العمل والتخطيط الحكومي."},
          {icon:"👁️",title:"رؤيتنا",text:"أن نكون المرجع الرقمي الأول للخريجين العراقيين، ونساهم في ربطهم بفرص العمل والتطوير المهني على المستوى الوطني."},
          {icon:"📊",title:"أهدافنا",text:"جمع وتحليل البيانات الديموغرافية للخريجين، ورصد نسب التوظيف والبطالة، وتقديم تقارير موثوقة للجهات المعنية والباحثين."},
          {icon:"🔒",title:"الخصوصية والأمان",text:"نلتزم بحماية بيانات الأعضاء وسريتها التامة. لا تُشارك البيانات الشخصية مع أي جهة خارجية دون موافصة صريحة."},
        ].map(({icon,title,text})=>(
          <div key={title} style={{...card,marginBottom:0}}>
            <div style={{fontSize:36,marginBottom:12}}>{icon}</div>
            <h3 style={{marginBottom:10,color:"#0f172a",fontSize:16}}>{title}</h3>
            <p style={{color:"#64748b",lineHeight:1.9,fontSize:14,margin:0}}>{text}</p>
          </div>
        ))}
      </div>

      <div style={{...card,textAlign:"center"}}>
        <h3 style={{marginBottom:16,color:"#0f172a"}}>📬 تواصل معنا</h3>
        <p style={{color:"#64748b",marginBottom:16,fontSize:14}}>للاستفسارات والتواصل مع إدارة الرابطة</p>
        <div style={{display:"flex",justifyContent:"center",gap:16,flexWrap:"wrap"}}>
          <span style={{background:"#e0f2fe",color:"#0369a1",padding:"10px 24px",borderRadius:30,fontSize:14,fontWeight:600}}>🌐 iraq-graduates.vercel.app</span>
        </div>
      </div>
    </div>
  );
}

// ── Privacy Page ──────────────────────────────────────────────────────
function PrivacyPage() {
  var sections = [
    {title:"1. جمع المعلومات",text:"نجمع المعلومات التي تقدمها طوعاً عند التسجيل، وتشمل: الاسم الكامل، المحافظة، التخصص، سنة التخرج، الجنس، اسم الجامعة، الوضع الوظيفي، والحالة الاجتماعية. رقم الهاتف يُستخدم كمعرّف فريد لمنع التكرار."},
    {title:"2. استخدام المعلومات",text:"تُستخدم البيانات المجمعة لأغراض إحصائية وبحثية حصراً. نعرض إحصائيات مجمعة لا تكشف عن هويات الأفراد. رقم الهاتف لا يظهر في الواجهة العامة أبداً."},
    {title:"3. حماية البيانات",text:"يتم تخزين البيانات بأمان على خوادم Supabase المشفرة مع ضوابط وصول صارمة. نطبق أفضل معايير الأمان لضمان حماية بياناتكم من أي وصول غير مصرح به."},
    {title:"4. مشاركة البيانات",text:"لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة. قد نشارك إحصائيات مجمعة وغير شخصية مع جهات بحثية أو حكومية لأغراض التخطيط الوطني فقط."},
    {title:"5. حقوقك",text:"يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت. للتواصل حول بياناتك، يرجى مراسلتنا عبر صفحة 'عن الرابطة'."},
    {title:"6. التعديلات",text:"قد نُحدّث هذه السياسة من وقت لآخر. سيتم إشعار الأعضاء بأي تغييرات جوهرية عبر الموقع الإلكتروني."},
  ];
  return (
    <div style={pageWrap}>
      <div style={{...card,background:"linear-gradient(135deg,#1e293b,#0f172a)",color:"#fff",textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:48,marginBottom:12}}>🔒</div>
        <h1 style={{fontSize:24,marginBottom:8}}>سياسة الخصوصية</h1>
        <p style={{opacity:.7,fontSize:13}}>آخر تحديث: {new Date().toLocaleDateString("ar-IQ")}</p>
      </div>
      <div style={card}>
        <p style={{color:"#64748b",lineHeight:2,marginBottom:24,fontSize:14,borderBottom:"1px solid #f1f5f9",paddingBottom:20}}>
          تصف سياسة الخصوصية هذه كيف تجمع رابطة الخريجين العراقيين القدماء بياناتكم وتستخدمها وتحميها. باستخدام هذا الموقع، فإنكم توافقون على الشروط المذكورة أدناه.
        </p>
        {sections.map(({title,text},i)=>(
          <div key={title} style={{marginBottom:20,paddingBottom:20,borderBottom:i<sections.length-1?"1px solid #f1f5f9":"none"}}>
            <h3 style={{color:"#0f172a",marginBottom:10,fontSize:15}}>{title}</h3>
            <p style={{color:"#64748b",lineHeight:2,margin:0,fontSize:14}}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────
export default function App() {
  var [page,setPage] = useState("register");
  if(!READY) return <NoEnvScreen/>;

  var navItems = [
    {k:"register",  l:"📝 تسجيل"},
    {k:"dashboard", l:"📊 الإحصائيات"},
    {k:"admin",     l:"🛡️ الإدارة"},
    {k:"about",     l:"ℹ️ عن الرابطة"},
    {k:"privacy",   l:"🔒 الخصوصية"},
  ];

  return (
    <div style={{fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif",minHeight:"100vh",background:"#f1f5f9",color:"#1e293b",direction:"rtl"}}>
      <nav style={{background:"linear-gradient(135deg,#0f2c54,#0a1a35)",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 16px rgba(0,0,0,.35)",flexWrap:"wrap",gap:4,paddingTop:4,paddingBottom:4}}>
        <div style={{color:"#fff",fontSize:16,fontWeight:700,padding:"13px 0",display:"flex",alignItems:"center",gap:10}}>
          🎓 رابطة الخريجين العراقيين
          <span style={{fontSize:10,background:"rgba(34,197,94,.2)",color:"#4ade80",padding:"2px 8px",borderRadius:20}}>● LIVE</span>
        </div>
        <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
          {navItems.map(n=><button key={n.k} style={navBtn(page===n.k)} onClick={()=>setPage(n.k)}>{n.l}</button>)}
        </div>
      </nav>

      {page==="register"  && <RegisterPage/>}
      {page==="dashboard" && <DashboardPage/>}
      {page==="admin"     && <AdminPage/>}
      {page==="about"     && <AboutPage/>}
      {page==="privacy"   && <PrivacyPage/>}

      <footer style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:11,borderTop:"1px solid #e2e8f0",background:"#fff",marginTop:8}}>
        رابطة الخريجين العراقيين القدماء © {CUR_YEAR} ·{" "}
        <span style={{cursor:"pointer",color:"#0ea5e9"}} onClick={()=>setPage("privacy")}>سياسة الخصوصية</span> ·{" "}
        <span style={{cursor:"pointer",color:"#0ea5e9"}} onClick={()=>setPage("about")}>عن الرابطة</span>
      </footer>
    </div>
  );
}
