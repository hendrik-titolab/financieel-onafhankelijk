export {};
declare global {
  interface Window {
    siteMeting?: {
      event(name: string, params?: Record<string, unknown>): void;
      once(name: string, params?: Record<string, unknown>): void;
      formSubmit(formId: string): void;
      formResult(formId: string, ok: boolean, errorType?: string, status?: number): void;
      toolStart(toolId: string): void;
      toolAttempt(toolId: string): void;
      toolResult(toolId: string, ok: boolean, errorType?: string): void;
      enabled(): boolean;
      settings(): void;
    };
  }
}
