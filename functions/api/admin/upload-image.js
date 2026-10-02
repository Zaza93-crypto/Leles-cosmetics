function authorized(request, env){
  return Boolean(env.ADMIN_KEY && request.headers.get("X-Admin-Key") === env.ADMIN_KEY);
}
export async function onRequestPost({request,env}){
  if(!authorized(request,env)) return Response.json({success:false,error:"Unauthorized"},{status:401});
  if(!env.LELES_IMAGES) return Response.json({success:false,error:"Image storage is not configured yet. Create the LELES_IMAGES R2 binding."},{status:500});
  try{
    const form=await request.formData();
    const file=form.get("image");
    if(!file || typeof file.arrayBuffer !== "function") return Response.json({success:false,error:"Please attach an image."},{status:400});
    if(!String(file.type||"").startsWith("image/")) return Response.json({success:false,error:"Only image files are allowed."},{status:400});
    if(file.size > 5*1024*1024) return Response.json({success:false,error:"Image must be 5MB or smaller."},{status:400});
    const ext=(String(file.type).split("/")[1]||"jpg").replace("jpeg","jpg").replace(/[^a-z0-9]/gi,"").toLowerCase()||"jpg";
    const key=`products/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    await env.LELES_IMAGES.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
    return Response.json({success:true,key,url:`/api/images?key=${encodeURIComponent(key)}`});
  }catch(error){ return Response.json({success:false,error:error.message},{status:500}); }
}
