// Interaktive Spielewelt Portfolio - Kamera zentriert auf Avatar, Projektportale und Steuerung (WASD & Mobile)

// HTML Grundstruktur erstellen
document.body.innerHTML = `
  <canvas id="gameCanvas" width="800" height="600"></canvas>
  <div id="ui">
    <h1>🚀 Entwickler-Portfolio RPG</h1>
    <p>Steuere deinen Avatar und entdecke Projekte!</p>
    <button id="startButton">Spiel starten</button>
  </div>
`;

// Spiel-Canvas initialisieren
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Spielvariablen definieren
let gameRunning = false;
let avatar = { x: 50, y: 300, width: 50, height: 50, color: 'blue' };
let camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };
let projects = [
  { x: 200, y: 200, name: 'Projekt 1', image: 'https://i.imgur.com/6X1uV3u.png' },
  { x: 400, y: 400, name: 'Projekt 2', image: 'https://i.imgur.com/U8y3mA8.png' },
  { x: 600, y: 300, name: 'Projekt 3', image: 'https://i.imgur.com/B5F6U6m.png' }
];

let background = new Image();
background.src = 'https://i.imgur.com/Z1aZ6GG.png'; // Beispielhintergrund

// Spiel starten
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
  document.getElementById('ui').style.display = 'none';
  gameRunning = true;
  gameLoop();
});

// Spiel-Loop
function gameLoop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Spiel aktualisieren
function update() {
  if (keys['ArrowRight'] || keys['d']) avatar.x += 5;
  if (keys['ArrowLeft'] || keys['a']) avatar.x -= 5;
  if (keys['ArrowUp'] || keys['w']) avatar.y -= 5;
  if (keys['ArrowDown'] || keys['s']) avatar.y += 5;
  
  // Begrenzung innerhalb des Canvas
  avatar.x = Math.max(0, avatar.x);
  avatar.y = Math.max(0, avatar.y);
  
  // Kamera zentriert auf Avatar
  camera.x = avatar.x - canvas.width / 2 + avatar.width / 2;
  camera.y = avatar.y - canvas.height / 2 + avatar.height / 2;
  
  // Kamera bleibt innerhalb der Spielwelt
  camera.x = Math.max(0, camera.x);
  camera.y = Math.max(0, camera.y);
}

// Spiel zeichnen
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Hintergrund zeichnen
  ctx.drawImage(background, -camera.x, -camera.y, background.width, background.height);
  
  // Avatar zeichnen
  ctx.fillStyle = avatar.color;
  ctx.fillRect(avatar.x - camera.x, avatar.y - camera.y, avatar.width, avatar.height);
  
  // Projekte als Portale zeichnen
  projects.forEach(project => {
    let portalImage = new Image();
    portalImage.src = project.image;
    ctx.drawImage(portalImage, project.x - camera.x, project.y - camera.y, 70, 70);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(project.name, project.x - camera.x, project.y - camera.y + 80);
  });
}

// Tasteneingaben erfassen
let keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Mobile Steuerung hinzufügen
document.addEventListener('touchstart', handleTouch, false);
document.addEventListener('touchmove', handleTouch, false);
document.addEventListener('touchend', handleTouch, false);

let touchStart = { x: 0, y: 0 };
let touchEnd = { x: 0, y: 0 };

function handleTouch(e) {
  const touch = e.touches[0] || e.changedTouches[0];
  if (e.type === 'touchstart') {
    touchStart.x = touch.clientX;
    touchStart.y = touch.clientY;
  } else if (e.type === 'touchmove') {
    touchEnd.x = touch.clientX;
    touchEnd.y = touch.clientY;
    handleSwipe();
  }
}

function handleSwipe() {
  const dx = touchEnd.x - touchStart.x;
  const dy = touchEnd.y - touchStart.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) avatar.x += 5; // Rechts
    else avatar.x -= 5; // Links
  } else {
    if (dy > 0) avatar.y += 5; // Unten
    else avatar.y -= 5; // Oben
  }
}

console.log('🚀 Interaktive Spielewelt mit Kamera und Steuerung initialisiert!');
