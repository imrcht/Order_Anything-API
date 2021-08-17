const express = require('express');
const Address = require('ipaddr.js');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 7000;

const app = express();
app.use(express.urlencoded({extended:true}));
mongoose.connect(
'mongodb://localhost:27017/orderDB'
, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
});

const adressSchema={
  serial:Number,
  point:String
}

const CustSchema = {
   ID:Number,
   name:String,
   mobile:String,
   usertype:{type: String},
   Address: adressSchema
}

const orderSchema={
    orderID:String,
    custDetails:CustSchema,
    time:String,
    order:Array,
    Status:String,
    pickupPoint:String,
    deliveryGuy:CustSchema
}

const deliverySchema={
  ID: Number,
  name: String,
  mobile: String,
  deliveryOrderId: String,
  deliveryorder: orderSchema
}

const adminSchema={
  customerdetails: CustSchema,
  orderID: String,
  order:orderSchema,
  deliveryName: String,
  deliveryboy: deliverySchema
}

const Order=mongoose.model('Orders',orderSchema);
const Cust=mongoose.model('Custs',CustSchema);
const Admin=mongoose.model('Admin',adminSchema);
const Delivery=mongoose.model('Delivery',deliverySchema);
const Adress=mongoose.model('Adress',adressSchema);

app.post('/customer',function(req,res){
    const CustMobile = req.body.mobile;
    const CustName = req.body.name;
    const CustOrder =req.body.order;
    const address = req.body.address
    console.log(CustOrder);
    const newAddress = new Adress({
      serial: CustMobile, 
      point: address
    })

    const customer = new Cust({
      ID:Math.floor(Math.random() * 100000),
      name:CustName,
      mobile:CustMobile,
      Address: newAddress
    })
    var time= new Date().getTime();
    customer.save();
    const oID='OAD' + Math.floor(Math.random() * 100000);
    const order = new Order({
      orderID:oID,
      custDetails:customer,
      time:time,
      order:CustOrder,
      Status:'Order Created',
      pickupPoint:newAddress,
    })
    newAddress.save()
    order.save();
    const adm = new Admin({
      customerdetails: customer,
      order: order,
      orderID: oID
    })
    adm.save();
    console.log("Order saved");
    res.send(order);
});

app.route('/admin')

  .get(function (req, res) {
    Admin.find({},function(err,result) {
      if(!err){
      res.send(result);
      } else{
          res.send(err);
      }    
    })
  })

  .patch(async function (req, res) {
    const status = req.body.status;
    let newDelivery;

    await Delivery.find({deliveryOrderId: null}, function(err, result) {
      console.log("inside find");
      console.log(result);
      newDelivery = result[0]
    })
    Order.updateOne(
      {orderID:req.body.orderID},
      {$set:{ 
        Status:status,
        deliveryGuy: newDelivery
    }},
      function(err) {
        if(!err){
          res.send('Order Assigned to '+ newDelivery.name)
        } else {
          console.log(err);
        }
    });
    Order.find({orderID:req.body.orderID}, (err, result)=>{
      if (!err){
        Delivery.updateOne({name: newDelivery.name}, {$set: {deliveryOrderId:req.body.orderID,deliveryorder: result }}, (err)=>{
          if(!err){
            console.log("Updated delivery");
          } else {
            console.log("NOt updated");
          }
        })
      }
    });      
  });

app.route('/delivery')

  .get(function (req, res, next) {
    Delivery.find({},function(err,result){
      if(err){
        res.send(err)
      }else{
        res.send(result)
      }
    })
  })

  .patch(function(req,res){
    Order.updateOne({orderID:req.body.orderID},{$set:{ Status:req.body.status}},function(err){
      if(!err){
        res.send('Order Datails Updated')
      }
    })
  })

  .post(function (req, res, next) {
    const deliveryboy = new Delivery({
      ID:Math.floor(Math.random() * 100000),
      name:req.body.name,
      mobile:req.body.mobile,
    })
    deliveryboy.save();
    Admin.updateOne({},{$set: {
      deliveryboy: deliveryboy
    }})
    res.send('Registration SuccessFul')
  });







app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});