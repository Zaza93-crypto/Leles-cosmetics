const PRODUCTS = [
 {id:"p1",name:"Signature Noir",category:"Perfume",price:200},
 {id:"p2",name:"Soft Bloom",category:"Perfume",price:150},
 {id:"p3",name:"Lele's Essence",category:"Perfume",price:100},
 {id:"o1",name:"Golden Glow",category:"Body Oil",price:100},
 {id:"o2",name:"Velvet Body Oil",category:"Body Oil",price:75}
];

function getCart(){ return JSON.parse(localStorage.getItem("leles_cart") || "[]"); }
function saveCart(c){ localStorage.setItem("leles_cart", JSON.stringify(c)); updateCartCount(); }
function money(n){ return "K" + Number(n).toFixed(2); }

function addToCart(id){
 const p=PRODUCTS.find(x=>x.id===id); if(!p)return;
 const c=getCart(); const item=c.find(x=>x.id===id);
 if(item)item.qty++; else c.push({...p,qty:1});
 saveCart(c); alert(p.name+" added to cart.");
}

function updateCartCount(){
 const n=getCart().reduce((s,x)=>s+x.qty,0);
 document.querySelectorAll("#cartCount").forEach(e=>e.textContent=n);
}
function renderProducts(){
 const el=document.getElementById("products"); if(!el)return;
 el.innerHTML=PRODUCTS.map(p=>`
 <article class="card">
   <div class="product-photo">${p.category==="Perfume"?"PERFUME":"BODY OIL"}</div>
   <h3>${p.name}</h3><p>${p.category}</p><strong>${money(p.price)}</strong>
   <button class="btn" onclick="addToCart('${p.id}')">Add to cart</button>
 </article>`).join("");
 updateCartCount();
}
function renderCart(){
 const el=document.getElementById("cart"); if(!el)return;
 const c=getCart();
 if(!c.length){el.innerHTML="<p>Your cart is empty. <a href='products.html'>Shop products</a>.</p>";updateCartCount();return;}
 let total=0;
 el.innerHTML=c.map(x=>{total+=x.price*x.qty;return `
 <div class="cart-row"><div><b>${x.name}</b><small>${x.category}</small></div>
 <div><button onclick="changeQty('${x.id}',-1)">−</button> ${x.qty} <button onclick="changeQty('${x.id}',1)">+</button></div>
 <strong>${money(x.price*x.qty)}</strong></div>`}).join("")+
 `<div class="total"><span>Total</span><strong>${money(total)}</strong></div>`;
 updateCartCount();
}
function changeQty(id,d){
 const c=getCart(); const x=c.find(i=>i.id===id); if(!x)return;
 x.qty+=d; const out=c.filter(i=>i.qty>0); saveCart(out); renderCart();
}
document.addEventListener("DOMContentLoaded",()=>{
 updateCartCount();
 const f=document.getElementById("checkoutForm");
 if(f)f.addEventListener("submit",e=>{
  e.preventDefault(); const c=getCart(); if(!c.length)return alert("Your cart is empty.");
  const name=document.getElementById("customerName").value, phone=document.getElementById("phone").value;
  const loc=document.getElementById("location").value, pay=document.getElementById("payment").value;
  const notes=document.getElementById("notes").value;
  const total=c.reduce((s,x)=>s+x.price*x.qty,0);
  const lines=c.map(x=>`${x.name} x${x.qty} = ${money(x.price*x.qty)}`).join("%0A");
  const msg=`Hello Lele's Cosmetics!%0A%0AI would like to place an order.%0A%0A${lines}%0A%0ATotal: ${money(total)}%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0ADelivery: ${encodeURIComponent(loc)}%0APayment: ${encodeURIComponent(pay)}%0ANotes: ${encodeURIComponent(notes)}`;
  window.open("https://wa.me/260978955714?text="+msg,"_blank");
 });
});