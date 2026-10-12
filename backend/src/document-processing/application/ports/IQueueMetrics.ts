export interface QueueSnapshot { queued: number; done: number; dead: number; oldestQueuedAgeSeconds: number; }
export interface IQueueMetrics { snapshot(): Promise<QueueSnapshot>; }
