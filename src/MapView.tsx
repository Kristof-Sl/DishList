import {useEffect,useRef} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
type P={id:string;name:string;lat:number|null;lng:number|null;status:string}
export function MapView({places,pos,onSelect}:{places:P[];pos:[number,number]|null;onSelect:(id:string)=>void}){
  const el=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const css=getComputedStyle(document.documentElement),ink=css.getPropertyValue('--ink'),acc=css.getPropertyValue('--accent'),bg=css.getPropertyValue('--bg')
    const m=L.map(el.current!).setView([51,5],7),pts:L.LatLngExpression[]=[]
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m)
    places.forEach(p=>{if(p.lat==null||p.lng==null)return
      const d=document.createElement('button');d.className='pop';d.textContent=p.name+' ›';d.onclick=()=>onSelect(p.id)
      L.circleMarker([p.lat,p.lng],{radius:11,weight:3,color:ink,fillColor:p.status==='tried'?acc:bg,fillOpacity:1}).bindPopup(d).addTo(m);pts.push([p.lat,p.lng])})
    if(pos){L.circleMarker(pos,{radius:6,color:'#fff',weight:2,fillColor:'#2a7de1',fillOpacity:1}).addTo(m);pts.push(pos)}
    if(pts.length)m.fitBounds(L.latLngBounds(pts),{padding:[30,30],maxZoom:15})
    return ()=>{m.remove()}
  },[places,pos])
  return <div ref={el} className="map"/>
}
