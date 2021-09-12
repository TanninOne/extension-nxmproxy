import * as toml from '@iarna/toml';
import * as ChildProcessT from 'child_process';
import JsonSocket from 'json-socket';
import * as net from 'net';
import * as path from 'path';
import { fs, log, types, util } from 'vortex-api';
import { setProxyEnabled } from './actions';

import settingsReducer from './reducers';
import Settings from './Settings';
import { IProxyConfig } from './types';

function defaultConfig(): IProxyConfig {
  return {
    games: {
      _: 'Vortex',
    },
    managers: {
      Vortex: `"${process.execPath}" --download %1`,
    },
    pipes: {
      Vortex: 'vortex_download',
    },
  };
}

async function onLoadOrInit(): Promise<IProxyConfig> {
  const configPath = path.join(util.getVortexPath('localAppData'), 'nxmproxy', 'config.toml');
  try {
    const raw = await fs.readFileAsync(configPath, { encoding: 'utf8' });
    return toml.parse(raw) as any;
  } catch (err) {
    let config = defaultConfig();
    await onSetConfig(config);
    return config;
  }
}

async function onSetConfig(newConfig: IProxyConfig): Promise<void> {
  const configPath = path.join(util.getVortexPath('localAppData'), 'nxmproxy', 'config.toml');
  await fs.writeFileAsync(configPath, toml.stringify(newConfig as any), { encoding: 'utf8' });
}

async function installProxy(api: types.IExtensionApi): Promise<void> {
  const proxyPath = path.join(__dirname, 'nxmproxy.exe');
  // if nxmproxy (any instance) is not the current handler for the protocol, set
  // ourselves up
  try {
    await api.runExecutable(proxyPath, ['test'], { expectSuccess: true });
  } catch (err) {
    try {
      // this will require user to elevate the nxmproxy.exe
      await api.runExecutable(proxyPath, ['install'], { expectSuccess: true });

      // also disable the regular association because nxmproxy should handle the links
      api.store.dispatch({
        type: 'SET_ASSOCIATED_WITH_NXM_URLS',
        payload: false,
      });
    } catch (err) {
      api.showErrorNotification('Failed to activate NXM proxy', err, { allowReport: false });
    }
  }
}

function main(context: types.IExtensionContext) {
  context.registerReducer(['settings', 'nxmproxy'], settingsReducer as any);
  context.registerSettings('NXM Proxy', Settings, () => ({
    onLoadOrInit,
    onSetConfig,
    onGetGameList: () => context.api.ext.getNexusGames(),
  }));

  context.once(async () => {
    const { api } = context;

    api.setStylesheet('proxy-integration', path.join(__dirname, 'stylesheet.scss'));

    api.onStateChange(['settings', 'nexus', 'associateNXM'], (prev, cur) => {
      // if user enabled the regular handling, disable the extension
      if (cur && api.getState().settings['nxmproxy'].enabled) {
        api.store.dispatch(setProxyEnabled(false));
      }
    });

    api.onStateChange(['settings', 'nxmproxy', 'enabled'], (prev, cur) => {
      if (cur) {
        installProxy(api);
      }
    });

    if (api.getState().settings['nxmproxy'].enabled) {
      await installProxy(api);
    }

    net.createServer(socket => {
      console.log('dl client connected');
      let input: string = '';
      socket
        .setEncoding('utf8')
        .on('data', data => input += data)
        .on('end', (hadError: boolean) => {
          if (!hadError) {
            console.log('got url: ', input);
            api.events.emit('start-download-url', input);
          }
        });
    })
    .listen('\\\\?\\pipe\\vortex_download');
  });

  return true;
}

export default main;
