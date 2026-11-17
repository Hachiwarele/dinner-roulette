const defaultMenus={home:{麺:["ラーメン","つけ麺","うどん","そば","パスタ","焼きそば","そうめん"],ご飯:["カレーライス","チャーハン","オムライス","丼もの","炊き込みご飯","定食"],パン:["サンドイッチ","ホットサンド","ピザトースト","ハンバーガー","フレンチトースト"]},outside:{麺:["ラーメン","つけ麺","うどん","そば","パスタ","油そば","ちゃんぽん"],ご飯:["寿司","焼肉","丼もの","定食","カレー","中華料理","ハンバーグ"],パン:["ハンバーガー","サンドイッチ","ベーカリーカフェ","ピザ","カフェごはん"]}};
const STORAGE_KEY="dinner-roulette-menus-v1";
const MISSION_STORAGE_KEY="dinner-roulette-missions-v1";
const THEME_KEY="dinner-roulette-theme-v1";
const HISTORY_KEY="dinner-roulette-history-v2";
let dinnerHistory=[];try{const parsed=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");if(Array.isArray(parsed))dinnerHistory=parsed.filter(x=>x&&typeof x.item==="string").slice(0,100)}catch{}
let darkMode=localStorage.getItem(THEME_KEY)==="dark";
function cloneDefaults(){return JSON.parse(JSON.stringify(defaultMenus))}
function loadMenus(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!saved)return cloneDefaults();const out=cloneDefaults();for(const m of ["home","outside"])for(const c of ["麺","ご飯","パン"])if(Array.isArray(saved[m]?.[c]))out[m][c]=saved[m][c].filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim());return out}catch{return cloneDefaults()}}
let menus=loadMenus();
const state={mode:"home",fixed:"any",main:null,busy:false,lastItem:null};
const $=id=>document.getElementById(id),mainWheel=$("main-wheel"),detailWheel=$("detail-wheel"),mainValue=$("main-value"),detailValue=$("detail-value"),detailPanel=$("detail-panel"),result=$("result");
function applyTheme(){document.body.dataset.theme=darkMode?"dark":"light";$("theme-toggle").textContent=darkMode?"☀️ ライト":"🌙 ダーク";}
function saveMenus(){localStorage.setItem(STORAGE_KEY,JSON.stringify(menus));$("save-note").textContent="保存したよ！次に開いたときもこの内容だよ 💾"}
function currentList(){return menus[$("edit-mode").value][$("edit-category").value]}
function renderEditor(){const ul=$("menu-list");ul.replaceChildren();currentList().forEach((name,i)=>{const li=document.createElement("li"),input=document.createElement("input"),del=document.createElement("button");input.type="text";input.maxLength=40;input.value=name;input.setAttribute("aria-label","メニュー名");input.addEventListener("change",()=>{const v=input.value.trim();if(!v){input.value=currentList()[i];return}currentList()[i]=v;saveMenus()});del.type="button";del.className="delete-menu";del.textContent="削除";del.addEventListener("click",()=>{currentList().splice(i,1);saveMenus();renderEditor()});li.append(input,del);ul.append(li)});if(!currentList().length){const li=document.createElement("li");li.textContent="選択肢が空だよ。下から追加してね！";ul.append(li)}}
function showPage(p){const edit=p==="settings";$("roulette-page").hidden=edit;$("settings-page").hidden=!edit;$("roulette-tab").classList.toggle("active",!edit);$("settings-tab").classList.toggle("active",edit);if(edit){renderEditor();showEditorKind("menu")}}
function setMode(mode){if(state.busy)return;state.mode=mode;state.lastItem=null;document.querySelectorAll(".mode-card").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));resetAfterMode()}
function setFixed(v){if(state.busy)return;state.fixed=v;state.lastItem=null;document.querySelectorAll(".fixed-btn").forEach(b=>b.classList.toggle("active",b.dataset.fixed===v));state.main=v==="any"?null:v;result.hidden=true;detailPanel.hidden=v==="any";mainValue.textContent=v==="any"?"麺？ ご飯？ パン？":v+"に固定中！";$("main-hint").textContent=v==="any"?"「麺固定」などを選ぶと、主食ルーレットをスキップできるよ。":v+"固定！主食ルーレットを飛ばして、次へ進めるよ。";if(state.main)showDetail();renderDartWheel(mainWheel,["麺","ご飯","パン"]);renderDartWheel(detailWheel,menus[state.mode][state.main||"麺"])}
function resetAfterMode(){state.main=state.fixed==="any"?null:state.fixed;result.hidden=true;detailPanel.hidden=!state.main;mainValue.textContent=state.main?state.main+"に固定中！":"麺？ ご飯？ パン？";if(state.main)showDetail()}
function choose(a){return a[Math.floor(Math.random()*a.length)]}
function avoidLast(a,last){const filtered=a.filter(x=>x!==last);return filtered.length?filtered:a}
function celebrate(){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const box=$("celebration");box.replaceChildren();for(let i=0;i<32;i++){const el=document.createElement("i");el.className="confetti-piece";el.style.left=Math.random()*100+"%";el.style.background=["#eab36e","#87bca0","#e99296","#b6a4dd"][i%4];el.style.animationDelay=Math.random()*.35+"s";el.style.setProperty("--drift",(Math.random()*260-130)+"px");box.append(el)}setTimeout(()=>box.replaceChildren(),2300)}

