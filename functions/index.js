const functions = require("firebase-functions");
const admin = require("firebase-admin"); 


//Init:
admin.initializeApp(); 

//Post Function: async because getting user data is await
exports.postJournalzz = functions.https.onCall(async (data, context) => {

    //Param Vars:
    const titleReq = data.title;
    const descReq = data.desc;
    const contentReq = data.content;
    const photoReq = data.photo;
    const categoryReq = data.category;

    //Auth:
    if (!context.auth) return {result: "Must be logged in to create a post"}; 

    //Conditional Validation:
    if (titleReq != null && (titleReq.length > 144 || titleReq.length < 1)) return {result: "Title must be in between 1 and 30 characters"};
    if (descReq != null && (descReq.length > 144 || descReq.length < 1)) return {result: "Description must be in between 1 and 144 characters"}; 
    if (contentReq != null && (contentReq.length < 144 || contentReq.length > 100000)) return {result: "Content must be in between 144 and 100000 characters"}; 

    if (photoReq == null) return {result: "Must include a photo"}; 
    if (categoryReq == null) return {result: "Must select a category"}; 

    //Lookup user display name from uid: (can't access directly from context.auth)
    const userRef = admin.firestore().collection("users").doc(context.auth.uid);

    const userData = await userRef.get(); 

    if (!userData.exists) return {result: "User data does not exist"}; 

    admin.firestore().collection('articles').add({

        articleTitle: titleReq,
        articleDesc: descReq,
        articleContent: contentReq,
        articlePhotoURL: photoReq,
        articleCategory: categoryReq,
        articleTimestamp: Date.now() / 1000,
        
        articleAuthor: [context.auth.uid, userData.data().displayName],
            
        articleComments: [],

        articleLikes: [],

        articleRepost: [],

    }).then (val => {

        admin.firestore().collection("users").doc(context.auth.uid).update ({
            entries: admin.firestore.FieldValue.arrayUnion(val.id)
        }, {
            merge: true
        })

    }).catch (error => {
        functions.logger.error(error); 
        reject ("An error occured");
    })
    
    return {result: "Post Success"};
});


//Like Function:
exports.likePost = functions.https.onCall(async (data, context) => {


    return new Promise (async (resolve, reject) => {


        //Param vars:
        const idReq = data.articleId;

        //Auth and conditional validation:
        if (!context.auth) resolve ("Must be logged in to like a post");

        //Lookup user display name from uid: (can't access directly from context.auth)
        await admin.firestore().collection("users").doc(context.auth.uid).get()
        .then (val => { //Article Document Updating:

            if (!val.data()) {
                resolve ("Data does not exist");
            }

            const likeMap = {

                likeTimestamp: Date.now() / 1000,

                uid: context.auth.uid,
            }

            //Update doc: (path to article user is coming from [database path])
            const articleReference = admin.firestore().doc(`articles/${idReq}`);

            articleReference.set ({
                articleLikes: admin.firestore.FieldValue.arrayUnion(likeMap)
            }, {
                merge: true,
            })

            .then (val => { //User document updating
                
                const userReference = admin.firestore().doc(`users/${context.auth.uid}`);

                userReference.set ({
                    likedArticles: admin.firestore.FieldValue.arrayUnion(idReq)
                }, {
                    merge: true,
                })

                .then (val => {
                    resolve ("Like Success");

                })
                .catch (error => {
                    functions.logger.error(error); //logs error to google cloud platform log
                    reject ("An error occured");
                })
            })
            
            .catch (error => {
                functions.logger.error(error); //logs error to google cloud platform log
                reject ("An error occured");
            })
            
        })
        
        .catch (error => {
            functions.logger.error(error); //logs error to google cloud platform log

            reject ("An error occured");
        })      
    })
})


//Unlike Post:
exports.unlikePost = functions.https.onCall(async (data, context) => {

    return new Promise (async (resolve, reject) => {

        //Param Vars:
        const idReq = data.articleId; 

        //Auth and conditional validation:
        if (!context.auth) resolve ("Must be logged in to unlike a post");

        //Article look up
        await admin.firestore().collection("articles").doc(idReq).get()
        .then (val => { //Article Likes update 

            let articleLikes = val.data().articleLikes; 

            let dontPop = []; 

            for (let i of articleLikes)  {

                if (i.uid != context.auth.uid) {

                    dontPop.push(i); 
                }
            }

            admin.firestore().collection("articles").doc(idReq).set({
                articleLikes: dontPop
            }, {
                merge: true 
            })

            //=========================================================================

            .then (async val => { //user liked articles update 

                admin.firestore().collection("users").doc(context.auth.uid).get()
                .then (val => {

                    let dontPopArr = [];
                    let likedArticles =  val.data().likedArticles

                    for (let i of likedArticles) {
                        if (i != idReq) {
                            dontPopArr.push(i); 
                        }
                    }

                    admin.firestore().collection("users").doc(context.auth.uid).set ({
                        likedArticles: dontPopArr

                    }, {
                        merge: true
                        
                    }).then (val => {
                        resolve ("Successfully unliked post"); 

                    }).catch (error => {
                        functions.logger.error(error); 
                        reject ("An error occured");
                    })

                    
                }).catch (error => {
                    functions.logger.error(error); 
                    reject ("An error occured");
                })  

            }).catch (error => {
                functions.logger.error(error); 
                reject ("An error occured");
            })  

        }).catch (error => {
            functions.logger.error(error); 
            reject ("An error occured");
        })  
        
    })
})



