const {
  forEach
} = require('p-iteration');
const _ = require('lodash');
const moment = require('moment');

const binance = require('node-binance-api');

const ListCoinBinance = require('../models/ListCoinBinance');
const ListCoinBuySellBinance = require('../models/ListCoinBuySellBinance');
binance.options({
  APIKEY: 'iU9QiXtPWAeMr7Xjo9wDIMH32BuV2b9xh1CsLzkwXTrhpVV08iR2jt7kYTN2r1MN',
  APISECRET: '5Fb7pFw96aPW2lBNMV8JDJFpTtniXLde51wGcsAGEmUtSu3tf7li6pBGb8dFjrRJ',
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  test: true // If you want to use sandbox mode where orders are simulated
});

/**
 * Get List All Coin In Exchange
 */
const searchListAllSysBnb = () => {
  binance
    .exchangeInfo(function (response) {
      let symbolArr = response.symbols;
      for (let symbol of symbolArr) {
        let symbolNm = symbol.symbol;
        if (symbolNm.toString().indexOf('BTC') == -1) {
          continue;
        }
        ListCoinBinance
          .findOne({
            marketNm: symbolNm
          }, function (err, marketNm) {
            if (!err) {
              if (!marketNm) {
                let lstCoinBinance = new ListCoinBinance();
                lstCoinBinance.marketNm = symbolNm;
                lstCoinBinance.baseAsset = symbol.baseAsset;
                lstCoinBinance.stepSize = Number(symbol.filters[1].stepSize);
                lstCoinBinance.save(function (err) {
                  if (!err) {
                    console.log(`Coin mới vừa cập nhật : ${symbolNm}`);
                  } else {
                    console.log(`Có lỗi hệ thống trong quá trình kiểm tra list coin`);
                  }
                });
              }
            } else {
              console.log(`Có lỗi hệ thống, liên hệ Admin`);
            }
          });
      }
    });
}

/**
 * Check Runtime Symbol Active
 */
const checkSymboyActive = () => {
  ListCoinBinance.find({
    activeFlag: "Y"
  }, (err, data) => {
    if (err) {
      console.log(err);
    }
    for (let coinInfo of data) {
      checkPriceRuntime(coinInfo.marketNm, coinInfo.baseAsset, coinInfo.percentSell, coinInfo.stepSize, coinInfo.buy_pri, coinInfo.btcQty);
    }
  });
};
/**
 * Check Price Runtime
 * @param {*} marketNm
 * @param {*} buyFlag
 * @param {*} percentSell
 * @param {*} buy_pri
 * @param {*} btcQty
 */
const checkPriceRuntime = async (marketNm, baseAsset, percentSell, stepSize, buy_pri, btcQty) => {
  binance.bookTickers(marketNm, (error, ticker) => {
    let bidPrice = Number(ticker.bidPrice);
    let bidQty = Number(ticker.bidQty);
    let askPrice = Number(ticker.askPrice);
    let askQty = Number(ticker.askQty);
    //Check balance coin which checked active.
    console.log(`Checking ${marketNm} ...`);
    getBalanceBnB(baseAsset).then((result) => {
      //check buy
      if (Number(result.available) <= 0 && Number(result.onOrder) <= 0 && askPrice <= buy_pri) {
        //Function buy/ save history
        console.log(`Mua ${marketNm} tại giá ${askPrice} `);
        let quantityBuy = askPrice * btcQty;
        buyLimit(marketNm, quantityBuy, askPrice, stepSize).then((result) => {
          if (result.status == "FILLED" || result.status == "NEW") {
            //funcUpdatePriceBuy(marketNm, askPrice);
            funcSaveHistoryBuySell(marketNm, askPrice, percentSell, 'BUY', result.orderId, result.status, result.executedQty, result.price);
          }
        }).catch((err) => {
          console.log(err);
        });
      }
      //Check sell
      const sellPriceAsPer = (Number(buy_pri) + ((Number(buy_pri) * Number(percentSell)) / 100)).toFixed(8);
      if (Number(result.available) > 0 && Number(result.onOrder) > 0 && bidPrice >= sellPriceAsPer) {
        //Function buy/ save history
        console.log(`Bán ${marketNm} tại giá ${askPrice} `);
        sellLimit(marketNm, result.available, bidPrice).then((result) => {
          if (result.status == "FILLED" || result.status == "NEW") {
            funcUpdatePriceBuy(marketNm, bidPrice);
            funcSaveHistoryBuySell(marketNm, askPrice, percentSell, 'SELL', result.orderId, result.status, result.executedQty, result.price);
          }
        }).catch((err) => {
          console.log(err);
        })
      }
    }).catch((err) => {
      console.log(err);
    });
  });
}
/**
 * Get Balance BNB
 * @param {*} marketNm
 */
