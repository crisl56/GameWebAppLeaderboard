export default function AdminScreen({ user }) {
    return (
        <div className="adminPanel">
            <p>SESSION_ADMIN: {user?.displayName || "UNNAMED_ROOT"}</p>

            <div className="admin-content">
                <section>
                    <h3>System Overview</h3>
                    <div className="stat-grid">
                        <div className="stat-item">Status: ONLINE</div>
                        <div className="stat-item">Admin Email: {user?.email}</div>
                    </div>
                </section>

                <section style={{marginTop: '20px'}}>
                    <button className="btn-debug" style={{borderColor: '#ffa502', color: '#ffa502'}}>
                        Reset Leaderboards
                    </button>
                </section>

                <section>
                    <p>Graph 1 here Graph 2 here...</p>
                    <p>Gonk beetleball</p>
                    <p>https://store.steampowered.com/app/2776270/Beetleball/</p>
                </section>
            </div>
        </div>
    );
}