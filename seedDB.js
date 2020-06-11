const mongoose = require("mongoose");
const Post = require("./models/post");
const Comment = require("./models/comment");

const posts = [
    {
        title: "Placeholder af",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        author: "catag"
    },

    {
        title: "Ora de matematica",
        text: "Azi facem un grafic. Se munceste mult la graficele astea... stam 30 de minute acum. Facem un logaritm, dupaia va zic si mediile",
        author: "carage66"
    },

    {
        title: "More placeholder",
        text: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of de Finibus Bonorum et Malorum (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, Lorem ipsum dolor sit amet.., comes from a line in section 1.10.32.",
        author: "mihai145"
    },

    {
        title: "I think that`s enough",
        text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
        author: "as"
    }
];

const comms = [
    {
        toPostTitle: "Ora de matematica",
        comment: {
            text: "Da domnu asa e, greu rau cu functile astea",
            author: "Marinescu"
        }
    },

    {
        toPostTitle: "Ora de matematica",
        comment: {
            text: "Ce mi-ati scris in lucrare numai prostii notele sunt mici. Vedeti voi la biletele",
            author: "carage66"
        }
    },

    {
        toPostTitle: "Ora de matematica",
        comment: {
            text: "Domnu pot sa ma duc la bae?",
            author: "iordache123"
        }
    },

    {
        toPostTitle: "More placeholder",
        comment: {
            text: "The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from de Finibus Bonorum et Malorum by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.",
            author: "as"
        }
    }
];

async function addPosts() {
    for (const post of posts) {
        Post.create(post, (err, post) => {
            if (err || !post) {
                console.log(err);
            } else {
                console.log("OK");
            }
        });
    }
}

async function seedDB() {
    Post.deleteMany({}, err => {
        if (err) {
            console.log(err);
        } else {
            console.log("OK");
        }
    });

    Comment.deleteMany({}, err=> {
        if (err) {
            console.log(err);
        } else {
            console.log("OK");
        }
    });

    await addPosts();

    for(const comm of comms) {
        Post.findOne({title: comm.toPostTitle}, (err, post) => {
            // console.log("FOUND");
            // console.log(post);
            if(err || !post) {
                console.log(err);
            } else {
                Comment.create(comm.comment, (err, comm) => {
                    if(err || !comm) {
                        console.log(err);
                    } else {
                        post.comments.push(comm);
                    }
                    post.save();
                });
            }
        });
    }
}

module.exports = seedDB;