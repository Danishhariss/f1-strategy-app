type Lap = {
  driver_number: number;
  lap_duration?: number;
};

type Stint = {
  driver_number: number;
  stint_number: number;
  compound?: string;
  lap_start?: number;
  lap_end?: number;
};

type PositionPoint = {
  driver_number: number;
  position?: number;
  date?: string;
};

type DriverLite = {
  driver_number: number;
  full_name?: string;
  name_acronym?: string;
};

export function calculateAveragePace(laps: Lap[], driverNumber: number) {
  const driverLaps = laps.filter(
    (lap) => lap.driver_number === driverNumber && lap.lap_duration != null
  );

  if (driverLaps.length === 0) return null;

  const total = driverLaps.reduce(
    (sum, lap) => sum + (lap.lap_duration as number),
    0
  );

  return total / driverLaps.length;
}

export function calculateConsistency(laps: Lap[], driverNumber: number) {
  const driverLaps = laps.filter(
    (lap) => lap.driver_number === driverNumber && lap.lap_duration != null
  );

  if (driverLaps.length === 0) return null;

  const avg =
    driverLaps.reduce(
      (sum, lap) => sum + (lap.lap_duration as number),
      0
    ) / driverLaps.length;

  const variance =
    driverLaps.reduce((sum, lap) => {
      const diff = (lap.lap_duration as number) - avg;
      return sum + diff * diff;
    }, 0) / driverLaps.length;

  return Math.sqrt(variance);
}

export function getDriverStints(stints: Stint[], driverNumber: number) {
  return stints
    .filter((stint) => stint.driver_number === driverNumber)
    .map((stint) => {
      const lapStart = stint.lap_start ?? 0;
      const lapEnd = stint.lap_end ?? 0;
      const stintLength =
        lapStart > 0 && lapEnd > 0 ? lapEnd - lapStart + 1 : null;

      return {
        stint_number: stint.stint_number,
        compound: stint.compound ?? "UNKNOWN",
        lap_start: lapStart,
        lap_end: lapEnd,
        stint_length: stintLength,
      };
    })
    .sort((a, b) => a.stint_number - b.stint_number);
}

export function buildStrategySummary(
  stints: Stint[],
  driverNumber: number,
  driverName: string
) {
  const driverStints = getDriverStints(stints, driverNumber);

  if (driverStints.length === 0) {
    return `No tyre strategy data available for ${driverName}.`;
  }

  const parts = driverStints.map(
    (stint) =>
      `Tyre Phase ${stint.stint_number}: ${formatCompound(
        stint.compound
      )} (laps ${stint.lap_start}-${stint.lap_end}, ${
        stint.stint_length
      } laps)`
  );

  return `${driverName}'s race tyre strategy: ${parts.join(" → ")}.`;
}

export function formatCompound(compound?: string) {
  if (!compound) return "Unknown";

  const map: Record<string, string> = {
    SOFT: "Soft",
    MEDIUM: "Medium",
    HARD: "Hard",
    INTERMEDIATE: "Intermediate",
    WET: "Wet",
    UNKNOWN: "Unknown",
  };

  return map[compound.toUpperCase()] || compound;
}

function getDriverDisplayName(driver: DriverLite) {
  return (
    driver.full_name ||
    driver.name_acronym ||
    `Driver #${driver.driver_number}`
  );
}

export function getFastestDriver(laps: Lap[], drivers: DriverLite[]) {
  let bestDriver: string | null = null;
  let bestDriverNumber: number | null = null;
  let bestPace = Infinity;

  for (const driver of drivers) {
    const avg = calculateAveragePace(laps, driver.driver_number);

    if (avg != null && avg < bestPace) {
      bestPace = avg;
      bestDriverNumber = driver.driver_number;
      bestDriver = getDriverDisplayName(driver);
    }
  }

  if (bestDriver == null || bestDriverNumber == null) return null;

  return {
    driverNumber: bestDriverNumber,
    driverName: bestDriver,
    value: bestPace,
  };
}

export function getMostConsistentDriver(laps: Lap[], drivers: DriverLite[]) {
  let bestDriver: string | null = null;
  let bestDriverNumber: number | null = null;
  let bestConsistency = Infinity;

  for (const driver of drivers) {
    const consistency = calculateConsistency(laps, driver.driver_number);

    if (consistency != null && consistency < bestConsistency) {
      bestConsistency = consistency;
      bestDriverNumber = driver.driver_number;
      bestDriver = getDriverDisplayName(driver);
    }
  }

  if (bestDriver == null || bestDriverNumber == null) return null;

  return {
    driverNumber: bestDriverNumber,
    driverName: bestDriver,
    value: bestConsistency,
  };
}

