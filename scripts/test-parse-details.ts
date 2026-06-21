// Unit test for parseTransactionDetails using known HDFC statement descriptions.
import { parseTransactionDetails } from "../lib/statement-parser";

const cases: Array<{ in: string; expectedName: string; expectedMethod: string | null }> = [
  {
    in: "UPI-MOHAMED FIZAL-FIZALLAZIF13-1@OKHDFCBANK-HDFC0009069-648728198416-PAID VIA CRED 0",
    expectedName: "MOHAMED FIZAL",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-MCAFFEINE-MCAFFEINEGK@YESBANK-YESB0000728-648814409960-PAYMENTFORKWIK9QXW 00",
    expectedName: "MCAFFEINE",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-SELVALINGESHWARAN R-6369988549-G0DD-3@AXL-UTIB0003261-270747376632-PAYMENT F",
    expectedName: "SELVALINGESHWARAN R",
    expectedMethod: "UPI",
  },
  {
    in: "DC INTL POS TXN MARKUP+ST 190426-EPR2712185798732 EPR2712185798732",
    expectedName: "INTL POS TXN MARKUP+ST",
    expectedMethod: "Card",
  },
  {
    in: "POS 526099XXXXXX7751 515608 03MAY26 16:36:08 BANGA",
    expectedName: "526099XXXXXX7751",
    expectedMethod: "Card",
  },
  {
    in: "ACH D- INDIAN CLEARING CORP-000042BSIWP1 000000350",
    expectedName: "INDIAN CLEARING CORP",
    expectedMethod: "ACH",
  },
  {
    in: "UPI-AAKASH P-13AAKASH14@OKICICI-FDRL0007777-612423688053",
    expectedName: "AAKASH P",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-SIVARANJITHSINGH-9840487013@IBL-KVBL0001819-649017940746",
    expectedName: "SIVARANJITHSINGH",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-VASANTHKUMAR-VASANTHKUMAR7100@OKIC-000064936013729",
    expectedName: "VASANTHKUMAR",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-DHINESH KUMAR R-DHINESHKARTHI2502-2@OKIC-0000649309458702",
    expectedName: "DHINESH KUMAR R",
    expectedMethod: "UPI",
  },
  {
    in: "NEFT CR-KKBK0000958-FOURDEGREEWATER SEF CMS1282600349814",
    expectedName: "FOURDEGREEWATER SEF",
    expectedMethod: "NEFT",
  },
  {
    in: "UPI-SARAVANAN V-SARAVANAN EEE. GCE@OKIC-0000649512741691",
    expectedName: "SARAVANAN V",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-AAKASH P-13AAKASH14@OKICICI-FDRL0007777-0000612948612175",
    expectedName: "AAKASH P",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-GANESH-6380050491@SUPERYES-KVBL00017-0000612948614477",
    expectedName: "GANESH",
    expectedMethod: "UPI",
  },
  {
    in: "ME DC SI 526099XXXXXX7751 TALIC",
    expectedName: "DC SI",
    expectedMethod: "ME",
  },
  {
    in: "SBY31075385_DAP_RENEWAL",
    expectedName: "31075385 DAP RENEWAL",
    expectedMethod: "SBY",
  },
  {
    in: "UPI-HARIHARAN SIVA JOTHI-HARIHARANS614@OK-0000614523663866",
    expectedName: "HARIHARAN SIVA JOTHI",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-GIRIDHARAN K-GIRIDHARANMA1522-2@OKICI-0000651121221023",
    expectedName: "GIRIDHARAN K",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-CORNER POINT-PAYTM.S20GYQW@PTY-YES-0000651229327417",
    expectedName: "CORNER POINT",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-BLINKIT-BLINKIT.PAYU@HDFCBANK-HDFC0ME-0000611123761930",
    expectedName: "BLINKIT",
    expectedMethod: "UPI",
  },
  {
    in: "UPI-CRED CLUB-CRED.CLUB@AXISB-UTIB0000114-0000651706037322",
    expectedName: "CRED CLUB",
    expectedMethod: "UPI",
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const got = parseTransactionDetails(c.in);
  const nameOk = got.name === c.expectedName;
  const methodOk = got.detectedPaymentMethod === c.expectedMethod;
  if (nameOk && methodOk) {
    pass++;
  } else {
    fail++;
    console.log(
      `FAIL  in: ${c.in.slice(0, 60).padEnd(60)}  name=${JSON.stringify(got.name)}${nameOk ? "" : ` (expected ${JSON.stringify(c.expectedName)})`}  method=${JSON.stringify(got.detectedPaymentMethod)}${methodOk ? "" : ` (expected ${JSON.stringify(c.expectedMethod)})`}`,
    );
  }
}
console.log(`\n${pass}/${pass + fail} passed`);
if (fail) process.exit(1);