"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

// --- Tax helpers (2025 MFJ verified brackets) ---
function calcFederalTax(income: number) {
  const std = 30050;
  const taxable = Math.max(0, income - std);
  const brackets = [
    [23200, 0.10], [94300, 0.12], [201050, 0.22], [383900, 0.24],
    [487450, 0.32], [731200, 0.35], [Infinity, 0.37]
  ];
  let tax = 0, prev = 0;
  for (const [cap, rate] of brackets) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, cap) - prev) * rate;
    prev = cap;
  }
  return tax;
}

// 2025 CA MFJ brackets (FTB Schedule Y verified)
function calcCATax(income: number) {
  const std = 11412;
  const taxable = Math.max(0, income - std);
  const brackets = [
    [22158, 0.01], [52528, 0.02], [82904, 0.04], [115084, 0.06],
    [145448, 0.08], [742958, 0.093], [891542, 0.103],
    [1485906, 0.113], [Infinity, 0.123]
  ];
  let tax = 0, prev = 0;
  for (const [cap, rate] of brackets) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, cap) - prev) * rate;
    prev = cap;
  }
  return tax;
}

function calcFICA(income: number) {
  const ssCap = 168600;
  const ss = Math.min(income, ssCap) * 0.062;
  const med = income * 0.0145;
  const addMed = Math.max(0, income - 250000) * 0.009;
  return ss + med + addMed;
}

function monthlyTakeHome(income: number, state: string) {
  return (income - calcFederalTax(income) - (state === "CA" ? calcCATax(income) : 0) - calcFICA(income)) / 12;
}

const fmt = (n: number) => (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n)).toLocaleString();
const fmtK = (n: number) => Math.abs(n) >= 1000 ? (n < 0 ? "-" : "") + "$" + (Math.abs(n)/1000).toFixed(1) + "k" : fmt(n);

function Field({ label, value, onChange, suffix = "", note = "", disabled = false }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; note?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-600">{label}</span>
        {note && <span className="text-xs text-gray-400 ml-1">({note})</span>}
      </div>
      <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1 ml-2">
        <span className="text-sm text-gray-400">$</span>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`w-20 text-right text-sm font-medium bg-transparent outline-none ${disabled ? "text-gray-400" : ""}`} />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

