export const toDateTime = (secs: number) => {
  const t = new Date(+0); // Unix epoch start.
  t.setSeconds(secs);
  return t;
};
