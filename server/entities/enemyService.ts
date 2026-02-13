export function moveEnemyTowardsPlayer(enemy: any, player: any, speed: number = 1) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      enemy.x += (dx / distance) * speed;
      enemy.y += (dy / distance) * speed;
    } else {
      // Enemy is already at the player's position, do nothing
    }
}

export function setTarget(enemy: any, players: any) {
  if (players.length > 0) {
    enemy.target = players[0]; // Set the first player as the target
    return enemy.target;
  }
}