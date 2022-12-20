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
import "./PageStyles.css"; 

//Storage: 
import { create as ipfsHttpClient } from "ipfs-http-client";
import { Buffer } from 'buffer';



const ViewProfile = () => {

    const { user } = useParams();
    const navigate = useNavigate();

    //User Data States:
    const [userProfile, setUserProfile] = useState({});
    const [journalzz, setJournalzz] = useState([]);  
    const [followers, setFollowers] = useState([]); 
    const [following, setFollowing] = useState([]);

    const [isFollowing, setIsFollowing] = useState(); 

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

            //Setting state
            setUserProfile(userDocSnap.data());
            setFollowers(userDocSnap.data().followers);
            setFollowing(userDocSnap.data().following);
            setJournalzz(userDocSnap.data().entries); 

            setIsFollowing(userDocSnap.data().followers.includes(getAuth().currentUser.uid));
        

            // Fetch Articles ==============================================
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

                        articleAuthorId: doc.data().articleAuthor[0],
                        articleAuthorName: doc.data().articleAuthor[1],

                        articleTitle: doc.data().articleTitle,
                        articleDesc: truncateDesc,
                        articleContent: doc.data().articleContent,
                        articleCategory: doc.data().articleCategory,
                        articlePhotoURL: doc.data().articlePhotoURL,
                
                        articleLikes: doc.data().articleLikes,
                        articleLikesNum: doc.data().articleLikes.length,

                        articleRepost: doc.data().articleRepost,
                        articleRepostNum: doc.data().articleRepost.length,

                        articleComments: doc.data().articleComments,
                        articleCommentsNum: doc.data().articleComments.length,

                        articleTimestamp: timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"}),
                    }
                )   
            })

            
            setActiveDisplay('Journalzz');  
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

                        articleAuthorId: i.data().articleAuthor[0],
                        articleAuthorName: i.data().articleAuthor[1],

                        articleTitle: i.data().articleTitle,
                        articleDesc: truncateDesc,
                        articleContent: i.data().articleContent,
                        articleCategory: i.data().articleCategory,
                        articlePhotoURL: i.data().articlePhotoURL,
                
                        articleLikes: i.data().articleLikes,
                        articleLikesNum: i.data().articleLikes.length,

                        articleRepost: i.data().articleRepost,
                        articleRepostNum: i.data().articleRepost.length, 

                        articleComments: i.data().articleComments,
                        articleCommentsNum: i.data().articleComments.length,

                        articleTimestamp: timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"}),
                    }
                )
            }
        })

        setDisplayedArticles(displayLocalArr); 
    }

    

    //Handlers: ===========================================================================================
    const handleFollow = () => {

        //Firebase function: function instance https | name of func in indexjs as a string 
        const firebaseFollowUser = httpsCallable(getFunctions(), "followUser");
        const firebaseUnfollowUser = httpsCallable(getFunctions(), "unfollowUser"); 

        if (isFollowing) {

            firebaseUnfollowUser ({
                uid: user

            }).then (val => {

                console.log(val.data);

                if (val.data != "Successfully unfollowed user") {
                    alert("An error occured while unfollowing");
                    return; 
                }

                setIsFollowing(false); 
                fetchUserData(); 
            })

            
        } else {

            firebaseFollowUser ({
                uid: user
    
            }).then (val => {

                console.log(val.data);

                if (val.data != "Successfully followed user") {
                    alert("An error occured while following");
                    return;
                }
    
                setIsFollowing(true);
                fetchUserData();
    
            }).catch (error => {
                alert("An error occured while following"); 
                console.log("Error: " + error); 
            })
        }
   
    }

    //Display: ===========================================================================================
    
    const DisplayButton = ({ onClick, children, value }) => {
        let activeQuery = activeDisplay === value;

        return (
            <button onClick = {onClick} style = {{cursor: 'pointer', backgroundColor: activeQuery ? '#f21f5f' : '#2d2d2d' }} >{children}</button>
        )
    }

    const FollowButton = ({ onClick }) => {

        const followButtonText = isFollowing ? "Unfollow" : "Follow"; 

        return (
            <button onClick = {onClick} 
                style = {{cursor: 'pointer', backgroundColor: isFollowing ? '#2d2d2d' : '#f21f5f' }}>
            {followButtonText}</button>
        )
    }

    return (
        

        <div className = "profile-wrapper">

            <div className = "profile-container">

                <img className = "profile-background-img" 
                    src = {userProfile.backgroundURL} 
                    alt = "No Background Picture Found"> 
                </img>

                <div className = "profile-info-container">

                    <div className = "profile-picture-container">
                        <img 
                            src = {userProfile.pfpURL}
                            alt = "No pfp found">
                        </img>
                    </div>
                

                    <div className = "profile-stats">
                        <h1>{userProfile.displayName}</h1>
                        <FollowButton onClick = {handleFollow}/>

                        <h2>
                            {journalzz.length} Journalzz&nbsp;&nbsp;
                            {followers.length} Followers&nbsp;&nbsp;
                            {following.length} Following
                        </h2>

                        <h3>{userProfile.bio}</h3>
                    </div>

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

                    <div className = "journalzz-item-container">

                        {displayedArticles.map((ref) => {

                            return (

                                <div className = "journalzz-item"> 

                                    <img 
                                        src = {ref.articlePhotoURL}
                                        alt = "No Photo Found"

                                        onClick = {() => {
                                            navigate('/View/' + ref.articleId);
                                        }}>
                                        
                                    </img>

                                    <h1>{ref.articleCategory} |&nbsp;
                                        {ref.articleTitle}
                                    </h1>

                                    <h2>{ref.articleDesc}</h2>

                                    <div className = "jourzalzz-item-button-container">

                                         <button onClick = {() => {

                                            if (getAuth().currentUser.uid != ref.articleAuthorId) {
                                                navigate('/ViewProfile/' + ref.articleAuthorId)
                                            }
                                        }}>{ref.articleAuthorName} 🖊</button>

                                        <button>{ref.articleLikesNum} 🤍</button>
                                        <button>{ref.articleRepostNum} ♻</button>
                                        <button>{ref.articleCommentsNum} 💬</button>
                                        <button>{ref.articleTimestamp} 🕛</button>
                                    </div>

                                </div>
                            )
                        })}
                    </div>

                </div> 
            </div>
        </div> 
    )
}

export default ViewProfile; 
