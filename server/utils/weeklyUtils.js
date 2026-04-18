exports.getWeeklyData = (data, moduleName) => {
  const daysMap = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  };

  const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const result = week.map(day => ({
    day,
    [moduleName]: 0
  }));

  data.forEach(item => {
    const d = new Date(item.date);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

    const index = daysMap[dayName];
    if (index !== undefined) {
      result[index][moduleName] = item.avgScore;
    }
  });

  return result;
};