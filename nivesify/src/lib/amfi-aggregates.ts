export type AmfiRawRecord = {
  Category: string;
  Sub_Category: string;
  return1YearDirect: number | null;
  return1YearBenchmark: number | null;
  return3YearDirect: number | null;
  return3YearBenchmark: number | null;
  return5YearDirect: number | null;
  return5YearBenchmark: number | null;
  return10YearDirect: number | null;
  return10YearBenchmark: number | null;
  dailyAUM: number | null;
};

export type ReturnAggregate = {
  key: string;
  Category: string | null;
  Sub_Category: string | null;
  Number_of_Schemes: number;
  Total_AUM: number;
  Avg_1Y_Return: number | null;
  Avg_3Y_Return: number | null;
  Avg_5Y_Return: number | null;
  Avg_10Y_Return: number | null;
  Avg_Benchmark_Return_1Y: number | null;
  Avg_Benchmark_Return_3Y: number | null;
  Avg_Benchmark_Return_5Y: number | null;
  Avg_Benchmark_Return_10Y: number | null;
};

const mean = (values: Array<number | null | undefined>) => {
  const cleaned = values.filter((value): value is number => value !== null && value !== undefined);
  if (!cleaned.length) return null;
  const total = cleaned.reduce((sum, value) => sum + value, 0);
  return total / cleaned.length;
};

const sum = (values: Array<number | null | undefined>) => {
  let total = 0;
  values.forEach((value) => {
    total += value ?? 0;
  });
  return total;
};

export const computeAmfiAggregates = (records: AmfiRawRecord[]) => {
  const byCategory = new Map<string, AmfiRawRecord[]>();
  const bySubCategory = new Map<string, AmfiRawRecord[]>();

  records.forEach((record) => {
    if (record.Category) {
      const list = byCategory.get(record.Category) ?? [];
      list.push(record);
      byCategory.set(record.Category, list);
    }
    if (record.Category && record.Sub_Category) {
      const key = `${record.Category}|||${record.Sub_Category}`;
      const list = bySubCategory.get(key) ?? [];
      list.push(record);
      bySubCategory.set(key, list);
    }
  });

  const buildAggregate = (items: AmfiRawRecord[], category: string | null, subCategory: string | null) => {
    return {
      key: `${category ?? "Industry"}|||${subCategory ?? "All"}`,
      Category: category,
      Sub_Category: subCategory,
      Number_of_Schemes: items.length,
      Total_AUM: sum(items.map((item) => item.dailyAUM)),
      Avg_1Y_Return: mean(items.map((item) => item.return1YearDirect)),
      Avg_3Y_Return: mean(items.map((item) => item.return3YearDirect)),
      Avg_5Y_Return: mean(items.map((item) => item.return5YearDirect)),
      Avg_10Y_Return: mean(items.map((item) => item.return10YearDirect)),
      Avg_Benchmark_Return_1Y: mean(items.map((item) => item.return1YearBenchmark)),
      Avg_Benchmark_Return_3Y: mean(items.map((item) => item.return3YearBenchmark)),
      Avg_Benchmark_Return_5Y: mean(items.map((item) => item.return5YearBenchmark)),
      Avg_Benchmark_Return_10Y: mean(items.map((item) => item.return10YearBenchmark)),
    };
  };

  const industry = buildAggregate(records, null, null);
  const categories = Array.from(byCategory.entries()).map(([category, items]) =>
    buildAggregate(items, category, null)
  );
  const subCategories = Array.from(bySubCategory.entries()).map(([key, items]) => {
    const [category, subCategory] = key.split("|||");
    return buildAggregate(items, category, subCategory);
  });

  return { industry, categories, subCategories };
};
