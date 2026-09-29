const initLeleAssistant = () => {
  const toggle = document.getElementById('leleChatToggle');
  const chat = document.getElementById('leleChat');
  const close = document.getElementById('leleChatClose');
  const form = document.getElementById('leleChatForm');
  const input = document.getElementById('leleChatInput');
  const messages = document.getElementById('leleChatMessages');

  if (!toggle || !chat || !form || !input || !messages) {
    console.error("Lele's Assistant: chatbot elements not found.");
    return;
  }

  const whatsapp = '260978955714';

  const addMessage = (text, type = 'bot') => {
    const div = document.createElement('div');
    div.className = `lele-message ${type}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };

  const botReply = (question) => {
    const q = question.toLowerCase().trim();

    if (/perfume|fragrance|scent/.test(q)) {
      return "We offer perfumes from K100–K200. Current examples include Signature Noir and Soft Bloom. Tell me whether you prefer a sweet, fresh, strong or elegant scent and I can guide you.";
    }

    if (/oil|body|glow|skin/.test(q)) {
      return "Our body oils are K75–K100. Golden Glow is one of the featured options. Body oils are suitable for a scented, soft-skin and glow routine.";
    }

    if (/price|cost|how much|money|kwacha/.test(q)) {
      return "Perfumes: K100–K200.\nBody oils: K75–K100.\nWe accept Mobile Money and Cash on Delivery.";
    }

    if (/order|buy|purchase|delivery|deliver|whatsapp/.test(q)) {
      return `You can order directly on WhatsApp. Send your preferred product, quantity and delivery details here: https://wa.me/${whatsapp}`;
    }

    if (/where|location|lundazi/.test(q)) {
      return "Lele's Cosmetics offers local delivery in Lundazi.";
    }

    if (/male|men|man|female|women|woman|lady|ladies/.test(q)) {
      return "Our collection is designed for both women and men. Tell me the kind of scent you like and I'll help you choose.";
    }

    if (/hello|hi|hey|good morning|good afternoon/.test(q)) {
      return "Hello 👋 Welcome to Lele's Cosmetics! Ask me about perfumes, body oils, prices or ordering.";
    }

    return "I can help with perfumes, body oils, prices, recommendations and orders. Try asking: “What perfumes do you have?” or “How do I order?”";
  };

  const openChat = () => {
    chat.classList.add('open');
    chat.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      input.focus();
    }, 100);
  };

  const closeChat = () => {
    chat.classList.remove('open');
    chat.setAttribute('aria-hidden', 'true');
  };

  toggle.addEventListener('click', openChat);

  close.addEventListener('click', closeChat);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const question = input.value.trim();

    if (!question) return;

    addMessage(question, 'user');

    input.value = '';

    setTimeout(() => {
      addMessage(botReply(question));
    }, 250);
  });

  document
    .querySelectorAll('.lele-quick-actions button')
    .forEach((button) => {

      button.addEventListener('click', () => {

        const question = button.dataset.question;

        addMessage(question, 'user');

        setTimeout(() => {
          addMessage(botReply(question));
        }, 250);

      });

    });

  console.log("Lele's Assistant loaded successfully.");
};


// Start chatbot after page is ready
if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    initLeleAssistant
  );

} else {

  initLeleAssistant();

}