const getBalanceBnB = (marketNm) => {
  return new Promise((resolve, reject) => {
    binance.balance((error, balances) => {
      if (error) {
        console.log(`>>>> Error Get Balance: ${error.message}`);
        reject(error);
      }
      resolve(balances[marketNm]);
    });
  });
}
/**
 * Update Flag And Price Buy
 * @param {*} marketNm
 * @param {*} flag
 * @param {*} CurrentPrice
 */
const funcUpdatePriceBuy = (marketNm, CurrentPrice) => {
  let promises = [];
  promises.push(ListCoinBinance.update({
    marketNm: marketNm
  }, {
    $set: {
      buy_pri: CurrentPrice
    }
  }));
  Promise
    .all(promises)
    .then(() => {
      console.log(`Buy thành công ${marketNm} và chuyển về trạng thái đợi bán`);
    })
    .catch((err) => {
      console.log(`Mua méo được : ${err.message}`)
    });
}

/**
 * Save History Buy Sell
 * @param {*} marketName
 * @param {*} buy_pri
 * @param {*} percentSell
 * @param {*} typeP
 * @param {*} oder
 * @param {*} qty
 * @param {*} rate
 */
const funcSaveHistoryBuySell = (marketName, buy_pri, percentSell, typeP, orderId, status, qty, rate) => {
  return new Promise((resolve, reject) => {
    const enterTime = moment(new Date(), constants.DATE_FORMAT)
      .tz("Asia/Ho_Chi_Minh")
      .toDate();
    let listCoinBuySellBinance = new ListCoinBuySellBinance();
    listCoinBuySellBinance.marketNm = marketName;
    listCoinBuySellBinance.buy_pri = buy_pri;
    listCoinBuySellBinance.percentSell = percentSell;
    listCoinBuySellBinance.type = typeP;
    listCoinBuySellBinance.orderId = orderId;
    listCoinBuySellBinance.status = status;
    listCoinBuySellBinance.qty = qty;
    listCoinBuySellBinance.rate = rate;
    listCoinBuySellBinance.save(function (err) {
      if (!err) {
        resolve(`Save Done`);
        console.log(`Đã ${typeP}: ${marketName} với giá ${buy_pri} tại thời điểm ${enterTime}`)
      } else {
        reject(`Save Fail`);
      }
    });
  });
}
/**
 * Function Buy Limit
 * @param {*} marketName
 * @param {*} quantity
 * @param {*} price
 */
const buyLimit = (marketName, quantity, price, stepSize) => {
  let amount = binance.roundStep(quantity, stepSize);
  return new Promise((resolve, reject) => {
    binance.buy(marketName, amount, price, {
      type: 'LIMIT'
    }, (error, response) => {
      if (error) {
        reject(error);
      }
      resolve(response);
      console.log("Limit Buy response", response);
      console.log(" Đã mua : order id: " + response.orderId);
    });
  });
}

const sellLimit = (marketName, quantity, price) => {
  return new Promise((resolve, reject) => {
    binance.sell(marketName, amount, price, {
      type: 'LIMIT'
    }, (error, response) => {
      if (error) {
        reject(error);
      }
      resolve(response);
      console.log("Limit Buy response", response);
      console.log(" Đã mua : order id: " + response.orderId);
    });
  });
}

const checkListTopCoinBinance = {
  searchListAllSysBnb: searchListAllSysBnb,
  checkSymboyActive: checkSymboyActive
};
module.exports = checkListTopCoinBinance;
