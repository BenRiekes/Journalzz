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

    //Categories:
    const [featured, setFeatured] = useState([]);
    const [politics, setPolitics] = useState([]); 
    const [business, setBusiness] = useState([]); 
    const [economy, setEconomy] = useState([]);
    const [climate, setClimate] = useState([]); 
    const [race, setRace] = useState([]); 
    const [sports, setSports] = useState([]); 
    const [food, setFood] = useState([]);
    const [other, setOther] = useState([]);  
    

    //Search:
    const [search, setSearch] = useState(''); 
    
    useEffect(() => {

        fetchNews("Politics");
        fetchNews("Business");
        fetchNews("Economy");
        fetchNews("Climate");
        fetchNews("Race");
        fetchNews("Sports"); 
        fetchNews("Food"); 
        fetchNews("Other"); 
       
    }, [])

    
    
    //Nav:
    const navigate = useNavigate(); 
    
    const fetchNews = async (queryParam) => {
        const db = getFirestore(); 

        const newsQuery = query(
            collection(db, "articles"),
            where("articleCategory", "==", queryParam),
            orderBy("articleTimestamp", "desc"),
            limit(20),
        );
        
        const newsQuerySnapshot = await getDocs(newsQuery); 

        let localArr = []; 
        newsQuerySnapshot.forEach((doc) => {

            //timestamp:
            let timestampInit = doc.data().articleTimestamp * 1000;
            let timestamp = new Date(timestampInit); 

            //truncate description string:
            let truncateDesc = doc.data().articleDesc;
            if (truncateDesc.length > 75) {
                truncateDesc = truncateDesc.substring(0, 50) + '...'
            }


            localArr.push(

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

        //Avoids promise (set state inside of async function):
        switch (queryParam) {
            case "Politics":
                setPolitics(localArr);
                break;
            case "Business":
                setBusiness(localArr);
                break;
            case "Economy":
                setEconomy(localArr);
                break;
            case "Climate":
                setClimate(localArr);
                break;
            case "Race":
                setRace(localArr);
                break;
            case "Sports":
                setSports(localArr);
                break;
            case "Food":
                setFood(localArr);
                break;
            case "Other":
                setOther(localArr);
                break;
            default: 
                console.error("Invalid Query Parameter: " + queryParam); 
                return;
        }
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

    const NewsItem = ({ category }) => {

        return (

            category.map((ref) => {

                return (
                    
                    <div className = "news-item">

                        <img 
                            src = {ref.articlePhotoURL}
                            alt = "No Photo Found"

                            onClick = {() => {
                                navigate('/View/' + ref.articleId);
                            }}>                  
                        </img>

                        <h1>
                            {ref.articleTitle}
                        </h1>

                        <h2>{ref.articleDesc}</h2>

                        <div className = "news-item-button-container">

                            <button onClick = {() => {

                                if (getAuth().currentUser.uid != ref.articleAuthorId) {
                                    navigate('/ViewProfile/' + ref.articleAuthorId)
                                } else {
                                    navigate('/Profile'); 
                                }
                                }}>
                            {ref.articleAuthorName} 🖊</button>

                            <button>{ref.articleLikesNum} 🤍</button>
                            <button>{ref.articleRepostNum} ♻</button>
                            <button>{ref.articleCommentsNum} 💬</button>
                            <button>{ref.articleTimestamp} 🕛</button>

                        </div>
                    </div>
                )
            })
        )
            
    }

    return (

        <div className = "news-wrapper">


            <div className = "news-view-container">
                <h1>#Politics</h1>

                <div className = "news-view">                   
                    <NewsItem category = {politics} />
                </div>

            </div>
            

            <div className = "news-view-container">
                <h1>#Business</h1>

                <div className = "news-view">                   
                    <NewsItem category = {business} />                   
                </div>

            </div>
            

            <div className = "news-view-container">
                <h1>#Economy</h1>

                <div className = "news-view">                   
                    <NewsItem category = {economy} />
                </div>

            </div>
            

            <div className = "news-view-container">
                <h1>#Climate</h1>

                <div className = "news-view">    
                    <NewsItem category = {climate} />
                </div>

            </div>
            

            <div className = "news-view-container">
                <h1>#Race</h1>

                <div className = "news-view">                   
                    <NewsItem category = {race} />
                </div>

            </div>
            

            <div className = "news-view-container">
                <h1>#Sports</h1>

                <div className = "news-view">
                    <NewsItem category = {sports} /> 
                </div>

            </div>
            
            <div className = "news-view-container">
                <h1>#Food</h1>

                <div className = "news-view">
                    <NewsItem category = {food} />
                </div>

            </div>
            
            <div className = "news-view-container" style = {{marginBottom: '2.5%'}}>
                <h1>#Other</h1>

                <div className = "news-view">
                    <NewsItem category = {other} />
                </div>

            </div>

            
        </div>
    )
}

export default News; 