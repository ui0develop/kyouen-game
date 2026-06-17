let allHistory = []; // 試合中に置かれたすべての石の歴史を順番に保存する配列
let points = []; // 現在画面に表示されている石の座標（感想戦で増減します）
let currentStep = 0; // 感想戦で今「何手目」を見ているかを表すカウンタ

let gridSize = 8; // グリッドのサイズ（9×9の交点）
let cellSize; // 1マスのサイズ

// ボタンたち
let checkButton, resetButton, prevButton, nextButton;

let foundCircles = []; // 現在の盤面で見つかっている共円リスト
let isGameOver = false; // 感想戦中かどうかを管理するフラグ

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let minSize = min(windowWidth, windowHeight);
  cellSize = minSize / (gridSize + 2);

  // ① 共円CHECKボタン
  checkButton = createButton('共円をCHECK！');
  checkButton.position(20, 20);
  checkButton.size(130, 40);
  checkButton.style('font-size', '14px');
  checkButton.style('background-color', '#ff4757');
  checkButton.style('color', 'white');
  checkButton.style('border', 'none');
  checkButton.style('border-radius', '5px');
  checkButton.style('font-weight', 'bold');
  checkButton.mousePressed(checkKyouen);

  // ② 次のゲームへボタン
  resetButton = createButton('次のゲームへ');
  resetButton.position(160, 20);
  resetButton.size(110, 40);
  resetButton.style('font-size', '14px');
  resetButton.style('background-color', '#2ed573');
  resetButton.style('color', 'white');
  resetButton.style('border', 'none');
  resetButton.style('border-radius', '5px');
  resetButton.style('font-weight', 'bold');
  resetButton.mousePressed(resetGame);

  // ③ 1手戻るボタン（最初は非表示）
  prevButton = createButton('← 1手戻る');
  prevButton.position(285, 20);
  prevButton.size(90, 40);
  prevButton.style('font-size', '14px');
  prevButton.style('background-color', '#1e90ff');
  prevButton.style('color', 'white');
  prevButton.style('border', 'none');
  prevButton.style('border-radius', '5px');
  prevButton.mousePressed(prevStep);
  prevButton.hide();

  // ④ 1手進むボタン（最初は非表示）
  nextButton = createButton('1手進む →');
  nextButton.position(380, 20);
  nextButton.size(90, 40);
  nextButton.style('font-size', '14px');
  nextButton.style('background-color', '#1e90ff');
  nextButton.style('color', 'white');
  nextButton.style('border', 'none');
  nextButton.style('border-radius', '5px');
  nextButton.mousePressed(nextStep);
  nextButton.hide();
}

function draw() {
  background(240); 
  
  // 1. 盤面（グリッド）を描画
  stroke(0); 
  strokeWeight(2); 
  for (let i = 1; i <= gridSize + 1; i++) {
    line(i * cellSize, cellSize, i * cellSize, (gridSize + 1) * cellSize); 
    line(cellSize, i * cellSize, (gridSize + 1) * cellSize, i * cellSize); 
  }

  // ★ 2. 感想戦モード中、次に置くと「共円」になってしまうデンジャーゾーンを赤で表示
  if (isGameOver) {
    drawDangerZones();
  }

  // 3. 見つかった共円をすべて描画
  for (let i = 0; i < foundCircles.length; i++) {
    let c = foundCircles[i];
    fill(255, 71, 87, 30); 
    stroke(255, 71, 87); 
    strokeWeight(2.5);
    circle(c.cx * cellSize, c.cy * cellSize, c.r * 2 * cellSize);
    fill(255, 71, 87);
    circle(c.cx * cellSize, c.cy * cellSize, 6);
  }

  // 4. 置かれた石を描画
  fill(0); 
  noStroke(); 
  for (let i = 0; i < points.length; i++) {
    circle(points[i].x * cellSize, points[i].y * cellSize, cellSize * 0.4); 
  }
  
  // 現在の手数を画面にうっすら表示
  if (isGameOver) {
    fill(100);
    noStroke();
    textSize(16);
    textAlign(LEFT, CENTER);
    text(`現在: ${currentStep} / ${allHistory.length} 手目`, 20, 75);
  }
}

// 危険地帯（次に置いたら共円が成立する場所）をシミュレーションして赤く描画する
function drawDangerZones() {
  for (let x = 1; x <= gridSize + 1; x++) {
    for (let y = 1; y <= gridSize + 1; y++) {
      // すでに石がある場所はスキップ
      if (hasStoneAt(x, y)) continue;

      // 仮想的に石を1個置いてみて、共円ができるかテストする
      let testPoints = [...points, { x: x, y: y }];
      if (checkKyouenForPoints(testPoints)) {
        // 共円ができるなら、そこは踏んだら即死の地雷原（赤色の×印を表示）
        stroke(255, 71, 87);
        strokeWeight(3);
        let px = x * cellSize;
        let py = y * cellSize;
        let offset = cellSize * 0.15;
        line(px - offset, py - offset, px + offset, py + offset);
        line(px - offset, py + offset, px + offset, py - offset);
      }
    }
  }
}

