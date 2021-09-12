import { types, util } from 'vortex-api';
import * as actions from './actions';

export interface ISettingsSpec {
  enabled: boolean;
}

const settingsReducer: types.IReducerSpec<ISettingsSpec> = {
  reducers: {
    ...types.addReducer(actions.setProxyEnabled, (state, payload) =>
      util.setSafe(state, ['enabled'], payload)),
  },
  defaults: {
    enabled: false,
  },
};

export default settingsReducer;
