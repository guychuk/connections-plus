const canvas = document.getElementById('game-canvas');
canvas.width = 800;
canvas.height = 600;

const ctx = canvas.getContext('2d');

const rows = 4;
const cols = 5;

const tileWidth = canvas.width / cols;
const tileHeight = canvas.height / rows;

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const x = col * tileWidth;
        const y = row * tileHeight;

        ctx.strokeStyle = 'black';
        ctx.strokeRect(x, y, tileWidth, tileHeight);

        ctx.fillStyle = 'lightblue';
        ctx.fillRect(x, y, tileWidth, tileHeight);
    }
}
