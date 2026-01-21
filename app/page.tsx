"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type VoteSnapshot = {
  recordedAt: string;
  votes: number;
};

type FormattedVoteSnapshot = {
  time: string;
  votes: number;
};

export default function VoteTracker() {
  const TOTAL_VOTES_NEEDED = parseInt(
    process.env.NEXT_PUBLIC_TOTAL_VOTES_NEEDED || "159",
  );
  const [currentVotes, setCurrentVotes] = useState(0);
  const [voteHistory, setVoteHistory] = useState<FormattedVoteSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVotes = async () => {
    try {
      const response = await fetch("/api/votes");
      const data = await response.json();
      setCurrentVotes(data.votes);
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data: { history: VoteSnapshot[] } = await response.json();
      const formatted = data.history.map((item) => ({
        time: new Date(item.recordedAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        votes: item.votes,
      }));
      setVoteHistory(formatted);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchVotes(), fetchHistory()]);
      setIsLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchVotes();
      fetchHistory();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min((currentVotes / TOTAL_VOTES_NEEDED) * 100, 100);
  const isWinning = currentVotes >= TOTAL_VOTES_NEEDED;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            Збір підписів за Сєню
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="order-1 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
            <div className="flex flex-col items-center">
              <Image
                src="/candidate.jpg"
                alt="Candidate"
                width={192}
                height={192}
                className="rounded-full mb-6 object-cover shadow-2xl ring-4 ring-purple-400/50"
              />
              <h2 className="text-3xl font-bold mb-2">Штанько Арсеній</h2>
              <p className="text-purple-400 text-lg mb-6">
                Кандидат на голову СР ФІОТ
              </p>

              <div className="w-full mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-2xl font-bold">{currentVotes}</span>
                  <span className="text-gray-400">
                    / {TOTAL_VOTES_NEEDED} голосів
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isWinning ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-purple-500 to-blue-500"}`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="w-full h-full bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <p className="text-center mt-2 text-lg font-semibold">
                  Зібрано {percentage.toFixed(1)}% {isWinning && "🎉"}
                </p>
              </div>

              {isWinning && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full font-bold text-xl animate-bounce">
                  🎊 ПЕРЕМОГА 🎊
                </div>
              )}

              <div className="flex justify-center">
                <a
                  href={process.env.NEXT_PUBLIC_SIGN_URL || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    relative inline-block
                    bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500
                    text-white font-bold py-4 px-10 rounded-full
                    shadow-lg shadow-purple-500/50
                    transform transition-all duration-300
                    hover:scale-105 hover:shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50
                    before:absolute before:inset-0 before:rounded-full before:bg-white/10 before:opacity-0 before:transition-opacity before:duration-300
                    hover:before:opacity-20
                  "
                >
                  Залишити підпис
                </a>
              </div>
            </div>
          </div>

          <div className="order-2 lg:row-span-2 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
            <h3 className="text-2xl lg:text-3xl font-bold mb-6 flex items-center">
              <span className="text-3xl lg:text-4xl mr-3">📋</span>
              Виборча програма
            </h3>
            <ul className="space-y-4 text-gray-300 text-base lg:text-lg">
              <li className="flex items-start">
                <span className="text-purple-400 mr-3 text-xl lg:text-2xl">
                  ✓
                </span>
                <span>
                  Легалізація виробництва, споживання та розповсюдження
                  рекреаційного канабісу (я перевірив, це слово пишеться з
                  однією «н») для немедичних цілей на території 18-ого корпусу
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3 text-xl lg:text-2xl">
                  ✓
                </span>
                <span>
                  Реабілітація усіх політичних в&apos;язнів часів режиму Михайла
                  Згуровського
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3 text-xl lg:text-2xl">
                  ✓
                </span>
                <span>
                  Створення мережі підпільних казино у 8-ому гуртожитку. Як
                  казав Томас Джефферсон: «Ми вважаємо за самоочевидні істини,
                  що всіх людей створено рівними; що Творець обдарував їх
                  певними невідбірними правами, до яких належать життя, свобода
                  і прагнення до гемблінгу»
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3 text-xl lg:text-2xl">
                  ✓
                </span>
                <span>
                  Запровадження конституційної гарантії права на володіння та
                  носіння вогнепальної зброї в цілях самозахисту
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3 text-xl lg:text-2xl">
                  ✓
                </span>
                <span>
                  Заборона реквестити на Радіо КПІ будь-які композиції крім
                  Oasis - Wonderwall, Степана Гіги, Павла Зіброва та мешапів на
                  Пса Патрона
                </span>
              </li>
              <li className="flex items-start">
                <span>
                  Обіцяю, що у разі перемоги у перший день на посаді голови СР я
                  свідомо і відповідально складу із себе повноваження з метою
                  проведення нових чесних та прозорих демократичних виборів за
                  участі міжнародних спостерігачів. Слава Україні.
                </span>
              </li>
            </ul>
          </div>

          <div className="order-3 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-center">
              Студрада ФІОТ
            </h3>
            <video
              src="/flag.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
            />
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
          <h3 className="text-2xl font-bold mb-6">Кількість голосів з часом</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
            </div>
          ) : voteHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={voteHistory}>
                <defs>
                  <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="time"
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af" }}
                  domain={[0, Math.max(currentVotes, TOTAL_VOTES_NEEDED)]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #a855f7",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="votes"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVotes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Немає даних
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
