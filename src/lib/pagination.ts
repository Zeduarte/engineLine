/** Fetch bounded pages when a complete dataset is required; never silently truncate at the API row cap. */
export async function allRows<T>(fetchPage: (from:number,to:number) => PromiseLike<{data:T[]|null;error:{message:string}|null}>):Promise<T[]> {
  const rows:T[]=[];
  for(let from=0;;from+=500) {
    const {data,error}=await fetchPage(from,from+499);
    if(error) throw new Error(error.message);
    rows.push(...(data??[]));
    if(!data||data.length<500) return rows;
  }
}
