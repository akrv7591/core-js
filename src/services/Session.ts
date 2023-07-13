// import EventEmitter from 'events';
import {ApisauceInstance} from "apisauce";
import * as jose from 'jose';

export interface SessionOptions {
  api: ApisauceInstance;
  storageProvider: StorageProvider;
}

export interface StorageProvider {
  set: (key: string, value: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  remove: (key: string) => Promise<void>;
  clear?: () => Promise<void>;
}

const logWithTs = (...p: any) => {
  console.log(Date.now(), ...p);
}

export class Session {
  // Service parameters
  private api: ApisauceInstance;
  private storageProvider: StorageProvider;

  // Emitter
  // private emitter = new EventEmitter({});
  // public on = this.emitter.on;
  // public off = this.emitter.off;
  // private emit = this.emitter.emit;

  public constructor(options: SessionOptions) {
    // Init service parameters
    this.api = options.api;
    this.storageProvider = options.storageProvider;
  }

  public hasAuthorization = async () => !!await this.getAuthorization();

  public getAuthorization = async (): Promise<string | null> => {
    return await this.storageProvider.get(Session.STORAGE_KEY.SESSION_AUTHORIZATION);
  };

  public setAuthorization = async (authorization: string) => {
    authorization = authorization.replace(/^Bearer\s+/, '');

    const decoded = jose.decodeJwt(authorization);
    if (!decoded) {
      throw new Error('failed to decode');
    }

    logWithTs('decode successfully', decoded);

    // AsyncStorage 에 토큰 저장
    await this.storageProvider.set(Session.STORAGE_KEY.SESSION_AUTHORIZATION, authorization);

    // API Instance header 설정
    this.api.setHeader("Authorization", authorization);
  };

  public removeAuthorization = async () => {
    // API Instance header 에서 토큰 제거
    this.api.deleteHeader("Authorization");

    // 스토리지에서 authorization 제거
    await this.storageProvider.remove(Session.STORAGE_KEY.SESSION_AUTHORIZATION);
  };
}

export namespace Session {
  export enum STORAGE_KEY {
    SESSION_AUTHORIZATION = 'SESSION_AUTHORIZATION',
  }
}
