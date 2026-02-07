import { InvestmentsData, Holder, Transaction, Meta } from "./types";

type CasScheme = {
  schemeCode: number;
  schemeName: string;
  isinGrowth: string;
  isinDivReinvestment: string | null;
};

export const textUtils = {
  isText: (str: string) => str.trim().length > 0,
  filterLinesWithText: (lines: string[]) => lines.filter(textUtils.isText),
  excludeLinesThatInclude: (lines: string[], text: string) => lines.filter((line) => !line.includes(text)),
  excludeLinesThatStartWith: (lines: string[], text: string) => lines.filter((line) => !line.startsWith(text)),
};

export const getFilteredText = (text: string) => {
  const lines = text.split("\n");

  let filteredLines = textUtils.filterLinesWithText(lines);

  filteredLines = textUtils.excludeLinesThatStartWith(filteredLines, "Page");
  filteredLines = textUtils.excludeLinesThatStartWith(filteredLines, "Date Amount");
  filteredLines = textUtils.excludeLinesThatStartWith(filteredLines, "(INR) (INR)");
  filteredLines = textUtils.excludeLinesThatStartWith(filteredLines, "PAN:");

  filteredLines = filteredLines.filter((line, index) => {
    return index <= 2 || ![lines[0], lines[1], lines[2]].includes(line);
  });

  filteredLines.forEach((line, index) => {
    if (line.startsWith("***")) {
      filteredLines[index - 1] += " " + filteredLines[index];
    }
  });

  filteredLines = textUtils.excludeLinesThatStartWith(filteredLines, "***");

  let ci = filteredLines.findIndex((line) => line.startsWith("Total")) + 2;
  let start = false;
  let started = true;
  let si = 0;

  while (ci <= filteredLines.length - 1) {
    if (start) {
      if (filteredLines[ci].startsWith("Folio No:") && !filteredLines[ci + 1].includes("Folio No:")) {
        start = false;
      } else {
        filteredLines[si] = filteredLines[si] + " " + filteredLines[ci];
        filteredLines[ci] = "";
      }
    } else {
      if (filteredLines[ci].startsWith("Closing") || started) {
        started = true;
        if (filteredLines[ci].includes("-")) {
          start = true;
          si = ci;
          started = false;
        }
      }
    }
    ci++;
  }

  filteredLines = textUtils.filterLinesWithText(filteredLines);

  filteredLines = filteredLines.filter((line, index) => {
    if (filteredLines[index - 1] && filteredLines[index + 1]) {
      if (line.includes("Nominee 1:")) {
        return false;
      }

      if (filteredLines[index - 1].includes("Nominee 1:")) {
        return false;
      }

      if (filteredLines[index + 1].includes("Nominee 1:")) {
        return false;
      }
    }

    return true;
  });

  let newFilteredLines: string[] = [];
  let read = true;

  for (let i = 0; i < filteredLines.length; i++) {
    if (read) {
      newFilteredLines.push(filteredLines[i]);
    }

    if (filteredLines[i].includes("Market Value on")) {
      read = false;
    }

    if (filteredLines[i].includes("Closing Unit Balance")) {
      newFilteredLines.push(filteredLines[i]);
      read = true;
    }
  }

  newFilteredLines = textUtils.excludeLinesThatInclude(newFilteredLines, "Market Value on");

  newFilteredLines = newFilteredLines.filter((_line, index) => {
    if (newFilteredLines[index - 1] && newFilteredLines[index + 2]) {
      if (newFilteredLines[index - 1].includes("Closing Unit Balance")) {
        if (newFilteredLines[index + 2].includes("Folio No: ")) {
          return false;
        }
      }
    }

    return true;
  });

  newFilteredLines = textUtils.excludeLinesThatInclude(newFilteredLines, "Closing Unit Balance");

  let retry = true;
  while (retry) {
    retry = false;
    const linesToDelete: number[] = [];

    newFilteredLines.forEach((line, index) => {
      if (
        index > 3 &&
        line.length > 11 &&
        line[2] === "-" &&
        line[6] === "-" &&
        line[11] === " " &&
        newFilteredLines[index + 1]
      ) {
        if (
          newFilteredLines[index + 1].length > 11 &&
          newFilteredLines[index + 1][2] === "-" &&
          newFilteredLines[index + 1][6] === "-" &&
          newFilteredLines[index + 1][11] === " "
        ) {
          return;
        }

        if (!(newFilteredLines[index + 2] && newFilteredLines[index + 2].startsWith("Folio No: "))) {
          retry = true;
          newFilteredLines[index] = newFilteredLines[index] + " " + newFilteredLines[index + 1];
          linesToDelete.push(index + 1);
        }
      }
    });

    newFilteredLines = newFilteredLines.filter((_line, index) => !linesToDelete.includes(index));
  }

  return newFilteredLines.join("\n");
};

