import fs from "node:fs";
import path from "node:path";

// Usage: node scripts/generate-csv.js [sizeInMb] [outputPath]
// Example: node scripts/generate-csv.js 25 data/sample-25mb.csv

const sizeArg = process.argv[2] || "25";
const targetMb = parseFloat(sizeArg.replace(/mb$/i, "")) || 25;
const targetBytes = targetMb * 1024 * 1024;

const defaultOutputDir = path.join(process.cwd(), "data");
if (!fs.existsSync(defaultOutputDir)) {
  fs.mkdirSync(defaultOutputDir, { recursive: true });
}

const outputPath =
  process.argv[3] ||
  path.join(defaultOutputDir, `sample-${Math.round(targetMb)}mb.csv`);

console.log(`\n Generating synthetic CSV of approximately ${targetMb} MB...`);
console.log(` Output destination: ${outputPath}`);

const writeStream = fs.createWriteStream(outputPath, { encoding: "utf8" });

const headers = "id,timestamp,customer,category,amount,status,rating,notes\n";
writeStream.write(headers);

let writtenBytes = Buffer.byteLength(headers, "utf8");
let rowId = 1;

const categories = [
  "Electronics",
  "Clothing",
  "HomeGoods",
  "Automotive",
  "Books",
  "Sports",
  "Health",
  "Garden",
];
const statuses = [
  "Completed",
  "Pending",
  "Cancelled",
  "Refunded",
  "Shipped",
  "Processing",
];
const customers = [
  "Acme Corporation",
  "Globex Industries",
  "Soylent Corp",
  "Initech Systems",
  "Umbrella Corp",
  "Hooli Technologies",
  "Stark Enterprises",
  "Wayne Enterprises",
  "Cyberdyne Systems",
  "Massive Dynamic",
];

const sampleNotes = [
  "Standard delivery option selected",
  "Priority express shipping requested",
  "Gift wrap included with custom message",
  '"Handle with care", requested by customer',
  "Recurring monthly subscription order",
  "Discount coupon SAVE20 applied successfully",
  "Address verified, gate code provided",
  "Order modified after initial checkout",
];

const startTime = Date.now();

function write() {
  let ok = true;
  while (writtenBytes < targetBytes && ok) {
    const timestamp = new Date(1700000000000 + rowId * 36000).toISOString();
    const customer = customers[rowId % customers.length];
    const category = categories[rowId % categories.length];
    const amount = (((rowId * 37) % 50000) + 49) / 100;
    const status = statuses[rowId % statuses.length];
    const rating = (rowId % 5) + 1;
    const rawNote = sampleNotes[rowId % sampleNotes.length];

    // Escape quotes if needed for RFC 4180 compliance
    const note =
      rawNote.includes(",") || rawNote.includes('"')
        ? `"${rawNote.replace(/"/g, '""')}"`
        : rawNote;

    const row = `${rowId},${timestamp},${customer},${category},${amount.toFixed(2)},${status},${rating},${note}\n`;
    const rowBytes = Buffer.byteLength(row, "utf8");

    writtenBytes += rowBytes;
    rowId++;

    ok = writeStream.write(row);
  }

  if (writtenBytes < targetBytes) {
    writeStream.once("drain", write);
  } else {
    writeStream.end();
  }
}

writeStream.on("finish", () => {
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const actualMb = (writtenBytes / (1024 * 1024)).toFixed(2);
  console.log(
    ` Successfully generated ${actualMb} MB (${rowId - 1} rows) in ${durationSec}s!`,
  );
  console.log(` File ready at: ${outputPath}\n`);
});

write();
