// const bittrex = require('node-bittrex-api');

// bittrex.options({
//   'apikey' : '749a157ead0c4410b6914877bdb44c6f',
//   'apisecret' : '167d943d554f408e9dccedb6c3a95d2c',
// });

const binance = require('node-binance-api');
binance.options({
  APIKEY: 'iU9QiXtPWAeMr7Xjo9wDIMH32BuV2b9xh1CsLzkwXTrhpVV08iR2jt7kYTN2r1MN',
  APISECRET: '5Fb7pFw96aPW2lBNMV8JDJFpTtniXLde51wGcsAGEmUtSu3tf7li6pBGb8dFjrRJ',
  //useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  //test: true // If you want to use sandbox mode where orders are simulated
});

buycoin();
// function sellcoin(){
//   bittrex.tradesell({
//     MarketName: MarketName,
//     OrderType: 'LIMIT',
//     Quantity: Quantity,//1.00000000,
//     Rate: Rate,
//     TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
//     ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
//     Target: 0, // used in conjunction with ConditionType
//   }, function (data, err) {
//     console.log(data);
//   });
// };

// function buycoin() {
//   bittrex.getbalance({ currency : 'SRN' }, function( data, err ) {
//     console.log( data );
//   });
// }

function buycoin() {
// binance.balance((error, balances) => {
//   console.log("balances()", balances);
//   console.log("ETH balance: ", balances.ETH.available);
//   console.log("ETH balance: ", balances.ETH.onOrder);
// });
// binance.exchangeInfo(function(response) {
// 	console.log(response);
// });
let marketName  = "OSTBTC";
let amount      = 50;
let price       = 0.00002078;
binance.sell(marketName, amount, price, {
  type: 'LIMIT'
}, (error, response) => {
  if (error) {
    //reject(error);
  }
  //resolve(response);
  console.log("Limit Buy response", response);
  console.log(" Đã mua : order id: " + response.orderId);
});
}