export const getJsonFromTxt = async (t: string, mfData?: CasScheme[]): Promise<InvestmentsData> => {
  const lines = t.split("\n");
  const transactions = await getTransactions(lines, mfData);
  return {
    meta: getMeta(lines),
    holder: getHolder(lines),
    summary: getSummary(lines),
    transactions,
  };
};

export const getSummaryFromTxt = (t: string) => {
  const lines = t.split("\n");
  return {
    meta: getMeta(lines),
    holder: getHolder(lines),
    summary: getSummary(lines),
  };
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toNumber = (value: string) => Number(value.replace(/,/g, ""));
export const strToCur = (num: string) => Math.round((toNumber(num) + Number.EPSILON) * 100) / 100;
export const strToPrice = (num: string) => Math.round((toNumber(num) + Number.EPSILON) * 10000) / 10000;
export const strToUnits = (num: string) => Math.round((toNumber(num) + Number.EPSILON) * 1000) / 1000;

export const getIndexByStartingText = (lines: string[], text: string) =>
  lines.indexOf(lines.filter((line) => line.startsWith(text))[0]);

export const getTransactions = async (lines: string[], mfDataInput?: CasScheme[]): Promise<Transaction[]> => {
  let mfData = mfDataInput;
  if (!mfData) {
    const response = await fetch("https://api.mfapi.in/mf");
    mfData = await response.json();
  }

  const portfolioSummaryTotalRowIndex = getIndexByStartingText(lines, "Total");

  let filteredLines: Array<string | Transaction> = lines.filter((_line, index) => index > portfolioSummaryTotalRowIndex + 1);

  filteredLines.forEach((line, index) => {
    if (typeof line === "string" && line.includes("*** Stamp Duty ***")) {
      const stampDuty = strToPrice(line.split(" ")[1]);
      const amount = strToPrice((filteredLines[index - 1] as string).split(" ")[1]);

      const prevLine = (filteredLines[index - 1] as string).split(" ");
      prevLine[1] = (amount + stampDuty).toFixed(2);
      filteredLines[index - 1] = prevLine.join(" ");
    }
  });

  filteredLines = filteredLines.filter((line) => !(typeof line === "string" && line.includes("***")));

  filteredLines.forEach((line, index) => {
    if (typeof line === "string" && line.startsWith("Folio No:")) {
      filteredLines[index - 1] = `${filteredLines[index - 1]} ${line}`;
    }
  });

  filteredLines = filteredLines.filter((line) => !(typeof line === "string" && line.startsWith("Folio No:")));

  let mfNameFull = "";
  let mfName = "";
  let folio = "";
  let isin = "";
  let matchingScheme: CasScheme | undefined;

  filteredLines.forEach((line, index) => {
    if (typeof line === "string" && line.includes("Folio No:")) {
      [mfNameFull, folio] = line.split(" Folio No: ");
      isin = line.split(" - ISIN : ")[1].split("(")[0].split("Registrar")[0].split(" ").join("").trim();

      if (!isin) {
        throw new Error(`No ISIN found for line: ${line}`);
      }

      matchingScheme = mfData.find(
        (scheme) => scheme.isinGrowth === isin || scheme.isinDivReinvestment === isin
      );

      if (!matchingScheme) {
        throw new Error(`No matching scheme found for ISIN: ${isin}`);
      }

      mfNameFull = mfNameFull.split(" - ISIN : ")[0].trim();
      mfNameFull = mfNameFull.split(" -").splice(1).join(" -").trim();

      mfName = mfNameFull
        .split("Direct").join("")
        .split("DIRECT").join("")
        .split("Growth").join("")
        .split("GROWTH").join("")
        .split("Plan").join("")
        .split("PLAN").join("")
        .split("Option").join("")
        .split("OPTION").join("")
        .split("( Non - Demat )").join("")
        .split("( formerly")[0]
        .trim();

      while (mfName.charAt(mfName.length - 1) === "-" || mfName.charAt(mfName.length - 1) === " ") {
        mfName = mfName.slice(0, -1);
      }
    } else if (typeof line === "string" && line[2] === "-") {
      let amount: number;
      let units: number;
      const amountStr = line.split(" ")[1];
      const unitsStr = line.split(" ")[3];
      let type: "Investment" | "Redemption" = "Investment";

      if (amountStr[0] === "(") {
        amount = strToCur(amountStr.slice(1, -1));
        type = "Redemption";
      } else {
        amount = strToCur(amountStr);
      }

      if (unitsStr[0] === "(") {
        units = strToUnits(unitsStr.slice(1, -1));
      } else {
        units = strToUnits(unitsStr);
      }

      folio = folio.split("/")[0].trim();

      filteredLines[index] = {
        mfNameFull,
        isin,
        matchingScheme,
        mfName,
        folio,
        date: new Date(
          Number(line.split(" ")[0].split("-")[2]),
          MONTHS.indexOf(line.split(" ")[0].split("-")[1]),
          Number(line.split(" ")[0].split("-")[0])
        ).toISOString(),
        amount,
        type,
        price: strToPrice(line.split(" ")[2]),
        units,
        content: line,
        key: index,
      } as Transaction;
    }
  });

  filteredLines = filteredLines.filter((line) => typeof line !== "string") as Transaction[];
  filteredLines = filteredLines.filter((line) => !Number.isNaN(line.amount));

  return filteredLines;
};

export const getSummary = (lines: string[]) => {
  const portfolioSummaryTotalRowIndex = getIndexByStartingText(lines, "Total");
  const portfolioSummaryRowIndex = getIndexByStartingText(lines, "PORTFOLIO SUMMARY");

  return {
    invested: strToCur(lines[portfolioSummaryTotalRowIndex].split(" ")[1]),
    currentValue: strToCur(lines[portfolioSummaryTotalRowIndex].split(" ")[2]),
    mutualFunds: lines
      .slice(portfolioSummaryRowIndex + 1, portfolioSummaryTotalRowIndex)
      .map((mf) => {
        const mfSplit = mf.trim().split(" ");

        return {
          fundHouse: mfSplit.slice(0, mfSplit.length - 2).join(" "),
          invested: strToCur(mfSplit[mfSplit.length - 2]),
          currentValue: strToCur(mfSplit[mfSplit.length - 1]),
        };
      }),
  };
};

export const getHolder = (lines: string[]): Holder => {
  const mobileNumberRowIndex = getIndexByStartingText(lines, "Mobile");
  const emailIdRowIndex = getIndexByStartingText(lines, "Email Id");

  return {
    name: lines[4],
    email: lines[emailIdRowIndex].split(" ")[2],
    mobile: lines[mobileNumberRowIndex].split(" ")[1],
    address: lines.slice(emailIdRowIndex + 2, mobileNumberRowIndex).join("\n"),
  };
};

const convertDateToString = (date: Date): string => JSON.parse(JSON.stringify(date));

export const getMeta = (lines: string[]): Meta => {
  const timestamp = lines[0].split(" ")[0].split("-")[1];
  const from = lines[2].split(" ")[0].split("-");
  const to = lines[2].split(" ")[2].split("-");

  return {
    exportedAt: convertDateToString(
      new Date(
        Number("20" + timestamp.substr(4, 2)),
        Number(timestamp.substr(2, 2)) - 1,
        Number(timestamp.substr(0, 2)),
        Number(timestamp.substr(6, 2)),
        Number(timestamp.substr(8, 2)),
        Number(timestamp.substr(10, 2))
      )
    ),
    from: convertDateToString(new Date(Number(from[2]), MONTHS.indexOf(from[1]), Number(from[0]))),
    to: convertDateToString(new Date(Number(to[2]), MONTHS.indexOf(to[1]), Number(to[0]))),
  };
};
