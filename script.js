const menus = {
  home: {
    麺: ["ラーメン", "つけ麺", "うどん", "そば", "パスタ", "焼きそば", "そうめん"],
    ご飯: ["カレーライス", "チャーハン", "オムライス", "丼もの", "炊き込みご飯", "定食"],
    パン: ["サンドイッチ", "ホットサンド", "ピザトースト", "ハンバーガー", "フレンチトースト"]
  },
  outside: {
    麺: ["ラーメン", "つけ麺", "うどん", "そば", "パスタ", "油そば", "ちゃんぽん"],
    ご飯: ["寿司", "焼肉", "丼もの", "定食", "カレー", "中華料理", "ハンバーグ"],
    パン: ["ハンバーガー", "サンドイッチ", "ベーカリーカフェ", "ピザ", "カフェごはん"]
  }
};
const state = { mode: "home", fixed: "any", main: null, detail: null, busy: false };
const $ = id => document.getElementById(id);
const mainWheel = $("main-wheel"), detailWheel = $("detail-wheel");
const mainValue = $("main-value"), detailValue = $("detail-value");
const detailPanel = $("detail-panel"), result = $("result");

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-card").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  resetAfterMode();
}
function setFixed(value) {
  state.fixed = value;
  document.querySelectorAll(".fixed-btn").forEach(b => b.classList.toggle("active", b.dataset.fixed === value));
  state.main = value === "any" ? null : value;
  state.detail = null;
  result.hidden = true;
  detailPanel.hidden = value === "any";
  mainValue.textContent = value === "any" ? "麺？ ご飯？ パン？" : value + "に固定中！";
  $("main-hint").textContent = value === "any" ? "「麺固定」などを選ぶと、主食ルーレットをスキップできるよ。" : value + "固定！主食ルーレットを飛ばして、次へ進めるよ。";
  if (state.main) showDetail();
}
function resetAfterMode() {
  state.main = state.fixed === "any" ? null : state.fixed;
  state.detail = null;
  result.hidden = true;
  detailPanel.hidden = !state.main;
  mainValue.textContent = state.main ? state.main + "に固定中！" : "麺？ ご飯？ パン？";
  if (state.main) showDetail();
}
function choose(list) { return list[Math.floor(Math.random() * list.length)]; }
function spin(element, valueElement, options, callback) {
  if (state.busy || !options.length) return;
  state.busy = true;
  element.classList.add("spinning");
  const button = element.parentElement.querySelector("button");
  button.disabled = true;
  let ticks = 0;
  const timer = setInterval(() => {
    valueElement.textContent = choose(options);
    ticks++;
    if (ticks >= 15) {
      clearInterval(timer);
      const picked = choose(options);
      valueElement.textContent = picked;
      element.classList.remove("spinning");
      button.disabled = false;
      state.busy = false;
      callback(picked);
    }
  }, 85);
}
function showDetail() {
  detailPanel.hidden = false;
  const labels = { 麺: "麺なら何にする？", ご飯: "ご飯なら何にする？", パン: "パンなら何にする？" };
  $("detail-title").textContent = labels[state.main] || "何を食べる？";
  $("detail-value").textContent = "何が出るかな？";
  $("detail-spin").textContent = "ジャンルを回す ↗";
  result.hidden = true;
}
function showResult(item) {
  $("result-title").textContent = item;
  const modeText = state.mode === "home" ? "おうちで手作り！" : "今日は外食！";
  $("result-description").textContent = modeText + " 今夜はこれに決まり！";
  result.hidden = false;
}
$("main-spin").addEventListener("click", () => {
  if (state.fixed !== "any") { showDetail(); return; }
  spin(mainWheel, mainValue, ["麺", "ご飯", "パン"], picked => {
    state.main = picked;
    state.detail = null;
    showDetail();
    detailPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});
$("detail-spin").addEventListener("click", () => {
  if (!state.main) return;
  const options = menus[state.mode][state.main];
  spin(detailWheel, detailValue, options, picked => {
    state.detail = picked;
    showResult(picked);
  });
});
$("again").addEventListener("click", () => {
  result.hidden = true;
  detailValue.textContent = "もう一度いってみよう！";
  $("detail-spin").click();
});
document.querySelectorAll(".mode-card").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
document.querySelectorAll(".fixed-btn").forEach(b => b.addEventListener("click", () => setFixed(b.dataset.fixed)));
