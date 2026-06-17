let allHistory = []; // 試合中に置かれたすべての石の歴史を保存
let points = []; // 現在画面に表示されている石の座標
let currentStep = 0; // 感想戦で今「何手目」を見ているか

let gridSize = 8; // デフォルトのグリッドサイズ
let cellSize; // 1マスのサイズ
let boardOffsetX = 0; // 盤面を中央に寄せるための隙間（X）
let boardOffsetY = 0; // 盤面を中央に寄せるための隙間（Y）

// UI要素（ボタンと入力ボックス）
let checkButton, resetButton, prevButton, nextButton;
let sizeInput; 

let foundCircles = []; // 現在の盤面で見つかっている共円（および直線）リスト
let isGameOver = false; // 感想戦中かどうかを管理するフラグ

function setup() {
  createCanvas(windowWidth, windowHeight);

  // ボタンや入力ボックスの共通スタイルを設定するヘルパー
  function styleElement(el, bgColor, widthSize = 140) {
    el.size(widthSize, 45);
    el.style('font-size', '15px');
    el.style('background-color', bgColor);
    el.style('color', 'white');
    el.style('border', 'none');
    el.style('border-radius', '8px');
    el.style('font-weight', 'bold');
    el.style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)');
  }

  // ① 共円CHECKボタン
  checkButton = createButton('共円をCHECK！');
  styleElement(checkButton, '#ff4757');
  checkButton.mousePressed(checkKyouen);

  // ② 次のゲームへボタン
  resetButton = createButton('次のゲームへ');
  styleElement(resetButton, '#2ed573');
  resetButton.mousePressed(resetGame);

  // ③ 1手戻るボタン
  prevButton = createButton('← 1手戻る');
  styleElement(prevButton, '#1e90ff');
  prevButton.mousePressed(prevStep);
  prevButton.hide();

  // ④ 1手進むボタン
  nextButton = createButton('1手進む →');
  styleElement(nextButton, '#1e90ff');
  nextButton.mousePressed(nextStep);
  nextButton.hide();

  // ⑤ 盤面サイズ入力ボックス
  sizeInput = createInput(String(gridSize), 'number');
  sizeInput.size(130, 35);
  sizeInput.style('font-size', '16px');
  sizeInput.style('font-weight', 'bold');
  sizeInput.style('text-align', 'center');
  sizeInput.style('border', '2px solid #ccc');
  sizeInput.style('border-radius', '6px');
  sizeInput.input(changeGridSize);

  calculateLayout();
  positionElements();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateLayout();
  positionElements();
}

function changeGridSize() {
  let val = int(sizeInput.value());
  if (isNaN(val) || val < 3) val = 3;
  if (val > 20) val = 20;
  
  gridSize = val;
  resetGame(); 
}

function calculateLayout() {
  let availableWidth = windowWidth - 180;
  let availableHeight = windowHeight - 40;
  let minSize = min(availableWidth, availableHeight);
  
  cellSize = minSize / (gridSize + 2);
  
  boardOffsetX = 160 + (availableWidth - minSize) / 2;
  boardOffsetY = (availableHeight - minSize) / 2 + 20;
}

function positionElements() {
  checkButton.position(15, 20);
  resetButton.position(15, 80);
  sizeInput.position(15, 175);
  prevButton.position(15, 260);
  nextButton.position(15, 320);
}

