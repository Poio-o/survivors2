export function rollDice(diceString: string): number {
  if (!diceString) return 0;
  
  const parts = diceString.toLowerCase().split('d');
  if (parts.length !== 2) return 0;
  
  const count = parseInt(parts[0] || '1', 10);
  const sides = parseInt(parts[1], 10);
  
  if (isNaN(count) || isNaN(sides) || count <= 0 || sides <= 0) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  
  return total;
}
