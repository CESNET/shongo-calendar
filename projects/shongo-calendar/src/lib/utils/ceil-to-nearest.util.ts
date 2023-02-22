export const ceilToNearest = (amount: number, precision: number) => {
  return Math.ceil(amount / precision) * precision;
};