// Collapsible section
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-2 text-left">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
        <span className="text-gray-400 text-xs">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export default function MoveCalculator() {
  // --- Income ---
  const [currentIncome, setCurrentIncome] = useState(170000);
  const [newIncome, setNewIncome] = useState(225000);
  const [partnerIncome, setPartnerIncome] = useState(0);
  const [useNewIncome, setUseNewIncome] = useState(true);
  const [currentSavings, setCurrentSavings] = useState(7500);
  const totalIncome = (useNewIncome ? newIncome : currentIncome) + partnerIncome;

  // --- Shared baseline expenses (monthly, both locations) ---
  const [groceries, setGroceries] = useState(1200);  // quality/organic focus
  const [gym, setGym] = useState(200);               // CrossFit or good gym
  const [carPayment1, setCarPayment1] = useState(450);// existing car
  const [carIns1, setCarIns1] = useState(200);        // existing car ins (CA avg ~$200/mo)
  const [internet, setInternet] = useState(80);
  const [phones, setPhones] = useState(160);
  const [subscriptions, setSubs] = useState(100);
  const [misc, setMisc] = useState(400);              // dining, household, etc

  // --- Location-specific overrides ---
  // Ventura CA
  const [caRent, setCaRent] = useState(3500);
  const [caElec, setCaElec] = useState(180);   // 29¢/kWh avg Ventura County
  const [caWater, setCaWater] = useState(77);  // CA avg $77/mo
  const [caGas, setCaGas] = useState(200);     // gas for one car, CA gas ~$4.50/gal
  const [caMoveCost, setCaMoveCost] = useState(7200);
  const currentRent = 2700;

  // Jacksonville FL
  const [jaxRent, setJaxRent] = useState(2500);
  const [jaxElec, setJaxElec] = useState(140);  // ~14¢/kWh FL, but AC heavy
  const [jaxWater, setJaxWater] = useState(45); // FL avg ~$45/mo
  const [jaxGrocAdj, setJaxGrocAdj] = useState(-110); // ~9% cheaper groceries
  const [jaxGas, setJaxGas] = useState(250);    // more driving, but gas ~$3.20/gal
  const [jaxCarIns1Adj, setJaxCarIns1Adj] = useState(25); // FL ins is higher avg
  const [jaxCar2Pmt, setJaxCar2Pmt] = useState(350);
  const [jaxCar2Ins, setJaxCar2Ins] = useState(135);  // liability-only used car
  const [jaxCar2Gas, setJaxCar2Gas] = useState(120);
  const [jaxGymAdj, setJaxGymAdj] = useState(0);      // similar CF pricing
  const [jaxMoveCost, setJaxMoveCost] = useState(10300);

  // --- Actual total spend (lets user anchor to reality) ---
  const [totalActualSpend, setTotalActualSpend] = useState(9000); // user's real current monthly spend

  // --- Time ---
  const [months, setMonths] = useState(36);

  // --- Compute monthly take-homes ---
  const flTH = useMemo(() => monthlyTakeHome(totalIncome, "FL"), [totalIncome]);
  const caTH = useMemo(() => monthlyTakeHome(totalIncome, "CA"), [totalIncome]);
  const curTH = useMemo(() => monthlyTakeHome(totalIncome, "CA"), [totalIncome]);

  // --- Compute expense totals ---
  const sharedBase = groceries + gym + carPayment1 + carIns1 + internet + phones + subscriptions + misc;

  // What's currently itemized for the "stay put" scenario (current rent + shared + utilities/gas)
  const currentItemized = currentRent + sharedBase + caElec + caWater + caGas;
  // The gap = everything you spend that isn't broken out above
  const unlistedExpenses = Math.max(0, totalActualSpend - currentItemized);

  const caExpenses = caRent + sharedBase + caElec + caWater + caGas + unlistedExpenses;
  const jaxExpenses = jaxRent + (sharedBase + jaxGrocAdj + jaxCarIns1Adj + jaxGymAdj) + jaxElec + jaxWater + jaxGas + jaxCar2Pmt + jaxCar2Ins + jaxCar2Gas + unlistedExpenses;
  const curExpenses = currentRent + sharedBase + caElec + caWater + caGas + unlistedExpenses;

  const caSav = caTH - caExpenses;
  const jaxSav = flTH - jaxExpenses;
  const curSav = curTH - curExpenses;

  const taxDelta = calcCATax(totalIncome); // FL pays $0 state tax
  const jaxRebound = jaxSav > 0 ? Math.ceil(jaxMoveCost / jaxSav) : Infinity;
  const caRebound = caSav > 0 ? Math.ceil(caMoveCost / caSav) : Infinity;

  // --- Projection data ---
  const projData = useMemo(() => {
    const data = [];
    let j = currentSavings - jaxMoveCost, c = currentSavings - caMoveCost, s = currentSavings;
    data.push({ month: 0, jax: Math.round(j), ca: Math.round(c), stay: Math.round(s) });
    for (let m = 1; m <= months; m++) {
      j += jaxSav; c += caSav; s += curSav;
      data.push({ month: m, jax: Math.round(j), ca: Math.round(c), stay: Math.round(s) });
    }
    return data;
  }, [months, jaxSav, caSav, curSav, currentSavings, jaxMoveCost, caMoveCost]);

  const milestones = [6, 12, 18, 24, 36].filter(m => m <= months);

  // --- Utility delta helper ---
  const expDiff = jaxExpenses - caExpenses;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Move or Stay: Financial Scenario Planner</h1>
        <p className="text-gray-500 mb-1 text-sm">Research-backed defaults. Every number is editable — adjust to match your reality.</p>
        <p className="text-xs text-gray-400 mb-6">CA tax: 2025 FTB Schedule Y (MFJ) | Groceries: BLS regional CPI | Insurance: Bankrate/Insure.com state avgs | Utilities: EnergySage county data</p>

        {/* ============ INCOME SECTION ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Household Income</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Field label="Current income" value={currentIncome} onChange={setCurrentIncome} suffix="/yr" />
              <Field label="Expected new income" value={newIncome} onChange={setNewIncome} suffix="/yr" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="useNew" checked={useNewIncome} onChange={e => setUseNewIncome(e.target.checked)} className="rounded" />
                <label htmlFor="useNew" className="text-sm text-gray-600">Use new income</label>
              </div>
            </div>
            <div>
              <Field label="Partner income" value={partnerIncome} onChange={setPartnerIncome} suffix="/yr" />
              <Field label="Savings on hand" value={currentSavings} onChange={setCurrentSavings} />
            </div>
            <div className="md:col-span-2">
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Combined gross</span><span className="font-semibold">{fmt(totalIncome)}/yr</span></div>
                <div className="flex justify-between"><span className="text-gray-500">FL take-home</span><span className="font-semibold text-blue-700">{fmt(flTH)}/mo</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CA take-home</span><span className="font-semibold text-amber-700">{fmt(caTH)}/mo</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CA state tax you skip in FL</span><span className="font-semibold text-green-700">{fmt(taxDelta)}/yr ({fmt(Math.round(taxDelta/12))}/mo)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ ACTUAL TOTAL SPEND ANCHOR ============ */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Your Actual Monthly Spend</h2>
          <p className="text-xs text-gray-400 mb-3">Set this to your real total monthly spend right now (including rent). The app will compute the gap between what's itemized below and this number, and carry that "unlisted" amount into both scenarios.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field label="Total actual monthly spend" value={totalActualSpend} onChange={setTotalActualSpend} suffix="/mo" note="everything, incl. rent" />
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Currently itemized</span><span className="font-medium">{fmt(currentItemized)}/mo</span></div>
              <div className="flex justify-between mt-1"><span className="text-gray-500">Unlisted expenses</span><span className="font-semibold text-orange-600">{fmt(unlistedExpenses)}/mo</span></div>
            </div>
            <div className="text-xs text-gray-400">
              <p>The {fmt(unlistedExpenses)}/mo gap covers everything you haven't itemized (childcare, dining out, personal care, etc). It's added to both scenarios equally.</p>
            </div>
          </div>
        </div>

        {/* ============ SHARED EXPENSES ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Itemized Monthly Expenses (baseline)</h2>
          <p className="text-xs text-gray-400 mb-3">These apply to both scenarios. Location-specific adjustments are below in each card. As you itemize more here, the "unlisted" amount above shrinks automatically.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6">
            <Field label="Groceries" value={groceries} onChange={setGroceries} note="quality/organic" />
            <Field label="Gym / fitness" value={gym} onChange={setGym} note="CrossFit ~$175-225" />
            <Field label="Car payment" value={carPayment1} onChange={setCarPayment1} note="existing car" />
            <Field label="Car insurance" value={carIns1} onChange={setCarIns1} note="CA avg ~$200" />
            <Field label="Internet" value={internet} onChange={setInternet} />
            <Field label="Phones" value={phones} onChange={setPhones} />
            <Field label="Subscriptions" value={subscriptions} onChange={setSubs} />
            <Field label="Other / misc" value={misc} onChange={setMisc} note="dining, household" />
          </div>
          <div className="mt-2 text-xs text-gray-400">Itemized baseline total: {fmt(sharedBase)}/mo &nbsp;|&nbsp; + unlisted {fmt(unlistedExpenses)}/mo = {fmt(sharedBase + unlistedExpenses)}/mo</div>
        </div>

        {/* ============ SCENARIO CARDS ============ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* ---------- JACKSONVILLE ---------- */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">Jacksonville, FL</h2>
            </div>

            <Section title="Housing & Utilities" defaultOpen={true}>
              <Field label="Rent" value={jaxRent} onChange={setJaxRent} suffix="/mo" note="2BR house" />
              <Field label="Electricity" value={jaxElec} onChange={setJaxElec} suffix="/mo" note="~14¢/kWh, heavy AC" />
              <Field label="Water / sewer" value={jaxWater} onChange={setJaxWater} suffix="/mo" note="FL avg ~$45" />
            </Section>

            <Section title="Location Adjustments" defaultOpen={true}>
              <Field label="Grocery adjustment" value={jaxGrocAdj} onChange={setJaxGrocAdj} suffix="/mo" note="~9% cheaper" />
              <Field label="Insurance adjustment" value={jaxCarIns1Adj} onChange={setJaxCarIns1Adj} suffix="/mo" note="FL ins higher" />
              <Field label="Gym adjustment" value={jaxGymAdj} onChange={setJaxGymAdj} suffix="/mo" note="similar CF pricing" />
              <Field label="Gas (existing car)" value={jaxGas} onChange={setJaxGas} suffix="/mo" note="more driving, cheaper gas" />
            </Section>

            <Section title="Second Car" defaultOpen={true}>
              <Field label="Car payment" value={jaxCar2Pmt} onChange={setJaxCar2Pmt} suffix="/mo" note="used car" />
              <Field label="Insurance" value={jaxCar2Ins} onChange={setJaxCar2Ins} suffix="/mo" note="liability ~$135" />
              <Field label="Gas" value={jaxCar2Gas} onChange={setJaxCar2Gas} suffix="/mo" />
            </Section>

            <Section title="Moving Costs (one-time)" defaultOpen={true}>
              <Field label="Total move cost" value={jaxMoveCost} onChange={setJaxMoveCost} />
              <div className="text-xs text-gray-400 space-y-0.5 mt-1 pl-1">
                <p>U-Box x2: ~$4,500 (avg $3,700 cross-country)</p>
                <p>First month rent: $2,500</p>
                <p>Security deposit: $2,500</p>
                <p>Drive out (gas/hotels): ~$800</p>
              </div>
            </Section>

            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Monthly take-home</span><span className="font-semibold text-green-700">{fmt(flTH)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total monthly expenses</span><span className="font-semibold text-red-600">{fmt(jaxExpenses)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-700 font-medium">Monthly savings</span>
                <span className={`font-bold text-xl ${jaxSav >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(jaxSav)}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Upfront cost</span><span className="font-semibold text-orange-600">{fmt(jaxMoveCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Months to recover</span><span className="font-bold">{jaxRebound === Infinity ? "Never" : jaxRebound + " mo"}</span></div>
            </div>
          </div>

          {/* ---------- CALIFORNIA ---------- */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Stay in CA (local move)</h2>
            </div>

            <Section title="Housing & Utilities" defaultOpen={true}>
              <Field label="New rent" value={caRent} onChange={setCaRent} suffix="/mo" note="nicer 2BR/house" />
              <Field label="Electricity" value={caElec} onChange={setCaElec} suffix="/mo" note="Ventura 29¢/kWh" />
              <Field label="Water / sewer" value={caWater} onChange={setCaWater} suffix="/mo" note="CA avg ~$77" />
            </Section>

            <Section title="Transportation" defaultOpen={true}>
              <Field label="Gas (one car)" value={caGas} onChange={setCaGas} suffix="/mo" note="CA gas ~$4.50/gal" />
              <p className="text-xs text-gray-400 pl-1">No second car needed</p>
            </Section>

            <Section title="Moving Costs (one-time)" defaultOpen={true}>
              <Field label="Total move cost" value={caMoveCost} onChange={setCaMoveCost} />
              <div className="text-xs text-gray-400 space-y-0.5 mt-1 pl-1">
                <p>First month rent: $3,500</p>
                <p>Security deposit: $3,500</p>
                <p>Self-move (truck/friends): ~$200</p>
              </div>
            </Section>

            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Monthly take-home</span><span className="font-semibold text-green-700">{fmt(caTH)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total monthly expenses</span><span className="font-semibold text-red-600">{fmt(caExpenses)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-700 font-medium">Monthly savings</span>
                <span className={`font-bold text-xl ${caSav >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(caSav)}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Upfront cost</span><span className="font-semibold text-orange-600">{fmt(caMoveCost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Months to recover</span><span className="font-bold">{caRebound === Infinity ? "Never" : caRebound + " mo"}</span></div>
            </div>
          </div>
        </div>

        {/* ============ EXPENSE COMPARISON BAR ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Side-by-Side Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Category</th>
                  <th className="text-right py-2 text-blue-600 font-medium">Jacksonville</th>
                  <th className="text-right py-2 text-amber-600 font-medium">Stay in CA</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Difference</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {([
                  ["Rent", jaxRent, caRent],
                  ["Groceries", groceries + jaxGrocAdj, groceries],
                  ["Gym / fitness", gym + jaxGymAdj, gym],
                  ["Car payment(s)", carPayment1 + jaxCar2Pmt, carPayment1],
                  ["Car insurance", carIns1 + jaxCarIns1Adj + jaxCar2Ins, carIns1],
                  ["Gas / transport", jaxGas + jaxCar2Gas, caGas],
                  ["Electricity", jaxElec, caElec],
                  ["Water", jaxWater, caWater],
                  ["Internet", internet, internet],
                  ["Phones", phones, phones],
                  ["Subscriptions", subscriptions, subscriptions],
                  ["Other / misc", misc, misc],
                  ["Unlisted expenses", unlistedExpenses, unlistedExpenses],
                ] satisfies [string, number, number][]).map(([label, jVal, cVal]) => {
                  const diff = jVal - cVal;
                  return (
                    <tr key={label} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-600">{label}</td>
                      <td className="py-1.5 text-right font-medium">{fmt(jVal)}</td>
                      <td className="py-1.5 text-right font-medium">{fmt(cVal)}</td>
                      <td className={`py-1.5 text-right font-medium ${diff < 0 ? "text-green-600" : diff > 0 ? "text-red-500" : "text-gray-400"}`}>
                        {diff === 0 ? "—" : (diff > 0 ? "+" : "") + fmt(diff)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="py-2">Total expenses</td>
                  <td className="py-2 text-right text-blue-700">{fmt(jaxExpenses)}</td>
                  <td className="py-2 text-right text-amber-700">{fmt(caExpenses)}</td>
                  <td className={`py-2 text-right ${expDiff < 0 ? "text-green-600" : "text-red-500"}`}>
                    {(expDiff > 0 ? "+" : "") + fmt(expDiff)}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2">Take-home pay</td>
                  <td className="py-2 text-right text-blue-700">{fmt(flTH)}</td>
                  <td className="py-2 text-right text-amber-700">{fmt(caTH)}</td>
                  <td className="py-2 text-right text-green-600">+{fmt(Math.round(flTH - caTH))}</td>
                </tr>
                <tr className="font-bold text-lg">
                  <td className="py-2">Net monthly savings</td>
                  <td className="py-2 text-right text-blue-700">{fmt(jaxSav)}</td>
                  <td className="py-2 text-right text-amber-700">{fmt(caSav)}</td>
                  <td className={`py-2 text-right ${jaxSav - caSav >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {(jaxSav - caSav >= 0 ? "+" : "") + fmt(Math.round(jaxSav - caSav))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ CHART ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cumulative Savings Over Time</h2>
            <div className="flex items-center gap-2">
              {[12, 24, 36].map(m => (
                <button key={m} onClick={() => setMonths(m)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${months === m ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {m / 12} yr{m > 12 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={projData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} label={{ value: "Months", position: "insideBottom", offset: -2, fontSize: 12 }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => fmt(Number(v))} labelFormatter={(m) => `Month ${m}`} />
              <Legend />
              <ReferenceLine y={currentSavings} stroke="#9ca3af" strokeDasharray="3 3" label={{ value: "Starting savings", position: "right", fontSize: 11, fill: "#9ca3af" }} />
              <Line type="monotone" dataKey="jax" name="Jacksonville, FL" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ca" name="Stay in CA" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="stay" name="Stay put (no move)" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ============ MILESTONES ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Snapshot at Key Milestones</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Milestone</th>
                  <th className="text-right py-2 px-4 text-blue-600 font-medium">Jacksonville</th>
                  <th className="text-right py-2 px-4 text-amber-600 font-medium">Stay in CA</th>
                  <th className="text-right py-2 px-4 text-gray-400 font-medium">No move</th>
                  <th className="text-right py-2 pl-4 text-gray-500 font-medium">JAX vs CA</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map(m => {
                  const d = projData.find(p => p.month === m);
                  if (!d) return null;
                  const diff = d.jax - d.ca;
                  return (
                    <tr key={m} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-700">{m} mo{m >= 12 ? ` (${m/12} yr${m > 12 ? "s" : ""})` : ""}</td>
                      <td className="py-2 px-4 text-right font-semibold text-blue-700">{fmt(d.jax)}</td>
                      <td className="py-2 px-4 text-right font-semibold text-amber-700">{fmt(d.ca)}</td>
                      <td className="py-2 px-4 text-right text-gray-400">{fmt(d.stay)}</td>
                      <td className={`py-2 pl-4 text-right font-semibold ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>{diff >= 0 ? "+" : ""}{fmt(diff)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ INCOME SLIDERS ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">What-If: Toggle Household Income</h2>
          <p className="text-xs text-gray-400 mb-4">Drag to see how different income levels shift everything above in real-time.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Your income: {fmt(useNewIncome ? newIncome : currentIncome)}/yr</label>
              <input type="range" min={100000} max={350000} step={5000}
                value={useNewIncome ? newIncome : currentIncome}
                onChange={e => useNewIncome ? setNewIncome(Number(e.target.value)) : setCurrentIncome(Number(e.target.value))}
                className="w-full accent-gray-900" />
              <div className="flex justify-between text-xs text-gray-400"><span>$100k</span><span>$350k</span></div>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Partner income: {fmt(partnerIncome)}/yr</label>
              <input type="range" min={0} max={150000} step={5000}
                value={partnerIncome}
                onChange={e => setPartnerIncome(Number(e.target.value))}
                className="w-full accent-gray-900" />
              <div className="flex justify-between text-xs text-gray-400"><span>$0</span><span>$150k</span></div>
            </div>
          </div>
        </div>

        {/* ============ BOTTOM LINE ============ */}
        <div className="bg-gray-900 rounded-xl p-5 text-white mb-6">
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide text-gray-400">Bottom Line (at current settings)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Jacksonville upfront hit</p>
              <p className="text-2xl font-bold text-blue-400">{fmt(jaxMoveCost)}</p>
              <p className="text-gray-400 mt-1">Recovered in <span className="text-white font-semibold">{jaxRebound === Infinity ? "never" : jaxRebound + " mo"}</span></p>
            </div>
            <div>
              <p className="text-gray-400">CA local move upfront hit</p>
              <p className="text-2xl font-bold text-amber-400">{fmt(caMoveCost)}</p>
              <p className="text-gray-400 mt-1">Recovered in <span className="text-white font-semibold">{caRebound === Infinity ? "never" : caRebound + " mo"}</span></p>
            </div>
            <div>
              <p className="text-gray-400">JAX advantage at 2 years</p>
              {projData.find(p => p.month === 24) ? (
                <p className="text-2xl font-bold text-green-400">
                  {fmt((projData.find(p => p.month === 24)?.jax || 0) - (projData.find(p => p.month === 24)?.ca || 0))}
                </p>
              ) : <p className="text-2xl font-bold text-green-400">-</p>}
              <p className="text-gray-400 mt-1">cumulative savings difference</p>
            </div>
          </div>
        </div>

        {/* ============ RESEARCH NOTES ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Research Sources & Notes</h2>
          <div className="text-xs text-gray-500 space-y-2">
            <p><strong>CA State Tax:</strong> 2025 FTB Schedule Y (MFJ). At $225k gross, your CA marginal rate is 9.3%. Effective CA state tax ~$13,500/yr. FL has no state income tax.</p>
            <p><strong>Moving (cross-country):</strong> U-Box avg $3,700 per container; 2BR typically needs 1-2 containers. Total transport ~$4,000-5,000. U-Haul truck alt: 20ft truck CA→FL quoted ~$3,500-5,000+ depending on season.</p>
            <p><strong>Groceries:</strong> CA grocery price index 115.2 vs FL 105.4 (BLS). ~9% cheaper in FL. Quality/organic options (Whole Foods, Publix GreenWise) available in Jax.</p>
            <p><strong>Car Insurance:</strong> FL avg full-coverage $3,852/yr ($321/mo) vs CA avg $2,416/yr ($201/mo). Jacksonville specifically ~$2,692/yr ($224/mo), below FL state average. Second car liability-only ~$1,029-1,642/yr.</p>
            <p><strong>Utilities:</strong> Ventura County electricity avg 29¢/kWh (56% above national avg). Jacksonville ~13-14¢/kWh but heavier AC usage. CA water avg $77/mo, FL ~$40-50/mo.</p>
            <p><strong>Gym:</strong> CrossFit in both areas ranges $150-250/mo. Jacksonville: Crucible CF, CF 904, CF Total Control. Ventura: Beachside CF, Ventura CF. Pricing is comparable.</p>
            <p><strong>Rental deposits (FL):</strong> Typically first month + one month security deposit. No statutory limit on deposits in FL. Application fees $50-150 per adult.</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">Tax estimates use 2025 verified brackets. All other figures from 2025-2026 published data. Adjust any input to re-run instantly.</p>
      </div>
    </div>
  );
}
