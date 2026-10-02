export async function onRequestGet({request,env}){
  if(!env.LELES_IMAGES) return new Response("Image storage is not configured.",{status:500});
  const key=new URL(request.url).searchParams.get("key");
  if(!key || !key.startsWith("products/")) return new Response("Not found",{status:404});
  const object=await env.LELES_IMAGES.get(key);
  if(!object) return new Response("Not found",{status:404});
  const headers=new Headers(); object.writeHttpMetadata(headers); headers.set("etag",object.httpEtag); headers.set("cache-control","public, max-age=31536000, immutable");
  return new Response(object.body,{headers});
}
