const getUsagePeriod = (date = new Date()) => ({
  month: date.getUTCMonth() + 1,
  year: date.getUTCFullYear(),
});

const samples = [
  { label: "start_of_jan", date: new Date(Date.UTC(2026, 0, 1, 0, 0, 0)), expected: { month: 1, year: 2026 } },
  { label: "end_of_jan", date: new Date(Date.UTC(2026, 0, 31, 23, 59, 59)), expected: { month: 1, year: 2026 } },
  { label: "start_of_feb", date: new Date(Date.UTC(2026, 1, 1, 0, 0, 0)), expected: { month: 2, year: 2026 } },
];

let allPass = true;
for (const sample of samples) {
  const actual = getUsagePeriod(sample.date);
  const pass = actual.month === sample.expected.month && actual.year === sample.expected.year;
  if (!pass) allPass = false;
  console.log(
    `[usage-period] ${sample.label} -> ${actual.month}/${actual.year} ${pass ? "OK" : "FAIL"}`
  );
}

if (!allPass) {
  process.exitCode = 1;
}