//Repost:
exports.repost = functions.https.onCall(async (data, context) => {

    return new Promise (async (resolve, reject) =>  {

        //Param vars:
        const idReq = data.articleId;

        //Auth and conditional validation:
        if (!context.auth) resolve ("Must be logged in to repost");

        //Checking if user has already reposted
        await admin.firestore().collection("users").doc(context.auth.uid).get()
        .then (val => {

            //Check if user data exist
            if (!val.data()) {
                resolve("Data does not exist");
            }

            //Check to see if user has already reposted (user side)
            if (val.data().repostedArticles.includes(idReq)) {
                resolve("You have already reposted this article"); 
            }

            //Adding repost map to article doc
            admin.firestore().collection("articles").doc(idReq).get()
            .then (val => {

                //Check to see if article exist
                if (!val.data()) {
                    resolve("Data does not exist");
                }

                //Add repost map to article array field
                admin.firestore().collection("articles").doc(idReq).update ({

                    articleRepost: admin.firestore.FieldValue.arrayUnion(
                        {
                            uid: context.auth.uid, 
                            timestamp: Date.now() / 1000
                        }
                    )
                }, {
                    merge: true

                }).then (val => {

                    //add doc id to user array field
                    admin.firestore().collection("users").doc(context.auth.uid).update ({

                        repostedArticles: admin.firestore.FieldValue.arrayUnion(idReq)
                    }, {
                        merge: true

                    }).then (val => {
                        resolve("Repost Success"); 

                    }).catch (error => {
                        functions.logger.error(error); 
                        reject ("An error occured");
                    })

                }).catch (error => {
                    functions.logger.error(error); 
                    reject ("An error occured");
                })

            }).catch (error => {
                functions.logger.error(error); 
                reject ("An error occured");
            })
           
        }).catch (error => {
            functions.logger.error(error); 
            reject ("An error occured");
        })
    })
})


//un repost: 
exports.unRepost = functions.https.onCall (async (data, context) => {

    return new Promise (async (resolve, reject) => {

        //Param vars: 
        const idReq = data.articleId;

        //Auth and conditional validation:
        if (!context.auth) resolve ("Must be logged in to Unrepost");

        await admin.firestore().collection("users").doc(context.auth.uid).get()
        .then (val => {

            //Check if user data exist
            if (!val.data()) {
                resolve("Data does not exist"); 
            }

            //Check if user has reposted
            if (!val.data().repostedArticles.includes(idReq)) {
                resolve("Cannot unrepost and article you have not reposted"); 
            }

            
            admin.firestore().collection("articles").doc(idReq).get()
            .then (val => {

                //Check to see if article exist
                if (!val.data()) {
                    resolve("Data does not exist");
                }

                //Remove repost map from article doc array field: 
                admin.firestore().collection("articles").doc(idReq).update ({

                    articleRepost: admin.firestore.FieldValue.arrayRemove(
                        {
                            uid: context.auth.uid, 
                            timestamp: Date.now() / 1000 //pull up original map value 
                        }
                    )
                }, {
                    merge: true

                }).then (val => {

                    //Remove repost from user doc array field:
                    admin.firestore().collection("users").doc(context.auth.uid).update ({

                        repostedArticles: admin.firestore.FieldValue.arrayRemove(idReq)
                    }, {
                        merge: true

                    }).then (val => {
                        resolve("Successfully unreposted article");

                    }).catch (error => {
                        functions.logger.error(error); 
                        reject ("An error occured");
                    })

                }).catch (error => {
                    functions.logger.error(error); 
                    reject ("An error occured");
                })

            }).catch (error => {
                functions.logger.error(error); 
                reject ("An error occured");
            })

        }).catch (error => {
            functions.logger.error(error); 
            reject ("An error occured");
        })
    })
})