function draw() {
  background(240); 
  
  noStroke();
  fill(255, 255, 255, 200);
  rect(0, 0, 160, height);

  fill(50);
  noStroke();
  textSize(13);
  textAlign(LEFT, CENTER);
  text("盤面のサイズ(マス)", 15, 155);

  // 1. 盤面（グリッド）を描画
  stroke(0); 
  strokeWeight(2); 
  for (let i = 1; i <= gridSize + 1; i++) {
    line(boardOffsetX + i * cellSize, boardOffsetY + cellSize, boardOffsetX + i * cellSize, boardOffsetY + (gridSize + 1) * cellSize); 
    line(boardOffsetX + cellSize, boardOffsetY + i * cellSize, boardOffsetX + (gridSize + 1) * cellSize, boardOffsetY + i * cellSize); 
  }

  // 2. 感想戦モード中、デンジャーゾーン（次に置くと円または直線ができる場所）を赤で表示
  if (isGameOver) {
    drawDangerZones();
  }

  // ★ 3. 見つかった共円（および直線）をすべて描画
  for (let i = 0; i < foundCircles.length; i++) {
    let c = foundCircles[i];
    stroke(255, 71, 87); 
    strokeWeight(2.5);

    if (c.type === 'line') {
      // 半径無限大の円（直線）の場合の描画
      // 盤面の端から端まで突き抜ける赤い線を描画します
      let x1 = boardOffsetX + c.x1 * cellSize;
      let y1 = boardOffsetY + c.y1 * cellSize;
      let x2 = boardOffsetX + c.x2 * cellSize;
      let y2 = boardOffsetY + c.y2 * cellSize;
      
      // ベクトルを使って盤面の外側まで線を延長する計算
      let dx = x2 - x1;
      let dy = y2 - y1;
      line(x1 - dx * 20, y1 - dy * 20, x2 + dx * 20, y2 + dy * 20);
    } else {
      // 通常の円の描画
      fill(255, 71, 87, 30); 
      circle(boardOffsetX + c.cx * cellSize, boardOffsetY + c.cy * cellSize, c.r * 2 * cellSize);
      fill(255, 71, 87);
      circle(boardOffsetX + c.cx * cellSize, boardOffsetY + c.cy * cellSize, 6);
    }
  }

  // 4. 置かれた石を描画
  fill(0); 
  noStroke(); 
  for (let i = 0; i < points.length; i++) {
    circle(boardOffsetX + points[i].x * cellSize, boardOffsetY + points[i].y * cellSize, cellSize * 0.4); 
  }
  
  if (isGameOver) {
    fill(80);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);
    text(`現在: ${currentStep} / ${allHistory.length} 手目`, 15, windowHeight - 30);
  }
}

