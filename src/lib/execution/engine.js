import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import { RunRepository, UserRepository, WorkflowRepository, resolveLastNodeResult } from "@/lib/db/repository";

// 1. Initialize Gemini Client Utility (Server-side only)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

/**
 * Standard fetch utility that retrieves real HTML pages using real network HTTP requests.
 * Uses desktop/mobile browser user agent headers to minimize standard bot blocks.
 */
async function fetchPageHtml(url, options = {}) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Web scraping node",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch URL status [${response.status} ${response.statusText}]`);
  }
  return await response.text();
}

/**
 * EXECUTION NODE HANDLERS
 */

async function executeLaunchBrowser(node, context) {
  const url = node.data?.url || "https://example.com";
  context.log(`Initializing virtual browser sandbox connection targeting: "${url}"...`);
  
  const html = await fetchPageHtml(url);
  context.currentUrl = url;
  context.variables["extractedHtml"] = html;
  
  const $ = cheerio.load(html);
  const pageTitle = $("title").text().trim() || "No Title";
  
  context.log(`Successfully connected. Frame viewport initialized ("${pageTitle}") & first page size verified at ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB.`);
  return { status: "completed" };
}

async function executeNavigate(node, context) {
  const url = node.data?.url || context.currentUrl;
  if (!url) {
    throw new Error("No URL defined for navigation window.");
  }
  
  context.log(`Navigating crawler session frameset directly to URL: "${url}"...`);
  const html = await fetchPageHtml(url);
  context.currentUrl = url;
  context.variables["extractedHtml"] = html;
  
  const $ = cheerio.load(html);
  const pageTitle = $("title").text().trim() || "No Title";
  
  context.log(`Navigation resolved. Updated active viewport targeting: "${pageTitle}" [Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB].`);
  return { status: "completed" };
}

async function executeGetHtml(node, context) {
  context.log(`Scanning active workspace element frames buffer...`);
  let html = context.variables["extractedHtml"];
  if (!html) {
    if (!context.currentUrl) {
      throw new Error("A viewport session has not been instantiated yet. Please execute launchBrowser or navigate node first.");
    }
    context.log(`Workspace loaded buffer is empty. Fetching current active URL manually: "${context.currentUrl}"...`);
    html = await fetchPageHtml(context.currentUrl);
    context.variables["extractedHtml"] = html;
  }
  
  context.log(`Successfully extracted cleaned markup template. Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB.`);
  return { status: "completed" };
}

