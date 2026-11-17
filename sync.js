import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,signInAnonymously} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getDatabase,ref,onValue,runTransaction,set} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
const config={apiKey:"AIzaSyBbP_qrflpjvuygs6fb4C6nyJPoWG-j20w",authDomain:"dinner-roulette-31576.firebaseapp.com",databaseURL:"https://dinner-roulette-31576-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"dinner-roulette-31576",storageBucket:"dinner-roulette-31576.firebasestorage.app",messagingSenderId:"693575524648",appId:"1:693575524648:web:962606a0d69576d4db701d"};
const app=initializeApp(config),auth=getAuth(app),db=getDatabase(app),$=id=>document.getElementById(id),status=$("room-status"),join=$("room-join"),code=$("room-code"),current=$("room-current"),joinControls=$("room-join-controls"),leaveControls=$("room-leave-controls");
const ROOM_KEY="dinner-roulette-room-v4";let active=null,unsub=null,ready=false,applying=false;
function message(t){status.textContent=t}
function displayRoom(n){current.hidden=!n;current.textContent=n?"ROOM "+n:"";joinControls.hidden=!!n;leaveControls.hidden=!n}
async function joinRoom(n){
 if(!/^[0-9]{3}$/.test(n)){message("部屋番号は3桁の数字で入力してね");return}
 if(!ready){message("接続準備中だよ。少し待ってから試してね");return}
 join.disabled=true;message("ルーム "+n+" に接続中…");
 try{
  if(unsub){unsub();unsub=null}active=null;
  window.dinnerRoomBridge.resetForNewRoom();
  const room=ref(db,"rooms/"+n),seed=window.dinnerRoomBridge.getSeed();
  await runTransaction(room,old=>old===null?{menus:seed.menus,missions:seed.missions,history:seed.history,createdAt:Date.now()}:undefined,{applyLocally:false});
  active=n;localStorage.setItem(ROOM_KEY,n);displayRoom(n);
  unsub=onValue(room,snap=>{if(active!==n)return;const data=snap.val();if(!data)return;applying=true;window.dinnerRoomBridge.applyRemote(data);applying=false;message("☁️ 同期中！この部屋のメニュー・ミッション・履歴を共有しているよ")},err=>message("同期できないよ。Firebaseのルールを確認してね（"+err.code+"）"));
 }catch(err){active=null;displayRoom(null);message("接続できなかったよ： "+(err.code||err.message))}
 finally{join.disabled=false}
}
join.addEventListener("click",()=>joinRoom(code.value.trim()));
code.addEventListener("input",()=>{code.value=code.value.replace(/\D/g,"").slice(0,3)});
code.addEventListener("keydown",e=>{if(e.key==="Enter")join.click()});
$("room-leave").addEventListener("click",()=>{if(unsub){unsub();unsub=null}active=null;localStorage.removeItem(ROOM_KEY);window.dinnerRoomBridge.resetForNewRoom();displayRoom(null);message("部屋から移動したよ。別の3桁を入力してね")});
window.addEventListener("dinner-room-change",async e=>{if(!active||!ready||applying)return;const target=active;try{await set(ref(db,"rooms/"+target+"/"+e.detail.key),e.detail.value)}catch(err){message("保存できなかったよ： "+(err.code||err.message))}});
try{await signInAnonymously(auth);ready=true;const saved=localStorage.getItem(ROOM_KEY);if(saved&&/^[0-9]{3}$/.test(saved)){code.value=saved;await joinRoom(saved)}else message("3桁の番号を入力して、部屋を作成・参加しよう！")}catch(err){message("Firebase認証に失敗したよ： "+(err.code||err.message))}
