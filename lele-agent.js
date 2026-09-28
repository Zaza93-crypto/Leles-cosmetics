/* Lele's Cosmetics Website Agent
   No API key required. Designed for GitHub Pages/static hosting.
*/
(function () {
  const WHATSAPP = "260978955714";

  const css = `
  #lele-agent-button{position:fixed;right:20px;bottom:20px;width:62px;height:62px;border:0;border-radius:50%;
    background:linear-gradient(135deg,#8e2458,#d95b91);color:#fff;font-size:27px;cursor:pointer;
    box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:99999}
  #lele-agent{position:fixed;right:20px;bottom:92px;width:min(370px,calc(100vw - 30px));height:520px;
    background:#fff;border-radius:22px;box-shadow:0 18px 60px rgba(0,0,0,.28);overflow:hidden;
    font-family:Arial,Helvetica,sans-serif;z-index:99999;display:none;border:1px solid #ead2dd}
  #lele-agent.open{display:flex;flex-direction:column}
  .lele-head{background:linear-gradient(135deg,#8e2458,#d95b91);color:#fff;padding:17px 18px;display:flex;justify-content:space-between;align-items:center}
  .lele-head strong{font-size:16px}.lele-head small{display:block;opacity:.85;margin-top:3px}
  .lele-close{background:none;border:0;color:#fff;font-size:23px;cursor:pointer}
  .lele-messages{flex:1;padding:15px;overflow:auto;background:#fff8fb}
  .lele-msg{max-width:84%;padding:10px 12px;border-radius:15px;margin:8px 0;line-height:1.4;font-size:14px}
  .lele-bot{background:#fff;border:1px solid #f0d6e3;margin-right:auto}
  .lele-user{background:#8e2458;color:#fff;margin-left:auto}
  .lele-quick{display:flex;gap:7px;flex-wrap:wrap;padding:10px 12px;border-top:1px solid #f0d6e3}
  .lele-quick button{border:1px solid #d9a0b9;background:#fff;color:#8e2458;border-radius:18px;padding:7px 10px;cursor:pointer;font-size:12px}
  .lele-input{display:flex;padding:10px;border-top:1px solid #eee;gap:7px}
  .lele-input input{flex:1;border:1px solid #ddd;border-radius:20px;padding:10px 12px;outline:none}
  .lele-input button{border:0;border-radius:20px;background:#8e2458;color:#fff;padding:0 16px;cursor:pointer}
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "lele-agent-button";
  button.setAttribute("aria-label", "Open Lele's Cosmetics assistant");
  button.textContent = "💬";

  const box = document.createElement("div");
  box.id = "lele-agent";
  box.innerHTML = `
    <div class="lele-head">
      <div><strong>Lele's Assistant ✨</strong><small>Perfumes • Body Oils • Orders</small></div>
      <button class="lele-close" aria-label="Close">×</button>
    </div>
    <div class="lele-messages" id="lele-messages"></div>
    <div class="lele-quick">
      <button data-q="What products do you have?">Products</button>
      <button data-q="How much are the perfumes?">Prices</button>
      <button data-q="How much are the body oils?">Body oils</button>
      <button data-q="I want to order">Order</button>
    </div>
    <div class="lele-input">
      <input id="lele-input" placeholder="Ask about products or ordering..." />
      <button id="lele-send">Send</button>
    </div>`;
  document.body.appendChild(button);
  document.body.appendChild(box);

  const messages = document.getElementById("lele-messages");
  const input = document.getElementById("lele-input");

  function addMessage(text, who="bot") {
    const div = document.createElement("div");
    div.className = "lele-msg " + (who === "user" ? "lele-user" : "lele-bot");
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function orderLink(text="Hello Lele's Cosmetics, I'd like to place an order.") {
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  }

  function reply(q) {
    const s = q.toLowerCase().trim();

    if (/hello|hi|hey|good morning|good afternoon|good evening/.test(s))
      return "Hello! 👋 Welcome to Lele's Cosmetics. I can help you with perfumes, body oils, prices and ordering.";

    if (/price|cost|how much|perfume/.test(s) && !/oil/.test(s))
      return "Our perfumes are currently K100–K200. If you tell me what type of scent you want, I can help you choose and then you can order on WhatsApp.";

    if (/body oil|oil/.test(s))
      return "Our body oils are currently K75. You can order directly through WhatsApp.";

    if (/product|sell|available|have|stock/.test(s))
      return "We currently offer perfumes (K100–K200) and body oils (K75). Product-by-product names and availability can be confirmed on WhatsApp.";

    if (/delivery|deliver|where/.test(s))
      return "Lele's Cosmetics offers delivery. For the delivery fee and area availability, please confirm with us on WhatsApp.";

    if (/order|buy|purchase|whatsapp|contact|number/.test(s))
      return "Great! Tap the WhatsApp button below to place your order or ask for available products.";

    if (/for her|woman|women|ladies|female/.test(s))
      return "For Her ✨ — ask us on WhatsApp for the fragrances currently available for women.";

    if (/for him|man|men|male/.test(s))
      return "For Him 👑 — ask us on WhatsApp for the fragrances currently available for men.";

    return "I can help with perfumes, body oils, prices, delivery and ordering. Try asking “How much are the perfumes?” or “I want to order.”";
  }

  function send(q) {
    q = (q || input.value).trim();
    if (!q) return;
    addMessage(q, "user");
    input.value = "";
    const answer = reply(q);
    setTimeout(() => {
      addMessage(answer);
      if (/order|buy|purchase|whatsapp|contact|number/.test(q.toLowerCase())) {
        const a = document.createElement("a");
        a.href = orderLink("Hello Lele's Cosmetics, I'd like to place an order.");
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "📱 Order on WhatsApp";
        a.style.cssText = "display:inline-block;margin:5px 0 10px;padding:10px 14px;background:#25D366;color:white;border-radius:20px;text-decoration:none;font-weight:bold;font-size:13px";
        messages.appendChild(a);
        messages.scrollTop = messages.scrollHeight;
      }
    }, 250);
  }

  button.onclick = () => {
    box.classList.toggle("open");
    if (messages.children.length === 0) {
      addMessage("Welcome to Lele's Cosmetics! ✨ What can I help you with today?");
    }
  };
  box.querySelector(".lele-close").onclick = () => box.classList.remove("open");
  document.getElementById("lele-send").onclick = () => send();
  input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
  box.querySelectorAll(".lele-quick button").forEach(b => b.onclick = () => send(b.dataset.q));
})();
