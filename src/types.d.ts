import { EventEmitter } from "events";

declare module "chia-dat-seeder" {
  interface AuthCredentials {
    username: string;
    password: string;
  }

  interface PresignedPostResponse {
    url: string;
    fields: {
      [key: string]: string;
    };
  }

  class FileMonitor extends EventEmitter {
    dirPath: string;
    serverUrl: string;
    throttleDelay: number;
    authCredentials: AuthCredentials | null;
    pushedFilesPath: string;
    pushedFiles: Record<string, boolean>;
    fileQueue: string[];
    isProcessing: boolean;
    isStarted: boolean;

    constructor(
      dirPath: string,
      serverUrl: string,
      throttleDelay?: number,
      authCredentials?: AuthCredentials | null
    );

    setAuthCredentials(authCredentials: AuthCredentials): void;
    setSeedServer(postEndpoint: string): void;
    start(): Promise<void>;
    on(
      event: "queueLengthChanged",
      listener: (newLength: number) => void
    ): this;
    removeAllListeners(event?: string): this;
  }

  export = FileMonitor;
}
