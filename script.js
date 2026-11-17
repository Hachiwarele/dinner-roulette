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
function setMode(mode){state.mode=mode;state.lastItem=null;document.querySelectorAll(".mode-card").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));resetAfterMode()}
function setFixed(v){state.fixed=v;state.lastItem=null;document.querySelectorAll(".fixed-btn").forEach(b=>b.classList.toggle("active",b.dataset.fixed===v));state.main=v==="any"?null:v;result.hidden=true;detailPanel.hidden=v==="any";mainValue.textContent=v==="any"?"麺？ ご飯？ パン？":v+"に固定中！";$("main-hint").textContent=v==="any"?"「麺固定」などを選ぶと、主食ルーレットをスキップできるよ。":v+"固定！主食ルーレットを飛ばして、次へ進めるよ。";if(state.main)showDetail()}
function resetAfterMode(){state.main=state.fixed==="any"?null:state.fixed;result.hidden=true;detailPanel.hidden=!state.main;mainValue.textContent=state.main?state.main+"に固定中！":"麺？ ご飯？ パン？";if(state.main)showDetail()}
function choose(a){return a[Math.floor(Math.random()*a.length)]}
function avoidLast(a,last){const filtered=a.filter(x=>x!==last);return filtered.length?filtered:a}
function celebrate(){if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const box=$("celebration");box.replaceChildren();for(let i=0;i<32;i++){const el=document.createElement("i");el.className="confetti-piece";el.style.left=Math.random()*100+"%";el.style.background=["#eab36e","#87bca0","#e99296","#b6a4dd"][i%4];el.style.animationDelay=Math.random()*.35+"s";el.style.setProperty("--drift",(Math.random()*260-130)+"px");box.append(el)}setTimeout(()=>box.replaceChildren(),2300)}
function spin(el,out,options,done){if(state.busy)return;if(!options.length){alert("この主食の選択肢がないよ。編集ページから追加してね！");return}state.busy=true;el.classList.add("spinning");const btn=el.parentElement.querySelector("button");btn.disabled=true;let n=0;const timer=setInterval(()=>{out.textContent=choose(options);if(++n>=15){clearInterval(timer);const picked=darkMode?options[0]:choose(avoidLast(options,out.dataset.lastPick));out.dataset.lastPick=picked;out.textContent=picked;el.classList.remove("spinning");btn.disabled=false;state.busy=false;done(picked)}},85)}
function showDetail(){detailPanel.hidden=false;const labels={麺:"麺なら何にする？",ご飯:"ご飯なら何にする？",パン:"パンなら何にする？"};$("detail-title").textContent=labels[state.main]||"何を食べる？";detailValue.textContent="何が出るかな？";$("detail-spin").textContent="ジャンルを回す ↗";result.hidden=true}
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
