const ORDERS_API="/api/orders", PRODUCTS_API="/api/products";
let adminKey=sessionStorage.getItem("leles_admin_key")||"", orders=[], products=[];
const $=id=>document.getElementById(id);
const money=n=>"K"+Number(n||0).toFixed(2);

function showDashboard(){ $("loginPanel").classList.add("hidden");$("dashboard").classList.remove("hidden");loadOrders();loadProducts(); }
async function api(url,opts={}){opts.headers={...(opts.headers||{}),"X-Admin-Key":adminKey};const r=await fetch(url,opts);const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||"Request failed");return d;}

async function loadOrders(){
 try{const d=await api(ORDERS_API);orders=d.orders||[];renderOrders();$("orderMsg").textContent="Orders updated.";$("orderMsg").className="msg small success";}
 catch(e){$("orderMsg").textContent=e.message;$("orderMsg").className="msg small error";}
}
function renderOrders(){
 const q=$("search").value.trim().toLowerCase();
 const list=orders.filter(o=>[o.order_number,o.name,o.phone,o.delivery_location,o.payment_method,o.status].some(v=>String(v??"").toLowerCase().includes(q)));
 $("totalOrders").textContent=orders.length;$("pendingOrders").textContent=orders.filter(o=>o.status==="Pending").length;$("completedOrders").textContent=orders.filter(o=>o.status==="Completed").length;
 $("salesTotal").textContent=money(orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+Number(o.total||0),0));
 $("ordersBody").innerHTML=list.length?list.map(o=>`<tr><td><b>${esc(o.order_number)}</b><div class="small muted">#${o.id}</div></td><td><b>${esc(o.name)}</b><div class="small">${esc(o.phone)}</div></td><td>${esc(o.delivery_location)}</td><td>${esc(o.payment_method)}</td><td><b>${money(o.total)}</b></td><td>${date(o.created_at)}</td><td><select class="orderStatus" data-id="${o.id}">${["Pending","Confirmed","Completed","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join(""):`<tr><td colspan="7" class="muted">No orders found.</td></tr>`;
 document.querySelectorAll(".orderStatus").forEach(x=>x.addEventListener("change",()=>updateOrderStatus(Number(x.dataset.id),x.value)));
}
async function updateOrderStatus(id,status){try{await api(ORDERS_API,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({order_id:id,status})});const o=orders.find(x=>Number(x.id)===id);if(o)o.status=status;renderOrders();}catch(e){alert(e.message);}}

async function loadProducts(){
 try{
  const r=await fetch(PRODUCTS_API);const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||"Could not load products");
  products=d.products||[];renderProducts();
 }catch(e){$("productMsg").textContent=e.message;$("productMsg").className="msg small error";}
}
function renderProducts(){
 const q=$("productSearch").value.trim().toLowerCase();
 const list=products.filter(p=>[p.name,p.category,p.description].some(v=>String(v??"").toLowerCase().includes(q)));
 $("productGrid").innerHTML=list.map(p=>`<div class="product-card">
 <h3>${esc(p.name)}</h3><div class="small muted">${esc(p.category)}</div>
 <p><b>${money(p.price)}</b></p>
 <p class="stock ${Number(p.stock)<=2?"low":"ok"}">Stock: ${Number(p.stock)}</p>
 <p class="small">${esc(p.description||"No description")}</p>
 <p class="small">${p.active?"Active":"Inactive"}</p>
 <div class="actions"><button class="primary editProduct" data-id="${p.id}">Edit</button><button class="tab toggleProduct" data-id="${p.id}" data-active="${p.active}">${p.active?"Deactivate":"Activate"}</button></div>
 </div>`).join("")||"<p class='muted'>No products found.</p>";
 document.querySelectorAll(".editProduct").forEach(b=>b.addEventListener("click",()=>editProduct(Number(b.dataset.id))));
 document.querySelectorAll(".toggleProduct").forEach(b=>b.addEventListener("click",()=>toggleProduct(Number(b.dataset.id),Number(b.dataset.active))));
}
function clearProductForm(){["productId","pName","pPrice","pStock","pDescription","pImage"].forEach(id=>$(id).value="");$("pCategory").value="Perfume";$("formTitle").textContent="Add Product";}
function editProduct(id){const p=products.find(x=>Number(x.id)===id);if(!p)return;$("productId").value=p.id;$("pName").value=p.name;$("pCategory").value=p.category;$("pPrice").value=p.price;$("pStock").value=p.stock;$("pDescription").value=p.description||"";$("pImage").value=p.image_url||"";$("formTitle").textContent="Edit Product";window.scrollTo({top:0,behavior:"smooth"});}
async function saveProduct(){
 const id=$("productId").value, payload={name:$("pName").value.trim(),category:$("pCategory").value,price:Number($("pPrice").value),stock:Number($("pStock").value),description:$("pDescription").value.trim(),image_url:$("pImage").value.trim()};
 if(!payload.name||!Number.isFinite(payload.price)||!Number.isInteger(payload.stock)||payload.stock<0){$("productMsg").textContent="Enter a name, valid price and whole-number stock.";return;}
 try{await api(PRODUCTS_API,{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(id?{...payload,id:Number(id)}:payload)});$("productMsg").textContent=id?"Product updated.":"Product added.";$("productMsg").className="msg small success";clearProductForm();await loadProducts();}
 catch(e){$("productMsg").textContent=e.message;$("productMsg").className="msg small error";}
}
async function toggleProduct(id,active){try{await api(PRODUCTS_API,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,active:!active})});await loadProducts();}catch(e){alert(e.message);}}

function date(v){if(!v)return"-";const d=new Date(String(v).replace(" ","T")+"Z");return isNaN(d)?String(v):d.toLocaleString();}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

$("loginBtn").addEventListener("click",async()=>{const key=$("adminKey").value.trim();if(!key){$("loginMsg").textContent="Enter the admin key.";return;}adminKey=key;try{await api(ORDERS_API);sessionStorage.setItem("leles_admin_key",key);$("loginMsg").textContent="";showDashboard();}catch(e){adminKey="";sessionStorage.removeItem("leles_admin_key");$("loginMsg").textContent=e.message;}});
$("adminKey").addEventListener("keydown",e=>{if(e.key==="Enter")$("loginBtn").click();});
$("logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem("leles_admin_key");location.reload();});
$("refreshBtn").addEventListener("click",loadOrders);$("search").addEventListener("input",renderOrders);
$("refreshProductsBtn").addEventListener("click",loadProducts);$("productSearch").addEventListener("input",renderProducts);
$("saveProductBtn").addEventListener("click",saveProduct);$("cancelEditBtn").addEventListener("click",clearProductForm);
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll("#ordersTab,#productsTab").forEach(x=>x.classList.add("hidden"));$(b.dataset.tab).classList.remove("hidden");}));

if(adminKey)showDashboard();
else $("logoutBtn").classList.add("hidden");
