//React:
import React from "react";
import { useNavigate, useParams } from "react-router-dom";  
import { useState, useRef, useEffect } from "react";

//Firebase:

import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { httpsCallable, getFunctions } from "firebase/functions"; 
import { auth, firestore } from "../firebase-config"; 
import { getFirestore, Timestamp, collection, orderBy, query, where, getDoc, doc, getDocs } from "firebase/firestore";

//CSS:
import "./ViewProfileStyles.css"; 

//Storage: 
import { create as ipfsHttpClient } from "ipfs-http-client";
import { Buffer } from 'buffer';



const ViewProfile = () => {

    const { user } = useParams();


    const navigate = useNavigate();

    //User Data States:
    const [userProfile, setUserProfile] = useState({});
    const [journalzzCount, setJournalzzCount] = useState([]);  
    const [followers, setFollowers] = useState([]); 
    const [following, setFollowing] = useState([]);
    
    
    //States for fetching all users Journalzz
    const [displayedArticles, setDisplayedArticles] = useState([]); //Array of objects
    const [activeDisplay, setActiveDisplay] = useState(); 

    useEffect (() => {

       fetchUserData();
    }, [])

    //Fetch data from firestrore user collection document
    const fetchUserData = async () => {

        const db = getFirestore(); 

        // Database | Collection | Current user
        const userDataRef = doc(db, "users", user);
        const userDocSnap = await getDoc(userDataRef);
    
        if (userDocSnap.exists()) {

            // setting state
            setUserProfile(userDocSnap.data());
            setFollowers(userDocSnap.data().followers);
            setFollowing(userDocSnap.data().following);

            // Fetch Articles ==============================================
            
            //Newest to oldest
            const entryQuery = query (
                collection(db, "articles"), 
                where("articleAuthor", "array-contains", user), 
                orderBy("articleTimestamp", "desc")
            );

        
            const entryQuerySnapshot = await getDocs(entryQuery);

            //Local array: 
            let entriesLocalArr = []; 


            entryQuerySnapshot.forEach((doc) => {

                //timestamp:
                let timestampInit = doc.data().articleTimestamp * 1000;
                let timestamp = new Date(timestampInit); 

                //truncate description string:
                let truncateDesc = doc.data().articleDesc;
                
                if (truncateDesc.length > 75) {
                    truncateDesc = truncateDesc.substring(0, 75) + '...'
                }

                entriesLocalArr.push( 
                    {
                        articleId: doc.id,

                        articleAuthor: doc.data().articleAuthor,
                        articleTitle: doc.data().articleTitle,
                        articleDesc: truncateDesc,
                        articleContent: doc.data().articleContent,
                        articleCategory: doc.data().articleCategory,
                        articlePhotoURL: doc.data().articlePhotoURL,
                
                        articleLikes: doc.data().articleLikes,
                        articleComments: doc.data().articleComments,
                        articleTimestamp: timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"}),
                    }
                )   
            })

            
            setActiveDisplay('Journalzz'); 
            setJournalzzCount(entriesLocalArr); 
            setDisplayedArticles(entriesLocalArr); 
        }   
    }



    const fetchUserRepostLikes = async (req) => {

        const db = getFirestore(); 
        let displayLocalArr = [];  
        let localPromiseArr = [];
        let requestedFetch = []; 

        if (req === 'Likes') {
            requestedFetch = userProfile.likedArticles;
            setActiveDisplay('Likes'); 

        } else if (req = 'Repost') {
            requestedFetch = userProfile.repostedArticles; 
            setActiveDisplay('Repost'); 
        }

        for (let i of requestedFetch) {
            localPromiseArr.push(getDoc(doc(db, "articles", i))); 
        }  
        
        await Promise.all(localPromiseArr)
        .then (val => {

            for (let i of val) {

                //timestamp:
                let timestampInit = i.data().articleTimestamp * 1000;
                let timestamp = new Date(timestampInit); 

                //truncate description string:
                let truncateDesc = i.data().articleDesc;
            
                if (truncateDesc.length > 75) {
                    truncateDesc = truncateDesc.substring(0, 75) + '...'
                }

                displayLocalArr.push(

                    {
                        articleId: i.id,

                        articleAuthor: i.data().articleAuthor,
                        articleTitle: i.data().articleTitle,
                        articleDesc: truncateDesc,
                        articleContent: i.data().articleContent,
                        articleCategory: i.data().articleCategory,
                        articlePhotoURL: i.data().articlePhotoURL,
                
                        articleLikes: i.data().articleLikes,
                        articleComments: i.data().articleComments,
                        articleTimestamp: timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"}),
                    }
                )
            }
        })

        setJournalzzCount(displayLocalArr); //refactor later
        setDisplayedArticles(displayLocalArr); 
    }

    //Display: ===========================================================================================
    
    const DisplayButton = ({ onClick, children, value }) => {
        let activeQuery = activeDisplay === value;

        return (
            <button onClick = {onClick} style = {{cursor: 'pointer', backgroundColor: activeQuery ? '#2d2d2d' :  '#f21f5f'}} >{children}</button>
        )
    }


    return (
        

        <div className = "profile-wrapper">

            <div className = "profile-container">

                <img className = "profile-background-img" src = {userProfile.backgroundURL} alt = "No Background Picture Found"></img>

                <div className = "profile-container-stats">
                    <img src = {userProfile.pfpURL} alt = "No PFP Found"></img>

                    <h1>{userProfile.displayName}</h1> 

                    <h2>{journalzzCount.length} Journalzz | {followers.length} Followers | {following.length} Following</h2>

                    <h3>{userProfile.bio}</h3>

                </div>

                
                <div className = "profile-journalzz-container">

                <div className = "profile-display-selection">
                        <DisplayButton value = {'Journalzz'} onClick = {() => {
                            fetchUserData();
                        }}>Journalzz 🖊</DisplayButton>

                        <DisplayButton value = {'Repost'} onClick = {(e) => {
                            fetchUserRepostLikes('Repost'); 
                        }}>Repost ♻</DisplayButton>

                        <DisplayButton value= {'Likes'} onClick = {(e) => {
                            fetchUserRepostLikes('Likes');
                        }}>Likes ❤</DisplayButton>
                    </div>

                    {displayedArticles.map((article) => {

                        return (

                            <div className = "profile-journalzz-container-dis" onClick = {() => {navigate('/View/' + article.articleId)}}>
                                
                                <img src = {article.articlePhotoURL} alt = "Thumbnail Not Found"></img>

                                <h1>{article.articleTitle}</h1>
                                <h2>{article.articleDesc}</h2>

                                <div className = "profile-journalzz-stats">
                                    <h3>{article.articleLikes.length} 🤍</h3>
                                    <h3>{article.articleComments.length} 💬</h3>
                                    <h3>{article.articleTimestamp} 🕛</h3>
                                    <h3>{article.articleCategory}</h3>
                                </div>

                            </div>   
                        ) 
                    })}

                </div>

            </div>

        </div>
        
    )
}

export default ViewProfile; 
