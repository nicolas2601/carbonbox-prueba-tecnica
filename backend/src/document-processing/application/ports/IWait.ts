export interface IWait { wait(milliseconds: number, signal: AbortSignal): Promise<void>; }
