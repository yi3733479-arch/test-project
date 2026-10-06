const express = require('express');
const path = require('path');
const { Readable } = require('stream');

// Node 21+ 내장 .env 로더 (별도 dotenv 패키지 불필요)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(__dirname, '.env'));
  } catch {
    // .env 파일이 없으면 무시 (환경변수로 직접 주입된 경우 등)
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ fal.ai API 키는 서버에만 보관한다. 클라이언트(index.html)로는 절대 내려보내지 않는다.
const FAL_KEY = (process.env.FAL_KEY || '').trim();
const FAL_MODEL_URL = 'https://fal.run/fal-ai/flux/schnell';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── 옵션 매핑 ─────────────────────────────────
const ASPECT_SIZES = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
  '4:5': { width: 819, height: 1024 },
};

const STYLE_SUFFIX = {
  vivid: 'vivid colors, high contrast, digital art',
  anime: 'anime style, cel shading, vibrant illustration',
  photo: 'photorealistic, natural lighting, DSLR photo',
  fantasy: 'fantasy art, magical atmosphere, painterly',
};

// ── API routes ───────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    if (!FAL_KEY) {
      return res.status(500).json({ success: false, message: '서버에 FAL_KEY 환경변수가 설정되어 있지 않습니다 (.env 확인)' });
    }

    const { prompt, aspect, style } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'prompt는 필수입니다' });
    }

    const size = ASPECT_SIZES[aspect] || ASPECT_SIZES['1:1'];
    const suffix = STYLE_SUFFIX[style] || '';
    const fullPrompt = suffix ? `${prompt.trim()}, ${suffix}` : prompt.trim();

    const falRes = await fetch(FAL_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: size,
        num_images: 4,
      }),
    });

    if (!falRes.ok) {
      const errText = await falRes.text().catch(() => '');
      console.error('fal.ai error', falRes.status, errText);
      const message =
        falRes.status === 401 || falRes.status === 403
          ? 'fal.ai 인증에 실패했습니다 (API 키를 확인해주세요)'
          : falRes.status === 429
          ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요'
          : '이미지 생성 서비스 호출에 실패했습니다';
      return res.status(502).json({ success: false, message });
    }

    const data = await falRes.json();
    const images = (data.images || []).map((img, i) => ({
      id: `${Date.now()}-${i}`,
      url: img.url,
      width: img.width,
      height: img.height,
    }));

    if (images.length === 0) {
      return res.status(502).json({ success: false, message: '생성된 이미지가 없습니다' });
    }

    res.json({ success: true, data: { images, seed: data.seed, prompt: fullPrompt } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// fal.ai가 반환한 원격 이미지를 그대로 프록시 + 다운로드 헤더를 붙여서 내려준다
// (원격 CDN이 CORS를 막아도 다운로드 버튼이 항상 동작하도록 서버를 경유시킨다)
app.get('/api/download', async (req, res) => {
  try {
    const { url, filename } = req.query;
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return res.status(400).json({ success: false, message: 'url is required' });
    }
    const upstream = await fetch(url);
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ success: false, message: '이미지를 불러오지 못했습니다' });
    }
    const contentType = upstream.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${(filename || 'nova-imagine').replace(/[^\w.-]/g, '_')}.${ext}"`);
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── SPA fallback (Express 5 문법) ─────────────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Error handler ────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Local: 서버 시작 / Vercel: app export
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
