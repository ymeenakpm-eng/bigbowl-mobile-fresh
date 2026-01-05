if (__DEV__) {
  const g = globalThis;

  if (!g.__bb_keepAwakeEntryHandlerInstalled) {
    g.__bb_keepAwakeEntryHandlerInstalled = true;

    const EU = g.ErrorUtils;
    if (EU && typeof EU.setGlobalHandler === 'function') {
      const prev = typeof EU.getGlobalHandler === 'function' ? EU.getGlobalHandler() : EU._globalHandler;

      EU.setGlobalHandler((error, isFatal) => {
        const msg = String(error?.message ?? error);
        if (msg.includes('Unable to activate keep awake')) {
          return;
        }
        if (typeof prev === 'function') {
          prev(error, isFatal);
        }
      });
    }
  }
}

require('expo-router/entry');
