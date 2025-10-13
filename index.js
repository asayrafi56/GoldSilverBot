// index.js
async function getPrices() {
  const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("goldprice.org failed");
  const data = await res.json();
  const item = Array.isArray(data?.items) ? data.items[0] : null;
  const XAU = item?.xauPrice;
  const XAG = item?.xagPrice;
  if (!XAU || !XAG) throw new Error("Missing XAU/XAG");
  return { XAU, XAG };
}

const BOT = process.env.BOT;
const CHAT = process.env.CHAT;

async function notify(text) {
  const url = `https://api.telegram.org/bot${BOT}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text }),
  });
}

async function main() {
  try {
    const { XAU, XAG } = await getPrices();
    const ratio = XAU / XAG;
    let signal = "هیچ‌کدام";
    if (ratio > 85) signal = "بخر نقره";
    else if (ratio < 75) signal = "بخر طلا";

    const msg = `✅ اجرای خودکار هر ساعت انجام شد.

XAU/USD: ${XAU}
XAG/USD: ${XAG}
نسبت طلا/نقره: ${ratio.toFixed(2)}
سیگنال: ${signal}`;
    await notify(msg);
  } catch (e) {
    await notify("⚠️ خطا در اجرای خودکار: " + e.message);
    process.exitCode = 1;
  }
}

main();
