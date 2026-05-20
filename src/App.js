import { useState, useEffect, useCallback, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";

// ── Config ────────────────────────────────────────────────────────────
var SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
var SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
var ADMIN_PASS        = process.env.REACT_APP_ADMIN_PASS || "";
var READONLY_PASS     = process.env.REACT_APP_READONLY_PASS || "";
var READY = Boolean(SUPABASE_URL && SUPABASE_KEY);

// ── Design Tokens — Engineering Blueprint Modern ──────────────────────
// Light blueprint-paper aesthetic. Deep ocean navy for text/structure (ink),
// bright azure for accents (highlight lines), pale sky for surfaces.
// Token name "cyan" kept for code stability — VALUE is now bright azure.
// Palette: #093C5D · #2C5EAD · #1591DC · #4BB8FA · #C4E2F5
var T = {
  // Surfaces — clean blueprint paper
  bg0:       "#f8fbfd",   // page background (off-white with sky hint)
  bg1:       "#f0f7fc",   // primary section bg (faint sky)
  bg2:       "#ffffff",   // elevated cards (white paper)
  bg3:       "#e8f3fb",   // hover / popover (lighter sky)
  bg4:       "#C4E2F5",   // pale sky tinted band
  border:    "#d8e8f3",   // subtle border (very pale sky)
  border2:   "#C4E2F5",   // stronger border (pale sky)
  // Text — deep ocean navy ink
  text:      "#093C5D",   // primary text (deep ocean navy)
  text2:     "#2C5EAD",   // secondary text (royal blue)
  text3:     "#5a7a96",   // muted (slate-blue)
  text4:     "#8ba8be",   // very muted
  // Accent — bright azure (blueprint highlight line)
  cyan:      "#1591DC",   // primary accent — bright azure
  cyanLt:    "#4BB8FA",   // lighter for hover (sky blue)
  cyanDk:    "#0f6fa8",   // darker pressed (deep azure)
  cyanGlow:  "rgba(21,145,220,.32)",
  // Supporting — deep navy for hero/navbar/footer gradients
  ink:       "#093C5D",   // deep ocean navy
  ink2:      "#062A45",   // deepest navy
  ink3:      "#2C5EAD",   // royal blue (3rd stop)
  // Status — classic vibrant for clarity
  success:   "#22c55e",
  warning:   "#f59e0b",
  danger:    "#ef4444",
  info:      "#1591DC",
  // Effects — soft navy-tinted shadows for light theme
  shadow:    "0 1px 2px rgba(9,60,93,.06),0 4px 14px rgba(9,60,93,.08)",
  shadowLg:  "0 4px 18px rgba(9,60,93,.10),0 24px 56px rgba(9,60,93,.14)",
  shadowCyan:"0 8px 24px rgba(21,145,220,.38)",
  radius:    8,
  radiusLg:  14,
  // Font — Tajawal kept for Arabic readability
  font:      "'Tajawal','Segoe UI',Tahoma,Arial,sans-serif",
  fontDisp:  "'Tajawal','Segoe UI',Tahoma,Arial,sans-serif",
  fontMono:  "'JetBrains Mono','Cascadia Code','Consolas',monospace",
};

// Backward-compat aliases for legacy color names used throughout the file
T.copper     = T.cyan;
T.copperLt   = T.cyanLt;
T.copperDk   = T.cyanDk;
T.gold       = T.cyan;
T.gold2      = T.cyanLt;
T.goldDark   = T.cyanDk;
T.green      = T.success;
T.blue       = T.info;
T.teal       = T.cyan;
T.red        = T.danger;
T.amber      = T.warning;
T.sage       = T.cyan;
T.sageLt     = T.cyanLt;
T.crimson    = T.danger;
T.stone      = T.text3;
T.cream      = T.bg0;
T.cream2     = T.bg1;
T.paper      = T.bg2;
T.surface    = T.bg2;
T.ivory      = T.text;
T.bg         = T.bg0;
T.shadowGold   = T.shadowCyan;
T.shadowCopper = T.shadowCyan;

// Engineering grid patterns — bright cyan on dark
var ISO_GRID = "linear-gradient(30deg,rgba(21,145,220,.05) 1px,transparent 1px),linear-gradient(150deg,rgba(21,145,220,.05) 1px,transparent 1px)";
var ISO_GRID_SIZE = "48px 28px";
var BLUEPRINT_BG = "linear-gradient(rgba(21,145,220,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(21,145,220,.06) 1px,transparent 1px)";
var BLUEPRINT_SIZE = "48px 48px";
var DOT_GRID = "radial-gradient(rgba(21,145,220,.10) 1px,transparent 1px)";
var DOT_GRID_SIZE = "22px 22px";

// ── Constants ─────────────────────────────────────────────────────────
var PROVINCES = ["بغداد","البصرة","نينوى","أربيل","السليمانية","كركوك","الأنبار","ديالى","بابل","كربلاء","النجف","واسط","ذي قار","ميسان","المثنى","القادسية","صلاح الدين","دهوك"];
var EMPLOY_OPTS = ["موظف","غير موظف","طالب دراسات عليا"];
var EMPLOY_COLORS = {"موظف":"#047857","غير موظف":"#b91c1c","طالب دراسات عليا":"#4f46e5"};
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
  phone:      "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z",
  coord:      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  // Engineering icons
  gear:       "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  compass:    "M12 9v3l2 2 M21 12a9 9 0 11-18 0 9 9 0 0118 0z M12 3v2 M12 19v2 M3 12h2 M19 12h2",
  building:   "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m4-7h2m2 0h2m-6-4h2m2 0h2m-6-4h2m2 0h2",
  document:   "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  briefcase:  "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  flag:       "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  target:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  voice:      "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  shieldCheck:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  spark:      "M13 10V3L4 14h7v7l9-11h-7z",
  arrow:      "M14 5l7 7m0 0l-7 7m7-7H3",
  download:   "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
};

function SvgIcon({d, size, color, sw}) {
  return (
    <svg width={size||20} height={size||20} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth={sw||2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

// ── Engineering Illustrations ─────────────────────────────────────────
// Architectural Compass Rose — main hero emblem
function CompassRose({size, color, accent}) {
  var s = size||140;
  var c = color||"#093C5D";
  var a = accent||"#1591DC";
  return (
    <svg width={s} height={s} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer ring */}
      <circle cx="100" cy="100" r="92" stroke={c} strokeWidth="1" opacity=".25"/>
      <circle cx="100" cy="100" r="86" stroke={c} strokeWidth="2"/>
      {/* tick marks every 15° */}
      {Array.from({length:24}).map(function(_,i){
        var ang = i * 15;
        var rad = ang * Math.PI/180;
        var inner = i%2===0 ? 78 : 82;
        var outer = 86;
        var x1 = 100 + Math.cos(rad)*inner;
        var y1 = 100 + Math.sin(rad)*inner;
        var x2 = 100 + Math.cos(rad)*outer;
        var y2 = 100 + Math.sin(rad)*outer;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={i%2===0?1.8:1} opacity={i%2===0?1:.5}/>;
      })}
      {/* cardinal directions text */}
      <text x="100" y="22"  fill={c} fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" textAnchor="middle">N</text>
      <text x="184" y="104" fill={c} fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" textAnchor="middle">E</text>
      <text x="100" y="188" fill={c} fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" textAnchor="middle">S</text>
      <text x="16"  y="104" fill={c} fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" textAnchor="middle">W</text>
      {/* compass needle — north arm (copper) */}
      <polygon points="100,30 108,100 100,108 92,100" fill={a}/>
      {/* south arm (ink) */}
      <polygon points="100,170 108,100 100,92 92,100" fill={c}/>
      {/* east-west subtle arms */}
      <polygon points="170,100 100,108 92,100 100,92" fill={c} opacity=".35"/>
      <polygon points="30,100  100,108 92,100 100,92" fill={c} opacity=".35"/>
      {/* center hub */}
      <circle cx="100" cy="100" r="10" fill={c}/>
      <circle cx="100" cy="100" r="4" fill={a}/>
      <circle cx="100" cy="100" r="1.5" fill="#fff"/>
      {/* inner ring */}
      <circle cx="100" cy="100" r="58" stroke={c} strokeWidth="1" strokeDasharray="2 4" opacity=".4"/>
    </svg>
  );
}

// Isometric structural cube — secondary motif
function IsoCube({size, color}) {
  var s = size||60;
  var c = color||"#1591DC";
  return (
    <svg width={s} height={s} viewBox="0 0 60 60" fill="none">
      <path d="M30 5 L55 19 L55 41 L30 55 L5 41 L5 19 Z" stroke={c} strokeWidth="1.4" opacity=".5"/>
      <path d="M30 5 L30 30 L5 19" stroke={c} strokeWidth="1.4"/>
      <path d="M30 30 L55 19" stroke={c} strokeWidth="1.4"/>
      <path d="M30 30 L30 55" stroke={c} strokeWidth="1.4"/>
    </svg>
  );
}

// T-square + Triangle drafting tools (decorative)
function DraftingTools({size, color, accent}) {
  var s = size||120;
  var c = color||"#093C5D";
  var a = accent||"#1591DC";
  return (
    <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
      {/* T-square horizontal arm */}
      <rect x="10" y="20" width="100" height="6" rx="1" stroke={c} strokeWidth="1.4" fill="none"/>
      {/* T-square vertical arm */}
      <rect x="55" y="20" width="10" height="80" rx="1" stroke={c} strokeWidth="1.4" fill="none"/>
      {/* ticks on horizontal */}
      {Array.from({length:9}).map(function(_,i){
        return <line key={i} x1={20+i*10} y1="26" x2={20+i*10} y2={i%2?30:32} stroke={c} strokeWidth="0.8"/>;
      })}
      {/* 30-60-90 triangle */}
      <path d="M70 45 L105 90 L70 90 Z" stroke={a} strokeWidth="1.5" fill={a} fillOpacity=".06"/>
      {/* triangle inner hole */}
      <path d="M77 60 L97 85 L77 85 Z" stroke={a} strokeWidth="0.8" opacity=".5" fill="none"/>
      {/* labels */}
      <text x="60" y="16" fill={c} fontFamily="JetBrains Mono, monospace" fontSize="6" textAnchor="middle">T-SQUARE</text>
    </svg>
  );
}

// Caliper-style horizontal divider
function CaliperDivider({color, width}) {
  var c = color||"#1591DC";
  return (
    <svg width="100%" height="20" viewBox="0 0 400 20" preserveAspectRatio="none" style={{width:width||"100%",display:"block"}}>
      <line x1="0" y1="10" x2="400" y2="10" stroke={c} strokeWidth="1" opacity=".6"/>
      {Array.from({length:21}).map(function(_,i){
        var x = i*20;
        var h = i%5===0 ? 8 : 4;
        return <line key={i} x1={x} y1={10-h/2} x2={x} y2={10+h/2} stroke={c} strokeWidth={i%5===0?1.2:0.8} opacity={i%5===0?1:.5}/>;
      })}
      {/* end caps */}
      <line x1="0" y1="4" x2="0" y2="16" stroke={c} strokeWidth="1.5"/>
      <line x1="400" y1="4" x2="400" y2="16" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
}

// Section eyebrow with tick marks (replaces simple uppercase label)
function Eyebrow({text, color, align}) {
  var c = color||"#1591DC";
  return (
    <div style={{
      display:"inline-flex",alignItems:"center",gap:10,
      justifyContent:align||"center",marginBottom:14
    }}>
      <svg width="28" height="8" viewBox="0 0 28 8" fill="none">
        <line x1="0" y1="4" x2="20" y2="4" stroke={c} strokeWidth="1"/>
        <line x1="20" y1="1" x2="20" y2="7" stroke={c} strokeWidth="1.5"/>
        <line x1="24" y1="2" x2="24" y2="6" stroke={c} strokeWidth="1"/>
        <line x1="27" y1="3" x2="27" y2="5" stroke={c} strokeWidth="1"/>
      </svg>
      <span style={{
        fontSize:11,fontWeight:600,letterSpacing:"3px",color:c,
        textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"
      }}>{text}</span>
      <svg width="28" height="8" viewBox="0 0 28 8" fill="none">
        <line x1="8" y1="4" x2="28" y2="4" stroke={c} strokeWidth="1"/>
        <line x1="8" y1="1" x2="8" y2="7" stroke={c} strokeWidth="1.5"/>
        <line x1="4" y1="2" x2="4" y2="6" stroke={c} strokeWidth="1"/>
        <line x1="1" y1="3" x2="1" y2="5" stroke={c} strokeWidth="1"/>
      </svg>
    </div>
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
    var r = await fetch(
      SUPABASE_URL+"/rest/v1/graduates?id=eq."+id,
      {method:"DELETE", headers:Object.assign({},H(),{"Prefer":"return=representation"})}
    );
    if(!r.ok) throw new Error("delete_failed");
    var deleted = await r.json();
    if(!deleted.length) throw new Error("not_deleted");
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
  },
  getCoordinators: async function() {
    var r = await fetch(SUPABASE_URL+"/rest/v1/coordinators?select=*&order=province.asc,created_at.asc",{headers:H()});
    if(!r.ok) throw new Error("coordinators_failed");
    return r.json();
  },
  addCoordinator: async function(data) {
    var r = await fetch(SUPABASE_URL+"/rest/v1/coordinators",{
      method:"POST",
      headers:Object.assign({},H(),{"Prefer":"return=representation"}),
      body:JSON.stringify(data)
    });
    if(!r.ok) throw new Error("add_coordinator_failed");
    return r.json();
  },
  deleteCoordinator: async function(id) {
    var r = await fetch(SUPABASE_URL+"/rest/v1/coordinators?id=eq."+id,{
      method:"DELETE",headers:H()
    });
    if(!r.ok) throw new Error("delete_coordinator_failed");
    return true;
  }
};

// ── Style helpers ─────────────────────────────────────────────────────
function navBtn(a) {
  return {
    background:a?"rgba(21,145,220,.14)":"transparent",
    border:"1px solid "+(a?"rgba(21,145,220,.45)":"transparent"),
    color:a?T.cyan:T.text2,
    padding:"8px 14px",borderRadius:6,cursor:"pointer",
    fontSize:12.5,fontWeight:a?700:500,transition:"all .2s",fontFamily:T.font,
    letterSpacing:".2px"
  };
}
function inp(err) {
  return {
    width:"100%",padding:"12px 14px",borderRadius:T.radius,
    border:"1.5px solid "+(err?T.danger:T.border2),
    fontSize:14,outline:"none",background:T.bg1,boxSizing:"border-box",
    color:T.text,fontFamily:T.font,transition:"border-color .15s, box-shadow .15s",
    boxShadow:err?"0 0 0 3px rgba(248,113,113,.20)":"none"
  };
}
function btn(bg1,bg2) {
  return {
    background:"linear-gradient(135deg,"+(bg1||T.bg3)+","+(bg2||T.bg2)+")",
    color:T.text,border:"1px solid "+T.border2,padding:"11px 22px",borderRadius:T.radius,
    fontSize:13,fontWeight:700,cursor:"pointer",
    boxShadow:"0 4px 14px rgba(9,60,93,.10)",
    transition:"transform .15s, box-shadow .2s",fontFamily:T.font,
    letterSpacing:".3px"
  };
}
function btnGold() {
  return {
    background:"linear-gradient(135deg,"+T.cyanLt+","+T.cyan+")",
    color:T.bg0,border:"none",padding:"12px 24px",borderRadius:T.radius,
    fontSize:14,fontWeight:800,cursor:"pointer",
    boxShadow:T.shadowCyan,fontFamily:T.font,letterSpacing:".2px",
    transition:"transform .15s, box-shadow .2s"
  };
}
var card     = {background:T.surface,borderRadius:T.radiusLg,padding:"24px",boxShadow:T.shadow,marginBottom:20,border:"1px solid "+T.border};
var pageWrap = {maxWidth:1080,margin:"0 auto",padding:"32px 18px"};
var grid2    = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:16};

// ── Shared Components ─────────────────────────────────────────────────
function Field({label,error,children,optional}) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"flex",alignItems:"center",gap:6,fontWeight:600,marginBottom:7,fontSize:13,color:T.text2}}>
        {label}
        {optional && <span style={{fontSize:11,color:T.text3,fontWeight:400}}>(اختياري)</span>}
      </label>
      {children}
      {error && <div style={{color:T.danger,fontSize:12,marginTop:4}}>{error}</div>}
    </div>
  );
}

function Check({value,label,color,onChange}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}} onClick={()=>onChange(!value)}>
      <div style={{width:20,height:20,borderRadius:5,border:"2px solid "+(value?(color||T.cyan):T.border2),background:value?(color||T.cyan):T.bg1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
        {value && <SvgIcon d="M5 13l4 4L19 7" size={12} color={T.bg0} sw={2.5}/>}
      </div>
      <span style={{fontSize:14,color:T.text2,fontWeight:value?600:400}}>{label}</span>
    </div>
  );
}

