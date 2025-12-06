// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";

// Use SUPABASE_SERVICE_ROLE_KEY to match the rest of the project
// (SUPABASE_SERVICE_ROLE without _KEY was causing env mismatch)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY")!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
}
if (!GOOGLE_API_KEY) {
  console.error("Missing GOOGLE_API_KEY env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200, requestOrigin?: string | null) {
  const corsHeaders = getCorsHeaders(requestOrigin)
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

async function visionFromBytes(bytesB64: string): Promise<string> {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;
  const body = {
    requests: [
      {
        image: { content: bytesB64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`Vision ${r.status}: ${err}`);
  }
  const j = await r.json();
  return j?.responses?.[0]?.fullTextAnnotation?.text || "";
}

function extractExpirationISO(text: string): string | null {
  // Keywords that indicate expiration/end date
  const keywords = [
    "expir",
    "exp",
    "effective end",
    "end date",
    "valid until",
    "valid thru",
    "valid through",
    "expires",
    "expiration",
    "expiry"
  ];
  
  // Date patterns - more comprehensive
  const datePatterns = [
    // MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
    /\b(0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])[\/\-\.](\d{4})\b/g,
    // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    /\b(\d{4})[\/\-\.](0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])\b/g,
    // DD/MM/YYYY (European format)
    /\b(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])[\/\-\.](\d{4})\b/g,
    // Month DD, YYYY or DD Month YYYY
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s*\d{4}\b/gi,
    /\b\d{1,2}\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi,
    // MM/YY or MM/YYYY (common on cards)
    /\b(0?[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})\b/g,
  ];
  
  const toISO = (s: string) => {
    // Handle MM/YY format (default to last day of month)
    if (/^\d{1,2}[\/\-]\d{2,4}$/.test(s)) {
      const parts = s.split(/[\/\-]/);
      const month = parts[0];
      let year = parts[1];
      if (year.length === 2) {
        year = "20" + year;
      }
      // Last day of month
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      return `${year}-${month.padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`;
    }
    
    const t = s.replace(/[-\.]/g, "/");
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
    return null;
  };
  
  const lowerText = text.toLowerCase();
  const now = new Date();
  
  // First, look for dates near keywords
  for (const keyword of keywords) {
    const keywordIndex = lowerText.indexOf(keyword);
    if (keywordIndex !== -1) {
      // Search 100 characters after the keyword
      const searchText = text.substring(keywordIndex, keywordIndex + 100);
      
      for (const pattern of datePatterns) {
        const matches = searchText.matchAll(pattern);
        for (const match of matches) {
          const iso = toISO(match[0]);
          if (iso) {
            const dt = new Date(iso);
            // Accept dates in the future (up to 10 years)
            if (dt > now && dt.getFullYear() <= now.getFullYear() + 10) {
              return iso;
            }
          }
        }
      }
    }
  }
  
  // Fallback: find all dates and return the latest future date
  const allDates: string[] = [];
  for (const pattern of datePatterns) {
    let m: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);
    // deno-lint-ignore no-cond-assign
    while ((m = regex.exec(text))) {
      allDates.push(m[0]);
    }
  }
  
  // Sort and find the latest future date within reasonable range
  const futureDates = allDates
    .map(s => ({ str: s, iso: toISO(s) }))
    .filter(({ iso }) => {
      if (!iso) return false;
      const dt = new Date(iso);
      return dt > now && dt.getFullYear() <= now.getFullYear() + 10;
    })
    .sort((a, b) => new Date(b.iso!).getTime() - new Date(a.iso!).getTime());
  
  return futureDates.length > 0 ? futureDates[0].iso : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const user_id: string | undefined = payload.user_id;
    const storage_key: string | undefined =
      payload.storage_key || payload.file_path;
    const document_id: string | undefined = payload.document_id;

    if (!user_id || !storage_key) {
      return json({ error: "missing fields: user_id, storage_key" }, 400);
    }

    // Download from Storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("documents")
      .download(storage_key);
    if (dlErr) {
      throw dlErr;
    }
    const buf = await fileData.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

    // OCR
    const text = await visionFromBytes(b64);

    // Quick classify
    const low = text.toLowerCase();
    const document_type = low.includes("insurance") || low.includes("policy")
      ? "auto_insurance"
      : "unknown";
    const expiration_date = extractExpirationISO(text);

    // Update existing row if id provided, else best-effort by user + path
    let updateQuery = supabase.from("documents").update({
      ocr_text: text,
      ocr_processed: true,
      document_type,
      expiration_date,
    });

    if (document_id) {
      updateQuery = updateQuery.eq("id", document_id);
    } else {
      updateQuery = updateQuery
        .eq("user_id", user_id)
        .ilike("file_url", `%/${storage_key}`);
    }

    const { data: updated, error: upErr } = await updateQuery.select().limit(1);
    if (upErr) throw upErr;

    return json({ ok: true, document: updated?.[0] || null });
  } catch (e: any) {
    console.error("process-document error", e);
    return json({ error: e?.message || String(e) }, 500);
  }
});