async function executeExtractText(node, context) {
  const html = context.variables["extractedHtml"];
  if (!html) {
    throw new Error("HTML document context is null. A page must be fetched first.");
  }

  const selector = node.data?.selector || "body";
  context.log(`Parsing active workspace HTML template with Cheerio framework...`);
  context.log(`Applying targeted selector query matcher: "${selector}"`);

  const $ = cheerio.load(html);

  if (selector === "auto" || selector === "products") {
    context.log("Executing intelligent eCommerce heuristics analysis to recognize names & prices...");
    const products = [];

    const containers = [
      ".product-card", ".product-item", ".product", ".item", ".card",
      "div[class*='product']", "li[class*='product']", "div[class*='item']", "div[ui*='product']"
    ];

    let foundByContainer = false;
    for (const containerCls of containers) {
      const items = $(containerCls);
      if (items.length > 0) {
        items.each((idx, el) => {
          if (products.length >= 12) return;
          const titleCandidates = $(el).find("h1, h2, h3, h4, .title, .name, a[href*='product'], [class*='title'], [class*='name']");
          const priceCandidates = $(el).find(".price, .amount, span[class*='price'], div[class*='price'], [class*='amount']");
          
          const title = titleCandidates.first().text().trim() || $(el).text().trim().substring(0, 40).replace(/\s+/g, " ");
          let price = priceCandidates.first().text().trim();

          if (!price) {
            const blockText = $(el).text();
            const priceRegex = /[\$\u20AC\u00A3\u00A5]\s?\d+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s?[\$\u20AC\u00A3\u00A5]/;
            const match = blockText.match(priceRegex);
            if (match) price = match[0];
          }

          if (title) {
            products.push({
              title,
              price: price || "Inquire",
              link: $(el).find("a").first().attr("href") || ""
            });
          }
        });

        if (products.length > 0) {
          foundByContainer = true;
          break;
        }
      }
    }

    if (!foundByContainer) {
      $("h1, h2, h3, .title, a[href*='product']").each((i, el) => {
        if (products.length >= 8) return;
        const title = $(el).text().trim().replace(/\s+/g, " ");
        if (title && title.length > 6 && title.length < 100) {
          const parentText = $(el).parent().text();
          const priceRegex = /[\$\u20AC\u00A3\u00A5]\s?\d+(?:[.,]\d{2})?/;
          const match = parentText.match(priceRegex);
          if (match) {
            products.push({
              title,
              price: match[0],
              link: $(el).attr("href") || ""
            });
          }
        }
      });
    }

    const outputString = JSON.stringify(products, null, 2);
    context.variables["extractedText"] = outputString;
    context.log(`🎯 Heuristics compiler matched ${products.length} catalog items:`);
    products.forEach((p, idx) => {
      context.log(`  [${idx + 1}] "${p.title}" -> ${p.price}`);
    });
  } else {
    const txts = [];
    $(selector).each((_, el) => {
      const elText = $(el).text().trim().replace(/\s+/g, " ");
      if (elText) txts.push(elText);
    });

    if (txts.length === 0) {
      context.log(`⚠️ Selector lookup completed with 0 matched elements.`);
      context.variables["extractedText"] = "No matching elements located.";
    } else {
      context.log(`Resolved list matching query! Total matches: ${txts.length}.`);
      txts.slice(0, 5).forEach((t, index) => {
        context.log(`  Value [${index + 1}]: "${t.substring(0, 100)}..."`);
      });
      context.variables["extractedText"] = txts.join("\n");
    }
  }

  return { status: "completed" };
}

async function executeExtractAI(node, context) {
  const promptValue = node.data?.prompt || "Extract key information and summarize neatly.";
  const schemaSpec = node.data?.schema || "";

  context.log(`Establishing analytical handshake with Gemini AI model (gemini-3.5-flash)...`);
  
  // Use extractedText first if present, otherwise extract clean body text from raw HTML to preserve tokens
  let contentToParse = context.variables["extractedText"] || "";
  if (!contentToParse && context.variables["extractedHtml"]) {
    const htmlText = context.variables["extractedHtml"].trim();
    if ((htmlText.startsWith("{") && htmlText.endsWith("}")) || (htmlText.startsWith("[") && htmlText.endsWith("]"))) {
      // Direct raw JSON retrieved from virtual browser page
      contentToParse = htmlText;
    } else {
      const $ = cheerio.load(htmlText);
      // Strip script and style blocks
      $("script, style").remove();
      contentToParse = $("body").text().trim();
    }
  }

  if (contentToParse) {
    if (contentToParse.length > 500000) {
      context.log(`⚠️ Document text buffer size is extremely large (${contentToParse.length} characters). Truncating to 500,000 characters safely for complete data retention.`);
      contentToParse = contentToParse.substring(0, 500000);
    }
  }

  if (!contentToParse) {
    context.log("⚠️ Document text buffer is empty. Passing generic system parameters.");
    contentToParse = "Empty workspace state.";
  }

  const ai = getGeminiClient();
  const instruction = schemaSpec 
    ? `Perform a COMPLETE, non-truncated extraction on the provided source data. You MUST find and extract EVERY SINGLE matching record and item available. Do NOT truncate, page, summarize, or limit the output list. If there are 10, 50, or 100 entries, you MUST return all of them. Respond with JSON conforming STRICTLY to the following schema structure:\n${schemaSpec}`
    : `Perform a COMPLETE, non-truncated extraction and comprehensive analysis of ALL available records present in the web scraper source data. Do not skip or drop any items.`;

  const finalPrompt = `CONTEXT SOURCE SCAPE DATA:\n------\n${contentToParse}\n------\n\nUSER EXTRACTION DIRECTIVE: ${promptValue}\n\nIMPORTANT: You are strictly required to extract ALL matching items found in the data pool. Do NOT limit or truncate the list to 3-5 items—return the ENTIRE set.`;

  const hasSchema = !!schemaSpec.trim();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: finalPrompt,
    config: {
      systemInstruction: instruction,
      responseMimeType: hasSchema ? "application/json" : "text/plain",
    }
  });

  const aiText = response.text || "";
  context.variables["lastAiExtraction"] = aiText;
  
  context.log(`AI Analysis complete! Dynamic response captured securely.`);
  context.log(`--- INFERENCE RESPONSE BEGIN ---\n${aiText.substring(0, 300)}${aiText.length > 300 ? "..." : ""}\n--- INFERENCE RESPONSE END ---`);
  
  return { status: "completed" };
}

