const { db,dbQuery } = require("../config/database");

module.exports = {
    addToCart: async(req,res)=>{
        try{
            cart = await dbQuery(`select c.*,s.qty as stock_qty from carts c join stocks  s on c.idstocks = s.idstocks  where c.idproduct = ${req.body.idproduct} and c.idstocks = ${req.body.idstocks} and c.idusers = ${req.dataUser.idusers} ;`)
                if(cart.length>0){
                    console.log('tersedia',cart[0])
                    if(cart[0].qty+req.body.qty <= cart[0].stock_qty){
                        await dbQuery(`update carts set qty = ${cart[0].qty+req.body.qty} where idcarts = ${cart[0].idcarts};`)
                        res.status(200).send({
                            success:true,
                            message: "add qty success",
                            error:''
                        })
                    }else{
                        res.status(200).send({
                            success : false,
                            message : "stock tidak tersedia"
                        })
                    }
                }else{
                    let addSQL = await dbQuery(`insert into carts value (null,${req.dataUser.idusers},${req.body.idproduct},${req.body.idstocks},${req.body.qty});`);
                    res.status(200).send({
                        success:true,
                        message: "add to cart success",
                        error:''
                    })
                }          
        }
        catch(error){
            console.log(error);
            res.status(500).send({
                success:false,
                message:"failed",
                error
            })
        }
    },
    getCart: async(req,res)=>{
        try{
            let getSQL = await dbQuery(`select c.*,p.name,b.brand,s.tipe,s.qty as stock_qty,p.price,p.price*c.qty as total_price, i.url 
            from carts c join products p on c.idproduct = p.idproduct 
            join brand b on p.idbrand = b.idbrand 
            join stocks s on c.idstocks=s.idstocks 
            join images i on p.idproduct = i.idproduct where c.idusers=${req.dataUser.idusers} group by c.idcarts;`);
            res.status(200).send({
                success : true,
                message:'get cart success',
                list_data : getSQL,
                error:""
            })

        }
        catch(error){
            console.log(error);
            res.status(500).send({
                success:false,
                message:"failed",
                error
            })
        }
    },
    deleteCart : async (req,res)=>{
        try{
            await dbQuery(`delete from carts where idcarts=${req.params.id};`)
            res.status(200).send({
                success:true,
                message:'delete success',
                error : ''
            })
        }
        catch(error){
            console.log(error);
            res.status(500).send({
                success:false,
                message:"failed",
                error
            })
        }
    },
    updateQty : async (req,res)=>{
        try{
            console.log('req.body',req.body.qty)
            await dbQuery(`UPDATE carts SET qty = ${req.body.qty} WHERE idcarts = ${req.params.id};`)
            res.status(200).send({
                success:true,
                message:'update success',
                error : ''
            })
        }
        catch(error){
            console.log(error);
            res.status(500).send({
                success:false,
                message:"failed",
                error
            })
        }
    },
    checkout:async(req,res)=>{
        try{
            console.log('data terima', req.dataUser);
            console.log('data terima', req.body);
            // 1. user mengirimkan data melalui req.body = invoice,date,total_price,ongkir,tax,note, detail transactions : [ isi dari data cart ]
            let {invoice,date,tax,total_price,ongkir,note,detail} = req.body
            // 2. menjalankan sql INSERT untuk menambahkan data ke tabel transactions
            let insertTransactions = await dbQuery(`INSERT into transactions values (null,${req.dataUser.idusers},'${invoice}',now(),${total_price},${ongkir},${tax},'${note}','Unpaid');`)
            console.log('query',insertTransactions);
            console.log('id',insertTransactions.insertId)
            // 3. jika berhasil, menambahkan data dari detail kedalam table detail_transaction menggunakan sql insert (multiple insert)
            if(insertTransactions.insertId){
                detail.forEach(async (val)=>{
                    await dbQuery(`INSERT into detail_transactions values (null,${insertTransactions.insertId},${val.idproduct},${val.idstocks},${val.qty},${val.total_price});`)
                })
                await dbQuery(`delete from carts where idusers = ${req.dataUser.idusers};`);
                res.status(200).send({
                    success : true,
                    message  :'add success'
                })
            }
        }
        catch (error){
            console.log(error);
            res.status(500).send({
                success : false,
                message : "failed",
                error
            })
        }
    },
    getTransactions: async (req,res)=>{
        try{
            let getTransactions = await dbQuery(`SELECT * from transactions where idusers = ${req.dataUser.idusers};`)
            let getDetail = await dbQuery(`select t.*, p.*, s.tipe, i.url from  detail_transactions t join products p on t.idproduct = p.idproduct join stocks s on t.idstocks = s.idstocks join images i on t.idproduct = i.idproduct group by iddetail_transactions ;`)
            // console.log('data detail', getDetail);
            getTransactions.forEach((val)=>{
                val.detail=[];
                getDetail.forEach((value)=>{
                    if(val.idtransactions == value.idtransactions){
                        val.detail.push(value);
                    }
                })
            })
            res.status(200).send({
                success : true,
                message : 'get success',
                history : getTransactions,
            })

        }
        catch (error){
            console.log(error);
            res.status(500).send({
                success : false,
                message : "get failed",
                error
            })
        }
    } 
}