
(function () {
  const CONFIG = window.LELES_AGENT_CONFIG || {
    supabaseUrl: "https://cpfentirkmxzirnhjhgr.supabase.co",
    supabaseKey: "sb_publishable_MOt9jcP9HonkGbxQzSZCAA_Z4KpH28U",
    functionUrl: "https://cpfentirkmxzirnhjhgr.supabase.co/functions/v1/leles-beauty-expert",
    whatsapp: "260978955714"
  };

  const style = document.createElement("style");
  style.textContent = `
    #lele-expert-button{position:fixed;right:20px;bottom:20px;width:58px;height:58px;border:0;border-radius:50%;background:linear-gradient(135deg,#7b1738,#c89b3c);color:#fff;font-size:25px;cursor:pointer;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,.25)}
    #lele-expert-panel{display:none;position:fixed;right:20px;bottom:88px;width:min(380px,calc(100vw - 30px));height:540px;background:#fff;border-radius:22px;z-index:99998;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;font-family:Arial,sans-serif}
    #lele-expert-head{padding:17px 18px;background:linear-gradient(135deg,#5e102c,#8d2347);color:#fff}
    #lele-expert-head strong{display:block;font-size:16px}.lele-sub{font-size:12px;opacity:.85;margin-top:4px}
    #lele-expert-messages{height:390px;overflow:auto;padding:14px;background:#faf7f5}
    .lele-msg{max-width:84%;padding:10px 12px;margin:8px 0;border-radius:15px;font-size:14px;line-height:1.45;white-space:pre-wrap}
    .lele-bot{background:#fff;border:1px solid #eee0e4}.lele-user{background:#7b1738;color:#fff;margin-left:auto}
    #lele-expert-form{display:flex;gap:7px;padding:10px;border-top:1px solid #eee;background:#fff}
    #lele-expert-input{flex:1;border:1px solid #ddd;border-radius:14px;padding:11px;font-size:14px;outline:none}
    #lele-expert-send{border:0;border-radius:14px;padding:0 15px;background:#7b1738;color:#fff;font-weight:bold;cursor:pointer}
    .lele-quick{display:flex;gap:6px;overflow:auto;padding:8px 10px;background:#fff;border-top:1px solid #eee}
    .lele-quick button{white-space:nowrap;border:1px solid #decbd1;background:#fff;border-radius:999px;padding:6px 9px;font-size:11px;cursor:pointer}
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "lele-expert-button";
  button.setAttribute("aria-label", "Open Lele's Beauty Expert");
  button.textContent = "💬";

  const panel = document.createElement("section");
  panel.id = "lele-expert-panel";
  panel.innerHTML = `
    <div id="lele-expert-head">
      <strong>✨ Lele's Beauty Expert</strong>
      <div class="lele-sub">Perfumes • Body Oils • Fragrance Advice</div>
    </div>
    <div id="lele-expert-messages"></div>
    <div class="lele-quick">
      <button data-q="What's the difference between EDP and EDT?">EDP vs EDT</button>
      <button data-q="How can I make perfume last longer?">Make it last</button>
      <button data-q="How do I choose a perfume for a date?">Date scent</button>
      <button data-q="Can I layer body oil with perfume?">Layering</button>
    </div>
    <form id="lele-expert-form">
      <input id="lele-expert-input" autocomplete="off" placeholder="Ask about perfumes or body oils..." />
      <button id="lele-expert-send" type="submit">Send</button>
    </form>
  `;

  document.body.appendChild(button);
  document.body.appendChild(panel);

  const messages = panel.querySelector("#lele-expert-messages");
  const input = panel.querySelector("#lele-expert-input");
  const form = panel.querySelector("#lele-expert-form");

  const history = [];
  let products = [];

  function addMessage(text, who) {
    const div = document.createElement("div");
    div.className = "lele-msg " + (who === "user" ? "lele-user" : "lele-bot");
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function loadProducts() {
    try {
      const res = await fetch(
        CONFIG.supabaseUrl + "/rest/v1/products?select=name,category,price,description,stock,active&active=eq.true",
        { headers: { apikey: CONFIG.supabaseKey, Authorization: "Bearer " + CONFIG.supabaseKey } }
      );
      if (res.ok) products = await res.json();
    } catch (_) {}
  }

  async function ask(question) {
    addMessage(question, "user");
    history.push({ role: "user", content: question });
    addMessage("Thinking…", "bot");
    const thinking = messages.lastElementChild;

    try {
      const res = await fetch(CONFIG.functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": CONFIG.supabaseKey
        },
        body: JSON.stringify({ message: question, history: history.slice(-10, -1), products })
      });
      const data = await res.json();
      thinking.remove();

      if (!res.ok) throw new Error(data.error || "AI service unavailable");
      const reply = data.reply || "I’m ready to help with perfumes and body oils.";
      addMessage(reply, "bot");
      history.push({ role: "assistant", content: reply });
    } catch (err) {
      thinking.textContent = "I’m having trouble connecting right now. You can order or ask us directly on WhatsApp: +260 978 955 714.";
      thinking.onclick = () => window.open("https://wa.me/" + CONFIG.whatsapp, "_blank");
    }
  }

  button.addEventListener("click", () => {
    const open = panel.style.display === "block";
    panel.style.display = open ? "none" : "block";
    if (!open && messages.children.length === 0) {
      addMessage("Hi! I’m Lele’s Beauty Expert. Ask me anything about perfumes, fragrance notes, body oils, layering, longevity, or choosing a scent. I can also help you find a Lele’s product.", "bot");
      loadProducts();
      input.focus();
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    ask(q);
  });

  panel.querySelectorAll(".lele-quick button").forEach(b => {
    b.addEventListener("click", () => ask(b.dataset.q));
  });
})();
