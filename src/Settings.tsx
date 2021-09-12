import React, { useEffect } from 'react';
import { ControlLabel, FormGroup, HelpBlock } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Select, { Option } from 'react-select';
import { FormInput, MainContext, More, Toggle, tooltip, types } from 'vortex-api';
import { setProxyEnabled } from './actions';
import { NAMESPACE } from './constants';
import { IProxyConfig } from './types';

interface INexusGame {
  name: string;
  domain_name: string;
}

export interface ISettingsProps {
  onLoadOrInit: () => Promise<IProxyConfig>;
  onSetConfig: (newConfig: IProxyConfig) => void;
  onGetGameList: () => Promise<INexusGame[]>;
}

export interface IResolvedProps {
  config: IProxyConfig;
  games: INexusGame[];
  onReloadConfig: () => void;
  onSetConfig: (newConfig: IProxyConfig) => void;
}

export interface IManagerListProps {
  t: types.TFunction;
  managers: { [name: string]: string };
  pipes: { [manager: string]: string };
  onSetItem: (id: string, exePath: string, pipe: string) => void;
  onRemoveItem: (id: string) => void;
}

export interface IManagerListItemProps {
  t: types.TFunction;
  name: string;
  exePath: string;
  pipe: string;
  editing: boolean;
  onEdit: (name: string) => void;
  onChange: (id: string, exePath: string, pipe: string) => void;
  onRemove: (name: string) => void;
}

export interface IGamesListProps {
  t: types.TFunction;
  games: { [name: string]: string };
  gameOptions: INexusGame[];
  managers: string[];
  onSetItem: (game: string, manager: string) => void;
  onRemoveItem: (game: string) => void;
}

export interface IGameListItemProps {
  t: types.TFunction;
  game: string;
  gameOptions: INexusGame[];
  manager: string;
  managers: string[];
  editing: boolean;
  onEdit: (game: string) => void;
  onChange: (game: string, manager: string) => void;
  onRemove: (game: string) => void;
}

interface IEditFieldProps {
  edit: boolean;
  storedValue: string;
  value: string;
  onChange: (newValue: string) => void;
}

function EditField(props: IEditFieldProps): JSX.Element {
  const { edit, storedValue, value, onChange } = props;
  return edit ? (
    <FormInput value={value} onChange={onChange} />
  ) : <>{storedValue}</>;
}

function ManagerListItem(props: IManagerListItemProps) {
  const { t, editing, exePath, name, onChange, onEdit, onRemove, pipe } = props;

  const [editName, setEditName] = React.useState(name);
  const [editExe, setEditExe] = React.useState(exePath);
  const [editPipe, setEditPipe] = React.useState(pipe);

  const ctx: any = React.useContext(MainContext);

  const cancel = React.useCallback(() => {
    onEdit(null);
  }, [onEdit]);

  const save = React.useCallback(() => {
    if (editName !== name) {
      onRemove(name);
    }
    onChange(editName, editExe, editPipe);
    onEdit(null);
  }, [onEdit, name, editName, editExe, editPipe]);

  const onEditCB = React.useCallback(() => {
    setEditName(name);
    setEditExe(exePath);
    setEditPipe(pipe);
    onEdit(name);
  }, [onEdit, exePath, name, pipe, setEditName, setEditExe, setEditPipe]);

  const onRemoveCB = React.useCallback(async () => {
    const sel = await ctx.api.showDialog('question', 'Confirm', {
      text: 'Really remove Manager "{{name}}"',
      parameters: {
        name,
      },
    }, [
      { label: 'Cancel' },
      { label: 'Remove' },
    ])

    if (sel.action == 'Remove') {
      onRemove(name);
    }
  }, []);

  return (
    <tr>
      <td>
        <EditField edit={editing} storedValue={name} value={editName} onChange={setEditName} />
      </td>
      <td>
        <EditField edit={editing} storedValue={exePath} value={editExe} onChange={setEditExe} />
      </td>
      <td>
        <EditField edit={editing} storedValue={pipe} value={editPipe} onChange={setEditPipe} />
      </td>
      <td>
        {editing ? (
          <>
            <tooltip.IconButton icon='input-cancel' tooltip={t('Cancel')} onClick={cancel}/>
            <tooltip.IconButton icon='input-confirm' tooltip={t('Save')} onClick={save}/>
          </>
        ) : (
          <>
            <tooltip.IconButton icon='edit' tooltip={t('Edit')} onClick={onEditCB} />
            <tooltip.IconButton icon='remove' tooltip={t('Remove')} onClick={onRemoveCB} />
          </>
        )
        }
      </td>
    </tr>
  );
}