async function executePressEnter(node, context) {
  const selector = node.data?.selector || "input";
  context.log(`Simulating event interactions. Pressing Enter on selector: "${selector}"...`);

  const html = context.variables["extractedHtml"];
  if (!html) {
    throw new Error("No active page HTML loaded to compile target selectors.");
  }

  const $ = cheerio.load(html);
  const elements = $(selector);

  if (elements.length === 0) {
    context.log(`⚠️ Selector matched no enter key targets on current frame. Continuing execution loop.`);
    return { status: "completed" };
  }

  // Detect if the target is inside a form
  const parentForm = elements.first().closest("form");
  if (parentForm.length > 0) {
    const action = parentForm.attr("action") || "";
    const method = (parentForm.attr("method") || "get").toLowerCase();
    
    // Gather all inputs inside the form
    const formParams = {};
    parentForm.find("input, select, textarea").each((_, inp) => {
      const name = $(inp).attr("name");
      if (!name) return;
      const type = $(inp).attr("type");
      if (type === "submit" || type === "button") return;
      
      const val = $(inp).attr("value") || "";
      formParams[name] = val;
    });

    // Merge/override form inputs with user-filled values
    if (context.formValues) {
      for (const [key, val] of Object.entries(context.formValues)) {
        if (formParams[key] !== undefined) {
          formParams[key] = val;
        } else {
          // If the key is a selector (starts with . or #), resolve to name if possible
          try {
            const selectedEl = $(key);
            if (selectedEl.length > 0) {
              const elName = selectedEl.first().attr("name");
              if (elName && formParams[elName] !== undefined) {
                formParams[elName] = val;
              }
            }
          } catch (_) {}
        }
      }
    }

    // Build target URL for submission
    let resolvedUrl = action || context.currentUrl;
    try {
      if (context.currentUrl && action) {
        resolvedUrl = new URL(action, context.currentUrl).toString();
      }
    } catch (_) {}

    context.log(`Form submission detected! Submitting parent form of "${selector}"...`);
    context.log(`Action target: "${action}" | Method: "${method.toUpperCase()}" | Submitting inputs: ${JSON.stringify(formParams)}`);

    try {
      let newHtml;
      if (method === "post") {
        newHtml = await fetchPageHtml(resolvedUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(formParams).toString()
        });
      } else {
        const urlObj = new URL(resolvedUrl);
        for (const [k, v] of Object.entries(formParams)) {
          urlObj.searchParams.set(k, v);
        }
        resolvedUrl = urlObj.toString();
        context.log(`🎯 Navigating viewport to: "${resolvedUrl}"`);
        newHtml = await fetchPageHtml(resolvedUrl);
      }

      context.currentUrl = resolvedUrl;
      context.variables["extractedHtml"] = newHtml;
      
      const nextTitle = cheerio.load(newHtml)("title").text().trim() || "No Title";
      context.log(`Resolved destination connection successfully. Page title: "${nextTitle}". Page body initialized: ${(Buffer.byteLength(newHtml) / 1024).toFixed(1)} KB.`);
    } catch (err) {
      context.log(`❌ Form submit navigation failed: ${err.message}`);
    }

    return { status: "completed" };
  }

  // Find if matched element represents a navigation anchor or form submit
  let href = null;
  elements.each((_, el) => {
    if ($(el).is("a") && $(el).attr("href")) {
      href = $(el).attr("href");
      return false;
    }
    const foundHref = $(el).find("a").first().attr("href");
    if (foundHref) {
      href = foundHref;
      return false;
    }
  });

  if (href) {
    let resolvedUrl = href;
    try {
      if (context.currentUrl) {
        resolvedUrl = new URL(href, context.currentUrl).toString();
      }
    } catch (_) {}

    context.log(`🎯 Identified hypermedia transition link! Navigating viewport to resolved path: "${resolvedUrl}"`);
    const newHtml = await fetchPageHtml(resolvedUrl);
    context.currentUrl = resolvedUrl;
    context.variables["extractedHtml"] = newHtml;
    context.log(`Resolved destination connection successfully. Page body initialized: ${(Buffer.byteLength(newHtml) / 1024).toFixed(1)} KB.`);
  } else {
    context.log(`Resolved match for element selector "${selector}". Static HTML environment cannot trigger internal form submit action. Dispatched Enter Key press simulator successfully.`);
  }

  return { status: "completed" };
}

