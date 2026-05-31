import { useState } from 'react';
import Platform from './Platform';
import HoroofZone from './App';
import CategoryBoard from './games/CategoryBoard';
import WordChain from './games/WordChain';

export default function Root() {
  const q = new URLSearchParams(window.location.search);
  const forceHuroof = q.get('pvp') || q.get('remote');
  const [game, setGame] = useState(forceHuroof ? 'huroof' : null);
  const back = () => setGame(null);

  if (!game) return <Platform onSelect={setGame} />;
  if (game === 'huroof')    return <HoroofZone onBack={back} />;
  if (game === 'category')  return <CategoryBoard onBack={back} />;
  if (game === 'chain')     return <WordChain onBack={back} />;
  return <Platform onSelect={setGame} />;
}
