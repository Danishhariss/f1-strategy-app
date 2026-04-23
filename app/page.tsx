"use client";

import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Flag,
  Gauge,
  ListOrdered,
  Trophy,
  Users,
} from "lucide-react";
import {
  calculateAveragePace,
  calculateConsistency,
  getDriverStints,
  buildStrategySummary,
  formatCompound,
  getFastestDriver,
  getMostConsistentDriver,
  getBiggestPositionGain,
  getPositionChangeSummary,
  buildRaceInsights,
} from "@/lib/analytics";
import StrategyTimelineChart from "../components/StrategyTimelineChart";
import PositionTrendChart from "../components/PositionTrendChart";

type Session = {
  session_key: number;
  session_name: string;
  country_name: string;
  year: number;
  date_start: string;
};

type Driver = {
  driver_number: number;
  full_name?: string;
  name_acronym?: string;
  team_name?: string;
};

type SessionData = {
  laps: Array<{
    driver_number: number;
    lap_duration?: number;
  }>;
  positions: Array<{
    driver_number: number;
    position?: number;
    date?: string;
  }>;
  stints: Array<{
    driver_number: number;
    stint_number: number;
    compound?: string;
    lap_start?: number;
    lap_end?: number;
  }>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function teamBadgeColor(teamName?: string) {
  const team = teamName?.toLowerCase() || "";

  if (team.includes("mclaren"))
    return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  if (team.includes("ferrari"))
    return "bg-red-500/15 text-red-300 border-red-500/30";
  if (team.includes("red bull"))
    return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  if (team.includes("mercedes"))
    return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
  if (team.includes("aston"))
    return "bg-green-500/15 text-green-300 border-green-500/30";
  if (team.includes("alpine"))
    return "bg-pink-500/15 text-pink-300 border-pink-500/30";
  if (team.includes("williams"))
    return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  if (team.includes("audi"))
    return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
  if (team.includes("cadillac"))
    return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";

  return "bg-zinc-700/30 text-zinc-300 border-zinc-600";
}

export default function Home() {
  const [year, setYear] = useState("2023");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const [loading, setLoading] = useState(false);
  const [driverLoading, setDriverLoading] = useState(false);
  const [sessionDataLoading, setSessionDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedSessionType, setSelectedSessionType] = useState("");

  const driverSectionRef = useRef<HTMLElement | null>(null);

  const fetchSessions = async () => {
    try {
      setHasSearched(true);
      setLoading(true);
      setError("");
      setSessions([]);
      setDrivers([]);
      setSelectedSession(null);
      setSelectedDrivers([]);
      setSessionData(null);
      setSelectedCountry("");
      setSelectedSessionType("");

      const res = await fetch(`/api/sessions?year=${year}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch sessions");
      }

      setSessions(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load sessions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async (session: Session) => {
    try {
      setDriverLoading(true);
      setError("");
      setSelectedSession(session);
      setSelectedDrivers([]);
      setSessionData(null);
      setDrivers([]);

      const res = await fetch(`/api/drivers?session_key=${session.session_key}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch drivers");
      }

      setDrivers(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load drivers.");
    } finally {
      setDriverLoading(false);
    }
  };

  const fetchSessionData = async (sessionKey: number) => {
    try {
      setSessionDataLoading(true);
      setError("");

      const res = await fetch(`/api/session-data?session_key=${sessionKey}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch session data");
      }

      setSessionData(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Could not load session data."
      );
      setSessionData(null);
    } finally {
      setSessionDataLoading(false);
    }
  };

  const handleDriverToggle = async (driverNumber: string) => {
    const isSelected = selectedDrivers.includes(driverNumber);

    let updated: string[];
    if (isSelected) {
      updated = selectedDrivers.filter((d) => d !== driverNumber);
    } else {
      if (selectedDrivers.length >= 3) return;
      updated = [...selectedDrivers, driverNumber];
    }

    setSelectedDrivers(updated);

    if (selectedSession && updated.length > 0) {
      await fetchSessionData(selectedSession.session_key);
    } else {
      setSessionData(null);
    }
  };

  const countries = useMemo(() => {
    return [...new Set(sessions.map((s) => s.country_name))].sort();
  }, [sessions]);

  const sessionTypes = useMemo(() => {
    const filteredByCountry = selectedCountry
      ? sessions.filter((s) => s.country_name === selectedCountry)
      : sessions;

    return [...new Set(filteredByCountry.map((s) => s.session_name))].sort();
  }, [sessions, selectedCountry]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchCountry = selectedCountry
        ? session.country_name === selectedCountry
        : true;

      const matchSessionType = selectedSessionType
        ? session.session_name === selectedSessionType
        : true;

      return matchCountry && matchSessionType;
    });
  }, [sessions, selectedCountry, selectedSessionType]);

  const selectedDriverObjects = useMemo(() => {
    return drivers.filter((d) =>
      selectedDrivers.includes(String(d.driver_number))
    );
  }, [drivers, selectedDrivers]);

  const fastestDriver =
    sessionData && drivers.length > 0
      ? getFastestDriver(sessionData.laps, drivers)
      : null;

  const mostConsistentDriver =
    sessionData && drivers.length > 0
      ? getMostConsistentDriver(sessionData.laps, drivers)
      : null;

  const biggestPositionGain =
    sessionData && drivers.length > 0
      ? getBiggestPositionGain(sessionData.positions, drivers)
      : null;

  const positionChangeSummary =
    sessionData && drivers.length > 0
      ? getPositionChangeSummary(sessionData.positions, drivers)
      : [];

  const raceInsights =
    sessionData && drivers.length > 0
      ? buildRaceInsights({
          laps: sessionData.laps,
          positions: sessionData.positions,
          stints: sessionData.stints,
          drivers,
        })
      : [];

  const comparisonCards =
    sessionData && selectedDriverObjects.length > 0
      ? selectedDriverObjects.map((driver) => {
          const driverName =
            driver.full_name ||
            driver.name_acronym ||
            `Driver #${driver.driver_number}`;

          return {
            driverNumber: driver.driver_number,
            driverName,
            teamName: driver.team_name,
            averagePace: calculateAveragePace(
              sessionData.laps,
              driver.driver_number
            ),
            consistency: calculateConsistency(
              sessionData.laps,
              driver.driver_number
            ),
          };
        })
      : [];

  const comparisonStints =
    sessionData && selectedDriverObjects.length > 0
      ? selectedDriverObjects.flatMap((driver) => {
          const driverName =
            driver.full_name ||
            driver.name_acronym ||
            `Driver #${driver.driver_number}`;

          return getDriverStints(sessionData.stints, driver.driver_number).map(
            (stint) => ({
              ...stint,
              driverName,
            })
          );
        })
      : [];

  const comparisonDriversForChart = selectedDriverObjects.map((driver) => ({
    driverNumber: driver.driver_number,
    driverName:
      driver.full_name ||
      driver.name_acronym ||
      `Driver #${driver.driver_number}`,
  }));

  const selectedStrategies =
    sessionData && selectedDriverObjects.length > 0
      ? selectedDriverObjects.map((driver) => {
          const driverName =
            driver.full_name ||
            driver.name_acronym ||
            `Driver #${driver.driver_number}`;

          const tyrePhases = getDriverStints(
            sessionData.stints,
            driver.driver_number
          );
          const summary = buildStrategySummary(
            sessionData.stints,
            driver.driver_number,
            driverName
          );

          return {
            driverName,
            teamName: driver.team_name,
            tyrePhases,
            summary,
          };
        })
      : [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <section className="mb-10 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Formula 1 Dashboard
            </p>

            <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl">
              <BarChart3 className="text-red-500" size={36} />
              F1 Strategy Analytics
            </h1>

            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
              <span>Created by</span>
              <a
                href="https://linkedin.com/in/your-link"
                target="_blank"
                className="font-semibold bg-gradient-to-r from-red-500 via-red-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(239,68,68,0.6)] transition hover:brightness-125"
              >
                Danish Aiman
              </a>
            </div>

            <p className="mt-4 text-base text-zinc-400 sm:text-lg">
              Explore Formula 1 sessions, compare drivers, and understand race
              strategy through pace, stability, tyre usage, and position trends.
            </p>
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="mb-5">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <CalendarDays className="text-zinc-300" size={20} />
              1. Choose a race weekend
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Start by selecting a year, then narrow down the session you want
              to analyze.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full md:w-48">
              <label className="mb-2 block text-sm text-zinc-400">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-white"
                placeholder="Enter year"
              />
            </div>

            <button
              onClick={fetchSessions}
              className="rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
            >
              Load Sessions
            </button>
          </div>

          {loading && <p className="mt-4 text-sm text-zinc-400">Loading sessions...</p>}
          {error && sessions.length > 0 && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          {sessions.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Country
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedSessionType("");
                      setSelectedSession(null);
                      setDrivers([]);
                      setSelectedDrivers([]);
                      setSessionData(null);
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-white"
                  >
                    <option value="">All Countries</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">
                    Session Type
                  </label>
                  <select
                    value={selectedSessionType}
                    onChange={(e) => {
                      setSelectedSessionType(e.target.value);
                      setSelectedSession(null);
                      setDrivers([]);
                      setSelectedDrivers([]);
                      setSessionData(null);
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-white"
                  >
                    <option value="">All Session Types</option>
                    {sessionTypes.map((sessionType) => (
                      <option key={sessionType} value={sessionType}>
                        {sessionType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  Showing {filteredSessions.length} session
                  {filteredSessions.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-4">
                {filteredSessions.map((session) => {
                  const isSelected =
                    selectedSession?.session_key === session.session_key;

                  return (
                    <button
                      key={session.session_key}
                      onClick={async () => {
                        await fetchDrivers(session);

                        setTimeout(() => {
                          driverSectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }, 200);
                      }}
                      className={`w-full rounded-2xl border p-5 text-left transition ${
                        isSelected
                          ? "border-white bg-zinc-800 shadow-lg"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">
                            {session.session_name}
                          </h3>
                          <p className="mt-1 text-zinc-400">
                            {session.country_name} • {session.year}
                          </p>
                        </div>
                        <div className="text-sm text-zinc-500">
                          Start: {formatDate(session.date_start)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasSearched && sessions.length === 0 && !loading && (
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              {Number(year) < 2023 ? (
                <>
                  <p className="text-lg font-medium text-white">
                    No data available
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Formula 1 data is only available from 2023 onwards.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-white">
                    No sessions found
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    This season may not have data yet. Try another year.
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        {driverLoading && (
          <p className="mb-6 text-sm text-zinc-400">Loading drivers...</p>
        )}

        {selectedSession && drivers.length > 0 && (
          <section
            ref={driverSectionRef}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6"
          >
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <Users className="text-zinc-300" size={22} />
                2. Compare drivers
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Choose up to 3 drivers to compare race pace, tyre usage, and
                position change.
              </p>
            </div>

            <div className="mb-6 rounded-2xl border border-zinc-800 bg-black/50 p-5">
              <p className="text-sm uppercase tracking-wide text-zinc-500">
                Selected Session
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                {selectedSession.session_name}
              </h3>
              <p className="mt-1 text-zinc-400">
                {selectedSession.country_name} • {selectedSession.year}
              </p>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Selected: {selectedDrivers.length}/3 drivers
              </p>
              <p className="text-xs text-zinc-500">
                Pick up to three drivers for a clean comparison
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {drivers.map((driver) => {
                const driverName =
                  driver.full_name ||
                  driver.name_acronym ||
                  `Driver #${driver.driver_number}`;
                const isChecked = selectedDrivers.includes(
                  String(driver.driver_number)
                );

                return (
                  <label
                    key={driver.driver_number}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-4 transition ${
                      isChecked
                        ? "border-white bg-zinc-800"
                        : "border-zinc-700 bg-black hover:border-zinc-500"
                    } ${!isChecked && selectedDrivers.length >= 3 ? "opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        handleDriverToggle(String(driver.driver_number))
                      }
                      disabled={!isChecked && selectedDrivers.length >= 3}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {driverName}
                      </p>
                      {driver.team_name && (
                        <span
                          className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs ${teamBadgeColor(
                            driver.team_name
                          )}`}
                        >
                          {driver.team_name}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {sessionDataLoading && (
              <p className="mt-6 text-sm text-zinc-400">
                Loading comparison insights...
              </p>
            )}

            {sessionData && selectedDrivers.length > 0 && !sessionDataLoading && (
              <div className="mt-8 space-y-8">
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Trophy className="text-zinc-300" size={20} />
                    Session Highlights
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                      <p className="text-sm text-zinc-400">Fastest Pace</p>
                      <p className="mt-3 text-xl font-semibold">
                        {fastestDriver ? fastestDriver.driverName : "N/A"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {fastestDriver ? `${fastestDriver.value.toFixed(2)} s` : ""}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                      <p className="text-sm text-zinc-400">Most Consistent</p>
                      <p className="mt-3 text-xl font-semibold">
                        {mostConsistentDriver
                          ? mostConsistentDriver.driverName
                          : "N/A"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {mostConsistentDriver
                          ? mostConsistentDriver.value.toFixed(2)
                          : ""}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                      <p className="text-sm text-zinc-400">Biggest Position Gain</p>
                      <p className="mt-3 text-xl font-semibold">
                        {biggestPositionGain
                          ? biggestPositionGain.driverName
                          : "N/A"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {biggestPositionGain
                          ? `${biggestPositionGain.value > 0 ? "+" : ""}${biggestPositionGain.value}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {raceInsights.length > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                      <Flag className="text-zinc-300" size={20} />
                      Race Insights
                    </h3>

                    <div className="space-y-3">
                      {raceInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300"
                        >
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {positionChangeSummary.length > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-xl font-semibold">
                        <ListOrdered className="text-zinc-300" size={20} />
                        Position Change Summary
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Sorted by starting grid position
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {positionChangeSummary.map((item) => (
                        <div
                          key={item.driverNumber}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">
                                P{item.startPosition} • {item.driverName}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                Start P{item.startPosition} → Finish P{item.endPosition}
                              </p>
                            </div>

                            <div
                              className={`rounded-full px-3 py-1 text-sm font-medium ${
                                item.positionsGained > 0
                                  ? "bg-green-500/15 text-green-400"
                                  : item.positionsGained < 0
                                  ? "bg-red-500/15 text-red-400"
                                  : "bg-zinc-700/40 text-zinc-300"
                              }`}
                            >
                              {item.positionsGained > 0 ? "+" : ""}
                              {item.positionsGained}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Gauge className="text-zinc-300" size={20} />
                    Driver Comparison
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {comparisonCards.map((card) => (
                      <div
                        key={card.driverNumber}
                        className="rounded-2xl border border-zinc-800 bg-black p-5"
                      >
                        <h4 className="text-lg font-semibold">{card.driverName}</h4>
                        {card.teamName && (
                          <span
                            className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs ${teamBadgeColor(
                              card.teamName
                            )}`}
                          >
                            {card.teamName}
                          </span>
                        )}

                        <div className="mt-5 space-y-3">
                          <div>
                            <p className="text-sm text-zinc-400">Average Pace</p>
                            <p className="mt-1 text-lg font-medium text-white">
                              {card.averagePace != null
                                ? `${card.averagePace.toFixed(2)} s`
                                : "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-zinc-400">
                              Lap-to-Lap Stability
                            </p>
                            <p className="mt-1 text-lg font-medium text-white">
                              {card.consistency != null
                                ? card.consistency.toFixed(2)
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                  <h3 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                    <CalendarDays className="text-zinc-300" size={20} />
                    Race Tyre Strategy
                  </h3>

                  <div className="space-y-5">
                    {selectedStrategies.map((strategy) => (
                      <div
                        key={strategy.driverName}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                      >
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-semibold text-white">
                            {strategy.driverName}
                          </h4>
                          {strategy.teamName && (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${teamBadgeColor(
                                strategy.teamName
                              )}`}
                            >
                              {strategy.teamName}
                            </span>
                          )}
                        </div>

                        {strategy.tyrePhases.length > 0 ? (
                          <>
                            <div className="space-y-3">
                              {strategy.tyrePhases.map((stint) => (
                                <div
                                  key={`${strategy.driverName}-${stint.stint_number}`}
                                  className="rounded-xl border border-zinc-800 bg-black p-4"
                                >
                                  <p className="font-medium text-white">
                                    Tyre Phase {stint.stint_number}:{" "}
                                    {formatCompound(stint.compound)}
                                  </p>
                                  <p className="mt-1 text-sm text-zinc-400">
                                    Laps {stint.lap_start}–{stint.lap_end} •{" "}
                                    {stint.stint_length ?? "N/A"} laps
                                  </p>
                                </div>
                              ))}
                            </div>

                            <p className="mt-4 text-sm text-zinc-300">
                              {strategy.summary}
                            </p>
                          </>
                        ) : (
                          <p className="text-zinc-400">
                            No tyre strategy data available.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-zinc-500">
                    Each tyre phase shows how long the driver stayed on a
                    specific tyre before switching.
                  </p>
                </div>

                {comparisonStints.length > 0 && (
                  <StrategyTimelineChart stints={comparisonStints} />
                )}

                {sessionData.positions.length > 0 &&
                  comparisonDriversForChart.length > 0 && (
                    <PositionTrendChart
                      drivers={comparisonDriversForChart}
                      positions={sessionData.positions}
                    />
                  )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}