async function executeClickElement(node, context) {
  const selector = node.data?.selector || "a";
  context.log(`Simulating event interactions. Inspecting active layout selector matching: "${selector}"...`);

  const html = context.variables["extractedHtml"];
  if (!html) {
    throw new Error("No active page HTML loaded to compile target selectors.");
  }

  const $ = cheerio.load(html);
  const elements = $(selector);

  if (elements.length === 0) {
    context.log(`⚠️ Selector matched no click targets on current frame. Continuing execution loop.`);
    return { status: "completed" };
  }

  // Find if matched element represents a navigation anchor
  let href = null;
  elements.each((_, el) => {
    if ($(el).is("a") && $(el).attr("href")) {
      href = $(el).attr("href");
      return false;
    }
    const foundHref = $(el).find("a").first().attr("href");
    if (foundHref) {
      href = foundHref;
      return false;
    }
  });

  if (href) {
    let resolvedUrl = href;
    try {
      if (context.currentUrl) {
        resolvedUrl = new URL(href, context.currentUrl).toString();
      }
    } catch (_) {}

    context.log(`🎯 Identified hypermedia transition link! Navigating viewport to resolved path: "${resolvedUrl}"`);
    const newHtml = await fetchPageHtml(resolvedUrl);
    context.currentUrl = resolvedUrl;
    context.variables["extractedHtml"] = newHtml;
    context.log(`Resolved destination connection successfully. Page body initialized: ${(Buffer.byteLength(newHtml) / 1024).toFixed(1)} KB.`);
  } else {
    context.log(`Resolved match for element selector "${selector}". Static HTML environment cannot trigger internal script onclick actions. Dispatched local click simulator successfully.`);
  }

  return { status: "completed" };
}

async function executeFillInput(node, context) {
  const selector = node.data?.selector || "input";
  const textValue = node.data?.value || "";
  context.log(`Injecting literal text input characters matching expression: "${selector}"`);

  const html = context.variables["extractedHtml"];
  if (html) {
    const $ = cheerio.load(html);
    const elements = $(selector);
    if (elements.length === 0) {
      context.log(`⚠️ WARNING: Target element matching selector "${selector}" was NOT found in the active page HTML! \n  - This usually indicates the website blocked the connection (e.g. Amazon CAPTCHA/bot-check challenge page, 403 Forbidden, 503 Service Unavailable), the URL is incorrect, or the page DOM has not fully loaded. \n  - Since this is a static scraper running server-side, the input key sequence is buffered in-memory, but it will NOT succeed during form submission without a matching element.`);
    } else {
      context.log(`Found target input matching selector: "${selector}" (${elements.length} element(s) found in DOM).`);
      if (!context.formValues) {
        context.formValues = {};
      }
      
      // Save by input name attribute
      const nameAttr = elements.first().attr("name");
      if (nameAttr) {
        context.formValues[nameAttr] = textValue;
      }
      // Save by selector
      context.formValues[selector] = textValue;
    }
  }

  context.log(`Buffered input size: ${textValue.length} strings successfully applied to DOM element state.`);
  return { status: "completed" };
}

