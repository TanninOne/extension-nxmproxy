import { createAction } from 'redux-act';

export const setProxyEnabled = createAction('SET_PROXY_ENABLED', (enable: boolean) => enable);