function ManagerList(props: IManagerListProps) {
  const { t, managers, onRemoveItem, onSetItem, pipes } = props;

  const [edit, setEdit] = React.useState<string>(null);

  const addEmpty = React.useCallback(() => {
    onSetItem('New Item', '', '');
    setEdit('New Item');
  }, [onSetItem, setEdit]);

  return (
    <table>
      <thead>
        <tr>
          <th>{t('Manager')}</th>
          <th>{t('Commandline')}
            <More id='more-proxy-cli' name={t('Commandline')}>
              {t('The command line to use to start a download with the manager. '
                + 'Use %1 as placeholder for the url.')}
            </More>
          </th>
          <th>{t('Pipe')}
            <More id='more-proxy-pipe' name={t('Pipe')}>
              {t('Using a pipe is a direct and thus quicker way to forward downloads if the '
                + 'manager is already running but it has to be supported by that manager. '
                + 'Please be precise entering the correct pipe name. You won\'t get an error '
                + 'message if it\'s wrong, you just get no benefit.')}
            </More>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        { Object.keys(managers ?? {}).map(managerId =>
          <ManagerListItem
            t={t}
            name={managerId}
            exePath={managers[managerId]}
            pipe={pipes[managerId]}
            editing={edit === managerId}
            onEdit={setEdit}
            onChange={onSetItem}
            onRemove={onRemoveItem}
          />
        ) }
      </tbody>
      <tfoot>
         <tr><td colSpan={4}>
           <tooltip.IconButton icon='add' tooltip={t('Add a manager')} onClick={addEmpty} />
         </td></tr>
      </tfoot>
    </table>
  );
}

function GameListItem(props: IGameListItemProps) {
  const { t, editing, game, manager, managers, onEdit, onChange, onRemove } = props;

  const [ editGame, setEditGame ] = React.useState(game);
  const [ editManager, setEditManager ] = React.useState(manager);

  const editMe = React.useCallback(() => {
    setEditGame(game);
    setEditManager(manager);
    onEdit(game);
  }, [game, manager]);

  React.useEffect(() => {
    setEditGame(game);
    setEditManager(manager);
  }, [game, manager]);

  const removeCB = React.useCallback(() => {
    onRemove(game);
  }, [game]);

  const cancel = React.useCallback(() => {
    onEdit(null);
  }, []);

  const save = React.useCallback(() => {
    if (editGame !== game) {
      onRemove(game);
    }
    onChange(editGame, editManager);
    onEdit(null);
  }, [game, editGame, editManager]);

  const setEditGameCB = React.useCallback((value: Option<string>) => {
    setEditGame(value.value);
  }, [setEditGame]);

  const setEditManagerCB = React.useCallback((value: Option<string>) => {
    setEditManager(value.value);
  }, [setEditManager]);

  const gameOptions = props.gameOptions
    .map(game => ({ value: game.domain_name, label: game.name }));
  gameOptions.push({ value: '_', label: `<${t('Everything Else')}>` });

  const managerOptions = managers
    .map(manager => ({ value: manager, label: manager }));

  return (
    <tr>
      <td>
        <Select
          disabled={!editing || (game === '_')}
          className='select-compact'
          value={editing ? editGame : game}
          options={gameOptions}
          onChange={setEditGameCB}
        />
      </td>
      <td>
        <Select
          disabled={!editing}
          className='select-compact'
          value={editing ? editManager : manager}
          options={managerOptions}
          onChange={setEditManagerCB}
        />
      </td>
      <td>
        {editing
          ? (
            <>
              <tooltip.IconButton icon='input-cancel' tooltip={t('Cancel')} onClick={cancel}/>
              <tooltip.IconButton icon='input-confirm' tooltip={t('Save')} onClick={save}/>
            </>
          ) :
            <>
              <tooltip.IconButton icon='edit' tooltip={t('Edit')} onClick={editMe}/>
              <tooltip.IconButton
                disabled={game === '_'}
                icon='remove'
                tooltip={t('Remove')}
                onClick={removeCB}
              />
            </>
        }
      </td>
    </tr>
  );
}

function byGameId(lhs: string, rhs: string): number {
  if ((lhs === '_') || (rhs === '_')) {
    return lhs === '_' ? 1 : -1;
  }
  return lhs.localeCompare(rhs);
}

