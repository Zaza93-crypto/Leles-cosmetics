function toggleMenu(){document.getElementById("mainNav").classList.toggle("open");}
const form=document.getElementById("chatForm");
const input=document.getElementById("chatInput");
const messages=document.getElementById("chatMessages");

/*
 AI BACKEND:
 Replace AI_ENDPOINT below with your deployed Supabase Edge Function URL.
 Example:
 https://YOUR_PROJECT.supabase.co/functions/v1/ai-assistant

 The function should accept POST JSON: { "message": "..." }
 and return JSON: { "reply": "..." }
*/
const AI_ENDPOINT = "";

function addMessage(text,type){if(!messages)return;const d=document.createElement("div");d.className="msg "+type;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;}

async function askAI(text){
  addMessage(text,"user");
  if(!AI_ENDPOINT){
    setTimeout(()=>addMessage(localReply(text),"bot"),450);
    return;
  }
  try{
    const res=await fetch(AI_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})});
    if(!res.ok) throw new Error("AI request failed");
    const data=await res.json();
    addMessage(data.reply || "I'm here to help. Please try asking about perfumes or body oils.","bot");
  }catch(e){addMessage("I'm having trouble connecting right now. Please contact Lele's Cosmetics directly for help with your order.","bot");}
}
function localReply(text){
  const t=text.toLowerCase();
  if(t.includes("oil")) return "Our body oils are currently K75–K100. If you tell me whether you prefer a fresh, sweet or rich scent, I can help narrow it down.";
  if(t.includes("perfume")||t.includes("fragrance")||t.includes("scent")) return "Our perfumes are K100–K200. For everyday use, consider a fresh or elegant scent; for evenings, a richer and bolder fragrance may suit you.";
  if(t.includes("price")||t.includes("cost")) return "Perfumes are K100–K200 and body oils are K75–K100.";
  if(t.includes("order")) return "You can order through the Products page using the WhatsApp order buttons. Mobile Money and Cash on Delivery are available.";
  return "I'd be happy to help. Ask me about perfumes, body oils, prices, or how to order.";
}
function quickAsk(t){askAI(t);}
if(form){form.addEventListener("submit",e=>{e.preventDefault();const t=input.value.trim();if(t){input.value="";askAI(t);}});}
