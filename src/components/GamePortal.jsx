import {useState, useEffect, useRef, useCallback} from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

import Leaderboard from "./LeaderBoard";


const GAME_URL = import.meta.env.VITE_GAME_URL || null;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || "";

export default function GamePortal({ user }) {

    const [userData, setUserData] = useState(null);
    const [gameLoaded, setGameLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("Game");

    useEffect(() => {
        const userRef = doc(db, "users", user.uid);
        // snapshot is data from userRef from the db
        // onSnapShot is a listener for the db
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            // snapshot is when something changes in the database, we trigger the callback
            // snapshot would be linked to something else

            if(snapshot.exists) {
                setUserData(snapshot.data());
            }
        });

        // we do this because of firestore
        return () => unsubscribe();
    }, [user.uid]);

    // reminder useRef is a way to persist variables when the screen re-renders
    // vue is dynamic so it automatically does it
    // react is not so you have to useRef
    const iframeRef = useRef(null);
    const retryTimer = useRef(null);
    const authAcknowledged = useRef(null);

    const sendAuthToGame = useCallback(async () => {
        if(!iframeRef.current?.contentWindow || !user || authAcknowledged.current) return;
        try{
            const idToken = await user.getIdToken();
            const payload = {
                type: "firebase-auth",
                uid: user.id,
                displayName: user.displayName || user.email || "Player",
                idToken,
                projectId: user.projectId,
            };
            iframeRef.current.contentWindow.postMessage(payload, "*");
            console.log("Auth token sent to iframe... waiting for ack");
        } catch (error) {
            console.error("Failed to send auth: ", error);
        }
    }, [user]);

    useEffect(() => {
        const handleMessage = (event) => {
            if(event.data?.type === "firebase-auth-ack") {
                console.log("Game acknowledgement successful");
                authAcknowledged.current = true;
                if (retryTimer.current) {
                    clearInterval(retryTimer.current);
                    retryTimer.current = null;
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleGameLoaded = useCallback(() => {
        setGameLoaded(true);
        authAcknowledged.current = false;
        sendAuthToGame();

        // set interval triggers
        retryTimer.current = setInterval(sendAuthToGame, 2000);

        // timeout makes a timeout
        setTimeout(() => {
            if(retryTimer.current) {
                clearInterval(retryTimer.current);
                retryTimer.current = null;
                if(!authAcknowledged.current) {
                    console.warn("Game never acknowledged auth after 30s. is the firebase manager in the scene?");
                }
            }
        }, 30000);
    }, [sendAuthToGame]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.log("Sign out error", err);
        }
    }

    return (
        <>
            <div className="game-area" style={{marginBottom:500}}>
                <iframe
                    ref={iframeRef}
                    src={GAME_URL}
                    title={"Sponder Bird"}
                    style={{height:500}}
                    className={`game-frame ${gameLoaded ? "visible" : "hidden"}`}
                    allow="fullscreen"
                    onLoad={handleGameLoaded}
                />
                <p>Warning Game window broken currently!</p>
            </div>
            <div className="portal-container">
                <p>Welcome {user.email}</p>
                <button onClick={handleSignOut} className="btn-signout">Sign Out</button>
                <Leaderboard />
            </div>


        </>
    )
}