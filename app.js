const API = "https://api.frankfurter.dev/v2";
const $ = (id) => document.getElementById(id);
const state = { currencies: [], currencyMap: {}, rateChart: null, range: "3M", latestDate: null };
const fallbackCurrencies = { USD:"United States dollar",EUR:"Euro",GBP:"Pound sterling",JPY:"Japanese yen",MYR:"Malaysian ringgit",SGD:"Singapore dollar",AUD:"Australian dollar",CAD:"Canadian dollar",CHF:"Swiss franc",CNY:"Chinese yuan",INR:"Indian rupee",IDR:"Indonesian rupiah",THB:"Thai baht",PHP:"Philippine peso",KRW:"South Korean won",NZD:"New Zealand dollar",BRL:"Brazilian real",ZAR:"South African rand",AED:"UAE dirham",SAR:"Saudi riyal" };
const flagFor = code => ({USD:"🇺🇸",EUR:"🇪🇺",GBP:"🇬🇧",JPY:"🇯🇵",MYR:"🇲🇾",SGD:"🇸🇬",AUD:"🇦🇺",CAD:"🇨🇦",CHF:"🇨🇭",CNY:"🇨🇳",INR:"🇮🇳",IDR:"🇮🇩",THB:"🇹🇭",PHP:"🇵🇭",KRW:"🇰🇷",NZD:"🇳🇿"})[code] || "🌐";
const number = n => new Intl.NumberFormat(undefined,{maximumFractionDigits:6}).format(n);
async function getJSON(url){const r=await fetch(url);if(!r.ok)throw new Error(`Request failed (${r.status})`);return r.json();}
function fillSelect(el, selected){el.innerHTML="";state.currencies.forEach(c=>{const o=document.createElement("option");o.value=c.code;o.textContent=`${c.code} — ${c.name}`;el.append(o)});if(selected&&state.currencyMap[selected])el.value=selected;}
function setFlags(){$("fromFlag").textContent=flagFor($("fromCurrency").value);$("toFlag").textContent=flagFor($("toCurrency").value);}
async function loadCurrencies(){
 try{
  const data=await getJSON(`${API}/currencies?scope=all`);
  state.currencies=Array.isArray(data)?data.map(x=>({code:x.iso_code||x.code||x.currency,name:x.name||x.iso_code||x.code})).filter(x=>x.code&&x.name):Object.entries(data).map(([code,name])=>({code,name}));
  state.currencies=state.currencies.filter(x=>/^[A-Z]{3}$/.test(x.code)).sort((a,b)=>a.code.localeCompare(b.code));
  if(!state.currencies.length)throw new Error("No currency list returned");
 }catch(e){state.currencies=Object.entries(fallbackCurrencies).map(([code,name])=>({code,name}));$("rateStatus").textContent="Limited fallback currency list";}
 state.currencyMap=Object.fromEntries(state.currencies.map(x=>[x.code,x.name]));
 $("currencyCount").textContent=state.currencies.length+"+";
 fillSelect($("fromCurrency"),"USD");fillSelect($("toCurrency"),"EUR");fillSelect($("chartBase"),"USD");fillSelect($("chartQuote"),"EUR");
 setFlags();await convert();await loadChart();
}
async function convert(){
 const from=$("fromCurrency").value,to=$("toCurrency").value,amount=Number($("amount").value);
 $("converterError").textContent="";
 if(!Number.isFinite(amount)||amount<0){$("converterError").textContent="Enter a valid amount (zero or greater).";return;}
 if(from===to){$("convertedAmount").textContent=number(amount);$("rateLine").textContent=`1 ${from} = 1 ${to}`;return;}
 try{
  const data=await getJSON(`${API}/rate/${from.toLowerCase()}/${to.toLowerCase()}`);
  const result=amount*data.rate;
  $("convertedAmount").textContent=number(result);
  $("rateLine").textContent=`1 ${from} = ${number(data.rate)} ${to}`;
  $("rateDate").textContent=`Rate date: ${data.date||"latest available"}`;
  $("rateStatus").textContent="Reference rates connected";
  state.latestDate=data.date;
 }catch(e){$("convertedAmount").textContent="Unavailable";$("rateLine").textContent="This currency pair is not available from the current data provider."; $("converterError").textContent="Try another pair. Some currencies are not covered by the rate source."; $("rateStatus").textContent="Some pairs unavailable";}
}
function dateDaysAgo(days){const d=new Date();d.setDate(d.getDate()-days);return d.toISOString().slice(0,10)}
function rangeStart(r){const d=new Date();if(r==="1M")d.setMonth(d.getMonth()-1);if(r==="3M")d.setMonth(d.getMonth()-3);if(r==="6M")d.setMonth(d.getMonth()-6);if(r==="1Y")d.setFullYear(d.getFullYear()-1);if(r==="5Y")d.setFullYear(d.getFullYear()-5);return d.toISOString().slice(0,10)}
async function loadChart(){
 const base=$("chartBase").value,quote=$("chartQuote").value;
 $("chartError").textContent="";$("chartPairLabel").textContent=`${base} / ${quote}`;
 if(!base||!quote)return;
 if(base===quote){$("chartError").textContent="Choose two different currencies.";return;}
 try{
  const url=`${API}/rates?from=${rangeStart(state.range)}&to=${dateDaysAgo(0)}&base=${base}&quotes=${quote}&group=${state.range==="1M"?"week":"month"}`;
  const rows=await getJSON(url);
  const valid=rows.filter(x=>x.quote===quote&&Number.isFinite(Number(x.rate))).sort((a,b)=>a.date.localeCompare(b.date));
  if(!valid.length)throw new Error("No historical observations for this pair and period.");
  const labels=valid.map(x=>x.date),values=valid.map(x=>Number(x.rate));
  const first=values[0],last=values[values.length-1],pct=((last-first)/first)*100;
  $("chartLatest").textContent=`${number(last)} ${quote}`;
  $("chartChange").textContent=`${pct>=0?"▲":"▼"} ${Math.abs(pct).toFixed(2)}% over selected period`;
  $("chartChange").style.color=pct>=0?"#638e32":"#c36a5e";
  $("chartFootDate").textContent=`Latest observation: ${labels[labels.length-1]}`;
  if(state.rateChart)state.rateChart.destroy();
  const ctx=$("rateChart").getContext("2d");
  state.rateChart=new Chart(ctx,{type:"line",data:{labels,datasets:[{data:values,borderColor:"#78a943",backgroundColor:"rgba(183,243,107,.16)",fill:true,tension:.28,pointRadius:values.length>60?0:2,pointHoverRadius:5,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${number(c.parsed.y)} ${quote}`}}},interaction:{intersect:false,mode:"index"},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:7,color:"#8d99a8",font:{size:10}}},y:{grid:{color:"#edf0f3"},ticks:{color:"#8d99a8",font:{size:10},callback:v=>number(v)}}}}});
 }catch(e){if(state.rateChart){state.rateChart.destroy();state.rateChart=null;}$("chartLatest").textContent="—";$("chartChange").textContent="Historical data unavailable";$("chartError").textContent=e.message||"Could not load chart data.";}
}
$("convertBtn").addEventListener("click",convert);
$("amount").addEventListener("input",()=>{clearTimeout(window.convertTimer);window.convertTimer=setTimeout(convert,250)});
["fromCurrency","toCurrency"].forEach(id=>$(id).addEventListener("change",()=>{setFlags();convert()}));
$("swapBtn").addEventListener("click",()=>{const a=$("fromCurrency").value;$("fromCurrency").value=$("toCurrency").value;$("toCurrency").value=a;setFlags();convert()});
document.querySelectorAll("[data-pair]").forEach(b=>b.addEventListener("click",()=>{const [a,c]=b.dataset.pair.split("-");$("fromCurrency").value=a;$("toCurrency").value=c;setFlags();convert()}));
["chartBase","chartQuote"].forEach(id=>$(id).addEventListener("change",loadChart));
$("rangeTabs").addEventListener("click",e=>{const b=e.target.closest("button[data-range]");if(!b)return;state.range=b.dataset.range;document.querySelectorAll("#rangeTabs button").forEach(x=>x.classList.toggle("active",x===b));loadChart()});
async function loadCountries(){
 const select=$("countrySelect");
 try{
  const data=await getJSON("https://restcountries.com/v3.1/all?fields=name,cca2,flags,capital,region");
  data.sort((a,b)=>a.name.common.localeCompare(b.name.common));
  select.innerHTML="";
  data.forEach(c=>{const o=document.createElement("option");o.value=c.cca2;o.textContent=c.name.common;o.dataset.flag=c.flags?.png||"";o.dataset.name=c.name.common;select.append(o)});
  select.value="MY";updateCountryFlag();
 }catch(e){select.innerHTML='<option value="MY" data-name="Malaysia">Malaysia</option>';updateCountryFlag();$("placesList").innerHTML='<div class="empty-state">Country directory could not be loaded. Check your connection.</div>';}
}
function updateCountryFlag(){const o=$("countrySelect").selectedOptions[0];$("countryFlag").src=o?.dataset.flag||"https://flagcdn.com/w40/my.png";$("countryFlag").alt=`${o?.dataset.name||"Selected"} flag`;}
$("countrySelect").addEventListener("change",updateCountryFlag);
function escapeHTML(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function findExchangePlaces(){
 const opt=$("countrySelect").selectedOptions[0],country=opt?.dataset.name||opt?.textContent||"";
 const city=$("cityInput").value.trim();$("placesHeading").textContent=city?`Exchange in ${city}`:`Exchange in ${country}`;$("placeCount").textContent="Searching…";
 $("placesList").innerHTML='<div class="empty-state"><div>⌖</div><b>Searching mapped places…</b><span>Looking for currency exchange services in OpenStreetMap.</span></div>';$("mapWrap").classList.add("hidden");
 try{
  const q=city?`${city}, ${country}`:country;
  const geo=await getJSON(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`);
  if(!geo.length)throw new Error("We could not find that country or city. Try another spelling.");
  const place=geo[0],bbox=place.boundingbox.map(Number);
  const south=bbox[0],north=bbox[1],west=bbox[2],east=bbox[3];
  const query=`[out:json][timeout:35];(nwr["currency_exchange"="yes"](${south},${west},${north},${east});nwr["amenity"="bureau_de_change"](${south},${west},${north},${east});nwr["shop"="money_lender"](${south},${west},${north},${east}););out center tags;`;
  const response=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:"data="+encodeURIComponent(query)});
  if(!response.ok)throw new Error("The map service is busy. Please try again in a moment.");
  const data=await response.json(),items=data.elements||[];
  const unique=[...new Map(items.map(x=>[x.type+"/"+x.id,x])).values()].slice(0,60);
  if(!unique.length){$("placesList").innerHTML='<div class="empty-state"><div>⌖</div><b>No mapped exchange offices found</b><span>Try a larger city or nearby capital. This does not mean no exchange services exist there.</span></div>';$("placeCount").textContent="0 mapped places";return;}
  $("placeCount").textContent=`${unique.length} mapped result${unique.length===1?"":"s"}`;
  $("placesList").innerHTML=unique.map(x=>{const t=x.tags||{},name=t.name||t.brand||t.operator||"Currency exchange service",addr=[t["addr:street"],t["addr:city"]||t["addr:town"]||t["addr:suburb"]].filter(Boolean).join(", "),lat=x.lat??x.center?.lat,lon=x.lon??x.center?.lon,link=`https://www.openstreetmap.org/${x.type}/${x.id}`;return `<article class="place-card"><div><h4>${escapeHTML(name)}</h4><p>${escapeHTML(addr||t.opening_hours||"Address or opening hours not listed")}</p><p>${escapeHTML(t.phone||t["contact:phone"]||"Contact details not listed")}</p></div><a href="${link}" target="_blank" rel="noopener">OSM details ↗</a></article>`}).join("");
  const markers=unique.map(x=>{const lat=x.lat??x.center?.lat,lon=x.lon??x.center?.lon;return lat&&lon?`&marker=${lat}%2C${lon}`:""}).join("");
  $("placesMap").src=`https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik`;
  $("mapWrap").classList.remove("hidden");
 }catch(e){$("placeCount").textContent="Search failed";$("placesList").innerHTML=`<div class="empty-state"><div>!</div><b>Could not complete the search</b><span>${escapeHTML(e.message||"Please try again later.")}</span></div>`;}
}
$("findPlaces").addEventListener("click",findExchangePlaces);
$("mobileMenu").addEventListener("click",()=>document.querySelector(".topbar nav").classList.toggle("open"));
document.querySelectorAll(".topbar nav a").forEach(a=>a.addEventListener("click",()=>document.querySelector(".topbar nav").classList.remove("open")));
$("year").textContent=new Date().getFullYear();
loadCountries();loadCurrencies();