export function getBiggestPositionGain(
  positions: PositionPoint[],
  drivers: DriverLite[]
) {
  let bestDriver: string | null = null;
  let bestDriverNumber: number | null = null;
  let bestGain = -Infinity;

  for (const driver of drivers) {
    const driverPositions = positions
      .filter(
        (p) =>
          p.driver_number === driver.driver_number &&
          p.position != null &&
          p.date
      )
      .sort(
        (a, b) =>
          new Date(a.date as string).getTime() -
          new Date(b.date as string).getTime()
      );

    if (driverPositions.length === 0) continue;

    const startPosition = Number(driverPositions[0].position);
    const endPosition = Number(
      driverPositions[driverPositions.length - 1].position
    );
    const gain = startPosition - endPosition;

    if (gain > bestGain) {
      bestGain = gain;
      bestDriverNumber = driver.driver_number;
      bestDriver = getDriverDisplayName(driver);
    }
  }

  if (bestDriver == null || bestDriverNumber == null) return null;

  return {
    driverNumber: bestDriverNumber,
    driverName: bestDriver,
    value: bestGain,
  };
}

export function getPositionChangeSummary(
  positions: PositionPoint[],
  drivers: DriverLite[]
) {
  return drivers
    .map((driver) => {
      const driverPositions = positions
        .filter(
          (p) =>
            p.driver_number === driver.driver_number &&
            p.position != null &&
            p.date
        )
        .sort(
          (a, b) =>
            new Date(a.date as string).getTime() -
            new Date(b.date as string).getTime()
        );

      if (driverPositions.length === 0) return null;

      const startPosition = Number(driverPositions[0].position);
      const endPosition = Number(
        driverPositions[driverPositions.length - 1].position
      );
      const gain = startPosition - endPosition;

      return {
        driverNumber: driver.driver_number,
        driverName: getDriverDisplayName(driver),
        startPosition,
        endPosition,
        positionsGained: gain,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        (a?.startPosition ?? Infinity) - (b?.startPosition ?? Infinity)
    ) as Array<{
    driverNumber: number;
    driverName: string;
    startPosition: number;
    endPosition: number;
    positionsGained: number;
  }>;
}

export function getLongestStintDriver(stints: Stint[], drivers: DriverLite[]) {
  let bestDriver: string | null = null;
  let bestDriverNumber: number | null = null;
  let longestStint = -Infinity;
  let bestCompound = "Unknown";

  for (const driver of drivers) {
    const driverStints = getDriverStints(stints, driver.driver_number);

    for (const stint of driverStints) {
      const len = stint.stint_length ?? 0;

      if (len > longestStint) {
        longestStint = len;
        bestDriverNumber = driver.driver_number;
        bestDriver = getDriverDisplayName(driver);
        bestCompound = stint.compound;
      }
    }
  }

  if (bestDriver == null || bestDriverNumber == null) return null;

  return {
    driverNumber: bestDriverNumber,
    driverName: bestDriver,
    compound: bestCompound,
    value: longestStint,
  };
}

export function buildRaceInsights(params: {
  laps: Lap[];
  positions: PositionPoint[];
  stints: Stint[];
  drivers: DriverLite[];
}) {
  const { laps, positions, stints, drivers } = params;

  const fastest = getFastestDriver(laps, drivers);
  const consistent = getMostConsistentDriver(laps, drivers);
  const biggestGain = getBiggestPositionGain(positions, drivers);
  const longestStint = getLongestStintDriver(stints, drivers);

  const insights: string[] = [];

  if (fastest) {
    insights.push(
      `${fastest.driverName} set the fastest average race pace at ${fastest.value.toFixed(
        2
      )} seconds per lap.`
    );
  }

  if (consistent) {
    insights.push(
      `${consistent.driverName} was the most stable driver across laps, with the lowest lap-time variation at ${consistent.value.toFixed(
        2
      )}.`
    );
  }

  if (biggestGain) {
    const sign = biggestGain.value > 0 ? "+" : "";
    insights.push(
      `${biggestGain.driverName} made the biggest race progress, changing ${sign}${biggestGain.value} positions from start to finish.`
    );
  }

  if (longestStint) {
    insights.push(
      `${longestStint.driverName} completed the longest tyre phase on ${formatCompound(
        longestStint.compound
      )}, lasting ${longestStint.value} laps.`
    );
  }

  return insights;
}