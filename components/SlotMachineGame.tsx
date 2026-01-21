import { useState, useEffect, useRef } from "react";

type RollStats = {
  availableRolls: number;
  rollsMade: number;
  rollsBonuses: number;
  totalVotes: number;
  votesPerRoll: number;
};

type Symbol = {
  name: string;
  emoji: string;
  position: number;
};

type RollResult = {
  positions: number[];
  symbols: Symbol[];
  bonusWon: number;
  resultHash: string;
  rollsMade: number;
  rollsBonuses: number;
  availableRolls: number;
};

type Particle = {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
};

const SYMBOLS = [
  { name: "cherry", emoji: "🍒", color: "from-red-500 to-pink-500" },
  { name: "lemon", emoji: "🍋", color: "from-yellow-400 to-yellow-600" },
  { name: "orange", emoji: "🍊", color: "from-orange-400 to-orange-600" },
  { name: "plum", emoji: "🍇", color: "from-purple-400 to-purple-600" },
  { name: "watermelon", emoji: "🍉", color: "from-green-400 to-red-500" },
  { name: "seven", emoji: "7️⃣", color: "from-blue-400 to-blue-600" },
];

function Reel({
  targetIndex,
  isSpinning,
  reelIndex,
}: {
  targetIndex: number;
  isSpinning: boolean;
  reelIndex: number;
}) {
  const [displayIndices, setDisplayIndices] = useState([0, 1, 2]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSpinning) {
      let counter = 0;
      const spinDuration = 2000 + reelIndex * 300;
      const spinSpeed = 50;

      intervalRef.current = window.setInterval(() => {
        setDisplayIndices((prev) => {
          const middle = (prev[1] + 1) % SYMBOLS.length;
          const top = (middle - 1 + SYMBOLS.length) % SYMBOLS.length;
          const bottom = (middle + 1) % SYMBOLS.length;
          return [top, middle, bottom];
        });

        counter += spinSpeed;
        if (counter >= spinDuration) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          const top = (targetIndex - 1 + SYMBOLS.length) % SYMBOLS.length;
          const bottom = (targetIndex + 1) % SYMBOLS.length;
          setDisplayIndices([top, targetIndex, bottom]);
        }
      }, spinSpeed);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      const top = (targetIndex - 1 + SYMBOLS.length) % SYMBOLS.length;
      const bottom = (targetIndex + 1) % SYMBOLS.length;
      setTimeout(() => {
        setDisplayIndices([top, targetIndex, bottom]);
      }, 0);
    }
  }, [isSpinning, targetIndex, reelIndex]);

  return (
    <div className="reel-container relative w-28 overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-4 border-purple-500/30 shadow-2xl">
      <div className="flex flex-col">
        {displayIndices.map((symbolIndex, position) => (
          <div
            key={position}
            className={`flex items-center justify-center h-[120px] text-5xl sm:text-7xl ${
              position === 1 ? "relative z-10" : "opacity-40"
            }`}
          >
            <div
              className={`transform transition-transform ${position === 1 && !isSpinning ? "scale-110" : "scale-100"}`}
            >
              {SYMBOLS[symbolIndex].emoji}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-[120px] left-0 right-0 h-[120px] pointer-events-none">
        <div className="absolute inset-0 border-t-2 border-b-2 border-yellow-400/50"></div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-gray-900 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
    </div>
  );
}

function Particles({ show }: { show: boolean }) {
  const [particles] = useState<Particle[]>(() =>
    [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 0.5}s`,
      animationDuration: `${1 + Math.random()}s`,
    })),
  );

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-particle"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}
    </div>
  );
}

export default function SlotMachineGame() {
  const [stats, setStats] = useState<RollStats | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPositions, setTargetPositions] = useState<number[]>([0, 0, 0]);
  const [message, setMessage] = useState("");
  const [showWin, setShowWin] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const fetchStatsAsync = async () => {
      try {
        const response = await fetch("/api/rolls/stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStatsAsync();
  }, []);

  const handleRoll = async () => {
    if (!stats || stats.availableRolls <= 0 || isSpinning) return;

    setMessage("");
    setShowWin(false);
    setShowParticles(false);
    setIsSpinning(true);

    try {
      const response = await fetch("/api/rolls/roll", {
        method: "POST",
      });

      if (response.ok) {
        const data: RollResult = await response.json();

        setTargetPositions(data.positions);
        setTimeout(() => {
          setIsSpinning(false);

          setStats({
            availableRolls: data.availableRolls,
            rollsMade: data.rollsMade,
            rollsBonuses: data.rollsBonuses,
            totalVotes: stats.totalVotes,
            votesPerRoll: stats.votesPerRoll,
          });

          if (data.bonusWon > 0) {
            setMessage(`🎉 Виграш! +${data.bonusWon} бонусних спінів!`);
            setShowWin(true);
            setShowParticles(true);

            setTimeout(() => setShowParticles(false), 2000);
          }
        }, 3000);
      } else {
        const data: { error?: string } = await response.json();
        setIsSpinning(false);
        setMessage(data.error || "Помилка при обертанні");
      }
    } catch (error) {
      console.error("Error rolling:", error);
      setIsSpinning(false);
      setMessage("Помилка при обертанні");
    }
  };

  return (
    <div className="relative bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl overflow-hidden">
      <Particles show={showParticles} />

      <div className="relative z-10">
        <h3 className="text-3xl font-bold mb-6 text-center flex items-center justify-center">
          <span className="text-4xl mr-3 animate-pulse">🎰</span>
          <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Слот машина
          </span>
        </h3>

        <div className="text-center mb-6">
          {stats && (
            <div className="space-y-2">
              <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full">
                <p className="text-2xl font-bold">
                  Доступно спінів:{" "}
                  <span className="text-yellow-300">
                    {stats.availableRolls}
                  </span>
                </p>
              </div>
              <div className="flex justify-center gap-4 text-sm text-gray-400">
                <span>Зроблено: {stats.rollsMade}</span>
                <span>•</span>
                <span>Виграно: {stats.rollsBonuses}</span>
              </div>
              <p className="text-xs text-gray-500">
                Кожні {stats.votesPerRoll} голоси = 1 спін для всіх
              </p>
            </div>
          )}
        </div>

        <div className="relative mb-6">
          <div className="relative bg-gradient-to-br from-gray-800 via-purple-900/30 to-gray-800 p-6 rounded-3xl shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl"></div>

            <div className="relative flex justify-center gap-4">
              {[0, 1, 2].map((index) => (
                <Reel
                  key={index}
                  targetIndex={targetPositions[index]}
                  isSpinning={isSpinning}
                  reelIndex={index}
                />
              ))}
            </div>

            {isSpinning && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-yellow-500/20 rounded-3xl animate-pulse pointer-events-none"></div>
            )}
          </div>

          {showWin && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-6xl font-bold text-yellow-400 animate-bounce drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">
                WIN!
              </div>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`text-center mb-4 p-4 rounded-xl font-bold text-lg transition-all ${
              message.includes("Виграш")
                ? "bg-gradient-to-r from-yellow-500/20 to-green-500/20 text-yellow-300 border-2 border-yellow-400/50 animate-pulse"
                : "bg-gray-700/50 text-gray-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleRoll}
            disabled={!stats || stats.availableRolls <= 0 || isSpinning}
            className={`
              group relative px-12 py-4 rounded-full font-bold text-xl
              transition-all duration-300 transform
              ${
                stats && stats.availableRolls > 0 && !isSpinning
                  ? "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50 cursor-pointer animate-pulse"
                  : "bg-gray-600 cursor-not-allowed opacity-50"
              }
            `}
          >
            <span className="relative z-10">
              {isSpinning ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin">🎰</span>
                  Крутиться...
                </span>
              ) : (
                "КРУТИТИ!"
              )}
            </span>
            {stats && stats.availableRolls > 0 && !isSpinning && (
              <div className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors"></div>
            )}
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-purple-500/20">
          <h4 className="text-center text-lg font-bold mb-3 text-purple-300">
            Таблиця виграшів
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm sm:text-base">
            {[
              { combo: "🍒🍒🍒", bonus: 5 },
              { combo: "🍋🍋🍋", bonus: 10 },
              { combo: "🍊🍊🍊", bonus: 20 },
              { combo: "🍇🍇🍇", bonus: 50 },
              { combo: "7️⃣7️⃣7️⃣", bonus: 100 },
            ].map((prize, i, arr) => {
              const isLastAndOdd = i === arr.length - 1 && arr.length % 2 !== 0;

              return (
                <div
                  key={i}
                  className={`flex flex-col sm:flex-row sm:justify-center sm:items-center bg-gray-800/50 px-4 py-3 rounded-lg transition ${
                    isLastAndOdd ? "col-span-2" : ""
                  }`}
                >
                  <span className="text-2xl sm:text-3xl mr-0 sm:mr-4 text-center sm:text-left">
                    {prize.combo}
                  </span>
                  <span className="mt-1 sm:mt-0 text-yellow-400 font-bold text-lg sm:text-xl text-center sm:text-left">
                    +{prize.bonus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes particle {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }
        .animate-particle {
          animation: particle linear forwards;
        }
      `}</style>
    </div>
  );
}
