/**
 * Created by pratyush on 21/4/16.
 */
var express  =  require('express')
var path     =  require('path')

var app = express()
var PORT = process.env.PORT || 8085
//
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header('Access-Control-Expose-Headers','Content-Length');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

app.use(express.static(__dirname))

app.listen(PORT, function(){
    console.log('express app listening on ',PORT)
})
app.get('/list', function (req, res, next) {
    res.send(['128481', '128482','128483','128484','128485','128486','128487','128488','128489','128490'])
})