const WHEEL_PALETTE=["#f3b86b","#f5d995","#92bca6","#a9bfe2","#d9b4db","#f2a9a5","#a7d7d0","#e6c6a3"];
const SVG_NS="http://www.w3.org/2000/svg";
function svgNode(tag,attrs={}){const node=document.createElementNS(SVG_NS,tag);for(const [key,val] of Object.entries(attrs))node.setAttribute(key,String(val));return node}
function wheelLabel(text){const chars=Array.from(text);return chars.length>9?chars.slice(0,8).join("")+"…":text}
function renderDartWheel(el,options){
 const old=el.querySelector(".dart-stage");if(old)old.remove();
 const stage=document.createElement("div");stage.className="dart-stage";
 const disc=document.createElement("div");disc.className="dart-disc";
 const svg=svgNode("svg",{viewBox:"0 0 300 300",role:"img","aria-label":"選択肢："+options.join("、")});
 const n=options.length,step=360/n;
 options.forEach((option,i)=>{
  const a=(i*step-90)*Math.PI/180,b=((i+1)*step-90)*Math.PI/180;
  const x1=150+146*Math.cos(a),y1=150+146*Math.sin(a),x2=150+146*Math.cos(b),y2=150+146*Math.sin(b);
  const path=svgNode("path",{d:`M 150 150 L ${x1} ${y1} A 146 146 0 ${step>180?1:0} 1 ${x2} ${y2} Z`,fill:WHEEL_PALETTE[i%WHEEL_PALETTE.length],stroke:"#ffffff", "stroke-width":"2"});
  svg.append(path);
  const center=(i+.5)*step-90,rad=center*Math.PI/180;
  const radius=n>12?106:n>7?100:91;
  const text=svgNode("text",{x:150+radius*Math.cos(rad),y:150+radius*Math.sin(rad),"text-anchor":"middle","dominant-baseline":"middle",fill:"#49372d","font-size":n>12?9:n>8?10:12,"font-weight":"800",stroke:"#ffffff","stroke-width":"2.5","paint-order":"stroke"});
  const label=wheelLabel(option);
  if(n>14){text.textContent=label.slice(0,5)+(label.length>5?"…":"")}else{
   const max= n>8?6:7;
   if(Array.from(label).length>max){const parts=[Array.from(label).slice(0,max).join(""),Array.from(label).slice(max).join("")];parts.forEach((part,k)=>{const t=svgNode("tspan",{x:text.getAttribute("x"),dy:k===0?"-.45em":"1.1em"});t.textContent=part;text.append(t)})}
   else text.textContent=label;
  }
  svg.append(text);
 });
 svg.append(svgNode("circle",{cx:150,cy:150,r:17,fill:"#fffaf1",stroke:"#b48a6d","stroke-width":4}));
 svg.append(svgNode("circle",{cx:150,cy:150,r:5,fill:"#c77b58"}));
 disc.append(svg);stage.append(disc);
 const dart=document.createElement("div");dart.className="dart-projectile";dart.innerHTML='<span class="dart-flight">➤</span>';dart.setAttribute("aria-hidden","true");stage.append(dart);
 el.prepend(stage);el.classList.add("dart-ready");return {stage,disc,dart};
}
function spin(el,out,options,done){
 if(state.busy)return;
 if(!options.length){alert("選択肢がないよ。編集ページから追加してね！");return}
 state.busy=true;const btn=el.parentElement.querySelector("button");btn.disabled=true;
 const wheel=renderDartWheel(el,options);const n=options.length;
 const pool=avoidLast(options,out.dataset.lastPick);
 const picked=darkMode?options[0]:choose(pool);const targetIndex=options.indexOf(picked);
 out.textContent="運命のダーツ、発射！";el.classList.add("dart-spinning");
 const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const duration=reduce?100:3600;
 // The selected segment center is aligned with the dart at the top of the disc.
 const segment=360/n;const stopAngle=-(targetIndex+.5)*segment;
 const rotations=reduce?0:6+Math.floor(Math.random()*3);
 const finalAngle=rotations*360+stopAngle;
 wheel.disc.style.transition=`transform ${duration}ms cubic-bezier(.12,.8,.16,1)`;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{wheel.disc.style.transform=`rotate(${finalAngle}deg)`}));
 setTimeout(()=>{
  wheel.dart.classList.add("dart-hit");el.classList.remove("dart-spinning");el.classList.add("dart-landed");
  out.textContent="🎯 "+picked;out.dataset.lastPick=picked;
  if(!reduce)celebrate();
  setTimeout(()=>{btn.disabled=false;state.busy=false;done(picked)},reduce?50:600);
 },duration+80);
}
function showDetail(){detailPanel.hidden=false;detailWheel.classList.remove("dart-landed");renderDartWheel(detailWheel,menus[state.mode][state.main]);const labels={麺:"麺なら何にする？",ご飯:"ご飯なら何にする？",パン:"パンなら何にする？"};$("detail-title").textContent=labels[state.main]||"何を食べる？";detailValue.textContent="何が出るかな？";$("detail-spin").textContent="🎯 ダーツを投げる ↗";result.hidden=true}
function showResult(item){state.lastItem=item;$("result-title").textContent=item;$("result-description").textContent=(state.mode==="home"?"おうちで手作り！":"今日は外食！")+" 今夜はこれに決まり！";result.hidden=false;celebrate();$("record-note").textContent=""}
$("main-spin").addEventListener("click",()=>{if(state.fixed!=="any"){showDetail();return}spin(mainWheel,mainValue,["麺","ご飯","パン"],picked=>{state.main=picked;showDetail();detailPanel.scrollIntoView({behavior:"smooth",block:"center"})})});
$("detail-spin").addEventListener("click",()=>{if(state.main)spin(detailWheel,detailValue,menus[state.mode][state.main],showResult)});
$("again").addEventListener("click",()=>{result.hidden=true;detailValue.textContent="もう一度いってみよう！";$("detail-spin").click()});
document.querySelectorAll(".mode-card").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
document.querySelectorAll(".fixed-btn").forEach(b=>b.addEventListener("click",()=>setFixed(b.dataset.fixed)));
$("roulette-tab").addEventListener("click",()=>showPage("roulette"));$("settings-tab").addEventListener("click",()=>showPage("settings"));
$("theme-toggle").addEventListener("click",()=>{darkMode=!darkMode;localStorage.setItem(THEME_KEY,darkMode?"dark":"light");applyTheme()});
applyTheme();

