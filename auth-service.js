const bcrypt = require('bcryptjs');
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    "userName": { "type": String, "unique": true },
    "password": String,
    "email": String,
    "loginHistory": [{ dateTime: Date, userAgent: String }]
})

let User;


function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://dbAdmin:dbAdminPass@cluster0.z8lak.mongodb.net/loginDataBase?retryWrites=true&w=majority");
        db.on('error', (err) => {
            reject(err);
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};


function RegisterUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password === userData.password2) {

            bcrypt.hash(userData.password, 10, function (err, hash) {
                if (err) {
                    reject("error encrypting password");
                } else {
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser.save((err, data) => {
                        if (err) {
                            console.log("ERROR STORING THE USER: " + err + " ---> " + err.code)
                            if (err.code === 11000) { reject("User Name already taken"); }
                            else { reject("There was an error creating the user: " + err); }
                        } else { resolve(); }
                    });
                }
            })
        } else { reject("Passwords do not match"); }
    });
}

function updateLogin(name, loghistory) {
    console.log("Updating login info of " + name)
    User.updateOne({ userName: name },
        { $set: { loginHistory: loghistory } }
    )
        .exec()
        .then((msg) => {
            if (msg) {
                console.log("update message: ", msg);
            }
        })
        .catch((err) => {

            console.log(`There was an error: ${err}`);
        });

}


function checkUser(userData) {
    return new Promise((resolve, reject) => {
        console.log("USER TRIES TO LOGIN: ", userData.userName, "PASSWORD: ", userData.password)
        User.find({ userName: userData.userName })
            .exec()
            .then((users) => {
                if (!users) {
                    reject("Unable to find user: " + userData.userName);
                } else {
                    bcrypt.compare(userData.password, users[0].password).then(res => {
                        if (!res) { reject("Incorrect Password for user" + userData.userName); }

                        else {
                            users[0].loginHistory.push(
                                { dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                            updateLogin(users[0].userName, users[0].loginHistory);
                            resolve(users[0])
                        }
                    })
                }
            })
            .catch((err) => {
                console.log(`There was an error: ${err}`);
                reject("Unable to find user: " + userData.userName)
            });
    })
}

module.exports = {
    initialize,
    RegisterUser,
    checkUser
}