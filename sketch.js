
let points = []; // 置いた石の座標を保存する配列
let gridSize = 8; // グリッドのサイズ
let cellSize; // グリッドのセルのサイズ

// 最初に1回だけ実行される設定
function setup() {
  // iPadの画面いっぱいにキャンバスを作成
  createCanvas(windowWidth, windowHeight);
  cellSize = width / (gridSize + 2); // グリッドのセルのサイズを計算

}

// 毎フレーム繰り返し実行される描画処理
function draw() {
  background(240); // 背景を薄いグレーに
  
  // ここに盤面（グリッド）を描く処理を書きます

  // 置かれた石を描画
  fill(0); // 黒色
  for (let i = 1; i <= gridSize; i++) {
    line*(i * cellSize, cellSize, i * cellSize, (gridSize + 1) * cellSize); // 縦線
    line(cellSize, i * cellSize, (gridSize + 1) * cellSize, i * cellSize); // 横線
  }
}

// 画面がタップされたときの処理
function touchStarted() {
  // タップされた座標に石を追加
  points.push({x: mouseX, y: mouseY});
  
  // ※ここで「4つ置かれたか？」「共円か？」の判定ロジックを呼び出します
  
  return false; // デフォルトのスクロール動作などを防ぐ
}

// 4つの点が「私（共円）」を作っているか判定する関数
function isConcyclic(p1, p2, p3, p4) {
  // ① まず、3点(p1, p2, p3)から外接円の中心座標(ux, uy)を求める計算式です
  let d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  
  // もし3点が一直線上にある場合は円が作れないので、共円ではありません
  if (abs(d) < 0.0001) return false; 
  
  let ux = ((p1.x**2 + p1.y**2) * (p2.y - p3.y) + (p2.x**2 + p2.y**2) * (p3.y - p1.y) + (p3.x**2 + p3.y**2) * (p1.y - p2.y)) / d;
  let uy = ((p1.x**2 + p1.y**2) * (p3.x - p2.x) + (p2.x**2 + p2.y**2) * (p1.x - p3.x) + (p3.x**2 + p3.y**2) * (p2.x - p1.x)) / d;
  
  // ② 中心からp1までの距離の2乗（これが外接円の半径の2乗になります）
  let r2 = (p1.x - ux)**2 + (p1.y - uy)**2;
  
  // ③ 中心から4つ目の点(p4)までの距離の2乗
  let d4_2 = (p4.x - ux)**2 + (p4.y - uy)**2;
  
  // ④ 半径と4つ目の点までの距離が「ほぼ同じ（誤差0.0001未満）」なら共円！
  return abs(r2 - d4_2) < 0.0001;
}

// 盤面にあるすべての石の組み合わせをチェックする関数
function checkGameOver() {
  let n = points.length;
  // 石が4つ未満なら絶対に共円はできないのでセーフ
  if (n < 4) return false;
  
  // 置かれているすべての石の中から「4つを選ぶ」全パターンの組み合わせをチェックします
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          if (isConcyclic(points[i], points[j], points[k], points[l])) {
            return true; // 私（共円）を見つけました！
          }
        }
      }
    }
  }
  return false;
}




