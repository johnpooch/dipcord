type Logger = {
  info: (message: string) => void;
  error: (message: string) => void;
};

const log: Logger = {
  info: (message: string) => {
    console.log(`INFO: ${message}`);
  },
  error: (message: string) => {
    console.error(`ERROR: ${message}`);
  },
};

const createScopedLogger = (scope: string): Logger => ({
  info: (message: string) => {
    log.info(`(${scope}) ${message}`);
  },
  error: (message: string) => {
    log.error(`(${scope}) ${message}`);
  },
});

export { createScopedLogger };