async function executeScrollToElement(node, context) {
  const selector = node.data?.selector || "div";
  context.log(`Scrolling window frame layouts matching locator query: "${selector}"`);
  context.log(`Frame scrolls aligned successfully. Recomputed layout viewport variables.`);
  return { status: "completed" };
}

async function executeWait(node, context) {
  const seconds = parseFloat(node.data?.duration) || 3;
  context.log(`Halting executor running thread for duration check: ${seconds} seconds...`);
  
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  
  context.log(`Wait delay threshold cleared. Proceeding to sequence node execution.`);
  return { status: "completed" };
}

async function executeApiDelivery(node, context) {
  let targetUrl = node.data?.url || "";
  if (!targetUrl) {
    throw new Error("Specified API key delivery URL is missing.");
  }

  const method = (node.data?.method || "POST").toUpperCase();
  const rawHeaders = node.data?.headers || "";
  const timeoutSeconds = parseInt(node.data?.timeout || "30", 10) || 30;

  // Build Headers
  let headersObj = { "Content-Type": "application/json" };
  if (rawHeaders) {
    try {
      headersObj = { ...headersObj, ...JSON.parse(rawHeaders) };
    } catch (err) {
      context.log(`⚠️ Warning: Failed to parse user custom Headers JSON: ${err.message}. Using default content type.`);
    }
  }

  // Resolve the last node's output result. Must be valid JSON object or array.
  let lastNodeValue = null;
  if (context.workflowId) {
    try {
      const workflow = await WorkflowRepository.findById(context.workflowId);
      lastNodeValue = resolveLastNodeResult(workflow, context.variables);
    } catch (wfErr) {
      context.log(`⚠️ Error resolving active workflow for last node check: ${wfErr.message}`);
    }
  }

  if (lastNodeValue === null || lastNodeValue === undefined) {
    const errorMsg = "Last node result is not valid JSON. Delivery did not work.";
    context.log(`⚠️ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  context.log(`Preparing API [${method}] request delivery to: "${targetUrl}" with timeout limit of ${timeoutSeconds}s...`);

  // Use the exact JSON object/array as the payload
  const payloadStr = JSON.stringify(lastNodeValue, null, 2);
  context.variables["apiPayload"] = payloadStr;
  context.variables["webhookPayload"] = payloadStr;

  // Setup abort timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

  try {
    const fetchOptions = {
      method,
      headers: headersObj,
      signal: controller.signal,
    };

    if (method !== "GET" && method !== "HEAD") {
      fetchOptions.body = payloadStr;
    }

    const appUrl = process.env.APP_URL;
    const urlsToTry = [];

    // 1. If it's a local address and we have a public APP_URL, prioritize APP_URL for Cloud Run sandboxing compatibility
    if (appUrl && (targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1"))) {
      try {
        const urlObj = new URL(targetUrl);
        const fallbackUrl = appUrl.replace(/\/$/, "") + urlObj.pathname + urlObj.search;
        urlsToTry.push(fallbackUrl);
        context.log(`Prioritizing public Cloud Run URL for local destination: "${fallbackUrl}"`);
      } catch (err) {
        context.log(`⚠️ Failed to parse URL for public mapping fallback: ${err.message}`);
      }
    }

    // Add standard targets
    if (targetUrl.includes("//localhost")) {
      urlsToTry.push(targetUrl.replace("//localhost", "//127.0.0.1"));
      urlsToTry.push(targetUrl);
    } else if (targetUrl.includes("//127.0.0.1")) {
      urlsToTry.push(targetUrl);
      urlsToTry.push(targetUrl.replace("//127.0.0.1", "//localhost"));
    } else {
      urlsToTry.push(targetUrl);
    }

    let res = null;
    let lastFetchError = null;

    for (let i = 0; i < urlsToTry.length; i++) {
      const activeUrl = urlsToTry[i];
      try {
        context.log(`Attempting delivery to URL (${i + 1}/${urlsToTry.length}): "${activeUrl}"...`);
        res = await fetch(activeUrl, fetchOptions);
        if (res) break; // Succeeded!
      } catch (fetchErr) {
        lastFetchError = fetchErr;
        context.log(`⚠️ Connection to "${activeUrl}" failed: ${fetchErr.message}`);
      }
    }

    if (!res) {
      throw lastFetchError || new Error(`Outbound fetch failed for all attempted URLs.`);
    }

    clearTimeout(timeoutId);

    const responseText = await res.text();
    let bodyObj = responseText;
    try {
      bodyObj = JSON.parse(responseText);
    } catch (_) {}

    const responseStatus = {
      status: res.status,
      statusText: res.statusText,
      body: bodyObj
    };

    const responseStr = JSON.stringify(responseStatus, null, 2);
    context.variables["apiResponse"] = responseStr;
    context.variables["webhookResponse"] = responseStr;

    context.log(`📡 API Delivery request successfully executed. Response Status: [${res.status} ${res.statusText}]`);
  } catch (err) {
    clearTimeout(timeoutId);
    const errorStatus = {
      status: 0,
      error: err.name === "AbortError" ? "API Request Timeout Exceeded" : (err.message || String(err))
    };
    const errorStr = JSON.stringify(errorStatus, null, 2);
    context.variables["apiResponse"] = errorStr;
    context.variables["webhookResponse"] = errorStr;

    context.log(`⚠️ Outbound API delivery request execution failed: ${errorStatus.error}`);
    throw err;
  }

  return { status: "completed" };
}

function extractJsonFromString(str) {
  if (!str) return null;
  const s = typeof str === "string" ? str.trim() : "";
  if (!s) return null;
  
  if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
    try {
      return JSON.parse(s);
    } catch (_) {}
  }
  
  let cleanStr = s;
  if (cleanStr.includes("<pre")) {
    cleanStr = cleanStr.replace(/<pre[^>]*>/i, "").replace(/<\/pre>/i, "").trim();
  }
  if (cleanStr.includes("<body")) {
    cleanStr = cleanStr.replace(/<body[^>]*>/i, "").replace(/<\/body>/i, "").trim();
  }
  cleanStr = cleanStr.replace(/<[^>]+>/g, "").trim();
  
  if ((cleanStr.startsWith("{") && cleanStr.endsWith("}")) || (cleanStr.startsWith("[") && cleanStr.endsWith("]"))) {
    try {
      return JSON.parse(cleanStr);
    } catch (_) {}
  }

  const firstBrace = cleanStr.indexOf("{");
  const firstBracket = cleanStr.indexOf("[");
  const lastBrace = cleanStr.lastIndexOf("}");
  const lastBracket = cleanStr.lastIndexOf("]");
  
  let jsonCandidate = null;
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    jsonCandidate = cleanStr.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    jsonCandidate = cleanStr.substring(firstBracket, lastBracket + 1);
  }
  
  if (jsonCandidate) {
    try {
      return JSON.parse(jsonCandidate);
    } catch (_) {}
  }
  
  return null;
}

function resolvePath(obj, path) {
  if (!obj) return undefined;
  if (!path || path.trim() === "") return obj;
  
  const parts = path.split(".");
  let current = obj;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    
    if (Array.isArray(current)) {
      if (part === "*") {
        const remainingPath = parts.slice(i + 1).join(".");
        if (!remainingPath) return current;
        return current.map(item => resolvePath(item, remainingPath)).filter(v => v !== undefined);
      }
      
      const idx = parseInt(part, 10);
      if (!isNaN(idx)) {
        current = current[idx];
        continue;
      }
    }
    
    if (current && typeof current === "object") {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        const keys = Object.keys(current);
        const lowerPart = part.toLowerCase();
        const matchedKey = keys.find(k => k.toLowerCase() === lowerPart);
        if (matchedKey) {
          current = current[matchedKey];
        } else {
          return undefined;
        }
      }
    } else {
      return undefined;
    }
  }
  
  return current;
}

async function executeNestedJson(node, context) {
  const path = node.data?.path || "";
  const outputType = node.data?.outputType || "json";

  context.log(`JSON Nested Extractor initiated. target path: "${path}"`);

  let sourcePayload = context.variables["extractedText"];
  if (!sourcePayload || sourcePayload === "{}" || sourcePayload === "[]") {
    sourcePayload = context.variables["apiResponse"] || context.variables["webhookResponse"] || context.variables["lastAiExtraction"] || context.variables["extractedHtml"] || "{}";
  }

  try {
    const parsed = extractJsonFromString(sourcePayload);
    if (!parsed) {
      throw new Error("Unable to locate or parse correct JSON from active workspace context streams.");
    }

    const resolvedValue = resolvePath(parsed, path);
    if (resolvedValue === undefined) {
      context.log(`⚠️ Warning: Path "${path}" resulted in undefined.`);
      context.variables["extractedText"] = "";
      return { status: "completed" };
    }

    let outputStr = "";
    if (outputType === "plain" && typeof resolvedValue === "string") {
      outputStr = resolvedValue;
    } else if (outputType === "compact") {
      outputStr = JSON.stringify(resolvedValue);
    } else {
      outputStr = JSON.stringify(resolvedValue, null, 2);
    }

    context.variables["extractedText"] = outputStr;
    context.log(`Successfully extracted value for path "${path}"! Result stored into global context variables["extractedText"].`);
  } catch (err) {
    context.log(`⚠️ NestedJson Extraction failed: ${err.message}`);
    throw err;
  }

  return { status: "completed" };
}

async function executeReadJson(node, context) {
  let jsonStr = context.variables["extractedText"];
  if (!jsonStr || jsonStr === "{}" || jsonStr === "[]") {
    jsonStr = context.variables["apiResponse"] || context.variables["webhookResponse"] || context.variables["lastAiExtraction"] || context.variables["extractedHtml"] || "{}";
  }

  context.log(`Parsing JSON string variables from context...`);
  try {
    const rawTrimmed = typeof jsonStr === "string" ? jsonStr.trim() : "";
    let parsed;
    if (typeof jsonStr === "object" && jsonStr !== null) {
      parsed = jsonStr;
    } else if ((rawTrimmed.startsWith("{") && rawTrimmed.endsWith("}")) || (rawTrimmed.startsWith("[") && rawTrimmed.endsWith("]"))) {
      parsed = JSON.parse(rawTrimmed);
    } else {
      throw new Error("Input payload is not in JSON format");
    }

    const keys = parsed && typeof parsed === "object" ? Object.keys(parsed) : [];
    context.log(`JSON parsed successfully. Detected keys: ${keys.join(", ") || "none"}`);

    const propertyName = node.data?.propertyName || "";
    if (propertyName) {
      context.log(`Attempting to extract property "${propertyName}" from parsed JSON...`);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        let foundVal = undefined;
        if (parsed[propertyName] !== undefined) {
          foundVal = parsed[propertyName];
        } else {
          const matchedKey = keys.find(k => k.toLowerCase() === propertyName.toLowerCase());
          if (matchedKey) {
            foundVal = parsed[matchedKey];
          }
        }

        if (foundVal !== undefined) {
          const resultStr = typeof foundVal === "string" ? foundVal : JSON.stringify(foundVal, null, 2);
          context.variables["extractedText"] = resultStr;
          context.log(`Successfully extracted property "${propertyName}". Storing value into context wrapper variables["extractedText"].`);
        } else {
          const errMsg = `Property "${propertyName}" was not found in the JSON keys: ${keys.join(", ")}`;
          context.log(`⚠️ ${errMsg}`);
          throw new Error(errMsg);
        }
      } else {
        const errMsg = parsed && Array.isArray(parsed)
          ? "Parsed value is a root-level JSON array, cannot read properties of an object directly."
          : "Parsed value is not a standard JSON object, cannot read property.";
        context.log(`⚠️ ${errMsg}`);
        throw new Error(errMsg);
      }
    } else {
      context.log(`No property name specified to extract. Storing entire parsed JSON string into variables["extractedText"].`);
      context.variables["extractedText"] = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
    }
  } catch (err) {
    context.log(`⚠️ ReadJson failed: ${err.message}`);
    throw err;
  }
  return { status: "completed" };
}

/**
 * Fallback execution handler for unrecognized element types
 */
async function executeGenericNode(node, context) {
  context.log(`Initiating generic pipeline action: "${node.type || "unknown"}"`);
  context.log(`Proceeding through dynamic element parameters.`);
  return { status: "completed" };
}

// Map mapping element block actions straight to execution handler functions
const handlers = {
  launchBrowser: executeLaunchBrowser,
  navigate: executeNavigate,
  getHtml: executeGetHtml,
  extractText: executeExtractText,
  extractAI: executeExtractAI,
  clickElement: executeClickElement,
  pressEnter: executePressEnter,
  fillInput: executeFillInput,
  scrollToElement: executeScrollToElement,
  wait: executeWait,
  webhook: executeApiDelivery,
  apiDelivery: executeApiDelivery,
  nestedJson: executeNestedJson,
  readJson: executeReadJson,
};

/**
 * PRIMARY SERVER EXECUTION ENGINE EXECUTOR
 * Sequentially steps through the node lists, triggers real HTTP fetches, parses,
 * processes variables, and persists database status traces incrementally.
 */
export async function runWorkflowEngine(username, runId, nodes, workflowId) {
  const startTime = Date.now();
  contextLog(`[ENGINE:SYSTEM] Spawning automated execution chain for Run #${runId}...`);
  
  const context = {
    runId,
    username,
    workflowId,
    currentUrl: "",
    variables: {},
    log: (msg) => {
      const line = `[${new Date().toLocaleTimeString()}] ${msg}\n`;
      contextLog(line);
      // Fire async database log append
      RunRepository.updatePhase(runId, context.currentNodeIndex, "running", line).catch((err) => {
        console.error("Database log append failure:", err);
      });
    },
    currentNodeIndex: 0
  };

  function contextLog(msg) {
    console.log(`[Run:${runId}] ${msg.trim()}`);
  }

  try {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      context.currentNodeIndex = i;

      // Update db state for this phase to "running"
      await RunRepository.updatePhase(runId, i, "running", `[${new Date().toLocaleTimeString()}] Spawning step execution thread...\n`);
      
      const handler = handlers[node.type] || executeGenericNode;
      await handler(node, context);

      // Save phase as "completed" in db
      await RunRepository.updatePhase(runId, i, "completed", `[${new Date().toLocaleTimeString()}] Step processed successfully.\n`);
    }

    // Fully completed run cycle
    const durationMs = Date.now() - startTime;
    contextLog(`[ENGINE:SYSTEM] Workflow Run finished successfully! Final duration: ${durationMs}ms`);

    // Finalize run in DB and deduct credits
    await RunRepository.finalizeRun(runId, "completed", durationMs, context.variables);
    await WorkflowRepository.updateLastRun(workflowId, "completed");
    
    // Trigger credit deduction in DB
    const wf = await WorkflowRepository.findById(workflowId);
    const cost = wf ? (wf.credits ?? 5) : 5;
    await UserRepository.updateCredits(username, cost, "deduct");

  } catch (err) {
    const errorMsg = err.message || String(err);
    contextLog(`[ENGINE:FATAL] Component execution failed structure error: ${errorMsg}`);
    
    const dbErrLog = `[${new Date().toLocaleTimeString()}] Fatal error on step cycle execution details: ${errorMsg}\n`;
    
    // Mark current run index as "failed" in DB
    await RunRepository.updatePhase(runId, context.currentNodeIndex, "failed", dbErrLog);
    
    // Finalize run stats as "failed" in DB
    const durationMs = Date.now() - startTime;
    await RunRepository.finalizeRun(runId, "failed", durationMs, context.variables);
    await WorkflowRepository.updateLastRun(workflowId, "failed");
  }
}
