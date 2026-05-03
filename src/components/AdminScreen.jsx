import { useState, useEffect } from 'react';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function avg(total, games) {
    return games ? Math.round(total / games) : 0;
}

export default function AdminScreen({ user }) {
    const [players, setPlayers] = useState([]);
    const [stats, setStats] = useState(null);
    const [showMock, setShowMock] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(p => p.gamesPlayed > 0)
                .sort((a, b) => b.highScore - a.highScore);

            setPlayers(data);

            // Only real players count toward global stats
            const real = data.filter(p => !p.isMock);
            let totalGames = 0, totalScore = 0, totalJumps = 0, totalClicks = 0;
            real.forEach(p => {
                totalGames  += p.gamesPlayed  ?? 0;
                totalScore  += p.totalScore   ?? 0;
                totalJumps  += p.totalJumps   ?? 0;
                totalClicks += p.totalClicks  ?? 0;
            });

            setStats({
                playerCount: real.length,
                totalGames,
                avgScore:  avg(totalScore,  totalGames),
                avgJumps:  avg(totalJumps,  totalGames),
                avgClicks: avg(totalClicks, totalGames),
            });
        });
        return () => unsubscribe();
    }, []);

    const visiblePlayers = showMock ? players : players.filter(p => !p.isMock);

    const chartData = {
        labels: visiblePlayers.slice(0, 10).map(p => p.displayName || "Anon"),
        datasets: [{
            label: "High score",
            data: visiblePlayers.slice(0, 10).map(p => p.highScore ?? 0),
            backgroundColor: "#ff475740",
            borderColor: "#ff4757",
            borderWidth: 1,
        }]
    };

    return (
        <div className="adminPanel">
            <p>SESSION_ADMIN: {user?.displayName || "UNNAMED_ROOT"}</p>

            <div className="admin-content">
                <section>
                    <h3 className="admin-section-title">System Overview</h3>
                    <div className="admin-stat-grid">
                        <div className="admin-stat-item">
                            <span className="admin-stat-label">Status</span>
                            <span className="admin-stat-value admin-stat-online">ONLINE</span>
                        </div>
                        <div className="admin-stat-item">
                            <span className="admin-stat-label">Admin</span>
                            <span className="admin-stat-value">{user?.email}</span>
                        </div>
                        <div className="admin-stat-item">
                            <span className="admin-stat-label">Players</span>
                            <span className="admin-stat-value">{stats?.playerCount ?? "..."}</span>
                        </div>
                        <div className="admin-stat-item">
                            <span className="admin-stat-label">Total games</span>
                            <span className="admin-stat-value">{stats?.totalGames ?? "..."}</span>
                        </div>
                        <div className="admin-stat-item">
                            <span className="admin-stat-label">Avg score</span>
                            <span className="admin-stat-value">{stats?.avgScore ?? "..."}</span>
                        </div>
                        <div className="admin-stat-item">
                            <span className="admin-stat-label">Avg jumps</span>
                            <span className="admin-stat-value">{stats?.avgJumps ?? "..."}</span>
                        </div>
                        <div className="admin-stat-item">
                            <span className="admin-stat-label">Avg clicks</span>
                            <span className="admin-stat-value">{stats?.avgClicks ?? "..."}</span>
                        </div>
                    </div>
                </section>

                <section className="admin-section">
                    <div className="admin-section-header">
                        <h3 className="admin-section-title">Score distribution</h3>
                        <label className="admin-toggle">
                            <input
                                type="checkbox"
                                checked={showMock}
                                onChange={() => setShowMock(prev => !prev)}
                            />
                            Show mock data
                        </label>
                    </div>
                    <div className="admin-chart-wrapper">
                        <Bar data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { ticks: { color: "#888" }, grid: { display: false } },
                                y: { beginAtZero: true, ticks: { color: "#888" }, grid: { color: "#2a2a2a" } }
                            }
                        }} />
                    </div>
                </section>

                <section className="admin-section">
                    <h3 className="admin-section-title">Player breakdown</h3>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Player</th>
                                <th>High score</th>
                                <th>Games</th>
                                <th>Avg score</th>
                                <th>Avg jumps</th>
                                <th>Avg clicks</th>
                                <th>Avg pipes</th>
                            </tr>
                            </thead>
                            <tbody>
                            {visiblePlayers.map(p => (
                                <tr key={p.id} className={p.isMock ? "admin-row-mock" : ""}>
                                    <td>
                                        {p.displayName || "Anonymous"}
                                        {p.isMock && <span className="admin-mock-tag">MOCK</span>}
                                    </td>
                                    <td>{p.highScore ?? 0}</td>
                                    <td>{p.gamesPlayed ?? 0}</td>
                                    <td>{avg(p.totalScore, p.gamesPlayed)}</td>
                                    <td>{avg(p.totalJumps, p.gamesPlayed)}</td>
                                    <td>{avg(p.totalClicks, p.gamesPlayed)}</td>
                                    <td>{avg(p.totalPipes, p.gamesPlayed)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="admin-section">
                    <button className="btn-debug">Reset Leaderboards</button>
                </section>
            </div>
        </div>
    );
}