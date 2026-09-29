require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

const SYSTEM = `
You are the Lele's Cosmetics AI Order Assistant.

Business:
- Name: Lele's Cosmetics
- Products: perfumes and body oils
- Perfumes: K100-K200
- Body oils: K75-K100
- Delivery: local delivery
- Payment: Mobile Money or Cash on Delivery
- WhatsApp: +260978955714

Your job:
1. Answer customer questions naturally and politely.
2. Help customers choose products based on budget and preferences.
3. Never invent a product, price, stock status, discount, delivery fee or promotion.
4. When exact stock or a specific product is not in the supplied catalogue, say that availability should be confirmed on WhatsApp.
5. Help customers prepare an order.
6. Keep responses concise and suitable for a WhatsApp-style shopping conversation.
7. If the customer clearly wants to order, include the word ORDER_INTENT somewhere internally is not possible; instead return JSON with intent='order'.

Return valid JSON only:
{"reply":"...", "intent":"chat"|"product"|"order"}
`;

app.post("/api/chat", async (req,res)=>{
  try{
    const {message, history=[]} = req.body || {};
    if(!message) return res.status(400).json({error:"message required"});
    if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY is not configured"});

    const input = [
      {role:"system", content:SYSTEM},
      ...history.slice(-10).map(x=>({role:x.role,content:String(x.content)})),
      {role:"user", content:String(message)}
    ];

    const response = await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:MODEL,
        input,
        max_output_tokens:350
      })
    });

    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data.error?.message || "OpenAI request failed"});

    const text=data.output_text || "";
    let parsed;
    try { parsed=JSON.parse(text); }
    catch { parsed={reply:text,intent:"chat"}; }

    res.json({
      reply:parsed.reply || "How can I help with your Lele's Cosmetics order?",
      intent:parsed.intent || "chat"
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server error"});
  }
});

app.get("*",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT,()=>console.log(`Lele AI bot running on port ${PORT}`));
