/** Money helpers — store INR as Number; serialize as "5490.00" */

export const toMoney = (n) => {
  const value = Number(n);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
};

export const formatMoney = (n) => toMoney(n).toFixed(2);

export const toPaise = (n) => Math.round(toMoney(n) * 100);
