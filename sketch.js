let points = []; // 置いた石の座標を保存する配列
let gridSize = 8; // グリッドのサイズ（9×9の交点）
let cellSize; // 1マスのサイズ

let checkButton; // 「CHECK」ボタン
let resetButton; // 「RESET」ボタン

let foundCircles = []; // 見つかったすべての共円リスト
let isGameOver = false; // ★ 感想戦中かどうかを管理するフラグ

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 盤面サイズの設定
  let minSize = min(windowWidth, windowHeight);
  cellSize = minSize / (gridSize + 2);

  // 「CHECK」ボタンの作成と設定
  checkButton = createButton('共円をCHECK！');
  checkButton.position(20, 20);
  checkButton.size(140, 40);
  checkButton.style('font-size', '16px');
  checkButton.style('background-color', '#ff4757');
  checkButton.style('color', 'white');
  checkButton.style('border', 'none');
  checkButton.style('border-radius', '5px');
  checkButton.style('font-weight', 'bold');
  checkButton.mousePressed(checkKyouen);

  // 「RESET」ボタンの作成と設定
  resetButton = createButton('次のゲームへ (リセット)');
  resetButton.position(180, 20);
  resetButton.size(180, 40); // 感想戦のあとに押しやすいよう、少し大きくしました
  resetButton.style('font-size', '16px');
  resetButton.style('background-color', '#2ed573');
  resetButton.style('color', 'white');
  resetButton.style('border', 'none');
  resetButton.style('border-radius', '5px');
  resetButton.style('font-weight', 'bold');
  resetButton.mousePressed(resetGame);
}

function draw() {
  background(240); // 背景を薄いグレーに
  
  // 1. 盤面（グリッド）を描画
  stroke(0); 
  strokeWeight(2); 
  for (let i = 1; i <= gridSize + 1; i++) {
    line(i * cellSize, cellSize, i * cellSize, (gridSize + 1) * cellSize); // 縦線
    line(cellSize, i * cellSize, (gridSize + 1) * cellSize, i * cellSize); // 横線
  }

  // 2. 見つかった共円をすべて描画（感想戦中ずっと表示されます）
  for (let i = 0; i < foundCircles.length; i++) {
    let c = foundCircles[i];
    fill(255, 71, 87, 35); // 赤いシースルーな円
    stroke(255, 71, 87); 
    strokeWeight(2.5);
    circle(c.cx * cellSize, c.cy * cellSize, c.r * 2 * cellSize);
    
    // 中心点
    fill(255, 71, 87);
    circle(c.cx * cellSize, c.cy * cellSize, 6);
  }

  // 3. 置かれた石を描画
  fill(0); 
  noStroke(); 
  for (let i = 0; i < points.length; i++) {
    circle(points[i].x * cellSize, points[i].y * cellSize, cellSize * 0.4); 
  }
  
  // 4. ★ 感想戦モード中の見た目の演出
  if (isGameOver) {
    fill(0, 0, 0, 15); // 画面全体をほんのり暗くして「決着がついた感」を出します
    rect(0, 0, width, height);
  }
}

// 画面をクリック・タップしたときの処理（石を置く）
function mousePressed() {
  if (mouseY < 80) return; // ボタン付近のタップは無視

  // ★ すでにCHECKが終わっている（感想戦モード）場合は石を置けないようにする
  if (isGameOver) return;

  let gridX = Math.round(mouseX / cellSize);
  let gridY = Math.round(mouseY / cellSize);

  if (gridX >= 1 && gridX <= gridSize + 1 && gridY >= 1 && gridY <= gridSize + 1) {
    let alreadyExists = false;
    for (let i = 0; i < points.length; i++) {
      if (points[i].x === gridX && points[i].y === gridY) {
        alreadyExists = true;
        break;
      }
    }

    if (!alreadyExists) {
      points.push({x: gridX, y: gridY});
    }
  }
  return false; 
}

// CHECKボタンが押された時の勝敗判定
function checkKyouen() {
  // すでに感想戦中なら何もしない
  if (isGameOver) return;

  // 盤面をスキャンしてすべての共円を見つけ出す
  scanGridForAllKyouen();

  isGameOver = true; // ★ 感想戦モードに突入！

  if (foundCircles.length > 0) {
    // 共円があった場合
    let totalCount = foundCircles.length;
    alert("【見事！】\n盤面に " + totalCount + " 個の共円を発見しました！\nCHECKボタンを押したプレイヤーの勝ちです！\n\n※このまま盤面を見て感想戦ができます。終わったら右上のリセットボタンを押してね。");
  } else {
    // 共円がなかった場合
    alert("【残念！】\n盤面に共円はありませんでした……。\nCHECKボタンを押したプレイヤーの負けです！\n\n※このまま盤面を見て感想戦ができます。終わったら右上のリセットボタンを押してね。");
  }
}

// ゲームをリセットして次の試合にいく関数
function resetGame() {
  points = [];
  foundCircles = []; 
  isGameOver = false; // ★ 感想戦モードを解除
}

// ----------------------------------------------------
// 数学的な判定ロジック（私を見つけてすべて形にする魔法）
// ----------------------------------------------------

function isUniqueCircle(cx, cy, r) {
  for (let i = 0; i < foundCircles.length; i++) {
    let existing = foundCircles[i];
    if (abs(existing.cx - cx) < 0.001 && abs(existing.cy - cy) < 0.001 && abs(existing.r - r) < 0.001) {
      return false; 
    }
  }
  return true;
}

function checkAndStoreConcyclic(p1, p2, p3, p4) {
  let d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (abs(d) < 0.0001) return; 
  
  let ux = ((p1.x**2 + p1.y**2) * (p2.y - p3.y) + (p2.x**2 + p2.y**2) * (p3.y - p1.y) + (p3.x**2 + p3.y**2) * (p1.y - p2.y)) / d;
  let uy = ((p1.x**2 + p1.y**2) * (p3.x - p2.x) + (p2.x**2 + p2.y**2) * (p1.x - p3.x) + (p3.x**2 + p3.y**2) * (p2.x - p1.x)) / d;
  
  let r2 = (p1.x - ux)**2 + (p1.y - uy)**2;
  let d4_2 = (p4.x - ux)**2 + (p4.y - uy)**2;
  
  if (abs(r2 - d4_2) < 0.0001) {
    let r = sqrt(r2);
    if (isUniqueCircle(ux, uy, r)) {
      foundCircles.push({ cx: ux, cy: uy, r: r });
    }
  }
}

function scanGridForAllKyouen() {
  foundCircles = []; 
  let n = points.length;
  if (n < 4) return; 
  
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          checkAndStoreConcyclic(points[i], points[j], points[k], points[l]);
        }
      }
    }
  }
}
