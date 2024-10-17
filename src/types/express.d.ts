declare namespace Express {
    export interface Request {
      user?: {
        userUuid: string;
        [key: string]: any;
      };
    }
  }