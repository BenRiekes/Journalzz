//React:
import React from "react";
import { useNavigate } from "react-router-dom";  
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



const Profile = () => {

    //User Data States:
    const [userProfile, setUserProfile] = useState({});
    const [journalzzCount, setJournalzzCount] = useState([]); 
    const [followers, setFollowers] = useState([]); 
    const [following, setFollowing] = useState([]);
    

    //Firestore Doc: 
    const [articleTitle, setArticleTitle] = useState('');
    const [articleDesc, setArticleDesc] = useState('');
    const [articleContent, setArticleContent] = useState(''); 
    const [articlePhotoURL, setArticlePhotoURL] = useState('');
    const [articleCategory, setArticleCategory] = useState('');
      

    //States for fetching all users Journalzz
    const [displayedArticles, setDisplayedArticles] = useState([]); //Array of objects
    const [activeDisplay, setActiveDisplay] = useState(); 
    

    //Storage:
    const projectId = "2IisDbV2nQeFtUCa0ps08XplVOm";
    const projectSecret = "f631a21c7ffa72d45fda18a943ac1ab7";
    const authorization = `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString('base64')}`;
    
    //Nav:
    const navigate = useNavigate(); 

    //Fecth data on page load
    useEffect (() => {

        const auth = getAuth();

        if (!auth.currentUser) {
            navigate("/"); 
        }

        fetchUserData();
    }, [])

    //Fetches: ===========================================================================================================

    //Fetch data from firestrore user collection document
    const fetchUserData = async () => {

        const db = getFirestore(); 

        if (getAuth().currentUser === undefined) {
            console.log("User is not logged in");
            return;
        }
        
        // Check if getAuth().currentUser is not undefined before accessing its uid property
        if (getAuth().currentUser) {

            // Database | Collection | Current user
            const userDataRef = doc(db, "users", getAuth().currentUser.uid);
            const userDocSnap = await getDoc(userDataRef);
        
            if (userDocSnap.exists()) {
        
              //Setting state
              setUserProfile(userDocSnap.data());
              setFollowers(userDocSnap.data().followers);
              setFollowing(userDocSnap.data().following);
              

                //Fetch Articles ==============================================
                
                const entryQuery = query (
                    collection(db, "articles"), 
                    where("articleAuthor", "array-contains", getAuth().currentUser.uid), orderBy("articleTimestamp", "desc")
                );

                const entryQuerySnapshot = await getDocs(entryQuery);

                //Local array: 
                let displayLocalArr = []; 

                entryQuerySnapshot.forEach((doc) => {

                    //timestamp:
                    let timestampInit = doc.data().articleTimestamp * 1000;
                    let timestamp = new Date(timestampInit); 

                    //truncate description string:
                    let truncateDesc = doc.data().articleDesc;
                    
                    if (truncateDesc.length > 75) {
                        truncateDesc = truncateDesc.substring(0, 75) + '...'
                    }

                    displayLocalArr.push( 
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

                setJournalzzCount(displayLocalArr);
                setActiveDisplay('Journalzz'); 
                setDisplayedArticles(displayLocalArr); 

            } else {
                alert("User does not exist");
            }
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

        setDisplayedArticles(displayLocalArr); 
    }


    //Image Storage ===================================================================================================

    const client = ipfsHttpClient ({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: authorization,
        },
    });

    //Upload To Storage:
    const uploadPhotoURLToIPFS = async (e) => {

        //Decodes fake path to real path:
        var file = e.target.files[0]
        let reader = new FileReader()

        reader.readAsDataURL(file)

        reader.onload = () => {
            file = reader.result;   
        };

        reader.onerror = function (error) {
            console.log('Error: ', error);
        }
        
        const subdomain = 'https://journalzz.infura-ipfs.io';
        
        try {
            const added = await client.add({ content: file});
            const URL = `${subdomain}/ipfs/${added.path}`; 

            console.log(URL); 
            setArticlePhotoURL(URL);

            return URL; 

        } catch (error) {
            console.log("Error Uploading Files TO IPFS"); 
        }
    }

    //Handlers: =========================================================================================================

    //Category Handler:
    const handleCategory = (e) => {
        e.preventDefault(); 
        
        e.target.value && setArticleCategory(e.target.value); 
    }

    //Post Handler:
    const handlePost = async (e) => {
        e.preventDefault();

        //Firebase function: function instance https | name of func in indexjs as a string 
        const firebaseJournalzz = httpsCallable(getFunctions(), "postJournalzz");

        //passing in const from index.js | match global useState(s)
        firebaseJournalzz({
            title: articleTitle,
            desc: articleDesc,
            content: articleContent,
            photo: articlePhotoURL,
            category: articleCategory,
        })

        .then(val => {

            console.log(val.data.result);
            
            if (val.data.result != "Post Success") {
                alert("An error occured while posting")
            }

            //Reset form:
            setArticleTitle('');
            setArticleDesc('');
            setArticleContent('');
            setArticlePhotoURL('');
            setArticleCategory('');

            fetchUserData(); 
            
            alert("Successfully Posted!"); 
        })

        .catch(error => {
            console.log("An error occured: " + error)
        })

    }

    //Display: =========================================================================================================


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

                <div className = "post-container">
                    <h1>New Journalzz Entry</h1>

                    <form>

                        <input type = "text" placeholder = "Title"
                            onChange = {(e) => setArticleTitle(e.target.value)} required>
                        </input>

                        <input  type = "text" placeholder = "Description"
                            onChange = {(e) => setArticleDesc(e.target.value)} required>
                        </input>

                        <input  type = "text" placeholder = "Contents" style = {{ height: 100}}
                            onChange = {(e) => setArticleContent(e.target.value)} required>
                        </input>

                        <input type = "file" accept = "image/png, image/jpeg" placeholder = "select profile picture" 
                            onChange = {(e) => uploadPhotoURLToIPFS(e)} required>
                        </input>

                        <div>
                            
                            <button value = {"Business"} onClick = {handleCategory}>Business</button>
                            <button value = {"Politics"} onClick = {handleCategory}>Politics</button>
                            <button value = {"Economy"} onClick = {handleCategory}>Economy</button>
                            <button value = {"Climate"} onClick = {handleCategory}>Climate</button>

                            <button value = {"Sports"} onClick = {handleCategory}>Sports</button>
                            <button value = {"Race"} onClick = {handleCategory}>Race</button>
                            <button value = {"Food"} onClick = {handleCategory}>Food</button>
                            <button value = {"Other"} onClick = {handleCategory}>Other</button>
                        </div>

                        <button onClick = {handlePost}>Post</button>
                    </form>

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

export default Profile; 


