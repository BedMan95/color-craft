// Generates a high-quality sample canvas with portrait-like tones, sky gradient, and foliage
export function generateSampleImage(width = 1600, height = 1066) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Sky & Sun Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  skyGrad.addColorStop(0, '#3873b9');
  skyGrad.addColorStop(0.4, '#76a8d8');
  skyGrad.addColorStop(0.7, '#e4c49d');
  skyGrad.addColorStop(1, '#f7934c');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Distant Mountains
  ctx.fillStyle = '#445168';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.55);
  for (let x = 0; x <= width; x += 100) {
    const y = height * 0.55 - Math.sin(x * 0.003) * 80 - Math.cos(x * 0.007) * 40;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // 3. Middle Forest / Hills
  ctx.fillStyle = '#2d4a2d';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  for (let x = 0; x <= width; x += 80) {
    const y = height * 0.65 - Math.sin(x * 0.005) * 60;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // 4. Foreground Golden Field
  const groundGrad = ctx.createLinearGradient(0, height * 0.7, 0, height);
  groundGrad.addColorStop(0, '#9e782f');
  groundGrad.addColorStop(1, '#533c14');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);

  // 5. Stylized Subject / Skin Tone & Warm Light Circle
  const cx = width * 0.5;
  const cy = height * 0.62;

  // Body / jacket (navy)
  ctx.fillStyle = '#1c2438';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 220, 180, 240, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head / Face (warm skin tone)
  ctx.fillStyle = '#e8a87c';
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.fill();

  // Highlight on cheek
  ctx.fillStyle = 'rgba(255, 218, 195, 0.4)';
  ctx.beginPath();
  ctx.arc(cx + 25, cy - 10, 45, 0, Math.PI * 2);
  ctx.fill();

  // Hair (dark brown)
  ctx.fillStyle = '#2c1810';
  ctx.beginPath();
  ctx.arc(cx, cy - 30, 95, Math.PI * 0.85, Math.PI * 2.15);
  ctx.fill();

  // 6. Text Label Watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ColorSchema Studio Sample (1600x1066)', width - 40, 60);

  const img = new Image();
  img.src = canvas.toDataURL('image/jpeg', 0.95);
  return img;
}
