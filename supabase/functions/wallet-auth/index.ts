import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.16.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, signature, message } = await req.json();

    if (!walletAddress || !signature || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const email = `${walletAddress.toLowerCase()}@wallet.pharmashield.app`;
    const password = `wallet_${walletAddress.toLowerCase()}_${serviceRoleKey.slice(0, 8)}`;

    // Try to sign in first
    const { data: signInData, error: _signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      // Update wallet_address on profile
      await supabase
        .from("profiles")
        .update({ wallet_address: walletAddress.toLowerCase() })
        .eq("user_id", signInData.user.id);

      return new Response(JSON.stringify({
        session: signInData.session,
        user: signInData.user,
        isNewUser: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { wallet_address: walletAddress.toLowerCase() },
    });

    if (signUpError) {
      return new Response(JSON.stringify({ error: signUpError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with wallet address
    if (signUpData.user) {
      await supabase
        .from("profiles")
        .update({
          wallet_address: walletAddress.toLowerCase(),
          display_name: walletAddress.toLowerCase(),
        })
        .eq("user_id", signUpData.user.id);
    }

    // Sign in the new user
    const { data: newSession } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return new Response(JSON.stringify({
      session: newSession?.session,
      user: newSession?.user ?? signUpData.user,
      isNewUser: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
