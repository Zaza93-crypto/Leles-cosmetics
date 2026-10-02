const API_BASE="/api";
let PRODUCTS=[];

function getCart(){return JSON.parse(localStorage.getItem("leles_cart")||"[]")}
function saveCart(c){localStorage.setItem("leles_cart",JSON.stringify(c));updateCartCount()}
function money(n){return"K"+Number(n).toFixed(2)}
function updateCartCount(){const n=getCart().reduce((s,x)=>s+Number(x.qty||0),0);document.querySelectorAll("#cartCount").forEach(e=>e.textContent=n)}

async function loadProducts(){
  try{
    const r=await fetch(API_BASE+"/products");
    const d=await r.json();
    if(d.success){PRODUCTS=d.products||[];return true}
  }catch(e){console.error(e)}
  return false
}

function addToCart(id){
  const p=PRODUCTS.find(x=>Number(x.id)===Number(id)); if(!p)return;
  const c=getCart(), item=c.find(x=>Number(x.id)===Number(id));
  if(item)item.qty++;
  else c.push({id:p.id,name:p.name,category:p.category,price:Number(p.price),qty:1});
  saveCart(c);
  alert(p.name+" added to cart.");
}

function renderProducts(){
  const el=document.getElementById("products"); if(!el)return;
  const search=(document.getElementById("productSearch")?.value||"").toLowerCase().trim();
  const category=document.getElementById("categoryFilter")?.value||"all";
  const list=PRODUCTS.filter(p=>{
    const text=`${p.name} ${p.category} ${p.description||""}`.toLowerCase();
    return (!search||text.includes(search))&&(category==="all"||p.category===category);
  });
  document.getElementById("resultCount").textContent=`${list.length} product${list.length===1?"":"s"} available`;
  if(!list.length){el.innerHTML='<div class="empty">No products found. Try another search.</div>';return}
  el.innerHTML=list.map(p=>{
    const image=p.image_url?`<img src="${p.image_url}" alt="${p.name}" loading="lazy">`:`<span class="photo-label">${p.category==="Perfume"?"PERFUME":"BODY OIL"}</span>`;
    return `<article class="card">
      <div class="product-photo">${image}</div>
      <div class="card-body">
        <div class="category">${p.category}</div>
        <h3>${p.name}</h3>
        <p class="description">${p.description||"A beautiful addition to your everyday beauty routine."}</p>
        <div class="price-row"><span class="price">${money(p.price)}</span><button class="btn" onclick="addToCart(${p.id})">Add to cart</button></div>
      </div>
    </article>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded",async()=>{
  updateCartCount();
  const el=document.getElementById("products");
  if(el){
    const ok=await loadProducts();
    if(ok)renderProducts();else el.innerHTML='<div class="empty">Products could not be loaded. Please refresh.</div>';
    document.getElementById("productSearch")?.addEventListener("input",renderProducts);
    document.getElementById("categoryFilter")?.addEventListener("change",renderProducts);
  }
});
