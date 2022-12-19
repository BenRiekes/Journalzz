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
import { getFirestore, Timestamp, collection, orderBy, query, where, limit, updateDoc, getDoc, doc, QuerySnapshot, getDocs} from "firebase/firestore";

//CSS: 
import "./CommunityStyles.css";

const News = () => {

    //Filter:
    const [commFilter, setCommFilter] = useState(['Business', 'Politics', 'Economy', 'Climate', 'Sports', 'Race', 'Food', 'Other']);
    const [commComparison, setCommComparison] = useState('in');
    const [communityNews, setCommunityNews] = useState([]);
    const colorFilters = ['Business', 'Politics', 'Economy', 'Climate', 'Sports', 'Race', 'Food', 'Other']; 

    //Search:
    const [search, setSearch] = useState(''); 
    
    const unverifiedString = 'Unverified';
    
    useEffect(() => {
        fetchCommunityNews();

    }, [])
    
    //Nav:
    const navigate = useNavigate(); 
    
    const fetchCommunityNews = async () => {
        const db = getFirestore();

        const commNewsQuery = query(
            collection(db, "articles"),

            where("articleAuthor", "!=", "JournalzzOfficial"),
            orderBy("articleAuthor", "desc"),

            where("articleCategory", commComparison, commFilter),
            orderBy("articleTimestamp", "desc"),   
        );
        const commNewsSnapshot = await getDocs(commNewsQuery);

        let commNewsLocal = []; 

        commNewsSnapshot.forEach((doc) => {

            //timestamp:
            let timestampInit = doc.data().articleTimestamp * 1000;
            let timestamp = new Date(timestampInit); 

            //truncate description string:
            let truncateDesc = doc.data().articleDesc;
            
            if (truncateDesc.length > 75) {
                truncateDesc = truncateDesc.substring(0, 75) + '...'
            }

            console.log(doc.data().articleRepost);
            commNewsLocal.push(

                {
                    articleId: doc.id,

                    articleAuthorId: doc.data().articleAuthor[0],
                    articleAuthor: doc.data().articleAuthor[1],
                    articleTitle: doc.data().articleTitle,
                    articleDesc: truncateDesc,
                    articleContent: doc.data().articleContent,
                    articleCategory: doc.data().articleCategory,
                    articlePhotoURL: doc.data().articlePhotoURL,
            
                    articleLikes: doc.data().articleLikes,
                    articleRepost: doc.data().articleRepost,
                    articleComments: doc.data().articleComments,
                    articleTimestamp: timestamp.toLocaleString("en-US", {month: "numeric", day: "numeric", year: "numeric"}),
                }
            )
        })

        
        setCommunityNews(commNewsLocal); 
    }

    const handleFilterSelection = (e) => {
        e.preventDefault(); 

        if (e.target.value === 'All') {
            setCommFilter(['Business', 'Politics', 'Economy', 'Climate', 'Sports', 'Race', 'Food', 'Other']);
            setCommComparison('in')

            console.log("x");

        } else {
            e.target.value && setCommFilter(e.target.value);
            setCommComparison('==')
        }

        fetchCommunityNews();
    }

    
    const handleSearch = async (e) => {
        e.preventDefault(); 

        const db = getFirestore();

        const searchQuery = query(
            collection(db, "articles"),
            where("articleTitle", "==", search),
            limit(1),
        );
        
        console.log(searchQuery);
        const searchSnapshot = await getDocs(searchQuery);

        if (searchSnapshot.empty) {
            alert("No articles are under that name");
        }

        searchSnapshot.forEach((doc) => {

            navigate('/View/' + doc.id)
        })
    }

    return (

        <div className = "news-wrapper">

           

            <div className = "news-search-container">
                <form>
                    <input type = "text" placeholder= "Search news by article name..." onChange = {(e) => setSearch(e.target.value)}></input>
                </form>

                <button onClick = {handleSearch}>🔎</button>
            </div>

            <div className = "news-filter-container">

                <button value = {"All"} onClick = {fetchCommunityNews}>All</button>

                {colorFilters.map((filter) => {
                    return (
                        <button value = {filter} onClick = {handleFilterSelection}>{filter}</button>
                    )
                })}
            </div>

        
            <div className = "news-container">

                {communityNews.map((news) => {

                    let likes = news.articleLikes.length; 
                    let reposts = news.articleRepost.length;
                    let comments = news.articleComments.length; 

                    return (

                        <div className = "news-item">

                            <div className = "news-item-stats">
                                <h3 style = {{fontSize: '15px'}}>{unverifiedString}:</h3>
                                <h3 style = {{fontSize: '15px'}}>{news.articleCategory}</h3>

                                <h3 style = {{fontSize: '12px'}}
                                    onClick = {() => {
                                        
                                        if (news.articleAuthorId != getAuth().currentUser.uid) {
                                            navigate('/ViewProfile/' + news.articleAuthorId);
                                        } else {
                                            navigate('/Profile');
                                        }
                                    }}>

                                {news.articleAuthor} 🖊</h3>
                            </div>
                            

                            <img src = {news.articlePhotoURL} alt = "Thumbnail not found" 
                                onClick = {() => {navigate('/View/' + news.articleId)}}>
                            </img>

                            <h1>{news.articleTitle}</h1>
                            <h2>{news.articleDesc}</h2>

                            <div className = "news-item-stats">
                                <h3>{likes} 🤍</h3>
                                <h3>{reposts} ♻</h3>
                                <h3>{comments} 💬</h3>
                                <h3>{news.articleTimestamp} 🕛</h3>
                            </div>


                        </div>
                    )
                })}

            </div>
        </div>
    )
}

export default News; 