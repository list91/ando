import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

serve(async (req) => {
  try {
    const client = new SmtpClient()
    
    // Test connection
    await client.connectTLS({
      hostname: "sm31.hosting.reg.ru",
      port: 587,
      username: "noreply@andojv.com",
      password: "LAusnxWJd!8!Spm",
    })
    
    await client.send({
      from: "noreply@andojv.com",
      to: "test@test.local",
      subject: "Test from Edge Function",
      content: "This is a test email",
    })
    
    await client.close()
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
