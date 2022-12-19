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
import { getFirestore, Timestamp, collection, orderBy, query, where, updateDoc, getDoc, doc, QuerySnapshot, getDocs} from "firebase/firestore";

//CSS:
import "./ViewStyles.css"; 


const View = () => {

    //Article ID Ref:
    const { article } = useParams();
    const navigate = useNavigate();

    //Article useStates(s)
    const [articleView, setArticleView] = useState({});
    const [isVerified, setIsVerified] = useState('');

    const [articleAuthorId, setArticleAuthorId] = useState(''); 
    const [articleAuthor, setArticleAuthor] = useState('');

    const [articleTimestamp, setArticleTimestamp] = useState('');

    const [articleLikes, setArticleLikes] = useState([]);
    const [articleRepost, setArticleRepost] = useState([]); 
    const [articleComments, setArticleComments] = useState([]);  
    const [commentCount, setCommentCount] = useState(''); 

    //User action and useStates(s)
    const [comment, setComment] = useState('');  
    const [userLiked, setUserLiked] = useState();
    const [userReposted, setUserReposted] = useState(); 

    //Fecth data on page load
    useEffect (() => {
        fetchArticleData();
    }, [])

    

    //Fetch Article Data:
    const fetchArticleData = async () => {

        //Database ref:
        const db = getFirestore(); 

        const docRef = doc(db, "articles", article);
        const docSnap = await getDoc(docRef); 

        if (docSnap.exists()) {

            setArticleView(docSnap.data()); 

            setArticleAuthorId(docSnap.data().articleAuthor[0]);
            setArticleAuthor(docSnap.data().articleAuthor[1]);

            setArticleLikes(docSnap.data().articleLikes); 
            setArticleRepost(docSnap.data().articleRepost);
            setArticleComments(docSnap.data().articleComments); 
            setCommentCount(docSnap.data().articleComments.length);
            //Converting unix server timestamp to date =======================================
            let timestampInit = (docSnap.data().articleTimestamp* 1000);
            let timestamp = new Date(timestampInit);

            setArticleTimestamp(timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"}));

            if (docSnap.data().articleAuthor[1] != "JournalzzOfficial") {
                setIsVerified('Unverified');
            } else {
                setIsVerified('Verified'); 
            }

            //Likes: ========================================================================

            const likedStatus = docSnap.data().articleLikes.filter((o) => o.uid === getAuth().currentUser.uid);

            if (likedStatus.length >= 1) {
                setUserLiked(true);
            } else {
                setUserLiked(false);
            }

        } else {
            alert("Journalzz entry does not exist"); 
            navigate('/');
        }
    }

   


    
    //Handlers:
    const handleComment = async (e) => {
        e.preventDefault(); 

        const firebaseComment = httpsCallable(getFunctions(), "postComment"); 

        firebaseComment({
            comment: comment,
            articleId: article,
        })

        .then (val => {

            console.log(val.data);

            if (val.data != "Comment Success") {
                alert("An error occured while commenting");

                return; 
            }

            alert("Sucessfully Commented");

            //Reset comment state:
            // setComment('');
            fetchArticleData();
        })

        .catch(error => {
            console.log("An error occured" + error); 
        })
    }

    
    const handleLike = async () => {

        const firebaseLike = httpsCallable(getFunctions(), "likePost");
        const firebaseUnlike = httpsCallable(getFunctions(), "unlikePost");
        

        if (userLiked == false) {

            firebaseLike({
                articleId: article

            }).then (val => {
    
                if (val.data != "Like Success") {
                    alert("An error occured while liking, are you signed in?");
                    return;
                }
    
                setUserLiked(true);
                fetchArticleData();
            })
    
        } else {

            firebaseUnlike ({
                articleId: article

            }).then (val => {
    
                if (val.data != "Successfully unliked post") {
                    alert("An error occured while liking, are you signed in?");
                    return;
                }
    
                setUserLiked(false);
                fetchArticleData();
            })
        }  
    }

   

    const handleRepost = async () => {
        
        const firebaseRepost = httpsCallable(getFunctions(), "repost"); 


        if (!userReposted) {

            console.log("clicked");

            firebaseRepost ({
                articleId: article

            }).then (val => {

                if (val.data != "Repost Success") {
                    alert ("An error occured while reposting"); 
                    return; 
                }

                setUserReposted(true);
                alert("Successfully reposted");
                fetchArticleData(); 
            })
        }
    }


    const LikeButton = ({ onClick }) => {
        const likeCount = articleLikes.length;
        return (
            <button style = {{backgroundColor: userLiked ?  '#2d2d2d' : '#f21f5f'}} onClick = {onClick}> 🤍 {likeCount}</button>
        )       
    }

    const RepostButton = ({ onClick }) => {
        const repostCount = articleRepost.length; 

        return (
            <button style = {{backgroundColor: userReposted ?  '#2d2d2d' : '#f21f5f'}} onClick = {onClick}> ♻ {repostCount}</button>
        )    
    }

    return (

        <div className = "view-wrapper">

            <div className = "view-container">

                <div className = "view-stats">

                    <h1>{articleView.articleCategory}</h1>

                    <h1>{articleView.articleTitle}</h1>

                    <h1>{articleTimestamp}</h1>
                    <h1>{isVerified}</h1>
                </div>

                <img src = {articleView.articlePhotoURL} alt = "Article Image"></img>


                <div className = "view-stats">

                    <button onClick = {() => {

                        if (articleAuthorId == getAuth().currentUser.uid) {
                            navigate('/Profile'); 
                        } else {
                            navigate('/ViewProfile/' + articleAuthorId);
                        }
                         
                    }}>{articleAuthor} 🖊</button>

                    <LikeButton onClick = {handleLike}/>
                    <RepostButton onClick = {handleRepost}/>
                    <button>💬 {commentCount}</button>
                </div>  

                <div className = "comment-input-container">

                    <input  type = "text" placeholder = "Comment here" onChange = {(e) => setComment(e.target.value)}></input>

                    <button style = {
                        {backgroundColor: '#2294fb',
                         color: '#fff', 
                         border: 'none',
                         borderRadius: '.5rem'
                        }
                    } onClick = {handleComment}>✓</button>
                    
                </div>

                <div className = "view-comments">

                    {articleComments.map((commentRef) => {

                        //Converting unix server timestamp to date
                        let timestampInit = (commentRef.commentTimestamp* 1000);
                        let timestamp = new Date(timestampInit);

                        let commentTimestamp = timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"});

                        return (

                            <div className = "comment-bubble">

                                <img src = {commentRef.pfpURL} alt = "pfp"

                                    onClick = {() => {
                                        if (getAuth().currentUser.uid != commentRef.uid) {
                                            navigate('/ViewProfile/' + commentRef.uid);
                                        } else {
                                            navigate('/Profile');
                                        }                            
                                    }}>

                                </img>

                                <h1 style = {{fontStyle: 'italic'}}>
                                    {commentRef.displayName}:&nbsp;&nbsp;
                                    {commentRef.comment}&nbsp;&nbsp; 
                                    <span>{commentTimestamp}</span>
                                </h1>
                                
                            </div>      
                        ) 
                    })}

                </div>

                <div className = "view-main-content">

                    <h1>{articleView.articleDesc}</h1>
                    <h1>{articleView.articleContent}</h1>
                </div>

                

            </div>

        </div>

       
    )
}

export default View; 

