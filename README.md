# رابطة الخريجين العراقيين

نظام تسجيل الخريجين مع لوحة إحصائيات تفاعلية.

## التشغيل المحلي

```bash
npm install
npm start
```

## النشر على Vercel

```bash
npm run build
```

ثم ارفع مجلد `build` على vercel.com أو استخدم `vercel --prod`.

## المتغيرات البيئية المطلوبة في Vercel

```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_KEY
```

## التقنيات المستخدمة

- React 18
- Supabase (PostgreSQL)
- Recharts
- Vercel
