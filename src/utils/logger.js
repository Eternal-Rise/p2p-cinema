export const doLog = import.meta.env.DEV
  ? (type, message, payload) => console[type](message, payload)
  : () => {};
