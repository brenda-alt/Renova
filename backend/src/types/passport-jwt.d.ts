declare module 'passport-jwt' {
  export class Strategy {
    constructor(options: {
      jwtFromRequest: (request: unknown) => string | null;
      ignoreExpiration?: boolean;
      secretOrKey: string;
      algorithms?: string[];
    });
  }

  export namespace ExtractJwt {
    function fromAuthHeaderAsBearerToken(): (request: unknown) => string | null;
  }
}
