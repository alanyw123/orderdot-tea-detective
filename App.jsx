import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ============================================================
// GLOBAL SHARED STATE
// ============================================================
const Ctx = createContext();
function useG(){return useContext(Ctx);}

const STORES_INIT=[{id:1,name:"信義旗艦店",address:"台北市信義區松仁路28號",phone:"02-2345-6781",hours:"09:00-21:00",revenue:28500,orders:190,cups:312,customers:156,status:"open"},{id:2,name:"忠孝東路店",address:"台北市大安區忠孝東路四段52號",phone:"02-2345-6782",hours:"09:00-21:00",revenue:22100,orders:148,cups:245,customers:121,status:"open"},{id:3,name:"西門町店",address:"台北市萬華區漢中街51號",phone:"02-2345-6783",hours:"10:00-22:00",revenue:18900,orders:125,cups:198,customers:102,status:"open"},{id:4,name:"板橋中山店",address:"新北市板橋區中山路一段46號",phone:"02-2345-6784",hours:"09:00-21:00",revenue:15200,orders:102,cups:168,customers:89,status:"open"},{id:5,name:"中壢SOGO店",address:"桃園市中壢區元化路357號",phone:"03-4567-890",hours:"10:00-21:30",revenue:12800,orders:85,cups:132,customers:72,status:"closed"}];

function GP({children}){
  const[events,setEvents]=useState([{id:1,name:"點數兩倍送",start:"2026-03-10",end:"2026-03-16",multiplier:2,active:true}]);
  const[stores,setStores]=useState(STORES_INIT);
  const[pts,setPts]=useState(50);
  const[totalCups,setTotalCups]=useState(6);
  const[oHist,setOHist]=useState([{id:"A001",date:"2026-03-09 14:32",store:"信義旗艦店",items:["黑糖珍珠鮮奶 x1","茉莉綠茶 x1"],total:110,points:2,status:"completed",itemCount:2},{id:"A002",date:"2026-03-07 10:15",store:"忠孝東路店",items:["紅玉鮮奶茶 x2"],total:140,points:2,status:"completed",itemCount:2}]);
  const[coupons,setCoupons]=useState([{id:3,title:"消費滿$100折$10",code:"SAVE10",expires:"2026-03-15",used:true,type:"cashoff",cashoff:10,minSpend:100}]);
  const[birthdayCouponMonth,setBirthdayCouponMonth]=useState(null); // track which month we've already issued
  const[aOrders,setAOrders]=useState([{id:"B-0147",time:"14:32",store:"信義旗艦店",table:"A-12",items:["黑糖珍珠鮮奶 x1","茉莉綠茶 x1"],total:110,status:"new",isBase:true},{id:"B-0146",time:"14:28",store:"信義旗艦店",table:"B-05",items:["紅玉鮮奶茶 x2"],total:140,status:"preparing",isBase:true},{id:"B-0145",time:"14:25",store:"忠孝東路店",table:"C-03",items:["百香果綠茶 x1","芋頭鮮奶 x1"],total:140,status:"preparing",isBase:true},{id:"B-0144",time:"14:20",store:"西門町店",table:"A-08",items:["櫻花莓果氣泡飲 x3"],total:240,status:"done",isBase:true}]);
  const[selStore,setSelStore]=useState(1);
  const[profile,setProfile]=useState({name:"林小茶",phone:"0912-345-678",email:"",birthday:""});
  const[lastO,setLastO]=useState(null);
  const[cart,setCart]=useState([]);
  const[rewards,setRewards]=useState(RW_INIT);
  const[menuItems,setMenuItems]=useState(MENU_INIT);
  const inEv=useCallback(()=>{const t=new Date().toISOString().slice(0,10);return events.some(e=>e.active&&t>=e.start&&t<=e.end);},[events]);
  const getMul=useCallback(()=>{const t=new Date().toISOString().slice(0,10);const a=events.find(e=>e.active&&t>=e.start&&t<=e.end);return a?a.multiplier:1;},[events]);
  const getEv=useCallback(()=>{const t=new Date().toISOString().slice(0,10);return events.find(e=>e.active&&t>=e.start&&t<=e.end)||null;},[events]);
  const placeO=(order)=>{setOHist(p=>[order,...p]);setPts(p=>p+order.points);setLastO(order);setTotalCups(p=>p+order.itemCount);const ao={id:`B-${String(Math.floor(Math.random()*9000)+1000)}`,time:new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false}),store:stores.find(s=>s.id===selStore)?.name||"",table:`A-${Math.floor(Math.random()*20)+1}`,items:order.items,total:order.total,status:"new",itemRevenues:order.itemRevenues||null};setAOrders(p=>[ao,...p]);setStores(p=>p.map(s=>s.id===selStore?{...s,revenue:s.revenue+order.total,orders:s.orders+1,cups:s.cups+order.itemCount,customers:s.customers+1}:s));
    // Auto-grant monthly free drink coupon when reaching 金茶 (100 cups)
    if(totalCups<100&&totalCups+order.itemCount>=100){setCoupons(p=>[{id:Date.now(),title:"金茶會員專屬：每月免費一杯",code:"GOLD"+Date.now(),expires:"2026-12-31",used:false,type:"redeemed_free"},...p]);}
  };
  const redeem=(r)=>{setPts(p=>p-r.points);
    // Determine coupon type: use reward's configured couponType if available, otherwise infer from name
    let t=r.couponType||"redeemed_free";
    if(!r.couponType){if(r.name.includes("升級"))t="redeemed_upgrade";if(r.name.includes("加料"))t="redeemed_freetopping";if(r.name.includes("半價"))t="redeemed_halfprice";}
    const coupon={id:Date.now(),title:r.name,code:`RDM${Math.floor(Math.random()*9000)+1000}`,expires:"2026-06-30",used:false,type:t};
    // Attach discount/cashoff value
    if(t==="discount")coupon.discount=(r.couponValue||90)/100; // e.g. 90 -> 0.9
    if(t==="cashoff")coupon.cashoff=r.couponValue||10;
    setCoupons(p=>[coupon,...p]);
  };
  const useC=(id)=>setCoupons(p=>p.map(c=>c.id===id?{...c,used:true}:c));
  // Auto-issue birthday coupon when birthday month = current month, remove when not
  useEffect(()=>{
    const now=new Date();const curMonth=now.getMonth();const curYear=now.getFullYear();
    if(!profile.birthday){
      // No birthday set: remove any unused birthday coupon
      setCoupons(p=>p.filter(c=>!(c.type==="bogo"&&c.title.includes("生日")&&!c.used)));
      setBirthdayCouponMonth(null);
      return;
    }
    const bMonth=new Date(profile.birthday).getMonth();
    if(bMonth===curMonth){
      // Birthday month matches: issue coupon if not already issued this month
      if(birthdayCouponMonth!==`${curYear}-${curMonth}`){
        const lastDay=new Date(curYear,curMonth+1,0);
        const expStr=`${curYear}-${String(curMonth+1).padStart(2,"0")}-${String(lastDay.getDate()).padStart(2,"0")}`;
        // Remove any old unused birthday coupons first, then add new one
        setCoupons(p=>[{id:Date.now(),title:"🎂 生日專屬：買一送一",code:"BDAY"+curYear,expires:expStr,used:false,type:"bogo"},...p.filter(c=>!(c.type==="bogo"&&c.title.includes("生日")&&!c.used))]);
        setBirthdayCouponMonth(`${curYear}-${curMonth}`);
      }
    }else{
      // Birthday month doesn't match: remove any unused birthday coupon
      setCoupons(p=>p.filter(c=>!(c.type==="bogo"&&c.title.includes("生日")&&!c.used)));
      setBirthdayCouponMonth(null);
    }
  },[profile.birthday]);
  return <Ctx.Provider value={{events,setEvents,stores,setStores,pts,setPts,totalCups,oHist,coupons,setCoupons,aOrders,setAOrders,selStore,setSelStore,profile,setProfile,lastO,cart,setCart,rewards,setRewards,menuItems,setMenuItems,inEv,getMul,getEv,placeO,redeem,useC}}>{children}</Ctx.Provider>;
}

// ============================================================
// BRAND: 調茶員 Tea Detective
// ============================================================
const P="#2d6a4f",PL="#d8f3dc",AC="#e07a2f",AL="#fef0e0",DK="#1b2a3b",GR="#6b7280",LG="#f3f4f6";
const K={primary:P,primaryLight:PL,accent:AC,accentLight:AL,dark:DK,text:"#374151",gray:GR,lightGray:"#f9fafb",border:"#e5e7eb",success:"#10b981",warning:"#f59e0b",danger:"#ef4444",info:"#3b82f6"};
const BN="調茶員",BE="Tea Detective";

function Logo({size=40}){return <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
  <ellipse cx="50" cy="58" rx="28" ry="32" fill="#4ade80" stroke="#22c55e" strokeWidth="2"/>
  <ellipse cx="50" cy="58" rx="22" ry="26" fill="#86efac"/>
  <path d="M50 35Q50 58 50 82" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
  <path d="M50 48Q38 42 30 46" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  <path d="M50 48Q62 42 70 46" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  <path d="M50 60Q36 56 28 60" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  <path d="M50 60Q64 56 72 60" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  <ellipse cx="50" cy="30" rx="24" ry="6" fill="#8B6914"/>
  <path d="M30 30Q32 14 50 12Q68 14 70 30" fill="#A67C2E"/>
  <ellipse cx="50" cy="30" rx="28" ry="7" fill="#8B6914"/>
  <rect x="28" y="27" width="44" height="5" rx="2" fill="#6B4F10"/>
  <rect x="45" y="27" width="10" height="5" rx="1" fill="#FFD700"/>
  <circle cx="40" cy="50" r="5" fill="#fff"/><circle cx="60" cy="50" r="5" fill="#fff"/>
  <circle cx="41" cy="50" r="3" fill="#1a1a2e"/><circle cx="61" cy="50" r="3" fill="#1a1a2e"/>
  <circle cx="42" cy="49" r="1" fill="#fff"/><circle cx="62" cy="49" r="1" fill="#fff"/>
  <path d="M42 60Q50 67 58 60" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" fill="none"/>
  <circle cx="34" cy="58" r="4" fill="#fca5a5" opacity="0.5"/><circle cx="66" cy="58" r="4" fill="#fca5a5" opacity="0.5"/>
  <circle cx="80" cy="72" r="10" stroke="#8B6914" strokeWidth="3" fill="none"/>
  <circle cx="80" cy="72" r="7" fill="rgba(173,216,230,0.3)"/>
  <line x1="73" y1="79" x2="65" y2="87" stroke="#8B6914" strokeWidth="3" strokeLinecap="round"/>
</svg>;}

