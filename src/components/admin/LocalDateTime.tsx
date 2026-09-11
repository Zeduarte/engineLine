"use client";
import { useEffect, useState } from "react";
/** Browser timezone for editing, UTC transport for the server. */
export function LocalDateTime({name,value,required=false}: {name:string;value?:string|null;required?:boolean}) {
  const [local,setLocal] = useState("");
  useEffect(()=>{if(value){const d=new Date(value);setLocal(new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16));}else setLocal("");},[value]);
  return <><input type="datetime-local" className="field" value={local} required={required} onChange={e=>setLocal(e.target.value)}/><input type="hidden" name={name} value={local ? new Date(local).toISOString() : ""}/></>;
}