function drawDangerZones() {
  for (let x = 1; x <= gridSize + 1; x++) {
    for (let y = 1; y <= gridSize + 1; y++) {
      if (hasStoneAt(x, y)) continue;

      let testPoints = [...points, { x: x, y: y }];
      if (checkKyouenForPoints(testPoints)) {
        stroke(255, 71, 87);
        strokeWeight(3);
        let px = boardOffsetX + x * cellSize;
        let py = boardOffsetY + y * cellSize;
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

function handlePlaceStone(mx, my) {
  if (isGameOver) return;

  let gridX = Math.round((mx - boardOffsetX) / cellSize);
  let gridY = Math.round((my - boardOffsetY) / cellSize);

  if (gridX >= 1 && gridX <= gridSize + 1 && gridY >= 1 && gridY <= gridSize + 1) {
    if (!hasStoneAt(gridX, gridY)) {
      let newPoint = {x: gridX, y: gridY};
      points.push(newPoint);
      allHistory.push(newPoint); 
    }
  }
}

function mousePressed() {
  if (mouseX < 160) return; 
  handlePlaceStone(mouseX, mouseY);
  return false;
}

function touchStarted() {
  if (mouseX < 160) return; 
  handlePlaceStone(mouseX, mouseY);
  return false; 
}

function checkKyouen() {
  if (isGameOver) return;

  scanGridForAllKyouen();
  isGameOver = true; 
  currentStep = allHistory.length; 

  prevButton.show();
  nextButton.show();

  if (foundCircles.length > 0) {
    alert(`【見事！】\n盤面に ${foundCircles.length} 個の共円（直線含む）を発見しました！\n\n※「1手戻る」ボタンで過去に遡って感想戦ができます！`);
  } else {
    alert("【残念！】\n盤面に共円はありませんでした……。\n\n※「1手戻る」ボタンで感想戦ができます！");
  }
}

function prevStep() {
  if (!isGameOver || currentStep <= 0) return;
  currentStep--;
  points = allHistory.slice(0, currentStep);
  scanGridForAllKyouen();
}

function nextStep() {
  if (!isGameOver || currentStep >= allHistory.length) return;
  currentStep++;
  points = allHistory.slice(0, currentStep);
  scanGridForAllKyouen();
}

function resetGame() {
  points = [];
  allHistory = [];
  foundCircles = []; 
  currentStep = 0;
  isGameOver = false; 
  prevButton.hide();
  nextButton.hide();
  calculateLayout(); 
}

// ----------------------------------------------------
// 数学的な判定ロジック
// ----------------------------------------------------

// 直線の重複チェック（傾きと位置が同じか）
function isUniqueLine(p1, p2) {
  for (let existing of foundCircles) {
    if (existing.type !== 'line') continue;
    // 既存の直線上（existing.x1, y1 と x2, y2を結ぶ線）に、今回のp1とp2の両方が乗っているかチェック
    let d1 = (p1.x - existing.x1) * (existing.y2 - existing.y1) - (p1.y - existing.y1) * (existing.x2 - existing.x1);
    let d2 = (p2.x - existing.x1) * (existing.y2 - existing.y1) - (p2.y - existing.y1) * (existing.x2 - existing.x1);
    if (abs(d1) < 0.001 && abs(d2) < 0.001) {
      return false; // すでに同じ直線が登録されている
    }
  }
  return true;
}

function isUniqueCircle(cx, cy, r) {
  for (let existing of foundCircles) {
    if (existing.type === 'line') continue;
    if (abs(existing.cx - cx) < 0.001 && abs(existing.cy - cy) < 0.001 && abs(existing.r - r) < 0.001) {
      return false; 
    }
  }
  return true;
}

// 4つの点が共円、または一直線（半径無限大の円）かチェックして保存
function checkAndStoreConcyclic(p1, p2, p3, p4) {
  let d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  
  // ★ dがほぼ0の場合：最初の3点(p1, p2, p3)が一直線上にある
  if (abs(d) < 0.0001) {
    // 4つ目の点(p4)もその一直線上にあるかチェック（外積が0になるか）
    let lineCheck = (p4.x - p1.x) * (p2.y - p1.y) - (p4.y - p1.y) * (p2.x - p1.x);
    if (abs(lineCheck) < 0.0001) {
      // 4点とも一直線上の場合（半径無限大の円）
      if (isUniqueLine(p1, p2)) {
        foundCircles.push({ type: 'line', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
    }
    return;
  } 
  
  // 通常の円の計算
  let ux = ((p1.x**2 + p1.y**2) * (p2.y - p3.y) + (p2.x**2 + p2.y**2) * (p3.y - p1.y) + (p3.x**2 + p3.y**2) * (p1.y - p2.y)) / d;
  let uy = ((p1.x**2 + p1.y**2) * (p3.x - p2.x) + (p2.x**2 + p2.y**2) * (p1.x - p3.x) + (p3.x**2 + p3.y**2) * (p2.x - p1.x)) / d;
  
  let r2 = (p1.x - ux)**2 + (p1.y - uy)**2;
  let d4_2 = (p4.x - ux)**2 + (p4.y - uy)**2;
  
  if (abs(r2 - d4_2) < 0.0001) {
    let r = sqrt(r2);
    if (isUniqueCircle(ux, uy, r)) {
      foundCircles.push({ type: 'circle', cx: ux, cy: uy, r: r });
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

// シミュレーション（危険地帯計算用）の判定関数
function checkKyouenForPoints(pts) {
  let n = pts.length;
  if (n < 4) return false;
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          // 通常の円チェック
          let p1 = pts[i], p2 = pts[j], p3 = pts[k], p4 = pts[l];
          let d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
          if (abs(d) < 0.0001) {
            let lineCheck = (p4.x - p1.x) * (p2.y - p1.y) - (p4.y - p1.y) * (p2.x - p1.x);
            if (abs(lineCheck) < 0.0001) return true; // 直線発見
          } else {
            let ux = ((p1.x**2 + p1.y**2) * (p2.y - p3.y) + (p2.x**2 + p2.y**2) * (p3.y - p1.y) + (p3.x**2 + p3.y**2) * (p1.y - p2.y)) / d;
            let uy = ((p1.x**2 + p1.y**2) * (p3.x - p2.x) + (p2.x**2 + p2.y**2) * (p1.x - p3.x) + (p3.x**2 + p3.y**2) * (p2.x - p1.x)) / d;
            let r2 = (p1.x - ux)**2 + (p1.y - uy)**2;
            let d4_2 = (p4.x - ux)**2 + (p4.y - uy)**2;
            if (abs(r2 - d4_2) < 0.0001) return true; // 円発見
          }
        }
      }
    }
  }
  return false;
}
