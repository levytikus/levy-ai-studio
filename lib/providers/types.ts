export type ProviderName="openai"|"anthropic"|"gemini";
export type AgentResult={provider:ProviderName;text:string;durationMs:number};
export interface AIProvider{name:ProviderName;generate(prompt:string,system?:string):Promise<AgentResult>}
