let points = []; // 置いた石の座標を保存する配列
let gridSize = 8; // グリッドのサイズ（9×9の交点）
let cellSize; // 1マスのサイズ

let checkButton; // 「CHECK」ボタン
let resetButton; // 「RESET」ボタン

// ★ 見つかったすべての共円リストを保存する配列に変更
let foundCircles = []; 

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
  resetButton = createButton('リセット');
  resetButton.position(180, 20);
  resetButton.size(90, 40);
  resetButton.style('font-size', '16px');
  resetButton.style('background-color', '#2ed573');
  resetButton.style('color', 'white');
  resetButton.style('border', 'none');
  resetButton.style('border-radius', '5px');
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

  // ★ 2. 見つかった共円を「すべて」描画するループ処理
  for (let i = 0; i < foundCircles.length; i++) {
    let c = foundCircles[i];
    // 赤いシースルーな円を描く
    fill(255, 71, 87, 35); // 重なりが見やすいように透明度を35に少し下げました
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
}

// 画面をクリック・タップしたときの処理（石を置く）
function mousePressed() {
  if (mouseY < 80) return; // ボタン付近のタップは無視

  // すでに共円が表示されている（ゲームが決着している）場合は追加で石を置けないようにする
  if (foundCircles.length > 0) return;

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
function kyouenAlert(count) {
  alert("【見事！】\n盤面に " + count + " 個の共円を発見しました！\nCHECKボタンを押したプレイヤーの勝ちです！\n（OKを押すとリセットされます）");
  resetGame();
}

function checkKyouen() {
  if (foundCircles.length > 0) return;

  // 盤面をスキャンしてすべての共円を見つけ出す
  scanGridForAllKyouen();

  if (foundCircles.length > 0) {
    // 共円があった場合、その総数を数えて発表！
    let totalCount = foundCircles.length;
    setTimeout(() => kyouenAlert(totalCount), 200);
  } else {
    // 共円がなかった場合
    alert("【残念！】\n盤面に共円はありませんでした……。\nCHECKボタンを押したプレイヤーの負けです！");
  }
}

// ゲームをリセットする関数
function resetGame() {
  points = [];
  foundCircles = []; // 配列を空っぽにする
}

// ----------------------------------------------------
// 数学的な判定ロジック（私を見つけてすべて形にする魔法）
// ----------------------------------------------------

// すでにリストにある円と重複していないかチェックする関数
function isUniqueCircle(cx, cy, r) {
  for (let i = 0; i < foundCircles.length; i++) {
    let existing = foundCircles[i];
    // 中心座標と半径がほぼ同じ(誤差0.001未満)ならすでに登録済みの円とみなす
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
    // 新しい円であれば配列に追加
    if (isUniqueCircle(ux, uy, r)) {
      foundCircles.push({ cx: ux, cy: uy, r: r });
    }
  }
}

// 盤面にあるすべての石の組み合わせを漏らさずチェックする関数
function scanGridForAllKyouen() {
  foundCircles = []; // 初期化
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