const defaultMissions=[
"食べたことのないメニューに挑戦！ 🌟",
"今日は大盛りにしてみる！ 🍚",
"いつもと違うトッピングを選ぶ！ 🧀",
"普段頼まないメニューを選ぶ！ 🎲",
"好きなものを一品追加する！ 😋",
"新しい味付け・ソースに挑戦！ 🥫",
"彩りのいい一品を選ぶ！ 🌈",
"今日はデザートも楽しむ！ 🍨",
"いつもよりゆっくり味わって食べる！ 😊",
"飲み物をいつもと違うものにする！ 🥤",
"シェアできる一品を頼む・作る！ 🍽️",
"自分へのご褒美メニューにする！ ✨"
];
function loadMissions(){try{const saved=JSON.parse(localStorage.getItem(MISSION_STORAGE_KEY));return Array.isArray(saved)?saved.filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim()):[...defaultMissions]}catch{return [...defaultMissions]}}
let missions=loadMissions();
function saveMissions(){localStorage.setItem(MISSION_STORAGE_KEY,JSON.stringify(missions));$("mission-save-note").textContent="保存したよ！次に開いたときもこの内容だよ 💾"}
function renderMissionEditor(){const ul=$("mission-list");ul.replaceChildren();missions.forEach((name,i)=>{const li=document.createElement("li"),input=document.createElement("input"),del=document.createElement("button");input.type="text";input.maxLength=60;input.value=name;input.setAttribute("aria-label","ミッション名");input.addEventListener("change",()=>{const v=input.value.trim();if(!v){input.value=missions[i];return}missions[i]=v;saveMissions()});del.type="button";del.className="delete-menu";del.textContent="削除";del.addEventListener("click",()=>{missions.splice(i,1);saveMissions();renderMissionEditor()});li.append(input,del);ul.append(li)});if(!missions.length){const li=document.createElement("li");li.textContent="ミッションが空だよ。下から追加してね！";ul.append(li)}}
function showEditorKind(kind){const isMission=kind==="mission";$("menu-editor").hidden=isMission;$("mission-editor").hidden=!isMission;$("edit-kind-menu").classList.toggle("active",!isMission);$("edit-kind-mission").classList.toggle("active",isMission);if(isMission)renderMissionEditor()}
const missionWheel=$("mission-wheel"),missionValue=$("mission-value");
$("mission-spin").addEventListener("click",()=>spin(missionWheel,missionValue,missions,picked=>{}));
$("edit-kind-menu").addEventListener("click",()=>showEditorKind("menu"));
$("edit-kind-mission").addEventListener("click",()=>showEditorKind("mission"));
$("add-mission").addEventListener("click",()=>{const input=$("new-mission"),v=input.value.trim();if(!v){input.focus();return}if(missions.some(x=>x.toLowerCase()===v.toLowerCase())){$("mission-save-note").textContent="同じミッションがもうあるよ！";return}missions.push(v);input.value="";saveMissions();renderMissionEditor()});
$("new-mission").addEventListener("keydown",e=>{if(e.key==="Enter")$("add-mission").click()});
$("reset-missions").addEventListener("click",()=>{if(confirm("ミッションを最初の内容に戻す？")){missions=[...defaultMissions];saveMissions();renderMissionEditor()}});

