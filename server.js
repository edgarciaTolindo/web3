/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: _Maliha Abdul Azeem_____________________ Student ID: __
147996201____________ Date: __07/11/2022_____________
*
*  Online (Cyclic) Link: https://gorgeous-yak-dirndl.cyclic.app
*
********************************************************************************/
// CLOUD NAME : drxnka5sf
// API KEY: 244346439269562
// API SECRET: syD2XwsV1oKtcBK_itkKZxdhgoM 

var express = require("express")
var productService = require('./product-service')
var path = require("path")
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const stripJs = require('strip-js');
const exphbs = require('express-handlebars')
const upload = multer();
const authData = require("./auth-service.js");
const clientSessions = require("client-sessions")


var app = express()
app.use('/public', express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));// Setup the static folder that static resources can load from
app.use(express.urlencoded({ extended: true })); // express body parser to access form data in http body. 


cloudinary.config({
    cloud_name: 'drxnka5sf',
    api_key: '244346439269562',
    api_secret: 'syD2XwsV1oKtcBK_itkKZxdhgoM',
    secure: true
});

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    layoutsDir: 'views/layouts',
    defaultLayout: 'main',
    helpers: {

        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },

        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },

        safeHTML: function (context) {
            return stripJs(context);
        },
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        },

    }

}))
app.set('view engine', '.hbs')
//--------------------------------------------------------Session-------------------------------------------------
app.use(clientSessions({
    cookieName: "session",
    secret: "week10example_web322",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));

app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) { //Helper middleware function => checks if a user is logged in   //OK 
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

//

app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

var HTTP_PORT = process.env.PORT || 8080

function onHttpstart() {
    console.log("Express http server listening on port: " + HTTP_PORT)
}

app.get("/", (req, res) => {
    res.redirect("home")
})

app.get("/home", (req, res) => {
    res.render("home")
})

app.get('/products', async (req, res) => {

    let data = {};

    try {

        let products = [];

        if (req.query.category) {
            products = await productService.getPublishedProductsByCategory(req.query.category);
        }

        else {
            products = await productService.getPublishedProducts();
        }

        products.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        let product = products[0];
        data.products = products;
        data.product = product;

    }
    catch (err) {
        data.message = "no results";
    }

    try {

        let categories = await productService.getCategories();
        data.categories = categories;
    }
    catch (err) {
        data.categoriesMessage = "no results"
    }

    res.render("product", { data: data })
});

app.get("/products/add", ensureLogin, (req, res) => {
    productService.getCategories().then((data) => {
        res.render("addProduct", { categories: data });
    }).catch((err) => {
        res.render("addProduct", { categories: [] });
    });
})

app.post("/products/add", ensureLogin, upload.single("featureImage"), (req, res) => {

    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processProduct(uploaded.url);
        });
    } else {
        processProduct("");
    }

    function processProduct(imageUrl) {
        req.body.featureImage = imageUrl;

        productService.addProduct(req.body).then(post => {
            res.redirect("/demos");
        }).catch(err => {
            console.log(" SERVER  error adding ", err);
            res.status(500).send(err);
        })
    }
});

app.get('/product/:id', (req, res) => {
    productService.getProductById(req.params.id).then(data => {
        res.render("product", { data: data })
    }).catch(err => {
        res.json({ message: err });
    });
});

app.get('/products/:id', async (req, res) => {

    let data = {};

    try {

        let products = [];

        if (req.query.category) {
            products = await productService.getPublishedProductsByCategory(req.query.category);
        }
        else {
            products = await productService.getPublishedProducts();
        }

        products.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        data.products = products;

    }
    catch (err) {
        data.message = "no results";
    }

    try {
        data.post = await productService.getProductById(req.params.id);
    }
    catch (err) {
        data.message = "no results";
    }

    try {

        let categories = await productService.getCategories();

        data.categories = categories;
    }
    catch (err) {
        data.categoriesMessage = "no results"
    }
    res.render("product", { data: data })
});


app.get("/demos", (req, res) => {
    if (req.query.category) {
        productService.getProductsByCategory()
            .then((data) => {
                res.render("demos", { products: data })
            })

            .catch((err) => {
                res.render("demos", { message: "no results" });
            })
    }

    else if (req.query.minDateStr) {
        productService.getProductsByMinDate(req.query.minDateStr)
            .then((data) => {
                res.render("demos", { products: data })
            })

            .catch((err) => {
                res.render("demos", { message: err })
            })
    }

    else {
        productService.getAllProducts()
            .then((data) => {
                res.render("demos", { products: data })
            })

            .catch((err) => {
                res.render("demos", { message: err })
            })
    }


})

app.get("/categories", ensureLogin, (req, res) => {
    productService.getCategories()
        .then((data) => {
            res.render("categories", { categories: data })
        })
        .catch((err) => {
            res.render("categories", { message: "no results" })
        })
})

app.get("/categories/add", ensureLogin, (req, res) => {
    res.render('addCategory', {
    });
});

app.post("/categories/add", ensureLogin, (req, res) => {
    productService.addCategory(req.body).then(() => {
        res.redirect("/categories");
    }).catch((err) => {
        res.send(err);
    })
})

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    productService.deleteCategoryById(req.params.id).then(() => {
        res.redirect("/categories");
    }).catch((err) => {
        res.status(505);
    })
})

app.get("/products/delete/:id", ensureLogin, (req, res) => {

    productService.deleteProductById(req.params.id).then(() => {
        res.redirect("/demos");
    }).catch((err) => {
        res.status(505, "Unable to Remove product /  not found");
    })
})
//*****************************ASS 6 NEW ROUTES******************************************************* */
app.get("/login", (req, res) => {
    res.render('login', {});  //renders view login with no data 
})

app.get("/register", (req, res) => {
    res.render('register', {});  //renders view register with no data 
})

app.post("/register", (req, res) => {
    var formdat = req.body;
    console.log("user received is: ", formdat.userName);
    authData.RegisterUser(formdat)
        .then(() => {
            res.render('register', { successMessage: "User created" })
        })
        .catch((err) => {
            res.render('register', { errorMessage: err, userName: req.body.userName })
        })
})

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then((user) => {

            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            }
            res.redirect('/demos');
        })
        .catch((err) => {
            res.render('login', { errorMessage: err, userName: req.body.userName })
        })

})

app.get("/logout", function (req, res) {
    req.session.reset();
    res.redirect("/");
});


app.get("/userHistory", ensureLogin, (req, res) => {
    let dataHistory = req.session.user.loginHistory;
    res.render('userHistory', { data: dataHistory })
});

//************************************************************************************ */

app.use((req, res) => {
    res.render("error", { message: "404 PAGE NOT FOUND" })
})

console.log("web-322 app working on LocalHost: 8080")

productService.initialize()
    .then(authData.initialize)//initialize mongo db connection  
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on ${HTTP_PORT}`)
        })
    })

    .catch(() => {
        console.log("OOPS! Failed promises")
    })

