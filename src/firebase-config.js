import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import * as firebase from "firebase/app"; 
import "firebase/auth"; 
import { getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; 

const firebaseConfig = {
    apiKey: "AIzaSyD9x0ECAKipJmrkmQITWwYJYe2rtFKGYHI",
    authDomain: "journalzz.firebaseapp.com",
    projectId: "journalzz",
    storageBucket: "journalzz.appspot.com",
    messagingSenderId: "983235998891",
    appId: "1:983235998891:web:bdc194ec6299d6879ff3ee",
    measurementId: "G-4SY11EG95Q"
};

const app = initializeApp(firebaseConfig);
 
export const auth = getAuth(app);
export const firestore = getFirestore(app); 

