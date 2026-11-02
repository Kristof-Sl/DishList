import {useEffect,useMemo,useState} from 'react'
import {supabase} from './supabase'
import {t,Lang} from './i18n'

type Place={id:string;name:string;address:string|null;lat:number|null;lng:number|null;type:string|null;cuisine:string|null;price:string|null;website:string|null;status:'to_try'|'tried';source:string|null;notes:string|null}
type Visit={id:string;place_id:string;visited_on:string;by_name:string|null;went_with:string|null;rating:number|null;would_return:string|null;dishes:string|null;notes:string|null}
const TYPES=['restaurant','cafe','bistro','bar','bakery','takeaway','other']
const PRICES=['€','€€','€€€','€€€€']
const THEMES=['saffraan','olijf','nacht']
const dist=(a:number,b:number,c:number,d:number)=>{const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))}
const stars=(n:number)=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n))
const useLS=(k:string,d:string):[string,(v:string)=>void]=>{const [v,s]=useState(localStorage.getItem(k)||d);return [v,(x:string)=>{localStorage.setItem(k,x);s(x)}]}

function Logo({s=28}:{s?:number}){return <svg width={s} height={s} viewBox="0 0 512 512" aria-hidden><rect width="512" height="512" rx="112" fill="var(--ink)"/><circle cx="256" cy="256" r="150" fill="var(--accent)"/><circle cx="256" cy="256" r="108" fill="var(--bg)"/><path d="M200 258l41 41 76-84" fill="none" stroke="var(--ink)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/></svg>}

function Auth({l}:{l:Lang}){
  const [email,setE]=useState(''),[pw,setP]=useState(''),[err,setErr]=useState('')
  const go=async(up:boolean)=>{setErr('');const r=up?await supabase.auth.signUp({email,password:pw}):await supabase.auth.signInWithPassword({email,password:pw});if(r.error)setErr(r.error.message)}
  return <div className="auth"><h1><Logo s={44}/> Dishlist</h1>
    <input type="email" placeholder={t(l,'email')} value={email} onChange={e=>setE(e.target.value)}/>
    <input type="password" placeholder={t(l,'password')} value={pw} onChange={e=>setP(e.target.value)}/>
    {err&&<p className="err">{err}</p>}
    <button className="primary" onClick={()=>go(false)}>{t(l,'login')}</button>
    <button className="ghost" onClick={()=>go(true)}>{t(l,'signup')}</button></div>
}

function AddPlace({l,onDone}:{l:Lang;onDone:()=>void}){
  const [q,setQ]=useState(''),[res,setRes]=useState<any[]|null>(null),[busy,setBusy]=useState(false)
  const [f,setF]=useState<any>({name:'',address:'',type:'restaurant',cuisine:'',price:'',website:'',source:'',lat:null,lng:null})
  const set=(k:string,v:any)=>setF({...f,[k]:v})
  const search=async()=>{if(!q.trim())return;setBusy(true)
    try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=8&accept-language='+l+'&q='+encodeURIComponent(q));setRes(await r.json())}catch{setRes([])}
    setBusy(false)}
  const pick=(r:any)=>{const x=r.extratags||{},a=r.address||{}
    const ty=TYPES.includes(r.type)?r.type:(r.type==='fast_food'?'takeaway':'restaurant')
    setF({...f,name:r.name||r.display_name.split(',')[0],address:[a.road,a.house_number,a.city||a.town||a.village].filter(Boolean).join(' ')||r.display_name,type:ty,cuisine:(x.cuisine||'').split(';')[0].replace(/_/g,' '),website:x.website||x['contact:website']||'',lat:+r.lat,lng:+r.lon});setRes(null)}
  const save=async()=>{if(!f.name.trim())return;const {error}=await supabase.from('places').insert({...f,price:f.price||null});if(!error)onDone();else alert(error.message)}
  return <div className="panel"><h2>{t(l,'add')}</h2>
    <label>{t(l,'osm_search')}</label>
    <div className="row"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}/><button className="primary" onClick={search} disabled={busy}>{t(l,'go')}</button></div>
    {res&&(res.length?res.map(r=><button key={r.place_id} className="hit" onClick={()=>pick(r)}>{r.display_name}</button>):<p className="muted">{t(l,'no_results')}</p>)}
    <h3>{t(l,'manual')}</h3>
    <input placeholder={t(l,'name')} value={f.name} onChange={e=>set('name',e.target.value)}/>
    <input placeholder={t(l,'address')} value={f.address} onChange={e=>set('address',e.target.value)}/>
    <div className="row"><select value={f.type} onChange={e=>set('type',e.target.value)}>{TYPES.map(x=><option key={x} value={x}>{t(l,'type_'+x)}</option>)}</select>
      <select value={f.price} onChange={e=>set('price',e.target.value)}><option value="">{t(l,'price')}</option>{PRICES.map(p=><option key={p}>{p}</option>)}</select></div>
    <input placeholder={t(l,'cuisine')} value={f.cuisine} onChange={e=>set('cuisine',e.target.value)}/>
    <input placeholder={t(l,'website')} value={f.website} onChange={e=>set('website',e.target.value)}/>
    <input placeholder={t(l,'source')} value={f.source} onChange={e=>set('source',e.target.value)}/>
    <div className="row"><button className="primary" onClick={save}>{t(l,'save')}</button><button className="ghost" onClick={onDone}>{t(l,'cancel')}</button></div></div>
}

