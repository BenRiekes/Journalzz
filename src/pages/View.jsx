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

    //Article useStates(s)
    const [articleView, setArticleView] = useState({});
    const [isVerified, setIsVerified] = useState('');
    const [articleAuthor, setArticleAuthor] = useState('');
    const [articleTimestamp, setArticleTimestamp] = useState('');  
    const [likeCount, setLikeCount] = useState('');
    const [articleComments, setArticleComments] = useState([]);  
    const [commentCount, setCommentCount] = useState(''); 

    //User action and useStates(s)
    const [comment, setComment] = useState(''); 
    const [like, setLike] = useState(false); 

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
            setArticleAuthor(docSnap.data().articleAuthor[1]);
            setLikeCount(docSnap.data().articleLikes.length);
            setCommentCount(docSnap.data().articleComments.length);
            setArticleComments(docSnap.data().articleComments); 

            //Converting unix server timestamp to date
            let timestampInit = (docSnap.data().articleTimestamp* 1000);
            let timestamp = new Date(timestampInit);

            setArticleTimestamp(timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"}));

            if (docSnap.data().articleAuthor != "JournalzzOfficial") {
                setIsVerified('Unverified');
            } else {
                setIsVerified('Verified'); 
            }


            console.log(docSnap.data()); 
        } else {
            alert("Journalzz entry does not exist"); 
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
                
                //sign in modal call maybe
                alert("An error occured while commenting");

                return; 
            }

            alert("Sucessfully Commented");

            //Reset comment state:
            setComment('');

            fetchArticleData();
        })

        .catch(error => {
            console.log("An error occured" + error); 
        })
    }

    console.log(articleComments);

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

                    <button>{articleAuthor} 🖊</button>

                    <button>{likeCount} 🤍</button>
                    <button>{commentCount} 💬</button>
                    
                    <input type = "text" placeholder = "Comment here" onChange = {(e) => setComment(e.target.value)}></input>

                    <button style = {{backgroundColor: '#2294fb', color: '#fff'}} onClick = {handleComment}>✓</button>
                </div>  


                <div className = "view-comments">

                    {articleComments.map((commentRef) => {

                        return (

                            <div className = "comment-container">  
                                <h1>{commentRef.displayName}: {commentRef.comment}</h1>    
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

