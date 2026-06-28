import rateLimit from "express-rate-limit";

const globalRateLimit = (maxreq: number, time: number) => {
  return rateLimit({
    max: maxreq,
    windowMs: time,
    message: {
      error: "Too many requests, please wait a few moments and try again.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export default globalRateLimit;