// ============================================================
// CONSTANTS
// ============================================================
const CATS=[{id:"signature",name:"招牌必喝",icon:"⭐"},{id:"milk",name:"鮮奶茶系",icon:"🥛"},{id:"fruit",name:"鮮果茶系",icon:"🍊"},{id:"seasonal",name:"季節限定",icon:"🌸"}];
const MENU_INIT=[{id:1,name:"黃金烏龍鮮奶茶",category:"signature",catName:"招牌必喝",price:65,popular:true,desc:"嚴選高山烏龍，搭配小農鮮奶",active:true},{id:2,name:"黑糖珍珠鮮奶",category:"signature",catName:"招牌必喝",price:70,popular:true,desc:"手炒黑糖珍珠，濃郁奶香",active:true},{id:3,name:"茉莉綠茶",category:"signature",catName:"招牌必喝",price:40,desc:"清新茉莉花香",active:true},{id:4,name:"鐵觀音拿鐵",category:"milk",catName:"鮮奶茶系",price:65,desc:"醇厚鐵觀音與綿密奶泡",active:true},{id:5,name:"紅玉鮮奶茶",category:"milk",catName:"鮮奶茶系",price:70,popular:true,desc:"台茶18號紅玉",active:true},{id:6,name:"芋頭鮮奶",category:"milk",catName:"鮮奶茶系",price:75,desc:"大甲芋頭手工熬煮",active:false},{id:7,name:"百香果綠茶",category:"fruit",catName:"鮮果茶系",price:55,popular:true,desc:"酸甜開胃",active:true},{id:8,name:"葡萄柚綠茶",category:"fruit",catName:"鮮果茶系",price:60,desc:"現榨葡萄柚",active:true},{id:9,name:"芒果冰沙",category:"fruit",catName:"鮮果茶系",price:75,desc:"愛文芒果打製",active:true},{id:10,name:"櫻花莓果氣泡飲",category:"seasonal",catName:"季節限定",price:80,popular:true,desc:"春季限定",limited:true,active:true},{id:11,name:"桂花釀烏龍",category:"seasonal",catName:"季節限定",price:65,desc:"春季限定｜桂花蜜香",limited:true,active:true}];
const DRINK_ICON={1:"🥛",2:"🧋",3:"🍃",4:"☕",5:"🥛",6:"🟣",7:"🫧",8:"🍈",9:"🥭",10:"🌸",11:"🌼"};
function getDrinkIcon(id){return DRINK_ICON[id]||"🥤";}
const SZ=[{id:"M",name:"中杯",pd:0},{id:"L",name:"大杯",pd:10}];
const ICE=["正常冰","少冰","微冰","去冰","完全去冰","溫","熱"];
const SUG=["正常糖","少糖","半糖","微糖","無糖"];
const TOP=[{id:"pearl",name:"珍珠",price:10},{id:"coconut",name:"椰果",price:10},{id:"aloe",name:"蘆薈",price:10},{id:"pudding",name:"布丁",price:15},{id:"cheese",name:"芝士奶蓋",price:20}];
const RW_INIT=[{id:2,name:"任意飲品升級大杯",points:5,icon:"⬆️"},{id:3,name:"免費加料券（任選一種）",points:3,icon:"🧋"},{id:4,name:"第二杯半價券",points:8,icon:"🎫"}];
const ML=[{name:"新芽會員",min:0,icon:"🌱"},{name:"金茶會員",min:100,icon:"🏆"}];
function gL(cups){return cups>=100?1:0;}
function Toast({m,s}){if(!s)return null;return <div style={{position:"absolute",top:50,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.8)",color:"#fff",padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:999,pointerEvents:"none"}}>{m}</div>;}

// ============================================================
// CUSTOMER
// ============================================================
function CHome({nav}){
  const{pts,totalCups,inEv,getMul,getEv,stores,selStore,setSelStore,oHist,menuItems}=useG();
  const ie=inEv();const mul=getMul();const ev=getEv();const lv=gL(totalCups);const lvl=ML[lv];const st=stores.find(s=>s.id===selStore);
  const cupsToGold=Math.max(0,100-totalCups);
  const[sp,setSP]=useState(false);
  if(sp)return <div style={{flex:1,overflow:"auto",background:"#fafbfc"}}><div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e5e7eb",background:"#fff"}}><button onClick={()=>setSP(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button><span style={{fontSize:18,fontWeight:800,color:DK}}>選擇門市</span></div><div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>{stores.filter(s=>s.status==="open").map(s=><div key={s.id} onClick={()=>{setSelStore(s.id);setSP(false);}} style={{background:"#fff",borderRadius:14,padding:"16px",border:selStore===s.id?`2px solid ${P}`:"1px solid #f0f0f0",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:15,fontWeight:700,color:DK}}>{s.name}</div><div style={{fontSize:12,color:GR,marginTop:4}}>{s.address}</div></div>{selStore===s.id&&<span style={{color:P,fontWeight:700}}>✓</span>}</div></div>)}</div></div>;
  return <div style={{flex:1,overflow:"auto",background:"#fafbfc"}}>
    <div style={{background:`linear-gradient(135deg,${P} 0%,#40916c 50%,${P} 100%)`,padding:"20px 20px 32px",borderRadius:"0 0 28px 28px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Logo size={44}/><div><div style={{color:"#fff",fontSize:20,fontWeight:800}}>{BN}</div><div style={{color:"rgba(255,255,255,0.5)",fontSize:10}}>{BE}</div></div></div>
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"6px 12px",display:"flex",alignItems:"center",gap:4}}><span>{lvl.icon}</span><span style={{color:"#fff",fontSize:12,fontWeight:600}}>{lvl.name}</span></div>
      </div>
      <button onClick={()=>setSP(true)} style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:14,width:"100%"}}><span style={{color:"#fff",fontSize:13}}>📍</span><span style={{color:"#fff",fontSize:13,fontWeight:600,flex:1,textAlign:"left"}}>{st?.name}</span><span style={{color:"rgba(255,255,255,0.5)",fontSize:12}}>切換 ▾</span></button>
      <div style={{background:"rgba(255,255,255,0.12)",borderRadius:16,padding:"16px 20px",border:"1px solid rgba(255,255,255,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:4}}>目前點數</div><span style={{color:AC,fontSize:36,fontWeight:800}}>{pts}</span><span style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginLeft:4}}>點</span></div>
          <div style={{textAlign:"right"}}><div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginBottom:4}}>集點規則</div><div style={{color:AC,fontSize:15,fontWeight:700}}>每杯集{mul}點</div>{ie&&<div style={{color:"#fbbf24",fontSize:11,marginTop:2}}>🔥 {ev?.name}中</div>}</div>
        </div>
        <div style={{marginTop:12,background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span>{lvl.icon}</span><span style={{color:"#fff",fontSize:12,fontWeight:600}}>{lvl.name}</span></div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:11}}>{lv===1?"🎉 已達最高等級":`${totalCups}/100 杯`}</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.15)",borderRadius:100,height:8,overflow:"hidden"}}>
            <div style={{width:`${Math.min(100,totalCups)}%`,height:"100%",background:`linear-gradient(90deg,${AC},#fbbf24)`,borderRadius:100,transition:"width 0.8s ease"}}/>
          </div>
          {lv===0&&<div style={{color:"rgba(255,255,255,0.6)",fontSize:10,marginTop:4,textAlign:"right"}}>再 {cupsToGold} 杯升級金茶會員 🏆</div>}
        </div>
      </div>
    </div>
    <div style={{display:"flex",gap:12,padding:"20px 20px 0",marginTop:-16}}>
      {[{i:"📱",l:"掃碼點餐",a:()=>nav("menu"),bg:`linear-gradient(135deg,${AC},#c2540a)`},{i:"🎁",l:"兌換獎勵",a:()=>nav("loyalty"),bg:"linear-gradient(135deg,#a78bfa,#7c3aed)"},{i:"🎫",l:"我的票券",a:()=>nav("profile"),bg:"linear-gradient(135deg,#60a5fa,#3b82f6)"}].map((a,idx)=><button key={idx} onClick={a.a} style={{flex:1,background:a.bg,border:"none",borderRadius:16,padding:"18px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8,boxShadow:"0 4px 15px rgba(0,0,0,0.1)"}}><span style={{fontSize:28}}>{a.i}</span><span style={{color:"#fff",fontSize:12,fontWeight:700}}>{a.l}</span></button>)}
    </div>
    {ie&&<div style={{margin:"20px 20px 0",background:`linear-gradient(135deg,${AL},#fff5e0)`,borderRadius:16,padding:16,border:`1px solid ${AC}30`}}><div style={{fontSize:11,color:AC,fontWeight:700,marginBottom:4}}>🔥 限時活動</div><div style={{fontSize:15,fontWeight:800,color:DK}}>{ev?.name}</div><div style={{fontSize:12,color:GR,marginTop:4}}>{ev?.start?.slice(5)} - {ev?.end?.slice(5)} · {ev?.multiplier}倍點數</div></div>}
    <div style={{padding:"20px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:17,fontWeight:800,color:DK}}>人氣推薦</span><button onClick={()=>nav("menu")} style={{background:"none",border:"none",color:P,fontSize:13,fontWeight:600,cursor:"pointer"}}>全部 →</button></div><div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>{menuItems.filter(i=>i.popular&&i.active).slice(0,4).map(it=><div key={it.id} onClick={()=>nav("menu")} style={{minWidth:130,background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",cursor:"pointer",border:"1px solid #f0f0f0"}}><div style={{height:75,background:`linear-gradient(135deg,${PL},#b7e4c7)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{getDrinkIcon(it.id)}</div><div style={{padding:"8px 10px"}}><div style={{fontSize:12,fontWeight:700,color:DK,lineHeight:1.3}}>{it.name}</div><div style={{fontSize:13,fontWeight:800,color:P,marginTop:4}}>${it.price}</div></div></div>)}</div></div>
    {oHist.length>0&&<div style={{padding:"0 20px 24px"}}><span style={{fontSize:17,fontWeight:800,color:DK}}>最近訂單</span>{oHist.slice(0,2).map(o=><div key={o.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginTop:8,border:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:GR,marginBottom:4}}><span>{o.date} · {o.store||""}</span><span style={{color:P,fontWeight:600}}>+{o.points}點</span></div><div style={{fontSize:13,fontWeight:600,color:DK}}>{o.items.join("、")} — ${o.total}</div></div>)}</div>}
  </div>;
}

function CMenu({nav}){
  const{placeO,coupons,useC,inEv,getMul,stores,selStore,cart,setCart,menuItems}=useG();const mul=getMul();const ie=inEv();const st=stores.find(s=>s.id===selStore);
  const[ac,setAC]=useState("signature");const[si,setSI]=useState(null);
  const[sz,setSz]=useState("M");const[ic,setIC]=useState("正常冰");const[sg,setSG]=useState("正常糖");const[tp,setTP]=useState([]);
  const[sc,setSC]=useState(false);const[pl,setPL]=useState(false);const[toast,setT]=useState("");
  const[scp,setSCP]=useState(false);const[cc,setCC]=useState(null);
  const activeMenu=menuItems.filter(i=>i.active);
  const fl=activeMenu.filter(i=>i.category===ac);
  const git=()=>{if(!si)return 0;return si.price+(SZ.find(s=>s.id===sz)?.pd||0)+tp.reduce((s,tid)=>s+(TOP.find(t=>t.id===tid)?.price||0),0);};
  const stt=m=>{setT(m);setTimeout(()=>setT(""),1500);};
  const atc=()=>{if(!si)return;setCart(p=>[...p,{...si,cid:Date.now(),size:sz,ice:ic,sugar:sg,toppings:tp.map(tid=>TOP.find(t=>t.id===tid)),tp:git()}]);setSI(null);setSz("M");setIC("正常冰");setSG("正常糖");setTP([]);stt("✓ 已加入");};
  const ct=cart.reduce((s,i)=>s+i.tp,0);const td=cart.length;const pe=td*mul;
  const avC=coupons.filter(c=>!c.used&&new Date(c.expires)>=new Date());
  const gcd=()=>{if(!cc)return 0;if(cc.type==="discount")return Math.round(ct*(1-cc.discount));if(cc.type==="cashoff")return Math.min(cc.cashoff||0,ct);if(cc.type==="bogo"&&cart.length>=2)return Math.min(...cart.map(c=>c.tp));if(cc.type==="redeemed_free"&&cart.length>=1)return Math.min(...cart.map(c=>c.tp));if(cc.type==="redeemed_freetopping")return 10;if(cc.type==="redeemed_upgrade")return cart.some(c=>c.size==="L")?10:0;if(cc.type==="redeemed_halfprice"&&cart.length>=2)return Math.round(Math.min(...cart.map(c=>c.tp))/2);return 0;};
  const disc=gcd();const ft=Math.max(0,ct-disc);
  const un=cc?.type==="redeemed_upgrade"?(cart.some(c=>c.size==="L")?"折抵大杯升級費 $10":"免費升級大杯"):null;
  const dpl=()=>{setPL(true);const im={};cart.forEach(c=>{im[c.name]=(im[c.name]||0)+1;});const ag=Object.entries(im).map(([n,c])=>`${n} x${c}`);
    // Compute per-item actual revenue for hot items tracking
    const itemRevs={};cart.forEach(c=>{itemRevs[c.name]=(itemRevs[c.name]||0)+c.tp;});
    // Apply coupon discount to specific items
    if(cc&&disc>0){
      if(cc.type==="redeemed_halfprice"&&cart.length>=2){
        // Half price on cheapest item only
        const cheapest=cart.reduce((min,c)=>c.tp<min.tp?c:min,cart[0]);
        itemRevs[cheapest.name]=itemRevs[cheapest.name]-Math.round(cheapest.tp/2);
      }else if(cc.type==="bogo"&&cart.length>=2){
        // Buy one get one: cheapest item free
        const cheapest=cart.reduce((min,c)=>c.tp<min.tp?c:min,cart[0]);
        itemRevs[cheapest.name]=itemRevs[cheapest.name]-cheapest.tp;
      }else if(cc.type==="redeemed_upgrade"&&cart.some(c=>c.size==="L")){
        // Upgrade refund $10 from one L item
        const lItem=cart.find(c=>c.size==="L");
        if(lItem)itemRevs[lItem.name]=itemRevs[lItem.name]-10;
      }else if(cc.type==="cashoff"){
        // Cash off: deduct from highest priced item
        const highest=cart.reduce((max,c)=>c.tp>max.tp?c:max,cart[0]);
        itemRevs[highest.name]=itemRevs[highest.name]-Math.min(disc,itemRevs[highest.name]);
      }else if(cc.type==="discount"){
        // Percentage discount: each item proportionally
        Object.keys(itemRevs).forEach(k=>{itemRevs[k]=Math.round(itemRevs[k]*cc.discount);});
      }
    }
    const o={id:`A${String(Math.floor(Math.random()*9000)+1000)}`,date:new Date().toLocaleString("zh-TW",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).replace(/\//g,"-"),store:st?.name,items:ag,total:ft,points:pe,status:"completed",itemCount:cart.length,couponUsed:cc?.title||null,itemRevenues:itemRevs};if(cc)useC(cc.id);setTimeout(()=>{placeO(o);setSC(false);setCart([]);setCC(null);setTimeout(()=>setPL(false),300);nav("tracking");},1500);};

  // Item detail
  if(si)return <div style={{flex:1,overflow:"auto",background:"#fff",position:"relative"}}><Toast m={toast} s={!!toast}/><div style={{height:170,background:`linear-gradient(135deg,${PL},#b7e4c7)`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}><span style={{fontSize:70}}>{getDrinkIcon(si.id)}</span><button onClick={()=>setSI(null)} style={{position:"absolute",top:12,left:12,width:36,height:36,borderRadius:"50%",background:"rgba(0,0,0,0.3)",border:"none",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button></div><div style={{padding:"20px 20px 120px"}}><div style={{fontSize:22,fontWeight:800,color:DK}}>{si.name}</div><div style={{fontSize:13,color:GR,marginTop:4}}>{si.desc}</div><div style={{fontSize:12,color:P,marginTop:4,fontWeight:600}}>🪙 集{mul}點{ie?" 🔥":""}</div>
    <div style={{marginTop:20}}><div style={{fontSize:15,fontWeight:700,marginBottom:10}}>容量</div><div style={{display:"flex",gap:10}}>{SZ.map(s=><button key={s.id} onClick={()=>setSz(s.id)} style={{flex:1,padding:"12px",borderRadius:12,border:sz===s.id?`2px solid ${P}`:"2px solid #e5e7eb",background:sz===s.id?PL:"#fff",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:sz===s.id?P:DK}}>{s.name}</div><div style={{fontSize:12,color:GR,marginTop:2}}>{s.pd>0?`+$${s.pd}`:"基本"}</div></button>)}</div></div>
    <div style={{marginTop:16}}><div style={{fontSize:15,fontWeight:700,marginBottom:10}}>甜度</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{SUG.map(s=><button key={s} onClick={()=>setSG(s)} style={{padding:"8px 14px",borderRadius:100,border:sg===s?`2px solid ${P}`:"2px solid #e5e7eb",background:sg===s?PL:"#fff",cursor:"pointer",fontSize:13,fontWeight:sg===s?700:400,color:sg===s?P:DK}}>{s}</button>)}</div></div>
    <div style={{marginTop:16}}><div style={{fontSize:15,fontWeight:700,marginBottom:10}}>冰塊</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{ICE.map(s=><button key={s} onClick={()=>setIC(s)} style={{padding:"8px 14px",borderRadius:100,border:ic===s?`2px solid ${P}`:"2px solid #e5e7eb",background:ic===s?PL:"#fff",cursor:"pointer",fontSize:13,fontWeight:ic===s?700:400,color:ic===s?P:DK}}>{s}</button>)}</div></div>
    <div style={{marginTop:16}}><div style={{fontSize:15,fontWeight:700,marginBottom:10}}>加料</div>{TOP.map(t=>{const sel=tp.includes(t.id);return <button key={t.id} onClick={()=>setTP(p=>sel?p.filter(x=>x!==t.id):[...p,t.id])} style={{display:"flex",justifyContent:"space-between",width:"100%",padding:"12px 16px",borderRadius:12,border:sel?`2px solid ${P}`:"2px solid #e5e7eb",background:sel?PL:"#fff",cursor:"pointer",marginBottom:8}}><span style={{fontSize:14,fontWeight:sel?700:400,color:sel?P:DK}}>{t.name}</span><span style={{fontSize:13,color:GR}}>+${t.price}</span></button>;})}</div>
  </div><div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #e5e7eb",padding:"12px 20px 20px",display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:24,fontWeight:800}}>${git()}</div><button onClick={atc} style={{flex:1,background:P,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer"}}>加入購物車</button></div></div>;

  // Coupon picker
  if(scp)return <div style={{flex:1,overflow:"auto",background:"#fafbfc"}}><div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e5e7eb",background:"#fff"}}><button onClick={()=>setSCP(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button><span style={{fontSize:18,fontWeight:800}}>選擇票券</span></div><div style={{padding:"16px 20px"}}><div onClick={()=>{setCC(null);setSCP(false);}} style={{background:"#fff",borderRadius:14,padding:"16px",marginBottom:10,border:!cc?`2px solid ${P}`:"1px solid #f0f0f0",cursor:"pointer"}}><span style={{fontSize:14,fontWeight:600}}>🚫 不使用票券</span></div>{avC.map(c=>{const is=cc?.id===c.id;let ok=true,re="";if(c.type==="cashoff"&&ct<(c.minSpend||0)){ok=false;re=`需$${c.minSpend}`;}if((c.type==="bogo"||c.type==="redeemed_halfprice")&&cart.length<2){ok=false;re="需2杯以上";}return <div key={c.id} onClick={()=>{if(ok){setCC(c);setSCP(false);}}} style={{background:"#fff",borderRadius:14,padding:"16px",marginBottom:10,border:is?`2px solid ${P}`:"1px solid #f0f0f0",cursor:ok?"pointer":"default",opacity:ok?1:0.5}}><div style={{fontSize:14,fontWeight:600,color:DK}}>🎫 {c.title}</div><div style={{fontSize:12,color:GR,marginTop:4}}>期限：{c.expires}</div>{!ok&&<div style={{fontSize:11,color:K.danger,marginTop:2}}>{re}</div>}</div>;})}</div></div>;

  // Cart
  if(sc)return <div style={{flex:1,overflow:"auto",background:"#fafbfc",position:"relative"}}><div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e5e7eb",background:"#fff"}}><button onClick={()=>setSC(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button><span style={{fontSize:18,fontWeight:800}}>購物車</span></div><div style={{margin:"16px 20px",background:"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid #f0f0f0"}}><div style={{fontSize:14,fontWeight:700}}>📍 {BN} {st?.name}</div></div>
    {pl?<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 20px",gap:16}}><div style={{fontSize:64}}>✅</div><div style={{fontSize:20,fontWeight:800}}>訂單已送出！</div></div>:<>
      <div style={{padding:"0 20px"}}>{cart.map(it=><div key={it.cid} style={{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:10,border:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:15,fontWeight:700}}>{it.name}</div><div style={{fontSize:12,color:GR,marginTop:4}}>{SZ.find(s=>s.id===it.size)?.name}/{it.sugar}/{it.ice}</div>{it.toppings.length>0&&<div style={{fontSize:12,color:P,marginTop:2}}>+{it.toppings.map(t=>t.name).join("、")}</div>}</div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700}}>${it.tp}</span><button onClick={()=>setCart(p=>p.filter(c=>c.cid!==it.cid))} style={{background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#ef4444",fontSize:14}}>✕</button></div></div></div>)}</div>
      <div onClick={()=>setSCP(true)} style={{margin:"10px 20px",background:"#fff",borderRadius:14,padding:"14px 16px",border:cc?`2px solid ${P}`:`1px dashed ${AC}`,cursor:"pointer"}}>{cc?<div><div style={{fontSize:13,color:P,fontWeight:700}}>🎫 {cc.title}</div>{un&&<div style={{fontSize:11,color:AC,marginTop:2}}>{un}</div>}{disc>0&&<div style={{fontSize:13,color:K.danger,marginTop:2}}>-${disc}</div>}</div>:<span style={{fontSize:13,color:GR}}>🎫 使用優惠券 {avC.length>0?`(${avC.length}張)`:""}</span>}</div>
      <div style={{margin:"10px 20px 120px",background:"#fff",borderRadius:14,padding:"16px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:GR}}><span>小計（{td}杯）</span><span>${ct}</span></div>{disc>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:K.danger}}><span>折抵</span><span>-${disc}</span></div>}{cc?.type==="redeemed_upgrade"&&!cart.some(c=>c.size==="L")&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:P}}><span>免費升級</span><span>$0</span></div>}<div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14,color:P}}><span>點數{ie?` (🔥${mul}倍)`:""}</span><span>+{pe}點</span></div><div style={{borderTop:"1px solid #e5e7eb",paddingTop:10,display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:800}}><span>合計</span><span>${ft}</span></div></div>
      <div style={{position:"absolute",bottom:58,left:0,right:0,padding:"12px 20px",background:"#fff",borderTop:"1px solid #e5e7eb"}}><button onClick={dpl} style={{width:"100%",background:P,color:"#fff",border:"none",borderRadius:14,padding:"16px",fontSize:17,fontWeight:700,cursor:"pointer"}}>確認送出 ${ft}</button></div>
    </>}</div>;

  // Menu list
  return <div style={{flex:1,overflow:"auto",background:"#fafbfc",position:"relative"}}><Toast m={toast} s={!!toast}/><div style={{padding:"16px 20px 12px",background:"#fff"}}><div style={{fontSize:12,color:GR}}>📍 {BN} {st?.name}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><div style={{fontSize:20,fontWeight:800}}>菜單</div>{ie&&<div style={{fontSize:11,color:AC,fontWeight:700,background:AL,padding:"4px 10px",borderRadius:100}}>🔥 每杯{mul}點</div>}</div></div>
    <div style={{display:"flex",gap:8,padding:"0 20px 12px",overflowX:"auto",background:"#fff",borderBottom:"1px solid #f0f0f0"}}>{CATS.map(c=><button key={c.id} onClick={()=>setAC(c.id)} style={{padding:"8px 14px",borderRadius:100,border:"none",background:ac===c.id?P:LG,color:ac===c.id?"#fff":DK,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{c.icon} {c.name}</button>)}</div>
    <div style={{padding:"16px 20px 100px",display:"flex",flexDirection:"column",gap:10}}>{fl.map(it=><div key={it.id} onClick={()=>setSI(it)} style={{background:"#fff",borderRadius:16,padding:"14px",display:"flex",gap:14,cursor:"pointer",border:"1px solid #f0f0f0"}}><div style={{width:60,height:60,borderRadius:12,background:`linear-gradient(135deg,${PL},#b7e4c7)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{getDrinkIcon(it.id)}</div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14,fontWeight:700}}>{it.name}</span>{it.popular&&<span style={{fontSize:9,fontWeight:700,color:"#ef4444",background:"#fee2e2",padding:"2px 5px",borderRadius:100}}>人氣</span>}{it.limited&&<span style={{fontSize:9,fontWeight:700,color:"#ec4899",background:"#fce7f3",padding:"2px 5px",borderRadius:100}}>限定</span>}</div><div style={{fontSize:12,color:GR,marginTop:3}}>{it.desc}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}><span style={{fontSize:16,fontWeight:800,color:P}}>${it.price}</span><div style={{width:24,height:24,borderRadius:"50%",background:P,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14}}>+</div></div></div></div>)}</div>
    {cart.length>0&&<div onClick={()=>setSC(true)} style={{position:"absolute",bottom:64,left:20,right:20,background:P,borderRadius:16,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",boxShadow:`0 4px 20px rgba(45,106,79,0.35)`}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{background:"rgba(255,255,255,0.2)",width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700}}>{cart.length}</div><span style={{color:"#fff",fontSize:14,fontWeight:700}}>購物車</span></div><span style={{color:"#fff",fontSize:16,fontWeight:800}}>${ct}</span></div>}
  </div>;
}

function CLoy(){const{pts,totalCups,redeem,inEv,getMul,getEv,rewards}=useG();const mul=getMul();const ie=inEv();const ev=getEv();const pr=pts%10;const lv=gL(totalCups);const lvl=ML[lv];const[cf,setCF]=useState(null);const[ok,setOK]=useState("");const dr=()=>{if(!cf)return;redeem(cf);setOK(cf.name);setCF(null);setTimeout(()=>setOK(""),2000);};
  return <div style={{flex:1,overflow:"auto",background:"#fafbfc",position:"relative"}}><Toast m={ok?`✓ 已兌換「${ok}」`:""} s={!!ok}/>{cf&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#fff",borderRadius:20,padding:24,maxWidth:300,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>{cf.icon}</div><div style={{fontSize:17,fontWeight:800,marginBottom:8}}>確認兌換？</div><div style={{fontSize:14,color:GR,marginBottom:4}}>{cf.name}</div><div style={{fontSize:14,color:K.danger,fontWeight:600,marginBottom:20}}>扣除{cf.points}點</div><div style={{display:"flex",gap:10}}><button onClick={()=>setCF(null)} style={{flex:1,padding:12,borderRadius:12,border:"1px solid #ccc",background:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>取消</button><button onClick={dr} style={{flex:1,padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>確認</button></div></div></div>}
    <div style={{padding:"16px 20px 12px",background:"#fff",borderBottom:"1px solid #f0f0f0"}}><div style={{fontSize:20,fontWeight:800}}>集點卡</div></div>
    <div style={{margin:"16px 20px",background:`linear-gradient(135deg,${P},#40916c)`,borderRadius:20,padding:"24px 20px"}}><div style={{color:"rgba(255,255,255,0.8)",fontSize:13,marginBottom:16}}>每杯集{mul}點{ie?` (🔥 ${ev?.name}中)`:""} · 集滿10點兌好禮</div><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>{Array.from({length:10}).map((_,i)=><div key={i} style={{aspectRatio:"1",borderRadius:"50%",background:i<pr?AC:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,border:i<pr?"none":"2px dashed rgba(255,255,255,0.3)"}}>{i<pr?"⭐":<span style={{color:"rgba(255,255,255,0.3)",fontSize:13}}>{i+1}</span>}</div>)}</div><div style={{marginTop:16,textAlign:"center",color:"#fff"}}>目前 <span style={{fontWeight:800,color:AC,fontSize:20}}>{pts}</span> 點</div></div>
    {/* Member level */}
    <div style={{margin:"0 20px 16px",background:"#fff",borderRadius:14,padding:"14px 16px",border:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:24}}>{lvl.icon}</span><div><div style={{fontSize:14,fontWeight:700}}>{lvl.name}</div><div style={{fontSize:12,color:GR}}>已消費 {totalCups} 杯</div></div></div>{lv===0?<div style={{textAlign:"right"}}><div style={{fontSize:12,color:AC,fontWeight:600}}>再 {100-totalCups} 杯升級</div><div style={{fontSize:10,color:GR}}>金茶會員享每月免費一杯</div></div>:<div style={{fontSize:12,color:AC,fontWeight:700}}>🏆 每月免費一杯</div>}</div></div>
    <div style={{padding:"0 20px 24px"}}><div style={{fontSize:17,fontWeight:800,marginBottom:12}}>可兌換獎勵</div>{rewards.map(r=>{const can=pts>=r.points;return <div key={r.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:10,border:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:30}}>{r.icon}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{r.name}</div><div style={{fontSize:12,color:GR}}>{r.points}點</div></div><button onClick={()=>{if(can)setCF(r);}} style={{padding:"8px 16px",borderRadius:100,border:"none",background:can?P:"#e5e7eb",color:can?"#fff":"#9ca3af",fontSize:12,fontWeight:700,cursor:can?"pointer":"default"}}>{can?"兌換":"不足"}</button></div>;})}</div>
  </div>;
}

function COrd(){const{oHist}=useG();return <div style={{flex:1,overflow:"auto",background:"#fafbfc"}}><div style={{padding:"16px 20px 12px",background:"#fff",borderBottom:"1px solid #f0f0f0"}}><div style={{fontSize:20,fontWeight:800}}>訂單紀錄</div></div>{oHist.length===0?<div style={{padding:60,textAlign:"center"}}><div style={{fontSize:48}}>📭</div><div style={{fontSize:16,fontWeight:700,marginTop:12}}>還沒有訂單</div></div>:<div style={{padding:"16px 20px 24px",display:"flex",flexDirection:"column",gap:10}}>{oHist.map(o=><div key={o.id} style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #f0f0f0"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:14,fontWeight:700}}>#{o.id}</span><span style={{fontSize:11,fontWeight:600,color:P,background:PL,padding:"3px 10px",borderRadius:100}}>已完成</span></div><div style={{fontSize:12,color:GR,marginBottom:4}}>{o.date} · {o.store||""}</div>{o.items.map((i,idx)=><div key={idx} style={{fontSize:14,padding:"2px 0"}}>{i}</div>)}{o.couponUsed&&<div style={{fontSize:12,color:AC,marginTop:4}}>🎫 {o.couponUsed}</div>}<div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:"1px solid #f0f0f0"}}><span style={{fontSize:13,color:P,fontWeight:600}}>+{o.points}點</span><span style={{fontSize:16,fontWeight:800}}>${o.total}</span></div></div>)}</div>}</div>;}

const TEA_FORTUNES=[
  {fortune:"大吉",msg:"今天喝茶的你，運氣跟珍珠一樣圓滿！記得買彩券 🎰",icon:"🔮"},
  {fortune:"中吉",msg:"你的桃花運跟奶蓋一樣濃厚，但小心別被甜到蛀牙 💕",icon:"🌸"},
  {fortune:"小吉",msg:"今天適合告白，成功率跟你選半糖一樣——剛剛好 😏",icon:"💌"},
  {fortune:"吉",msg:"你的老闆今天心情好，就像你點的茶一樣順口，適合提加薪 💰",icon:"📈"},
  {fortune:"大吉",msg:"今天的你比珍珠還Q彈！什麼困難都會反彈回去 💪",icon:"✨"},
  {fortune:"中吉",msg:"別人是喝水都會胖，你是喝茶都會美 ✨ 科學認證（才怪）",icon:"💅"},
  {fortune:"小吉",msg:"你今天的腦袋跟烏龍茶一樣清醒，適合做重大決定（除了再點一杯）",icon:"🧠"},
  {fortune:"吉",msg:"愛情就像手搖飲——太甜膩、太淡無味，你要找到你的半糖 ❤️",icon:"🥤"},
  {fortune:"大吉",msg:"今日幸運色：茶色。幸運數字：你的點數餘額 😂",icon:"🍀"},
  {fortune:"中吉",msg:"你的魅力跟我們的茶一樣——讓人喝了還想再來 😎",icon:"🌟"},
  {fortune:"小吉",msg:"你今天會遇到一個重要的人...就是等等來做你飲料的店員 👋",icon:"😆"},
  {fortune:"大吉",msg:"恭喜！你抽到隱藏籤——代表你今天特別適合請朋友喝飲料 🎁",icon:"🎊"},
  {fortune:"中吉",msg:"你的減肥計畫就像去冰一樣——說說而已，反正明天又會點正常冰 🤫",icon:"🏃"},
];

function CTrk({nav}){const{lastO,inEv,getMul,stores,selStore,profile,menuItems}=useG();const mul=getMul();const ie=inEv();const[s,setS]=useState(0);const[fortune]=useState(()=>TEA_FORTUNES[Math.floor(Math.random()*TEA_FORTUNES.length)]);const[showCard,setShowCard]=useState(false);useEffect(()=>{const a=setTimeout(()=>setS(1),2000),b=setTimeout(()=>setS(2),5000);return()=>{clearTimeout(a);clearTimeout(b);};},[]);
  const orderIcons=lastO?lastO.items.map(it=>{const name=it.replace(/\s*x\d+$/,"");const mi=menuItems.find(m=>m.name===name);return mi?getDrinkIcon(mi.id):"🥤";}).slice(0,3):["🥤"];
  const iconDisplay=orderIcons.join(" ");
  const stName=stores.find(x=>x.id===selStore)?.name||"";
  const today=new Date();const dateStr=`${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
  const timeStr=today.toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",hour12:false});
  const drinkNames=lastO?lastO.items.map(it=>it.replace(/\s*x\d+$/,"")):[];
  const steps=[{l:"訂單已接收",i:"📋"},{l:"製作中",i:iconDisplay},{l:"完成取餐",i:"✅"}];

  // IG-style drink card modal
  if(showCard)return <div style={{flex:1,overflow:"auto",background:"#111",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{width:"100%",maxWidth:320,borderRadius:24,overflow:"hidden",background:`linear-gradient(160deg,${P} 0%,#1b4332 30%,#2d6a4f 60%,#40916c 100%)`,position:"relative"}}>
      {/* Top bar */}
      <div style={{padding:"16px 20px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:6}}><Logo size={22}/><span style={{color:"#fff",fontSize:12,fontWeight:700}}>{BN}</span></div><span style={{color:"rgba(255,255,255,0.5)",fontSize:10}}>{dateStr}</span></div>
      {/* Drink icons */}
      <div style={{textAlign:"center",padding:"20px 0 10px"}}><div style={{fontSize:64,lineHeight:1}}>{orderIcons.join(" ")}</div></div>
      {/* Drink names */}
      <div style={{textAlign:"center",padding:"0 20px"}}>{drinkNames.map((dn,i)=><div key={i} style={{color:"#fff",fontSize:16,fontWeight:800,lineHeight:1.6}}>{dn}</div>)}</div>
      {/* Divider */}
      <div style={{margin:"16px 20px",height:1,background:"rgba(255,255,255,0.15)"}}/>
      {/* Fortune */}
      <div style={{textAlign:"center",padding:"0 24px 8px"}}><div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:6}}>🔮 今日調茶運勢</div><div style={{display:"inline-block",background:"rgba(255,255,255,0.15)",padding:"3px 12px",borderRadius:100,marginBottom:8}}><span style={{color:"#fbbf24",fontSize:13,fontWeight:800}}>{fortune.fortune}</span></div><div style={{color:"rgba(255,255,255,0.85)",fontSize:12,lineHeight:1.6}}>{fortune.msg}</div></div>
      {/* Bottom */}
      <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{color:"rgba(255,255,255,0.4)",fontSize:9}}>📍 {stName} · {timeStr}</div><div style={{color:"rgba(255,255,255,0.4)",fontSize:9}}>{profile.name}</div></div>
      {/* Decorative circles */}
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.15)"}}/>
      <div style={{position:"absolute",bottom:40,left:-15,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
    </div>
    <div style={{marginTop:16,fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>📸 截圖分享給朋友吧！</div>
    <button onClick={()=>nav("home")} style={{marginTop:12,padding:"10px 32px",borderRadius:12,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>返回首頁</button>
  </div>;

  return <div style={{flex:1,overflow:"auto",background:"#fafbfc"}}><div style={{padding:"16px 20px 12px",background:"#fff",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:12}}><button onClick={()=>nav("home")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button><span style={{fontSize:18,fontWeight:800}}>訂單追蹤</span></div><div style={{padding:30,textAlign:"center"}}><div style={{fontSize:s===1?48:60}}>{steps[s].i}</div><div style={{fontSize:22,fontWeight:800,marginTop:12}}>{steps[s].l}</div>{s===1&&lastO&&<div style={{marginTop:12,fontSize:13,color:GR}}>{lastO.items.join("、")}</div>}</div>{lastO&&<div style={{textAlign:"center",padding:"10px 20px"}}><div style={{fontSize:13,color:P,fontWeight:600,background:PL,display:"inline-block",padding:"8px 16px",borderRadius:100}}>🎉 +{lastO.points}點（{lastO.itemCount}杯{ie?` · ${mul}倍🔥`:""}）</div></div>}
    {s===2&&<div style={{margin:"10px 20px"}}>
      {/* Fortune card */}
      <div style={{background:`linear-gradient(135deg,#fff8e1,#ffecb3)`,borderRadius:16,padding:"20px",textAlign:"center",border:"1px solid #ffd54f",marginBottom:12}}><div style={{fontSize:11,color:AC,fontWeight:700,marginBottom:4}}>🔮 今日調茶運勢籤</div><div style={{fontSize:32,marginBottom:8}}>{fortune.icon}</div><div style={{display:"inline-block",background:AC,color:"#fff",padding:"4px 14px",borderRadius:100,fontSize:13,fontWeight:800,marginBottom:10}}>{fortune.fortune}</div><div style={{fontSize:14,color:DK,lineHeight:1.6,fontWeight:500}}>{fortune.msg}</div></div>
      {/* Generate drink card button */}
      <button onClick={()=>setShowCard(true)} style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${DK},#2d3748)`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 15px rgba(0,0,0,0.2)"}}><span style={{fontSize:18}}>📸</span>生成今日飲品卡</button>
      <div style={{textAlign:"center",marginTop:8,fontSize:11,color:GR}}>精美卡片，截圖分享給朋友！</div>
    </div>}
  </div>;}

function CPro(){const{coupons,profile,setProfile}=useG();const[ef,setEF]=useState(null);const[ev,setEV]=useState("");const[sp,setSP]=useState(null);const fl={name:"姓名",phone:"手機",email:"Email",birthday:"生日"};
  if(ef)return <div style={{flex:1,background:"#fafbfc"}}><div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e5e7eb",background:"#fff"}}><button onClick={()=>setEF(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button><span style={{fontSize:18,fontWeight:800}}>編輯{fl[ef]}</span></div><div style={{padding:20}}><input value={ev} onChange={e=>setEV(e.target.value)} style={{width:"100%",padding:"14px 16px",borderRadius:12,border:`2px solid ${P}`,fontSize:15,outline:"none",boxSizing:"border-box"}} type={ef==="email"?"email":ef==="birthday"?"date":"text"}/><button onClick={()=>{setProfile(p=>({...p,[ef]:ev}));setEF(null);}} style={{width:"100%",marginTop:16,padding:14,borderRadius:12,border:"none",background:P,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>儲存</button></div></div>;
  if(sp==="faq")return <div style={{flex:1,background:"#fafbfc"}}><div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e5e7eb",background:"#fff"}}><button onClick={()=>setSP(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button><span style={{fontSize:18,fontWeight:800}}>常見問題</span></div><div style={{padding:20}}>{[{q:"如何集點？",a:"每買一杯即可累積點數。"},{q:"如何兌換？",a:"前往集點頁選擇獎勵。"}].map((f,i)=><div key={i} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:10,border:"1px solid #f0f0f0"}}><div style={{fontWeight:700}}>Q: {f.q}</div><div style={{color:GR,marginTop:4}}>A: {f.a}</div></div>)}</div></div>;
  if(sp==="about")return <div style={{flex:1,background:"#fafbfc"}}><div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #e5e7eb",background:"#fff"}}><button onClick={()=>setSP(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer"}}>←</button><span style={{fontSize:18,fontWeight:800}}>關於{BN}</span></div><div style={{padding:20,textAlign:"center"}}><Logo size={80}/><div style={{fontSize:20,fontWeight:800,marginTop:12}}>{BN}</div><div style={{fontSize:12,color:GR}}>{BE}</div><div style={{fontSize:13,color:GR,marginTop:12,lineHeight:1.8}}>我們是茶飲界的偵探，用心調查每一片茶葉的秘密，為您調配最完美的一杯。</div></div></div>;
  return <div style={{flex:1,overflow:"auto",background:"#fafbfc"}}><div style={{padding:"24px 20px",background:"#fff",borderBottom:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:16}}><div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${P},${AC})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,fontWeight:700}}>{profile.name[0]}</div><div><div style={{fontSize:18,fontWeight:800}}>{profile.name}</div><div style={{fontSize:13,color:GR}}>{profile.phone}</div></div></div>
    <div style={{padding:"16px 20px"}}><div style={{fontWeight:700,marginBottom:12}}>我的票券</div>{coupons.map(c=><div key={c.id} style={{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:8,border:c.used?"1px solid #e5e7eb":`1px solid ${AC}40`,opacity:c.used?0.5:1,position:"relative",overflow:"hidden"}}>{c.used&&<div style={{position:"absolute",top:10,right:-20,transform:"rotate(30deg)",background:"#9ca3af",color:"#fff",fontSize:10,padding:"2px 30px",fontWeight:700}}>已使用</div>}<div style={{fontWeight:700}}>{c.title}</div><div style={{fontSize:12,color:GR,marginTop:4}}>期限：{c.expires}</div></div>)}
      <div style={{marginTop:24}}><div style={{fontWeight:700,marginBottom:12}}>個人資料</div>{[{l:"姓名",v:profile.name,f:"name"},{l:"手機",v:profile.phone,f:"phone"},{l:"Email",v:profile.email||"尚未設定",f:"email"},{l:"生日",v:profile.birthday||"尚未設定",f:"birthday"}].map(i=><div key={i.f} onClick={()=>{setEV(profile[i.f]||"");setEF(i.f);}} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",border:"1px solid #f0f0f0",cursor:"pointer"}}><div><div style={{fontSize:12,color:GR}}>{i.l}</div><div style={{marginTop:2}}>{i.v}</div></div><span style={{color:"#d1d5db"}}>→</span></div>)}</div>
      <div style={{marginTop:24}}><div style={{fontWeight:700,marginBottom:12}}>設定</div>
        {[{l:"常見問題",a:()=>setSP("faq")},{l:"關於"+BN,a:()=>setSP("about")}].map((i,idx)=><div key={idx} onClick={i.a} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",border:"1px solid #f0f0f0",cursor:"pointer"}}><span>{i.l}</span><span style={{color:"#d1d5db"}}>→</span></div>)}</div>
    </div>
  </div>;
}

function CCart({nav}){
  const{cart,setCart,stores,selStore}=useG();const st=stores.find(s=>s.id===selStore);
  const total=cart.reduce((s,i)=>s+i.tp,0);
  return <div style={{flex:1,overflow:"auto",background:"#fafbfc"}}>
    <div style={{padding:"16px 20px 12px",background:"#fff",borderBottom:"1px solid #f0f0f0"}}><div style={{fontSize:20,fontWeight:800}}>購物車</div><div style={{fontSize:12,color:GR,marginTop:4}}>📍 調茶員 {st?.name}</div></div>
    {cart.length===0?<div style={{padding:60,textAlign:"center"}}><div style={{fontSize:48}}>🛒</div><div style={{fontSize:16,fontWeight:700,marginTop:12}}>購物車是空的</div><div style={{fontSize:13,color:GR,marginTop:4}}>去點餐頁面選購飲品吧</div><button onClick={()=>nav("menu")} style={{marginTop:16,padding:"10px 24px",borderRadius:12,border:"none",background:P,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>前往點餐</button></div>
    :<div style={{padding:"16px 20px 24px"}}><div style={{fontSize:13,color:GR,marginBottom:12}}>共 {cart.length} 杯飲品</div>
      {cart.map(item=><div key={item.cid} style={{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:10,border:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${PL},#b7e4c7)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{getDrinkIcon(item.id)}</div>
            <div><div style={{fontSize:14,fontWeight:700}}>{item.name}</div><div style={{fontSize:11,color:GR,marginTop:2}}>{SZ.find(s=>s.id===item.size)?.name} / {item.sugar} / {item.ice}</div>{item.toppings.length>0&&<div style={{fontSize:11,color:P,marginTop:2}}>+{item.toppings.map(t=>t.name).join("、")}</div>}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:15,fontWeight:700}}>${item.tp}</span>
            <button onClick={()=>setCart(p=>p.filter(c=>c.cid!==item.cid))} style={{background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#ef4444",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </div>
      </div>)}
      <div style={{background:"#fff",borderRadius:14,padding:16,marginTop:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800}}><span>小計</span><span>${total}</span></div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={()=>setCart([])} style={{flex:1,padding:"12px",borderRadius:12,border:`1px solid ${K.border}`,background:"#fff",color:K.text,fontSize:14,fontWeight:600,cursor:"pointer"}}>清空購物車</button>
        <button onClick={()=>nav("menu")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:P,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>前往結帳</button>
      </div>
    </div>}
  </div>;
}

function CApp({pg,setPG}){const{cart}=useG();const[animClass,setAnimClass]=useState("fadeIn");const prevPg=useCallback((id)=>{setAnimClass("fadeOut");setTimeout(()=>{setPG(id);setAnimClass("fadeIn");},150);},[setPG]);
  const r=()=>{switch(pg){case"home":return <CHome nav={prevPg}/>;case"menu":return <CMenu nav={prevPg}/>;case"cart":return <CCart nav={prevPg}/>;case"loyalty":return <CLoy/>;case"orders":return <COrd/>;case"tracking":return <CTrk nav={prevPg}/>;case"profile":return <CPro/>;default:return <CHome nav={prevPg}/>;}};const n=["home","menu","cart","loyalty","orders","profile"].includes(pg)?pg:"home";const tabs=[{id:"home",i:"🏠",l:"首頁"},{id:"menu",i:"📋",l:"點餐"},{id:"cart",i:"🛒",l:"購物車"},{id:"loyalty",i:"💎",l:"集點"},{id:"orders",i:"📦",l:"訂單"},{id:"profile",i:"👤",l:"我的"}];
  return <div style={{width:"100%",maxWidth:375,height:812,background:"#fff",borderRadius:44,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",overflow:"hidden",position:"relative",display:"flex",flexDirection:"column"}}>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-8px)}}.fadeIn{animation:fadeIn 0.2s ease-out}.fadeOut{animation:fadeOut 0.15s ease-in}`}</style>
    <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:160,height:30,background:DK,borderRadius:"0 0 20px 20px",zIndex:50}}><div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",width:60,height:5,background:"#333",borderRadius:100}}/></div><div style={{padding:"8px 20px 4px",fontSize:13,fontWeight:600,color:DK,display:"flex",justifyContent:"space-between"}}><span>14:32</span><div style={{width:25,height:12,border:`1.5px solid ${DK}`,borderRadius:3,display:"flex",alignItems:"center",padding:1}}><div style={{width:"75%",height:"100%",background:DK,borderRadius:1.5}}/></div></div><div key={pg} className={animClass} style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>{r()}</div>{pg!=="tracking"&&<div style={{display:"flex",borderTop:"1px solid #e5e7eb",background:"#fff",paddingBottom:8,paddingTop:6}}>{tabs.map(t=><button key={t.id} onClick={()=>prevPg(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",position:"relative"}}><span style={{fontSize:20,filter:n===t.id?"none":"grayscale(1)",opacity:n===t.id?1:0.5}}>{t.i}</span>{t.id==="cart"&&cart.length>0&&<div style={{position:"absolute",top:-2,right:"50%",marginRight:-16,background:K.danger,color:"#fff",fontSize:9,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{cart.length}</div>}<span style={{fontSize:10,fontWeight:n===t.id?700:400,color:n===t.id?P:GR}}>{t.l}</span></button>)}</div>}<div style={{height:20,display:"flex",justifyContent:"center",alignItems:"center"}}><div style={{width:134,height:5,background:DK,borderRadius:100}}/></div></div>;
}

// ============================================================
// ADMIN
// ============================================================
const BASE_WR={一:64200,二:72800,三:58500,四:81200,五:42400,六:115800,日:97500};
const DAY_NAMES=["日","一","二","三","四","五","六"];
const BASE_HR={9:48,10:112,11:180,12:248,13:220,14:192,15:208,16:152,17:168,18:140,19:112,20:72};
// Fixed yesterday values for comparison
const YESTERDAY={revenue:82600,orders:568,customers:470};
const CS=[{name:"招牌必喝",value:35,color:P},{name:"鮮奶茶系",value:28,color:"#40916c"},{name:"鮮果茶系",value:22,color:AC},{name:"季節限定",value:15,color:"#ec4899"}];
const TI=[{name:"黑糖珍珠鮮奶",sold:1170,revenue:81900},{name:"黃金烏龍鮮奶茶",sold:990,revenue:64350},{name:"紅玉鮮奶茶",sold:880,revenue:61600},{name:"百香果綠茶",sold:825,revenue:45375},{name:"櫻花莓果氣泡飲",sold:710,revenue:56800}];
// Menu items are now shared via context (menuItems)
const CL=["招牌必喝","鮮奶茶系","鮮果茶系","季節限定"];
// Members data is now dynamic in AMem component

function Mod({title,onClose,children,width}){return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,width:width||480,maxHeight:"80vh",overflow:"auto",padding:24}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><div style={{fontSize:18,fontWeight:800}}>{title}</div><button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:GR}}>✕</button></div>{children}</div></div>;}
function FF({label,value,onChange,type,options,placeholder}){if(type==="select")return <div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{label}</div><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${K.border}`,fontSize:14,outline:"none"}}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>;return <div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{label}</div><input type={type||"text"} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${K.border}`,fontSize:14,outline:"none",boxSizing:"border-box"}}/></div>;}

function ASide({act,nav}){const its=[{id:"dashboard",i:"📊",l:"總覽"},{id:"orders",i:"📋",l:"訂單"},{id:"menu",i:"🍵",l:"菜單"},{id:"loyalty",i:"💎",l:"活動"},{id:"stores",i:"🏪",l:"門市"},{id:"members",i:"👥",l:"會員"}];
  return <div style={{background:DK,padding:"6px 0 10px",display:"flex",justifyContent:"space-around",flexShrink:0}}>{its.map(i=><button key={i.id} onClick={()=>nav(i.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}><span style={{fontSize:18,filter:act===i.id?"none":"grayscale(1)",opacity:act===i.id?1:0.5}}>{i.i}</span><span style={{fontSize:9,fontWeight:act===i.id?700:400,color:act===i.id?"#fff":"rgba(255,255,255,0.5)"}}>{i.l}</span></button>)}</div>;}

function ADash(){const{stores,inEv,getMul,aOrders,menuItems}=useG();const mul=getMul();const ie=inEv();
  const tR=stores.reduce((s,x)=>s+x.revenue,0);const tO=stores.reduce((s,x)=>s+x.orders,0);const tC=stores.reduce((s,x)=>s+x.customers,0);const tCups=stores.reduce((s,x)=>s+x.cups,0);const tP=tCups*mul;
  // Yesterday comparison - fixed base, so percentage changes as today's numbers grow
  const yR=YESTERDAY.revenue;const yO=YESTERDAY.orders;const yC=YESTERDAY.customers;const yCups=920;const yP=yCups*mul;
  const pct=(t,y)=>{if(y===0)return"+0%";const d=Math.round((t-y)/y*100);return d>=0?`+${d}%`:`${d}%`;};
  const isUp=(t,y)=>t>=y;
  // Weekly revenue chart - match actual days, today shows live revenue
  const today=new Date();const todayDay=today.getDay();// 0=Sun
  const weekData=DAY_NAMES.slice(1).concat(DAY_NAMES[0]).map((dayName,i)=>{
    // Map: 一=1,二=2,...六=6,日=0
    const dayNum=i<6?i+1:0;
    const isToday=dayNum===todayDay;
    return{day:dayName,revenue:isToday?tR:(BASE_WR[dayName]||0),isToday};
  });
  // Hourly orders chart - live update, distribute new orders into current hour
  const curHour=today.getHours();
  // Count new order transactions (1 order = 1 regardless of cups)
  const newOrderCount=aOrders.filter(o=>!o.isBase).length;
  // Base hourly - distribute tO across hours proportionally, ensuring exact total
  const baseHrTotal=Object.values(BASE_HR).reduce((s,v)=>s+v,0);
  const entries=Object.entries(BASE_HR);
  let remaining=tO;
  const hourData=entries.map(([h,v],i)=>{
    const hr=parseInt(h);
    const isLast=i===entries.length-1;
    const proportion=v/baseHrTotal;
    // For current hour, add new orders
    const extra=hr===curHour?newOrderCount:0;
    const baseAlloc=isLast?remaining-extra:Math.round((tO-newOrderCount)*proportion);
    if(!isLast)remaining-=baseAlloc;else remaining=0;
    return{hour:String(hr).padStart(2,"0"),訂單數:Math.max(0,baseAlloc+extra)};
  });
  // Daily report
  const[showReport,setShowReport]=useState(false);const[reportRange,setReportRange]=useState("7");
  const reportData=Array.from({length:Number(reportRange)}).map((_,i)=>{const d=new Date();d.setDate(d.getDate()-i);const ds=d.toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"});const rv=i===0?tR:Math.round(tR*(0.7+Math.random()*0.6));const od=i===0?tO:Math.round(tO*(0.7+Math.random()*0.6));return{date:ds,revenue:rv,orders:od};}).reverse();
  // Dynamic hot items: base + revenue from new customer orders
  // Hot items: base TI + per-item revenue from NEW customer orders only (not initial base orders)
  const extraRev={};aOrders.filter(o=>!o.isBase).forEach(o=>{
    if(o.itemRevenues){
      // Use precise per-item revenue data (already accounts for coupons)
      Object.entries(o.itemRevenues).forEach(([name,rev])=>{extraRev[name]=(extraRev[name]||0)+rev;});
    }else{
      // Fallback for base orders without itemRevenues: use order total proportionally
      const parsed=o.items.map(it=>{const m=it.match(/^(.+?)\s*x(\d+)$/);return m?{name:m[1],qty:parseInt(m[2])}:null;}).filter(Boolean);
      const totalMP=parsed.reduce((s,p)=>{const mi=menuItems.find(m=>m.name===p.name);return s+(mi?mi.price*p.qty:0);},0);
      if(totalMP>0)parsed.forEach(p=>{const mi=menuItems.find(m=>m.name===p.name);if(mi){extraRev[p.name]=(extraRev[p.name]||0)+(mi.price*p.qty/totalMP)*o.total;}});
    }
  });
  const hotItems=TI.map(it=>({...it,revenue:Math.round(it.revenue+(extraRev[it.name]||0))})).sort((a,b)=>b.revenue-a.revenue);
  return <div style={{padding:"18px 20px 24px",overflow:"auto",flex:1}}>
    {showReport&&<Mod title="營收日報表" onClose={()=>setShowReport(false)} width={560}>
      <div style={{display:"flex",gap:6,marginBottom:16}}>{["7","14","30"].map(d=><button key={d} onClick={()=>setReportRange(d)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:reportRange===d?P:LG,color:reportRange===d?"#fff":K.text,fontSize:12,fontWeight:600,cursor:"pointer"}}>近{d}天</button>)}</div>
      <ResponsiveContainer width="100%" height={200}><BarChart data={reportData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" tick={{fontSize:9,fill:GR}}/><YAxis tick={{fontSize:9,fill:GR}}/><Tooltip/><Bar dataKey="revenue" fill={P} radius={[4,4,0,0]} name="營收"/></BarChart></ResponsiveContainer>
      <div style={{marginTop:16,background:LG,borderRadius:10,padding:12}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}><div><div style={{fontSize:16,fontWeight:800,color:P}}>${reportData.reduce((s,d)=>s+d.revenue,0).toLocaleString()}</div><div style={{fontSize:10,color:GR}}>總營收</div></div><div><div style={{fontSize:16,fontWeight:800}}>{reportData.reduce((s,d)=>s+d.orders,0).toLocaleString()}</div><div style={{fontSize:10,color:GR}}>總訂單</div></div><div><div style={{fontSize:16,fontWeight:800}}>${Math.round(reportData.reduce((s,d)=>s+d.revenue,0)/reportData.length).toLocaleString()}</div><div style={{fontSize:10,color:GR}}>日均營收</div></div></div></div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={()=>setShowReport(false)} style={{width:"100%",padding:10,borderRadius:10,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>關閉</button>
      </div>
    </Mod>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h1 style={{fontSize:20,fontWeight:800,margin:0}}>數據總覽</h1><p style={{fontSize:12,color:GR,margin:"4px 0 0"}}>全品牌（{stores.length}間）{ie&&<span style={{color:AC,fontWeight:700,marginLeft:6}}>🔥 {mul}倍送中</span>}</p></div><button onClick={()=>setShowReport(true)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:P,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>📊 營收日報表</button></div>
    <div style={{display:"flex",gap:10,marginBottom:16}}>{[{i:"💰",l:"今日營收",v:`$${tR.toLocaleString()}`,y:yR},{i:"📦",l:"訂單",v:tO.toLocaleString(),y:yO},{i:"👤",l:"來客",v:tC.toLocaleString(),y:yC},{i:"⭐",l:`點數${ie?" (x"+mul+")":""}`,v:tP.toLocaleString(),y:yP}].map((s,i)=><div key={i} style={{background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`,flex:1}}><div style={{fontSize:16,marginBottom:8}}>{s.i}</div><div style={{fontSize:22,fontWeight:800}}>{s.v}</div><div style={{fontSize:11,color:GR,marginTop:2}}>{s.l}</div><div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}><span style={{fontSize:10,fontWeight:700,color:isUp(parseInt(s.v.replace(/[$,]/g,"")),s.y)?K.success:K.danger,background:isUp(parseInt(s.v.replace(/[$,]/g,"")),s.y)?"#d1fae5":"#fee2e2",padding:"2px 6px",borderRadius:100}}>{pct(parseInt(s.v.replace(/[$,]/g,"")),s.y)}</span><span style={{fontSize:9,color:GR}}>較昨日</span></div></div>)}</div>
    <div style={{display:"flex",gap:10,marginBottom:16}}><div style={{flex:2,background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`}}><div style={{fontSize:14,fontWeight:700,marginBottom:8}}>本週營收</div><ResponsiveContainer width="100%" height={180}><BarChart data={weekData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="day" tick={{fontSize:10,fill:GR}}/><YAxis tick={{fontSize:10,fill:GR}}/><Tooltip formatter={(v)=>[`$${v.toLocaleString()}`,"營收"]}/><Bar dataKey="revenue" radius={[4,4,0,0]}>{weekData.map((e,i)=><Cell key={i} fill={e.isToday?AC:P}/>)}</Bar></BarChart></ResponsiveContainer><div style={{fontSize:9,color:GR,textAlign:"center",marginTop:4}}>🟠 = 今日（即時）</div></div><div style={{flex:1,background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`}}><div style={{fontSize:14,fontWeight:700,marginBottom:8}}>品類銷售佔比</div>{(()=>{const total=CS.reduce((s,c)=>s+c.value,0);const cx=90,cy=80,R=62,r=30;let cumAngle=-90;return <svg width="180" height="160" viewBox="0 0 180 160">{CS.map((c,i)=>{const angle=(c.value/total)*360;const startAngle=cumAngle;const endAngle=cumAngle+angle;const midAngle=startAngle+angle/2;cumAngle=endAngle;const toRad=a=>a*Math.PI/180;const x1=cx+R*Math.cos(toRad(startAngle));const y1=cy+R*Math.sin(toRad(startAngle));const x2=cx+R*Math.cos(toRad(endAngle));const y2=cy+R*Math.sin(toRad(endAngle));const ix1=cx+r*Math.cos(toRad(endAngle));const iy1=cy+r*Math.sin(toRad(endAngle));const ix2=cx+r*Math.cos(toRad(startAngle));const iy2=cy+r*Math.sin(toRad(startAngle));const large=angle>180?1:0;const d=`M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${ix1} ${iy1} A${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`;const labelR=(R+r)/2;const lx=cx+labelR*Math.cos(toRad(midAngle));const ly=cy+labelR*Math.sin(toRad(midAngle));return <g key={i}><path d={d} fill={c.color}/><text x={lx} y={ly-5} textAnchor="middle" dominantBaseline="central" fill="#fff" stroke="#00000040" strokeWidth="0.3" style={{fontSize:9,fontWeight:800}}>{c.name}</text><text x={lx} y={ly+7} textAnchor="middle" dominantBaseline="central" fill="#fff" stroke="#00000040" strokeWidth="0.3" style={{fontSize:9,fontWeight:700}}>{c.value}%</text></g>;})}</svg>;})()}</div></div>
    <div style={{display:"flex",gap:10,marginBottom:16}}><div style={{flex:1,background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`}}><div style={{fontSize:14,fontWeight:700,marginBottom:10}}>熱銷</div>{hotItems.map((it,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<hotItems.length-1?`1px solid ${K.border}`:"none"}}><span style={{fontSize:12,fontWeight:600}}>{i+1}. {it.name}</span><span style={{fontSize:12,fontWeight:700}}>${it.revenue.toLocaleString()}</span></div>)}</div><div style={{flex:1,background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`}}><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>今日訂單時段</div><div style={{fontSize:10,color:GR,marginBottom:8}}>全時段合計：{tO} 筆</div><ResponsiveContainer width="100%" height={200}><LineChart data={hourData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="hour" tick={{fontSize:10,fill:GR}}/><YAxis tick={{fontSize:10,fill:GR}}/><Tooltip formatter={(v)=>[`${v} 筆`,"訂單數"]}/><Line type="monotone" dataKey="訂單數" stroke={P} strokeWidth={2} dot={{fill:P,r:2}}/></LineChart></ResponsiveContainer></div></div>
    <div style={{background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:14,fontWeight:700}}>各門市</div>{ie&&<span style={{fontSize:10,color:AC,background:AL,padding:"2px 8px",borderRadius:100}}>×{mul}</span>}</div><div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><div style={{minWidth:420}}><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 70px",gap:4,padding:"6px 0",borderBottom:`1px solid ${K.border}`,fontSize:10,color:GR,fontWeight:600}}><span>門市</span><span style={{textAlign:"right"}}>營收</span><span style={{textAlign:"right"}}>訂單</span><span style={{textAlign:"right"}}>點數</span><span style={{textAlign:"right"}}>狀態</span></div>{stores.map(s=><div key={s.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 70px",gap:4,padding:"8px 0",borderBottom:`1px solid ${K.border}`,alignItems:"center"}}><div style={{fontSize:12,fontWeight:600}}>{s.name}</div><div style={{textAlign:"right",fontSize:12,fontWeight:700}}>${s.revenue.toLocaleString()}</div><div style={{textAlign:"right",fontSize:12}}>{s.orders}</div><div style={{textAlign:"right",fontSize:12,color:P,fontWeight:600}}>{(s.orders*mul).toLocaleString()}</div><div style={{textAlign:"right"}}><span style={{fontSize:9,color:s.status==="open"?K.success:GR,background:s.status==="open"?"#d1fae5":"#f3f4f6",padding:"2px 6px",borderRadius:100}}>{s.status==="open"?"營業":"休息"}</span></div></div>)}</div></div></div>
  </div>;
}

function AOrd(){const{aOrders,setAOrders,stores}=useG();const[fl,setFL]=useState("all");const[storeFL,setStoreFL]=useState("all");const sm={new:{l:"新訂單",c:K.danger,bg:"#fee2e2"},preparing:{l:"製作中",c:K.warning,bg:"#fef3c7"},done:{l:"已完成",c:K.success,bg:"#d1fae5"}};let fd=storeFL==="all"?aOrders:aOrders.filter(o=>o.store===storeFL);fd=fl==="all"?fd:fd.filter(o=>o.status===fl);const upd=(id,ns)=>setAOrders(p=>p.map(o=>o.id===id?{...o,status:ns}:o));
  return <div style={{padding:"18px 20px 24px",overflow:"auto",flex:1}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}><h1 style={{fontSize:20,fontWeight:800,margin:0}}>訂單管理</h1><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{[{id:"all",l:"全部"},{id:"new",l:"新訂單"},{id:"preparing",l:"製作中"},{id:"done",l:"已完成"}].map(x=><button key={x.id} onClick={()=>setFL(x.id)} style={{padding:"5px 12px",borderRadius:8,border:"none",background:fl===x.id?P:LG,color:fl===x.id?"#fff":K.text,fontSize:11,fontWeight:600,cursor:"pointer"}}>{x.l}</button>)}</div></div>
    <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}><button onClick={()=>setStoreFL("all")} style={{padding:"4px 10px",borderRadius:6,border:storeFL==="all"?`2px solid ${P}`:`1px solid ${K.border}`,background:storeFL==="all"?PL:"#fff",color:storeFL==="all"?P:GR,fontSize:10,fontWeight:600,cursor:"pointer"}}>全部門市</button>{stores.map(s=><button key={s.id} onClick={()=>setStoreFL(s.name)} style={{padding:"4px 10px",borderRadius:6,border:storeFL===s.name?`2px solid ${P}`:`1px solid ${K.border}`,background:storeFL===s.name?PL:"#fff",color:storeFL===s.name?P:GR,fontSize:10,fontWeight:600,cursor:"pointer"}}>{s.name}</button>)}</div>
    {fd.map(o=>{const s=sm[o.status];return <div key={o.id} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:8,border:o.status==="new"?`2px solid ${K.danger}`:`1px solid ${K.border}`,position:"relative"}}>{o.status==="new"&&<div style={{position:"absolute",top:-1,right:14,background:K.danger,color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:"0 0 6px 6px"}}>🔔 新</div>}<div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><span style={{fontSize:14,fontWeight:800}}>#{o.id}</span><span style={{fontSize:10,fontWeight:600,color:s.c,background:s.bg,padding:"2px 6px",borderRadius:100,marginLeft:6}}>{s.l}</span><div style={{fontSize:11,color:GR,marginTop:4}}>{o.store} · {o.table} · {o.time}</div></div><div style={{fontSize:16,fontWeight:800}}>${o.total}</div></div><div style={{background:LG,borderRadius:8,padding:"8px 10px",marginBottom:8}}>{o.items.map((it,i)=><div key={i} style={{fontSize:12}}>{it}</div>)}</div><div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>{o.status==="new"&&<><button onClick={()=>upd(o.id,"done")} style={{padding:"5px 14px",borderRadius:6,border:`1px solid ${K.border}`,background:"#fff",fontSize:11,cursor:"pointer"}}>拒絕</button><button onClick={()=>upd(o.id,"preparing")} style={{padding:"5px 14px",borderRadius:6,border:"none",background:P,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>接受</button></>}{o.status==="preparing"&&<button onClick={()=>upd(o.id,"done")} style={{padding:"5px 14px",borderRadius:6,border:"none",background:K.success,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>完成</button>}{o.status==="done"&&<span style={{fontSize:11,color:GR}}>✓</span>}</div></div>;})}
  </div>;
}

function AMenu(){const{menuItems,setMenuItems}=useG();const[ei,setEI]=useState(null);const[sa,setSA]=useState(false);const[ni,setNI]=useState({name:"",category:"招牌必喝",price:""});const[dc,setDC]=useState(null);
  const catMap={"招牌必喝":"signature","鮮奶茶系":"milk","鮮果茶系":"fruit","季節限定":"seasonal"};
  return <div style={{padding:"18px 20px 24px",overflow:"auto",flex:1}}>{ei&&<Mod title="編輯" onClose={()=>setEI(null)}><FF label="名稱" value={ei.name} onChange={v=>setEI({...ei,name:v})}/><FF label="分類" value={ei.catName||"招牌必喝"} onChange={v=>setEI({...ei,catName:v,category:catMap[v]||"signature"})} type="select" options={CL}/><FF label="售價" value={ei.price} onChange={v=>setEI({...ei,price:Number(v)||0})} type="number"/><button onClick={()=>{setMenuItems(p=>p.map(i=>i.id===ei.id?ei:i));setEI(null);}} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>儲存</button></Mod>}{sa&&<Mod title="新增" onClose={()=>setSA(false)}><FF label="名稱" value={ni.name} onChange={v=>setNI({...ni,name:v})}/><FF label="分類" value={ni.category} onChange={v=>setNI({...ni,category:v})} type="select" options={CL}/><FF label="售價" value={ni.price} onChange={v=>setNI({...ni,price:v})} type="number"/><button onClick={()=>{if(!ni.name||!ni.price)return;setMenuItems(p=>[...p,{id:Date.now(),name:ni.name,category:catMap[ni.category]||"signature",catName:ni.category,price:Number(ni.price),desc:"新品項",active:true}]);setNI({name:"",category:"招牌必喝",price:""});setSA(false);}} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>新增</button></Mod>}{dc&&<Mod title="刪除確認" onClose={()=>setDC(null)} width={360}><p>確定刪除「{menuItems.find(i=>i.id===dc)?.name}」？</p><div style={{display:"flex",gap:10,marginTop:16}}><button onClick={()=>setDC(null)} style={{flex:1,padding:10,borderRadius:10,border:`1px solid ${K.border}`,background:"#fff",cursor:"pointer"}}>取消</button><button onClick={()=>{setMenuItems(p=>p.filter(i=>i.id!==dc));setDC(null);}} style={{flex:1,padding:10,borderRadius:10,border:"none",background:K.danger,color:"#fff",fontWeight:600,cursor:"pointer"}}>刪除</button></div></Mod>}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><h1 style={{fontSize:20,fontWeight:800,margin:0}}>菜單管理</h1><button onClick={()=>setSA(true)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:P,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ 新增</button></div>
    <div style={{background:"#fff",borderRadius:12,border:`1px solid ${K.border}`,overflow:"hidden"}}>{menuItems.map(i=><div key={i.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`1px solid ${K.border}`}}><div><div style={{fontSize:13,fontWeight:600}}>{i.name}</div><div style={{fontSize:11,color:GR}}>{i.catName||i.category} · ${i.price}</div></div><div style={{display:"flex",alignItems:"center",gap:6}}><button onClick={()=>setMenuItems(p=>p.map(x=>x.id===i.id?{...x,active:!x.active}:x))} style={{width:36,height:20,borderRadius:10,border:"none",background:i.active?K.success:"#d1d5db",cursor:"pointer",position:"relative"}}><div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:i.active?19:3,transition:"all 0.2s"}}/></button><button onClick={()=>setEI({...i})} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${K.border}`,background:"#fff",fontSize:10,cursor:"pointer"}}>編輯</button><button onClick={()=>setDC(i.id)} style={{padding:"4px 8px",borderRadius:6,border:"none",background:"#fee2e2",color:K.danger,fontSize:10,cursor:"pointer"}}>刪除</button></div></div>)}</div>
  </div>;
}

function ALoy(){const{events,setEvents,inEv,getMul,rewards,setRewards}=useG();const mul=getMul();const ie=inEv();const[erw,setERW]=useState(null);const[sar,setSAR]=useState(false);const[nr,setNR]=useState({name:"",points:"",icon:"🎁",couponType:"discount",couponValue:"90"});const[ee,setEE]=useState(null);const[sae,setSAE]=useState(false);const[ne,setNE]=useState({name:"",start:"",end:"",multiplier:"2"});
  const couponTypes=[{id:"discount",label:"打折（例：90=九折）"},{id:"cashoff",label:"折抵金額（例：10=折$10）"},{id:"bogo",label:"買一送一"},{id:"redeemed_free",label:"免費一杯"},{id:"redeemed_upgrade",label:"免費升級大杯"},{id:"redeemed_freetopping",label:"免費加料"},{id:"redeemed_halfprice",label:"第二杯半價"}];
  return <div style={{padding:"18px 20px 24px",overflow:"auto",flex:1}}>
    {erw&&<Mod title="編輯獎勵" onClose={()=>setERW(null)} width={400}><FF label="名稱" value={erw.name} onChange={v=>setERW({...erw,name:v})}/><FF label="點數" value={erw.points} onChange={v=>setERW({...erw,points:Number(v)||0})} type="number"/><FF label="圖示" value={erw.icon} onChange={v=>setERW({...erw,icon:v})}/><button onClick={()=>{setRewards(p=>p.map(r=>r.id===erw.id?{...erw,redeemed:r.redeemed||0}:r));setERW(null);}} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>儲存（即時連動顧客端）</button></Mod>}
    {sar&&<Mod title="新增獎勵" onClose={()=>setSAR(false)} width={400}><FF label="獎勵名稱" value={nr.name} onChange={v=>setNR({...nr,name:v})} placeholder="例：全品項九折券"/><FF label="所需點數" value={nr.points} onChange={v=>setNR({...nr,points:v})} type="number" placeholder="10"/><FF label="圖示（emoji）" value={nr.icon} onChange={v=>setNR({...nr,icon:v})}/><div style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:600,marginBottom:6}}>券的效果</div><select value={nr.couponType} onChange={e=>setNR({...nr,couponType:e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${K.border}`,fontSize:14,outline:"none"}}>{couponTypes.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>{(nr.couponType==="discount"||nr.couponType==="cashoff")&&<FF label={nr.couponType==="discount"?"折扣數值（90=打九折，80=打八折）":"折抵金額"} value={nr.couponValue} onChange={v=>setNR({...nr,couponValue:v})} type="number" placeholder={nr.couponType==="discount"?"90":"10"}/>}<button onClick={()=>{if(!nr.name||!nr.points)return;setRewards(p=>[...p,{id:Date.now(),name:nr.name,points:Number(nr.points),icon:nr.icon||"🎁",couponType:nr.couponType,couponValue:Number(nr.couponValue)||0,redeemed:0}]);setNR({name:"",points:"",icon:"🎁",couponType:"discount",couponValue:"90"});setSAR(false);}} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>新增（即時連動顧客端）</button></Mod>}
    {ee&&<Mod title="編輯活動" onClose={()=>setEE(null)} width={400}><FF label="名稱" value={ee.name} onChange={v=>setEE({...ee,name:v})}/><FF label="開始" value={ee.start} onChange={v=>setEE({...ee,start:v})} type="date"/><FF label="結束" value={ee.end} onChange={v=>setEE({...ee,end:v})} type="date"/><FF label="倍率" value={ee.multiplier} onChange={v=>setEE({...ee,multiplier:Number(v)||1})} type="number"/><button onClick={()=>{setEvents(p=>p.map(e=>e.id===ee.id?ee:e));setEE(null);}} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>儲存（即時連動）</button></Mod>}
    {sae&&<Mod title="新增活動" onClose={()=>setSAE(false)} width={400}><FF label="名稱" value={ne.name} onChange={v=>setNE({...ne,name:v})}/><FF label="開始" value={ne.start} onChange={v=>setNE({...ne,start:v})} type="date"/><FF label="結束" value={ne.end} onChange={v=>setNE({...ne,end:v})} type="date"/><FF label="倍率" value={ne.multiplier} onChange={v=>setNE({...ne,multiplier:v})} type="number"/><button onClick={()=>{if(!ne.name)return;setEvents(p=>[...p,{...ne,id:Date.now(),multiplier:Number(ne.multiplier)||2,active:true}]);setNE({name:"",start:"",end:"",multiplier:"2"});setSAE(false);}} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>新增</button></Mod>}
    <h1 style={{fontSize:20,fontWeight:800,margin:"0 0 16px"}}>集點活動</h1>
    <div style={{background:`linear-gradient(135deg,${AL},#fff5e0)`,borderRadius:12,padding:14,border:`1px solid ${AC}30`,marginBottom:16}}><div style={{fontWeight:700,marginBottom:8}}>限時活動</div>{events.map(ev=>{const t=new Date().toISOString().slice(0,10);const on=ev.active&&t>=ev.start&&t<=ev.end;return <div key={ev.id} style={{marginBottom:8}}><span style={{fontSize:10,color:on?K.success:GR,background:on?"#d1fae5":"#f3f4f6",padding:"2px 6px",borderRadius:100}}>{on?"進行中":"未啟用"}</span><div style={{fontSize:15,fontWeight:800,marginTop:4}}>🔥 {ev.name}</div><div style={{fontSize:11,color:GR}}>{ev.start} - {ev.end} · ×{ev.multiplier}</div><button onClick={()=>setEE({...ev})} style={{marginTop:6,padding:"5px 12px",borderRadius:8,border:"none",background:AC,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>編輯</button></div>;})}</div>
    <div style={{background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontWeight:700}}>兌換獎勵</span><button onClick={()=>setSAR(true)} style={{padding:"5px 12px",borderRadius:6,border:"none",background:P,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>+ 新增</button></div>{rewards.map((r,i)=><div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<rewards.length-1?`1px solid ${K.border}`:"none"}}><div><div style={{fontSize:13,fontWeight:600}}>{r.icon} {r.name}</div><div style={{fontSize:11,color:GR}}>{r.points}點</div></div><button onClick={()=>setERW({...r})} style={{padding:"3px 10px",borderRadius:6,border:`1px solid ${K.border}`,background:"#fff",fontSize:10,cursor:"pointer"}}>編輯</button></div>)}</div>
  </div>;
}

function ASto(){const{stores,setStores}=useG();const[es,setES]=useState(null);const[qr,setQR]=useState(null);
  // Generate unique QR pattern per store
  const qrGen=(seed)=>{const cells=[];const h=(n)=>{let x=n;x=((x>>16)^x)*0x45d9f3b;x=((x>>16)^x)*0x45d9f3b;x=(x>>16)^x;return x;};for(let row=0;row<21;row++)for(let col=0;col<21;col++){const inFinder=(row<7&&col<7)||(row<7&&col>13)||(row>13&&col<7);if(!inFinder&&h(seed*1000+row*21+col)%3===0)cells.push({x:col,y:row});}return cells;};
  const sz=5;const off=5;
  const qrStore=qr?stores.find(s=>s.id===qr):null;const qrCells=qr?qrGen(qr):[];
  return <div style={{padding:"18px 20px 24px",overflow:"auto",flex:1}}>
    {es&&<Mod title={`編輯${es.name}`} onClose={()=>setES(null)}><FF label="名稱" value={es.name} onChange={v=>setES({...es,name:v})}/><FF label="地址" value={es.address} onChange={v=>setES({...es,address:v})}/><FF label="電話" value={es.phone} onChange={v=>setES({...es,phone:v})}/><FF label="營業時間" value={es.hours} onChange={v=>setES({...es,hours:v})}/><FF label="狀態" value={es.status} onChange={v=>setES({...es,status:v})} type="select" options={["open","closed"]}/><button onClick={()=>{setStores(p=>p.map(s=>s.id===es.id?es:s));setES(null);}} style={{width:"100%",padding:12,borderRadius:12,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>儲存</button></Mod>}
    {qrStore&&<Mod title={`${qrStore.name} QRcode`} onClose={()=>setQR(null)} width={320}>
      <div style={{textAlign:"center",padding:"10px 0"}}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <rect width="140" height="140" fill="#fff"/>
          <rect x={off} y={off} width={sz*7} height={sz*7} fill="#000"/><rect x={off+sz} y={off+sz} width={sz*5} height={sz*5} fill="#fff"/><rect x={off+sz*2} y={off+sz*2} width={sz*3} height={sz*3} fill="#000"/>
          <rect x={off+sz*14} y={off} width={sz*7} height={sz*7} fill="#000"/><rect x={off+sz*15} y={off+sz} width={sz*5} height={sz*5} fill="#fff"/><rect x={off+sz*16} y={off+sz*2} width={sz*3} height={sz*3} fill="#000"/>
          <rect x={off} y={off+sz*14} width={sz*7} height={sz*7} fill="#000"/><rect x={off+sz} y={off+sz*15} width={sz*5} height={sz*5} fill="#fff"/><rect x={off+sz*2} y={off+sz*16} width={sz*3} height={sz*3} fill="#000"/>
          {qrCells.map((c,i)=><rect key={i} x={off+c.x*sz} y={off+c.y*sz} width={sz} height={sz} fill="#000"/>)}
        </svg>
        <div style={{fontSize:14,fontWeight:700,marginTop:12,color:DK}}>{qrStore.name}</div>
        <div style={{fontSize:11,color:GR,marginTop:4}}>{qrStore.address}</div>
        <div style={{fontSize:11,color:GR,marginTop:4}}>桌號 A-01 ～ A-20</div>
        <div style={{fontSize:10,color:GR,marginTop:6,fontFamily:"monospace",background:LG,display:"inline-block",padding:"4px 12px",borderRadius:6}}>orderdot.app/store/{qrStore.id}</div>
      </div>
      <button onClick={()=>setQR(null)} style={{width:"100%",padding:10,borderRadius:10,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer",marginTop:12}}>關閉</button>
    </Mod>}
    <h1 style={{fontSize:20,fontWeight:800,margin:"0 0 16px"}}>門市管理</h1>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{stores.map(s=>
      <div key={s.id} style={{background:"#fff",borderRadius:12,padding:14,border:`1px solid ${K.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{fontSize:14,fontWeight:700}}>{s.name}</div><span style={{fontSize:9,color:s.status==="open"?K.success:GR,background:s.status==="open"?"#d1fae5":"#f3f4f6",padding:"2px 6px",borderRadius:100}}>{s.status==="open"?"營業":"休息"}</span></div><div style={{fontSize:10,color:GR,marginBottom:8}}>{s.address}</div><div style={{display:"flex",gap:4}}><button onClick={()=>setES({...s})} style={{flex:1,padding:7,borderRadius:6,border:`1px solid ${K.border}`,background:"#fff",fontSize:11,cursor:"pointer"}}>編輯</button><button onClick={()=>setQR(s.id)} style={{flex:1,padding:7,borderRadius:6,border:"none",background:P,color:"#fff",fontSize:11,cursor:"pointer"}}>QRcode</button></div></div>
    )}</div>
  </div>;
}

function AMem(){const{profile,totalCups,pts}=useG();const[sr,setSR]=useState("");const[ex,setEX]=useState(null);const[detail,setDetail]=useState(null);
  // Dynamic members list: first member syncs with customer profile
  const memData=[{id:1,name:profile.name,phone:profile.phone,level:totalCups>=100?"金茶會員":"新芽會員",points:pts,totalSpent:2450,visits:totalCups},{id:2,name:"王大明",phone:"0923-456-789",level:"新芽會員",points:156,totalSpent:15800,visits:82},{id:3,name:"陳美麗",phone:"0934-567-890",level:"金茶會員",points:520,totalSpent:58900,visits:231},{id:4,name:"張小華",phone:"0945-678-901",level:"新芽會員",points:12,totalSpent:880,visits:8},{id:5,name:"李志豪",phone:"0956-789-012",level:"新芽會員",points:203,totalSpent:22300,visits:98}];
  const fd=memData.filter(m=>m.name.includes(sr)||m.phone.includes(sr));
  return <div style={{padding:"18px 20px 24px",overflow:"auto",flex:1}}>
    {detail&&<Mod title="會員詳情" onClose={()=>setDetail(null)} width={420}>
      <div style={{textAlign:"center",marginBottom:16}}><div style={{width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${P},${AC})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:26,fontWeight:700,margin:"0 auto"}}>{detail.name[0]}</div><div style={{fontSize:18,fontWeight:800,marginTop:10}}>{detail.name}</div><div style={{fontSize:13,color:GR}}>{detail.phone}</div><span style={{display:"inline-block",marginTop:6,fontSize:11,fontWeight:600,color:detail.level==="金茶會員"?AC:GR,background:detail.level==="金茶會員"?AL:LG,padding:"4px 12px",borderRadius:100}}>{detail.level==="金茶會員"?"🏆 ":""}{detail.level}</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,background:LG,borderRadius:10,padding:12,textAlign:"center",marginBottom:12}}><div><div style={{fontSize:20,fontWeight:800,color:P}}>{detail.points}</div><div style={{fontSize:11,color:GR}}>點數</div></div><div><div style={{fontSize:20,fontWeight:800}}>${detail.totalSpent.toLocaleString()}</div><div style={{fontSize:11,color:GR}}>累計消費</div></div><div><div style={{fontSize:20,fontWeight:800}}>{detail.visits}</div><div style={{fontSize:11,color:GR}}>消費杯數</div></div></div>
      <div style={{fontSize:12,color:GR,textAlign:"center"}}>{detail.level==="金茶會員"?"已達金茶會員，享每月免費一杯福利":`距離金茶會員還需消費 ${Math.max(0,100-detail.visits)} 杯`}</div>
      <button onClick={()=>setDetail(null)} style={{width:"100%",padding:10,borderRadius:10,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer",marginTop:16}}>關閉</button>
    </Mod>}
    {ex&&<Mod title="會員報表" onClose={()=>setEX(null)} width={500}>{ex.data.map(m=><div key={m.id} style={{border:`1px solid ${K.border}`,borderRadius:10,padding:12,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontWeight:700}}>{m.name} · {m.phone}</span><span style={{fontSize:10,color:m.level==="金茶會員"?AC:GR,background:m.level==="金茶會員"?AL:LG,padding:"2px 8px",borderRadius:100}}>{m.level}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,background:LG,borderRadius:8,padding:8,textAlign:"center"}}><div><div style={{fontWeight:800,color:P}}>{m.points}</div><div style={{fontSize:10,color:GR}}>點數</div></div><div><div style={{fontWeight:800}}>${m.totalSpent.toLocaleString()}</div><div style={{fontSize:10,color:GR}}>消費</div></div><div><div style={{fontWeight:800}}>{m.visits}</div><div style={{fontSize:10,color:GR}}>杯數</div></div></div></div>)}<button onClick={()=>setEX(null)} style={{width:"100%",padding:10,borderRadius:10,border:"none",background:P,color:"#fff",fontWeight:700,cursor:"pointer"}}>關閉</button></Mod>}
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}><h1 style={{fontSize:20,fontWeight:800,margin:0}}>會員管理</h1><div style={{display:"flex",gap:4}}><input value={sr} onChange={e=>setSR(e.target.value)} placeholder="搜尋..." style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${K.border}`,fontSize:11,width:140,outline:"none"}}/><button onClick={()=>setEX(sr.trim()?{data:fd}:{data:memData})} style={{padding:"7px 12px",borderRadius:8,border:"none",background:P,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>匯出</button></div></div>
    <div style={{background:"#fff",borderRadius:12,border:`1px solid ${K.border}`,overflow:"hidden"}}>{fd.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:`1px solid ${K.border}`}}><div><div style={{fontSize:13,fontWeight:600}}>{m.name}</div><div style={{fontSize:11,color:GR}}>{m.phone}</div></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:m.level==="金茶會員"?AC:GR,background:m.level==="金茶會員"?AL:LG,padding:"2px 6px",borderRadius:100}}>{m.level}</span><span style={{fontSize:12,fontWeight:700,color:P}}>{m.points}pt</span><button onClick={()=>setDetail(m)} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${K.border}`,background:"#fff",fontSize:10,cursor:"pointer"}}>詳情</button></div></div>)}{fd.length===0&&<div style={{padding:20,textAlign:"center",color:GR}}>查無結果</div>}</div>
  </div>;
}

function AApp({pg,setPG}){const r=()=>{switch(pg){case"dashboard":return <ADash/>;case"orders":return <AOrd/>;case"menu":return <AMenu/>;case"loyalty":return <ALoy/>;case"stores":return <ASto/>;case"members":return <AMem/>;default:return <ADash/>;}};return <div style={{width:"100%",maxWidth:800,margin:"0 auto",display:"flex",flexDirection:"column",height:"calc(100vh - 65px)",minHeight:500,background:K.lightGray,borderRadius:16,overflow:"hidden",boxShadow:"0 4px 30px rgba(0,0,0,0.08)"}}><style>{`@keyframes adminFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.adminFade{animation:adminFade 0.3s ease-out}`}</style><div key={pg} className="adminFade" style={{flex:1,overflow:"auto"}}>{r()}</div><ASide act={pg} nav={setPG}/></div>;}

// ============================================================
// MAIN
// ============================================================
export default function App(){const[v,setV]=useState("customer");const[cPg,setCPg]=useState("home");const[aPg,setAPg]=useState("dashboard");const[ready,setReady]=useState(false);
  useEffect(()=>{setTimeout(()=>setReady(true),500);},[]);
  if(!ready)return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${P},#40916c)`,fontFamily:"'Noto Sans TC',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/><div style={{textAlign:"center"}}><Logo size={70}/><div style={{color:"#fff",fontSize:20,fontWeight:800,marginTop:12}}>{BN}</div><div style={{color:"rgba(255,255,255,0.5)",fontSize:10,marginTop:2}}>{BE}</div><div style={{marginTop:20}}><div style={{width:28,height:28,border:"3px solid rgba(255,255,255,0.2)",borderTop:"3px solid #fff",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div></div>;
  return <GP>
  <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:v==="customer"?`linear-gradient(135deg,${PL} 0%,#b7e4c7 50%,${PL} 100%)`:K.lightGray,fontFamily:"'Noto Sans TC',-apple-system,BlinkMacSystemFont,sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/><div style={{display:"flex",justifyContent:"center",padding:"12px 0 8px",flexShrink:0}}><div style={{display:"flex",background:DK,borderRadius:12,padding:3}}><button onClick={()=>setV("customer")} style={{padding:"7px 18px",borderRadius:9,border:"none",background:v==="customer"?"#fff":"transparent",color:v==="customer"?DK:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:700,cursor:"pointer"}}>📱 顧客端</button><button onClick={()=>setV("admin")} style={{padding:"7px 18px",borderRadius:9,border:"none",background:v==="admin"?"#fff":"transparent",color:v==="admin"?DK:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:700,cursor:"pointer"}}>💻 商家後台</button></div></div><div style={{display:v==="customer"?"flex":"none",justifyContent:"center",flex:1,padding:"0 20px 20px"}}><CApp pg={cPg} setPG={setCPg}/></div><div style={{display:v==="admin"?"flex":"none",flex:1,justifyContent:"center",padding:"0 20px 20px"}}><AApp pg={aPg} setPG={setAPg}/></div></div></GP>;}