function SectionHeader({icon,title,color}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
      <div style={{width:34,height:34,borderRadius:10,background:color||T.cyan,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 14px "+(color||T.cyan)+"40"}}>
        <SvgIcon d={icon} size={18} color={T.bg0}/>
      </div>
      <span style={{fontWeight:700,fontSize:14,color:T.text}}>{title}</span>
    </div>
  );
}

// ── Professional Stat Card ────────────────────────────────────────────
function StatCardPro({iconPath, label, val, pct, color, barPct}) {
  var bar = Math.min(barPct||pct||0, 100);
  var c = color || T.cyan;
  return (
    <div style={{background:T.bg2,borderRadius:16,padding:"20px 20px 14px",boxShadow:T.shadow,border:"1px solid "+T.border2,borderRight:"4px solid "+c,flex:"1 1 190px",minWidth:180}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <span style={{fontSize:12,color:T.text3,fontWeight:500,direction:"ltr"}}>{pct>0?pct.toFixed(1)+"%":""}</span>
        <div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,"+c+","+c+"cc)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 14px "+c+"55"}}>
          <SvgIcon d={iconPath} size={22} color={T.bg0}/>
        </div>
      </div>
      <div style={{fontSize:13,color:T.text3,marginBottom:6,fontWeight:500,textAlign:"right"}}>{label}</div>
      <div style={{fontSize:32,fontWeight:800,color:T.text,textAlign:"right",marginBottom:12,direction:"ltr",lineHeight:1}}>{val}</div>
      <div style={{height:4,background:T.bg3,borderRadius:2}}>
        <div style={{height:"100%",width:Math.max(bar,2)+"%",background:"linear-gradient(90deg,"+c+"88,"+c+")",borderRadius:2}}/>
      </div>
    </div>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────
function Ticker() {
  var [text,setText] = useState("تنبيه: هذه منصّة مستقلّة وغير تابعة لأي جهة حكومية أو حزبية — المنصة الوطنية لمهندسي العراق غير المعينين");

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
    <div style={{
      background:T.bg1,
      borderBottom:"1px solid "+T.cyan+"40",
      overflow:"hidden",height:34,display:"flex",alignItems:"center"
    }}>
      <div style={{
        background:"linear-gradient(135deg,"+T.cyanLt+","+T.cyan+")",
        color:T.bg0,padding:"0 16px",fontSize:10.5,fontWeight:800,
        whiteSpace:"nowrap",height:"100%",display:"flex",alignItems:"center",
        flexShrink:0,gap:6,letterSpacing:"1.5px",fontFamily:T.fontMono
      }}>
        <SvgIcon d={P.news} size={12} color={T.bg0}/>
        NOTICE / إشعار
      </div>
      <div style={{overflow:"hidden",flex:1,height:"100%",display:"flex",alignItems:"center"}}>
        <span style={{
          display:"inline-block",whiteSpace:"nowrap",color:T.text2,
          fontSize:12,fontWeight:500,animation:"ticker-ltr 40s linear infinite",
          letterSpacing:".2px",fontFamily:T.font
        }}>
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
    <div style={{position:"fixed",inset:0,background:"rgba(9,60,93,.55)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,direction:"rtl"}} onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div style={{
        background:T.bg2,borderRadius:T.radiusLg,width:"100%",maxWidth:520,
        boxShadow:"0 24px 80px rgba(9,60,93,.30)",overflow:"hidden",
        maxHeight:"90vh",display:"flex",flexDirection:"column",
        border:"1px solid "+T.border2
      }}>
        <div style={{
          background:"linear-gradient(135deg,"+T.bg1+","+T.bg3+")",
          padding:"24px 26px",position:"relative",overflow:"hidden",
          borderBottom:"2px solid "+T.cyan+"60"
        }}>
          <div style={{position:"absolute",inset:0,backgroundImage:BLUEPRINT_BG,backgroundSize:BLUEPRINT_SIZE,opacity:.5,pointerEvents:"none"}}/>
          <button onClick={onClose} style={{
            position:"absolute",top:14,left:14,
            background:"rgba(248,113,113,.20)",border:"1px solid rgba(248,113,113,.50)",color:T.danger,
            borderRadius:8,padding:"5px 14px",fontSize:12,cursor:"pointer",
            fontWeight:700,display:"flex",alignItems:"center",gap:6,zIndex:2
          }}>
            <SvgIcon d="M6 18L18 6M6 6l12 12" size={13} color={T.danger}/> إغلاق
          </button>
          <div style={{display:"flex",alignItems:"center",gap:14,position:"relative"}}>
            <div style={{
              background:"rgba(21,145,220,.20)",border:"1px solid rgba(21,145,220,.45)",
              borderRadius:12,padding:"11px",display:"flex",
              boxShadow:"0 0 24px rgba(21,145,220,.25)"
            }}>
              <SvgIcon d={P.search} size={24} color={T.cyan}/>
            </div>
            <div>
              <div style={{fontSize:10,color:T.cyan,fontWeight:700,letterSpacing:"1.5px",marginBottom:3,textTransform:"uppercase",fontFamily:T.fontMono}}>التحقق</div>
              <h3 style={{color:T.text,margin:0,fontSize:18,fontWeight:800,letterSpacing:"-.2px"}}>تحقّق من تسجيلك</h3>
              <p style={{color:T.text2,margin:"4px 0 0",fontSize:12.5}}>أدخل اسمك الرباعي ورقم هاتفك للتحقق</p>
            </div>
          </div>
        </div>

        <div style={{padding:"24px",overflowY:"auto",flex:1,background:T.bg2}}>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:T.text2,marginBottom:6}}>الاسم الرباعي الكامل</label>
            <input value={name} onChange={function(e){setName(e.target.value);reset();}}
              onKeyDown={function(e){if(e.key==="Enter")search();}}
              placeholder="أدخل الاسم الرباعي كما هو مسجل..."
              style={{...inp(status==="err_name"||status==="no_name"),marginBottom:0}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:T.text2,marginBottom:6}}>رقم الهاتف المسجل</label>
            <div style={{display:"flex",gap:10}}>
              <input value={phone} onChange={function(e){setPhone(e.target.value);reset();}}
                onKeyDown={function(e){if(e.key==="Enter")search();}}
                placeholder="07XXXXXXXXX"
                style={{...inp(status==="err_phone"||status==="no_phone"),flex:1,direction:"ltr",textAlign:"right",marginBottom:0}}/>
              <button onClick={search} disabled={loading} style={{...btnGold(),padding:"11px 22px",opacity:loading?0.7:1,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8}}>
                <SvgIcon d={P.search} size={16} color={T.bg0}/>
                {loading?"جاري البحث...":"بحث"}
              </button>
            </div>
          </div>

          {status==="err_name"  && <div style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>يرجى إدخال الاسم الرباعي (4 أجزاء على الأقل)</div>}
          {status==="err_phone" && <div style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>رقم الهاتف غير صحيح — يجب أن يبدأ بـ 07</div>}
          {status==="err_api"   && <div style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12}}>حدث خطأ في الاتصال، حاول مرة أخرى</div>}

          {status==="no_phone" && (
            <div style={{background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.30)",borderRadius:14,padding:"22px",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(248,113,113,.20)",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <SvgIcon d="M6 18L18 6M6 6l12 12" size={26} color={T.danger}/>
              </div>
              <h4 style={{color:T.danger,margin:"0 0 8px",fontSize:16}}>رقم الهاتف غير مسجل</h4>
              <p style={{color:T.text3,fontSize:13,margin:0}}>لا يوجد سجل بهذا الرقم في قاعدة بيانات الرابطة</p>
            </div>
          )}

          {status==="no_name" && (
            <div style={{background:"rgba(21,145,220,.10)",border:"1px solid rgba(21,145,220,.35)",borderRadius:14,padding:"22px",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(21,145,220,.18)",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <SvgIcon d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" size={26} color={T.warning}/>
              </div>
              <h4 style={{color:T.warning,margin:"0 0 8px",fontSize:16}}>الاسم لا يطابق السجل</h4>
              <p style={{color:T.text3,fontSize:13,margin:0}}>رقم الهاتف موجود لكن الاسم المدخل لا يتطابق — تأكد من كتابة الاسم كما سجّلته</p>
            </div>
          )}

          {status==="found" && result && (
            <div style={{
              background:"linear-gradient(135deg,rgba(74,222,128,.10),rgba(74,222,128,.04))",
              border:"1px solid "+T.success+"55",borderRadius:T.radiusLg,padding:"22px",
              borderRight:"4px solid "+T.success
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <div style={{
                  width:50,height:50,borderRadius:12,
                  background:"linear-gradient(135deg,"+T.success+","+T.success+"cc)",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                  boxShadow:"0 6px 18px rgba(74,222,128,.35)"
                }}>
                  <SvgIcon d="M5 13l4 4L19 7" size={24} color={T.bg0} sw={2.5}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.success,fontWeight:700,letterSpacing:"1.5px",marginBottom:3,textTransform:"uppercase",fontFamily:T.fontMono}}>مؤكّد</div>
                  <h4 style={{color:T.text,margin:0,fontSize:17,fontWeight:800}}>اسمك في القائمة الوطنية</h4>
                  <p style={{color:T.text2,margin:"3px 0 0",fontSize:12}}>تسجيل مؤكَّد في أرشيف المنصة</p>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {l:"الاسم الكامل",    v:result.full_name},
                  {l:"المحافظة",         v:result.province+(result.sub_district?" — "+result.sub_district:"")},
                  {l:"الجامعة",          v:result.university||"—"},
                  {l:"الكلية / القسم",   v:result.department||"—"},
                  {l:"التخصص",           v:result.specialization||"—"},
                  {l:"سنة التخرج",      v:result.graduation_year},
                  {l:"تاريخ التسجيل",   v:new Date(result.created_at).toLocaleDateString("en-GB")},
                ].map(function(item){return(
                  <div key={item.l} style={{background:T.bg1,border:"1px solid "+T.border,borderRadius:10,padding:"10px 14px"}}>
                    <div style={{fontSize:11,color:T.text3,marginBottom:3,fontWeight:600}}>{item.l}</div>
                    <div style={{fontWeight:700,fontSize:13,color:T.text}}>{item.v}</div>
                  </div>
                );})}
              </div>
              {/* Download buttons */}
              <div style={{borderTop:"1px solid "+T.success+"55",paddingTop:14}}>
                <div style={{textAlign:"center",fontSize:12,color:T.success,fontWeight:700,marginBottom:10,letterSpacing:".5px"}}>
                  تحميل الاستمارات
                </div>
                <DownloadButtons data={{...result, phone: normalizePhone(phone)}}/>
              </div>
            </div>
          )}

          {status==="idle" && (
            <div style={{textAlign:"center",padding:"12px",color:T.text4,fontSize:12,borderTop:"1px solid "+T.border,marginTop:4}}>
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
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg0,direction:"rtl"}}>
      <div style={{background:T.bg2,border:"1px solid "+T.border2,borderRadius:16,padding:40,maxWidth:480,textAlign:"center",boxShadow:T.shadowLg}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:T.cyan+"18",border:"1px solid "+T.cyan+"40",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <SvgIcon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" size={28} color={T.cyan}/>
        </div>
        <h2 style={{marginBottom:8,color:T.text}}>يلزم إعداد المتغيرات البيئية</h2>
      </div>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────
function RegisterPage() {
  var INIT = {full_name:"",province:"",sub_district:"",university:"",department:"",specialization:"",graduation_year:"",birth_date:"",phone:"",gender:"ذكر",employment_status:"غير موظف",marital_status:"أعزب",has_wife:false,has_children:false,children_count:0};
  var [f,setF]         = useState(INIT);
  var [er,setEr]       = useState({});
  var [st,setSt]       = useState("idle");
  var [msg,setMsg]     = useState("");
  var [saved,setSaved] = useState(null);

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
    if(!f.birth_date.trim()) e.birth_date="تاريخ الميلاد مطلوب";
    else {
      var bdParts=f.birth_date.trim().split("/");
      var bdValid=bdParts.length===3&&bdParts.every(function(p){return /^\d+$/.test(p);});
      if(!bdValid) e.birth_date="الصيغة غير صحيحة — استخدم: يوم/شهر/سنة";
      else {
        var bYear=parseInt(bdParts[2]), bMonth=parseInt(bdParts[1]), bDay=parseInt(bdParts[0]);
        if(bYear<1940||bYear>2005||bMonth<1||bMonth>12||bDay<1||bDay>31) e.birth_date="تاريخ الميلاد غير صحيح";
      }
    }
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
        graduation_year:parseInt(f.graduation_year),birth_date:(function(){var p=f.birth_date.split("/");return p[2]+"-"+(p[1].padStart(2,"0"))+"-"+(p[0].padStart(2,"0"));}()),phone:f.phone.trim(),
        gender:f.gender,employment_status:f.employment_status,
        marital_status:f.marital_status,has_wife:f.has_wife,has_children:f.has_children,
        children_count:f.has_children?(parseInt(f.children_count)||0):0
      });
      localStorage.setItem("reg_attempts",JSON.stringify([...attempts,now]));
      setSaved({...f});
      setSt("success"); setF(INIT);
    } catch(err) {
      setSt("err");
      setMsg(err.message==="phone_exists"?"رقم الهاتف مسجل مسبقاً في قاعدة البيانات":"حدث خطأ أثناء التسجيل، حاول مجدداً");
    }
  }

  if(st==="success") return (
    <div style={pageWrap}>
      <div style={{...card,textAlign:"center",padding:"48px 24px",borderTop:"4px solid "+T.success}}>
        <div style={{
          width:80,height:80,borderRadius:20,
          background:"linear-gradient(135deg,rgba(74,222,128,.22),rgba(74,222,128,.04))",
          border:"1px solid "+T.success+"55",
          margin:"0 auto 18px",display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 0 32px rgba(74,222,128,.20)"
        }}>
          <SvgIcon d="M5 13l4 4L19 7" size={40} color={T.success} sw={2.5}/>
        </div>
        <div style={{fontSize:11,color:T.success,fontWeight:700,letterSpacing:"2px",marginBottom:6,textTransform:"uppercase",fontFamily:T.fontMono}}>تم التسجيل</div>
        <h2 style={{color:T.text,fontSize:24,marginBottom:8,fontWeight:900,letterSpacing:"-.2px"}}>أُضيف اسمك إلى القائمة الوطنية</h2>
        <p style={{color:T.text2,marginBottom:8,fontSize:14.5,lineHeight:1.9}}>شكراً لانضمامك إلى <strong style={{color:T.cyan}}>المنصة الوطنية لمهندسي العراق غير المعينين</strong></p>
        <p style={{color:T.text3,fontSize:13,marginBottom:26}}>يمكنك الآن تحميل استمارة تسجيلك الرسمية أو استمارة التخويل لتمثيلك في المطالبة بحقوقك</p>

        {/* Download section */}
        <div style={{
          background:T.bg1,borderRadius:T.radiusLg,padding:"22px 24px",
          marginBottom:24,border:"1px solid "+T.border2
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginBottom:14}}>
            <SvgIcon d={P.download} size={18} color={T.cyan}/>
            <span style={{fontWeight:800,fontSize:14,color:T.text}}>تحميل الاستمارات الرسمية</span>
          </div>
          {saved && <DownloadButtons data={saved}/>}
        </div>

        <button style={btnGold()} onClick={function(){setSt("idle");}}>تسجيل مهندس آخر</button>
      </div>
    </div>
  );

  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={{
          display:"flex",alignItems:"flex-start",gap:14,marginBottom:22,
          paddingBottom:18,borderBottom:"1px solid "+T.border2
        }}>
          <div style={{
            width:48,height:48,borderRadius:12,
            background:"linear-gradient(135deg,rgba(21,145,220,.20),rgba(21,145,220,.06))",
            border:"1px solid rgba(21,145,220,.45)",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            boxShadow:"0 0 24px rgba(21,145,220,.18)"
          }}>
            <SvgIcon d={P.edit} size={22} color={T.cyan}/>
          </div>
          <div>
            <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"1.5px",marginBottom:4,textTransform:"uppercase",fontFamily:T.fontMono}}>تسجيل جديد</div>
            <h1 style={{fontSize:21,fontWeight:900,marginBottom:4,color:T.text,letterSpacing:"-.2px"}}>أضف اسمك إلى القائمة الوطنية</h1>
            <p style={{color:T.text3,fontSize:13,margin:0}}>المنصة الوطنية لمهندسي العراق غير المعينين — التسجيل مجاني وسري</p>
          </div>
        </div>
        {st==="err" && <div style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,padding:"12px 16px",borderRadius:10,marginBottom:16,fontSize:13,fontWeight:600}}>{msg}</div>}

        {/* Academic Info */}
        <div style={{background:T.bg1,borderRadius:12,padding:"20px",marginBottom:16,border:"1px solid "+T.border}}>
          <SectionHeader icon={P.grad} title="المعلومات الشخصية والأكاديمية" color={T.cyan}/>
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
            <Field label="تاريخ الميلاد (يوم/شهر/سنة)" error={er.birth_date}>
              <input value={f.birth_date} onChange={e=>up("birth_date",e.target.value)} placeholder="مثال: 15/06/1990" style={{...inp(er.birth_date),direction:"ltr",textAlign:"right"}} maxLength={10}/>
            </Field>
          </div>
          <div style={{...grid2}}>
            <Field label="سنة التخرج" error={er.graduation_year}>
              <input type="number" value={f.graduation_year} onChange={e=>up("graduation_year",e.target.value)} placeholder="2020" style={inp(er.graduation_year)} min="1970" max={CUR_YEAR-5}/>
            </Field>
          </div>
        </div>

        {/* University Info */}
        <div style={{background:T.bg1,borderRadius:T.radius,padding:"20px",marginBottom:16,border:"1px solid "+T.border}}>
          <SectionHeader icon={P.grad} title="المؤهلات الهندسية" color={T.info}/>
          <div style={grid2}>
            <Field label="الجامعة" error={er.university}>
              <input value={f.university} onChange={e=>up("university",e.target.value)} placeholder="مثال: جامعة بغداد" style={inp(er.university)}/>
            </Field>
            <Field label="الكلية / القسم الهندسي" error={er.department}>
              <input value={f.department} onChange={e=>up("department",e.target.value)} placeholder="مثال: كلية الهندسة — قسم المدني" style={inp(er.department)}/>
            </Field>
          </div>
          <Field label="التخصص الدقيق" optional>
            <input value={f.specialization} onChange={e=>up("specialization",e.target.value)} placeholder="مثال: هندسة الكهرباء والإلكترونيات" style={inp(false)}/>
          </Field>
        </div>

        {/* Gender + Employment */}
        <div style={{background:T.bg1,borderRadius:12,padding:"20px",marginBottom:16,border:"1px solid "+T.border}}>
          <SectionHeader icon={P.users} title="الجنس والوضع الوظيفي" color={T.warning}/>
          <div style={grid2}>
            <Field label="الجنس">
              <div style={{display:"flex",gap:10}}>
                {[{v:"ذكر",l:"ذكر"},{v:"أنثى",l:"أنثى"}].map(({v,l})=>{
                  var a=f.gender===v;
                  return <div key={v} onClick={()=>up("gender",v)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:14,border:"2px solid "+(a?T.cyan:T.border2),background:a?"rgba(21,145,220,.14)":T.bg2,color:a?T.cyan:T.text3,transition:"all .15s"}}>{l}</div>;
                })}
              </div>
            </Field>
            <Field label="الوضع الوظيفي">
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{v:"موظف",c:T.success},{v:"غير موظف",c:T.danger},{v:"طالب دراسات عليا",c:T.info}].map(({v,c})=>{
                  var a=f.employment_status===v;
                  return <div key={v} onClick={()=>up("employment_status",v)} style={{padding:"7px 12px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,border:"2px solid "+(a?c:T.border2),background:a?(c+"22"):T.bg2,color:a?c:T.text3,transition:"all .15s"}}>{v}</div>;
                })}
              </div>
            </Field>
          </div>
        </div>

        {/* Marital */}
        <div style={{background:T.bg1,borderRadius:12,padding:"20px",marginBottom:20,border:"1px solid "+T.border}}>
          <SectionHeader icon={P.heart} title="الحالة الاجتماعية" color={T.success}/>
          <Field label="الحالة الاجتماعية">
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {["أعزب","متزوج","مطلق","أرمل"].map(v=>{
                var a=f.marital_status===v;
                return <div key={v} onClick={()=>setMarital(v)} style={{padding:"9px 18px",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600,border:"2px solid "+(a?T.success:T.border2),background:a?"rgba(74,222,128,.14)":T.bg2,color:a?T.success:T.text3,transition:"all .15s"}}>{v}</div>;
              })}
            </div>
          </Field>
          <div style={{display:"flex",gap:28,flexWrap:"wrap",marginTop:4}}>
            <Check value={f.has_wife} label="لديه زوجة حالياً" color={T.success} onChange={v=>up("has_wife",v)}/>
            <Check value={f.has_children} label="لديه أطفال" color={T.info} onChange={setHasChildren}/>
          </div>
          {f.has_children && (
            <div style={{marginTop:16,maxWidth:200}}>
              <Field label="عدد الأطفال" error={er.children_count}>
                <input type="number" min="1" max="20" value={f.children_count||""} onChange={e=>up("children_count",e.target.value)} placeholder="3" style={inp(er.children_count)}/>
              </Field>
            </div>
          )}
        </div>

        <button style={{...btnGold(),width:"100%",padding:"14px",fontSize:15,opacity:st==="loading"?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={submit} disabled={st==="loading"}>
          {st==="loading" ? (
            <>جاري التسجيل...</>
          ) : (
            <><SvgIcon d="M5 13l4 4L19 7" size={18} color={T.bg0} sw={2.5}/> تسجيل الآن</>
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
    <div style={{textAlign:"center",padding:"80px 20px",color:T.text3}}>
      <div style={{width:48,height:48,margin:"0 auto 16px",opacity:.6}}>
        <SvgIcon d={P.chart} size={48} color={T.cyan}/>
      </div>
      <div style={{fontSize:15,color:T.text2}}>جاري تحميل الإحصائيات...</div>
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
    {iconPath:P.users,    label:"إجمالي المهندسين",    val:total,      pct:100,             barPct:100,                  color:"#1591DC"},
    {iconPath:P.male,     label:"الذكور",                val:male,       pct:pct(male),       barPct:pct(male),            color:"#2C5EAD"},
    {iconPath:P.female,   label:"الإناث",                val:female,     pct:pct(female),     barPct:pct(female),          color:"#e11d8c"},
    {iconPath:P.map,      label:"المحافظات",             val:provinces,  pct:0,               barPct:(provinces/18)*100,   color:"#4BB8FA"},
    {iconPath:P.grad,     label:"التخصصات الهندسية",     val:specs,      pct:0,               barPct:Math.min(specs*5,100),color:"#093C5D"},
    {iconPath:P.heart,    label:"متزوجون",                val:married,    pct:pct(married),    barPct:pct(married),         color:"#22c55e"},
    {iconPath:P.person,   label:"غير متزوجين",           val:notMarried, pct:pct(notMarried), barPct:pct(notMarried),      color:"#5a7a96"},
  ];

  return (
    <div style={{...pageWrap,maxWidth:1100}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"2px",color:T.cyan,marginBottom:8,textTransform:"uppercase",fontFamily:T.fontMono}}>
          الأرقام الرسمية
        </div>
        <h2 style={{color:T.text,fontSize:"clamp(22px,3.5vw,30px)",fontWeight:900,marginBottom:8,letterSpacing:"-.3px"}}>
          الإحصائيات العامة للمهندسين
        </h2>
        <p style={{color:T.text3,fontSize:14,lineHeight:1.8,maxWidth:560,margin:"0 auto"}}>
          المنصة الوطنية لمهندسي العراق غير المعينين — بيانات محدّثة لحظياً
        </p>
        <div style={{width:60,height:2,background:T.cyan,margin:"18px auto 0",boxShadow:"0 0 12px "+T.cyan}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:18}}>
        {cards.map(function(c){
          return <StatCardPro key={c.label} iconPath={c.iconPath} label={c.label}
            val={typeof c.val==="number"?c.val.toLocaleString("en-US"):c.val}
            pct={c.pct} barPct={c.barPct} color={c.color}/>;
        })}
      </div>
      <div style={{
        textAlign:"center",color:T.text3,fontSize:12,
        background:T.bg2,padding:"12px 18px",borderRadius:T.radius,
        border:"1px dashed "+T.border2,maxWidth:480,margin:"28px auto 0"
      }}>
        تُحدَّث الإحصائيات تلقائياً مع كل تسجيل جديد
      </div>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────
function AdminPage() {
  var [role,setRole]             = useState(()=>sessionStorage.getItem("admin_role")||"");
  var authed                     = role==="full"||role==="readonly";
  var isReadonly                 = role==="readonly";
  var [pwd,setPwd]               = useState("");
  var [pwdErr,setPwdErr]         = useState("");
  var [members,setMembers]       = useState([]);
  var [loading,setLoad]          = useState(false);
  var [search,setSearch]         = useState("");
  var [filterProv,setFilterProv] = useState("");
  var [filterEmp,setFilterEmp]   = useState("");
  var [filterGen,setFilterGen]   = useState("");
  var [filterDept,setFilterDept] = useState("");
  var [tab,setTab]               = useState("list");
  var [tickerMsgs,setTickerMsgs]   = useState([]);
  var [newMsg,setNewMsg]           = useState("");
  var [tickerLoading,setTL]        = useState(false);
  var [coords,setCoords]           = useState([]);
  var [coordLoading,setCoordLoad]  = useState(false);
  var [coordErr,setCoordErr]       = useState("");
  var [newCoord,setNewCoord]       = useState({province:"ديالى",district:"",name:"",phone:""});
  var [coordSearchProv,setCSP]     = useState("");

  function login() {
    if(!ADMIN_PASS){setPwdErr("لم يتم تعيين كلمة مرور في إعدادات الموقع");return;}
    if(pwd===ADMIN_PASS){
      sessionStorage.setItem("admin_role","full");
      setRole("full");
    } else if(READONLY_PASS && pwd===READONLY_PASS){
      sessionStorage.setItem("admin_role","readonly");
      setRole("readonly");
    } else {
      setPwdErr("كلمة المرور غير صحيحة");
    }
  }

  function logout() {
    sessionStorage.removeItem("admin_role");
    setRole("");
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  var loadCoords = useCallback(async function(){
    if(!authed) return;
    setCoordLoad(true);
    try{ setCoords(await db.getCoordinators()); }catch(e){console.error(e);}
    setCoordLoad(false);
  },[authed]);

  useEffect(()=>{ if(tab==="coords") loadCoords(); },[tab,loadCoords]);

  // Hooks before conditional return
  // eslint-disable-next-line react-hooks/exhaustive-deps
  var filtered = useMemo(()=>members.filter(r=>{
    if(filterProv && r.province!==filterProv) return false;
    if(filterEmp  && r.employment_status!==filterEmp) return false;
    if(filterGen  && r.gender!==filterGen) return false;
    if(filterDept.trim() && !(r.department&&r.department.includes(filterDept.trim()))) return false;
    if(search.trim() && !(
      (r.full_name&&r.full_name.includes(search))||
      (r.phone&&r.phone.includes(search))||
      (r.specialization&&r.specialization.includes(search))||
      (r.university&&r.university.includes(search))||
      (r.department&&r.department.includes(search))
    )) return false;
    return true;
  }),[members,filterProv,filterEmp,filterGen,filterDept,search]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  var dupIds = useMemo(()=>{
    var m={};
    members.forEach(r=>{var k=(r.full_name||"").trim().toLowerCase();if(!m[k])m[k]=[];m[k].push(r.id);});
    return new Set(Object.values(m).filter(a=>a.length>1).flat());
  },[members]);

  if(!authed) return (
    <div style={{...pageWrap,maxWidth:460}}>
      <div style={{...card,textAlign:"center",padding:"36px 28px",borderTop:"3px solid "+T.cyan}}>
        <div style={{
          width:72,height:72,borderRadius:16,
          background:"linear-gradient(135deg,rgba(21,145,220,.20),rgba(21,145,220,.06))",
          border:"1px solid rgba(21,145,220,.45)",
          margin:"0 auto 18px",display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 8px 24px rgba(9,60,93,.12),0 0 32px rgba(21,145,220,.25)"
        }}>
          <SvgIcon d={P.lock} size={32} color={T.cyan}/>
        </div>
        <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"2px",marginBottom:6,textTransform:"uppercase",fontFamily:T.fontMono}}>منطقة محمية</div>
        <h2 style={{marginBottom:6,color:T.text,fontSize:20,fontWeight:900,letterSpacing:"-.2px"}}>لوحة إدارة المنصة</h2>
        <p style={{color:T.text3,fontSize:13,marginBottom:22}}>ادخل كلمة المرور المخصصة لك</p>
        {pwdErr && <div style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,padding:"10px 14px",borderRadius:T.radius,marginBottom:14,fontSize:13,fontWeight:600}}>{pwdErr}</div>}
        <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr("");}}
          onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="كلمة المرور" style={{...inp(pwdErr),marginBottom:14,textAlign:"center",fontFamily:T.fontMono}}/>
        <button style={{...btnGold(),width:"100%",padding:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}} onClick={login}>
          <SvgIcon d={P.shield} size={18} color={T.bg0} sw={2.2}/> دخول آمن
        </button>
        <div style={{marginTop:18,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <span style={{background:T.success+"15",color:T.success,borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:700,border:"1px solid "+T.success+"40"}}>مدير كامل</span>
          <span style={{background:T.info+"15",color:T.info,borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:700,border:"1px solid "+T.info+"40"}}>مدير قراءة</span>
        </div>
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

  async function addCoord() {
    setCoordErr("");
    if(!newCoord.province.trim()) return setCoordErr("اختر المحافظة");
    if(!newCoord.district.trim()) return setCoordErr("أدخل القضاء أو المدينة");
    if(!newCoord.name.trim())     return setCoordErr("أدخل اسم المنسق");
    if(!/^07[3-9]\d{8}$/.test(newCoord.phone.trim())) return setCoordErr("رقم الهاتف غير صحيح — يبدأ بـ 07");
    setCoordLoad(true);
    try {
      await db.addCoordinator({province:newCoord.province.trim(),district:newCoord.district.trim(),name:newCoord.name.trim(),phone:newCoord.phone.trim()});
      setNewCoord({province:newCoord.province,district:"",name:"",phone:""});
      await loadCoords();
    } catch(e){ setCoordErr("حدث خطأ أثناء الإضافة"); }
    setCoordLoad(false);
  }

  async function deleteCoord(id, name) {
    if(!window.confirm("هل تريد حذف المنسق "+name+"؟")) return;
    setCoordLoad(true);
    try { await db.deleteCoordinator(id); await loadCoords(); }
    catch(e){ alert("حدث خطأ أثناء الحذف"); }
    setCoordLoad(false);
  }

  var adminTabs = [
    {k:"list",   l:"قائمة الأعضاء",              icon:P.users},
    {k:"dups",   l:"التكرارات ("+dupIds.size+")", icon:P.users},
    {k:"coords", l:"المنسقون",                    icon:P.coord},
    ...(!isReadonly ? [{k:"ticker", l:"شريط الأخبار", icon:P.news}] : []),
  ];

  return (
    <div style={pageWrap}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{margin:0,color:T.text,display:"flex",alignItems:"center",gap:10,fontSize:22,fontWeight:900,letterSpacing:"-.3px"}}>
            <SvgIcon d={P.shield} size={22} color={T.cyan}/> لوحة الإدارة
          </h2>
          <div style={{marginTop:6}}>
            {isReadonly
              ? <span style={{background:T.info+"18",color:T.info,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,border:"1px solid "+T.info+"40"}}>مدير قراءة فقط — لا يمكن التعديل أو الحذف</span>
              : <span style={{background:T.success+"18",color:T.success,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,border:"1px solid "+T.success+"40"}}>مدير كامل الصلاحيات</span>
            }
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={btn()} onClick={loadAll}>تحديث</button>
          <button style={{...btn(),color:T.success,borderColor:T.success+"55"}} onClick={exportCSV}>تصدير CSV</button>
          <button style={{...btn(),color:T.danger,borderColor:T.danger+"55"}} onClick={logout}>خروج</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {l:"إجمالي الأعضاء",  v:members.length,  color:T.cyan,    icon:P.users},
          {l:"غير موظف",         v:members.filter(m=>m.employment_status==="غير موظف").length, color:T.danger,  icon:P.person},
          {l:"موظف",             v:members.filter(m=>m.employment_status==="موظف").length,     color:T.success, icon:P.users},
          {l:"تكرارات",          v:dupIds.size,     color:T.warning, icon:P.users},
          {l:"النتائج",          v:filtered.length, color:T.info,    icon:P.chart},
        ].map(function(c){
          return (
            <div key={c.l} style={{background:T.bg2,borderRadius:14,padding:"16px 20px",flex:"1 1 130px",borderRight:"4px solid "+c.color,border:"1px solid "+T.border,boxShadow:T.shadow}}>
              <div style={{fontSize:22,fontWeight:800,color:T.text,fontFamily:T.fontMono}}>{c.v.toLocaleString("en-US")}</div>
              <div style={{fontSize:12,color:T.text3,marginTop:4}}>{c.l}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16,borderBottom:"2px solid "+T.border2,paddingBottom:0,flexWrap:"wrap"}}>
        {adminTabs.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"10px 18px",borderRadius:"10px 10px 0 0",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===t.k?T.cyan:T.bg2,color:tab===t.k?T.bg0:T.text2,display:"flex",alignItems:"center",gap:7,marginBottom:tab===t.k?"-2px":"0",borderBottom:tab===t.k?"2px solid "+T.cyan:"none",fontFamily:T.font,transition:"all .15s"}}>
            <SvgIcon d={t.icon} size={15} color={tab===t.k?T.bg0:T.text2}/>{t.l}
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
            <input value={filterDept} onChange={e=>setFilterDept(e.target.value)} placeholder="تصفية: الكلية / القسم..." style={{...inp(false),flex:"1 1 180px",marginBottom:0}}/>
          </div>
        </div>
        <div style={card}>
          {loading ? <div style={{textAlign:"center",padding:40,color:T.text3}}>جاري التحميل...</div> : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,color:T.text2}}>
                <thead>
                  <tr style={{background:T.bg1}}>
                    {["#","الاسم","المحافظة","الجامعة","الكلية/القسم","التخصص","سنة","الجنس","التوظيف","الحالة","الهاتف","التسجيل","حذف"].map(h=>(
                      <th key={h} style={{padding:"9px",textAlign:"right",borderBottom:"2px solid "+T.border2,fontWeight:700,color:T.text,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r,i)=>{
                    var isDup=dupIds.has(r.id);
                    var ec=EMPLOY_COLORS[r.employment_status]||T.text3;
                    return (
                      <tr key={r.id} style={{borderBottom:"1px solid "+T.border,background:isDup?"rgba(21,145,220,.08)":i%2?T.bg1:T.bg2}}>
                        <td style={{padding:"8px 9px",color:T.text4,fontFamily:T.fontMono}}>{i+1}{isDup&&<span style={{color:T.warning,marginRight:3}} title="مكرر">!</span>}</td>
                        <td style={{padding:"8px 9px",fontWeight:600,whiteSpace:"nowrap",color:T.text}}>{r.full_name}</td>
                        <td style={{padding:"8px 9px"}}><span style={{background:T.cyan+"18",color:T.cyan,padding:"2px 7px",borderRadius:20,fontSize:11,border:"1px solid "+T.cyan+"30"}}>{r.province}</span></td>
                        <td style={{padding:"8px 9px",color:T.text2}}>{r.university||"—"}</td>
                        <td style={{padding:"8px 9px",color:T.text2}}>{r.department||"—"}</td>
                        <td style={{padding:"8px 9px",color:T.text3}}>{r.specialization||"—"}</td>
                        <td style={{padding:"8px 9px",textAlign:"center",fontFamily:T.fontMono}}>{r.graduation_year}</td>
                        <td style={{padding:"8px 9px",textAlign:"center"}}>{r.gender}</td>
                        <td style={{padding:"8px 9px"}}><span style={{background:ec+"22",color:ec,padding:"2px 7px",borderRadius:20,fontSize:11,fontWeight:600,border:"1px solid "+ec+"40"}}>{r.employment_status||"—"}</span></td>
                        <td style={{padding:"8px 9px"}}>{r.marital_status}</td>
                        <td style={{padding:"8px 9px",direction:"ltr",textAlign:"left",color:T.cyan,fontFamily:T.fontMono,whiteSpace:"nowrap"}}>{r.phone}</td>
                        <td style={{padding:"8px 9px",color:T.text4,fontSize:11,whiteSpace:"nowrap",fontFamily:T.fontMono}}>{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                        <td style={{padding:"8px 9px"}}>
                          {isReadonly
                            ? <span style={{color:T.text4,fontSize:11}}>—</span>
                            : <button onClick={async function(e){e.stopPropagation();if(!window.confirm("هل تريد حذف سجل "+r.full_name+"؟\nلا يمكن التراجع عن هذا الإجراء.")){return;}try{await db.deleteGraduate(r.id);setMembers(function(prev){return prev.filter(function(m){return m.id!==r.id;});});}catch(err){alert("حدث خطأ أثناء الحذف");}}}
                                style={{background:"rgba(248,113,113,.10)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                                <SvgIcon d={P.trash} size={12} color={T.danger}/> حذف
                              </button>
                          }
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && <tr><td colSpan={13} style={{padding:36,textAlign:"center",color:T.text3}}>لا توجد نتائج</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>}

      {/* Duplicates Tab */}
      {tab==="dups" && (
        <div style={card}>
          <h3 style={{marginBottom:16,color:T.warning,fontSize:16,fontWeight:800}}>التسجيلات المكررة (نفس الاسم)</h3>
          {dupIds.size===0 ? (
            <div style={{textAlign:"center",padding:40,color:T.success,fontSize:15,fontWeight:600}}>لا توجد تسجيلات مكررة</div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"rgba(21,145,220,.10)"}}>
                    {["الاسم","المحافظة","الجامعة","الهاتف","تاريخ التسجيل"].map(h=>(
                      <th key={h} style={{padding:"10px",textAlign:"right",borderBottom:"2px solid "+T.warning+"40",fontWeight:700,color:T.warning}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.filter(r=>dupIds.has(r.id)).map((r,i)=>(
                    <tr key={r.id} style={{borderBottom:"1px solid "+T.border,background:i%2?"rgba(21,145,220,.06)":T.bg2,color:T.text2}}>
                      <td style={{padding:"8px 10px",fontWeight:600,color:T.text}}>{r.full_name}</td>
                      <td style={{padding:"8px 10px"}}>{r.province}</td>
                      <td style={{padding:"8px 10px"}}>{r.university||"—"}</td>
                      <td style={{padding:"8px 10px",direction:"ltr",fontFamily:T.fontMono,color:T.cyan}}>{r.phone}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:T.warning,fontFamily:T.fontMono}}>{new Date(r.created_at).toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Coordinators Management Tab */}
      {tab==="coords" && (
        <div>
          {/* Add Form — full admin only */}
          {!isReadonly && (
            <div style={card}>
              <SectionHeader icon={P.plus} title="إضافة منسق جديد" color={T.cyan}/>
              {coordErr && <div style={{background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,padding:"10px 14px",borderRadius:8,marginBottom:12,fontSize:13}}>{coordErr}</div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:12}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:T.text2,marginBottom:5}}>المحافظة</label>
                  <select value={newCoord.province} onChange={function(e){setNewCoord(function(p){return{...p,province:e.target.value,district:""};});}}
                    style={{...inp(false),marginBottom:0,cursor:"pointer"}}>
                    {PROVINCES.map(function(p){return <option key={p} value={p}>{p}</option>;})}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:T.text2,marginBottom:5}}>القضاء / المدينة</label>
                  <input value={newCoord.district}
                    onChange={function(e){setNewCoord(function(p){return{...p,district:e.target.value};});setCoordErr("");}}
                    placeholder="مثال: بعقوبة" style={{...inp(false),marginBottom:0}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:T.text2,marginBottom:5}}>اسم المنسق</label>
                  <input value={newCoord.name}
                    onChange={function(e){setNewCoord(function(p){return{...p,name:e.target.value};});setCoordErr("");}}
                    placeholder="الاسم الكامل" style={{...inp(false),marginBottom:0}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:T.text2,marginBottom:5}}>رقم الهاتف</label>
                  <input value={newCoord.phone}
                    onChange={function(e){setNewCoord(function(p){return{...p,phone:e.target.value};});setCoordErr("");}}
                    placeholder="07XXXXXXXXX" style={{...inp(false),marginBottom:0,direction:"ltr",textAlign:"right"}}/>
                </div>
              </div>
              <button onClick={addCoord} disabled={coordLoading}
                style={{...btnGold(),display:"flex",alignItems:"center",gap:8,opacity:coordLoading?.6:1}}>
                <SvgIcon d={P.plus} size={16} color={T.bg0} sw={2.4}/>
                {coordLoading?"جاري الإضافة...":"إضافة المنسق"}
              </button>
            </div>
          )}

          {/* Coordinators Table */}
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <SectionHeader icon={P.coord} title={"قائمة المنسقين ("+coords.length+")"} color={T.cyan}/>
              <div style={{display:"flex",gap:8}}>
                <select value={coordSearchProv} onChange={function(e){setCSP(e.target.value);}}
                  style={{...inp(false),marginBottom:0,width:"auto",minWidth:140,cursor:"pointer"}}>
                  <option value="">كل المحافظات</option>
                  {PROVINCES.map(function(p){return <option key={p} value={p}>{p}</option>;})}
                </select>
                <button onClick={loadCoords} style={btn()}>تحديث</button>
              </div>
            </div>
            {coordLoading ? (
              <div style={{textAlign:"center",padding:36,color:T.text3}}>جاري التحميل...</div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{background:T.bg1}}>
                      {["#","المحافظة","القضاء / المدينة","اسم المنسق","رقم الهاتف","تاريخ الإضافة",...(!isReadonly?["حذف"]:[])].map(function(h){
                        return <th key={h} style={{padding:"10px",textAlign:"right",borderBottom:"2px solid "+T.border2,fontWeight:700,color:T.text,whiteSpace:"nowrap"}}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(coordSearchProv ? coords.filter(function(c){return c.province===coordSearchProv;}) : coords)
                      .map(function(c,i){
                        var pc = PROVINCE_COLORS[c.province]||T.cyan;
                        return (
                          <tr key={c.id} style={{borderBottom:"1px solid "+T.border,background:i%2?T.bg1:T.bg2,color:T.text2}}>
                            <td style={{padding:"8px 10px",color:T.text4,fontFamily:T.fontMono}}>{i+1}</td>
                            <td style={{padding:"8px 10px"}}>
                              <span style={{background:pc+"22",color:pc,padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:600,border:"1px solid "+pc+"40"}}>{c.province}</span>
                            </td>
                            <td style={{padding:"8px 10px",fontWeight:600,color:T.text}}>{c.district}</td>
                            <td style={{padding:"8px 10px"}}>{c.name}</td>
                            <td style={{padding:"8px 10px",direction:"ltr",fontFamily:T.fontMono,color:T.cyan}}>{c.phone}</td>
                            <td style={{padding:"8px 10px",color:T.text4,fontSize:11,fontFamily:T.fontMono}}>{new Date(c.created_at).toLocaleDateString("en-GB")}</td>
                            {!isReadonly && (
                              <td style={{padding:"8px 10px"}}>
                                <button onClick={function(){deleteCoord(c.id,c.name);}}
                                  style={{background:"rgba(248,113,113,.10)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                                  <SvgIcon d={P.trash} size={12} color={T.danger}/> حذف
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    {coords.length===0 && <tr><td colSpan={7} style={{padding:36,textAlign:"center",color:T.text3}}>لا توجد منسقون مسجلون</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ticker Management Tab */}
      {tab==="ticker" && (
        <div>
          <div style={card}>
            <SectionHeader icon={P.plus} title="إضافة إشعار جديد" color={T.info}/>
            <div style={{display:"flex",gap:10}}>
              <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTickerMsg()}
                placeholder="اكتب نص الإشعار أو الخبر هنا..."
                style={{...inp(false),flex:1,marginBottom:0}}/>
              <button onClick={addTickerMsg} disabled={tickerLoading||!newMsg.trim()} style={{...btnGold(),padding:"11px 20px",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8,opacity:!newMsg.trim()?0.5:1}}>
                <SvgIcon d={P.plus} size={16} color={T.bg0} sw={2.4}/> إضافة
              </button>
            </div>
            <p style={{color:T.text3,fontSize:12,marginTop:8}}>سيظهر الإشعار على الفور في شريط الأخبار في أعلى الصفحة عند زيارة الموقع</p>
          </div>

          <div style={card}>
            <SectionHeader icon={P.news} title="الإشعارات الحالية" color={T.cyan}/>
            {tickerLoading ? (
              <div style={{textAlign:"center",padding:30,color:T.text3}}>جاري التحميل...</div>
            ) : tickerMsgs.length===0 ? (
              <div style={{textAlign:"center",padding:30,color:T.text3}}>لا توجد إشعارات حالياً</div>
            ) : (
              <div>
                {tickerMsgs.map(function(m){return(
                  <div key={m.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 0",borderBottom:"1px solid "+T.border}}>
                    <div style={{flex:1,color:T.text2,fontSize:14,lineHeight:1.6}}>{m.message}</div>
                    <button onClick={()=>deleteTickerMsg(m.id)} style={{background:"rgba(248,113,113,.10)",border:"1px solid rgba(248,113,113,.40)",color:T.danger,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      <SvgIcon d={P.trash} size={14} color={T.danger}/> حذف
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
      {/* Hero */}
      <div style={{
        ...card,
        background:"linear-gradient(135deg,"+T.bg1+","+T.bg2+" 60%,"+T.bg3+")",
        color:T.text,marginBottom:24,position:"relative",overflow:"hidden",
        padding:"40px 32px",borderRight:"4px solid "+T.cyan
      }}>
        <div style={{
          position:"absolute",inset:0,backgroundImage:BLUEPRINT_BG,backgroundSize:BLUEPRINT_SIZE,opacity:.5,pointerEvents:"none"
        }}/>
        <div style={{position:"relative",textAlign:"center"}}>
          <div style={{
            width:78,height:78,borderRadius:18,
            background:"rgba(21,145,220,.18)",border:"1px solid rgba(21,145,220,.45)",
            margin:"0 auto 18px",display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 8px 28px rgba(9,60,93,.12),0 0 36px rgba(21,145,220,.22)"
          }}>
            <SvgIcon d={P.compass} size={38} color={T.cyan} sw={1.7}/>
          </div>
          <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"2px",marginBottom:8,textTransform:"uppercase",fontFamily:T.fontMono}}>
            عن المنصة
          </div>
          <h1 style={{fontSize:"clamp(22px,3.5vw,32px)",marginBottom:16,fontWeight:900,letterSpacing:"-.3px",lineHeight:1.3,color:T.text}}>
            المنصة الوطنية لمهندسي العراق<br/>
            <span style={{color:T.cyan}}>غير المعينين</span>
          </h1>
          <div style={{width:60,height:2,background:T.cyan,margin:"0 auto 18px",boxShadow:"0 0 12px "+T.cyan}}/>
          <p style={{fontSize:15,color:T.text2,maxWidth:680,margin:"0 auto",lineHeight:2}}>
            منصة إلكترونية مستقلة تجمع خريجي كليات الهندسة العراقية من الباحثين عن فرص التعيين والعمل،
            وتعمل صوتاً موحّداً يعكس حجم الطاقات الهندسية الشابة غير المستغلة في العراق.
          </p>
        </div>
      </div>

      {/* The Story */}
      <div style={{...card,padding:"32px 28px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
          <div style={{
            width:44,height:44,borderRadius:10,background:T.cyan+"18",
            border:"1px solid "+T.cyan+"45",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0
          }}>
            <SvgIcon d={P.voice} size={22} color={T.cyan}/>
          </div>
          <div>
            <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"1.5px",marginBottom:4,textTransform:"uppercase",fontFamily:T.fontMono}}>القصة</div>
            <h2 style={{fontSize:20,fontWeight:800,color:T.text,margin:0,letterSpacing:"-.2px"}}>لماذا أُسّست المنصة؟</h2>
          </div>
        </div>
        <p style={{color:T.text2,fontSize:15,lineHeight:2.1,margin:0}}>
          تأسّست المنصة لتكون <strong style={{color:T.cyan}}>صوتاً موحّداً</strong> يعكس حجم الطاقات الهندسية الشابة غير المستغلة في العراق،
          وتعمل كحلقة وصل مباشرة بين المهندس الخريج وصنّاع القرار. آلاف الكفاءات الهندسية تنتظر فرصة التعيين والمشاركة في مشاريع البناء الوطني،
          ودون أرشفة دقيقة وإحصاء رسمي يبقى صوتهم مشتّتاً وحقوقهم منسيّة.
        </p>
      </div>

      {/* Mission + Vision + Goal Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18,marginBottom:20}}>
        {[
          {icon:P.target,      title:"رسالتنا",  color:T.info,    text:"بناء قاعدة بيانات وطنية رسمية للمهندسين العراقيين الباحثين عن فرص التعيين، تكون مرجعاً موثوقاً للجهات الحكومية والمؤسسات التنموية."},
          {icon:P.voice,       title:"رؤيتنا",   color:T.cyan,    text:"أن نكون الصوت الجماعي للمهندسين العراقيين، ومنصّتهم الموحّدة في المطالبة بحقوقهم المهنية على المستوى الوطني."},
          {icon:P.spark,       title:"أهدافنا",  color:T.warning, text:"أرشفة الكفاءات الهندسية رسمياً، رصد نسب البطالة بين المهندسين، وتقديم تقارير موثوقة للجهات المعنية وصنّاع القرار."},
          {icon:P.shieldCheck, title:"الخصوصية", color:T.success, text:"نلتزم بحماية بيانات المهندسين وسريّتها التامة. لا تُشارك أي بيانات شخصية مع جهات خارجية دون موافقة صريحة."},
        ].map(function({icon,title,text,color}){return(
          <div key={title} style={{
            ...card,marginBottom:0,borderTop:"3px solid "+color,padding:"24px 22px"
          }}>
            <div style={{
              width:48,height:48,borderRadius:12,background:color+"18",
              border:"1px solid "+color+"40",
              display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16
            }}>
              <SvgIcon d={icon} size={24} color={color}/>
            </div>
            <h3 style={{marginBottom:10,color:T.text,fontSize:16,fontWeight:800}}>{title}</h3>
            <p style={{color:T.text2,lineHeight:2,fontSize:13.5,margin:0}}>{text}</p>
          </div>
        );})}
      </div>

      {/* Goal Banner */}
      <div style={{
        background:"linear-gradient(135deg,"+T.bg1+","+T.bg2+")",
        border:"1px solid "+T.border2,
        borderRadius:T.radiusLg,padding:"32px 28px",
        position:"relative",overflow:"hidden",
        borderRight:"4px solid "+T.cyan,marginBottom:20
      }}>
        <div style={{
          position:"absolute",top:-40,left:-40,width:240,height:240,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(21,145,220,.18),transparent 70%)",pointerEvents:"none"
        }}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"2px",marginBottom:8,textTransform:"uppercase",fontFamily:T.fontMono}}>الهدف الأساسي</div>
          <h3 style={{color:T.text,fontSize:20,fontWeight:800,marginBottom:14,lineHeight:1.5}}>
            أرشفة وإحصاء كفاءات الهندسة العراقية رسمياً
          </h3>
          <p style={{color:T.text2,fontSize:14,lineHeight:2,margin:0}}>
            لتسهيل المطالبة بحقوق المهندسين في التعيينات المركزية والمشاريع التنموية،
            وضمان عدم تجاهل أي طاقة هندسية شابة في خطط الدولة الاقتصادية والتنموية.
          </p>
        </div>
      </div>

      {/* Contact */}
      <div style={{...card,textAlign:"center",padding:"30px 24px"}}>
        <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"2px",marginBottom:6,textTransform:"uppercase",fontFamily:T.fontMono}}>تواصل</div>
        <h3 style={{marginBottom:12,color:T.text,fontSize:18,fontWeight:800}}>للاستفسار والتواصل</h3>
        <p style={{color:T.text3,marginBottom:18,fontSize:14,maxWidth:480,margin:"0 auto 18px",lineHeight:1.9}}>
          لأي استفسار حول التسجيل أو خدمات المنصة، تواصل عبر منسق محافظتك أو زر الموقع الرسمي:
        </p>
        <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{
            background:T.cyan+"14",color:T.cyan,padding:"10px 22px",
            borderRadius:30,fontSize:13,fontWeight:700,
            border:"1px solid "+T.cyan+"40",fontFamily:T.fontMono,letterSpacing:".3px"
          }}>iraq-graduates.vercel.app</span>
        </div>
      </div>
    </div>
  );
}

// ── Privacy Page ──────────────────────────────────────────────────────
function PrivacyPage() {
  var sections = [
    {title:"1. جمع المعلومات",text:"نجمع المعلومات التي يقدمها المهندس طوعاً عند التسجيل، وتشمل: الاسم الكامل، المحافظة، القضاء، الجامعة، الكلية/القسم، التخصص الهندسي، سنة التخرج، الجنس، الوضع الوظيفي، والحالة الاجتماعية. رقم الهاتف يُستخدم كمعرّف فريد لمنع التكرار."},
    {title:"2. استخدام المعلومات",text:"تُستخدم البيانات لأغراض إحصائية ومناصرة حقوق المهندسين العراقيين حصراً. نعرض إحصائيات مجمعة لا تكشف عن هويات الأفراد. رقم الهاتف لا يظهر في الواجهة العامة أبداً."},
    {title:"3. حماية البيانات",text:"يتم تخزين البيانات بأمان على خوادم مشفّرة بمعايير دولية مع ضوابط وصول صارمة. نطبّق أفضل ممارسات أمن المعلومات لحماية بيانات المهندسين من أي وصول غير مصرّح به."},
    {title:"4. مشاركة البيانات",text:"لا نبيع أو نؤجر أو نشارك المعلومات الشخصية مع أطراف ثالثة. قد تُشارك إحصائيات مجمّعة وغير شخصية مع جهات بحثية أو حكومية لأغراض المطالبة بحقوق المهندسين والتخطيط الوطني فقط."},
    {title:"5. حقوقك",text:"يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت. للتواصل حول بياناتك، يرجى مراسلتنا عبر صفحة \"عن المنصة\" أو منسق محافظتك."},
    {title:"6. التعديلات",text:"قد نُحدّث هذه السياسة من وقت لآخر. سيتم إشعار المهندسين المسجّلين بأي تغييرات جوهرية عبر الموقع الإلكتروني وشريط الإشعارات."},
  ];
  return (
    <div style={pageWrap}>
      <div style={{
        ...card,
        background:"linear-gradient(135deg,"+T.bg1+","+T.bg2+")",
        color:T.text,textAlign:"center",marginBottom:20,position:"relative",overflow:"hidden",
        padding:"36px 28px",borderRight:"4px solid "+T.cyan
      }}>
        <div style={{position:"absolute",inset:0,backgroundImage:BLUEPRINT_BG,backgroundSize:BLUEPRINT_SIZE,opacity:.5,pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{
            width:64,height:64,borderRadius:16,
            background:"rgba(21,145,220,.18)",border:"1px solid rgba(21,145,220,.45)",
            margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 0 28px rgba(21,145,220,.22)"
          }}>
            <SvgIcon d={P.shieldCheck} size={30} color={T.cyan}/>
          </div>
          <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"2px",marginBottom:6,textTransform:"uppercase",fontFamily:T.fontMono}}>الخصوصية</div>
          <h1 style={{fontSize:24,marginBottom:8,fontWeight:900,letterSpacing:"-.2px",color:T.text}}>سياسة خصوصية المهندسين</h1>
          <p style={{color:T.text3,fontSize:12,fontFamily:T.fontMono}}>آخر تحديث: {new Date().toLocaleDateString("en-GB")}</p>
        </div>
      </div>
      <div style={card}>
        <p style={{color:T.text2,lineHeight:2.1,marginBottom:24,fontSize:14.5,borderBottom:"1px solid "+T.border,paddingBottom:22}}>
          تصف هذه السياسة كيف تجمع <strong style={{color:T.cyan}}>المنصة الوطنية لمهندسي العراق غير المعينين</strong> بياناتكم وتستخدمها وتحميها. باستخدام هذا الموقع، فإنكم توافقون على الشروط المذكورة أدناه.
        </p>
        {sections.map(function({title,text},i){return(
          <div key={title} style={{marginBottom:20,paddingBottom:20,borderBottom:i<sections.length-1?"1px solid "+T.border:"none"}}>
            <h3 style={{color:T.text,marginBottom:10,fontSize:15.5,fontWeight:800}}>{title}</h3>
            <p style={{color:T.text2,lineHeight:2.1,margin:0,fontSize:14}}>{text}</p>
          </div>
        );})}
      </div>
    </div>
  );
}

// COORDINATORS removed — data is now fetched from Supabase coordinators table

var PROVINCE_COLORS = {
  "ديالى":        "#0d9488",
  "بغداد":        "#1d4ed8",
  "البصرة":       "#7c3aed",
  "نينوى":        "#d97706",
  "كركوك":        "#dc2626",
  "الأنبار":      "#059669",
  "بابل":         "#0369a1",
  "كربلاء":       "#9333ea",
  "النجف":        "#b45309",
  "واسط":         "#0891b2",
  "ذي قار":       "#16a34a",
  "ميسان":        "#ca8a04",
  "المثنى":       "#4f46e5",
  "القادسية":     "#be185d",
  "صلاح الدين":   "#15803d",
  "دهوك":         "#7c3aed",
  "أربيل":        "#ea580c",
  "السليمانية":   "#0f766e",
};

// ── Coordinators Page ─────────────────────────────────────────────────
function CoordinatorsPage() {
  var [allCoords,  setAllCoords] = useState([]);
  var [loadingDB,  setLoadingDB] = useState(true);
  var [selProv,    setSelProv]   = useState("ديالى");
  var [search,     setSearch]    = useState("");

  useEffect(function(){
    setLoadingDB(true);
    db.getCoordinators()
      .then(function(data){ setAllCoords(data); })
      .catch(function(){ setAllCoords([]); })
      .finally(function(){ setLoadingDB(false); });
  }, []);

  var activeProvinces = useMemo(function(){
    var set = new Set(allCoords.map(function(c){return c.province;}));
    return PROVINCES.filter(function(p){return set.has(p);});
  }, [allCoords]);

  var list = useMemo(function(){
    return allCoords.filter(function(c){return c.province===selProv;});
  }, [allCoords, selProv]);

  var filtered = useMemo(function(){
    if(!search.trim()) return list;
    var q = search.trim();
    return list.filter(function(c){
      return c.name.includes(q)||c.district.includes(q)||c.phone.includes(q);
    });
  }, [list, search]);

  var col     = PROVINCE_COLORS[selProv] || T.cyan;
  var isEmpty = !loadingDB && list.length === 0;

  if(loadingDB) return (
    <div style={{textAlign:"center",padding:"80px 20px",color:T.text3}}>
      <div style={{fontSize:15,color:T.text2}}>جاري تحميل بيانات المنسقين...</div>
    </div>
  );

  return (
    <div style={pageWrap}>
      {/* Header */}
      <div style={{
        ...card,
        background:"linear-gradient(135deg,"+T.bg1+","+T.bg2+" 60%,"+T.bg3+")",
        color:T.text,textAlign:"center",marginBottom:20,position:"relative",overflow:"hidden",
        padding:"38px 28px",borderRight:"4px solid "+T.cyan
      }}>
        <div style={{position:"absolute",inset:0,backgroundImage:BLUEPRINT_BG,backgroundSize:BLUEPRINT_SIZE,opacity:.5,pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{
            width:72,height:72,borderRadius:18,
            background:"rgba(21,145,220,.18)",border:"1px solid rgba(21,145,220,.45)",
            margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 8px 24px rgba(9,60,93,.12),0 0 32px rgba(21,145,220,.20)"
          }}>
            <SvgIcon d={P.coord} size={34} color={T.cyan}/>
          </div>
          <div style={{fontSize:11,color:T.cyan,fontWeight:700,letterSpacing:"2px",marginBottom:8,textTransform:"uppercase",fontFamily:T.fontMono}}>الشبكة الميدانية</div>
          <h1 style={{fontSize:24,marginBottom:10,fontWeight:900,letterSpacing:"-.2px",color:T.text}}>منسقو المهندسين في المحافظات</h1>
          <p style={{color:T.text2,fontSize:14,maxWidth:600,margin:"0 auto 18px",lineHeight:1.9}}>
            اختر محافظتك للتواصل المباشر مع المنسق المسؤول عن قضائك والانضمام إلى شبكة مهندسي منطقتك.
          </p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <span style={{
              background:"rgba(21,145,220,.18)",border:"1px solid rgba(21,145,220,.40)",
              color:T.cyan,borderRadius:20,padding:"5px 16px",fontSize:12.5,fontWeight:700,
              fontFamily:T.fontMono,letterSpacing:".3px"
            }}>
              {allCoords.length} منسق مسجّل
            </span>
            <span style={{
              background:"rgba(255,255,255,.06)",border:"1px solid "+T.border2,
              color:T.text2,borderRadius:20,padding:"5px 16px",fontSize:12.5,fontWeight:700,
              fontFamily:T.fontMono,letterSpacing:".3px"
            }}>
              {activeProvinces.length} / {PROVINCES.length} محافظة مفعّلة
            </span>
          </div>
        </div>
      </div>

      {/* Province Selector */}
      <div style={{...card,padding:"18px 20px",marginBottom:16}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:"1 1 220px"}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:T.text2,marginBottom:6}}>اختر المحافظة</label>
            <div style={{position:"relative"}}>
              <select value={selProv} onChange={function(e){setSelProv(e.target.value);setSearch("");}}
                style={{...inp(false),marginBottom:0,paddingRight:36,cursor:"pointer",borderColor:col,fontWeight:700,color:T.text}}>
                {PROVINCES.map(function(p){
                  var cnt = allCoords.filter(function(c){return c.province===p;}).length;
                  return (
                    <option key={p} value={p}>
                      {cnt>0?"✓ ":"○ "}{p}{cnt>0?" ("+cnt+")":"  — قريباً"}
                    </option>
                  );
                })}
              </select>
              <div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <SvgIcon d={P.map} size={12} color={T.bg0}/>
                </div>
              </div>
            </div>
          </div>
          {!isEmpty && (
            <div style={{flex:"1 1 220px"}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,color:T.text2,marginBottom:6}}>بحث في المنسقين</label>
              <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg1,border:"1.5px solid "+T.border2,borderRadius:10,padding:"0 12px"}}>
                <SvgIcon d={P.search} size={15} color={T.text3}/>
                <input value={search} onChange={function(e){setSearch(e.target.value);}}
                  placeholder="اسم أو قضاء أو هاتف..."
                  style={{border:"none",outline:"none",background:"transparent",flex:1,padding:"11px 0",fontSize:14,color:T.text,fontFamily:T.font}}/>
                {search && <button onClick={function(){setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:T.text3,padding:"4px",fontSize:16,lineHeight:1}}>×</button>}
              </div>
            </div>
          )}
        </div>
        {/* Active province pills */}
        {activeProvinces.length>0 && (
          <div style={{marginTop:14,display:"flex",gap:6,flexWrap:"wrap"}}>
            {activeProvinces.map(function(p){
              var c=PROVINCE_COLORS[p]||T.cyan;
              var cnt=allCoords.filter(function(x){return x.province===p;}).length;
              var active=selProv===p;
              return (
                <button key={p} onClick={function(){setSelProv(p);setSearch("");}}
                  style={{padding:"5px 14px",borderRadius:20,border:"1.5px solid "+(active?c:T.border2),
                    background:active?c+"22":T.bg2,color:active?c:T.text3,
                    fontWeight:active?700:500,fontSize:12,cursor:"pointer",fontFamily:T.font,transition:"all .15s"}}>
                  {p} <span style={{opacity:.7}}>({cnt})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Province Label */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{width:4,height:28,borderRadius:2,background:col,boxShadow:"0 0 12px "+col}}/>
        <h2 style={{fontSize:17,fontWeight:700,color:T.text,margin:0}}>محافظة {selProv}</h2>
        {!isEmpty && (
          <span style={{background:col+"22",color:col,borderRadius:20,padding:"3px 12px",fontSize:12,fontWeight:700,border:"1px solid "+col+"40"}}>
            {filtered.length} منسق
          </span>
        )}
      </div>

      {isEmpty ? (
        <div style={{...card,textAlign:"center",padding:"56px 24px"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:T.bg3,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <SvgIcon d={P.coord} size={30} color={T.text3}/>
          </div>
          <h3 style={{color:T.text2,marginBottom:8,fontSize:17,fontWeight:700}}>لم يُضف منسقو محافظة {selProv} بعد</h3>
          <p style={{color:T.text3,fontSize:13,margin:0}}>سيتم إضافة المنسقين قريباً — تابع الموقع للتحديثات</p>
        </div>
      ) : filtered.length===0 ? (
        <div style={{...card,textAlign:"center",padding:"40px 24px",color:T.text3}}>لا توجد نتائج مطابقة للبحث</div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {filtered.map(function(c,i){
            return (
              <div key={c.id||i} style={{background:T.bg2,borderRadius:16,padding:"20px",boxShadow:T.shadow,border:"1px solid "+T.border2,borderTop:"4px solid "+col,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:50,height:50,borderRadius:"50%",background:col+"22",border:"1px solid "+col+"50",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:20,fontWeight:800,color:col}}>{c.name.trim()[0]}</span>
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:T.text,lineHeight:1.3}}>{c.name}</div>
                    <div style={{fontSize:12,color:T.text3,marginTop:3,display:"flex",alignItems:"center",gap:5}}>
                      <SvgIcon d={P.map} size={12} color={T.text4}/>
                      {c.district}
                    </div>
                  </div>
                </div>
                <div style={{background:col+"14",border:"1px solid "+col+"30",borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                  <SvgIcon d={P.map} size={15} color={col}/>
                  <span style={{fontSize:13,color:col,fontWeight:600}}>منسق {c.district}</span>
                </div>
                <a href={"tel:"+c.phone} style={{textDecoration:"none"}}>
                  <div style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.30)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                    <span style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:T.success,direction:"ltr"}}>{c.phone}</span>
                    <div style={{width:32,height:32,borderRadius:"50%",background:T.success,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <SvgIcon d={P.phone} size={16} color={T.bg0}/>
                    </div>
                  </div>
                </a>
                <a href={"tel:"+c.phone} style={{textDecoration:"none"}}>
                  <button style={{
                    background:"linear-gradient(135deg,"+T.success+","+T.success+"dd)",
                    color:T.bg0,border:"none",padding:"10px",borderRadius:T.radius,
                    fontSize:13,fontWeight:800,cursor:"pointer",
                    boxShadow:"0 4px 14px rgba(74,222,128,.30)",
                    transition:"transform .15s",fontFamily:T.font,
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8
                  }}>
                    <SvgIcon d={P.phone} size={16} color={T.bg0}/>اتصل الآن
                  </button>
                </a>
              </div>
            );
          })}
        </div>
      )}

      <div style={{textAlign:"center",marginTop:28,color:T.text3,fontSize:12.5,padding:"14px",lineHeight:1.9}}>
        للانضمام إلى شبكة مهندسي محافظتك، تواصل مباشرةً مع المنسق المسؤول عن منطقتك
      </div>
    </div>
  );
}

// ── Print / Download Helpers ──────────────────────────────────────────
function fmtBirthDate(bd) {
  if(!bd) return {day:"......",month:"......",year:"............"};
  var s = bd.includes("-")
    ? (function(){ var p=bd.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; })()
    : bd;
  var parts = s.split("/");
  return {day:parts[0]||"....",month:parts[1]||"....",year:parts[2]||"............"};
}

function openPrintWindow(html, filename) {
  var blob = new Blob([html], {type:"text/html;charset=utf-8"});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement("a");
  a.href   = url;
  a.download = (filename||"استمارة")+".html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 10000);
}

function openRegistrationPrint(data) {
  var bd = fmtBirthDate(data.birth_date||"");
  var esc = function(v){ return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
  var n   = esc(data.full_name);
  var uni = esc(data.university);
  var dep = esc(data.department);
  var spc = esc(data.specialization||data.department);
  var prov= esc(data.province);
  var sub = esc(data.sub_district);
  var mar = esc(data.marital_status);
  var yr  = esc(data.graduation_year);
  var ph  = esc(data.phone);

  var html = [
    '<!DOCTYPE html><html lang="ar" dir="rtl">',
    '<head><meta charset="UTF-8">',
    '<title>استمارة تسجيل</title>',
    '<style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:"Traditional Arabic","Arial",sans-serif;background:#ddd5be;',
    'min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:24px;direction:rtl}',
    '.pbtn{margin-bottom:16px;padding:10px 32px;background:#1d4ed8;color:#fff;border:none;',
    'border-radius:8px;font-size:15px;cursor:pointer;font-family:inherit}',
    '.page{width:700px;background:#f5efd8;border:7px double #8b7044;',
    'box-shadow:inset 0 0 0 4px #c9a84c,0 8px 40px rgba(0,0,0,.25);overflow:hidden}',
    '.inner{border:2px solid #c9a84c;margin:8px;overflow:hidden}',
    '.hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 6px}',
    '.ht{font-size:18px;font-weight:bold;color:#1a1505;line-height:1.6;text-align:center}',
    '.hl{font-size:68px;line-height:1;text-align:center}',
    '.rib{background:linear-gradient(to bottom,#111,#2a2a2a);padding:5px 0;text-align:center;',
    'border-top:2.5px solid #c9a84c;border-bottom:2.5px solid #c9a84c;',
    'color:#c9a84c;font-size:13px;letter-spacing:3px}',
    '.bd{padding:14px 26px}',
    '.row{display:flex;align-items:baseline;padding:8px 0 4px;',
    'border-bottom:1.5px dashed #9a8060;margin-bottom:4px;gap:10px;min-height:36px}',
    '.lb{font-size:16px;font-weight:bold;color:#1a1505;white-space:nowrap;flex-shrink:0}',
    '.vl{flex:1;font-size:16px;color:#1a1505;text-align:right}',
    '.r2{display:flex;gap:18px;padding:8px 0 4px;border-bottom:1.5px dashed #9a8060;',
    'margin-bottom:4px;min-height:36px;align-items:baseline}',
    '.plg{text-align:center;font-size:15px;font-weight:bold;color:#1a1505;',
    'padding:10px 0;border-bottom:1.5px dashed #9a8060;margin:4px 0}',
    '.btm{background:linear-gradient(to bottom,#111,#222);color:#c9a84c;text-align:center;',
    'padding:18px 20px;font-size:18px;font-weight:bold;border-top:3px solid #c9a84c;line-height:1.7}',
    '@media print{body{background:#fff;padding:0}.pbtn{display:none}',
    '.page{width:100%;box-shadow:none;border:6px double #8b7044}}',
    '</style></head><body>',
    '<button class="pbtn" onclick="window.print()">&#128424; طباعة / حفظ كـ PDF</button>',
    '<div class="page"><div class="inner">',
    '<div class="hdr">',
    '<div class="ht">استمارة تسجيل<br>مهندس</div>',
    '<div class="hl">&#9881;</div>',
    '<div class="ht">القائمة الوطنية<br>للمهندسين</div>',
    '</div>',
    '<div class="rib">&#8213; المنصة الوطنية لمهندسي العراق غير المعينين &#8213;</div>',
    '<div class="bd">',
    '<div class="row"><span class="lb">الاسم الثلاثي واللقب:</span><span class="vl">'+n+'</span></div>',
    '<div class="r2">',
    '<span class="lb">المواليد &mdash; اليوم: </span><b style="font-size:16px">'+bd.day+'</b>',
    '<span class="lb">&nbsp;&nbsp;الشهر: </span><b style="font-size:16px">'+bd.month+'</b>',
    '<span class="lb">&nbsp;&nbsp;السنة: </span><b style="font-size:16px">'+bd.year+'</b>',
    '</div>',
    '<div class="r2">',
    '<div style="flex:1;display:flex;gap:8px;align-items:baseline"><span class="lb">المحافظة:</span><span style="font-size:16px;font-weight:bold">'+prov+'</span></div>',
    '<div style="flex:1;display:flex;gap:8px;align-items:baseline"><span class="lb">القضاء:</span><span style="font-size:16px;font-weight:bold">'+sub+'</span></div>',
    '</div>',
    '<div class="row"><span class="lb">الحالة الاجتماعية:</span><span class="vl">'+mar+'</span></div>',
    '<div class="row" style="flex-direction:column;align-items:flex-start;gap:6px">',
    '<span class="lb">التحصيل الدراسي:</span>',
    '<span style="font-size:15px;padding-right:10px">'+uni+(dep?' &mdash; '+dep:'')+'</span>',
    '<div style="display:flex;gap:28px;font-size:16px;font-weight:bold;padding-right:10px">',
    '<span>&#9745; جامعة</span><span>&#9744; معهد</span></div>',
    '</div>',
    '<div class="row"><span class="lb">الاختصاص:</span><span class="vl">'+spc+'</span></div>',
    '<div class="row"><span class="lb">سنة التخرج:</span><span class="vl">'+yr+'</span></div>',
    '<div class="row"><span class="lb">رقم الهاتف:</span><span class="vl" style="direction:ltr;text-align:left">'+ph+'</span></div>',
    '<div class="plg">اتعهد بأن جميع المعلومات صحيحة</div>',
    '<div class="row"><span class="lb">التوقيع:</span><span class="vl"></span></div>',
    '<div class="row"><span class="lb">التاريخ:</span><span class="vl" style="direction:ltr;text-align:left">______ / ______ / 2026</span></div>',
    '<div class="row" style="margin-bottom:12px"><span class="lb">ملاحظة//:</span><span class="vl"></span></div>',
    '</div>',
    '<div class="btm">تسلم بيد الممثل او أعضاء اللجنة التنسيقية المعرفين حصرا</div>',
    '</div></div></body></html>'
  ].join("");
  openPrintWindow(html, "استمارة-تسجيل-"+((data.full_name||"").split(" ")[0]));
}

function openAuthorizationPrint(data) {
  var esc = function(v){ return String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
  var n   = esc(data.full_name);
  var html = [
    '<!DOCTYPE html><html lang="ar" dir="rtl">',
    '<head><meta charset="UTF-8"><title>استمارة تخويل</title>',
    '<style>',
    '*{margin:0;padding:0;box-sizing:border-box}',
    'body{font-family:"Traditional Arabic","Arial",sans-serif;background:#f0ebe0;',
    'display:flex;flex-direction:column;align-items:center;padding:28px;direction:rtl}',
    '.pbtn{margin-bottom:18px;padding:10px 32px;background:#7c3aed;color:#fff;border:none;',
    'border-radius:8px;font-size:15px;cursor:pointer;font-family:inherit}',
    '.page{width:700px;background:#fff;border:3px solid #8b7044;padding:52px 60px;',
    'line-height:2.2;font-size:17px;color:#1a1a1a;box-shadow:0 4px 28px rgba(0,0,0,.12)}',
    '.bsm{text-align:center;font-size:22px;font-weight:bold;margin-bottom:36px;color:#1a1505}',
    '.subj{font-size:18px;font-weight:bold;text-decoration:underline;margin-bottom:24px;color:#1a1505}',
    '.para{text-align:justify;margin-bottom:20px;line-height:2.3}',
    '.sr{display:flex;align-items:baseline;margin:18px 0;gap:8px}',
    '.sl{font-weight:bold;white-space:nowrap;color:#1a1505}',
    '.dt{flex:1;border-bottom:1.5px solid #555;margin:0 8px 3px}',
    '.nf{font-size:18px;font-weight:bold;color:#0f2c54;padding:0 14px}',
    '.stamp{margin-top:36px;border:1.5px dashed #8b7044;border-radius:10px;',
    'padding:18px;text-align:center;color:#8b7044;font-size:14px}',
    '@media print{body{background:#fff;padding:0}.pbtn{display:none}',
    '.page{box-shadow:none;width:100%}}',
    '</style></head><body>',
    '<button class="pbtn" onclick="window.print()">&#128424; طباعة / حفظ كـ PDF</button>',
    '<div class="page">',
    '<div class="bsm">بسم الله الرحمن الرحيم</div>',
    '<div class="subj">م/ تخويل</div>',
    '<p class="para">أنا الموقع أدناه</p>',
    '<div class="sr"><span class="sl">المهندس:</span><span class="nf">'+n+'</span><span class="dt"></span></div>',
    '<p class="para" style="margin-top:18px">أخوّل بموجب هذا التخويل</p>',
    '<div class="sr"><span class="sl">الأستاذ:</span><span class="dt"></span></div>',
    '<p class="para" style="margin-top:20px">',
    'بتمثيلي والمطالبة بحقوق المهندسين العراقيين غير المعينين في جمهورية العراق والمحافظة، ',
    '<span style="display:inline-block;width:120px;border-bottom:1.5px solid #555;vertical-align:bottom"></span> ',
    'ومتابعة جميع الأمور المتعلقة بهذا الشأن أمام الجهات المختصة، ',
    'واتخاذ ما يلزم من إجراءات قانونية وإدارية بما يخدم مطالب المهندسين في التعيينات المركزية والمشاريع التنموية.',
    '</p>',
    '<p class="para">ويُعمل بهذا التخويل من تاريخ تحريره.</p>',
    '<div style="margin-top:40px">',
    '<div class="sr"><span class="sl">الاسم:</span><span class="dt"></span></div>',
    '<div class="sr"><span class="sl">التوقيع:</span><span class="dt"></span></div>',
    '<div class="sr"><span class="sl">التاريخ:</span>',
    '<span style="margin:0 10px;font-size:17px">........ / ........ / .............</span></div>',
    '</div>',
    '<div class="stamp">مكان الختم الرسمي</div>',
    '</div></body></html>'
  ].join("");
  openPrintWindow(html, "استمارة-تخويل-"+((data.full_name||"").split(" ")[0]));
}

// ── Download Buttons Component ─────────────────────────────────────────
function DownloadButtons({data}) {
  return (
    <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:20}}>
      <button
        onClick={function(){openRegistrationPrint(data);}}
        style={{background:"linear-gradient(135deg,#1591DC,#2C5EAD)",color:"#fff",border:"none",padding:"12px 24px",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(21,145,220,.40)"}}>
        <SvgIcon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={18} color="#fff"/>
        استمارة التسجيل
      </button>
      <button
        onClick={function(){openAuthorizationPrint(data);}}
        style={{background:"linear-gradient(135deg,#093C5D,#2C5EAD)",color:"#fff",border:"none",padding:"12px 24px",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(9,60,93,.40)"}}>
        <SvgIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" size={18} color="#fff"/>
        استمارة التخويل
      </button>
    </div>
  );
}

// ── Home Page — Engineering Blueprint ─────────────────────────────────
function HomePage({setPage, openSearch}) {
  var [stats, setStats]   = useState(null);
  var [hover,  setHover]  = useState("");

  useEffect(function(){
    db.getStats().then(setStats).catch(function(){});
  }, []);

  var total      = stats ? parseInt(stats.total)||0    : null;
  var unemployed = stats ? Math.max(0,(parseInt(stats.total)||0) - (parseInt(stats.employed)||0)) : null;
  var provinces  = stats ? (stats.by_province||[]).length : null;

  var featureCards = [
    {
      k:"register", num:"01", icon:P.edit,
      title:"سجّل اسمك في القائمة الوطنية",
      desc:"أضف بياناتك إلى الأرشيف الرسمي لمهندسي العراق غير المعينين. التسجيل مجاني وسري ولا يستغرق سوى دقيقتين.",
      cta:"ابدأ التسجيل الآن",
    },
    {
      k:"dashboard", num:"02", icon:P.chart,
      title:"الأرقام والإحصائيات",
      desc:"اطّلع على الحجم الحقيقي للكفاءات الهندسية غير المستثمرة في العراق — موزّعة حسب المحافظة والتخصص وسنة التخرج.",
      cta:"عرض الإحصائيات",
    },
    {
      k:"coordinators", num:"03", icon:P.coord,
      title:"منسقو المحافظات",
      desc:"تواصل مع المنسق المسؤول عن محافظتك للانضمام إلى مجموعة مهندسي منطقتك ومتابعة المستجدات.",
      cta:"اعثر على منسقك",
    },
    {
      k:"about", num:"04", icon:P.voice,
      title:"رسالتنا وأهدافنا",
      desc:"تعرّف على مهمة المنصة كصوت موحّد للمهندسين العراقيين، وحلقة وصل بين الخريج وصناع القرار.",
      cta:"اقرأ عن المنصة",
    },
  ];

  var quickStats = [
    {label:"مهندس مسجّل",            spec:"REG-01",  val:total,      icon:P.users},
    {label:"بانتظار التعيين",         spec:"WAIT-02", val:unemployed, icon:P.briefcase},
    {label:"محافظة مفعّلة",           spec:"PROV-03", val:provinces,  icon:P.map},
  ];

  return (
    <div style={{direction:"rtl",fontFamily:T.font,background:T.bg0,color:T.text}}>

      {/* ── HERO — Blueprint paper with sky accent ── */}
      <div style={{
        position:"relative",overflow:"hidden",
        background:"radial-gradient(ellipse at top right,"+T.bg4+" 0%,"+T.bg0+" 55%)",
        borderBottom:"1px solid "+T.border
      }}>
        {/* Subtle iso grid */}
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:ISO_GRID,backgroundSize:ISO_GRID_SIZE,
          opacity:.8,pointerEvents:"none"
        }}/>
        {/* Cyan glow top-right */}
        <div style={{
          position:"absolute",top:"-200px",left:"-100px",width:600,height:600,
          background:"radial-gradient(circle,rgba(21,145,220,.10) 0%,transparent 65%)",
          pointerEvents:"none"
        }}/>
        {/* Diagonal cyan accent stripe */}
        <div style={{
          position:"absolute",top:0,right:0,width:"40%",height:3,
          background:"linear-gradient(90deg,transparent,"+T.cyan+")",
          pointerEvents:"none"
        }}/>

        <div style={{
          maxWidth:1240,margin:"0 auto",padding:"64px 24px 80px",
          display:"grid",
          gridTemplateColumns:"minmax(0,1fr) auto",
          alignItems:"center",gap:56,position:"relative"
        }}>
          {/* LEFT — Editorial text block */}
          <div style={{maxWidth:700,minWidth:0,animation:"fade-up .6s ease-out"}}>
            {/* Spec line */}
            <div style={{
              display:"flex",alignItems:"center",gap:14,marginBottom:30,
              fontFamily:T.fontMono,fontSize:11,color:T.text3,letterSpacing:"1.5px"
            }}>
              <span style={{
                display:"inline-flex",alignItems:"center",gap:6,
                color:T.cyan,fontWeight:700
              }}>
                <span style={{
                  width:8,height:8,borderRadius:"50%",background:T.cyan,
                  boxShadow:"0 0 12px "+T.cyan,animation:"pulse-cyan 2s ease-out infinite"
                }}/>
                LIVE
              </span>
              <span style={{flex:1,height:1,background:T.border2}}/>
              <span>DOC-001 / IQ-ENG-2026</span>
            </div>

            {/* Big display title — Tajawal Black */}
            <h1 style={{
              fontFamily:T.fontDisp,
              color:T.text,
              fontSize:"clamp(36px,6.4vw,72px)",
              fontWeight:900,
              lineHeight:1.05,
              letterSpacing:"-1.5px",
              marginBottom:24
            }}>
              المنصّة الوطنيّة <br/>
              <span style={{
                background:"linear-gradient(135deg,"+T.cyanLt+","+T.cyan+")",
                WebkitBackgroundClip:"text",
                WebkitTextFillColor:"transparent",
                backgroundClip:"text"
              }}>
                لمهندسي العراق
              </span>
              <br/>
              <span style={{fontSize:".62em",color:T.text3,fontWeight:500}}>
                — غير المعيّنين —
              </span>
            </h1>

            <p style={{
              color:T.text2,fontSize:"clamp(15px,1.6vw,18px)",
              lineHeight:1.9,marginBottom:18,fontWeight:400,maxWidth:580
            }}>
              صوت موحّد للكفاءات الهندسيّة الشابة في العراق. منصّة تجمع خرّيجي كليّات الهندسة الباحثين عن
              فرص التعيين، وتعمل كحلقة وصل بين <strong style={{color:T.text,fontWeight:700}}>المهندس</strong> و<strong style={{color:T.text,fontWeight:700}}>صنّاع القرار</strong>.
            </p>

            {/* Goal pill */}
            <div style={{
              display:"flex",gap:12,alignItems:"flex-start",
              background:T.bg2,border:"1px solid "+T.border2,
              borderRight:"3px solid "+T.cyan,
              padding:"14px 16px",borderRadius:8,marginBottom:34,maxWidth:580
            }}>
              <SvgIcon d={P.target} size={18} color={T.cyan}/>
              <p style={{color:T.text2,fontSize:13.5,lineHeight:1.75,margin:0,fontWeight:400}}>
                <span style={{color:T.cyan,fontWeight:700}}>الهدف:</span> أرشفة وإحصاء كفاءات الهندسة العراقيّة رسميّاً،
                لتسهيل المطالبة بالحقوق في التعيينات المركزيّة والمشاريع التنمويّة.
              </p>
            </div>

            {/* CTAs */}
            <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:40}}>
              <button onClick={function(){setPage("register");}}
                onMouseEnter={function(e){
                  e.currentTarget.style.transform="translateY(-2px)";
                  e.currentTarget.style.boxShadow="0 14px 36px rgba(21,145,220,.45)";
                }}
                onMouseLeave={function(e){
                  e.currentTarget.style.transform="none";
                  e.currentTarget.style.boxShadow="0 8px 24px rgba(21,145,220,.35)";
                }}
                style={{
                  background:"linear-gradient(135deg,"+T.cyanLt+","+T.cyan+")",
                  color:T.bg0,border:"none",padding:"15px 30px",borderRadius:30,
                  fontSize:14.5,fontWeight:800,cursor:"pointer",
                  boxShadow:"0 8px 24px rgba(21,145,220,.35)",
                  display:"inline-flex",alignItems:"center",gap:10,
                  letterSpacing:".2px",fontFamily:T.font,
                  transition:"transform .2s, box-shadow .2s"
                }}>
                <SvgIcon d={P.edit} size={17} color={T.bg0} sw={2.2}/>
                سجّل اسمك الآن
                <SvgIcon d={P.arrow} size={15} color={T.bg0} sw={2.2}/>
              </button>
              <button onClick={openSearch}
                onMouseEnter={function(e){
                  e.currentTarget.style.borderColor=T.cyan;
                  e.currentTarget.style.color=T.cyan;
                  e.currentTarget.style.background="rgba(21,145,220,.06)";
                }}
                onMouseLeave={function(e){
                  e.currentTarget.style.borderColor=T.border2;
                  e.currentTarget.style.color=T.text2;
                  e.currentTarget.style.background="transparent";
                }}
                style={{
                  background:"transparent",color:T.text2,
                  border:"1.5px solid "+T.border2,
                  padding:"14px 26px",borderRadius:30,
                  fontSize:14,fontWeight:700,cursor:"pointer",
                  display:"inline-flex",alignItems:"center",gap:10,
                  fontFamily:T.font,transition:"all .2s"
                }}>
                <SvgIcon d={P.search} size={16}/>
                تحقّق من تسجيلك
              </button>
            </div>

            {/* Spec stats row */}
            <div style={{borderTop:"1px solid "+T.border,paddingTop:26}}>
              <div style={{
                display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",
                gap:0
              }}>
                {quickStats.map(function(s,i){
                  return (
                    <div key={s.label} style={{
                      padding:"4px 16px 4px 0",
                      borderRight:i<quickStats.length-1?"1px solid "+T.border:"none"
                    }}>
                      <div style={{
                        fontSize:10,color:T.cyan,fontFamily:T.fontMono,
                        letterSpacing:"1.5px",marginBottom:8,fontWeight:600
                      }}>{s.spec}</div>
                      <div style={{
                        fontSize:s.val===null?"28px":"40px",fontWeight:800,color:T.text,
                        lineHeight:1,marginBottom:6,fontFamily:T.fontDisp,letterSpacing:"-1.5px"
                      }}>
                        {s.val===null
                          ? <span style={{display:"inline-block",width:50,height:30,background:T.bg2,borderRadius:4,opacity:.5}}/>
                          : s.val.toLocaleString("en-US")
                        }
                      </div>
                      <div style={{fontSize:12.5,color:T.text3,fontWeight:500}}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Compass with annotations */}
          <div className="hero-compass" style={{
            position:"relative",display:"flex",flexDirection:"column",alignItems:"center"
          }}>
            <style>{`
              @media (max-width: 900px) { .hero-compass { display: none !important; } }
              .compass-spin { animation: spin-slow 80s linear infinite; }
              .cyan-glow {
                filter: drop-shadow(0 0 20px rgba(21,145,220,.25)) drop-shadow(0 0 40px rgba(21,145,220,.15));
              }
            `}</style>
            <div style={{
              fontFamily:T.fontMono,fontSize:10,color:T.text4,
              letterSpacing:"2px",marginBottom:18,textAlign:"center"
            }}>
              IRAQI ENG. PLATFORM<br/>
              <span style={{color:T.cyan}}>EST. 2026</span>
            </div>
            <div style={{position:"relative"}}>
              <div style={{
                position:"absolute",inset:-30,
                border:"1px dashed "+T.border2,borderRadius:"50%",opacity:.7
              }}/>
              <div style={{
                position:"absolute",inset:-54,
                border:"1px solid "+T.border,borderRadius:"50%",opacity:.5
              }}/>
              {/* Cyan ambient glow behind compass */}
              <div style={{
                position:"absolute",inset:0,borderRadius:"50%",
                background:"radial-gradient(circle,rgba(21,145,220,.15),transparent 70%)",
                pointerEvents:"none"
              }}/>
              <div className="compass-spin cyan-glow">
                <CompassRose size={300} color="#2C5EAD" accent={T.cyan}/>
              </div>
              <div style={{position:"absolute",top:-14,right:-30,opacity:.8}}>
                <IsoCube size={54} color={T.cyan}/>
              </div>
              <div style={{position:"absolute",bottom:-10,left:-40,opacity:.65}}>
                <DraftingTools size={92} color="#2C5EAD" accent={T.cyan}/>
              </div>
            </div>
            <div style={{
              marginTop:26,padding:"8px 16px",
              background:T.bg2,border:"1px solid "+T.border2,
              borderRadius:6,fontFamily:T.fontMono,fontSize:10,color:T.text3,
              letterSpacing:"1.5px"
            }}>
              ARCHITECTURAL · ENGINEERING · ARCHIVE
            </div>
          </div>
        </div>
      </div>

      {/* ── Caliper Divider ── */}
      <div style={{maxWidth:1240,margin:"0 auto",padding:"44px 24px 0"}}>
        <CaliperDivider color={T.cyan}/>
      </div>

      {/* ── Mission strip ── */}
      <div style={{padding:"60px 20px"}}>
        <div style={{maxWidth:920,margin:"0 auto",textAlign:"center"}}>
          <Eyebrow text="رسالتنا / MISSION" color={T.cyan}/>
          <p style={{
            color:T.text,fontSize:"clamp(18px,2.5vw,28px)",lineHeight:1.6,
            margin:0,fontWeight:500,letterSpacing:"-.3px"
          }}>
            تأسّست المنصّة لتكون <em style={{color:T.cyan,fontStyle:"normal",fontWeight:700}}>صوتاً موحّداً</em> يعكس
            حجم الطاقات الهندسيّة الشابة غير المستغلّة في العراق، وحلقة وصل بين <em style={{color:T.cyan,fontStyle:"normal",fontWeight:700}}>الخرّيج</em> و
            <em style={{color:T.cyan,fontStyle:"normal",fontWeight:700}}>صنّاع القرار</em>.
          </p>
        </div>
      </div>

      {/* ── Feature Cards — Spec Sheet Style ── */}
      <div style={{maxWidth:1240,margin:"0 auto",padding:"20px 24px 40px"}}>
        <div style={{textAlign:"center",marginBottom:46}}>
          <Eyebrow text="الخدمات / SERVICES" color={T.cyan}/>
          <h2 style={{
            fontFamily:T.fontDisp,
            fontSize:"clamp(28px,4.2vw,44px)",fontWeight:900,color:T.text,
            marginBottom:14,letterSpacing:"-.8px",lineHeight:1.15
          }}>
            كيف يمكنك المشاركة؟
          </h2>
          <p style={{color:T.text2,fontSize:15,maxWidth:560,margin:"0 auto",lineHeight:1.85}}>
            أربع خطوات تتيح لك الانضمام إلى الأرشيف الوطنيّ، ومتابعة المؤشّرات، والتواصل مع شبكة المهندسين.
          </p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>
          {featureCards.map(function(fc, idx){
            var isHov = hover===fc.k;
            return (
              <div key={fc.k}
                onMouseEnter={function(){setHover(fc.k);}}
                onMouseLeave={function(){setHover("");}}
                onClick={function(){setPage(fc.k);}}
                style={{
                  background:isHov ? T.bg3 : T.bg2,
                  borderRadius:12,padding:"28px 24px 22px",
                  boxShadow:isHov?"0 16px 48px rgba(9,60,93,.18),0 0 0 1px rgba(21,145,220,.4)":T.shadow,
                  border:"1px solid "+(isHov?T.cyan+"66":T.border2),
                  cursor:"pointer",transition:"all .3s cubic-bezier(.4,0,.2,1)",
                  transform:isHov?"translateY(-6px)":"none",
                  display:"flex",flexDirection:"column",gap:16,
                  position:"relative",overflow:"hidden",
                  animation:"fade-up .5s ease-out "+(idx*80)+"ms backwards"
                }}>
                {/* hover-only gradient sweep */}
                {isHov && <div style={{
                  position:"absolute",inset:0,
                  background:"linear-gradient(135deg,rgba(21,145,220,.06),transparent 60%)",
                  pointerEvents:"none"
                }}/>}

                {/* Spec line top */}
                <div style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  paddingBottom:14,borderBottom:"1px dashed "+T.border2,position:"relative"
                }}>
                  <div style={{
                    fontFamily:T.fontMono,fontSize:11,color:T.cyan,
                    letterSpacing:"1.5px",fontWeight:700
                  }}>
                    [ {fc.num} ]
                  </div>
                  <div style={{
                    width:48,height:48,borderRadius:10,
                    background:"linear-gradient(135deg,rgba(21,145,220,.18),rgba(21,145,220,.06))",
                    border:"1px solid "+T.cyan+"40",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"all .3s",
                    transform:isHov?"rotate(-6deg) scale(1.05)":"none",
                    boxShadow:isHov?"0 4px 16px rgba(21,145,220,.25)":"none"
                  }}>
                    <SvgIcon d={fc.icon} size={22} color={T.cyan}/>
                  </div>
                </div>

                <div style={{flex:1,position:"relative"}}>
                  <h3 style={{
                    fontFamily:T.fontDisp,
                    fontSize:18,fontWeight:800,color:T.text,
                    marginBottom:10,lineHeight:1.35,letterSpacing:"-.3px"
                  }}>{fc.title}</h3>
                  <p style={{color:T.text2,fontSize:13.5,lineHeight:1.95,margin:0,fontWeight:400}}>{fc.desc}</p>
                </div>

                <div style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  paddingTop:14,borderTop:"1px solid "+T.border2,position:"relative"
                }}>
                  <div style={{
                    display:"inline-flex",alignItems:"center",gap:8,
                    color:T.cyan,fontWeight:700,fontSize:13
                  }}>
                    {fc.cta}
                    <SvgIcon d={P.arrow} size={14} color={T.cyan}/>
                  </div>
                  <div style={{
                    fontFamily:T.fontMono,fontSize:10,color:T.text4,
                    letterSpacing:"1px"
                  }}>→ GO</div>
                </div>

                {/* Corner ticks */}
                <div style={{
                  position:"absolute",top:0,right:0,
                  width:14,height:14,
                  borderRight:"2px solid "+T.cyan,
                  borderTop:"2px solid "+T.cyan,
                  opacity:isHov?1:.4,transition:"opacity .2s"
                }}/>
                <div style={{
                  position:"absolute",bottom:0,left:0,
                  width:14,height:14,
                  borderLeft:"2px solid "+T.cyan,
                  borderBottom:"2px solid "+T.cyan,
                  opacity:isHov?1:.4,transition:"opacity .2s"
                }}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BIG NUMBER — Editorial showcase ── */}
      <div style={{
        background:T.bg1,
        borderTop:"1px solid "+T.border,
        borderBottom:"1px solid "+T.border,
        padding:"72px 24px",position:"relative",overflow:"hidden"
      }}>
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:DOT_GRID,backgroundSize:DOT_GRID_SIZE,
          opacity:.7,pointerEvents:"none"
        }}/>
        {/* cyan glow */}
        <div style={{
          position:"absolute",right:"-100px",top:"50%",transform:"translateY(-50%)",
          width:400,height:400,
          background:"radial-gradient(circle,rgba(21,145,220,.12),transparent 70%)",
          pointerEvents:"none"
        }}/>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative"}}>
          <div style={{
            display:"grid",
            gridTemplateColumns:"minmax(0,1fr) minmax(0,1.2fr)",
            gap:48,alignItems:"center"
          }}>
            <div>
              <Eyebrow text="السجلّ الحيّ / LIVE REGISTRY" color={T.cyan} align="flex-start"/>
              <h2 style={{
                fontFamily:T.fontDisp,
                fontSize:"clamp(28px,4vw,44px)",fontWeight:900,color:T.text,
                marginBottom:20,letterSpacing:"-.8px",lineHeight:1.18
              }}>
                كلّ اسم في القائمة <br/>
                <span style={{color:T.cyan}}>صوت إضافيّ</span> في الميزان.
              </h2>
              <p style={{color:T.text2,fontSize:15,lineHeight:1.95,margin:0,maxWidth:480}}>
                كلّما زاد عدد المهندسين المسجّلين، زادت قوّة المطالبة الرسميّة بحقوقهم في التعيينات المركزيّة
                ومشاريع الإعمار. لا تكتفِ بالانتظار — كن جزءاً من الرقم.
              </p>
            </div>
            <div style={{textAlign:"center",position:"relative"}}>
              <div style={{position:"relative",display:"inline-block"}}>
                <div style={{
                  position:"absolute",top:-14,left:0,right:0,height:10,
                  borderTop:"1px solid "+T.cyan,
                  borderLeft:"1px solid "+T.cyan,
                  borderRight:"1px solid "+T.cyan
                }}/>
                <div style={{
                  fontFamily:T.fontDisp,
                  fontSize:"clamp(80px,18vw,200px)",fontWeight:900,
                  color:T.text,lineHeight:.95,letterSpacing:"-6px",
                  background:"linear-gradient(180deg,"+T.text+" 0%,"+T.cyan+" 100%)",
                  WebkitBackgroundClip:"text",
                  WebkitTextFillColor:"transparent",
                  backgroundClip:"text",
                  textShadow:"0 0 60px rgba(21,145,220,.25)"
                }}>
                  {total===null ? "—" : total.toLocaleString("en-US")}
                </div>
                <div style={{
                  position:"absolute",bottom:-14,left:0,right:0,height:10,
                  borderBottom:"1px solid "+T.cyan,
                  borderLeft:"1px solid "+T.cyan,
                  borderRight:"1px solid "+T.cyan
                }}/>
              </div>
              <div style={{
                marginTop:28,fontFamily:T.fontMono,fontSize:12,
                color:T.text3,letterSpacing:"3px",fontWeight:600
              }}>
                مهندس مسجّل · LIVE COUNT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Three Pillars ── */}
      <div style={{padding:"80px 24px",background:T.bg0}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <Eyebrow text="ثلاثة التزامات / 3 PILLARS" color={T.cyan}/>
            <h2 style={{
              fontFamily:T.fontDisp,
              fontSize:"clamp(26px,3.8vw,38px)",fontWeight:900,color:T.text,
              margin:0,letterSpacing:"-.7px",lineHeight:1.25
            }}>
              لماذا تختار هذه المنصّة؟
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>
            {[
              {icon:P.shieldCheck, num:"I",   title:"بياناتك في أمان",  text:"تُخزَّن المعلومات على خوادم مشفّرة بمعايير دوليّة. رقم هاتفك لا يظهر للعموم أبداً."},
              {icon:P.voice,       num:"II",  title:"صوت موحّد",       text:"كلّما زاد عدد المسجّلين، زادت قوّة المطالبة بحقوق المهندسين أمام صنّاع القرار."},
              {icon:P.flag,        num:"III", title:"مستقلّة 100٪",    text:"المنصّة غير حكوميّة وغير حزبيّة — تخدم المهندس العراقيّ حصراً بلا أيّ ارتباطات."},
            ].map(function(item){return(
              <div key={item.title} style={{
                background:T.bg2,borderRadius:12,padding:"30px 26px",
                border:"1px solid "+T.border2,
                position:"relative",overflow:"hidden"
              }}>
                {/* Roman numeral background */}
                <div style={{
                  position:"absolute",top:10,left:18,
                  fontFamily:T.fontDisp,fontSize:54,fontWeight:900,
                  color:T.cyan,opacity:.10,lineHeight:1,letterSpacing:"-3px"
                }}>{item.num}</div>
                <div style={{position:"relative"}}>
                  <div style={{
                    width:50,height:50,borderRadius:10,
                    background:"linear-gradient(135deg,rgba(21,145,220,.18),rgba(21,145,220,.06))",
                    border:"1px solid "+T.cyan+"40",
                    display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20
                  }}>
                    <SvgIcon d={item.icon} size={24} color={T.cyan}/>
                  </div>
                  <h4 style={{
                    fontFamily:T.fontDisp,
                    fontSize:18,fontWeight:800,marginBottom:12,color:T.text,
                    letterSpacing:"-.3px"
                  }}>{item.title}</h4>
                  <p style={{color:T.text2,fontSize:13.5,lineHeight:1.95,margin:0}}>{item.text}</p>
                </div>
              </div>
            );})}
          </div>
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div style={{
        background:"linear-gradient(135deg,"+T.bg1+" 0%,"+T.bg2+" 100%)",
        padding:"80px 24px",textAlign:"center",position:"relative",overflow:"hidden",
        borderTop:"1px solid "+T.border
      }}>
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:BLUEPRINT_BG,backgroundSize:BLUEPRINT_SIZE,opacity:.6,pointerEvents:"none"
        }}/>
        {/* Cyan ambient glow */}
        <div style={{
          position:"absolute",inset:0,
          background:"radial-gradient(ellipse at center,rgba(21,145,220,.10),transparent 60%)",
          pointerEvents:"none"
        }}/>
        {/* Corner ticks */}
        <div style={{position:"absolute",top:28,right:28,width:32,height:32,borderTop:"2px solid "+T.cyan,borderRight:"2px solid "+T.cyan,opacity:.5}}/>
        <div style={{position:"absolute",bottom:28,left:28,width:32,height:32,borderBottom:"2px solid "+T.cyan,borderLeft:"2px solid "+T.cyan,opacity:.5}}/>

        <div style={{maxWidth:820,margin:"0 auto",position:"relative"}}>
          <div style={{
            display:"inline-flex",alignItems:"center",gap:10,
            fontFamily:T.fontMono,fontSize:11,color:T.cyan,
            letterSpacing:"2px",marginBottom:20,fontWeight:600
          }}>
            <span style={{width:34,height:1,background:T.cyan}}/>
            انضمّ إلى الميثاق
            <span style={{width:34,height:1,background:T.cyan}}/>
          </div>
          <h2 style={{
            fontFamily:T.fontDisp,
            color:T.text,fontSize:"clamp(30px,4.8vw,52px)",fontWeight:900,
            marginBottom:20,letterSpacing:"-.8px",lineHeight:1.18
          }}>
            اجعل صوتك مسموعاً.
          </h2>
          <p style={{
            color:T.text2,fontSize:16,lineHeight:1.95,marginBottom:36,
            maxWidth:580,margin:"0 auto 36px"
          }}>
            انضمّ إلى المهندسين العراقيين الذين سجّلوا أسماءهم في القائمة الوطنيّة،
            وكن جزءاً من الصوت الجماعيّ الذي يطالب بحقوق التعيين.
          </p>
          <button onClick={function(){setPage("register");}}
            onMouseEnter={function(e){
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow="0 18px 48px rgba(21,145,220,.55)";
            }}
            onMouseLeave={function(e){
              e.currentTarget.style.transform="none";
              e.currentTarget.style.boxShadow="0 12px 36px rgba(21,145,220,.40)";
            }}
            style={{
              background:"linear-gradient(135deg,"+T.cyanLt+","+T.cyan+")",
              color:T.bg0,border:"none",padding:"17px 42px",borderRadius:32,
              fontSize:16,fontWeight:800,cursor:"pointer",
              boxShadow:"0 12px 36px rgba(21,145,220,.40)",
              display:"inline-flex",alignItems:"center",gap:12,
              letterSpacing:".2px",fontFamily:T.font,transition:"all .25s"
            }}>
            <SvgIcon d={P.edit} size={18} color={T.bg0} sw={2.2}/>
            سجّل اسمك الآن — مجّاناً
            <SvgIcon d={P.arrow} size={16} color={T.bg0} sw={2.2}/>
          </button>
        </div>
      </div>

    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────
export default function App() {
  var [page,setPage]         = useState("home");
  var [showSearch,setSearch] = useState(false);
  if(!READY) return <NoEnvScreen/>;

  var navItems = [
    {k:"home",         l:"الرئيسية",     icon:P.compass},
    {k:"register",     l:"تسجيل",        icon:P.edit},
    {k:"dashboard",    l:"الإحصائيات",   icon:P.chart},
    {k:"coordinators", l:"المنسقون",     icon:P.coord},
    {k:"admin",        l:"الإدارة",      icon:P.shield},
    {k:"about",        l:"عن المنصة",    icon:P.info},
  ];

  return (
    <div style={{fontFamily:T.font,minHeight:"100vh",background:T.bg,color:T.text,direction:"rtl"}}>
      <nav style={{
        background:T.bg1,
        padding:"11px 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        boxShadow:"0 1px 0 rgba(21,145,220,.18), 0 4px 20px rgba(9,60,93,.12)",
        flexWrap:"wrap",gap:4,
        borderBottom:"1px solid "+T.border2,
        position:"relative"
      }}>
        {/* Logo — click to go home */}
        <div onClick={function(){setPage("home");}} style={{
          color:T.text,fontSize:15,fontWeight:700,padding:"4px 0",
          display:"flex",alignItems:"center",gap:12,cursor:"pointer",userSelect:"none"
        }}>
          <div style={{
            width:42,height:42,borderRadius:8,
            background:"linear-gradient(135deg,rgba(21,145,220,.22),rgba(21,145,220,.06))",
            border:"1px solid rgba(21,145,220,.45)",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,.06)"
          }}>
            <SvgIcon d={P.compass} size={22} color={T.cyan} sw={1.7}/>
          </div>
          <span style={{display:"flex",flexDirection:"column",lineHeight:1.25}}>
            <span style={{
              fontFamily:T.fontDisp,
              fontSize:14.5,fontWeight:800,letterSpacing:"0",color:T.text
            }}>منصّة مهندسي العراق</span>
            <span style={{
              fontFamily:T.fontMono,
              fontSize:9.5,color:T.cyan,fontWeight:500,letterSpacing:"1.5px"
            }}>
              IRAQI · ENG · PLATFORM
            </span>
          </span>
          <span style={{
            fontSize:9,background:"rgba(74,222,128,.16)",color:T.success,
            padding:"3px 9px",borderRadius:4,fontWeight:700,letterSpacing:"1.5px",
            border:"1px solid rgba(74,222,128,.35)",fontFamily:T.fontMono
          }}>● LIVE</span>
        </div>

        <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
          {navItems.map(function(n){
            return (
              <button key={n.k} style={{...navBtn(page===n.k),display:"flex",alignItems:"center",gap:6,fontSize:12}} onClick={function(){setPage(n.k);}}>
                <SvgIcon d={n.icon} size={13} color={page===n.k?T.cyan:T.text3}/>{n.l}
              </button>
            );
          })}
          <button onClick={function(){setSearch(true);}}
            onMouseEnter={function(e){e.currentTarget.style.background="rgba(21,145,220,.25)";}}
            onMouseLeave={function(e){e.currentTarget.style.background="linear-gradient(135deg,rgba(21,145,220,.20),rgba(21,145,220,.06))";}}
            style={{
              background:"linear-gradient(135deg,rgba(21,145,220,.20),rgba(21,145,220,.06))",
              border:"1px solid rgba(21,145,220,.50)",color:T.cyan,
              padding:"8px 14px",borderRadius:6,cursor:"pointer",
              fontSize:12,fontWeight:700,marginRight:6,
              display:"flex",alignItems:"center",gap:6,fontFamily:T.font,
              transition:"background .2s"
            }}>
            <SvgIcon d={P.search} size={13} color={T.cyan}/>
            تحقّق من تسجيلك
          </button>
        </div>
      </nav>

      <Ticker/>

      {page==="home"         && <HomePage setPage={setPage} openSearch={function(){setSearch(true);}}/>}
      {page==="register"     && <RegisterPage/>}
      {page==="dashboard"    && <DashboardPage/>}
      {page==="coordinators" && <CoordinatorsPage/>}
      {page==="admin"        && <AdminPage/>}
      {page==="about"        && <AboutPage/>}
      {page==="privacy"      && <PrivacyPage/>}

      {showSearch && <SearchModal onClose={function(){setSearch(false);}}/>}

      <footer style={{
        background:"linear-gradient(180deg,"+T.bg1+","+T.bg0+")",
        color:T.text2,padding:"56px 24px 24px",marginTop:0,
        position:"relative",overflow:"hidden",
        borderTop:"1px solid "+T.border2
      }}>
        {/* subtle iso grid */}
        <div style={{
          position:"absolute",inset:0,
          backgroundImage:BLUEPRINT_BG,backgroundSize:BLUEPRINT_SIZE,
          opacity:.4,pointerEvents:"none"
        }}/>
        <div style={{maxWidth:1200,margin:"0 auto",position:"relative"}}>
          {/* Top: caliper divider */}
          <div style={{marginBottom:36,opacity:.5}}>
            <CaliperDivider color={T.cyan}/>
          </div>

          <div style={{
            display:"grid",gridTemplateColumns:"2fr 1fr 1.5fr",
            gap:48,marginBottom:36,paddingBottom:32,
            borderBottom:"1px solid "+T.border2
          }}>
            {/* Brand */}
            <div style={{minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{
                  width:44,height:44,borderRadius:8,
                  background:"rgba(21,145,220,.18)",
                  border:"1px solid rgba(21,145,220,.45)",
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}>
                  <SvgIcon d={P.compass} size={22} color={T.cyan}/>
                </div>
                <div>
                  <div style={{
                    color:T.text,fontFamily:T.fontDisp,
                    fontWeight:800,fontSize:16,letterSpacing:"-.2px"
                  }}>منصّة مهندسي العراق</div>
                  <div style={{
                    color:T.cyan,fontSize:10,fontFamily:T.fontMono,
                    letterSpacing:"1.5px",marginTop:2
                  }}>IRAQI · ENG · PLATFORM</div>
                </div>
              </div>
              <p style={{fontSize:13,lineHeight:2,color:T.text3,margin:"0 0 14px",maxWidth:380}}>
                صوت موحّد للكفاءات الهندسيّة العراقيّة الباحثة عن فرص التعيين
                والمشاركة في بناء الوطن.
              </p>
              <div style={{
                display:"inline-flex",alignItems:"center",gap:8,
                fontFamily:T.fontMono,fontSize:10,color:T.cyan,
                letterSpacing:"1.5px",padding:"5px 10px",
                background:"rgba(21,145,220,.10)",border:"1px solid rgba(21,145,220,.30)",
                borderRadius:4
              }}>
                ● EST. 2026 · IRAQ
              </div>
            </div>
            {/* Links */}
            <div>
              <h5 style={{
                color:T.cyan,fontSize:11,fontWeight:700,letterSpacing:"2px",
                marginBottom:16,textTransform:"uppercase",fontFamily:T.fontMono
              }}>الأقسام</h5>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <span style={{cursor:"pointer",fontSize:13,color:T.text2,transition:"color .2s"}}
                  onClick={function(){setPage("about");}}
                  onMouseEnter={function(e){e.currentTarget.style.color=T.cyan;}}
                  onMouseLeave={function(e){e.currentTarget.style.color=T.text2;}}>→ عن المنصّة</span>
                <span style={{cursor:"pointer",fontSize:13,color:T.text2,transition:"color .2s"}}
                  onClick={function(){setPage("privacy");}}
                  onMouseEnter={function(e){e.currentTarget.style.color=T.cyan;}}
                  onMouseLeave={function(e){e.currentTarget.style.color=T.text2;}}>→ سياسة الخصوصيّة</span>
                <span style={{cursor:"pointer",fontSize:13,color:T.text2,transition:"color .2s"}}
                  onClick={function(){setPage("coordinators");}}
                  onMouseEnter={function(e){e.currentTarget.style.color=T.cyan;}}
                  onMouseLeave={function(e){e.currentTarget.style.color=T.text2;}}>→ المنسّقون</span>
                <span style={{cursor:"pointer",fontSize:13,color:T.text2,transition:"color .2s"}}
                  onClick={function(){setPage("dashboard");}}
                  onMouseEnter={function(e){e.currentTarget.style.color=T.cyan;}}
                  onMouseLeave={function(e){e.currentTarget.style.color=T.text2;}}>→ الإحصائيّات</span>
              </div>
            </div>
            {/* Mission */}
            <div>
              <h5 style={{
                color:T.cyan,fontSize:11,fontWeight:700,letterSpacing:"2px",
                marginBottom:16,textTransform:"uppercase",fontFamily:T.fontMono
              }}>هدفنا</h5>
              <p style={{fontSize:13,lineHeight:2,color:T.text3,margin:0}}>
                أرشفة وإحصاء كفاءات الهندسة العراقيّة رسميّاً، لتسهيل المطالبة
                بحقوقهم في التعيينات المركزيّة والمشاريع التنمويّة.
              </p>
            </div>
          </div>
          <div style={{
            display:"flex",justifyContent:"space-between",alignItems:"center",
            flexWrap:"wrap",gap:14,fontSize:11,color:T.text4
          }}>
            <span style={{fontFamily:T.font}}>
              المنصّة الوطنيّة لمهندسي العراق غير المعيّنين &copy; {CUR_YEAR}
              <span style={{margin:"0 10px",opacity:.5}}>·</span>
              جميع الحقوق محفوظة
            </span>
            <span style={{
              fontFamily:T.fontMono,letterSpacing:"1.5px",
              padding:"3px 8px",border:"1px solid rgba(21,145,220,.30)",
              borderRadius:4,color:T.cyan
            }}>v4.0 · DARK ENGINEERING</span>
          </div>
        </div>
      </footer>
      <Analytics/>
    </div>
  );
}
