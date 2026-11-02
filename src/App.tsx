import {useEffect,useMemo,useState} from 'react'
import {supabase} from './supabase'
import {t,Lang} from './i18n'
import {MapView} from './MapView'

type Place={id:string;name:string;address:string|null;lat:number|null;lng:number|null;type:string|null;cuisine:string|null;price:string|null;website:string|null;status:'to_try'|'tried';source:string|null;notes:string|null}
type Visit={id:string;place_id:string;visited_on:string;by_name:string|null;went_with:string|null;rating:number|null;would_return:string|null;dishes:string|null;notes:string|null;total_bill:number|null;meal_type:string|null;reason:string|null}
type VisitDraft={id?:string;visited_on:string;by_name:string;went_with:string;rating:number;would_return:string;dishes:string;notes:string;total_bill:string;meal_type:string;reason:string}
type Photo={id:string;visit_id:string;path:string}
const TYPES=['restaurant','cafe','bistro','bar','bakery','takeaway','other']
const PRICES=['€','€€','€€€','€€€€']
const THEMES=['saffraan','olijf','nacht']
const dist=(a:number,b:number,c:number,d:number)=>{const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 12742*Math.asin(Math.sqrt(x))}
const stars=(n:number)=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n))
const photoUrl=(path:string)=>supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
const resize=(f:File):Promise<Blob>=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const k=Math.min(1,1600/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d')!.drawImage(i,0,0,c.width,c.height);c.toBlob(b=>b?ok(b):no(),'image/jpeg',.8)};i.onerror=no;i.src=URL.createObjectURL(f)})
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
    <button className="ghost" disabled={!q.trim()} onClick={()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(q.trim())}`,'_blank','noopener,noreferrer')}>{t(l,'search_google')}</button>
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

function Detail({l,p,visits,photos,name,reload,close,initialVisitId,onInitialEditHandled}:{l:Lang;p:Place;visits:Visit[];photos:Photo[];name:string;reload:()=>void;close:()=>void;initialVisitId?:string|null;onInitialEditHandled?:()=>void}){
  const [e,setE]=useState<Place>(p)
  const [v,setV]=useState<VisitDraft|null>(null)
  const upd=async(patch:Partial<Place>)=>{const {error}=await supabase.from('places').update(patch).eq('id',p.id);if(error)alert(error.message);reload()}
  const mine=photos.filter(ph=>visits.some(v=>v.id===ph.visit_id))
  const upload=async(vid:string,files:FileList|null)=>{if(!files)return;for(const f of Array.from(files)){try{const b=await resize(f),path=`${vid}/${crypto.randomUUID()}.jpg`,u=await supabase.storage.from('photos').upload(path,b,{contentType:'image/jpeg'});if(u.error){alert(u.error.message);continue};await supabase.from('visit_photos').insert({visit_id:vid,path})}catch{alert('Photo error')}};reload()}
  const delPhoto=async(ph:Photo)=>{if(confirm(t(l,'confirm_del'))){await supabase.storage.from('photos').remove([ph.path]);await supabase.from('visit_photos').delete().eq('id',ph.id);reload()}}
  const del=async()=>{if(confirm(t(l,'confirm_del'))){if(mine.length)await supabase.storage.from('photos').remove(mine.map(x=>x.path));await supabase.from('places').delete().eq('id',p.id);reload();close()}}
  const saveVisit=async()=>{if(!v)return
    const payload={visited_on:v.visited_on,by_name:v.by_name.trim()||null,went_with:v.went_with||null,rating:v.rating||null,would_return:v.would_return||null,dishes:v.dishes.trim()||null,notes:v.notes.trim()||null,total_bill:v.total_bill===''?null:Number(v.total_bill),meal_type:v.meal_type||null,reason:v.reason.trim()||null}
    const result=v.id?await supabase.from('visits').update(payload).eq('id',v.id):await supabase.from('visits').insert({...payload,place_id:p.id})
    if(result.error)return alert(result.error.message)
    if(!v.id&&p.status!=='tried')await supabase.from('places').update({status:'tried'}).eq('id',p.id);setV(null);reload()}
  const editVisit=(visit:Visit)=>setV({id:visit.id,visited_on:visit.visited_on,by_name:visit.by_name||'',went_with:visit.went_with||'',rating:visit.rating||0,would_return:visit.would_return||'',dishes:visit.dishes||'',notes:visit.notes||'',total_bill:visit.total_bill==null?'':String(visit.total_bill),meal_type:visit.meal_type||'',reason:visit.reason||''})
  useEffect(()=>{if(!initialVisitId)return;const visit=visits.find(x=>x.id===initialVisitId);if(visit)editVisit(visit);onInitialEditHandled?.()},[initialVisitId])
  const delVisit=async(id:string)=>{if(confirm(t(l,'confirm_del'))){const ps=photos.filter(x=>x.visit_id===id).map(x=>x.path);if(ps.length)await supabase.storage.from('photos').remove(ps);await supabase.from('visits').delete().eq('id',id);reload()}}
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
      <div className="muted">{[x.by_name,x.went_with&&t(l,x.went_with),x.meal_type&&t(l,x.meal_type),x.total_bill!=null&&new Intl.NumberFormat(l==='nl'?'nl-NL':'en-US',{style:'currency',currency:'EUR'}).format(x.total_bill),x.would_return&&t(l,'would_return')+' '+t(l,x.would_return)].filter(Boolean).join(' · ')}</div>
      {x.dishes&&<div>🍽 {x.dishes}</div>}{x.reason&&<div>{t(l,'reason')}: {x.reason}</div>}{x.notes&&<div>{x.notes}</div>}
      <div className="photos">{mine.filter(ph=>ph.visit_id===x.id).map(ph=><span key={ph.id}><a href={photoUrl(ph.path)} target="_blank" rel="noreferrer"><img src={photoUrl(ph.path)} loading="lazy" alt=""/></a><button className="x" onClick={()=>delPhoto(ph)}>×</button></span>)}</div>
      <label className="addphoto">📷 {t(l,'photo')}<input type="file" accept="image/*" multiple hidden onChange={e=>{upload(x.id,e.target.files);e.target.value=''}}/></label>
      <div className="row"><button className="link" onClick={()=>editVisit(x)}>{t(l,'edit_visit')}</button><button className="link" onClick={()=>delVisit(x.id)}>{t(l,'delete')}</button></div></div>)}
    {v?<div className="visitform">
      <b>{t(l,v.id?'edit_visit':'new_visit')}</b>
      <div className="row">
        <div className="visit-field"><label htmlFor="visit-date">{t(l,'date')}</label><input id="visit-date" type="date" value={v.visited_on} onChange={x=>setV({...v,visited_on:x.target.value})}/></div>
        <div className="visit-field"><label htmlFor="visit-by">{t(l,'by')}</label><input id="visit-by" value={v.by_name} onChange={x=>setV({...v,by_name:x.target.value})}/></div>
      </div>
      <div className="visit-field"><label htmlFor="visit-with">{t(l,'company')}</label><select id="visit-with" value={v.went_with} onChange={x=>setV({...v,went_with:x.target.value})}>
        <option value="" disabled>{t(l,'company')}</option>{['with_two','with_family','with_others'].map(k=><option key={k} value={k}>{t(l,k)}</option>)}
      </select></div>
      <div className="visit-field"><label>{t(l,'rating')}</label><div className="starpick" role="group" aria-label={t(l,'rating')}>{[1,2,3,4,5].map(n=><button type="button" aria-label={`${n} ${t(l,'rating')}`} key={n} className={n<=v.rating?'on':''} onClick={()=>setV({...v,rating:n})}>★</button>)}</div></div>
      <div className="visit-field"><label htmlFor="visit-return">{t(l,'would_return')}</label><select id="visit-return" value={v.would_return} onChange={x=>setV({...v,would_return:x.target.value})}><option value="" disabled>{t(l,'would_return')}</option>{['yes','maybe','no'].map(k=><option key={k} value={k}>{t(l,k)}</option>)}</select></div>
      <div className="row">
        <div className="visit-field"><label htmlFor="visit-bill">{t(l,'total_bill')}</label><input id="visit-bill" type="number" min="0" step="0.01" value={v.total_bill} onChange={x=>setV({...v,total_bill:x.target.value})}/></div>
        <div className="visit-field"><label htmlFor="visit-meal">{t(l,'meal_type')}</label><select id="visit-meal" value={v.meal_type} onChange={x=>setV({...v,meal_type:x.target.value})}><option value="" disabled>{t(l,'meal_type')}</option>{['takeaway','dine_in'].map(k=><option key={k} value={k}>{t(l,k)}</option>)}</select></div>
      </div>
      <div className="visit-field"><label htmlFor="visit-dishes">{t(l,'dishes')}</label><input id="visit-dishes" value={v.dishes} onChange={x=>setV({...v,dishes:x.target.value})}/></div>
      <div className="visit-field"><label htmlFor="visit-reason">{t(l,'reason')}</label><textarea id="visit-reason" rows={2} value={v.reason} onChange={x=>setV({...v,reason:x.target.value})}/></div>
      <div className="visit-field"><label htmlFor="visit-notes">{t(l,'notes')}</label><textarea id="visit-notes" rows={2} value={v.notes} onChange={x=>setV({...v,notes:x.target.value})}/></div>
      <div className="row"><button className="primary" onClick={saveVisit}>{t(l,'save')}</button><button className="ghost" onClick={()=>setV(null)}>{t(l,'cancel')}</button></div></div>
     :<button className="primary" onClick={()=>setV({visited_on:new Date().toISOString().slice(0,10),by_name:name,went_with:'',rating:0,would_return:'',dishes:'',notes:'',total_bill:'',meal_type:'',reason:''})}>+ {t(l,'new_visit')}</button>}
  </div>
}

export default function App(){
  const [lang,setLang]=useLS('lang','nl'),[theme,setTheme]=useLS('theme','saffraan'),l=lang as Lang
  const [session,setSession]=useState<any>(undefined)
  const [places,setPlaces]=useState<Place[]>([]),[visits,setVisits]=useState<Visit[]>([])
  const [sel,setSel]=useState<string|null>(null),[adding,setAdding]=useState(false),[menu,setMenu]=useState(false)
  const [q,setQ]=useState(''),[st,setSt]=useState(''),[ty,setTy]=useState(''),[pr,setPr]=useState(''),[cu,setCu]=useState(''),[mr,setMr]=useState(0),[km,setKm]=useState(0),[sort,setSort]=useState('new')
  const [pos,setPos]=useState<[number,number]|null>(null),[photos,setPhotos]=useState<Photo[]>([]),[view,setView]=useState('list')
  const [calendar,setCalendar]=useState(true),[selectedYears,setSelectedYears]=useState<string[]|null>(null),[calendarVisitId,setCalendarVisitId]=useState<string|null>(null),[visitToEdit,setVisitToEdit]=useState<string|null>(null)
  useEffect(()=>{document.documentElement.dataset.theme=theme},[theme])
  useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return ()=>data.subscription.unsubscribe()},[])
  const load=async()=>{const a=await supabase.from('places').select('*').order('created_at',{ascending:false}),b=await supabase.from('visits').select('*').order('visited_on',{ascending:false});setPlaces((a.data as Place[])||[]);setVisits((b.data as Visit[])||[]);const c=await supabase.from('visit_photos').select('*');setPhotos((c.data as Photo[])||[])}
  useEffect(()=>{if(session)load()},[session])
  const useNear=(k:number)=>{setKm(k);if(k&&!pos)navigator.geolocation.getCurrentPosition(p=>setPos([p.coords.latitude,p.coords.longitude]),()=>{alert(t(l,'loc_fail'));setKm(0)})}
  const avg=(id:string)=>{const r=visits.filter(v=>v.place_id===id&&v.rating).map(v=>v.rating!);return r.length?r.reduce((a,b)=>a+b,0)/r.length:0}
  const dOf=(p:Place)=>pos&&p.lat!=null?dist(pos[0],pos[1],p.lat,p.lng!):null
  const placeById=useMemo(()=>new Map(places.map(p=>[p.id,p])),[places])
  const shown=useMemo(()=>{
    let r=places.filter(p=>(!q||(p.name+' '+(p.address||'')).toLowerCase().includes(q.toLowerCase()))&&(!st||p.status===st)&&(!ty||p.type===ty)&&(!pr||p.price===pr)&&(!cu||(p.cuisine||'').toLowerCase().includes(cu.toLowerCase()))&&avg(p.id)>=mr&&(!km||(dOf(p)!=null&&dOf(p)!<=km)))
    if(sort==='name')r=[...r].sort((a,b)=>a.name.localeCompare(b.name));if(sort==='rating')r=[...r].sort((a,b)=>avg(b.id)-avg(a.id));if(sort==='dist'&&pos)r=[...r].sort((a,b)=>(dOf(a)??1e9)-(dOf(b)??1e9))
    return r},[places,visits,q,st,ty,pr,cu,mr,km,sort,pos])
  const calendarVisits=useMemo(()=>visits
    .filter(v=>{const p=placeById.get(v.place_id);return !!p&&(!q||(p.name+' '+(p.address||'')).toLowerCase().includes(q.toLowerCase()))})
    .sort((a,b)=>b.visited_on.localeCompare(a.visited_on)),[visits,placeById,q])
  const calendarYears=[...new Set(visits.map(v=>v.visited_on.slice(0,4)))].sort((a,b)=>b.localeCompare(a))
  const groupedVisits=useMemo(()=>{
    const groups=new Map<string,Map<string,Visit[]>>()
    calendarVisits.filter(v=>selectedYears===null||selectedYears.includes(v.visited_on.slice(0,4))).forEach(v=>{
      const year=v.visited_on.slice(0,4),month=v.visited_on.slice(5,7)
      if(!groups.has(year))groups.set(year,new Map())
      const months=groups.get(year)!
      if(!months.has(month))months.set(month,[])
      months.get(month)!.push(v)
    })
    return [...groups].sort(([a],[b])=>b.localeCompare(a)).map(([year,months])=>({
      year,months:[...months].sort(([a],[b])=>b.localeCompare(a))
    }))
  },[calendarVisits,selectedYears])
  if(session===undefined)return null
  if(!session)return <Auth l={l}/>
  const cur=places.find(p=>p.id===sel)
  const emailName=(session.user.email||'').split('@')[0].split('.')[0]
  const name=emailName?emailName.charAt(0).toUpperCase()+emailName.slice(1).toLowerCase():''
  return <div className="app">
    <header><h1><Logo/> Dishlist</h1><button className="ghost" onClick={()=>setMenu(!menu)}>⚙</button></header>
    {menu&&<div className="panel"><label>{t(l,'language')}</label><select value={lang} onChange={e=>setLang(e.target.value)}><option value="nl">Nederlands</option><option value="en">English</option></select>
      <label>{t(l,'theme')}</label><select value={theme} onChange={e=>setTheme(e.target.value)}>{THEMES.map(x=><option key={x}>{x}</option>)}</select>
      <button className="ghost" onClick={()=>supabase.auth.signOut()}>{t(l,'logout')}</button></div>}
    {adding?<AddPlace l={l} onDone={()=>{setAdding(false);load()}}/>
    :cur?<Detail key={cur.id+cur.status} l={l} p={cur} visits={visits.filter(v=>v.place_id===cur.id)} photos={photos} name={name} reload={load} close={()=>setSel(null)} initialVisitId={visitToEdit} onInitialEditHandled={()=>setVisitToEdit(null)}/>
    :<>
      <div className="tabs">
        <button className={calendar?'on':''} onClick={()=>setCalendar(true)}>{t(l,'calendar')}</button>
        <button className={!calendar&&st===''?'on':''} onClick={()=>{setCalendar(false);setSt('')}}>{t(l,'all')}</button>
        <button className={!calendar&&st==='to_try'?'on':''} onClick={()=>{setCalendar(false);setSt('to_try')}}>{t(l,'to_try')}</button>
        <button className={!calendar&&st==='tried'?'on':''} onClick={()=>{setCalendar(false);setSt('tried')}}>{t(l,'tried')}</button>
      </div>
      <div className="row"><input placeholder={t(l,'search_ph')} value={q} onChange={e=>setQ(e.target.value)}/>{!calendar&&<div className="seg">{[['list','list'],['map','map']].map(([k,x])=><button key={k} className={view===k?'on':''} onClick={()=>setView(k)}>{t(l,x)}</button>)}</div>}</div>
      {calendar?<>
        <div className="year-pills" role="group" aria-label={t(l,'calendar_years')}>{calendarYears.map(year=><button key={year} className={selectedYears===null||selectedYears.includes(year)?'on':''} aria-pressed={selectedYears===null||selectedYears.includes(year)} onClick={()=>{
          const current=selectedYears??calendarYears
          const next=current.includes(year)?current.filter(y=>y!==year):[...current,year]
          setSelectedYears(next.length===calendarYears.length?null:next)
        }}>{year}</button>)}</div>
        {calendarVisitId&&visits.some(v=>v.id===calendarVisitId)?(()=>{
          const visit=visits.find(v=>v.id===calendarVisitId)!
          const place=placeById.get(visit.place_id)!
          const visitPhotos=photos.filter(photo=>photo.visit_id===visit.id)
          return <section className="calendar-detail">
            <button className="ghost" onClick={()=>setCalendarVisitId(null)}>← {t(l,'back')}</button>
            <h2>{t(l,'visit_details')}</h2>
            <div className="visit-detail-fields">
              <div><label>{t(l,'date')}</label><span>{new Intl.DateTimeFormat(l==='nl'?'nl-NL':'en-US',{dateStyle:'long'}).format(new Date(`${visit.visited_on}T12:00:00`))}</span></div>
              <div><label>{t(l,'by')}</label><span>{visit.by_name||'—'}</span></div>
              <div><label>{t(l,'company')}</label><span>{visit.went_with?t(l,visit.went_with):'—'}</span></div>
              <div><label>{t(l,'rating')}</label><span className="stars">{visit.rating?stars(visit.rating):'—'}</span></div>
              <div><label>{t(l,'would_return')}</label><span>{visit.would_return?t(l,visit.would_return):'—'}</span></div>
              <div><label>{t(l,'total_bill')}</label><span>{visit.total_bill!=null?new Intl.NumberFormat(l==='nl'?'nl-NL':'en-US',{style:'currency',currency:'EUR'}).format(visit.total_bill):'—'}</span></div>
              <div><label>{t(l,'meal_type')}</label><span>{visit.meal_type?t(l,visit.meal_type):'—'}</span></div>
              <div><label>{t(l,'dishes')}</label><span>{visit.dishes||'—'}</span></div>
              <div><label>{t(l,'reason')}</label><span>{visit.reason||'—'}</span></div>
              <div><label>{t(l,'notes')}</label><span>{visit.notes||'—'}</span></div>
            </div>
            {!!visitPhotos.length&&<div className="photos">{visitPhotos.map(photo=><a key={photo.id} href={photoUrl(photo.path)} target="_blank" rel="noreferrer"><img src={photoUrl(photo.path)} loading="lazy" alt=""/></a>)}</div>}
            <button className="primary" onClick={()=>{setVisitToEdit(visit.id);setSel(place.id);setCalendarVisitId(null)}}>{t(l,'edit_visit')}</button>
            <section className="calendar-restaurant">
              <h2>{t(l,'restaurant_details')}</h2>
              <div className="visit-detail-fields">
                <div><label>{t(l,'name')}</label><span>{place.name}</span></div>
                <div><label>{t(l,'address')}</label><span>{place.address||'—'}</span></div>
                <div><label>{t(l,'type')}</label><span>{place.type?t(l,'type_'+place.type):'—'}</span></div>
                <div><label>{t(l,'cuisine')}</label><span>{place.cuisine||'—'}</span></div>
                <div><label>{t(l,'price')}</label><span>{place.price||'—'}</span></div>
                <div><label>{t(l,'website')}</label><span>{place.website||'—'}</span></div>
                <div><label>{t(l,'source')}</label><span>{place.source||'—'}</span></div>
                <div><label>{t(l,'notes')}</label><span>{place.notes||'—'}</span></div>
              </div>
              {place.website&&<a href={place.website.startsWith('http')?place.website:'https://'+place.website} target="_blank" rel="noreferrer">{place.website}</a>}
              <span className={'badge '+place.status}>{t(l,place.status)}</span>
            </section>
          </section>
        })():groupedVisits.length?groupedVisits.map(({year,months})=><section className="calendar-year" key={year}>
          <h2>{year}</h2>
          {months.map(([month,monthVisits])=><div className="calendar-month" key={month}>
            <h3>{new Intl.DateTimeFormat(l==='nl'?'nl-NL':'en-US',{month:'long'}).format(new Date(Number(year),Number(month)-1,1))}</h3>
            {monthVisits.map(visit=>{const place=placeById.get(visit.place_id)!;return <button className="calendar-visit" key={visit.id} onClick={()=>setCalendarVisitId(visit.id)}>
              <b>{place.name}</b>
              <span className="calendar-visit-meta">{new Intl.DateTimeFormat(l==='nl'?'nl-NL':'en-US',{day:'numeric',month:'short'}).format(new Date(`${visit.visited_on}T12:00:00`))}{visit.rating!=null&&<span className="stars">{stars(visit.rating)}</span>}{visit.total_bill!=null&&<span>{new Intl.NumberFormat(l==='nl'?'nl-NL':'en-US',{style:'currency',currency:'EUR'}).format(visit.total_bill)}</span>}</span>
              {visit.reason&&<span className="muted">{visit.reason}</span>}
            </button>})}
          </div>)}
        </section>):<p className="muted empty">{t(l,'calendar_empty')}</p>}
      </>:<>
      <details><summary>Filters</summary><div className="filters">
        <select value={ty} onChange={e=>setTy(e.target.value)}><option value="">{t(l,'type')}</option>{TYPES.map(x=><option key={x} value={x}>{t(l,'type_'+x)}</option>)}</select>
        <select value={pr} onChange={e=>setPr(e.target.value)}><option value="">{t(l,'price')}</option>{PRICES.map(x=><option key={x}>{x}</option>)}</select>
        <input placeholder={t(l,'cuisine')} value={cu} onChange={e=>setCu(e.target.value)}/>
        <select value={mr} onChange={e=>setMr(+e.target.value)}><option value={0}>{t(l,'min_rating')}</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}★+</option>)}</select>
        <select value={km} onChange={e=>useNear(+e.target.value)}><option value={0}>{t(l,'near')}: {t(l,'off')}</option>{[1,2,5,10,25,50].map(n=><option key={n} value={n}>{t(l,'near')}: {n}</option>)}</select>
        <select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">{t(l,'sort')}: {t(l,'s_new')}</option><option value="name">{t(l,'s_name')}</option><option value="rating">{t(l,'s_rating')}</option><option value="dist" onClick={()=>useNear(km||10)}>{t(l,'s_dist')}</option></select>
      </div></details>
      {view==='map'?<MapView places={shown} pos={pos} onSelect={setSel}/>:shown.length?shown.map(p=>{const a=avg(p.id),d=dOf(p);return <button key={p.id} className="card" onClick={()=>setSel(p.id)}>
        <div><b>{p.name}</b><div className="muted">{[t(l,'type_'+(p.type||'other')),p.cuisine,p.price,p.address].filter(Boolean).join(' · ')}</div></div>
        <div className="side">{a?<span className="stars">{stars(a)}</span>:null}<span className={'badge '+p.status}>{t(l,p.status)}</span>{d!=null&&<span className="muted">{d.toFixed(1)} km</span>}</div></button>})
      :<p className="muted empty">{t(l,'empty')}</p>}
      <button className="fab" onClick={()=>setAdding(true)}>+ {t(l,'add')}</button></>}
      </>}
  </div>
}
