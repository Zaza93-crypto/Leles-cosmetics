const API_BASE = "/api";
let PRODUCTS = [];

function getCart(){ return JSON.parse(localStorage.getItem("leles_cart") || "[]"); }
function saveCart(c){ localStorage.setItem("leles_cart", JSON.stringify(c)); updateCartCount(); }
function money(n){ return "K" + Number(n).toFixed(2); }

async function loadProducts(){
  try {
    const response = await fetch(API_BASE + "/products");
    const data = await response.json();
    if(data.success) {
      PRODUCTS = data.products || [];
      return true;
    }
  } catch(e) {
    console.error("Product API unavailable:", e);
  }
  return false;
}

function updateCartCount(){
  const n=getCart().reduce((s,x)=>s+x.qty,0);
  document.querySelectorAll("#cartCount").forEach(e=>e.textContent=n);
}

function addToCart(id){
  const p=PRODUCTS.find(x=>Number(x.id)===Number(id));
  if(!p)return;
  const c=getCart();
  const item=c.find(x=>Number(x.id)===Number(id));
  if(item)item.qty++;
  else c.push({id:p.id,name:p.name,category:p.category,price:Number(p.price),qty:1});
  saveCart(c);
  alert(p.name+" added to cart.");
}

async function renderProducts(){
  const el=document.getElementById("products"); if(!el)return;
  const ok=await loadProducts();
  if(!ok){
    el.innerHTML="<p>Products could not be loaded. Please refresh the page.</p>";
    return;
  }
  el.innerHTML=PRODUCTS.map(p=>`
    <article class="card">
      <div class="product-photo">${p.category==="Perfume"?"PERFUME":"BODY OIL"}</div>
      <h3>${p.name}</h3>
      <p>${p.category}</p>
      <strong>${money(p.price)}</strong>
      <button class="btn" onclick="addToCart(${p.id})">Add to cart</button>
    </article>`).join("");
  updateCartCount();
}

function changeQty(id,d){
  const c=getCart();
  const x=c.find(i=>Number(i.id)===Number(id));
  if(!x)return;
  x.qty+=d;
  saveCart(c.filter(i=>i.qty>0));
  renderCart();
}

function renderCart(){
  const el=document.getElementById("cart"); if(!el)return;
  const c=getCart();
  if(!c.length){
    el.innerHTML="<p>Your cart is empty. <a href='products.html'>Shop products</a>.</p>";
    updateCartCount(); return;
  }
  let total=0;
  el.innerHTML=c.map(x=>{
    total+=Number(x.price)*x.qty;
    return `<div class="cart-row">
      <div><b>${x.name}</b><small>${x.category}</small></div>
      <div><button onclick="changeQty(${x.id},-1)">−</button> ${x.qty} <button onclick="changeQty(${x.id},1)">+</button></div>
      <strong>${money(Number(x.price)*x.qty)}</strong>
    </div>`;
  }).join("")+`<div class="total"><span>Total</span><strong>${money(total)}</strong></div>`;
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", async ()=>{
  updateCartCount();
  if(document.getElementById("products")) await renderProducts();
  if(document.getElementById("cart")) renderCart();

  const f=document.getElementById("checkoutForm");
  if(f) f.addEventListener("submit", async e=>{
    e.preventDefault();
    const cart=getCart();
    if(!cart.length)return alert("Your cart is empty.");

    const payload={
      customer:{
        name:document.getElementById("customerName").value.trim(),
        phone:document.getElementById("phone").value.trim(),
        delivery_location:document.getElementById("location").value.trim()
      },
      payment_method:document.getElementById("payment").value,
      notes:document.getElementById("notes").value.trim(),
      items:cart.map(x=>({product_id:Number(x.id),quantity:Number(x.qty)}))
    };

    try{
      const response=await fetch(API_BASE+"/orders",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const result=await response.json();

      if(!result.success){
        alert(result.error || "Order could not be created.");
        return;
      }

      const lines=cart.map(x=>`${x.name} x${x.qty} = ${money(Number(x.price)*x.qty)}`).join("%0A");
      const msg=`Hello Lele's Cosmetics!%0A%0AI have placed order ${result.order_number}.%0A%0A${lines}%0A%0ATotal: ${money(result.total)}%0AName: ${encodeURIComponent(payload.customer.name)}%0APhone: ${encodeURIComponent(payload.customer.phone)}%0ADelivery: ${encodeURIComponent(payload.customer.delivery_location)}%0APayment: ${encodeURIComponent(payload.payment_method)}`;
      localStorage.removeItem("leles_cart");
      updateCartCount();
      window.open("https://wa.me/260978955714?text="+msg,"_blank");
      alert("Order "+result.order_number+" was created successfully.");
      renderCart();
    }catch(err){
      console.error(err);
      alert("Could not connect to the online order system. Please try again.");
    }
  });
});
