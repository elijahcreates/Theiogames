// User-agent based detection of known bots plus coarse device / browser / traffic-source labels.
// Runs in both the edge function and the serverless functions.

// [pattern, display name, category] – first match wins, so specific names come before generic ones.
const RULES = [
  // search engines
  [/googlebot|google-inspectiontool|storebot-google|adsbot-google|mediapartners-google|googleother/i, 'Googlebot', 'Search engine'],
  [/bingbot|bingpreview|msnbot|adidxbot/i, 'Bingbot', 'Search engine'],
  [/yandex(bot|images|mobilebot)?/i, 'YandexBot', 'Search engine'],
  [/baiduspider/i, 'Baiduspider', 'Search engine'],
  [/duckduckbot|duckassistbot/i, 'DuckDuckBot', 'Search engine'],
  [/applebot/i, 'Applebot', 'Search engine'],
  [/slurp/i, 'Yahoo Slurp', 'Search engine'],
  [/petalbot|aspiegelbot/i, 'PetalBot', 'Search engine'],
  [/seznambot|sogou|exabot|qwantify|mojeekbot|coccocbot/i, 'Other search engine', 'Search engine'],
  // AI crawlers / assistants
  [/gptbot|chatgpt-user|oai-searchbot/i, 'OpenAI', 'AI crawler'],
  [/claudebot|claude-web|claude-user|claude-searchbot|anthropic-ai/i, 'Anthropic', 'AI crawler'],
  [/perplexitybot|perplexity-user/i, 'Perplexity', 'AI crawler'],
  [/ccbot/i, 'Common Crawl', 'AI crawler'],
  [/bytespider|tiktokspider/i, 'ByteDance', 'AI crawler'],
  [/amazonbot/i, 'Amazonbot', 'AI crawler'],
  [/meta-externalagent|meta-externalfetcher|facebookbot/i, 'Meta AI', 'AI crawler'],
  [/google-extended|gemini|cohere-ai|diffbot|youbot|timpibot|ai2bot|imagesiftbot/i, 'Other AI crawler', 'AI crawler'],
  // link previews (someone shared your link)
  [/whatsapp/i, 'WhatsApp preview', 'Link preview'],
  [/facebookexternalhit|facebot/i, 'Facebook preview', 'Link preview'],
  [/twitterbot/i, 'X / Twitter preview', 'Link preview'],
  [/linkedinbot/i, 'LinkedIn preview', 'Link preview'],
  [/discordbot/i, 'Discord preview', 'Link preview'],
  [/telegrambot/i, 'Telegram preview', 'Link preview'],
  [/slackbot|slack-imgproxy/i, 'Slack preview', 'Link preview'],
  [/snapchat|pinterest|redditbot|skypeuripreview|iframely|embedly|vkshare|viber|line-poker|kakaotalk-scrap/i, 'Other link preview', 'Link preview'],
  // SEO & marketing tools
  [/ahrefsbot|ahrefssiteaudit/i, 'AhrefsBot', 'SEO tool'],
  [/semrushbot|siteauditbot/i, 'SemrushBot', 'SEO tool'],
  [/mj12bot|dotbot|rogerbot|blexbot|serpstatbot|dataforseobot|barkrowler|seokicks|screaming frog|sitebulb|megaindex/i, 'Other SEO crawler', 'SEO tool'],
  // monitoring / performance testing
  [/uptimerobot|pingdom|statuscake|site24x7|betteruptime|uptime-kuma|freshping|hetrixtools|newrelicpinger|datadog/i, 'Uptime monitor', 'Monitoring'],
  [/lighthouse|pagespeed|gtmetrix|chrome-lighthouse|webpagetest/i, 'Speed test', 'Monitoring'],
  [/netlify|vercel/i, 'Hosting check', 'Monitoring'],
  // automation & scripted clients
  [/headlesschrome|phantomjs|puppeteer|playwright|selenium|webdriver|electron\/.*headless/i, 'Headless browser', 'Automation'],
  [/python-requests|python-urllib|aiohttp|httpx|scrapy|mechanize/i, 'Python script', 'Scripted client'],
  [/\bcurl\/|\bwget\/|libwww-perl|lwp::|go-http-client|okhttp|java\/|apache-httpclient|axios\/|node-fetch|undici|got \(|postmanruntime|insomnia|httpie|powershell|ruby|php\//i, 'Scripted client', 'Scripted client'],
  // generic crawlers (last)
  [/bot\b|bot\/|crawler|spider|crawl|scraper|archiver|ia_archiver|fetcher|preview/i, 'Other crawler', 'Other bot'],
];

/** Returns { name, cat } for a recognised bot user agent, otherwise null. */
export function botFromUA(ua) {
  if (!ua || ua.length < 8) return { name: 'Missing user agent', cat: 'Scripted client' };
  for (const [re, name, cat] of RULES) if (re.test(ua)) return { name, cat };
  // real browsers all say "Mozilla/5.0"; anything else is a script or tool
  if (!/mozilla\/5\.0/i.test(ua)) return { name: 'Non-browser client', cat: 'Scripted client' };
  return null;
}

export function deviceOf(ua = '') {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
  if (/cros/i.test(ua)) return 'Chromebook';
  return 'Desktop';
}

export function browserOf(ua = '') {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/samsungbrowser/i.test(ua)) return 'Samsung';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|brave|startpage|qwant|naver|aol)\./i;
const SOCIAL = [[/whatsapp|wa\.me/i, 'WhatsApp'], [/facebook|fb\.|fbcdn/i, 'Facebook'], [/instagram/i, 'Instagram'], [/t\.co$|twitter|x\.com/i, 'X / Twitter'],
  [/tiktok/i, 'TikTok'], [/youtube|youtu\.be/i, 'YouTube'], [/reddit/i, 'Reddit'], [/discord/i, 'Discord'], [/snapchat/i, 'Snapchat'], [/pinterest/i, 'Pinterest'], [/linkedin|lnkd/i, 'LinkedIn'], [/telegram|t\.me/i, 'Telegram']];

/**
 * Traffic source from the referrer (only the domain is kept) and an optional ?utm_source.
 * Returns { type: 'Direct' | 'Search' | 'Social' | 'Website' | 'Campaign', name }.
 */
export function sourceOf(referrer, siteHost, utm) {
  if (utm) return { type: 'Campaign', name: String(utm).slice(0, 40) };
  let host = '';
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch (e) { host = ''; }
  if (!host || (siteHost && host.endsWith(String(siteHost).replace(/^www\./, '')))) return { type: 'Direct', name: 'Direct / bookmark' };
  const m = host.match(SEARCH); if (m) return { type: 'Search', name: m[2][0].toUpperCase() + m[2].slice(1) };
  for (const [re, name] of SOCIAL) if (re.test(host)) return { type: 'Social', name };
  return { type: 'Website', name: host.slice(0, 60) };
}
