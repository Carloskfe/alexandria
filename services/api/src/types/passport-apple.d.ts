declare module '@nicokaiser/passport-apple' {
  import { Strategy as PassportStrategy } from 'passport';

  interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    key: string | Buffer;
    callbackURL: string;
    scope?: string[];
    passReqToCallback?: boolean;
  }

  class Strategy extends PassportStrategy {
    constructor(options: AppleStrategyOptions, verify: (...args: any[]) => void);
  }

  export { Strategy };
}
