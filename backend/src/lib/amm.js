/**
 * AMM (Automated Market Maker) logic using constant-product formula.
 */

/**
 * Calculate YES price given pool sizes.
 * @param {number} yesPool
 * @param {number} noPool
 * @returns {number}
 */
export function yesPrice(yesPool, noPool) {
  return noPool / (yesPool + noPool);
}

/**
 * Calculate NO price given pool sizes.
 * @param {number} yesPool
 * @param {number} noPool
 * @returns {number}
 */
export function noPrice(yesPool, noPool) {
  return yesPool / (yesPool + noPool);
}

/**
 * Execute a trade using the constant-product AMM.
 * @param {'YES'|'NO'} side
 * @param {number} amount - Amount of tokens to spend
 * @param {number} yesPool - Current YES pool size
 * @param {number} noPool - Current NO pool size
 * @returns {{ newYesPool: number, newNoPool: number, shares: number, newYesPrice: number, newNoPrice: number }}
 */
export function executeTrade(side, amount, yesPool, noPool) {
  const k = yesPool * noPool;
  let newYesPool, newNoPool, shares;

  if (side === 'YES') {
    newYesPool = yesPool + amount;
    newNoPool = k / newYesPool;
    shares = noPool - newNoPool;
  } else {
    newNoPool = noPool + amount;
    newYesPool = k / newNoPool;
    shares = yesPool - newYesPool;
  }

  const newYesPrice = yesPrice(newYesPool, newNoPool);
  const newNoPrice = noPrice(newYesPool, newNoPool);

  return { newYesPool, newNoPool, shares, newYesPrice, newNoPrice };
}
