const Sequelize = require('sequelize');

var sequelize = new Sequelize('dc5qfu3973s1uj', 'amvovyzcopquah', '2192539076007e15f5fd227e1843665159509d429a3fd27a6960984cd4a0b030', {
    host: 'ec2-52-201-124-168.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

var Product = sequelize.define('Product', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
}
);

var Category = sequelize.define('Category', {
    category: Sequelize.STRING,
}
    , {
        createdAt: false, // disable createdAt
        updatedAt: false // disable updatedAt
    }
);

Product.belongsTo(Category, { foreignKey: 'category' });

exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            resolve("success sync");
        }).catch(() => {
            reject("Unable to sync");//return 
        });
    })
}

exports.getAllProducts = () => {
    return new Promise((resolve, reject) => {
        Product.findAll().then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned" + err);
        });
    });
}

exports.getPublishedProducts = () => {
    return new Promise((resolve, reject) => {
        Product.findAll(
            {
                where: { published: true }
            }
        ).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned" + err);
        });
    });
}

exports.addProduct = function (postData) {
    return new Promise((resolve, reject) => {
        postData.published = postData.published ? true : false;

        for (var prop in postData) {
            if (postData[prop] == '')
                postData[prop] = null;
        }

        postData.postDate = new Date();

        Product.create(postData).then(() => {
            resolve();
        }).catch((e) => {
            console.log("=================== error adding ", e);
            reject("unable to create post");
        });

    });
}

exports.getProductsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        Product.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned from MinDate" + err);
            });
    });
}

exports.getProductById = function (id) {
    return new Promise((resolve, reject) => {
        if (id == undefined || id == null || id == "alt=") { id = 17; }
        Product.findAll(
            { where: { id: id } }
        ).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject("no results returned" + err);
        });
    });
}

exports.getProductsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Product.findAll({
            where: {
                category: category
            }
        }).then(data => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

exports.getPublishedProductsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Product.findAll(
            {
                where: {
                    published: true,
                    category: category
                }
            }
        ).then((data) => { resolve(data); }).catch((err) => {
            reject("no results returned" + err);
        });
    });
}

exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll().then((data) => {
            resolve(data);
        }).catch((err) => { reject("no results returned from categories" + err); });
    });
}

//new functions

exports.addCategory = (categoryData) => {
    return new Promise((resolve, reject) => {

        for (var prop in categoryData) {
            if (categoryData[prop] == '')
                categoryData[prop] = null;
        }

        Category.create(categoryData).then(() => {
            resolve();
        }).catch((e) => {
            console.log("EROR AT  CREATE CATEGORY", e);
            reject("unable to create category", e);
        });

    });
}

exports.deleteCategoryById = (idd) => {
    return new Promise((resolve, reject) => {
        Category.destroy(
            {
                where: { id: idd }
            }
        ).then(() => {
            resolve("destroyed");
        }).catch((err) => {
            reject(" unable to delete category" + err);
        });
    });
}

exports.deleteProductById = (idd) => {
    return new Promise((resolve, reject) => {
        Product.destroy(
            {
                where: { id: idd } // only remove user with id == 3
            }
        ).then(() => {
            resolve("destroyed");
        }).catch((err) => {
            reject(" unable to delete post" + err);
        });
    });
}