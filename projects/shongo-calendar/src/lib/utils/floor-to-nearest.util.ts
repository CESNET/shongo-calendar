export const floorToNearest = (amount: number, precision: number) => {
  return Math.floor(amount / precision) * precision;
};