//Comment
exports.postComment = functions.https.onCall(async (data, context) => {

    return new Promise (async (resolve, reject) => {

        //Params vars:
        const idReq = data.articleId; 
        const commentReq = data.comment;

        //Auth and conditional validation
        if (!context.auth) resolve ("Must be logged in to comment on a post"); 
        if (commentReq != null && (commentReq.length > 144 || commentReq < 1)) resolve ("Comment must in between 1 and 140 characters");

        //Lookup user display name from uid: (can't access directly from context.auth)
        await admin.firestore().collection("users").doc(context.auth.uid).get()

        .then (val => {

            
            if (val.data() == null) {
                resolve ("Data does not exist")
            }

            //Update doc: (path to article user is coming from [database path])
            const articleReference = admin.firestore().doc(`articles/${idReq}`);


            const commentMap = {

                comment: commentReq,

                commentTimestamp: Date.now() / 1000,

                uid: context.auth.uid,
            }


            articleReference.set ({
                articleComments: admin.firestore.FieldValue.arrayUnion(commentMap)  

            }, {
                merge: true,

            })
            
            .then (val => { //Second .then()
                resolve ("Comment Success");
            })

            .catch (error => {  
                functions.logger.error(error); //logs error to google cloud platform log
                reject ("An error occured");
            })

        })

        .catch (error => {
            functions.logger.error(error); //logs error to google cloud platform log
            reject ("An error occured");
        })

    })

})


exports.followUser = functions.https.onCall(async (data, context) => {

    return new Promise (async (resolve, reject) => {

        //param vars:
        const idReq = data.uid

        //Auth and conditional validation
        if (!context.auth) resolve ("Must be logged in to follow a user"); 

        //Look up sender for conditional validation
        await admin.firestore().collection("users").doc(context.auth.uid).get()
        .then (val => {

            if (val.data().following.includes(idReq)) {
                resolve ("You already follow this user"); 
            }

            //Adding recievers uid to the senders doc (following):
            admin.firestore().collection("users").doc(context.auth.uid).set ({
                following: admin.firestore.FieldValue.arrayUnion(idReq)
            }, {
                merge: true

            }).then (val => {   //Adding senders uid to the recievers doc (followers):

                admin.firestore().collection("users").doc(idReq).get()
                .then (val => {

                    let reciverFollowersArr = val.data().followers; 

                    if (!val.data()) {
                        resolve ("Follow request for a non-existent user"); 
                    }

                    if (reciverFollowersArr.includes(context.auth.uid)) {
                        resolve ("You are already following this user"); 
                    }

                    admin.firestore().collection("users").doc(idReq).set ({
                        followers: admin.firestore.FieldValue.arrayUnion(context.auth.uid)
                    }, {
                        merge: true

                    }).then (val => {
                        resolve("Successfully followed user"); 

                    }).catch (error => {
                        functions.logger.error(error);
                        reject("An error occured"); 
                    })

                }).catch (error => {
                    functions.logger.error(error);
                    reject("An error occured"); 
                })

            }).catch (error => {
                functions.logger.error(error);
                reject("An error occured"); 
            })

        }).catch (error => {
            functions.logger.error(error);
            reject("An error occured"); 
        })
    }) 
})


exports.unfollowUser = functions.https.onCall(async (data, context) => {

    return new Promise (async (resolve, reject) => {

        //prama vars:
        const idReq = data.uid;

        //Auth and conditional validation
        if (!context.auth) resolve ("Must be logged in to unfollow a user");
        
        //Look up sender for conditional validation
        await admin.firestore().collection("users").doc(context.auth.uid).get()
        .then (val => {

            if (!val.data().following.includes(idReq)) {
                resolve("Can not unfollow, you not currently following this user"); 
            }


            //Removing recievers uid from the senders doc (following):
            admin.firestore().collection("users").doc(context.auth.uid).update ({
                following: admin.firestore.FieldValue.arrayRemove(idReq)
            }, {
                merge: true

            }).then (val => { //Removing senders uid from the recievers doc (followers): 

                admin.firestore().collection("users").doc(idReq).get()
                .then (val => {


                    admin.firestore().collection("users").doc(idReq).update ({
                        followers: admin.firestore.FieldValue.arrayRemove(context.auth.uid)
                    }, {
                        merge: true

                    }).then (val => {
                        resolve("Successfully unfollowed user"); 

                    }).catch (error => {
                        functions.logger.error(error);
                        reject("An error occured"); 
                    })

                }).catch (error => {
                    functions.logger.error(error);
                    reject("An error occured"); 
                })

            }).catch (error => {
                functions.logger.error(error);
                reject("An error occured"); 
            })

        }).catch (error => {
            functions.logger.error(error);
            reject("An error occured"); 
        })

    })
})