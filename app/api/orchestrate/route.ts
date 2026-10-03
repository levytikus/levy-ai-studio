import{NextResponse}from"next/server";import{runCouncil,runProvider}from"../../../lib/orchestrator";import{ProviderName}from"../../../lib/providers/types";

const MAX_TASK_CHARS=6000;
const validProviders=new Set<ProviderName>(["openai","anthropic","gemini"]);

export async function POST(request:Request){
 try{
  const body=await request.json();
  const task=typeof body?.task==="string"?body.task.trim():"";
  if(!task)return NextResponse.json({error:"Informe task."},{status:400});
  if(task.length>MAX_TASK_CHARS)return NextResponse.json({error:`Tarefa muito longa. Limite: ${MAX_TASK_CHARS} caracteres.`},{status:400});
  if(body?.provider){
   if(!validProviders.has(body.provider))return NextResponse.json({error:"Provedor inválido."},{status:400});
   const agent=await runProvider(task,body.provider);
   return NextResponse.json({mode:"single",agent});
  }
  return NextResponse.json({mode:"council",...(await runCouncil(task))});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Erro inesperado."},{status:500})}
}
