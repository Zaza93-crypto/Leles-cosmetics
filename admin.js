const API = "/api/orders";
let orders = [];
let adminKey = sessionStorage.getItem("leles_admin_key") || "";

const $ = id => document.getElementById(id);
const money = n => "K" + Number(n || 0).toFixed(2);

function showDashboard(){
  $("loginPanel").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
  loadOrders();
}

async function loadOrders(){
  $("msg").textContent = "Loading orders...";
  $("msg").className = "small muted";
  try{
    const r = await fetch(API, { headers: {"X-Admin-Key": adminKey} });
    const data = await r.json();
    if(!r.ok || !data.success) throw new Error(data.error || "Could not load orders");
    orders = data.orders || [];
    render();
    $("msg").textContent = "Orders updated.";
    $("msg").className = "small success";
  }catch(e){
    $("msg").textContent = e.message;
    $("msg").className = "small error";
  }
}

function render(){
  const q = $("search").value.trim().toLowerCase();
  const filtered = orders.filter(o =>
    [o.order_number,o.name,o.phone,o.delivery_location,o.payment_method,o.status]
      .some(v => String(v ?? "").toLowerCase().includes(q))
  );

  $("totalOrders").textContent = orders.length;
  $("pendingOrders").textContent = orders.filter(o=>o.status==="Pending").length;
  $("completedOrders").textContent = orders.filter(o=>o.status==="Completed").length;
  $("salesTotal").textContent = money(orders
    .filter(o=>o.status!=="Cancelled")
    .reduce((s,o)=>s+Number(o.total||0),0));

  $("ordersBody").innerHTML = filtered.length ? filtered.map(o => `
    <tr>
      <td><b>${escapeHtml(o.order_number)}</b><div class="small muted">#${o.id}</div></td>
      <td><b>${escapeHtml(o.name)}</b><div class="small">${escapeHtml(o.phone)}</div></td>
      <td>${escapeHtml(o.delivery_location)}</td>
      <td>${escapeHtml(o.payment_method)}</td>
      <td><b>${money(o.total)}</b></td>
      <td>${formatDate(o.created_at)}</td>
      <td>
        <select class="status" data-id="${o.id}">
          ${["Pending","Confirmed","Completed","Cancelled"].map(s =>
            `<option value="${s}" ${o.status===s?"selected":""}>${s}</option>`
          ).join("")}
        </select>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="7" class="muted">No orders found.</td></tr>`;

  document.querySelectorAll(".status").forEach(el=>{
    el.addEventListener("change",()=>updateStatus(Number(el.dataset.id),el.value));
  });
}

async function updateStatus(orderId,status){
  try{
    const r = await fetch(API,{
      method:"PATCH",
      headers:{"Content-Type":"application/json","X-Admin-Key":adminKey},
      body:JSON.stringify({order_id:orderId,status})
    });
    const data = await r.json();
    if(!r.ok || !data.success) throw new Error(data.error || "Update failed");
    const o = orders.find(x=>Number(x.id)===orderId);
    if(o) o.status=status;
    render();
    $("msg").textContent = `Order status changed to ${status}.`;
    $("msg").className = "small success";
  }catch(e){
    $("msg").textContent = e.message;
    $("msg").className = "small error";
  }
}

function formatDate(v){
  if(!v) return "-";
  const d = new Date(String(v).replace(" ","T")+"Z");
  return isNaN(d) ? String(v) : d.toLocaleString();
}

function escapeHtml(v){
  return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

$("loginBtn").addEventListener("click", async ()=>{
  const key = $("adminKey").value.trim();
  if(!key){ $("loginMsg").textContent="Enter the admin key."; return; }
  adminKey = key;
  sessionStorage.setItem("leles_admin_key", key);
  $("loginMsg").textContent="";
  try{
    const r = await fetch(API,{headers:{"X-Admin-Key":adminKey}});
    const data = await r.json();
    if(!r.ok || !data.success) throw new Error(data.error || "Login failed");
    showDashboard();
  }catch(e){
    sessionStorage.removeItem("leles_admin_key");
    adminKey="";
    $("loginMsg").textContent=e.message;
  }
});

$("adminKey").addEventListener("keydown",e=>{
  if(e.key==="Enter") $("loginBtn").click();
});
$("refreshBtn").addEventListener("click",loadOrders);
$("search").addEventListener("input",render);
$("logoutBtn").addEventListener("click",()=>{
  sessionStorage.removeItem("leles_admin_key");
  adminKey="";
  $("dashboard").classList.add("hidden");
  $("logoutBtn").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
  $("adminKey").value="";
});

if(adminKey) showDashboard();
