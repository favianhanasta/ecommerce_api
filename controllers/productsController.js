const { send } = require("express/lib/response");
const { db, dbQuery } = require("../config/database");
const fs = require("fs");
const { uploader } = require("../config/uploader");

module.exports = {
  getProducts: async (req, res) => {
    try {
      let filterQuery = [];
      for (let prop in req.query) {
        if (prop != "_sort" && prop != "_order") {
          if (prop == "price_min" || prop == "price_max") {
            if (req.query[prop]) {
              console.log("oi", req.query[prop]);
              filterQuery.push(
                `price ${prop == "price_min" ? ">" : "<"} ${req.query[prop]}`
              );
            }
          } else {
            filterQuery.push(
              `${prop == "name" ? `p.${prop}` : prop}=${db.escape(
                req.query[prop]
              )}`
            );
          }
        }
      }
      let { _sort, _order, price_min, price_max, status } = req.query;
      // let getSQL = `select p.*,b.brand as brand_name,c.category from ecommerce.products as p join ecommerce.brand as b on p.idbrand = b.idbrand join ecommerce.category as c on p.idcategory=c.idcategory ${req.query.status=='deactive'?'': `where p.status='active'`} ${filterQuery.length > 0 ? `${req.query.status=='deactive'?'where':'and'} ${filterQuery.join(' and ')}` : ""}${_sort&&_order?`order by ${_sort} ${_order}`: ''} ;`
      let getSQL = `Select p.*, b.brand, c.category from products p JOIN brand b on p.idbrand = b.idbrand JOIN category c on p.idcategory = c.idcategory WHERE p.status =${
        status ? `${db.escape(status)}` : `'Active'`
      } ${filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}` : ""}${
        _sort && _order ? `ORDER BY ${_sort} ${_order}` : ""
      } ;`;
      console.log("url", getSQL);
      let resultsProducts = await dbQuery(getSQL);
      let resultsImage = await dbQuery(`select * from ecommerce.images;`);
      let resultsStock = await dbQuery(`select * from ecommerce.stocks;`);
      resultsProducts.forEach((value, index) => {
        value.images = [];
        value.stock = [];
        resultsImage.forEach((val) => {
          if (value.idproduct == val.idproduct) {
            delete val.idproduct;
            value.images.push(val);
          }
        });
        resultsStock.forEach((val) => {
          if (value.idproduct == val.idproduct) {
            delete val.idproduct;
            value.stock.push(val);
          }
        });
      });
      res.status(200).send({
        message: "Get Success",
        success: true,
        dataProducts: resultsProducts,
        error: "",
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "failed",
        error: error,
      });
    }
  },
  addProduct: async (req, res) => {
    try {
      if (req.dataUser.role == "admin") {
        const uploadFile = uploader("/imgProducts", "IMGPRO").array(
          "images",
          5
        );
        uploadFile(req, res, async (error) => {
          try {
            //   cek data yang dikirim dari front end
            console.log(req.body);
            console.log("cek uploadfile :", req.files);
            let { idbrand, idcategory, name, description, price, stocks } =
              JSON.parse(req.body.data);
            console.table(req.body);
            let insertProducts = await dbQuery(
              `insert into products values (null, ${db.escape(
                idbrand
              )}, ${db.escape(idcategory)},${db.escape(name)},${db.escape(
                description
              )},${db.escape(price)},'active');`
            );
            if (insertProducts.insertId) {
              let inImages = [];
              let inStock = [];
              req.files.forEach(async (val) => {
                //   inImages.push(`(null,${insertProducts.insertId},'http://localhost:2400/imgProducts')`);
                await dbQuery(
                  `insert into images values (null,${insertProducts.insertId},'http://localhost:2400/imgProducts/${val.filename}');`
                );
              });
              // await dbQuery(`insert into images values ${inImages.map(val=>`(null,${insertProducts.insertId},${db.escape(val)})`).tostring()};`)
              stocks.forEach((val) => {
                inStock.push(
                  `(null,${insertProducts.insertId},'${val.tipe}',${val.qty})`
                );
              });
              console.log(
                "url",
                `insert into stocks values ${inStock.join()};`
              );
              await dbQuery(`insert into stocks values ${inStock.join()};`);
            }
            res.status(200).send(insertProducts);
          } catch (error) {
            console.log(error);
            req.files.forEach((val) =>
              fs.unlinkSync(`./public/imgProducts/${val.filename}`)
            );
            res.status(500).send({
              success: false,
              message: "failed",
            });
          }
        });
      } else {
        res.status(401).send({
          success: false,
          message: "you cant access the api",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "failed",
        error: error,
      });
    }
  },
  getBrand: async (req, res) => {
    try {
      let brand = await dbQuery(`select * from ecommerce.brand;`);
      res.status(200).send({
        message: "Get brand success",
        success: true,
        error: "",
        brandList: brand,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "failed",
        error: error,
      });
    }
  },
  getCategory: async (req, res) => {
    try {
      let category = await dbQuery(`select * from ecommerce.category;`);
      res.status(200).send({
        message: "Get category success",
        success: true,
        error: "",
        categoryList: category,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "failed",
        error: error,
      });
    }
  },
  softDelete: async (req, res) => {
    try {
      if (req.dataUser.role == "admin") {
        let softDelete = await dbQuery(
          `UPDATE ecommerce.products SET status = "deactive" WHERE idproduct = ${req.params.id};`
        );
        // console.log(`UPDATE ecommerce.products SET status = "deactive" WHERE idproduct = ${req.params.id};`)
        res.status(200).send(softDelete);
      } else {
        res.status(401).send({
          success: false,
          message: "you cant access the api",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "failed",
        error: error,
      });
    }
  },
  editData: async (req, res) => {
    try {
      if (req.dataUser.role == "admin") {
        let edit = await dbQuery(
          `update ecommerce.products set name='${req.body.name}',idbrand=${req.body.idbrand},idcategory=${req.body.idcategory},description='${req.body.description}',price=${req.body.price} where idproduct = ${req.params.id}`
        );
        req.body.images.forEach(async (val) => {
          await dbQuery(
            `update ecommerce.images set url='${val.url}' where idimages=${val.idimages};`
          );
        });
        req.body.stocks.forEach(async (val) => {
          await dbQuery(
            `update ecommerce.stocks set tipe='${val.tipe}',qty=${val.qty} where idstocks=${val.idstocks}`
          );
        });
        res.status(200).send(edit);
      } else {
        res.status(401).send({
          success: false,
          message: "you cant access the api",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "failed",
        error: error,
      });
    }
  },
};

// cara 1
// getProducts: (req,res,next)=>{
//     db.query(`select p.*,b.name as brand_name,c.category from ecommerce.products as p join ecommerce.brand as b on p.idbrand = b.idbrand join ecommerce.category as c on p.idcategory=c.idcategory ${
//         req.query.id ? `where idproduct = ${req.query.id}` : ''
//     };`, (err,results)=> {
//         if(err){
//             console.log(err)
//         }
//         // get images dari product dari table images
//         let imageSQL = `select * from ecommerce.images;`;
//         db.query(imageSQL,(errImg,resultsImg)=>{
//             if(err){
//                 res.status(500).send({
//                     success : false,
//                     message:'failed',
//                     error : err
//                 });
//             }
//             results.forEach((val,idx)=>{
//                 val.images=[];
//                 resultsImg.forEach((val2,idx2)=>{
//                     if(val.idproduct==val2.idproduct){
//                         delete val2.idproduct;
//                         val.images.push(val2);
//                     }
//                 })
//             })
//             db.query('select * from ecommerce.stocks;',(errStck,resultStck)=>{
//                 if(err){
//                     res.status(500).send({
//                         success : false,
//                         message:'failed',
//                         error : errStck
//                     });
//                 }
//                 results.forEach((val,idx)=>{
//                     val.stock=[]
//                     resultStck.forEach((val2,idx2)=>{
//                         if(val.idproduct == val2.idproduct){
//                             delete val2.idproduct;
//                             val.stock.push(val2)
//                         }
//                     })
//                 })
//                 res.status(200).send({
//                     message: 'Get Success',
//                     success : true,
//                     dataProducts : results,
//                     error:""
//                 });
//             })
//         })
//         // cocokan idproduct dr table product dengan table images
//         // kemudian idproduct yang sesuai akan menjadi properti baru dr results products
//     })
// },
