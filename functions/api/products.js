function adminAuthorized(request, env) {
  const expected = env.ADMIN_KEY;
  const supplied = request.headers.get("X-Admin-Key") || "";
  return Boolean(expected && supplied && supplied === expected);
}

function json(data, status=200){
  return Response.json(data,{status});
}

export async function onRequestGet({env}){
  try{
    const result = await env.LELES_DB.prepare(
      "SELECT id, name, category, description, price, stock, image_url, active, created_at FROM products ORDER BY id DESC"
    ).all();
    return json({success:true, products:result.results||[]});
  }catch(error){
    return json({success:false,error:error.message},500);
  }
}

export async function onRequestPost({request,env}){
  if(!adminAuthorized(request,env)) return json({success:false,error:"Unauthorized"},401);
  try{
    const data=await request.json();
    const {name,category,description="",price,stock=0,image_url="",active=1}=data;
    if(!String(name||"").trim() || !String(category||"").trim() || price===undefined || Number.isNaN(Number(price))){
      return json({success:false,error:"Name, category and a valid price are required"},400);
    }
    const result=await env.LELES_DB.prepare(
      `INSERT INTO products (name, category, description, price, stock, image_url, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(String(name).trim(),String(category).trim(),String(description||""),Number(price),Math.max(0,Number(stock)||0),String(image_url||""),active?1:0).run();
    return json({success:true,id:result.meta?.last_row_id});
  }catch(error){ return json({success:false,error:error.message},500); }
}

export async function onRequestPatch({request,env}){
  if(!adminAuthorized(request,env)) return json({success:false,error:"Unauthorized"},401);
  try{
    const data=await request.json();
    const {id,name,category,description="",price,stock=0,image_url="",active=1}=data;
    if(!Number.isInteger(Number(id))) return json({success:false,error:"Product ID is required"},400);
    if(!String(name||"").trim() || !String(category||"").trim() || price===undefined || Number.isNaN(Number(price))) return json({success:false,error:"Name, category and a valid price are required"},400);
    const result=await env.LELES_DB.prepare(
      `UPDATE products SET name=?, category=?, description=?, price=?, stock=?, image_url=?, active=? WHERE id=?`
    ).bind(String(name).trim(),String(category).trim(),String(description||""),Number(price),Math.max(0,Number(stock)||0),String(image_url||""),active?1:0,Number(id)).run();
    return json({success:true,changes:result.meta?.changes||0});
  }catch(error){ return json({success:false,error:error.message},500); }
}

export async function onRequestDelete({request,env}){
  if(!adminAuthorized(request,env)) return json({success:false,error:"Unauthorized"},401);
  try{
    const data=await request.json();
    const id=Number(data.id);
    if(!Number.isInteger(id)) return json({success:false,error:"Product ID is required"},400);
    const result=await env.LELES_DB.prepare("UPDATE products SET active=0 WHERE id=?").bind(id).run();
    return json({success:true,changes:result.meta?.changes||0});
  }catch(error){ return json({success:false,error:error.message},500); }
}
