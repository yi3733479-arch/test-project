const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── In-memory data: 포켓몬 10마리 (전국도감 1~10번) ──────────────
const POKEMONS = [
  {
    id: 1,
    nameEn: 'bulbasaur',
    nameKo: '이상해씨',
    types: ['grass', 'poison'],
    height: 0.7,
    weight: 6.9,
    stats: { hp: 45, attack: 49, defense: 49, 'special-attack': 65, 'special-defense': 65, speed: 45 },
    description: '태어났을 때부터 등에 이상한 씨앗이 심어져 있으며 몸과 함께 서서히 성장한다고 한다.',
  },
  {
    id: 2,
    nameEn: 'ivysaur',
    nameKo: '이상해풀',
    types: ['grass', 'poison'],
    height: 1.0,
    weight: 13.0,
    stats: { hp: 60, attack: 62, defense: 63, 'special-attack': 80, 'special-defense': 80, speed: 60 },
    description: '등에 있는 씨앗에 영양분이 쌓이면 커다란 꽃을 피우기 위해 무럭무럭 자란다고 한다.',
  },
  {
    id: 3,
    nameEn: 'venusaur',
    nameKo: '이상해꽃',
    types: ['grass', 'poison'],
    height: 2.0,
    weight: 100.0,
    stats: { hp: 80, attack: 82, defense: 83, 'special-attack': 100, 'special-defense': 100, speed: 80 },
    description: '햇빛이 강한 날에는 하루 종일 꽃에서 달콤한 향기가 퍼진다고 한다.',
  },
  {
    id: 4,
    nameEn: 'charmander',
    nameKo: '파이리',
    types: ['fire'],
    height: 0.6,
    weight: 8.5,
    stats: { hp: 39, attack: 52, defense: 43, 'special-attack': 60, 'special-defense': 50, speed: 65 },
    description: '태어났을 때부터 꼬리에 불이 붙어 있으며, 그 불이 꺼지면 죽어버린다고 한다.',
  },
  {
    id: 5,
    nameEn: 'charmeleon',
    nameKo: '리자드',
    types: ['fire'],
    height: 1.1,
    weight: 19.0,
    stats: { hp: 58, attack: 64, defense: 58, 'special-attack': 80, 'special-defense': 65, speed: 80 },
    description: '난폭한 성격으로, 강한 상대를 만나면 꼬리 끝의 불꽃이 격렬하게 타오른다고 한다.',
  },
  {
    id: 6,
    nameEn: 'charizard',
    nameKo: '리자몽',
    types: ['fire', 'flying'],
    height: 1.7,
    weight: 90.5,
    stats: { hp: 78, attack: 84, defense: 78, 'special-attack': 109, 'special-defense': 85, speed: 100 },
    description: '하늘을 힘차게 날아다니며, 입에서 뿜는 불꽃은 무엇이든 태워버릴 정도로 강력하다고 한다.',
  },
  {
    id: 7,
    nameEn: 'squirtle',
    nameKo: '꼬부기',
    types: ['water'],
    height: 0.5,
    weight: 9.0,
    stats: { hp: 44, attack: 48, defense: 65, 'special-attack': 50, 'special-defense': 64, speed: 43 },
    description: '태어났을 때는 등딱지가 부드럽지만, 자라면서 단단하게 굳어진다고 한다.',
  },
  {
    id: 8,
    nameEn: 'wartortle',
    nameKo: '어니부기',
    types: ['water'],
    height: 1.0,
    weight: 22.5,
    stats: { hp: 59, attack: 63, defense: 80, 'special-attack': 65, 'special-defense': 80, speed: 58 },
    description: '복슬복슬한 꼬리는 나이가 들수록 색이 짙어져 오래 산 것을 알 수 있다고 한다.',
  },
  {
    id: 9,
    nameEn: 'blastoise',
    nameKo: '거북왕',
    types: ['water'],
    height: 1.6,
    weight: 85.5,
    stats: { hp: 79, attack: 83, defense: 100, 'special-attack': 85, 'special-defense': 105, speed: 78 },
    description: '등딱지에 있는 대포에서 물을 강하게 쏘아 사격 정밀도는 백발백중이라고 한다.',
  },
  {
    id: 10,
    nameEn: 'caterpie',
    nameKo: '캐터피',
    types: ['bug'],
    height: 0.3,
    weight: 2.9,
    stats: { hp: 45, attack: 30, defense: 35, 'special-attack': 20, 'special-defense': 20, speed: 45 },
    description: '길고 끈적끈적한 혀를 내밀어 잎사귀를 계속 먹으며, 몸에서는 강한 냄새가 난다고 한다.',
  },
];

// 이미지는 PokeAPI의 REST API가 아니라 공개 스프라이트 저장소(정적 파일)를 그대로 참조합니다.
const imageUrl = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const toSummary = (p) => ({
  id: p.id,
  nameEn: p.nameEn,
  nameKo: p.nameKo,
  types: p.types,
  image: imageUrl(p.id),
});

const toDetail = (p) => ({ ...p, image: imageUrl(p.id) });

// ── API routes ───────────────────────────────
app.get('/api/pokemons', (_req, res) => {
  res.json({ success: true, data: POKEMONS.map(toSummary) });
});

app.get('/api/pokemons/:id', (req, res) => {
  const id = Number(req.params.id);
  const pokemon = POKEMONS.find((p) => p.id === id);
  if (!pokemon) {
    return res.status(404).json({ success: false, message: '해당 포켓몬을 찾을 수 없습니다' });
  }
  res.json({ success: true, data: toDetail(pokemon) });
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
