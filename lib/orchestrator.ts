import{openAIProvider}from"./providers/openai";import{anthropicProvider}from"./providers/anthropic";import{geminiProvider}from"./providers/gemini";import{AgentResult,AIProvider,ProviderName}from"./providers/types";

const providers:AIProvider[]=[openAIProvider,anthropicProvider,geminiProvider];
const providerMap=new Map<ProviderName,AIProvider>(providers.map(p=>[p.name,p]));
const hasKey=(name:ProviderName)=>name==="openai"?!!process.env.OPENAI_API_KEY:name==="anthropic"?!!process.env.ANTHROPIC_API_KEY:!!process.env.GEMINI_API_KEY;
const message=(e:unknown)=>e instanceof Error?e.message:"Erro inesperado.";

export type AgentFailure={provider:ProviderName;error:string};
export type CouncilResult={agents:AgentResult[];failures:AgentFailure[];synthesis:string;synthesisProvider?:ProviderName};

export async function runProvider(task:string,name:ProviderName){
 const provider=providerMap.get(name);
 if(!provider)throw new Error("Provedor inválido.");
 if(!hasKey(name))throw new Error(`A chave de ${name} não está configurada.`);
 return provider.generate(task,"Responda de forma curta e objetiva. Este é um teste de conectividade do Levy AI Studio.");
}

export async function runCouncil(task:string):Promise<CouncilResult>{
 const available=providers.filter(p=>hasKey(p.name));
 if(!available.length)throw new Error("Configure ao menos uma chave de API.");
 const settled=await Promise.allSettled(available.map(p=>p.generate(task,"Analise a tarefa de forma independente. Seja concreto, crítico e útil.")));
 const agents:AgentResult[]=[];const failures:AgentFailure[]=[];
 settled.forEach((r,i)=>{const p=available[i];if(r.status==="fulfilled")agents.push(r.value);else failures.push({provider:p.name,error:message(r.reason)})});
 if(!agents.length)throw new Error("Nenhum agente conseguiu responder: "+failures.map(f=>f.provider+": "+f.error).join(" | "));
 if(agents.length===1)return{agents,failures,synthesis:agents[0].text,synthesisProvider:agents[0].provider};
 const prompt=["Tarefa original:",task,"","Respostas dos especialistas:",...agents.map(r=>"\n--- "+r.provider.toUpperCase()+" ---\n"+r.text),"","Consolide os melhores pontos e resolva divergências."].join("\n");
 const successfulProviders=agents.map(a=>a.provider);
 const synthesizer=successfulProviders.includes("openai")?openAIProvider:providerMap.get(successfulProviders[0])!;
 try{const synthesis=await synthesizer.generate(prompt,"Você coordena um conselho multiagente. Produza uma única resposta final clara.");return{agents,failures,synthesis:synthesis.text,synthesisProvider:synthesizer.name}}
 catch(e){failures.push({provider:synthesizer.name,error:"Síntese: "+message(e)});return{agents,failures,synthesis:agents.map(a=>`[${a.provider.toUpperCase()}]\n${a.text}`).join("\n\n"),synthesisProvider:undefined}}
}
