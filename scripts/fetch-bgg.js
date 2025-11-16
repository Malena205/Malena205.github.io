const fs = require('fs');
const path = require('path');

async function fetchBGGData() {
  const token = process.env.BGG_TOKEN;
  if (!token) {
    throw new Error('BGG_TOKEN environment variable is required');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  // Fetch recent plays
  const playsResponse = await fetch('https://boardgamegeek.com/xmlapi2/plays?username=lena205', { headers });
  if (!playsResponse.ok) {
    throw new Error(`Failed to fetch plays: ${playsResponse.status}`);
  }
  const playsXml = await playsResponse.text();

  // Parse plays XML to extract game IDs
  const gameIdMatches = playsXml.matchAll(/objectid="(\d+)"/g);
  const playedGameIds = [];
  for (const match of gameIdMatches) {
    const gameId = match[1];
    if (playedGameIds.length >= 12) break;
    if (!playedGameIds.includes(gameId)) {
      playedGameIds.push(gameId);
    }
  }

  if (playedGameIds.length === 0) {
    console.log('No games found, writing empty array');
    fs.writeFileSync(
      path.join(__dirname, '../public/bgg-games.json'),
      JSON.stringify([], null, 2)
    );
    return;
  }

  // Fetch game details
  const thingsResponse = await fetch(
    `https://boardgamegeek.com/xmlapi2/things?id=${encodeURIComponent(playedGameIds.join(','))}`,
    { headers }
  );
  if (!thingsResponse.ok) {
    throw new Error(`Failed to fetch things: ${thingsResponse.status}`);
  }
  const thingsXml = await thingsResponse.text();

  // Parse things XML to extract game info
  const games = [];
  const itemRegex = /<item[^>]*id="(\d+)"[^>]*>[\s\S]*?<\/item>/g;
  const nameRegex = /<name[^>]*type="primary"[^>]*value="([^"]+)"/;
  const imageRegex = /<image>([^<]+)<\/image>/;

  let itemMatch;
  while ((itemMatch = itemRegex.exec(thingsXml)) !== null) {
    const itemXml = itemMatch[0];
    const gameId = itemMatch[1];

    const nameMatch = itemXml.match(nameRegex);
    const imageMatch = itemXml.match(imageRegex);

    const name = nameMatch ? nameMatch[1] : 'Unknown name';
    const imgSrc = imageMatch ? imageMatch[1] : '/profile-pic.jpg';
    const href = `https://boardgamegeek.com/boardgame/${gameId}`;

    games.push({ name, href, imgSrc });
  }

  // Reorder games to match the original playedGameIds order
  const orderedGames = playedGameIds
    .map(id => games.find(g => g.href.includes(`/${id}`)))
    .filter(Boolean);

  // Write to JSON file
  const outputPath = path.join(__dirname, '../public/bgg-games.json');
  fs.writeFileSync(outputPath, JSON.stringify(orderedGames, null, 2));
  console.log(`Successfully wrote ${orderedGames.length} games to ${outputPath}`);
}

fetchBGGData().catch(err => {
  console.error('Error fetching BGG data:', err);
  process.exit(1);
});
