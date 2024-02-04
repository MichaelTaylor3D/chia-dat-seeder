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

    loadPushedFiles(): Record<string, boolean>;
    savePushedFile(filename: string): void;
    queueFile(filePath: string): void;
    processQueue(): Promise<void>;
    pushFile(filePath: string): Promise<void>;
    setAuthCredentials(authCredentials: AuthCredentials): void;
    start(): Promise<void>;
    beginMonitoring(): Promise<void>;
  }

  export = FileMonitor;
}
