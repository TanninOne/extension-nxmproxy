export interface IGameConfig {
  [key: string]: string;
}

export interface IManagerConfig {
  [key: string]: string;
}

export interface IPipeConfig {
  [key: string]: string;
}

export interface IProxyConfig {
  games: IGameConfig;
  managers: IManagerConfig;
  pipes: IPipeConfig;
}
