function getDateRangeOfWeek(weekNo, year) {
  const startDate = new Date(year, 0, 1);
  const dayOffset = (startDate.getDay() + 6) % 7;
  const startWeek = new Date(
    startDate.setDate(startDate.getDate() - dayOffset + (weekNo - 1) * 7)
  );

  const endWeek = new Date(startWeek);
  endWeek.setDate(startWeek.getDate() + 6);

  return {
    startWeek,
    endWeek,
  };
}

// Example Usage
for (let i = 1; i <= 52; i++) {
  const { startWeek, endWeek } = getDateRangeOfWeek(i, 2024);
  console.log(
    `Week ${i} of 2024 starts on  "${startWeek.toDateString()}"  and ends on  "${endWeek.toDateString()}"`
  );
}
