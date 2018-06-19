// const bittrex = require('node-bittrex-api');

const binance = require('node-binance-api');
binance.options({
  
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
  binance.balance((error, balances) => {
    console.log("balances()", balances);
    for (let symbol of balances) {
      if (symbol.available != 0) {
        console.log("ETH balance: ", balances.ETH.available);
        console.log("ETH balance: ", balances.ETH.onOrder);
      }
    }
  });
  // binance.exchangeInfo(function (response) {
  //   console.log(response);
  // });
  // let marketName = "OSTBTC";
  // let amount = 50;
  // let price = 0.00002078;

  // let al = 2.059e-8;
  // let step = 1
  // let amountl = binance.roundStep(al, step.toFixed(8));
  // binance.sell(marketName, amount, price, {
  //   type: 'LIMIT'
  // }, (error, response) => {
  //   if (error) {
  //     //reject(error);
  //   }
  //   //resolve(response);
  //   console.log("Limit Buy response", response);
  //   console.log(" Đã mua : order id: " + response.orderId);
  // });
  // let countrun = 0;
  //   let minutes = 0.01, the_interval = minutes * 60 * 1000;
  //   setInterval(function () {
  //     binance.bookTickers('OSTBTC', (error, ticker) => {
  //       console.log("bookTickers", ticker);
  //     });
  //     countrun = countrun + 1;
  //     //console.log("==========Chạy được   " + countrun + "   lần=============")
  //   }, the_interval);

}
