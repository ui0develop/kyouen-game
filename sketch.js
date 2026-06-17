let points = []; // 置いた石の座標（交点のインデックス）を保存する配列
let gridSize = 8; // グリッドのサイズ（8とすると、9×9の交点ができます）
let cellSize; // 1マスのサイズ

function setup() {
  createCanvas(windowWidth, windowHeight);
  // iPadを縦横どちらで持っても盤面が収まるよう、小さい方を基準にする
  let minSize = min(windowWidth, windowHeight);
  cellSize = minSize / (gridSize + 2);
}

function draw() {
  background(240); // 背景を薄いグレーに
  
  // 1. 盤面（グリッド）を描画
  stroke(0); // 線の色を黒に
  strokeWeight(2); // ★線を少し太くして見やすくしました
  for (let i = 1; i <= gridSize + 1; i++) {
    line(i * cellSize, cellSize, i * cellSize, (gridSize + 1) * cellSize); // 縦線
    line(cellSize, i * cellSize, (gridSize + 1) * cellSize, i * cellSize); // 横線
  }

  // 2. 置かれた石を描画
  fill(0); // 石の色を黒に
  noStroke(); // 石のふちどりを消す
  for (let i = 0; i < points.length; i++) {
    // 保存された交点インデックスにcellSizeを掛けて、画面上の座標に変換
    circle(points[i].x * cellSize, points[i].y * cellSize, cellSize * 0.4); 
  }
}

// ★ ここを mousePressed に変更しました！（パソコンのクリックでもiPadのタップでも動きます）
function mousePressed() {
  // ① クリックされた座標を、一番近い「交点」に吸着（スナップ）させる
  let gridX = Math.round(mouseX / cellSize);
  let gridY = Math.round(mouseY / cellSize);

  // ② クリックした場所が盤面の範囲内かチェック
  if (gridX >= 1 && gridX <= gridSize + 1 && gridY >= 1 && gridY <= gridSize + 1) {
    
    // ③ すでに同じ場所に石が置かれていないかチェック
    let alreadyExists = false;
    for (let i = 0; i < points.length; i++) {
      if (points[i].x === gridX && points[i].y === gridY) {
        alreadyExists = true;
        break;
      }
    }

    // ④ まだ石がなければ、新しく配列に追加！
    if (!alreadyExists) {
      points.push({x: gridX, y: gridY});
      
      // ⑤ 石を置いた直後に「共円」になったか判定
      if (checkGameOver()) {
        // 石が描画されるのを一瞬（100ミリ秒）待ってからアラートを出す
        setTimeout(() => {
          alert("共円です！あなたの負け！\n（OKを押すとリセットされます）");
          points = []; // アラートを閉じたら石をすべて消してリセット
        }, 100); 
      }
    }
  }
  
  return false; // デフォルトのスクロール動作などを防ぐ
}

// ----------------------------------------------------
// ここから下は数学的な判定ロジック（私を見つける魔法）です
// ----------------------------------------------------

function isConcyclic(p1, p2, p3, p4) {
  let d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  
  if (abs(d) < 0.0001) return false; 
  
  let ux = ((p1.x**2 + p1.y**2) * (p2.y - p3.y) + (p2.x**2 + p2.y**2) * (p3.y - p1.y) + (p3.x**2 + p3.y**2) * (p1.y - p2.y)) / d;
  let uy = ((p1.x**2 + p1.y**2) * (p3.x - p2.x) + (p2.x**2 + p2.y**2) * (p1.x - p3.x) + (p3.x**2 + p3.y**2) * (p2.x - p1.x)) / d;
  
  let r2 = (p1.x - ux)**2 + (p1.y - uy)**2;
  let d4_2 = (p4.x - ux)**2 + (p4.y - uy)**2;
  
  return abs(r2 - d4_2) < 0.0001;
}

function checkGameOver() {
  let n = points.length;
  if (n < 4) return false; 
  
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          if (isConcyclic(points[i], points[j], points[k], points[l])) {
            return true; 
          }
        }
      }
    }
  }
  return false;
}