function GamesList(props: IGamesListProps) {
  const { t, games, gameOptions, managers, onSetItem, onRemoveItem } = props;
  const [edit, setEdit] = React.useState<string>(null);

  const createEmpty = React.useCallback(() => {
    const firstUnassigned = gameOptions.find(iter => games[iter.domain_name] === undefined);
    const domain = firstUnassigned.domain_name;
    onSetItem(domain, managers[0]);
    setEdit(domain);
  }, [setEdit, onSetItem, gameOptions, games, managers]);

  return (
    <table>
      <thead>
        <tr>
          <th>{t('Game')}</th>
          <th>{t('Manager')}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
      { Object.keys(games ?? {}).sort(byGameId).map(gameId =>
        <GameListItem
          t={t}
          game={gameId}
          gameOptions={gameOptions}
          manager={games[gameId]}
          managers={managers}
          editing={edit === gameId}
          onEdit={setEdit}
          onChange={onSetItem}
          onRemove={onRemoveItem}
        />
      ) }
      </tbody>
      <tfoot>
        <tr><td colSpan={3}>
          <tooltip.IconButton icon='add' tooltip={t('Add game')} onClick={createEmpty} />
        </td></tr>
      </tfoot>
    </table>
  )
}

function Settings(props: IResolvedProps) {
  const { config, games, onReloadConfig, onSetConfig } = props;

  const configEdit = React.useRef<IProxyConfig>(null);

  React.useEffect(() => {
    configEdit.current = JSON.parse(JSON.stringify(config));
  }, [config]);

  const withEdit = React.useCallback((cb: (cfg: IProxyConfig) => void) => {
    cb(configEdit.current);
    onSetConfig(configEdit.current);
  }, [config]);

  const enabled: boolean = useSelector<types.IState, boolean>(state =>
    state.settings['nxmproxy'].enabled);
  const dispatch = useDispatch();

  const { t } = useTranslation(NAMESPACE);

  const toggleEnabled = React.useCallback(() => {
    dispatch(setProxyEnabled(!enabled));
  }, [dispatch, enabled]);

  const setManager = React.useCallback((name: string, exe: string, pipe: string) => {
    withEdit(cfg => {
      cfg.managers[name] = exe;
      if (pipe !== '') {
        cfg.pipes[name] = pipe;
      } else {
        delete cfg.pipes[name];
      }
    });
  }, [withEdit, config]);

  const removeManager = React.useCallback((name: string) => {
    withEdit(cfg => {
      delete cfg.managers[name];
      delete cfg.pipes[name];
    });
  }, [withEdit, config]);

  const setGame = React.useCallback((name: string, manager: string) => {
    withEdit(cfg => cfg.games[name] = manager);
  }, [withEdit, config]);

  const removeGame = React.useCallback((name: string) => {
    withEdit(cfg => { delete cfg.games[name] });
  }, [withEdit, config]);

  return (
    <form id='proxy-settings-form'>
      <FormGroup>
        <ControlLabel>{t('NXM Proxy')}</ControlLabel>
        <Toggle
          checked={enabled}
          onToggle={toggleEnabled}
        >
          {t('Enable Proxy')}
        </Toggle>
        <HelpBlock>
          {t('The NXM proxy will handle download links from Nexus Mods and then forwards '
            + 'them to the appropriate Manager. Enabling this automatically disables '
            + 'the regular Vortex download handling, please don\'t re-enable it if you '
            + 'want to use the proxy.')}
        </HelpBlock>
        {
          (enabled && (config !== null)) ? (
            <>
              <ControlLabel>{t('Managers')}</ControlLabel>
              <ManagerList
                t={t}
                managers={config.managers}
                pipes={config.pipes}
                onSetItem={setManager}
                onRemoveItem={removeManager}
              />

              <ControlLabel>{t('Games')}</ControlLabel>
              <GamesList
                t={t}
                games={config.games}
                gameOptions={games}
                managers={Object.keys(config.managers ?? {})}
                onSetItem={setGame}
                onRemoveItem={removeGame}
              />
              <hr/>
              <tooltip.Button tooltip={t('Load configuration from disk')} onClick={onReloadConfig}>
                {t('Reload Config')}
              </tooltip.Button>
            </>
          ) : null
        }
      </FormGroup>
    </form>
  );
}

function SettingsDataLoad(props: ISettingsProps) {
  const { onGetGameList, onLoadOrInit, onSetConfig } = props;
  const [config, setConfig] = React.useState<IProxyConfig>(null);
  const [games, setGames] = React.useState<INexusGame[]>([]);

  const reload = React.useCallback(async () => {
    setConfig(await onLoadOrInit());
  }, [setConfig, onLoadOrInit]);

  const changeConfig = React.useCallback((newConfig: IProxyConfig) => {
    setConfig({ ...newConfig });
    onSetConfig(newConfig);
  }, [setConfig, onSetConfig]);

  useEffect(() => {
    const getGames = async () => {
      setGames(await onGetGameList());
    }

    reload();
    getGames();
  }, []);

  return (
    <Settings
      config={config}
      games={games}
      onReloadConfig={reload}
      onSetConfig={changeConfig}
    />
  );
}

export default SettingsDataLoad;
