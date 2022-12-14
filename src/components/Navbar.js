//React:
import React from "react"; 
import { useResolvedPath, useNavigate, useMatch, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

//Firebase:
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, firestore } from "../firebase-config"; 
import { doc, setDoc } from "firebase/firestore";  

//CSS:
import "./ComponentStyles.css";
 
//Storage: 
import { create as ipfsHttpClient } from "ipfs-http-client";
import { Buffer } from 'buffer';



export default function Navbar() {

    //Navigator:
    const navigate = useNavigate();

    //Global Use States: 
    const [openLogIn, setOpenLogIn] = useState(false);
    const [openSignUp, setOpenSignUp] = useState(false);
    const [openLogOut, setOpenLogOut] = useState(false);

    useEffect(() => {
        const permissions = auth.onAuthStateChanged(user => {

            console.log(user);

            if (!user) {
                navigate("/");

                return;
            }
        })
        return () => permissions();
    }, []);
    


    //Log In:
    const LogIn = () => {
        
        //Firebase Auth:
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
    
        const handleLogin = () => {
            
            signInWithEmailAndPassword(getAuth(), email, password)
    
            .then(userCredential => {
                console.log("1");
                console.log(userCredential);
 
                setOpenLogIn(false); //Closes modal
                
                navigate("/Profile");
            })
            .catch(error => {
                console.log(error);
            }); 
        }    
    
        if(openLogIn == false) {
            return null; 
        }
    
        return (
    
            <div className = "auth-container">
    
                <div className = "auth-content">
                    
                    <button className = "auth-close" onClick = {() => {
                        setOpenLogIn(false);
                        
                       
                    }}>X</button>
    
                    <h1 style = {{backgroundColor: '#f21f5f', borderRadius: '.5rem', padding: '5px'}}>Log In</h1>
    
                    <form>
                        <input  type = "email" placeholder = "email" onChange = {(e) => setEmail(e.target.value)} required></input>
                        <input  type = "password" placeholder = "password" onChange = {(e) => setPassword(e.target.value)} required></input>
                    </form>

                    <button className = "auth-button" onClick = {handleLogin}>Log In</button>
    
                    <h2 onClick = {() => {

                        setOpenLogIn(false); //closes login modal
                        setOpenSignUp(true); //opens sign in modal
                        
                    }}>Don't have an account? Sign up</h2>

                </div>
           </div>
        )
    }

    //=============================================================================================

    const LogOut = () => {

        const handleLogOut = async () => {

            console.log("yay");
            const auth = getAuth();

            signOut(auth).then(() => {
                console.log("Log out success");

                setOpenLogOut(false);
                window.location.reload();
            }).catch ((error) => {
                console.log("An error occured" + error); 
            })
        }

        if (openLogOut == false) {
            return null;
        }

        return (
            
            <div className = "auth-container">
    
                <div className = "auth-content">
                    
                    <button className = "auth-close" onClick = {() => {
                        setOpenLogOut(false);
                    }}>X</button>
    
                    <h1 style = {{backgroundColor: '#f21f5f', borderRadius: '.5rem', padding: '5px'}}>👁️‍🗨️ Goodbye 👁️‍🗨️</h1>
                    <button className = "auth-button" onClick = {handleLogOut}>Log Out</button>

                </div>
           </div>
        )
    }

    //=============================================================================================

    //Sign Up:
    const SignUp = () => {

        //Firebase Auth:
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        
        //Firestore Doc:
        const [displayName, setDisplayName] = useState(''); //username
        const [pfpURL, setPfpURL] = useState(''); //Profile Picture
        const [backgroundURL, setBackgroundURL] = useState(''); //Background Picture
        const [bio, setBio] = useState(''); //Bio

        //Storage:
        const projectId = "2IisDbV2nQeFtUCa0ps08XplVOm";
        const projectSecret = "f631a21c7ffa72d45fda18a943ac1ab7";
        const authorization = `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString('base64')}`; 

        //=============================================================================================

        const client = ipfsHttpClient ({
            host: 'ipfs.infura.io',
            port: 5001,
            protocol: 'https',
            headers: {
                authorization: authorization,
            },
        });

        const uploadPfpToIPFS = async (e) => {

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
                setPfpURL(URL);

                return URL; 

            } catch (error) {
                console.log("Error Uploading Files TO IPFS"); 
            }
        }

        //=============================================================================================

        const uploadBackgroundToIPFS = async (e) => {

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
                setBackgroundURL(URL);
                 
                return URL; 

            } catch (error) {
                console.log("Error Uploading Files TO IPFS"); 
            }
        }

        //=============================================================================================
        
        //Handlers:
        const handleSignUp = (e) => {
    
            console.log(email, password)
            e.preventDefault()
    
            createUserWithEmailAndPassword(auth, email, password) 
    
            .then((userCredential) => {
                console.log(userCredential);
                
                //Setting user document with data from firestore usestate(s)
                setDoc(doc(firestore, `users/${userCredential.user.uid}`), {   //Firestore path
    
                    email: userCredential.user.email,
                    displayName: displayName,
                    pfpURL: pfpURL,
                    backgroundURL: backgroundURL,
                    bio: bio,
    
                    followers: [],
                    following: [],
                    entries: []
                })

                setOpenSignUp(false); //Closes modal
                navigate('/News');
            })
            .catch (error => {
                console.log(error);
            })
        }

        //=============================================================================================

        if (openSignUp == false) {
            return null;
        }

        return (
    
            <div className = "auth-container">
    
                <div className = "auth-content">
                    
                    <button className = "auth-close" onClick = {() => {
                        setOpenSignUp(false); 
                    }}>X</button>
    
                    <h1 style = {{backgroundColor: '#f21f5f', borderRadius: '.5rem', padding: '5px'}}>Sign Up</h1>
    
                    <form>
                        <input   type = "email" placeholder = "email"
                         onChange = {(e) => setEmail(e.target.value)} required>
                        </input>

                        <input  type = "username" placeholder = "username" 
                            onChange = {(e) => setDisplayName(e.target.value)} required>
                        </input>
                        
                        <input  type = "password" placeholder = "password"
                            onChange = {(e) => setPassword(e.target.value)} required>
                        </input>
    
                        <input  type = "file" accept = "image/png, image/jpeg" placeholder = "select profile picture" 
                            onChange = {(e) => uploadPfpToIPFS(e)} required>
                        </input>

                        <input  type = "file" accept = "image/png, image/jpeg" placeholder = "select profile picture" 
                            onChange = {(e) => uploadBackgroundToIPFS(e)} required>
                        </input>

                        <input type = "text" placeholder = "Write a bio..." style = {{height: '150px'}}
                            onChange = {(e) => setBio(e.target.value)} required> 
                        </input>

                        <button className = "auth-button" onClick = {handleSignUp}>Sign Up</button>
                    </form>
    
                    <h2 onClick = {() => {
                        setOpenLogIn(true); //opens login modal
                        setOpenSignUp(false); //closes sign in modal

                    }}>Already have an account? Log In</h2>
                    
                </div>
           </div>
        )
    }

    let link = "/Profile"

    //Nav Bar Links:
    return (
        
        <nav className = "nav">

            <div>

                <button className = "site-title" onClick = {() => {

                    const auth = getAuth(); 

                    if (auth.currentUser === null) {
                        setOpenLogIn(true);

                    } else {
                        setOpenLogOut(true); 
                    }

                }}>Journalzz.</button>

                <LogIn/>
                <SignUp/>
                <LogOut/>
            </div>
            
        
            <ul>
                <CustomLink to = "/">News</CustomLink>

                <button>
                    <CustomLink to = {link}>My Profile</CustomLink>
                </button>
            </ul>
        </nav>
    )
}

function CustomLink({ to, children, ...props}) {

    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({ path: resolvedPath.pathname, end : true})

    return (
        <li className = {isActive ? "active" : ""}>
            <Link to = {to} {...props}>{children}</Link>
        </li>   
    )
}