$("edit-mode").addEventListener("change",renderEditor);$("edit-category").addEventListener("change",renderEditor);
$("add-menu").addEventListener("click",()=>{const input=$("new-menu"),v=input.value.trim();if(!v){input.focus();return}if(currentList().some(x=>x.toLowerCase()===v.toLowerCase())){$("save-note").textContent="同じ名前のメニューがもうあるよ！";return}currentList().push(v);input.value="";saveMenus();renderEditor()});
$("new-menu").addEventListener("keydown",e=>{if(e.key==="Enter")$("add-menu").click()});
$("reset-menus").addEventListener("click",()=>{if(confirm("すべての選択肢を最初の内容に戻す？")){menus=cloneDefaults();saveMenus();renderEditor()}});
function renderHistory(){
 const list=$("history-list"),stats=$("history-stats");list.replaceChildren();stats.replaceChildren();
 const pill=document.createElement("span");pill.className="stat-pill";pill.textContent="🍽️ 記録 "+dinnerHistory.length+" 回";stats.append(pill);
 const unique=document.createElement("span");unique.className="stat-pill";unique.textContent="✨ 食べたメニュー "+new Set(dinnerHistory.map(x=>x.item)).size+" 種類";stats.append(unique);
 if(!dinnerHistory.length){const p=document.createElement("p");p.className="history-empty";p.textContent="まだ記録がないよ。ルーレットで決めたら「今夜の記録に追加」を押してね！";list.append(p);return}
 dinnerHistory.slice(0,8).forEach(entry=>{const row=document.createElement("div");row.className="history-item";const info=document.createElement("div");const name=document.createElement("strong");name.textContent=(entry.mode==="home"?"🏠 ":"🍴 ")+entry.item;const date=document.createElement("small");date.textContent=new Date(entry.date).toLocaleDateString("ja-JP",{year:"numeric",month:"short",day:"numeric"});info.append(name,date);row.append(info);list.append(row)})
}
$("save-dinner").addEventListener("click",()=>{
 if(!state.lastItem)return;
 dinnerHistory.unshift({item:state.lastItem,mode:state.mode,date:new Date().toISOString()});dinnerHistory=dinnerHistory.slice(0,100);
 try{localStorage.setItem(HISTORY_KEY,JSON.stringify(dinnerHistory));$("record-note").textContent="✨ 今夜の思い出に保存したよ！"}catch{$("record-note").textContent="保存できなかったよ。ブラウザの保存設定を確認してね"}
 renderHistory()
});
$("clear-history").addEventListener("click",()=>{if(!dinnerHistory.length)return;if(confirm("夕飯の履歴をすべて消す？")){dinnerHistory=[];localStorage.removeItem(HISTORY_KEY);renderHistory()}});
renderHistory();