function Detail({l,p,visits,name,reload,close}:{l:Lang;p:Place;visits:Visit[];name:string;reload:()=>void;close:()=>void}){
  const [e,setE]=useState<Place>(p)
  const [v,setV]=useState<any>(null)
  const upd=async(patch:Partial<Place>)=>{const {error}=await supabase.from('places').update(patch).eq('id',p.id);if(error)alert(error.message);reload()}
  const del=async()=>{if(confirm(t(l,'confirm_del'))){await supabase.from('places').delete().eq('id',p.id);reload();close()}}
  const addVisit=async()=>{const {error}=await supabase.from('visits').insert({...v,place_id:p.id});if(error)return alert(error.message)
    if(p.status!=='tried')await supabase.from('places').update({status:'tried'}).eq('id',p.id);setV(null);reload()}
  const delVisit=async(id:string)=>{if(confirm(t(l,'confirm_del'))){await supabase.from('visits').delete().eq('id',id);reload()}}
  const f=(k:keyof Place)=>({value:(e[k] as any)??'',onChange:(x:any)=>setE({...e,[k]:x.target.value})})
  return <div className="panel"><button className="ghost" onClick={close}>← {t(l,'back')}</button>
    <h2>{p.name}</h2>
    <span className={'badge '+p.status}>{t(l,p.status)}</span>
    <label>{t(l,'name')}</label><input {...f('name')}/>
    <label>{t(l,'address')}</label><input {...f('address')}/>
    <div className="row"><select {...f('type')}>{TYPES.map(x=><option key={x} value={x}>{t(l,'type_'+x)}</option>)}</select>
      <select {...f('price')}><option value="">{t(l,'price')}</option>{PRICES.map(x=><option key={x}>{x}</option>)}</select></div>
    <label>{t(l,'cuisine')}</label><input {...f('cuisine')}/>
    <label>{t(l,'website')}</label><input {...f('website')}/>
    {p.website&&<a href={p.website.startsWith('http')?p.website:'https://'+p.website} target="_blank" rel="noreferrer">{p.website}</a>}
    {p.lat!=null&&<a href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`} target="_blank" rel="noreferrer">OpenStreetMap</a>}
    <label>{t(l,'source')}</label><input {...f('source')}/>
    <label>{t(l,'notes')}</label><textarea rows={2} {...f('notes')}/>
    <div className="row"><button className="primary" onClick={()=>upd({name:e.name,address:e.address,type:e.type,price:e.price||null,cuisine:e.cuisine,website:e.website,source:e.source,notes:e.notes})}>{t(l,'save')}</button>
      <button className="ghost" onClick={()=>upd({status:p.status==='tried'?'to_try':'tried'})}>{t(l,p.status==='tried'?'mark_try':'mark_tried')}</button>
      <button className="danger" onClick={del}>{t(l,'delete')}</button></div>
    <h3>{t(l,'visits')}</h3>
    {visits.map(x=><div key={x.id} className="visit"><b>{x.visited_on}</b> {x.rating?<span className="stars">{stars(x.rating)}</span>:null}
      <div className="muted">{[x.by_name,x.went_with&&'+ '+x.went_with,x.would_return&&t(l,'would_return')+' '+t(l,x.would_return)].filter(Boolean).join(' · ')}</div>
      {x.dishes&&<div>🍽 {x.dishes}</div>}{x.notes&&<div>{x.notes}</div>}
      <button className="link" onClick={()=>delVisit(x.id)}>{t(l,'delete')}</button></div>)}
    {v?<div className="visitform">
      <div className="row"><input type="date" value={v.visited_on} onChange={x=>setV({...v,visited_on:x.target.value})}/><input placeholder={t(l,'by')} value={v.by_name} onChange={x=>setV({...v,by_name:x.target.value})}/></div>
      <input placeholder={t(l,'with')} value={v.went_with} onChange={x=>setV({...v,went_with:x.target.value})}/>
      <div className="starpick">{[1,2,3,4,5].map(n=><button key={n} className={n<=v.rating?'on':''} onClick={()=>setV({...v,rating:n})}>★</button>)}</div>
      <select value={v.would_return} onChange={x=>setV({...v,would_return:x.target.value})}><option value="">{t(l,'would_return')}</option>{['yes','maybe','no'].map(k=><option key={k} value={k}>{t(l,k)}</option>)}</select>
      <input placeholder={t(l,'dishes')} value={v.dishes} onChange={x=>setV({...v,dishes:x.target.value})}/>
      <textarea rows={2} placeholder={t(l,'notes')} value={v.notes} onChange={x=>setV({...v,notes:x.target.value})}/>
      <div className="row"><button className="primary" onClick={addVisit}>{t(l,'save')}</button><button className="ghost" onClick={()=>setV(null)}>{t(l,'cancel')}</button></div></div>
     :<button className="primary" onClick={()=>setV({visited_on:new Date().toISOString().slice(0,10),by_name:name,went_with:'',rating:0,would_return:'',dishes:'',notes:''})}>+ {t(l,'new_visit')}</button>}
  </div>
}

export default function App(){
  const [lang,setLang]=useLS('lang','nl'),[theme,setTheme]=useLS('theme','saffraan'),l=lang as Lang
  const [session,setSession]=useState<any>(undefined)
  const [places,setPlaces]=useState<Place[]>([]),[visits,setVisits]=useState<Visit[]>([])
  const [sel,setSel]=useState<string|null>(null),[adding,setAdding]=useState(false),[menu,setMenu]=useState(false)
  const [q,setQ]=useState(''),[st,setSt]=useState(''),[ty,setTy]=useState(''),[pr,setPr]=useState(''),[cu,setCu]=useState(''),[mr,setMr]=useState(0),[km,setKm]=useState(0),[sort,setSort]=useState('new')
  const [pos,setPos]=useState<[number,number]|null>(null)
  useEffect(()=>{document.documentElement.dataset.theme=theme},[theme])
  useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return ()=>data.subscription.unsubscribe()},[])
  const load=async()=>{const a=await supabase.from('places').select('*').order('created_at',{ascending:false}),b=await supabase.from('visits').select('*').order('visited_on',{ascending:false});setPlaces((a.data as Place[])||[]);setVisits((b.data as Visit[])||[])}
  useEffect(()=>{if(session)load()},[session])
  const useNear=(k:number)=>{setKm(k);if(k&&!pos)navigator.geolocation.getCurrentPosition(p=>setPos([p.coords.latitude,p.coords.longitude]),()=>{alert(t(l,'loc_fail'));setKm(0)})}
  const avg=(id:string)=>{const r=visits.filter(v=>v.place_id===id&&v.rating).map(v=>v.rating!);return r.length?r.reduce((a,b)=>a+b,0)/r.length:0}
  const dOf=(p:Place)=>pos&&p.lat!=null?dist(pos[0],pos[1],p.lat,p.lng!):null
  const shown=useMemo(()=>{
    let r=places.filter(p=>(!q||(p.name+' '+(p.address||'')).toLowerCase().includes(q.toLowerCase()))&&(!st||p.status===st)&&(!ty||p.type===ty)&&(!pr||p.price===pr)&&(!cu||(p.cuisine||'').toLowerCase().includes(cu.toLowerCase()))&&avg(p.id)>=mr&&(!km||(dOf(p)!=null&&dOf(p)!<=km)))
    if(sort==='name')r=[...r].sort((a,b)=>a.name.localeCompare(b.name));if(sort==='rating')r=[...r].sort((a,b)=>avg(b.id)-avg(a.id));if(sort==='dist'&&pos)r=[...r].sort((a,b)=>(dOf(a)??1e9)-(dOf(b)??1e9))
    return r},[places,visits,q,st,ty,pr,cu,mr,km,sort,pos])
  if(session===undefined)return null
  if(!session)return <Auth l={l}/>
  const cur=places.find(p=>p.id===sel)
  const name=(session.user.email||'').split('@')[0]
  return <div className="app">
    <header><h1><Logo/> Dishlist</h1><button className="ghost" onClick={()=>setMenu(!menu)}>⚙</button></header>
    {menu&&<div className="panel"><label>{t(l,'language')}</label><select value={lang} onChange={e=>setLang(e.target.value)}><option value="nl">Nederlands</option><option value="en">English</option></select>
      <label>{t(l,'theme')}</label><select value={theme} onChange={e=>setTheme(e.target.value)}>{THEMES.map(x=><option key={x}>{x}</option>)}</select>
      <button className="ghost" onClick={()=>supabase.auth.signOut()}>{t(l,'logout')}</button></div>}
    {adding?<AddPlace l={l} onDone={()=>{setAdding(false);load()}}/>
    :cur?<Detail key={cur.id+cur.status} l={l} p={cur} visits={visits.filter(v=>v.place_id===cur.id)} name={name} reload={load} close={()=>setSel(null)}/>
    :<>
      <div className="tabs">{[['',''],['to_try','to_try'],['tried','tried']].map(([k,x])=><button key={k} className={st===k?'on':''} onClick={()=>setSt(k)}>{t(l,x||'all')}</button>)}</div>
      <input placeholder={t(l,'search_ph')} value={q} onChange={e=>setQ(e.target.value)}/>
      <details><summary>Filters</summary><div className="filters">
        <select value={ty} onChange={e=>setTy(e.target.value)}><option value="">{t(l,'type')}</option>{TYPES.map(x=><option key={x} value={x}>{t(l,'type_'+x)}</option>)}</select>
        <select value={pr} onChange={e=>setPr(e.target.value)}><option value="">{t(l,'price')}</option>{PRICES.map(x=><option key={x}>{x}</option>)}</select>
        <input placeholder={t(l,'cuisine')} value={cu} onChange={e=>setCu(e.target.value)}/>
        <select value={mr} onChange={e=>setMr(+e.target.value)}><option value={0}>{t(l,'min_rating')}</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}★+</option>)}</select>
        <select value={km} onChange={e=>useNear(+e.target.value)}><option value={0}>{t(l,'near')}: {t(l,'off')}</option>{[1,2,5,10,25,50].map(n=><option key={n} value={n}>{t(l,'near')}: {n}</option>)}</select>
        <select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">{t(l,'sort')}: {t(l,'s_new')}</option><option value="name">{t(l,'s_name')}</option><option value="rating">{t(l,'s_rating')}</option><option value="dist" onClick={()=>useNear(km||10)}>{t(l,'s_dist')}</option></select>
      </div></details>
      {shown.length?shown.map(p=>{const a=avg(p.id),d=dOf(p);return <button key={p.id} className="card" onClick={()=>setSel(p.id)}>
        <div><b>{p.name}</b><div className="muted">{[t(l,'type_'+(p.type||'other')),p.cuisine,p.price,p.address].filter(Boolean).join(' · ')}</div></div>
        <div className="side">{a?<span className="stars">{stars(a)}</span>:null}<span className={'badge '+p.status}>{t(l,p.status)}</span>{d!=null&&<span className="muted">{d.toFixed(1)} km</span>}</div></button>})
      :<p className="muted empty">{t(l,'empty')}</p>}
      <button className="fab" onClick={()=>setAdding(true)}>+ {t(l,'add')}</button></>}
  </div>
}
