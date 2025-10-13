import fs from "fs";

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

// تست خطای عمدی برای بررسی نوتیفیکیشن Failure — بعد از تست حذف می‌شود
throw new Error("Test failure");

async function main() {
  try {
    const { XAU, XAG } = await getPrices();
    const ratio = XAU / XAG;
    let signal = "هیچ‌کدام";
    if (ratio > 85) signal = "بخر نقره";
    else if (ratio < 75) signal = "بخر طلا";

    let last = null;
    if (fs.existsSync("state.json")) {
      last = JSON.parse(fs.readFileSync("state.json", "utf8")).signal;
    }

    if (signal !== last) {
      const msg = `🔁 سیگنال جدید: ${signal}

XAU/USD: ${XAU}
XAG/USD: ${XAG}
نسبت طلا/نقره: ${ratio.toFixed(2)}`;
      await notify(msg);
      fs.writeFileSync("state.json", JSON.stringify({ signal }));
    } else {
      console.log("No change, skipping notification.");
    }
  } catch (e) {
    await notify("⚠️ خطا: " + e.message);
    process.exitCode = 1;
  }
}

main();
