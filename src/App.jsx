import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import LoginForm from "./components/LoginForm";
import GamePortal from "./components/GamePortal";

import Leaderboard from "./components/LeaderBoard.jsx";

import AdminScreen from "./components/AdminScreen.jsx";


const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

async function createUserProfileIfNeeded(firebaseUser) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists) {
        await setDoc(userRef, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "Player",
            photoURL: firebaseUser.photoURL || null,
            createdAt: serverTimestamp(),
            highscore: 0,
            gamesplayed: 0
        })
        console.log(`User ${firebaseUser.email} created`);
    }
}

export default function App() {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminPanel, setAdminPanel] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await createUserProfileIfNeeded(firebaseUser);
                setUser(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        })

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div>
                <p>Checking auth state...</p>
            </div>
        )
    }

    if(adminPanel) {
        return(
            <div>
                <AdminScreen user={user}/>
                <button className="btn-debug" onClick={() => setAdminPanel(!adminPanel)}>Return</button>
            </div>
       )
    }


    return (
        <div className="app">
            {user?.email === ADMIN_EMAIL &&
                <div>
                    <button className="btn-debug" onClick={() => setAdminPanel(!adminPanel)}>Show Admin Panel</button>
                </div>
            }

            {user ? <GamePortal user={user} /> : <LoginForm />}
        </div>
    )

}