function refreshDartWheels(){
 if(!state.busy){renderDartWheel(mainWheel,["麺","ご飯","パン"]);renderDartWheel(detailWheel,menus[state.mode][state.main||"麺"]);renderDartWheel(missionWheel,missions)}
}
refreshDartWheels();
const originalSaveMenus=saveMenus;saveMenus=function(){originalSaveMenus();refreshDartWheels()};
const originalSaveMissions=saveMissions;saveMissions=function(){originalSaveMissions();refreshDartWheels()};

/* Public three-digit shared rooms: local edits remain usable offline. */
window.dinnerRoomBridge={
 getSeed:()=>({menus:cloneDefaults(),missions:[...defaultMissions],history:[]}),
 resetForNewRoom(){this.applyRemote(this.getSeed());state.main=null;state.lastItem=null;result.hidden=true;detailPanel.hidden=true;mainValue.textContent="麺？ ご飯？ パン？";missionValue.textContent="今日のミッションは？";},
 applyRemote(data){
  if(!data||state.busy)return;
  if(data.menus&&typeof data.menus==="object"){
   const safe=cloneDefaults();for(const mode of ["home","outside"])for(const cat of ["麺","ご飯","パン"]){
    const list=data.menus[mode]?.[cat];if(Array.isArray(list))safe[mode][cat]=list.filter(x=>typeof x==="string"&&x.trim()).slice(0,80).map(x=>x.slice(0,40));
   }
   menus=safe;localStorage.setItem(STORAGE_KEY,JSON.stringify(menus));
  }
  if(Array.isArray(data.missions)){missions=data.missions.filter(x=>typeof x==="string"&&x.trim()).slice(0,80).map(x=>x.slice(0,60));localStorage.setItem(MISSION_STORAGE_KEY,JSON.stringify(missions))}
  if(Array.isArray(data.history)){dinnerHistory=data.history.filter(x=>x&&typeof x.item==="string").slice(0,100);localStorage.setItem(HISTORY_KEY,JSON.stringify(dinnerHistory))}
  renderEditor();renderMissionEditor();renderHistory();refreshDartWheels();
 },
 getCurrent:()=>({menus,missions,history:dinnerHistory})
};
function notifyRoomChange(key){window.dispatchEvent(new CustomEvent("dinner-room-change",{detail:{key,value:window.dinnerRoomBridge.getCurrent()[key]}}))}
const baseSaveMenus=saveMenus;saveMenus=function(){baseSaveMenus();notifyRoomChange("menus")};
const baseSaveMissions=saveMissions;saveMissions=function(){baseSaveMissions();notifyRoomChange("missions")};
$("save-dinner").addEventListener("click",()=>{notifyRoomChange("history")});
$("clear-history").addEventListener("click",()=>{notifyRoomChange("history")});