function hasStoneAt(x, y) {
  for (let p of points) {
    if (p.x === x && p.y === y) return true;
  }
  return false;
}

// 画面をクリック・タップしたときの処理
function mousePressed() {
  if (mouseY < 90) return; 
  if (isGameOver) return; // 感想戦中は新しく石を置けない

  let gridX = Math.round(mouseX / cellSize);
  let gridY = Math.round(mouseY / cellSize);

  if (gridX >= 1 && gridX <= gridSize + 1 && gridY >= 1 && gridY <= gridSize + 1) {
    if (!hasStoneAt(gridX, gridY)) {
      let newPoint = {x: gridX, y: gridY};
      points.push(newPoint);
      allHistory.push(newPoint); // 歴史に刻む
    }
  }
  return false; 
}

// CHECKボタンが押された時の勝敗判定
function checkKyouen() {
  if (isGameOver) return;

  scanGridForAllKyouen();
  isGameOver = true; 
  currentStep = allHistory.length; // 現在の手数を最終手に合わせる

  // 感想戦用のボタンを表示
  prevButton.show();
  nextButton.show();

  if (foundCircles.length > 0) {
    alert(`【見事！】\n盤面に ${foundCircles.length} 個の共円を発見しました！\n\n※「1手戻る」ボタンで、どこで共円が完成したのか過去に遡って感想戦ができます！`);
  } else {
    alert("【残念！】\n盤面に共円はありませんでした……。\n\n※「1手戻る」ボタンで、危なかった局面の分析など感想戦ができます！");
  }
}

// ★ 1手戻る処理
function prevStep() {
  if (!isGameOver || currentStep <= 0) return;
  currentStep--;
  // 歴史からその手数までの石を復元
  points = allHistory.slice(0, currentStep);
  // その局面での円を再計算
  scanGridForAllKyouen();
}

// ★ 1手進む処理
function nextStep() {
  if (!isGameOver || currentStep >= allHistory.length) return;
  currentStep++;
  points = allHistory.slice(0, currentStep);
  scanGridForAllKyouen();
}

// ゲームをリセットして次の試合にいく関数
function resetGame() {
  points = [];
  allHistory = [];
  foundCircles = []; 
  currentStep = 0;
  isGameOver = false; 
  prevButton.hide();
  nextButton.hide();
}

// ----------------------------------------------------
// 数学的な判定ロジック
// ----------------------------------------------------

function isUniqueCircle(cx, cy, r, list) {
  for (let existing of list) {
    if (abs(existing.cx - cx) < 0.001 && abs(existing.cy - cy) < 0.001 && abs(existing.r - r) < 0.001) {
      return false; 
    }
  }
  return true;
}

function checkAndGetConcyclic(p1, p2, p3, p4) {
  let d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (abs(d) < 0.0001) return null; 
  
  let ux = ((p1.x**2 + p1.y**2) * (p2.y - p3.y) + (p2.x**2 + p2.y**2) * (p3.y - p1.y) + (p3.x**2 + p3.y**2) * (p1.y - p2.y)) / d;
  let uy = ((p1.x**2 + p1.y**2) * (p3.x - p2.x) + (p2.x**2 + p2.y**2) * (p1.x - p3.x) + (p3.x**2 + p3.y**2) * (p2.x - p1.x)) / d;
  
  let r2 = (p1.x - ux)**2 + (p1.y - uy)**2;
  let d4_2 = (p4.x - ux)**2 + (p4.y - uy)**2;
  
  if (abs(r2 - d4_2) < 0.0001) {
    return { cx: ux, cy: uy, r: sqrt(r2) };
  }
  return null;
}

function scanGridForAllKyouen() {
  foundCircles = []; 
  let n = points.length;
  if (n < 4) return; 
  
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          let c = checkAndGetConcyclic(points[i], points[j], points[k], points[l]);
          if (c && isUniqueCircle(c.cx, c.cy, c.r, foundCircles)) {
            foundCircles.push(c);
          }
        }
      }
    }
  }
}

// 指定された石のリスト内に共円があるかだけをサクッと判定する関数（シミュレーション用）
function checkKyouenForPoints(pts) {
  let n = pts.length;
  if (n < 4) return false;
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          if (checkAndGetConcyclic(pts[i], pts[j], pts[k], pts[l]) !== null) return true;
        }
      }
    }
  }
  return false;
}
