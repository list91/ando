import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const url = new URL(req.url)
  
  if (url.pathname === "/test-smtp" || url.pathname === "/functions/v1/test-smtp") {
    try {
      const client = new SMTPClient({
        connection: {
          hostname: "sm31.hosting.reg.ru",
          port: 465,
          tls: true,  // Port 465 = implicit SSL
          auth: {
            username: "noreply@andojv.com",
            password: "LAusnxWJd!8!Spm",
          },
        },
      })
      
      await client.send({
        from: "noreply@andojv.com",
        to: "test@example.com",
        subject: "Test",
        content: "Test",
      })
      
      await client.close()
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
})
